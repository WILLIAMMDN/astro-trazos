export class Mat3 {
  static identity() {
    return [1,0,0, 0,1,0, 0,0,1];
  }

  static translation(tx, ty) {
    return [1,0,tx, 0,1,ty, 0,0,1];
  }

  static rotation(rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return [c,-s,0, s,c,0, 0,0,1];
  }

  static scale(sx, sy) {
    return [sx,0,0, 0,sy,0, 0,0,1];
  }

  static multiply(a, b) {
    const r = new Array(9).fill(0);
    for (let row=0; row<3; row++) {
      for (let col=0; col<3; col++) {
        for (let k=0; k<3; k++) r[row*3+col] += a[row*3+k] * b[k*3+col];
      }
    }
    return r;
  }

  static transformPoint(m, p) {
    return {
      x: m[0]*p.x + m[1]*p.y + m[2],
      y: m[3]*p.x + m[4]*p.y + m[5],
    };
  }
}
