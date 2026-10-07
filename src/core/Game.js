import { Renderer } from "../render/Renderer.js";
import { DebugOverlay } from "../debug/DebugOverlay.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.renderer = new Renderer(this.ctx, canvas);
    this.debug = new DebugOverlay();
    this.lastTime = 0;
  }

  start() {
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(now) {
    const dt = Math.min((now - this.lastTime) / 1000 || 0, 1 / 30);
    this.lastTime = now;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    this.debug.update(dt);
  }

  render() {
    this.renderer.clear();
    this.renderer.drawPrototypeScene();
    this.debug.draw(this.ctx);
  }
}
