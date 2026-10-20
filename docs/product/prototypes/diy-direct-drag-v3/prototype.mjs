import { convexHull, dragFeedback, finishGesture, reorder } from './model.mjs';
import { setupDirectory } from './directory.mjs';
import { setupSiteSearch } from './site-search.mjs';

const $ = id => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const materials = [
  { name: '小叶紫檀圆珠', category: '主珠', element: '木', price: 28, color: '#74382f', mm: 10 },
  { name: '星月菩提', category: '主珠', element: '木', price: 18, color: '#d8ca94', mm: 10 },
  { name: '凤眼菩提', category: '主珠', element: '木', price: 22, color: '#9a6a45', mm: 10 },
  { name: '白玉圆珠', category: '主珠', element: '土', price: 35, color: '#d3d6c6', mm: 8 },
  { name: '青金石圆珠', category: '主珠', element: '水', price: 25, color: '#1848ac', mm: 10 },
  { name: '黄铜隔珠', category: '隔珠', element: '金', price: 8, color: '#b9a16a', mm: 3, shape: 'spacer' },
  { name: '平安扣吊坠', category: '吊坠', element: '土', price: 32, color: '#71917b', mm: 3, shape: 'pendant' },
];
let nextId = 1;
const bead = material => ({ id: `bead-${nextId++}`, material });
const initial = () => Array.from({ length: 18 }, (_, index) => bead(index % 4));
let beads = initial(), history = [], future = [], selected = null, category = '全部', wrist = 160;
let gesture = null, currentLayout = null, currentPage = 'editor', selectedWork = 'public-other', editingWorkId = null;
const activePointers = new Set();
const works = [
  { id: 'public-other', name: '山间月色', authorId: 2, own: false, published: true, items: [1, 1, 3, 3, 1, 1, 3, 3, 1, 1, 3, 3, 1, 1, 3, 3, 1, 1] },
  { id: 'public-own', name: '我的东方木珠', authorId: 1, own: true, published: true, items: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1] },
  { id: 'public-blue', name: '青石与远山', authorId: 3, own: false, published: true, items: [4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 4, 3] },
  { id: 'private-own', name: '素玉初稿', authorId: 1, own: true, published: false, items: [3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3, 1, 3, 3, 3, 1] },
];

function svgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}
function button(text, action, className = '') {
  const element = document.createElement('button');
  element.textContent = text;
  element.className = className;
  element.onclick = action;
  return element;
}
function announce(message) { $('announcement').textContent = message; }
function modal(title, content) {
  cancelGesture('手势已取消');
  $('dialog-title').textContent = title;
  $('dialog-body').replaceChildren();
  if (typeof content === 'string') $('dialog-body').textContent = content;
  else $('dialog-body').append(content);
  $('dialog').showModal();
}
function sameOrder(a, b) { return a.length === b.length && a.every((item, index) => item.id === b[index].id); }
function authorName(work) { return work.own ? '我' : `创作者 #${work.authorId}`; }
function change(next, message) {
  if (sameOrder(next, beads)) return false;
  history.push([...beads]); future = []; beads = next;
  if (!beads.some(item => item.id === selected)) selected = null;
  renderDiy(); announce(message);
  return true;
}

