#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createState, amount, eligibility, publicVersion, draftChanged, publish, unpublish, copyPublished, confirmExampleOrder } from '../docs/product/prototypes/diy-publication-v4/model.mjs';
const folder = resolve(dirname(fileURLToPath(import.meta.url)), '../docs/product/prototypes/diy-publication-v4');
const html = readFileSync(resolve(folder, 'index.html'), 'utf8');
const css = readFileSync(resolve(folder, 'prototype.css'), 'utf8');
const script = readFileSync(resolve(folder, 'prototype.mjs'), 'utf8');
const model = readFileSync(resolve(folder, 'model.mjs'), 'utf8');
const cases = [];
const check = (name, run) => { run(); cases.push(name); };
check('无订单、未付、模拟付、待确认及未知资格不能发布', () => {
  for (const scenario of ['draft', 'unpaid', 'simulated', 'review', 'error']) {
    const state = createState(scenario); assert.equal(eligibility(state).allowed, false, scenario); assert.equal(publish(state), false, scenario); assert.equal(publicVersion(state), null, scenario);
  }
});
check('跨用户确认订单不产生本人资格', () => {
  const state = createState('ready'); state.order.owner = 2; assert.equal(publish(state), false);
});
check('已确认且款式相同生成独立定稿', () => {
  const state = createState('ready'); assert.equal(publish(state), true); assert.notEqual(state.publication.design, state.draft); assert.equal(state.publication.price, amount(state.draft));
});
check('编辑个人稿保留公开款式和原价格', () => {
  const state = createState('published'); const before = JSON.stringify(state.publication); state.draft.beads[0] = 'jade'; assert.equal(draftChanged(state), true); assert.equal(eligibility(state).allowed, false); assert.equal(JSON.stringify(publicVersion(state)), before);
});
check('新款重新付款确认后才新增定稿版本', () => {
  const state = createState('edited'); const old = state.publication; assert.equal(publish(state), false); confirmExampleOrder(state); assert.equal(publish(state), true); assert.equal(state.publication.id, old.id + 1); assert.notEqual(state.publication.price, old.price); assert.equal(old.design.beads[0], 'gold');
});
check('退款、售后或取消暂停公开，不删除历史定稿', () => {
  for (const status of ['cancelled', 'after_sale', 'refunding', 'refunded']) { const state = createState('published'); state.order.status = status; assert.equal(publicVersion(state), null); assert.equal(publish(state), false); assert.ok(state.publication); }
});
check('新草稿订单取消不误伤旧定稿的有效确认订单', () => {
  const state = createState('edited'); const old = state.publication; confirmExampleOrder(state); state.order.status = 'cancelled'; assert.equal(publicVersion(state), old); assert.equal(publish(state), false);
});
check('复制不继承发布资格，同款继续保留来源', () => {
  const state = createState('published'); state.publication.beneficiary = 7; assert.equal(copyPublished(state), true); assert.equal(state.order, null); assert.equal(state.publication, null); assert.equal(publish(state), false); confirmExampleOrder(state); publish(state); assert.equal(state.publication.beneficiary, 7);
});
check('复制后改款经本人新订单确认形成新来源', () => {
  const state = createState('published'); state.publication.beneficiary = 7; copyPublished(state); state.draft.beads[0] = 'jade'; confirmExampleOrder(state); publish(state); assert.equal(state.publication.beneficiary, state.owner);
});
check('下架只隐藏定稿，保留个人稿和已确认订单', () => {
  const state = createState('published'); const draft = state.draft, order = state.order; unpublish(state); assert.equal(publicVersion(state), null); assert.equal(state.draft, draft); assert.equal(state.order, order); assert.ok(state.publication);
});
check('本地资源存在，静态 ID 唯一，脚本锚点已声明', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]); assert.equal(new Set(ids).size, ids.length);
  const dynamicIds = [...script.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  for (const [, id] of script.matchAll(/\$\('([^']+)'\)/g)) assert.ok([...ids, ...dynamicIds].includes(id), id);
  for (const [, path] of html.matchAll(/(?:src|href)="([^"]+)"/g)) assert.ok(existsSync(resolve(folder, path)), path);
  for (const [, path] of css.matchAll(/url\("([^"]+)"\)/g)) assert.ok(existsSync(resolve(folder, path)), path);
});
check('原型不请求业务网络，不读写用户状态，不引入远程资源', () => {
  assert.doesNotMatch(script + model, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|geolocation)\b/);
  assert.doesNotMatch(html + css, /https?:\/\/|<form\b/);
});
check('成长仅四入口，旧规则路径聚合至权益并展开', () => {
  assert.match(script, /\[\['profile', '成长档案'\], \['tasks', '成长任务'\], \['records', '成长明细'\], \['benefits', '等级权益'\]\]/);
  assert.match(script, /get\('tab'\) === 'rules'/); assert.match(script, /function showRules\(\).*?growthTab = 'benefits'; rulesOpen = true/s);
  assert.match(script, /加载更多历史版本/); assert.match(script, /retry-history/);
});
check('首页保持四套底纹、32px 图标、18px 标题和无外框分组', () => {
  assert.equal(new Set([...css.matchAll(/patterns\/([\w-]+\.svg)/g)].map(match => match[1])).size, 4);
  assert.match(css, /\.home-core\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.home-core svg\{width:32px;height:32px/); assert.match(css, /\.home-core span\{font-size:18px/);
  assert.match(css, /\.faith-grid,\.wish-grid\{[^}]*background:none;border:0;border-radius:0/);
});
check('紧凑珠环装饰与只读公开操作分离', () => {
  assert.match(css, /\.ornament\{width:112px;height:112px/); assert.match(css, /\.diy-hero\{[^}]*min-height:138px/);
  const detail = script.slice(script.indexOf('function detail()'), script.indexOf('function editor()'));
  assert.match(detail, /复制并编辑/); assert.doesNotMatch(detail, /data-action="(?:manage|unpublish|save)"|data-page="editor"/);
});
console.log(JSON.stringify({ status: 'passed', count: cases.length, cases, boundary: 'Prototype model and static checks only; not product API, browser, native, payment or ECS acceptance.' }, null, 2));
