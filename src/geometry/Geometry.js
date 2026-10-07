export const distance = (a,b) => Math.hypot(b.x-a.x,b.y-a.y);
export const angle = (a,b) => Math.atan2(b.y-a.y,b.x-a.x);

export function polygonArea(points) {
  let sum = 0;
  for (let i=0; i<points.length; i++) {
    const a=points[i], b=points[(i+1)%points.length];
    sum += a.x*b.y - b.x*a.y;
  }
  return Math.abs(sum)/2;
}
