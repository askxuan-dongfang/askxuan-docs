import { directoryExamples } from './directory.mjs';

// Synthetic public examples clarify scope; they are not a production search index.
const functions = [
  { id: 'temple', name: '找寺院', keywords: '寺庙 宗派 信俗 祈福', page: 'temple' },
  { id: 'master', name: '找师傅', keywords: '大师 法师 道长 咨询', page: 'master' },
  { id: 'diy', name: 'DIY 手串', keywords: '设计 定制 珠子 广场', page: 'plaza' },
  { id: 'points', name: '积分中心', keywords: '积分 兑换 转盘 奖池' },
  { id: 'shop', name: '商城', keywords: '购物 商品' },
  { id: 'ai', name: 'AI 问事', keywords: '人工智能 问答 八字 紫微 六爻 塔罗' },
  { id: 'growth', name: '我的成长', keywords: '成长值 功德值 等级 权益 折扣' },
  { id: 'bookings', name: '我的预约', keywords: '服务 订单 预约' },
  { id: 'shop-orders', name: '商城订单', keywords: '购买 订单 收货 物流' },
  { id: 'diy-orders', name: '定制订单', keywords: 'DIY 手串 定制 订单' },
  { id: 'addresses', name: '收货地址', keywords: '地址 管理' },
  { id: 'mine', name: '我的设计', keywords: '手串 草稿 编辑 发布', page: 'mine' },
  { id: 'favorites', name: '我的收藏', keywords: '收藏 关注' },
  { id: 'chats', name: '对话', keywords: '私聊 消息 咨询' },
  { id: 'community', name: '大师广场', keywords: '社区 动态 图文 视频' },
  { id: 'wallet', name: '钱包与创作收益', keywords: '钱包 消费余额 收益 提现' },
  { id: 'rewards', name: '活动奖池', keywords: '活动 奖池 抽奖' },
];
const content = [
  ...directoryExamples.map(item => ({ ...item, type: item.kind === 'temple' ? '寺院' : '师傅', keywords: [item.belief, item.tradition, item.region, ...item.tags, ...item.services].join(' ') })),
  { id: 'item-jade', name: '白玉圆珠（示例）', type: '商品', keywords: '白玉 8mm 手串 材料' },
  { id: 'public-other', name: '山间月色', type: '手串作品', keywords: '白玉 星月菩提 手串 禅修', workId: 'public-other' },
  { id: 'story-1', name: '一颗珠子的日常（示例）', type: '动态', keywords: '禅修 手串 静心' },
  { id: 'service-1', name: '祈福（服务示例）', type: '服务与心愿', keywords: '祈福 求平安 心愿' },
  { id: 'activity-1', name: '秋日静心专题（当前推荐示例）', type: '推荐活动与专题', keywords: '' },
];
export function searchSiteExamples(query) {
  const words = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  if (!words.length) return { functions: [...functions], content: [] };
  const match = item => words.every(word => [item.name, item.keywords].some(field => field.normalize('NFKC').toLocaleLowerCase().includes(word)));
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
