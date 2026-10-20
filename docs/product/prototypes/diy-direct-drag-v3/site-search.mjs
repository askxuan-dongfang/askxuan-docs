import { directoryExamples } from './directory.mjs';

// Synthetic public examples clarify scope; they are not a production search index.
const functions = [
  { id: 'temple', name: '找寺院', keywords: '寺庙 宗派 信俗 祈福', page: 'temple' },
  { id: 'master', name: '找师傅', keywords: '大师 法师 道长 咨询', page: 'master' },
  { id: 'diy', name: 'DIY 手串', keywords: '设计 定制 珠子 广场', page: 'plaza' },
  { id: 'points', name: '积分中心', keywords: '积分 兑换 转盘 奖池' },
  { id: 'growth', name: '成长值', keywords: '成长 功德 等级' },
  { id: 'shop', name: '商城', keywords: '购物 商品' },
  { id: 'orders', name: '订单中心', keywords: '预约 订单' },
  { id: 'addresses', name: '收货地址', keywords: '地址 管理' },
];
const content = [
  ...directoryExamples.map(item => ({ ...item, type: item.kind === 'temple' ? '寺院' : '师傅', keywords: [item.belief, item.tradition, item.region, ...item.tags, ...item.services].join(' ') })),
  { id: 'item-jade', name: '白玉圆珠（示例）', type: '商品', keywords: '白玉 8mm 手串 材料' },
  { id: 'public-other', name: '山间月色', type: 'DIY 作品', keywords: '白玉 星月菩提 手串 禅修', workId: 'public-other' },
  { id: 'story-1', name: '一颗珠子的日常（示例）', type: '公开内容', keywords: '禅修 手串 静心' },
];
export function searchSiteExamples(query) {
  const word = query.normalize('NFKC').trim().toLocaleLowerCase();
  if (!word) return { functions: [], content: [] };
  const match = item => `${item.name} ${item.keywords}`.normalize('NFKC').toLocaleLowerCase().includes(word);
  return { functions: functions.filter(match), content: content.filter(match) };
}
export function setupSiteSearch({ show, modal, openWork }) {
  const $ = id => document.getElementById(id);
  function explain(name) {
    modal(name, '本原型仅示意这个入口；正式产品进入现有页面，并遵循该页面的登录与权限要求。');
  }
  function resultButton(item, isFunction) {
    const node = document.createElement('button'); node.className = 'site-result';
    const title = document.createElement('strong'); title.textContent = item.name;
    const type = document.createElement('span'); type.textContent = isFunction ? '功能' : item.type;
    node.append(title, type);
    node.onclick = () => {
      if (item.page) show(item.page);
      else if (item.workId) openWork(item.workId);
      else explain(item.name);
    };
    return node;
  }
  function render() {
    const target = $('site-search-results'), query = $('site-search').value.trim();
    target.replaceChildren();
    if (!query) {
      const note = document.createElement('p'); note.className = 'review-note';
      note.textContent = '搜索站内功能与内容，或从上方入口开始。'; target.append(note); return;
    }
    const results = searchSiteExamples(query);
    for (const [key, label] of [['functions', '功能'], ['content', '内容']]) {
      if (!results[key].length) continue;
      const group = document.createElement('section'), heading = document.createElement('h2');
      heading.textContent = label; group.append(heading, ...results[key].map(item => resultButton(item, key === 'functions'))); target.append(group);
    }
    if (!results.functions.length && !results.content.length) {
      const empty = document.createElement('p'); empty.className = 'review-note'; empty.textContent = '没有找到相关功能或内容'; target.append(empty);
    }
  }
  document.querySelectorAll('[data-home-page]').forEach(node => { node.onclick = () => show(node.dataset.homePage); });
  $('home-points').onclick = () => explain('积分中心');
  $('site-search-submit').onclick = render;
  $('site-search').onkeydown = event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); render(); } };
  $('site-search').oninput = () => { if (!$('site-search').value.trim()) render(); };
  $('large-text').onchange = () => $('app').classList.toggle('large-text', $('large-text').checked);
}
