const INSIDE=0, LEFT=1, RIGHT=2, BOTTOM=4, TOP=8;

function code(p,r){
  let c=INSIDE;
  if(p.x<r.xMin)c|=LEFT; else if(p.x>r.xMax)c|=RIGHT;
  if(p.y<r.yMin)c|=TOP; else if(p.y>r.yMax)c|=BOTTOM;
  return c;
}

export function clipLine(p0,p1,r){
  let a={...p0}, b={...p1}, ca=code(a,r), cb=code(b,r);
  while(true){
    if(!(ca|cb)) return [a,b];
    if(ca&cb) return null;
    const out=ca||cb;
    let x,y;
    if(out&TOP){x=a.x+(b.x-a.x)*(r.yMin-a.y)/(b.y-a.y);y=r.yMin;}
    else if(out&BOTTOM){x=a.x+(b.x-a.x)*(r.yMax-a.y)/(b.y-a.y);y=r.yMax;}
    else if(out&RIGHT){y=a.y+(b.y-a.y)*(r.xMax-a.x)/(b.x-a.x);x=r.xMax;}
    else {y=a.y+(b.y-a.y)*(r.xMin-a.x)/(b.x-a.x);x=r.xMin;}
    if(out===ca){a={x,y};ca=code(a,r);} else {b={x,y};cb=code(b,r);}
  }
}
