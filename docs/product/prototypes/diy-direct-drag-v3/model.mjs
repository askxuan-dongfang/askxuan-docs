// Prototype geometry is measured in CSS pixels. This is not a production renderer.
export const DRAG_START = 6;
export const DELETE_MARGIN = 24;

export function convexHull(points) {
  const sorted = [...new Map(points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
    .map(p => [`${p.x},${p.y}`, { x: p.x, y: p.y }])).values()]
    .sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length <= 2) return sorted;
  const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const half = list => {
    const result = [];
    for (const point of list) {
      while (result.length > 1 && cross(result.at(-2), result.at(-1), point) <= 0) result.pop();
      result.push(point);
    }
    return result;
  };
  const lower = half(sorted), upper = half([...sorted].reverse());
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function segmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, denominator = dx * dx + dy * dy;
  const t = denominator ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / denominator)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

export function distanceOutsideHull(point, hull) {
  // Missing/degenerate projection cannot safely authorize a deletion.
  if (hull.length < 3) return 0;
  let positive = false, negative = false, distance = Infinity;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (cross > 1e-8) positive = true;
    if (cross < -1e-8) negative = true;
    distance = Math.min(distance, segmentDistance(point, a, b));
  }
  return positive && negative ? distance : 0;
}

export function dragFeedback(start, pointer, anchor, hull) {
  const dx = pointer.x - start.x, dy = pointer.y - start.y;
  const position = { x: anchor.x + dx, y: anchor.y + dy };
  const dragging = Math.hypot(dx, dy) >= DRAG_START;
  const outside = distanceOutsideHull(position, hull);
  return { dragging, position, outside, pendingDelete: dragging && outside > DELETE_MARGIN };
}

export function reorder(items, from, to) {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return [...items];
  const next = [...items], [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function finishGesture(items, from, to, feedback, event) {
  if (event !== 'pointerup' || !feedback?.dragging || from < 0 || from >= items.length) return [...items];
  return feedback.pendingDelete ? items.filter((_, index) => index !== from) : reorder(items, from, to);
}
