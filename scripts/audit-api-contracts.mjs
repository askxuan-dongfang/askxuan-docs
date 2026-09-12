#!/usr/bin/env node
// Static contract audit: named routes plus the repository's data-driven registrars.
// Unknown dynamic registration fails closed; this is not an endpoint execution test.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = resolve(process.argv[2] ?? join(root, '..', 'askXuan-backend'));
const docs = readFileSync(join(root, 'API-REFERENCE.md'), 'utf8');
function walk(dir) {
  return readdirSync(dir, {withFileTypes:true}).flatMap(e => e.name.startsWith('.') || ['node_modules','vendor'].includes(e.name) ? [] : e.isDirectory() ? walk(join(dir,e.name)) : [join(dir,e.name)]);
}
if (!existsSync(join(backend,'services'))) throw Error('Pass the backend repository path as the first argument');
const files = walk(join(backend,'services')).filter(f => f.includes('/internal/handler/') && f.endsWith('.go') && !f.endsWith('_test.go'));
const routes = new Map(), dynamic = [], errors = [];
// Check the active entry points for the source shape this repository uses.
for (const dir of new Set(files.map(f=>f.split('/internal/handler/')[0]))) {
  const entries=readdirSync(dir).filter(n=>n.endsWith('.go') && !n.endsWith('_test.go')).map(n=>readFileSync(join(dir,n),'utf8')).join('\n');
  if (!/handler\.RegisterHandlers\(/.test(entries)) errors.push(`${relative(backend,dir)}: missing main handler registration`);
}
const literal = /Method:\s*(?:http\.Method(Get|Post|Put|Delete|Patch)|"(GET|POST|PUT|DELETE|PATCH)")\s*,\s*Path:\s*"([^"]+)"/g;
const tuples = s => [...s.matchAll(/\{\s*"(GET|POST|PUT|DELETE|PATCH)"\s*,\s*"([^"]*)"\s*,\s*"[^"]+"/g)].map(m=>[m[1],m[2]]);
const add = (method,path,file) => routes.set(`${method.toUpperCase()} ${path}`,relative(backend,file));
for (const file of files) {
  const source = readFileSync(file,'utf8');
  if (!/server\.AddRoutes?\(/.test(source)) continue;
  const owner=file.split('/internal/handler/')[0];
  const handlers=files.filter(f=>f.startsWith(owner+'/')).map(f=>readFileSync(f,'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'')).join('\n');
  for (const match of source.matchAll(/func (register[A-Z]\w*)\(/g)) {
    const occurrences=[...handlers.matchAll(new RegExp('\\b'+match[1]+'\\s*\\(', 'g'))];
    if (occurrences.length<2) errors.push(`${relative(backend,file)}: ${match[1]} has no caller`);
  }
  const blocks = source.includes('rest.WithPrefix(') ? [...source.matchAll(/server\.AddRoutes\(([\s\S]*?)\n\t\)/g)].map(m=>m[1]) : [source];
  for (const block of blocks) {
    const prefix=block.match(/rest\.WithPrefix\("([^"]+)"\)/)?.[1]??'';
    for (const m of block.matchAll(literal)) add(m[1]??m[2],prefix && m[3]==='/' ? prefix : prefix+m[3],file);
  }
  if (!/Method:\s*op\./.test(source)) continue;
  const rel=relative(backend,file); dynamic.push(rel);
  if (rel.endsWith('marketing-service/internal/handler/rewards.go')) {
    if (![...source.matchAll(literal)].length) errors.push(`${rel}: no named reward routes`);
  } else if (rel.endsWith('payment-service/internal/handler/points.go')) {
    // Split the shared table and both explicit append branches; never assign admin operations to customers.
    const match=source.match(/operations := ([\s\S]*?)\n\t\tif isAdmin \{([\s\S]*?)\} else \{([\s\S]*?)\n\t\t\}/);
    if (!match) { errors.push(`${rel}: unsupported points registration shape`); continue; }
    const prefixes=source.match(/prefix := \"([^\"]+)\"\s+if isAdmin \{\s+prefix = \"([^\"]+)\"/);
    if (!prefixes || !/range \[\]bool\{false, true\}/.test(source)) { errors.push(`${rel}: unsupported points prefix/iteration shape`); continue; }
    for (const [prefix,branch] of [[prefixes[1],match[3]],[prefixes[2],match[2]]]) {
      for (const [method,path] of [...tuples(match[1]),...tuples(branch)]) add(method,prefix+path,file);
    }
  } else if (/Path:\s*"[^"]+"\s*\+\s*op.path/.test(source)) {
    const prefix=source.match(/Path:\s*"([^"]+)"\s*\+\s*op.path/)[1];
    const table=tuples(source.slice(0,source.indexOf('server.AddRoute(')));
    if (!table.length) errors.push(`${rel}: no operation tuples`);
    for (const [method,path] of table) add(method,prefix+path,file);
  } else if (/Path:\s*op.path/.test(source)) {
    const table=tuples(source.slice(0,source.indexOf('server.AddRoute(')));
    if (!table.length || table.some(([,p])=>!p.startsWith('/api/'))) errors.push(`${rel}: unsupported operation paths`);
    for (const [method,path] of table) add(method,path,file);
  } else errors.push(`${rel}: unrecognized dynamic registration`);
}
const documented=new Set([...docs.matchAll(/^\|\s*(GET|POST|PUT|DELETE|PATCH)\s*\|\s*`([^`]+)`\s*\|/gim)].map(m=>`${m[1].toUpperCase()} ${m[2]}`));
const missing=[...routes.keys()].filter(k=>!documented.has(k)).sort();
const stale=[...documented].filter(k=>!routes.has(k)).sort();
const counts={};for (const file of routes.values()) {const name=file.split('/')[2];counts[name]=(counts[name]??0)+1;}
console.log(JSON.stringify({runtimeContracts:routes.size,documentedContracts:documented.size,counts,dynamicRegistrars:dynamic,missing,stale,errors},null,2));
process.exitCode=missing.length || stale.length || errors.length ? 1 : 0;
