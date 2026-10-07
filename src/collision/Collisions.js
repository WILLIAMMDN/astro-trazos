export function aabb(a,b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

export function segmentIntersection(a,b,c,d) {
  const den=(a.x-b.x)*(c.y-d.y)-(a.y-b.y)*(c.x-d.x);
  if (Math.abs(den)<1e-9) return null;
  const t=((a.x-c.x)*(c.y-d.y)-(a.y-c.y)*(c.x-d.x))/den;
  const u=-((a.x-b.x)*(a.y-c.y)-(a.y-b.y)*(a.x-c.x))/den;
  if(t<0||t>1||u<0||u>1) return null;
  return {x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)};
}
