import { materials, createState, amount, eligibility, publicVersion, draftChanged, publish, unpublish, copyPublished, confirmExampleOrder } from './model.mjs';
const $ = id => document.getElementById(id);
let state = createState(), page = 'home', growthTab = 'benefits', rulesOpen = false, historyMore = false, historyError = false, historyRetried = false, directoryPanel = '', belief = '全部', region = '地区', directoryQuery = '', serviceCode = '', tradition = '全部宗派', priceBand = '全部', workQuery = '';
let toastTimer, dialogAction, widePreview = false;
const money = cents => '¥' + (cents / 100).toFixed(2);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icons = {
  temple: '<path d="M3 10 12 4l9 6M5 10h14v11H5zM3 21h18M10 14h4v7M3 10h18"/>',
  master: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-4c0-5 16-5 16 0v4"/>',
  diy: '<circle cx="12" cy="4" r="2"/><circle cx="18.5" cy="7" r="2"/><circle cx="20" cy="14" r="2"/><circle cx="15" cy="20" r="2"/><circle cx="7" cy="20" r="2"/><circle cx="3" cy="13" r="2"/><circle cx="5" cy="6" r="2"/>',
  points: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L2.2 9.4l6.1-.9Z"/>',
  wish: '<path d="M12 3 4 7v5c0 4 4 7 8 9 4-2 8-5 8-9V7Z"/><path d="m8 12 3 3 5-6"/>',
};
const icon = kind => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${icons[kind] || icons.wish}</svg>`;
// Same local linework as the H5 IntentionIcon; labels convey each destination.
const wishDrawings = {
  peace: '<path d="M8 3h8l3 4v14H5V7Z"/><circle cx="12" cy="7" r="1"/><path d="m8.5 13 2.5 2.5 4.5-5"/>',
  wealth: '<ellipse cx="12" cy="9" rx="4" ry="3"/><path d="M3 10c3 1 4 4 9 4s6-3 9-4l-3 9H6Z"/><path d="M10 9h4"/>',
  love: '<path d="M12 8c-1-4-7-4-8 0-1 4 4 7 8 10 4-3 9-6 8-10-1-4-7-4-8 0Z"/><path d="m8 16-2 5m10-5 2 5"/>',
  career: '<path d="M5 21h14M8 21v-6h8v6M10 15V9h4v6M12 9V3"/><path d="M12 3h7l-2 2 2 2h-7"/>',
  study: '<path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/><path d="M6 9h3m-3 4h3m6-4h3m-3 4h3"/>',
  taisui: '<path d="M12 2 4 5v6c0 5 4 9 8 11 4-2 8-6 8-11V5Z"/><path d="m12 6 1.5 3.5L17 11l-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5Z"/>',
};
const wishIcon = kind => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${wishDrawings[kind]}</svg>`;
function ornament() {
  return `<div class="ornament" aria-label="绿金手串装饰，一珠一心意"><div class="center">一珠<small>一心意</small></div>${Array.from({ length: 15 }, (_, i) => `<i class="bead ${i % 4 === 0 ? 'gold' : ''}" style="left:${56 + 47 * Math.cos(i * Math.PI * 2 / 15)}px;top:${56 + 47 * Math.sin(i * Math.PI * 2 / 15)}px"></i>`).join('')}</div>`;
}
let svgId = 0;
function preview(design) {
  const id = 'shine-' + svgId++;
  return `<div class="preview"><svg viewBox="0 0 300 300" role="img" aria-label="${escapeHtml(design.title)}，${design.beads.length} 颗珠子"><defs><radialGradient id="${id}" cx="30%" cy="24%" r="80%"><stop stop-color="#fff" stop-opacity=".45"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></radialGradient></defs><circle cx="150" cy="150" r="111" fill="none" stroke="#b4976e" stroke-width="1.4"/>${design.beads.map((key, i) => { const a = i * Math.PI * 2 / design.beads.length - Math.PI / 2, x = 150 + 111 * Math.cos(a), y = 150 + 111 * Math.sin(a); return `<g><circle cx="${x + 1}" cy="${y + 4}" r="17" fill="#29402c" opacity=".1"/><circle cx="${x}" cy="${y}" r="16" fill="${materials[key].color}"/><circle cx="${x}" cy="${y}" r="16" fill="url(#${id})"/></g>`; }).join('')}</svg></div>`;
}
function hero() { return `<div class="diy-hero"><div><h2>把喜欢，串在一起。</h2><button data-action="new">开始我的设计 ↗</button></div>${ornament()}</div>`; }
function tabs() { return `<nav class="section-tabs" aria-label="DIY 内容"><button data-page="plaza" aria-pressed="${page === 'plaza'}">设计广场</button><button data-page="mine" aria-pressed="${page === 'mine'}">我的设计</button></nav>`; }
function stateLabel() { return state.publication?.active ? (publicVersion(state) ? draftChanged(state) ? '已发布 · 草稿已修改' : '已发布' : '暂不可公开') : '未发布'; }
function home() {
  const faiths = [['汉传佛教', '慈悲与智慧并行', '汉'], ['藏传佛教', '传承、修持与慈悲', '藏'], ['南传佛教', '戒、定、慧与日常修习', '南'], ['道教', '道法自然，清静修持', '道'], ['民间信仰', '乡土传统与民俗传承', '民']];
  return `<div class="home page-pad"><div class="home-banner"><small>手作日常</small><h1>一珠一念，<br>让心意慢慢成形。</h1></div><nav class="home-core" aria-label="首页四个核心入口">${[['temple', '找寺院', 'temple'], ['master', '找师傅', 'directory'], ['diy', 'DIY手串', 'plaza'], ['points', '积分中心', 'points']].map(([kind, text, target]) => `<button class="home-${kind}" data-page="${target}" data-kind="${kind}">${icon(kind)}<span>${text}</span></button>`).join('')}</nav><section class="home-section" aria-labelledby="home-faith-heading"><h2 id="home-faith-heading">信仰类别</h2><div class="faith-grid">${faiths.map(([name, note, glyph]) => `<button data-faith="${name}"><span><strong>${name}</strong><small>${note}</small></span><span class="faith-glyph" aria-hidden="true">${glyph}</span></button>`).join('')}</div></section><section class="home-section" aria-labelledby="home-wish-heading"><h2 id="home-wish-heading">按心愿办</h2><div class="wish-grid">${[['peace', '求平安'], ['wealth', '求财运'], ['love', '求姻缘'], ['career', '求事业'], ['study', '求学业'], ['taisui', '化太岁']].map(([kind, name]) => `<button data-wish="${name}">${wishIcon(kind)}<span>${name}</span></button>`).join('')}</div></section></div>`;
}
function mine() {
  return hero() + tabs() + `<div class="search"><input id="work-search" type="search" aria-label="搜索我的设计" placeholder="搜索作品名称" value="${escapeHtml(workQuery)}"><button data-action="work-search">搜索</button></div>` + (state.draft.title.includes(workQuery) ? `<article class="mine-card"><button data-page="editor" class="mine-open" aria-label="编辑 ${escapeHtml(state.draft.title)}">${preview(state.draft)}<div><h3>${escapeHtml(state.draft.title)}</h3><small>${state.draft.beads.length} 颗 · 手围 ${state.draft.wrist} cm</small><span class="tag">${stateLabel()}</span><small>材料预估 ${money(amount(state.draft))}</small></div></button><div class="mine-actions"><button data-action="manage">${state.publication?.active ? '发布管理' : '发布作品'}</button>${state.publication?.active ? '<button data-action="unpublish">下架</button>' : ''}</div></article>` : '<p class="empty-list">没有匹配的设计</p>');
}
function plaza() {
  const work = publicVersion(state);
  return hero() + tabs() + `<div class="search"><input aria-label="搜索广场作品" id="plaza-search" placeholder="搜索作品名称"><button data-action="plaza-search">搜索</button></div>` + (work ? `<div class="plaza-grid"><button class="plaza-card" data-page="detail">${preview(work.design)}<h3>${escapeHtml(work.design.title)}</h3><small>作者：我 · 已确认定稿</small></button></div>` : '<div class="blank"><h2>新的心意，正在路上</h2><p>当前示例没有可公开的定稿</p><button data-page="mine" class="quiet">回到我的设计</button></div>');
}
function detail() {
  const work = publicVersion(state);
  if (!work) return '<div class="blank"><h2>作品暂不可查看</h2><p>已下架，或当前订单不满足公开条件。</p><button data-page="plaza" class="quiet">回设计广场</button></div>';
  const counts = work.design.beads.reduce((all, key) => ({ ...all, [key]: (all[key] || 0) + 1 }), {});
  return `<div class="page-pad"><div class="detail-preview">${preview(work.design)}</div><div class="detail-summary"><h1>${escapeHtml(work.design.title)}</h1><p>作者：我 · 已确认定稿</p><div class="row"><strong class="price">${money(work.price)}</strong><small>材料参考价</small></div></div><section class="materials"><h2>这一串的用料</h2>${Object.entries(counts).map(([key, n]) => `<div class="material-row"><span>${materials[key].name}<small>${materials[key].spec} × ${n}</small></span><span>${money(materials[key].unit * n)}</span></div>`).join('')}<p class="review-note">再次定制时将核验库存与价格，以收银台确认为准。</p></section></div><div class="detail-footer"><button data-action="copy" class="quiet">复制并编辑</button><button data-action="customize-public" class="primary">按此款定制</button></div>`;
}
function editor() {
  return `<div class="editor-meta"><strong>${escapeHtml(state.draft.title)}</strong><span>${state.draft.beads.length} 颗 · 手围 ${state.draft.wrist} cm</span></div><div class="status-line">${state.publication?.active ? '编辑个人稿，已发布定稿保持不变' : '个人设计稿'}</div><div class="editor-preview">${preview(state.draft)}</div><p class="editor-note">点选材料添加到本稿；此原型仅演示草稿与定稿的隔离。</p><div class="editor-materials">${Object.entries(materials).map(([key, value]) => `<button data-material="${key}"><i class="material-dot" style="background:${value.color}"></i>${value.name}<br>${money(value.unit)}</button>`).join('')}</div><div class="page-pad row"><small>材料预估</small><strong class="price">${money(amount(state.draft))}</strong></div><div class="detail-footer"><button data-action="save" class="quiet">保存设计</button><button data-action="order" class="primary">去定制 →</button></div>`;
}
const levelNames = ['初识', '同行', '笃行', '致远', '恒久'];
const thresholds = [0, 200, 1000, 3000, 8000];
const goods = ['原价', '9.8 折', '9.7 折', '9.5 折', '9.2 折'];
const services = ['原价', '原价', '9.9 折', '9.8 折', '9.5 折'];
function rules() {
  return `<section class="rules" id="growth-rules"><h2>规则说明</h2><p>当前规则 · growth-v1</p><details ${rulesOpen ? 'open' : ''}><summary>如何获取与入账</summary><p>有效任务、参与交易等按规则累计成长值；周期任务月上限 200。交易完成后满 7 天且无进行中售后，待入账成长值转入档案。个人记录默认私密。</p></details><details ${rulesOpen ? 'open' : ''}><summary>升级与退款</summary><p>五级门槛为 0 / 200 / 1,000 / 3,000 / 8,000。退款按原订单净实付重算成长值；等级变化不追补已支付订单差价。</p></details><details ${rulesOpen ? 'open' : ''}><summary>优惠适用范围</summary><p>指定商品及材料、参与的固定服务费可享对应等级优惠。运费、随喜等不参与。活动价、等级价与券价择优不叠加；月优惠上限 ¥300。实际参与范围及开关以收银台为准。</p></details><details ${rulesOpen ? 'open' : ''}><summary>历史规则与生效时间</summary><div class="history-entry"><strong>growth-v1 · 当前有效</strong><p>生效时间：2026-10-20 00:00（北京时间，原型示例）<br>已支付订单保留确认时的规则快照。</p></div>${historyError ? '<p role="alert">历史版本暂时无法读取</p><button data-action="retry-history" class="quiet">重新加载</button>' : historyMore ? '<div class="history-entry"><strong>历史版本示例 · 已结束</strong><p>生效区间：2026-10-01 至 2026-10-19（原型示例）。实际产品仅展示真实已生效记录。</p></div><small>已显示全部示例</small>' : '<button data-action="more-history" class="quiet">加载更多历史版本</button>'}</details></section>`;
}
function growth() {
  let content = '';
  if (growthTab === 'benefits') content = `<h2>每一步，都有所积累</h2><div class="level-list">${levelNames.map((name, i) => `<div class="level-row ${i === 2 ? 'current' : ''}"><span class="level-icon">${['一', '二', '三', '四', '五'][i]}</span><div><h3>L${i + 1} ${name} ${i === 2 ? '<small class="tag">当前</small>' : ''}</h3><p>指定商品 ${goods[i]} · 参与服务 ${services[i]}</p></div><small>${thresholds[i].toLocaleString()}<br>成长值</small></div>`).join('')}</div>${rules()}`;
  if (growthTab === 'profile') content = '<div class="growth-summary"><span class="tag">L3 笃行</span><strong>1,250</strong><div class="row"><small>成长值</small><small>待入账 +120</small></div><progress value="250" max="2000" aria-label="距离下一级的成长进度"></progress><small>距 L4 致远还差 1,750</small></div><button data-growth="benefits" class="quiet full">查看等级权益 →</button>';
  if (growthTab === 'tasks') content = '<h2>把成长放进日常</h2><div class="material-row"><span>完善个人资料<small>一次性任务</small></span><button data-action="task" class="quiet">去完成</button></div><div class="material-row"><span>精选学习<small>有效学习后按规则入账</small></span><button data-action="task" class="quiet">去看看</button></div><div class="material-row"><span>记录一件小事<small>个人记录默认私密</small></span><button data-action="task" class="quiet">去记录</button></div>';
  if (growthTab === 'records') content = '<h2>成长明细</h2><div class="material-row"><span>有效学习<small>今日 · 已入账</small></span><span>+5</span></div><div class="material-row"><span>商品交易<small>10 月 19 日 · 待观察</small></span><span>+120</span></div><div class="material-row"><span>退款扣回<small>10 月 18 日 · 原订单重算</small></span><span>−20</span></div><button data-action="current-rules" class="quiet full">查看当前规则 →</button>';
  return `<nav class="growth-tabs" aria-label="成长中心四个入口">${[['profile', '成长档案'], ['tasks', '成长任务'], ['records', '成长明细'], ['benefits', '等级权益']].map(([id, title]) => `<button data-growth="${id}" aria-pressed="${growthTab === id}">${title}</button>`).join('')}</nav><div class="page-pad">${content}</div>`;
}
// Local excerpt of the platform catalogue; no live business request.
const serviceTypes = [{ code: 'S001', name: '祈福' }, { code: 'S002', name: '供灯' }, { code: 'S004', name: '还愿' }];
const enabledTags = row => (row.serviceTags || []).filter(tag => tag.status == null || tag.status === '' || tag.status === 'enabled');
const serviceSummary = row => {
  const tags = enabledTags(row);
  const ordered = serviceCode ? [...tags.filter(tag => tag.serviceCode === serviceCode), ...tags.filter(tag => tag.serviceCode !== serviceCode)] : tags;
  return ordered.slice(0, 2).map(tag => serviceTypes.find(service => service.code === tag.serviceCode)?.name || tag.serviceCode).join(' · ');
};
function directory() {
  const temples = [{ name: '灵隐寺', region: '大陆', belief: '汉传佛教', price: 0, services: '祈福 · 供灯' }, { name: '文武庙', region: '香港', belief: '民间信仰', price: 0, services: '祈福 · 还愿' }];
  const rows = page === 'temple' ? temples : [
    { name: '明觉居士', region: '大陆', belief: '汉传佛教', tradition: '禅宗', identity: '居士', price: 48, serviceTags: [{ serviceCode: 'S001', status: 'enabled' }, { serviceCode: 'S002' }, { serviceCode: 'S004', status: 'enabled' }] },
    { name: '云游道人', region: '大陆', belief: '道教', identity: '道长', price: 88, serviceTags: [{ serviceCode: 'S001', status: '' }, { serviceCode: 'S002', status: 'disabled' }] },
    { name: '紫微先生', region: '台湾', belief: '民间信仰', identity: '先生', price: 108, serviceTags: [{ serviceCode: 'S004', status: 'enabled' }] },
  ];
  const matches = rows.filter(row => (belief === '全部' || belief === row.belief) && (region === '地区' || row.region === region) && (page === 'temple' || !serviceCode || enabledTags(row).some(tag => tag.serviceCode === serviceCode)) && (page === 'temple' || tradition === '全部宗派' || row.tradition === tradition) && (page === 'temple' || priceBand === '全部' || row.price <= 100) && directoryQuery.trim().split(/\s+/).every(term => `${row.name} ${row.region} ${row.belief} ${row.identity || ''} ${row.services || enabledTags(row).map(tag => serviceTypes.find(service => service.code === tag.serviceCode)?.name || tag.serviceCode).join(' ')}`.includes(term)));
  const choices = directoryPanel === 'region' ? ['地区', '大陆', '香港', '澳门', '台湾', '东南亚'] : ['全部宗派', '禅宗', '净土宗'];
  return `<div class="search"><input id="directory-search" type="search" aria-label="搜索名字、标签、服务或地区" placeholder="搜索名字、标签、服务或地区" value="${escapeHtml(directoryQuery)}"><button data-action="directory-search">搜索</button></div><div class="directory-bar"><div class="directory-types"><nav aria-label="宗教类型">${['全部', '汉传佛教', '藏传佛教', '南传佛教', '道教', '民间信仰'].map(name => `<button data-belief="${name}" aria-pressed="${belief === name}">${name}</button>`).join('')}</nav><button data-action="region" aria-expanded="${directoryPanel === 'region'}" aria-haspopup="true">⌖ ${region}</button></div>${directoryPanel ? `<div class="popover" aria-label="${directoryPanel === 'region' ? '地区' : '宗派'}选择">${choices.map(name => `<button data-${directoryPanel === 'region' ? 'region' : 'tradition'}="${name}">${name === '地区' ? '全部地区' : name}</button>`).join('')}</div>` : ''}</div><div class="directory-body"><aside class="directory-sidebar" ${page === 'temple' ? 'hidden' : ''}><details open><summary>提供服务</summary><button data-service="" aria-pressed="${!serviceCode}">全部</button>${serviceTypes.map(service => `<button data-service="${service.code}" aria-pressed="${serviceCode === service.code}">${service.name}</button>`).join('')}</details><details><summary>价格区间</summary>${['全部', '¥0–100'].map(name => `<button data-price="${name}" aria-pressed="${priceBand === name}">${name}</button>`).join('')}</details><button data-action="clear-directory">全部清除</button></aside><div class="directory-results">${matches.map(row => `<article class="master-card"><div class="master-person"><div class="avatar" aria-hidden="true">${row.name[0]}</div><div><h3>${row.name}</h3><p>⌖ ${row.region}</p></div></div><div class="row services"><span>${page === 'temple' ? row.services : serviceSummary(row)}</span>${page === 'temple' ? '<span>查看寺院 ›</span>' : `<strong>¥${row.price}起</strong>`}</div></article>`).join('') || '<p class="empty-list">没有匹配的结果</p>'}</div></div><p class="directory-explanation">${page === 'temple' ? '此页为寺院公开目录简例，完整服务侧栏沿用 v3。' : '原型使用 3 位示例人物和标准服务目录节选；以服务编码匹配启用标签，支持组合筛选。'}这里只示意汉传子派浮层，其他子派归属沿用完整产品目录。</p>`;
}
function go(target) { page = target; directoryPanel = ''; render(); $('screen').scrollTop = 0; }
function notify(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500); }
function modal(title, body, confirm, action) { $('dialog-title').textContent = title; $('dialog-body').innerHTML = body; $('dialog-confirm').textContent = confirm || ''; $('dialog-confirm').hidden = !confirm; $('dialog-cancel').textContent = confirm ? '取消' : '关闭'; dialogAction = action; $('dialog').showModal(); }
function manage() { const e = eligibility(state); if (publicVersion(state) && !draftChanged(state)) { modal('已发布', '<p>当前个人稿与已发布定稿款式相同。可以继续编辑个人稿，或在列表中独立下架作品。</p>', '查看公开定稿', () => go('detail')); return; } modal(state.publication?.active ? '发布管理' : '发布作品', `<p>${e.reason}</p>${state.publication?.active ? '<p>已发布定稿独立保留。再次发布只会新增定稿，不覆盖历史订单。</p>' : ''}`, e.allowed ? (state.publication?.active ? '发布新定稿' : '确认发布') : e.action === 'retry' ? '重新读取' : e.action === 'order' ? '去定制' : '查看订单', () => { if (e.allowed) { publish(state); render(); notify('示例定稿已发布'); } else if (e.action === 'retry') { state.error = false; manage(); } else orderInfo(); }); }
function orderInfo() { modal('定制进度', `<p>${eligibility(state).reason}</p><p>款式、用料和价格确认后才能发布。真实订单仍需库存、报价、支付和商家审核。</p><p class="muted">本原型不创建订单。可用右侧“已付款且确认”场景继续评审。</p>`, null); }
function showRules() { page = 'growth'; growthTab = 'benefits'; rulesOpen = true; render(); $('growth-rules').scrollIntoView({ block: 'start' }); }
function render() {
  const pages = { home, mine, plaza, detail, editor, growth, directory, temple: directory, points: () => '<div class="blank"><h2>积分中心</h2><p>核心入口平级展示，不在首页显示虚构账户余额。</p><button data-page="home" class="quiet">回到首页</button></div>' };
  document.body.classList.toggle('wide-home-preview', widePreview && page === 'home');
  $('wide-preview').setAttribute('aria-pressed', String(widePreview));
  $('wide-preview').textContent = widePreview ? '标准首页宽度' : '宽屏首页';
  $('screen').innerHTML = (pages[page] || home)();
  $('page-title').textContent = ({ home: '问玄东方', mine: '东方珠作', plaza: '东方珠作', detail: '作品详情', editor: '东方珠作', growth: '我的成长', directory: '找师傅', temple: '找寺院', points: '积分中心' })[page];
  $('header-action').textContent = page === 'home' ? '搜索' : page === 'growth' ? '规则' : page === 'detail' ? '分享' : '';
  document.querySelectorAll('.review-nav [data-page]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.page === page)));
  document.querySelectorAll('.bottom-nav [data-page]').forEach(node => node.dataset.page === page ? node.setAttribute('aria-current', 'page') : node.removeAttribute('aria-current'));
  $('scenario-note').textContent = eligibility(state).reason;
  $('snapshot-note').textContent = state.publication ? `当前个人稿 ${state.draft.beads.length} 颗 / ${money(amount(state.draft))}；公开定稿 v${state.publication.id}：${state.publication.design.beads.length} 颗 / ${money(state.publication.price)}。受益来源：创作者 #${state.publication.beneficiary}。` : '当前只有个人设计稿；复制已有作品不继承发布资格。';
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) { if (directoryPanel && !event.target.closest('.directory-bar')) { directoryPanel = ''; render(); } return; }
  if (button.dataset.page) { go(button.dataset.page); return; }
  if (button.dataset.faith) { belief = button.dataset.faith; go('directory'); return; }
  if (button.dataset.wish) { directoryQuery = button.dataset.wish; go('directory'); return; }
  if (button.dataset.growth) { growthTab = button.dataset.growth; render(); $('screen').scrollTop = 0; return; }
  if (button.dataset.material) { if (state.draft.beads.length < 60) state.draft.beads.push(button.dataset.material); render(); return; }
  if (button.dataset.belief) { belief = button.dataset.belief; tradition = '全部宗派'; directoryPanel = belief === '汉传佛教' ? directoryPanel === 'tradition' ? '' : 'tradition' : ''; render(); return; }
  if (button.dataset.region) { region = button.dataset.region; directoryPanel = ''; render(); return; }
  if (button.dataset.tradition) { tradition = button.dataset.tradition; directoryPanel = ''; render(); return; }
  if ('service' in button.dataset) { serviceCode = button.dataset.service; render(); return; }
  if (button.dataset.price) { priceBand = button.dataset.price; render(); return; }
  const action = button.dataset.action;
  if (action === 'clear-directory') { serviceCode = ''; belief = '全部'; tradition = '全部宗派'; region = '地区'; directoryQuery = ''; priceBand = '全部'; directoryPanel = ''; render(); }
  if (action === 'manage') manage();
  if (action === 'unpublish') modal('下架作品', '<p>从广场隐藏当前定稿。个人稿、已有订单与历史返现凭证保留。</p>', '确认下架', () => { unpublish(state); render(); notify('示例作品已下架'); });
  if (action === 'copy') { copyPublished(state); go('editor'); notify('已复制到个人稿，需独立付款确认后发布'); }
  if (action === 'save') { go('mine'); notify(state.publication?.active ? '已保存个人稿，公开定稿未改变' : '已保存个人稿'); }
  if (action === 'new') { state = createState('draft'); state.draft.title = '我的手串'; state.draft.beads = ['green']; go('editor'); }
  if (action === 'order' || action === 'progress' || action === 'customize-public') orderInfo();
  if (action === 'task') notify('任务流程沿用成长方案，本页不提交任务记录');
  if (action === 'current-rules') showRules();
  if (action === 'more-history') { rulesOpen = true; if (!historyRetried) historyError = true; else historyMore = true; render(); }
  if (action === 'retry-history') { rulesOpen = true; historyError = false; historyMore = true; historyRetried = true; render(); }
  if (action === 'region') { directoryPanel = directoryPanel === 'region' ? '' : 'region'; render(); }
  if (action === 'directory-search') { directoryQuery = $('directory-search').value; directoryPanel = ''; render(); }
  if (action === 'work-search') { workQuery = $('work-search').value; render(); }
  if (action === 'plaza-search') { const value = $('plaza-search').value; if (!publicVersion(state)?.design.title.includes(value)) notify('没有匹配的示例作品'); else notify('已显示匹配的定稿'); }
});
$('back').addEventListener('click', () => go(page === 'editor' ? 'mine' : page === 'detail' ? 'plaza' : 'home'));
$('header-action').addEventListener('click', () => { if (page === 'growth') showRules(); else if (page === 'detail') notify('原型未生成外部分享链接'); else modal('全站搜索', '<p>首页搜索站内功能和公开内容；目录页仅搜索本列表。完整搜索示例见 v3 原型，生产范围见标准产品方案。</p>', null); });
$('dialog-cancel').addEventListener('click', () => $('dialog').close());
$('dialog-confirm').addEventListener('click', () => { const action = dialogAction; $('dialog').close(); action?.(); });
$('scenario').addEventListener('change', event => { const value = event.target.value; if (value === 'ready') confirmExampleOrder(state); else state = createState(value); workQuery = ''; go('mine'); });
$('reset').addEventListener('click', () => { state = createState(); $('scenario').value = 'published'; historyMore = false; historyError = false; historyRetried = false; rulesOpen = false; workQuery = ''; go('home'); });
$('theme').addEventListener('click', () => { const dark = document.body.classList.toggle('dark'); $('theme').setAttribute('aria-pressed', dark); $('theme').textContent = dark ? '浅色' : '深色'; });
$('large-text').addEventListener('click', () => { const large = document.body.classList.toggle('large-text'); $('large-text').setAttribute('aria-pressed', large); });
$('wide-preview').addEventListener('click', () => { widePreview = !widePreview; go('home'); document.querySelector('.app').scrollIntoView({ block: 'start' }); });
$('old-rules').addEventListener('click', showRules);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && directoryPanel) { directoryPanel = ''; render(); } if (event.key === 'Enter' && event.target.id === 'directory-search') { directoryQuery = event.target.value; render(); } if (event.key === 'Enter' && event.target.id === 'work-search') { workQuery = event.target.value; render(); } });
if (new URLSearchParams(location.search).get('tab') === 'rules') { page = 'growth'; growthTab = 'benefits'; rulesOpen = true; }
render();
if (rulesOpen) $('growth-rules').scrollIntoView({ block: 'start' });
