#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convexHull, distanceOutsideHull, dragFeedback, finishGesture, reorder } from '../docs/product/prototypes/diy-direct-drag-v3/model.mjs';
import { matchDirectoryExamples } from '../docs/product/prototypes/diy-direct-drag-v3/directory.mjs';
import { searchSiteExamples } from '../docs/product/prototypes/diy-direct-drag-v3/site-search.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const folder = resolve(root, 'docs/product/prototypes/diy-direct-drag-v3');
const html = readFileSync(resolve(folder, 'index.html'), 'utf8');
const script = readFileSync(resolve(folder, 'prototype.mjs'), 'utf8');
const directoryScript = readFileSync(resolve(folder, 'directory.mjs'), 'utf8');
const searchScript = readFileSync(resolve(folder, 'site-search.mjs'), 'utf8');
const css = readFileSync(resolve(folder, 'prototype.css'), 'utf8');
const cases = [];
function check(name, run) { run(); cases.push(name); }
const square = convexHull([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]);
const points = (x, y) => ({ x, y });
const a = { id: 'a' }, b = { id: 'b' }, c = { id: 'c' }, items = [a, b, c];

check('起拖阈值 5.9 / 6', () => {
  assert.equal(dragFeedback(points(50, 50), points(55.9, 50), points(50, 50), square).dragging, false);
  assert.equal(dragFeedback(points(50, 50), points(56, 50), points(50, 50), square).dragging, true);
});
check('删除边界严格大于 24', () => {
  assert.equal(dragFeedback(points(50, 50), points(124, 50), points(50, 50), square).pendingDelete, false);
  assert.equal(dragFeedback(points(50, 50), points(124.1, 50), points(50, 50), square).pendingDelete, true);
});
check('拖拽锚点保留按下偏移', () => {
  assert.deepEqual(dragFeedback(points(58, 50), points(80, 70), points(50, 50), square).position, points(72, 70));
});
check('手串内孔安全', () => {
  const ring = Array.from({ length: 36 }, (_, index) => points(100 + 60 * Math.cos(index * Math.PI / 18), 100 + 60 * Math.sin(index * Math.PI / 18)));
  assert.equal(distanceOutsideHull(points(100, 100), convexHull(ring)), 0);
});
check('长配件外沿加入安全范围', () => {
  const pendant = convexHull([...square, points(40, 200), points(60, 200)]);
  assert.equal(distanceOutsideHull(points(50, 205), pendant), 5);
  assert.equal(dragFeedback(points(50, 100), points(50, 205), points(50, 100), pendant).pendingDelete, false);
});
check('边界无效时不授权删除', () => {
  assert.equal(distanceOutsideHull(points(999, 999), []), 0);
  assert.equal(distanceOutsideHull(points(999, 999), [points(0, 0)]), 0);
});
check('换位保留数量与标识', () => {
  const changed = reorder(items, 0, 2);
  assert.deepEqual(changed, [b, c, a]); assert.equal(changed[2], a); assert.deepEqual(items, [a, b, c]);
});
check('只有正常松手可以提交删除', () => {
  const feedback = { dragging: true, pendingDelete: true };
  for (const event of ['pointercancel', 'escape', 'blur', 'multitouch', 'lostpointercapture']) assert.deepEqual(finishGesture(items, 1, 2, feedback, event), items);
  assert.deepEqual(finishGesture(items, 1, 2, feedback, 'pointerup'), [a, c]);
});
check('拖出再拖回取消待删', () => {
  const outside = dragFeedback(points(50, 50), points(150, 50), points(50, 50), square);
  const returned = dragFeedback(points(50, 50), points(90, 50), points(50, 50), square);
  assert.equal(outside.pendingDelete, true); assert.equal(returned.pendingDelete, false);
  assert.deepEqual(finishGesture(items, 0, 1, returned, 'pointerup'), [b, a, c]);
});
check('最后一颗可删除，点选不提交', () => {
  assert.deepEqual(finishGesture([a], 0, 0, { dragging: true, pendingDelete: true }, 'pointerup'), []);
  assert.deepEqual(finishGesture(items, 0, 2, { dragging: false, pendingDelete: false }, 'pointerup'), items);
});
check('HTML 标识唯一且脚本静态引用存在', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, id] of (script + directoryScript + searchScript).matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(id), `missing id: ${id}`);
});
check('本地资源与关联页面存在', () => {
  for (const [, target] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(!/^(https?:)?\/\//.test(target), `external resource: ${target}`);
    assert.ok(existsSync(resolve(folder, target)), `missing resource: ${target}`);
  }
  for (const [, target] of css.matchAll(/url\("([^"]+)"\)/g)) assert.ok(existsSync(resolve(folder, target)), `missing pattern: ${target}`);
});
check('原型不调用业务网络或用户存储', () => {
  assert.doesNotMatch(script + directoryScript + searchScript, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|geolocation)\b/);
  assert.doesNotMatch(html, /<form\b|https?:\/\//);
});
check('大画布与直接手势实现已连接', () => {
  assert.match(css, /height:clamp\(300px,42svh,390px\)/);
  for (const event of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) assert.ok(script.includes(`addEventListener('${event}'`), event);
  assert.doesNotMatch(html, /编辑珠子|studio-bead-menu/);
});
check('公开详情与我的设计的导航边界', () => {
  const detail = html.match(/<section id="detail-screen"[\s\S]*?<\/section>\s*<\/div>[\s\S]*?<\/section>/)?.[0] || html.slice(html.indexOf('<section id="detail-screen"'), html.indexOf('<section id="mine-screen"'));
  assert.ok(detail.includes('复制并编辑'));
  assert.doesNotMatch(detail, /继续编辑|再次编辑|确认发布|确认下架/);
  assert.match(script, /const open = button\('', \(\) => loadDesign\(work\), 'mine-open'\)/);
  assert.match(script, /work\.items = beads\.map\(item => item\.material\); work\.published = false/);
});
check('目录同行入口与互斥浮层静态结构', () => {
  assert.match(html, /directory-filter-bar[\s\S]*?directory-types[\s\S]*?directory-region/);
  assert.doesNotMatch(html, /class="directory-regions"/);
  assert.match(css, /\.directory-region\{flex:none/);
  assert.match(css, /\.directory-popover\{position:absolute;[\s\S]*?animation:none;transition:none/);
  assert.match(css, /\.directory-services h2,\.directory-services button\{font-size:var\(--directory-label-size\)/);
  assert.match(directoryScript, /let panel = ''/);
  assert.match(directoryScript, /panel !== 'region'/); assert.match(directoryScript, /panel !== 'tradition'/);
  assert.match(directoryScript, /event\.key !== 'Escape'/);
});
check('首页固定四卡与四套独立底纹资源', () => {
  const home = html.slice(html.indexOf('<section id="home-screen"'), html.indexOf('<section id="editor-screen"'));
  assert.equal([...home.matchAll(/<button (?:class="home-(?:temple|master|diy)"|id="home-points")/g)].length, 4);
  assert.match(css, /\.home-core\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  const patterns = [...css.matchAll(/mask-image:url\("(patterns\/[^"]+)"\)/g)].map(match => match[1]);
  assert.equal(new Set(patterns).size, 4);
  assert.equal(new Set(patterns.map(path => readFileSync(resolve(folder, path), 'utf8'))).size, 4);
});
check('目录四字段匹配且对象类型隔离', () => {
  for (const query of ['灵隐', '静心', '供灯', '大陆']) assert.ok(matchDirectoryExamples({ kind: 'temple', query }).some(item => item.id === 'temple-1'), query);
  assert.deepEqual(matchDirectoryExamples({ kind: 'temple', query: '法师' }), []);
  assert.deepEqual(matchDirectoryExamples({ kind: 'master', query: '灵隐' }), []);
});
check('目录搜索与筛选取交集并保留空查询筛选', () => {
  assert.deepEqual(matchDirectoryExamples({ kind: 'temple', query: '祈福', belief: '汉传佛教', region: '香港' }).map(item => item.id), ['temple-2']);
  assert.deepEqual(matchDirectoryExamples({ kind: 'temple', query: '香港', service: '供灯' }), []);
  assert.deepEqual(matchDirectoryExamples({ kind: 'master', query: '', tradition: '净土宗' }).map(item => item.id), ['master-3']);
});
check('全站示例搜索独立返回功能与多类型公开内容', () => {
  assert.deepEqual(searchSiteExamples('积分').functions.map(item => item.id), ['points']);
  assert.deepEqual(new Set(searchSiteExamples('禅修').content.map(item => item.type)), new Set(['寺院', '师傅', 'DIY 作品', '公开内容']));
  assert.ok(searchSiteExamples('白玉').content.some(item => item.type === '商品'));
  assert.deepEqual(searchSiteExamples('不存在的关键词'), { functions: [], content: [] });
});

console.log(JSON.stringify({ status: 'passed', count: cases.length, cases, boundary: 'Static structure and prototype geometry only; no browser, product API, native or ECS acceptance.' }, null, 2));
