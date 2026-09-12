#!/usr/bin/env node
// Run with: node --test scripts/audit-api-contracts.test.mjs
// Each case runs the real CLI against an isolated, disposable source tree.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const audit = readFileSync(new URL('./audit-api-contracts.mjs', import.meta.url), 'utf8');
const payment = 'services/commerce/payment-service';
const message = 'services/infrastructure/message-service';
const pointsFile = `${payment}/internal/handler/points.go`;
const routesFile = `${payment}/internal/handler/routes.go`;
const adminContracts = [
  'GET /api/v1/admin/points/products',
  'GET /api/v1/admin/points/orders',
  'POST /api/v1/admin/points/orders/:id/cancel',
  'POST /api/v1/admin/points/products',
  'PUT /api/v1/admin/points/products/:id',
  'POST /api/v1/admin/points/orders/:id/ship',
  'GET /api/v1/admin/points/report',
];
const contracts = [
  ...adminContracts,
  'GET /api/v1/points/products',
  'GET /api/v1/points/orders',
  'POST /api/v1/points/orders/:id/cancel',
  'GET /api/v1/points',
  'GET /api/v1/points/ledger',
  'POST /api/v1/points/orders',
  'POST /api/v1/points/orders/:id/complete',
  'GET /api/v1/admin/messages/master',
  'GET /api/v1/admin/messages/master/list',
];
const points = `package handler
func registerPoints(server *rest.Server, svcCtx *svc.ServiceContext) {
	for _, isAdmin := range []bool{false, true} {
		prefix := "/api/v1/points"
		if isAdmin {
			prefix = "/api/v1/admin/points"
		}
		operations := []struct{ method, path, action string }{
			{"GET", "/products", "products"}, {"GET", "/orders", "orders"},
			{"POST", "/orders/:id/cancel", "cancel"},
		}
		if isAdmin {
			operations = append(operations, struct{ method, path, action string }{"POST", "/products", "save"}, struct{ method, path, action string }{"PUT", "/products/:id", "save"}, struct{ method, path, action string }{"POST", "/orders/:id/ship", "ship"}, struct{ method, path, action string }{"GET", "/report", "report"})
		} else {
			operations = append(operations, struct{ method, path, action string }{"GET", "", "account"}, struct{ method, path, action string }{"GET", "/ledger", "ledger"}, struct{ method, path, action string }{"POST", "/orders", "redeem"}, struct{ method, path, action string }{"POST", "/orders/:id/complete", "complete"})
		}
		for _, op := range operations {
			server.AddRoute(rest.Route{Method: op.method, Path: prefix + op.path, Handler: handler})
		}
	}
}`;

function runAudit(changes = {}) {
  const root = mkdtempSync(join(tmpdir(), 'askxuan-contract-audit-'));
  const files = {
    'docs/scripts/audit-api-contracts.mjs': audit,
    'docs/API-REFERENCE.md': contracts.map(contract => {
      const [method, path] = contract.split(' ');
      return `| ${method} | \`${path}\` | fixture |`;
    }).join('\n'),
    [`backend/${payment}/payment.go`]: 'package main\nfunc main() { handler.RegisterHandlers(server, svcCtx) }',
    [`backend/${routesFile}`]: `package handler
func RegisterHandlers(server *rest.Server, svcCtx *svc.ServiceContext) {
	registerPoints(server, svcCtx)
}`,
    [`backend/${pointsFile}`]: points,
    [`backend/${message}/message.go`]: 'package main\nfunc main() { handler.RegisterHandlers(server, svcCtx) }',
    [`backend/${message}/internal/handler/routes.go`]: `package handler
func RegisterHandlers(server *rest.Server, svcCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{Method: http.MethodGet, Path: "/", Handler: rootHandler},
			{Method: http.MethodGet, Path: "/list", Handler: listHandler},
		},
		rest.WithPrefix("/api/v1/admin/messages/master"),
	)
}`,
    ...changes,
  };
  try {
    for (const [name, contents] of Object.entries(files)) {
      const destination = join(root, name);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, contents);
    }
    const result = spawnSync(process.execPath, [join(root, 'docs/scripts/audit-api-contracts.mjs'), join(root, 'backend')], {
      encoding: 'utf8', timeout: 10_000,
    });
    assert.ifError(result.error);
    assert.equal(result.stderr, '', result.stderr);
    return { status: result.status, ...JSON.parse(result.stdout) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('points branches remain separate and WithPrefix root has no trailing slash', () => {
  const result = runAudit();
  assert.equal(result.status, 0);
  assert.equal(result.runtimeContracts, 16);
  assert.equal(result.documentedContracts, 16);
  assert.deepEqual(result.counts, { 'payment-service': 14, 'message-service': 2 });
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.stale, []);
  assert.deepEqual(result.errors, []);
});

test('a registrar mentioned only in comments is not considered called', () => {
  const result = runAudit({ [`backend/${routesFile}`]: `package handler
func RegisterHandlers(server *rest.Server, svcCtx *svc.ServiceContext) {
	// registerPoints(server, svcCtx)
	/* registerPoints(server, svcCtx) */
}` });
  assert.equal(result.status, 1);
  assert.ok(result.errors.includes(`${pointsFile}: registerPoints has no caller`));
});

test('changing the actual admin points prefix reports all seven moved contracts', () => {
  const result = runAudit({ [`backend/${pointsFile}`]: points.replace('prefix = "/api/v1/admin/points"', 'prefix = "/api/v1/admin/renamed-points"') });
  assert.equal(result.status, 1);
  assert.deepEqual(result.stale, [...adminContracts].sort());
  assert.deepEqual(result.missing, adminContracts.map(route => route.replace('/admin/points', '/admin/renamed-points')).sort());
  assert.deepEqual(result.errors, []);
});

test('a missing service entry point fails the audit', () => {
  const result = runAudit({ [`backend/${payment}/payment.go`]: 'package main\nfunc main() {}' });
  assert.equal(result.status, 1);
  assert.ok(result.errors.includes(`${payment}: missing main handler registration`));
});

test('dropping one points role fails instead of inventing its routes', () => {
  const result = runAudit({ [`backend/${pointsFile}`]: points.replace('[]bool{false, true}', '[]bool{false}') });
  assert.equal(result.status, 1);
  assert.ok(result.errors.includes(`${pointsFile}: unsupported points prefix/iteration shape`));
});
