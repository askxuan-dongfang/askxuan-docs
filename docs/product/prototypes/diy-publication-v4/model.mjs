// Product prototype only: deterministic, in-memory examples. Not an API or payment validator.
export const materials = {
  green: { name: '绿檀圆珠', spec: '10mm', color: '#648765', unit: 2800 },
  gold: { name: '星月菩提', spec: '10mm', color: '#d7c78f', unit: 1800 },
  jade: { name: '白玉圆珠', spec: '10mm', color: '#d9dfd0', unit: 3500 },
};
const clone = value => JSON.parse(JSON.stringify(value));
export const recipeKey = design => JSON.stringify({ beads: design.beads, cord: design.cord, wrist: design.wrist, allowance: design.allowance });
export const amount = design => design.beads.reduce((sum, key) => sum + materials[key].unit, 0);
export function createState(scenario = 'published') {
  const draft = { title: '松间一念', beads: Array.from({ length: 18 }, (_, i) => i % 4 === 0 ? 'gold' : 'green'), cord: '弹力绳', wrist: 16, allowance: 0.5 };
  const state = { owner: 1, draft, order: null, publication: null, nextVersion: 1, source: null, error: false };
  if (scenario !== 'draft' && scenario !== 'error') state.order = { owner: 1, payment: 'paid', confirmed: true, status: 'in_making', recipe: recipeKey(draft), price: amount(draft), design: clone(draft) };
  if (scenario === 'unpaid') state.order.payment = 'unpaid';
  if (scenario === 'simulated') state.order.payment = 'simulated';
  if (scenario === 'review') { state.order.confirmed = false; state.order.status = 'pending_review'; }
  if (['published', 'edited', 'refund'].includes(scenario)) publish(state);
  if (scenario === 'edited') state.draft.beads[0] = 'jade';
  if (scenario === 'refund') state.order.status = 'after_sale';
  if (scenario === 'error') state.error = true;
  return state;
}
export function eligibility(state) {
  if (state.error) return { allowed: false, reason: '发布资格暂时无法读取，请重试。', action: 'retry' };
  const order = state.order;
  if (!order || order.owner !== state.owner) return { allowed: false, reason: '完成本款定制、付款并确认后，即可发布。', action: 'order' };
  if (['cancelled', 'after_sale', 'refunding', 'refunded'].includes(order.status)) return { allowed: false, reason: '该订单取消、售后或退款中，暂不可发布。', action: 'progress' };
  if (order.payment !== 'paid') return { allowed: false, reason: order.payment === 'simulated' ? '模拟付款不满足发布条件。' : '订单尚未付款，付款并确认后可发布。', action: 'progress' };
  if (!order.confirmed) return { allowed: false, reason: '已付款，等待款式、用料和价格确认。', action: 'progress' };
  if (order.recipe !== recipeKey(state.draft)) return { allowed: false, reason: '草稿款式已改变，需为新款重新下单、付款并确认。', action: 'order' };
  return { allowed: true, reason: '款式、用料和价格已确认，可以发布定稿。', action: 'publish' };
}
export function publicVersion(state) {
  if (!state.publication?.active) return null;
  if (state.publication.order && ['cancelled', 'after_sale', 'refunding', 'refunded'].includes(state.publication.order.status)) return null;
  return state.publication;
}
export function draftChanged(state) { return !!state.publication && recipeKey(state.draft) !== recipeKey(state.publication.design); }
export function publish(state) {
  if (!eligibility(state).allowed) return false;
  const sourceMatches = state.source && state.source.recipe === recipeKey(state.draft);
  const beneficiary = sourceMatches ? state.source.beneficiary : state.owner;
  state.publication = { id: state.nextVersion++, author: state.owner, beneficiary, design: clone(state.draft), price: state.order.price, order: state.order, active: true };
  return true;
}
export function unpublish(state) { if (state.publication) state.publication.active = false; }
export function copyPublished(state) {
  const work = publicVersion(state);
  if (!work) return false;
  const design = clone(work.design);
  design.title += ' · 副本';
  state.source = { beneficiary: work.beneficiary, recipe: recipeKey(work.design), version: work.id };
  state.draft = design;
  state.order = null;
  state.publication = null;
  state.error = false;
  return true;
}
export function confirmExampleOrder(state) {
  state.error = false;
  state.order = { owner: state.owner, payment: 'paid', confirmed: true, status: 'in_making', recipe: recipeKey(state.draft), price: amount(state.draft), design: clone(state.draft) };
}
