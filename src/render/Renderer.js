export class Renderer {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPrototypeScene() {
    const g = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    g.addColorStop(0, "#17153b");
    g.addColorStop(1, "#24285a");
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "#f6f0dc";
    this.ctx.fillRect(0, 590, 420, 130);
    this.ctx.fillRect(840, 520, 440, 200);

    this.ctx.fillStyle = "#48b8aa";
    this.ctx.beginPath();
    this.ctx.arc(190, 535, 30, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "#63b3ed";
    this.ctx.lineWidth = 16;
    this.ctx.lineCap = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(390, 570);
    this.ctx.lineTo(860, 500);
    this.ctx.stroke();

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "700 36px system-ui";
    this.ctx.fillText("ASTRO-TRAZOS", 40, 60);
    this.ctx.font = "18px system-ui";
    this.ctx.fillText("Prototipo técnico — Canvas 2D", 42, 92);
  }
}
