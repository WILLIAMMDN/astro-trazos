export class DebugOverlay {
  constructor(){this.fps=0;}
  update(dt){if(dt>0)this.fps=Math.round(1/dt);}
  draw(ctx){
    ctx.save();
    ctx.fillStyle="rgba(0,0,0,.55)";
    ctx.fillRect(20,620,280,74);
    ctx.fillStyle="#fff";
    ctx.font="16px monospace";
    ctx.fillText("F1: modo académico (próximo)",32,648);
    ctx.fillText(`FPS: ${this.fps}`,32,674);
    ctx.restore();
  }
}