function layout(items, width, height) {
  const cx = width / 2, cy = height / 2, rx = Math.min(width * .36, height * .38), ry = rx * .94;
  const points = Array.from({ length: 96 }, (_, index) => {
    const angle = index * 2 * Math.PI / 96;
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
  });
  const positions = items.map((item, index) => {
    const angle = index * 2 * Math.PI / Math.max(1, items.length) - Math.PI / 2;
    const material = materials[item.material], radius = material.shape === 'spacer' ? 11 : material.shape === 'pendant' ? 8 : material.mm * 1.1 + 4;
    const position = { id: item.id, x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), radius, material };
    if (material.shape === 'spacer') {
      points.push(...[[-11, -5], [11, -5], [11, 5], [-11, 5]].map(([x, y]) => ({ x: position.x + x, y: position.y + y })));
    } else {
      for (let step = 0; step < 24; step++) {
        const theta = step * Math.PI / 12;
        points.push({ x: position.x + radius * Math.cos(theta), y: position.y + radius * Math.sin(theta) });
        if (material.shape === 'pendant') points.push({ x: position.x + 19 * Math.cos(theta), y: position.y + 29 + 19 * Math.sin(theta) });
      }
    }
    return position;
  });
  return { cx, cy, rx, ry, positions, hull: convexHull(points) };
}
function bodyFor(position) {
  const material = position.material, group = svgElement('g', { filter: 'url(#bead-shadow)' });
  if (material.shape === 'spacer') {
    group.append(svgElement('rect', { x: -11, y: -5, width: 22, height: 10, rx: 3, fill: material.color }));
  } else if (material.shape === 'pendant') {
    group.append(svgElement('circle', { r: 7, fill: material.color }), svgElement('path', { d: 'M0 5V12', stroke: 'var(--cord)', 'stroke-width': 2 }),
      svgElement('circle', { cy: 29, r: 13, fill: 'none', stroke: material.color, 'stroke-width': 12 }));
  } else {
    group.append(svgElement('circle', { r: position.radius, fill: material.color }), svgElement('circle', { r: position.radius, fill: 'url(#shine)' }));
  }
  return group;
}
function renderScene() {
  if (currentPage !== 'editor') return;
  const rect = $('canvas').getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  currentLayout = layout(beads, rect.width, rect.height);
  const sceneLayout = gesture?.dragging ? gesture.layout : currentLayout;
  $('canvas').setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  for (const name of ['cx', 'cy', 'rx', 'ry']) $('cord').setAttribute(name, sceneLayout[name]);
  $('cord').classList.toggle('hidden', !beads.length);
  $('empty').classList.toggle('hidden', !!beads.length);
  $('hull').setAttribute('d', sceneLayout.hull.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' ') + 'Z');
  const focused = document.activeElement?.dataset?.beadId;
  const nodes = sceneLayout.positions.map((position, index) => {
    const dragged = gesture?.dragging && position.id === gesture.id;
    const point = dragged ? gesture.feedback.position : position;
    const group = svgElement('g', {
      transform: `translate(${point.x},${point.y})`, 'data-bead-id': position.id,
      'data-selected': position.id === selected, 'data-delete': dragged && gesture.feedback.pendingDelete,
      tabindex: position.id === selected || (!selected && index === 0) ? 0 : -1, role: 'button',
      'aria-label': `第 ${index + 1} 颗，${position.material.name}，${position.material.mm}毫米`,
      'aria-pressed': position.id === selected,
      'aria-keyshortcuts': 'ArrowLeft ArrowRight Alt+ArrowLeft Alt+ArrowRight Delete',
    });
    group.append(bodyFor(position), svgElement('circle', { r: position.radius + 4, class: 'selection-ring' }));
    group.onkeydown = event => beadKeyboard(event, position.id);
    group.onfocus = () => { selected = position.id; };
    return group;
  });
  // Keep the dragged object visually above its neighbours.
  nodes.sort((a, b) => Number(a.dataset.beadId === gesture?.id) - Number(b.dataset.beadId === gesture?.id));
  $('beads').replaceChildren(...nodes);
  if (focused && !gesture) $('beads').querySelector(`[data-bead-id="${focused}"]`)?.focus({ preventScroll: true });
  const target = gesture?.dragging && !gesture.feedback.pendingDelete ? sceneLayout.positions[gesture.target] : null;
  $('drop-target').classList.toggle('hidden', !target);
  if (target) { $('drop-target').setAttribute('cx', target.x); $('drop-target').setAttribute('cy', target.y); }
  $('measurement').textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;
}
function renderDiy() {
  const sum = beads.reduce((total, item) => total + materials[item.material].mm, 0);
  const inner = Math.max(0, sum - Math.PI * (beads.length ? sum / beads.length : 0));
  const difference = inner - wrist - 8;
  $('count').textContent = `${beads.length} / 60 颗`;
  $('price').textContent = `¥ ${beads.reduce((total, item) => total + materials[item.material].price, 0).toFixed(2)}`;
  $('fit').textContent = `内围预估 ${(inner / 10).toFixed(1)} cm · ${!beads.length ? '未开始' : difference < -8 ? `偏短，还差约 ${Math.round(-difference)} mm` : difference > 8 ? `偏长，偏松约 ${Math.round(difference)} mm` : '接近合适'}`;
  $('wrist').textContent = `手围 ${(wrist / 10).toFixed(1)} cm ›`;
  $('undo').disabled = !history.length; $('redo').disabled = !future.length;
  renderScene(); renderMaterials();
}
function renderMaterials() {
  $('categories').replaceChildren(...['全部', '正在使用', '主珠', '隔珠', '吊坠'].map(value => {
    const element = button(value, () => { category = value; renderMaterials(); });
    element.setAttribute('aria-pressed', String(value === category)); return element;
  }));
  const query = $('search').value.trim(), element = $('element').value;
  const entries = materials.flatMap((material, index) => {
    if (category === '正在使用' ? !beads.some(item => item.material === index) : category !== '全部' && category !== material.category) return [];
    if (query && !`${material.name}${material.mm}mm`.includes(query)) return [];
    if (element && material.element !== element) return [];
    const node = button('', () => {
      cancelGesture('手势已取消');
      if (beads.length >= 60) { announce('最多 60 颗'); return; }
      change([...beads, bead(index)], `已添加${material.name}`);
    }, 'material');
    node.setAttribute('aria-label', `添加${material.name}，${material.mm}毫米，${material.price}元`);
    const art = document.createElement('span'); art.className = `material-art ${material.shape || ''}`; art.style.background = material.color;
    const title = document.createElement('strong'); title.textContent = material.name;
    const size = document.createElement('small'); size.textContent = `${material.mm} mm`;
    const price = document.createElement('b'); price.textContent = `¥${material.price.toFixed(2)}　＋`;
    node.append(art, title, size, price); return [node];
  });
  if (!entries.length) { const empty = document.createElement('p'); empty.className = 'no-result'; empty.textContent = '暂无匹配材料'; entries.push(empty); }
  $('materials').replaceChildren(...entries);
}

