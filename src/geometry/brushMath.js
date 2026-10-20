import { aabb, segmentIntersection as intersectSegments } from '../collision/Collisions.js';

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function pathLength(points) {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += distance(points[i - 1], points[i]);
  return length;
}

export function polygonArea(points) {
  let twiceArea = 0;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    twiceArea += points[i].x * next.y - next.x * points[i].y;
  }
  return Math.abs(twiceArea) / 2;
}

export function pointToSegmentDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return distance(p, { x: a.x + dx * t, y: a.y + dy * t });
}

export function lineDeviation(points) {
  if (points.length < 2) return Infinity;
  const a = points[0], b = points.at(-1);
  return Math.max(...points.map(p => pointToSegmentDistance(p, a, b)));
}

export function segmentIntersection(a, b, c, d) {
  return intersectSegments(a, b, c, d);
}

export function firstPathIntersection(rayStart, rayEnd, paths) {
  let first = null;
  const bounds = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x) + .01, h: Math.abs(a.y - b.y) + .01 });
  const rayBox = bounds(rayStart, rayEnd);
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      if (!aabb(rayBox, bounds(path[i - 1], path[i]))) continue;
      const hit = segmentIntersection(rayStart, rayEnd, path[i - 1], path[i]);
      if (hit && (!first || hit.t < first.t)) first = hit;
    }
  }
  return first;
}

export function hasSelfIntersection(points, jointTolerance = 0) {
  const last = points.length - 1;
  for (let i = 0; i < last; i++) {
    for (let j = i + 2; j < last; j++) {
      if (i === 0 && j === last - 1) continue;
      const hit = segmentIntersection(points[i], points[i + 1], points[j], points[j + 1]);
      if (!hit) continue;
      if (jointTolerance > 0 && [points[i], points[i + 1], points[j], points[j + 1]]
        .some(endpoint => distance(endpoint, hit) <= jointTolerance)) continue;
      return true;
    }
  }
  return false;
}

export function triangleAngle(a, b, c) {
  const u = { x: a.x - b.x, y: a.y - b.y };
  const v = { x: c.x - b.x, y: c.y - b.y };
  const cosine = (u.x * v.x + u.y * v.y) / ((Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)) || 1);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
}

export function simplifyRDP(points, tolerance) {
  if (points.length <= 2) return points;
  let max = -1, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = pointToSegmentDistance(points[i], points[0], points.at(-1));
    if (d > max) { max = d; index = i; }
  }
  if (max <= tolerance) return [points[0], points.at(-1)];
  return [...simplifyRDP(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplifyRDP(points.slice(index), tolerance)];
}

export function rectangleMetrics(points, pixelsPerUnit = 6) {
  if (!points || points.length < 4) return null;
  const closed = distance(points[0], points.at(-1)) < 48;
  if (!closed) return null;
  const corners = simplifyRDP(points, 8);
  if (distance(corners[0], corners.at(-1)) < 48) corners.pop();
  if (corners.length !== 4) return null;
  const edges = corners.map((point, i) => {
    const next = corners[(i + 1) % 4];
    return { x: next.x - point.x, y: next.y - point.y, length: distance(point, next) };
  });
  if (edges.some(edge => edge.length < 30)) return null;
  for (let i = 0; i < 4; i++) {
    const a = edges[i], b = edges[(i + 1) % 4];
    const cosine = Math.abs(a.x * b.x + a.y * b.y) / (a.length * b.length);
    if (cosine > .22) return null;
  }
  const base = Math.round(10 * (edges[0].length + edges[2].length) / (2 * pixelsPerUnit)) / 10;
  const height = Math.round(10 * (edges[1].length + edges[3].length) / (2 * pixelsPerUnit)) / 10;
  return { base, height, area: Math.round(base * height), corners };
}

export function rectangleFromDrag(start, end, region, maxInk, pixelsPerUnit = 6, stepUnits = 5) {
  const deltaX = Math.max(region[0], Math.min(region[2], end.x)) - start.x;
  const deltaY = Math.max(region[1], Math.min(region[3], end.y)) - start.y;
  const sx = Math.sign(deltaX) || 1, sy = Math.sign(deltaY) || 1;
  let width = Math.round(Math.abs(deltaX) / (pixelsPerUnit * stepUnits)) * stepUnits;
  let height = Math.round(Math.abs(deltaY) / (pixelsPerUnit * stepUnits)) * stepUnits;
  width = Math.min(width, Math.floor(((sx > 0 ? region[2] - start.x : start.x - region[0])) / (pixelsPerUnit * stepUnits)) * stepUnits);
  height = Math.min(height, Math.floor(((sy > 0 ? region[3] - start.y : start.y - region[1])) / (pixelsPerUnit * stepUnits)) * stepUnits);
  const maxSum = Math.floor(maxInk / (2 * pixelsPerUnit));
  if (width + height > maxSum) {
    const factor = maxSum / (width + height);
    width = Math.floor(width * factor / stepUnits) * stepUnits;
    height = Math.min(height, Math.floor((maxSum - width) / stepUnits) * stepUnits);
  }
  const x = start.x + sx * width * pixelsPerUnit;
  const y = start.y + sy * height * pixelsPerUnit;
  return [start, { x, y: start.y }, { x, y }, { x: start.x, y }, start];
}
