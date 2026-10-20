import { distance, pathLength, simplifyRDP } from './brushMath.js';

const mean = values => values.reduce((sum, n) => sum + n, 0) / values.length;

function filtered(points) {
  const out = [];
  for (const point of points) if (!out.length || distance(point, out.at(-1)) >= 3) out.push(point);
  return out;
}

function mergeFlatCorners(points) {
  const corners = [...points];
  let changed = true;
  while (changed && corners.length > 3) {
    changed = false;
    for (let i = 0; i < corners.length; i++) {
      const prev = corners[(i + corners.length - 1) % corners.length];
      const current = corners[i];
      const next = corners[(i + 1) % corners.length];
      const ux = current.x - prev.x, uy = current.y - prev.y;
      const vx = next.x - current.x, vy = next.y - current.y;
      const cross = Math.abs(ux * vy - uy * vx) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1);
      if (cross < .22) { corners.splice(i, 1); changed = true; break; }
    }
  }
  return corners;
}

function fittedLine(points) {
  const cx = mean(points.map(p => p.x)), cy = mean(points.map(p => p.y));
  const xx = mean(points.map(p => (p.x - cx) ** 2));
  const yy = mean(points.map(p => (p.y - cy) ** 2));
  const xy = mean(points.map(p => (p.x - cx) * (p.y - cy)));
  const angle = .5 * Math.atan2(2 * xy, xx - yy);
  const ux = Math.cos(angle), uy = Math.sin(angle);
  const projections = points.map(p => (p.x - cx) * ux + (p.y - cy) * uy);
  const lo = Math.min(...projections), hi = Math.max(...projections);
  return [{ x: cx + lo * ux, y: cy + lo * uy }, { x: cx + hi * ux, y: cy + hi * uy }];
}

function isRectangle(points) {
  if (points.length !== 4) return false;
  return points.every((p, i) => {
    const prev = points[(i + 3) % 4], next = points[(i + 1) % 4];
    const u = { x: prev.x - p.x, y: prev.y - p.y };
    const v = { x: next.x - p.x, y: next.y - p.y };
    return Math.abs(u.x * v.x + u.y * v.y) / ((Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)) || 1) < .32;
  });
}

function regularizeRectangle(points) {
  const aligned = points.every((p, i) => {
    const next = points[(i + 1) % 4];
    const dx = Math.abs(next.x - p.x), dy = Math.abs(next.y - p.y);
    return Math.min(dx, dy) / (Math.hypot(dx, dy) || 1) < .1;
  });
  if (aligned) {
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const left = Math.min(...xs), right = Math.max(...xs);
    const top = Math.min(...ys), bottom = Math.max(...ys);
    return [{ x: left, y: top }, { x: right, y: top },
      { x: right, y: bottom }, { x: left, y: bottom }];
  }
  const center = { x: mean(points.map(p => p.x)), y: mean(points.map(p => p.y)) };
  const edge = { x: points[1].x - points[0].x, y: points[1].y - points[0].y };
  const length = Math.hypot(edge.x, edge.y);
  const u = { x: edge.x / length, y: edge.y / length }, v = { x: -u.y, y: u.x };
  const extents = points.map(p => ({ a: (p.x - center.x) * u.x + (p.y - center.y) * u.y,
    b: (p.x - center.x) * v.x + (p.y - center.y) * v.y }));
  const halfA = (Math.max(...extents.map(p => p.a)) - Math.min(...extents.map(p => p.a))) / 2;
  const halfB = (Math.max(...extents.map(p => p.b)) - Math.min(...extents.map(p => p.b))) / 2;
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => ({
    x: center.x + a * halfA * u.x + b * halfB * v.x,
    y: center.y + a * halfA * u.y + b * halfB * v.y
  }));
}

export function recognizeStroke(raw) {
  const points = filtered(raw);
  if (points.length < 2 || pathLength(points) < 26) return null;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const span = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const closed = points.length >= 9 && pathLength(points) > 150 &&
    distance(points[0], points.at(-1)) < Math.max(27, Math.min(56, span * .12));
  if (!closed) return { type: 'line', points: fittedLine(points) };

  const ring = points.slice(0, -1);
  let vertices = [];
  for (let tolerance = 10; tolerance <= 32; tolerance += 4) {
    vertices = mergeFlatCorners(simplifyRDP([...ring, ring[0]], tolerance).slice(0, -1));
    if (vertices.length <= 6) break;
  }
  if (isRectangle(vertices)) return { type: 'rectangle', points: regularizeRectangle(vertices) };
  if (vertices.length >= 3 && vertices.length <= 6) {
    return { type: vertices.length === 3 ? 'triangle' : 'polygon', points: vertices };
  }
  const center = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  const radii = ring.map(p => distance(p, center));
  const radius = mean(radii);
  const radialVariation = Math.sqrt(mean(radii.map(r => (r - radius) ** 2))) / radius;
  const aspect = (Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys) || 1);
  if (radius > 36 && aspect > .78 && aspect < 1.28 && radialVariation < .03) {
    const circle = Array.from({ length: 48 }, (_, i) => ({
      x: center.x + radius * Math.cos(i * Math.PI / 24),
      y: center.y + radius * Math.sin(i * Math.PI / 24)
    }));
    return { type: 'circle', points: circle, center, radius };
  }

  if (vertices.length < 3) return { type: 'line', points: fittedLine(points) };
  return { type: vertices.length === 3 ? 'triangle' : 'polygon', points: vertices };
}
