#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,beliefs,traditions,regions,services,wishes,lenses,setFilters,allowedTags,filteredProviders,pageProviders,effectiveRegion,saveProfile,saveServices,changeCatalog,reviewAction,confirmDiy,switchLens,visibleProviders,visibleLogs,audit} from '../docs/product/prototypes/admin-workbench-v1/model.mjs';

let count=0;
function check(name,fn){fn();count++;console.log(`PASS ${name}`);}
check('既有基础合同：五类、24 子标签、13 服务及唯一编码',()=>{
  assert.equal(beliefs.length,5);assert.equal(traditions.length,24);assert.equal(services.length,13);
  assert.deepEqual(wishes.map(x=>x[0]),['peace','wealth','love','career','study','taisui','rite']);assert.equal(wishes[6][1],'做法事');
  assert.equal(new Set(traditions.map(t=>t[0])).size,24);assert(traditions.every(t=>beliefs.some(b=>b[0]===t[2])));
});
check('多信俗显式匹配：妈祖与关帝均命中同一示例，而禅宗不命中',()=>{
  const s=createState();for(const t of ['mazu','guandi']){setFilters(s,{belief:'folk',tradition:t});assert(filteredProviders(s).some(p=>p.id==='DEMO-T01'));}
  setFilters(s,{belief:'han_buddhism',tradition:'chan'});assert(!filteredProviders(s).some(p=>p.id==='DEMO-T01'));
});
check('零结果、地区与分页不会裁剪宗派或服务标准选项',()=>{
  const s=createState(),all=allowedTags(s).map(x=>x.code);s.number=2;assert.equal(pageProviders(s).length,2);
  for(const [region] of regions){setFilters(s,{region,q:'不存在的名字'});assert.equal(filteredProviders(s).length,0);assert.deepEqual(allowedTags(s).map(x=>x.code),all);assert.equal(services.length,13);assert.equal(s.number,1);}
});
check('寺院师傅地区覆盖与恢复继承，互不覆盖寺院原值',()=>{
  const s=createState(),p=s.providers.find(p=>p.id==='DEMO-M01');assert.equal(effectiveRegion(s,p).code,'mainland');
  let d=structuredClone(p);d.region='macau';assert(saveProfile(s,p.id,d,p.version).ok);assert.equal(effectiveRegion(s,p).code,'macau');
  d=structuredClone(p);d.region='';assert(saveProfile(s,p.id,d,p.version).ok);assert.equal(effectiveRegion(s,p).source,'继承所属寺院');assert.equal(s.providers[0].region,'mainland');
});
check('无效标准编码不产生部分字段变更',()=>{
  const s=createState(),p=s.providers[0],before=structuredClone(p),d={...structuredClone(p),name:'错误修改',belief:'daoism',tags:['quanzhen'],region:'unknown'};
  assert(!saveProfile(s,p.id,d,p.version).ok);assert.deepEqual(p,before);
});
check('改变五类不静默删除多信俗，原有跨类关联可以保留',()=>{
  const s=createState(),p=s.providers[0],d={...structuredClone(p),belief:'daoism'};assert(!saveProfile(s,p.id,d,p.version).ok);assert.deepEqual(p.tags,['mazu','guandi']);
  p.tags.push('quanzhen');const legacy=structuredClone(p);legacy.name='历史跨类保留';assert(saveProfile(s,p.id,legacy,p.version).ok);assert(p.tags.includes('quanzhen'));
});
check('既有 sect 文本不被标签首项覆盖，认证身份不被表单扩权',()=>{
  const s=createState(),p=s.providers.find(p=>p.id==='DEMO-M01'),d=structuredClone(p);d.tags=['guandi'];d.sect='篡改';d.position='方丈';assert(saveProfile(s,p.id,d,p.version).ok);assert.equal(p.sect,'民俗文化');assert.equal(p.position,'民俗文化顾问');
});
check('分段保存部分成功：服务重试不重复资料提交',()=>{
  const s=createState(),p=s.providers[0],d=structuredClone(p);d.name='已保存资料';assert(saveProfile(s,p.id,d,p.version).ok);const version=p.version;s.failServices=true;
  const r=saveServices(s,p.id,['S003']);assert(!r.ok&&r.retryable);assert.equal(p.name,'已保存资料');assert.deepEqual(p.services,['S001','S002']);
  assert(saveServices(s,p.id,['S003']).ok);assert.equal(p.version,version);assert.deepEqual(p.services,['S003']);assert.equal(s.logs.filter(l=>l.action==='保存资料').length,1);
});
check('资料版本冲突保留草稿且不覆盖已保存内容',()=>{
  const s=createState(),p=s.providers[0],d=structuredClone(p);d.name='我的草稿';p.version++;
  assert(saveProfile(s,p.id,d,d.version).conflict);assert.notEqual(p.name,d.name);assert.equal(d.name,'我的草稿');
});
check('停用标准保留关联，禁止新增停用项，展示更名不改编码',()=>{
  const s=createState();assert(changeCatalog(s,'guandi',{name:'关帝文化信俗',enabled:false}).ok);assert(s.providers[0].tags.includes('guandi'));
  const p=s.providers.find(p=>p.id==='DEMO-T03'),d=structuredClone(p);d.tags.push('guandi');assert(!saveProfile(s,p.id,d,p.version).ok);assert(!p.tags.includes('guandi'));assert.equal(s.catalog.find(t=>t.code==='guandi').code,'guandi');
});
check('停用已选条件仍明确可见，更名按新旧名字都能搜索',()=>{
  const s=createState();setFilters(s,{tradition:'guandi'});assert(changeCatalog(s,'guandi',{name:'武圣信俗',enabled:false}).ok);
  assert(allowedTags(s).some(t=>t.code==='guandi'&&!t.enabled));assert(filteredProviders(s).some(p=>p.id==='DEMO-T01'));
  setFilters(s,{tradition:'',q:'武圣信俗'});assert(filteredProviders(s).some(p=>p.id==='DEMO-T01'));
  setFilters(s,{q:'关帝'});assert(filteredProviders(s).some(p=>p.id==='DEMO-T01'));
});
check('切换视角按本人、本寺、商城范围最小开放；不能越权写标准',()=>{
  const s=createState();switchLens(s,'temple');assert.deepEqual(visibleProviders(s).map(p=>p.id),['DEMO-T01','DEMO-M01']);assert(!changeCatalog(s,'mazu',{name:'改名',enabled:false}).ok);
  let p=s.providers[0],d=structuredClone(p);d.tags=[];d.region='macau';d.name='本寺资料';assert(saveProfile(s,p.id,d,p.version).ok);assert.deepEqual(p.tags,['mazu','guandi']);assert.equal(p.region,'mainland');
  switchLens(s,'master');assert.deepEqual(visibleProviders(s).map(p=>p.id),['DEMO-M01']);p=s.providers.find(p=>p.id==='DEMO-M01');assert(!saveProfile(s,p.id,structuredClone(p),p.version).ok);
  switchLens(s,'shop');assert.equal(visibleProviders(s).length,0);assert(!lenses[s.lens].pages.includes('standards'));
});
check('寺院初审与终审独立；退回必须说明，其他审核队列不变',()=>{
  const s=createState(),other=structuredClone(s.review.slice(1));assert(reviewAction(s,'DEMO-A01','approve').ok);assert.equal(s.review[0].state,'终审待处理');assert.deepEqual(s.review.slice(1),other);
  assert(!reviewAction(s,'DEMO-A01','reject',' ').ok);assert(reviewAction(s,'DEMO-A01','approve').ok);assert.equal(s.review[0].state,'已通过');assert(!reviewAction(s,'DEMO-A01','approve').ok);
});
check('操作历史也遵守本寺与本人范围',()=>{
  const s=createState();audit(s,'DEMO-T02','他寺操作','不应跨范围显示');audit(s,'DEMO-T01','本寺操作','可见');audit(s,'DEMO-M01','本人操作','可见');
  switchLens(s,'temple');assert.deepEqual(visibleLogs(s).map(l=>l.object),['DEMO-M01','DEMO-T01']);
  switchLens(s,'master');assert.deepEqual(visibleLogs(s).map(l=>l.object),['DEMO-M01']);
  switchLens(s,'shop');assert.equal(visibleLogs(s).length,0);
});
check('DIY 发布资格：付款＋确认定稿；不可重复确认或改历史金额',()=>{
  const s=createState(),o=s.orders.find(o=>o.type==='DIY 订单');o.payment='未付款';assert(!confirmDiy(s,o.id).ok);o.payment='已付款';assert(confirmDiy(s,o.id).ok);assert.equal(o.snapshot.amount,429);const snapshot=structuredClone(o.snapshot);assert(!confirmDiy(s,o.id).ok);assert.deepEqual(o.snapshot,snapshot);assert(!('published' in o));assert(!('cashback' in o));
});
check('原型不请求业务网络、不读写用户存储或引入远程资源',()=>{
  const base=new URL('../docs/product/prototypes/admin-workbench-v1/',import.meta.url);
  const scripts=['model.mjs','prototype.mjs'].map(f=>readFileSync(new URL(f,base),'utf8')).join('\n');
  const resources=['index.html','prototype.css'].map(f=>readFileSync(new URL(f,base),'utf8')).join('\n');
  assert.doesNotMatch(scripts,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|localStorage|sessionStorage|indexedDB)\b/);
  assert.doesNotMatch(resources,/https?:\/\/|@import\b/);
});
console.log(JSON.stringify({suite:'admin-workbench-product-prototype',passed:count,failed:0,scope:'in-memory product rules, not production integration'}));