function localPoint(event) {
  const rect = $('canvas').getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}
function startGesture(event) {
  if (event.button !== 0 || gesture || activePointers.size > 1) return;
  const item = event.target.closest('[data-bead-id]');
  if (!item || !currentLayout) return;
  event.preventDefault();
  selected = item.dataset.beadId;
  gesture = { id: selected, pointerId: event.pointerId, start: localPoint(event), items: [...beads], dragging: false, target: beads.findIndex(value => value.id === selected) };
  $('canvas').setPointerCapture(event.pointerId);
  renderScene();
}
function moveGesture(event) {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  const pointer = localPoint(event);
  if (!gesture.dragging && Math.hypot(pointer.x - gesture.start.x, pointer.y - gesture.start.y) < 6) return;
  event.preventDefault();
  if (!gesture.dragging) {
    // Freeze the complete projected outline once; candidate movements never resize it.
    gesture.layout = currentLayout;
    gesture.anchor = currentLayout.positions.find(position => position.id === gesture.id);
    gesture.dragging = true;
  }
  gesture.feedback = dragFeedback(gesture.start, pointer, gesture.anchor, gesture.layout.hull);
  // Once a drag has started, returning within 6px does not turn it into a click.
  gesture.feedback.dragging = true;
  let nearest = 0, distance = Infinity;
  gesture.layout.positions.forEach((position, index) => {
    const value = Math.hypot(position.x - gesture.feedback.position.x, position.y - gesture.feedback.position.y);
    if (value < distance) { nearest = index; distance = value; }
  });
  gesture.target = nearest;
  $('scene').classList.add('dragging');
  const hint = gesture.feedback.pendingDelete ? '松手删除，移回取消' : '';
  if ($('gesture-hint').textContent !== hint) $('gesture-hint').textContent = hint;
  $('gesture-state').textContent = gesture.feedback.pendingDelete ? '待删除 · 尚未提交' : `换位预览 · 第 ${nearest + 1} 位`;
  $('outside-distance').textContent = `${gesture.feedback.outside.toFixed(1)} px`;
  renderScene();
}
function releaseGesture(event) {
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  // Include the final pointer position; a fast move/up may not have a separate move event.
  moveGesture(event);
  const completed = gesture;
  gesture = null;
  if ($('canvas').hasPointerCapture(event.pointerId)) $('canvas').releasePointerCapture(event.pointerId);
  $('scene').classList.remove('dragging'); $('gesture-hint').textContent = '';
  const from = completed.items.findIndex(item => item.id === completed.id);
  const next = finishGesture(completed.items, from, completed.target, completed.feedback, 'pointerup');
  const message = completed.feedback?.pendingDelete ? '已删除珠子，可撤销' : '已调整珠子顺序';
  const changed = change(next, message);
  $('gesture-state').textContent = changed ? message : completed.dragging ? '已结束 · 设计未改变' : '已选中珠子';
  if (!changed) renderScene();
}
function cancelGesture(message = '手势已取消') {
  if (!gesture) return;
  const pointerId = gesture.pointerId; gesture = null;
  if ($('canvas').hasPointerCapture(pointerId)) $('canvas').releasePointerCapture(pointerId);
  $('scene').classList.remove('dragging'); $('gesture-hint').textContent = '';
  $('gesture-state').textContent = message; $('outside-distance').textContent = '—';
  renderScene(); announce(message);
}
function beadKeyboard(event, id) {
  const index = beads.findIndex(item => item.id === id);
  if (index < 0) return;
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault(); cancelGesture();
    const focus = beads[index + 1]?.id || beads[index - 1]?.id;
    change(beads.filter(item => item.id !== id), '已删除珠子，可撤销');
    selected = focus || null; renderScene();
    (focus ? $('beads').querySelector(`[data-bead-id="${focus}"]`) : $('canvas'))?.focus();
  } else if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault(); cancelGesture();
    const target = Math.max(0, Math.min(beads.length - 1, index + (event.key === 'ArrowLeft' ? -1 : 1)));
    if (event.altKey) change(reorder(beads, index, target), '已调整珠子顺序');
    else selected = beads[target].id;
    renderScene(); $('beads').querySelector(`[data-bead-id="${selected}"]`)?.focus();
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault(); selected = id; renderScene(); announce(`已选中第 ${index + 1} 颗珠子`);
  }
}
function undo() {
  cancelGesture(); if (!history.length) return;
  future.push([...beads]); beads = history.pop(); selected = null; renderDiy(); announce('已撤销');
}
function redo() {
  cancelGesture(); if (!future.length) return;
  history.push([...beads]); beads = future.pop(); selected = null; renderDiy(); announce('已重做');
}

