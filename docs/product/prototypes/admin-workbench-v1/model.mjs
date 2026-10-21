// Product prototype only. All records are fictional and live in memory.
export const beliefs = [
  ['han_buddhism','汉传佛教'], ['tibetan_buddhism','藏传佛教'],
  ['theravada_buddhism','南传佛教'], ['daoism','道教'], ['folk','民间信仰'],
];
export const regions = [['mainland','大陆'],['hong_kong','香港'],['macau','澳门'],['taiwan','台湾'],['southeast_asia','东南亚']];
export const traditions = [
  ['chan','禅宗','han_buddhism'],['pure_land','净土宗','han_buddhism'],['tiantai','天台宗','han_buddhism'],['huayan','华严宗','han_buddhism'],
  ['gelug','格鲁派','tibetan_buddhism'],['nyingma','宁玛派','tibetan_buddhism'],['kagyu','噶举派','tibetan_buddhism'],['sakya','萨迦派','tibetan_buddhism'],
  ['theravada','上座部传统','theravada_buddhism'],['quanzhen','全真派','daoism'],['zhengyi','正一派','daoism'],
  ['mazu','妈祖 / 天后','folk'],['guandi','关帝信俗','folk'],['chenghuang','城隍信俗','folk'],['wangye','王爷信俗','folk'],['fude','福德正神','folk'],
  ['baosheng','保生大帝','folk'],['nezha','哪吒信俗','folk'],['hung_shing','洪圣信俗','folk'],['wong_tai_sin','黄大仙信俗','folk'],
  ['nine_emperors','九皇爷信俗','folk'],['tua_pek_kong','大伯公信俗','folk'],['datuk_gong','拿督公信俗','folk'],['sanshan','三山国王','folk'],
];
export const services = ['祈福','供灯','上香','还愿','超度','开光','化太岁','求姻缘','求财运','求事业','求风水','求健康','求学业'].map((name,i)=>[`S${String(i+1).padStart(3,'0')}`,name]);
export const wishes = [['peace','求平安'],['wealth','求财运'],['love','求姻缘'],['career','求事业'],['study','求学业'],['taisui','化太岁'],['rite','做法事']];
export const wishNames = wishes.map(x=>x[1]);
export const label = (items, code) => items.find(x=>x[0]===code)?.[1] || code || '未设置';
const copy = x => structuredClone(x);
export const lenses = {
  platform: {name:'平台管理视角', scope:'全平台 · 原型示意', pages:['home','providers','services','commerce','reviews','finance','content','standards','permissions']},
  temple: {name:'寺院管理视角', scope:'仅示例寺院与所属师傅', pages:['home','providers','services','reviews','finance','permissions']},
  master: {name:'师傅本人视角', scope:'仅本人资料与履约任务', pages:['home','providers','services','finance','permissions']},
  shop: {name:'商城运营视角', scope:'仅商城经营与订单', pages:['home','commerce','permissions']},
};
export function createState() {
  return {
    lens:'platform', page:'home', theme:'light', kind:'temple', filters:{q:'',belief:'',tradition:'',region:''}, number:1, size:3,
    providers:[
      {id:'DEMO-T01',kind:'temple',name:'澄和宫',belief:'folk',tags:['mazu','guandi'],sect:'妈祖信俗',region:'mainland',address:'福建莆田 · 原型示例地址',services:['S001','S002'],wishMode:'inherit',customWishes:[],version:1},
      {id:'DEMO-T02',kind:'temple',name:'听松禅院',belief:'han_buddhism',tags:['chan'],sect:'禅宗',region:'mainland',address:'浙江杭州 · 原型示例地址',services:['S001','S002','S006'],wishMode:'inherit',customWishes:[],version:1},
      {id:'DEMO-T03',kind:'temple',name:'知礼宫',belief:'folk',tags:['mazu','nezha'],sect:'妈祖信俗',region:'macau',address:'澳门 · 原型示例地址',services:['S001'],wishMode:'inherit',customWishes:[],version:1},
      {id:'DEMO-T04',kind:'temple',name:'清和道院',belief:'daoism',tags:['quanzhen'],sect:'全真派',region:'hong_kong',address:'香港新界 · 原型示例地址',services:['S001','S007'],wishMode:'inherit',customWishes:[],version:1},
      {id:'DEMO-T05',kind:'temple',name:'慈航精舍',belief:'theravada_buddhism',tags:['theravada'],sect:'',region:'southeast_asia',address:'新加坡 · 原型示例地址',services:['S001'],wishMode:'inherit',customWishes:[],version:1},
      {id:'DEMO-M01',kind:'master',name:'守礼先生',belief:'folk',tags:['mazu','guandi'],sect:'民俗文化',position:'民俗文化顾问',region:'',templeId:'DEMO-T01',address:'福建莆田 · 原型示例地址',services:['S001'],wishMode:'inherit',customWishes:[],version:1},
      {id:'DEMO-M02',kind:'master',name:'明觉居士',belief:'han_buddhism',tags:['chan'],sect:'禅宗',position:'独立居士',region:'taiwan',address:'台湾台北 · 原型示例地址',services:['S001','S002'],wishMode:'inherit',customWishes:[],version:1},
    ],
    catalog:traditions.map(([code,name,parent])=>({code,name,parent,enabled:true})),
    review:[{id:'DEMO-A01',name:'澄和宫',type:'寺院资料审核',state:'初审待处理',note:''},{id:'DEMO-A02',name:'明觉居士',type:'师傅资质审核',state:'待审核',note:''},{id:'DEMO-A03',name:'守礼先生',type:'认证与入驻',state:'submitted',note:''}],
    orders:[{id:'DEMO-O01',type:'商城订单',state:'待发货',amount:268,provider:'商城',payment:'已付款'}, {id:'DEMO-D01',type:'DIY 订单',state:'待确认定稿',amount:429,provider:'东方珠作',payment:'已付款'}, {id:'DEMO-B01',type:'预约服务',state:'待执行',amount:200,provider:'澄和宫',payment:'已付款'}, {id:'DEMO-P01',type:'积分兑换',state:'待履约',amount:500,provider:'积分商城',payment:'已扣积分'}],
    homeTitle:'找寺院', homeDraft:'找寺院', logs:[], failServices:false, saveReceipt:null, notice:'',
  };
}
export function visibleProviders(s) {
  return s.providers.filter(p=>s.lens==='platform'||s.lens==='temple'&&(p.id==='DEMO-T01'||p.templeId==='DEMO-T01')||s.lens==='master'&&p.id==='DEMO-M01');
}
export function effectiveRegion(s,p) {
  if(p.region) return {code:p.region,source:'显式指定'};
  const temple=s.providers.find(t=>t.id===p.templeId);
  return {code:temple?.region||'',source:temple?'继承所属寺院':'未设置'};
}
export function filteredProviders(s) {
  const {q,belief,tradition,region}=s.filters;
  return visibleProviders(s).filter(p=>p.kind===s.kind&&(!belief||p.belief===belief)&&(!tradition||p.tags.includes(tradition))&&(!region||effectiveRegion(s,p).code===region)&&(!q||[p.name,p.id,p.address,p.sect,p.position,...p.tags.flatMap(t=>[s.catalog.find(c=>c.code===t)?.name,label(traditions,t)]),...p.services.map(t=>label(services,t))].join(' ').includes(q.trim())));
}
export function pageProviders(s) { return filteredProviders(s).slice((s.number-1)*s.size,s.number*s.size); }
export function setFilters(s, patch) { Object.assign(s.filters,patch); s.number=1; }
export function allowedTags(s) { return s.catalog.filter(t=>(t.enabled||t.code===s.filters.tradition)&&(!s.filters.belief||t.parent===s.filters.belief)); }
export function visibleLogs(s) {
  if(s.lens==='platform') return s.logs;
  const ids=visibleProviders(s).map(p=>p.id);
  if(s.lens==='shop') ids.push('DEMO-O01');
  return s.logs.filter(l=>ids.includes(l.object));
}
export function canEditProvider(s,p) { return s.lens==='platform'||s.lens==='temple'&&p.id==='DEMO-T01'; }
export function audit(s, object,action,detail) { s.logs.unshift({object,action,detail,actor:lenses[s.lens].name,time:new Date().toLocaleTimeString('zh-CN',{hour12:false})}); }
export function saveProfile(s,id,draft,expectedVersion) {
  const p=s.providers.find(p=>p.id===id);
  if(!p||!canEditProvider(s,p)) return {ok:false,message:'无权修改此资料'};
  if(p.version!==expectedVersion) return {ok:false,conflict:true,message:'资料已更新，请对比后重新保存；草稿仍保留'};
  if(!draft.name?.trim()) return {ok:false,message:'请填写名称'};
  // Only the platform can modify standardized affiliations. Historical text stays intact.
  if(s.lens==='platform') {
    if(!beliefs.some(b=>b[0]===draft.belief)||!Array.isArray(draft.tags)||draft.tags.some(t=>!s.catalog.some(c=>c.code===t))) return {ok:false,message:'请选择有效的标准分类与宗派 / 信俗'};
    const added=draft.tags.filter(t=>!p.tags.includes(t));
    if(added.some(t=>!s.catalog.find(c=>c.code===t)?.enabled)) return {ok:false,message:'已停用的标准项不可新增关联；原有关联保留'};
    if(added.some(t=>s.catalog.find(c=>c.code===t)?.parent!==draft.belief)) return {ok:false,message:'新增关联跨越分类，需要单独评审；原有关联已保留'};
    if(p.belief!==draft.belief&&draft.tags.some(t=>s.catalog.find(c=>c.code===t)?.parent!==draft.belief)) return {ok:false,message:'变更类型涉及现有关联，请先评审；没有自动移除标签'};
    if(draft.region&&!regions.some(r=>r[0]===draft.region)) return {ok:false,message:'地区编码无效'};
    p.belief=draft.belief; p.tags=copy(draft.tags);
    if(draft.region!==undefined) p.region=draft.region;
  }
  p.name=draft.name.trim(); p.address=draft.address??p.address; p.version++;
  audit(s,id,'保存资料','名称、地址及允许修改的标准归属已保存；历史文本保留');
  return {ok:true,message:'资料已保存',version:p.version};
}
export function saveServices(s,id,codes) {
  const p=s.providers.find(x=>x.id===id);
  if(!p||!canEditProvider(s,p)) return {ok:false,message:'无权修改此服务'};
  if(codes.some(c=>!services.some(x=>x[0]===c))) return {ok:false,message:'服务编码无效'};
  if(s.failServices) { s.failServices=false; return {ok:false,retryable:true,message:'服务保存超时；已保存的资料不回滚，服务草稿仍保留'}; }
  p.services=copy(codes); audit(s,id,'保存服务','仅更新本段；不改变历史订单或认证身份'); return {ok:true,message:'服务标签已保存'};
}
export function changeCatalog(s,code,{name,enabled}) {
  if(s.lens!=='platform') return {ok:false,message:'此视角仅可查看基础标准'};
  const item=s.catalog.find(t=>t.code===code);
  if(!item||!name?.trim()) return {ok:false,message:'请填写展示名称'};
  item.name=name.trim(); item.enabled=enabled;
  const count=s.providers.filter(p=>p.tags.includes(code)).length;
  audit(s,code,enabled?'更新标准项':'停用标准项',`保留 ${count} 个示例关联与历史快照；编码未变`);
  return {ok:true,count,message:enabled?'标准项已更新':'已停用；既有关联保留，新关联不可选'};
}
export function reviewAction(s,id,action,note='') {
  if(s.lens!=='platform') return {ok:false,message:'此视角不提供平台审批'};
  const item=s.review.find(x=>x.id===id);
  if(!item) return {ok:false,message:'审核对象不存在'};
  if(action==='reject'&&!note.trim()) return {ok:false,message:'请填写退回原因'};
  if(action==='approve'&&item.state==='初审待处理') item.state='终审待处理';
  else if(action==='approve'&&item.state==='终审待处理') item.state='已通过';
  else if(action==='approve'&&item.state==='待审核') item.state='已通过';
  else if(action==='approve'&&item.state==='submitted') item.state='approved';
  else if(action==='reject'&&['初审待处理','终审待处理','待审核','submitted'].includes(item.state)) item.state=item.type==='认证与入驻'?'rejected':'已退回';
  else return {ok:false,message:'当前状态不允许此操作'};
  item.note=note; audit(s,id,action==='approve'?'审核通过本阶段':'退回补充',item.state); return {ok:true,message:`本阶段处理完成：${item.state}`};
}
export function confirmDiy(s,id) {
  if(s.lens!=='platform') return {ok:false,message:'无权确认此设计定稿'};
  const order=s.orders.find(o=>o.id===id);
  if(!order||order.type!=='DIY 订单'||order.payment!=='已付款'||order.state!=='待确认定稿') return {ok:false,message:'需订单已付款并完成确认'};
  order.state='已确认定稿'; order.snapshot={style:'12 颗混搭手串',materials:'小叶紫檀 4 / 星月菩提 8',amount:order.amount,version:1};
  audit(s,id,'确认定稿','已固定款式、用料和成交价格；发布资格满足，未自动发布'); return {ok:true,message:'定稿已确认，允许作者申请发布此版本'};
}
export function switchLens(s,lens) { if(!lenses[lens]) return; s.lens=lens; s.page='home'; s.kind=lens==='master'?'master':'temple'; setFilters(s,{q:'',belief:'',tradition:'',region:''}); }