function workArt(work) {
  const svg = svgElement('svg', { viewBox: '0 0 240 240', role: 'img', 'aria-label': `${work.name}的手串示意图` });
  svg.append(svgElement('circle', { cx: 120, cy: 120, r: 77, fill: 'none', stroke: 'var(--cord)' }));
  work.items.forEach((material, index) => {
    const angle = index * 2 * Math.PI / work.items.length - Math.PI / 2;
    svg.append(svgElement('circle', { cx: 120 + 77 * Math.cos(angle), cy: 120 + 77 * Math.sin(angle), r: materials[material].mm + 1, fill: materials[material].color }));
  });
  return svg;
}
function workDetail(id) { selectedWork = id; renderDetail(); show('detail'); }
function renderPlaza() {
  const query = $('work-search').value.trim();
  $('plaza-list').replaceChildren(...works.filter(work => work.published && (!query || work.name.includes(query))).map(work => {
    const card = button('', () => workDetail(work.id), 'work-card');
    const art = document.createElement('div'); art.className = 'work-thumb'; art.append(workArt(work));
    const name = document.createElement('strong'); name.textContent = work.name;
    const author = document.createElement('small'); author.textContent = authorName(work);
    card.append(art, name, author); return card;
  }));
}
function renderDetail() {
  const work = works.find(item => item.id === selectedWork);
  $('detail-preview').replaceChildren(workArt(work));
  $('detail-name').textContent = work.name; $('detail-author').textContent = `作者：${authorName(work)}`;
  $('detail-materials').replaceChildren(...[...new Set(work.items)].map(material => {
    const node = document.createElement('span'), count = work.items.filter(item => item === material).length;
    node.textContent = `${materials[material].name} ${materials[material].mm}mm × ${count}`; return node;
  }));
}
function loadDesign(work, copy = false) {
  cancelGesture();
  editingWorkId = copy ? null : work.id;
  beads = work.items.map(bead); history = []; future = []; selected = null;
  $('design-name').replaceChildren(document.createTextNode(copy ? `${work.name}的副本 ` : `${work.name} `), $('count'));
  $('save').textContent = copy ? '保存设计' : '保存修改';
  show('editor'); renderDiy(); announce(copy ? '已复制到示例编辑器' : '已进入我的设计编辑器');
}
function renderMine() {
  $('mine-list').replaceChildren(...works.filter(work => work.own).map(work => {
    const card = document.createElement('article'); card.className = 'mine-card';
    const open = button('', () => loadDesign(work), 'mine-open');
    open.setAttribute('aria-label', `${work.name}，${work.published ? '已发布' : '未发布'}，进入编辑器`);
    const art = document.createElement('div'); art.className = 'work-thumb'; art.append(workArt(work));
    const content = document.createElement('div'), title = document.createElement('h2'), status = document.createElement('span');
    title.textContent = work.name; status.className = 'status'; status.textContent = work.published ? '已发布' : '未发布';
    const actions = document.createElement('div'); actions.className = 'actions';
    actions.append(button(work.published ? '下架' : '发布', () => managePublication(work), 'quiet'));
    content.append(title, status); open.append(art, content); card.append(open, actions); return card;
  }));
}
function show(page) {
  cancelGesture(); currentPage = page;
  $('app').dataset.screen = page;
  const directoryPage = page === 'temple' || page === 'master';
  for (const name of ['home', 'editor', 'plaza', 'detail', 'mine', 'directory']) $(`${name}-screen`).classList.toggle('hidden', directoryPage ? name !== 'directory' : page !== name);
  $('page-title').textContent = { home: '问玄东方', editor: '东方珠作', plaza: 'DIY 广场', detail: '作品详情', mine: '我的设计', temple: '找寺院', master: '找师傅' }[page];
  $('mine-entry').classList.toggle('hidden', ['home', 'detail', 'mine'].includes(page) || directoryPage);
  $('back').style.visibility = page === 'home' ? 'hidden' : '';
  $('back').setAttribute('aria-label', directoryPage ? '返回首页' : '返回 DIY 广场');
  directory.close(); if (directoryPage) directory.show(page);
  document.querySelectorAll('[data-page]').forEach(element => element.setAttribute('aria-pressed', String(element.dataset.page === page)));
  if (page === 'editor') requestAnimationFrame(renderDiy);
  if (page === 'plaza') renderPlaza();
  if (page === 'detail') renderDetail();
  if (page === 'mine') renderMine();
}
function newDesign() {
  cancelGesture(); beads = []; history = []; future = []; selected = null; editingWorkId = null;
  $('design-name').replaceChildren(document.createTextNode('我的手串 '), $('count'));
  $('save').textContent = '保存设计'; show('editor'); renderDiy();
}
function managePublication(work) {
  const published = work.published, box = document.createElement('div');
  const message = document.createElement('p');
  message.textContent = published ? '下架后作品不再出现在广场，仍可在“我的设计”继续编辑。' : '发布后作品会出现在广场，其他人可以查看并复制设计。';
  const note = document.createElement('p'); note.className = 'review-note'; note.textContent = '此原型仅改变本页示例状态，不发送业务请求。';
  box.append(message, note, button(published ? '确认下架' : '确认发布', () => {
    work.published = !published; $('dialog').close(); renderMine(); renderPlaza(); announce(published ? '示例作品已下架' : '示例作品已发布');
  }, 'primary'));
  modal(published ? '下架作品' : '发布作品', box);
}
function saveDesign() {
  if (!beads.length) { modal('还没有添加材料', '先从材料区添加珠子，再保存设计。'); return; }
  const work = works.find(item => item.id === editingWorkId), box = document.createElement('div');
  const message = document.createElement('p');
  message.textContent = work?.published ? '保存后作品将转为未发布，并从广场移除。完成修改后，请到“我的设计”重新发布。' : '保存后可在“我的设计”继续编辑或发布。';
  const note = document.createElement('p'); note.className = 'review-note'; note.textContent = '此原型仅更新内存中的示例，不上传作品。';
  box.append(message, note, button(work ? '保存修改' : '保存设计', () => {
    if (work) { work.items = beads.map(item => item.material); work.published = false; }
    else {
      const saved = { id: `saved-${nextId++}`, name: '我的新设计', authorId: 1, own: true, published: false, items: beads.map(item => item.material) };
      works.push(saved); editingWorkId = saved.id;
    }
    $('dialog').close(); show('mine'); announce('示例已保存，当前为未发布');
  }, 'primary'));
  modal(work ? '保存修改' : '保存设计', box);
}

$('canvas').addEventListener('pointerdown', startGesture);
$('canvas').addEventListener('pointermove', moveGesture);
$('canvas').addEventListener('pointerup', releaseGesture);
$('canvas').addEventListener('pointercancel', () => cancelGesture('指针取消 · 设计未改变'));
$('canvas').addEventListener('lostpointercapture', () => cancelGesture('手势中断 · 设计未改变'));
window.addEventListener('pointerdown', event => {
  activePointers.add(event.pointerId);
  if (gesture && event.pointerId !== gesture.pointerId) cancelGesture('多指取消 · 设计未改变');
}, true);
for (const name of ['pointerup', 'pointercancel']) window.addEventListener(name, event => activePointers.delete(event.pointerId), true);
window.addEventListener('blur', () => { activePointers.clear(); cancelGesture('失焦取消 · 设计未改变'); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { activePointers.clear(); cancelGesture('离开页面 · 设计未改变'); } });
window.addEventListener('resize', () => { cancelGesture('尺寸改变 · 手势已取消'); renderScene(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') cancelGesture('已取消 · 设计未改变');
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.target.matches('input,textarea')) {
    event.preventDefault(); event.shiftKey ? redo() : undo();
  }
});
$('undo').onclick = undo; $('redo').onclick = redo;
$('expand').onclick = () => {
  cancelGesture(); const expanded = $('app').classList.toggle('expanded');
  $('expand').textContent = expanded ? '收起预览' : '扩大预览'; $('expand').setAttribute('aria-pressed', String(expanded)); renderScene();
};
$('search').oninput = renderMaterials; $('element').onchange = renderMaterials;
$('show-boundary').onchange = () => $('scene').classList.toggle('show-boundary', $('show-boundary').checked);
$('theme').onclick = () => { cancelGesture(); document.body.classList.toggle('dark'); };
$('reset').onclick = () => { cancelGesture(); beads = initial(); history = []; future = []; selected = null; editingWorkId = null; $('design-name').replaceChildren(document.createTextNode('我的手串 '), $('count')); $('save').textContent = '保存设计'; show('editor'); renderDiy(); };
$('clear').onclick = newDesign;
$('accessories').onclick = () => { cancelGesture(); beads = Array.from({ length: 14 }, (_, index) => bead(index === 7 ? 6 : index === 3 ? 5 : index % 4)); history = []; future = []; selected = null; editingWorkId = null; $('design-name').replaceChildren(document.createTextNode('我的手串 '), $('count')); $('save').textContent = '保存设计'; show('editor'); renderDiy(); };
$('wrist').onclick = () => {
  const box = document.createElement('div'); box.textContent = '手围 14–20cm，松量 8mm。估算仅供设计参考。';
  const input = document.createElement('input'); input.type = 'range'; input.min = 140; input.max = 200; input.step = 5; input.value = wrist; input.setAttribute('aria-label', '手围毫米');
  input.oninput = () => { wrist = Number(input.value); renderDiy(); }; box.append(input); modal('手围与松量', box);
};
$('dialog-close').onclick = () => $('dialog').close();
$('save').onclick = saveDesign;
$('customize').onclick = () => modal('去定制', '正式产品校验设计、库存和收货信息后进入定制。此原型不创建订单。');
$('back').onclick = () => show(['temple', 'master'].includes(currentPage) ? 'home' : 'plaza'); $('mine-entry').onclick = () => show('mine');
$('new-design').onclick = newDesign; $('mine-new').onclick = newDesign;
$('work-search').oninput = renderPlaza;
$('copy-design').onclick = () => loadDesign(works.find(work => work.id === selectedWork), true);
document.querySelectorAll('[data-page]').forEach(element => element.onclick = () => show(element.dataset.page));
const directory = setupDirectory({ modal });
setupSiteSearch({ show, modal, openWork: id => { selectedWork = id; show('detail'); } });
renderDiy(); renderPlaza(); renderDetail(); renderMine();
