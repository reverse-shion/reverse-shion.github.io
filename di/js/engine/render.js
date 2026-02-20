/* /di/js/engine/render.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Renderer {
    constructor({ canvas, chart, timing }) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.chart = chart;
      this.timing = timing;

      this.notes = (chart?.notes || []).slice().sort((a,b)=> (a.t||0)-(b.t||0));
      this.approach = chart?.scroll?.approach ?? 1.25; // seconds
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      this.resize();
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      this.canvas.width = Math.floor(r.width * this.dpr);
      this.canvas.height = Math.floor(r.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    draw(songTime) {
      const ctx = this.ctx;
      const w = this.canvas.getBoundingClientRect().width;
      const h = this.canvas.getBoundingClientRect().height;

      // Clear with slight transparency to keep video visible
      ctx.clearRect(0, 0, w, h);

      // lane center + target position
      const cx = w / 2;
      const targetY = h * 0.62;

      // subtle lane guides
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.moveTo(cx - 90, 0);
      ctx.lineTo(cx - 90, h);
      ctx.moveTo(cx + 90, 0);
      ctx.lineTo(cx + 90, h);
      ctx.stroke();

      // target line
      ctx.strokeStyle = "rgba(0,240,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(cx - 120, targetY);
      ctx.lineTo(cx + 120, targetY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // draw notes in window
      const spawnT = songTime + this.approach;
      const minT = songTime - 0.4;

      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (n.t < minT) continue;
        if (n.t > spawnT) break;

        const dt = n.t - songTime;     // seconds until hit
        const p = 1 - (dt / this.approach); // 0..1
        const y = targetY * p;

        const alpha = Math.max(0, Math.min(1, 0.15 + p));
        this._drawNote(cx, y, alpha, p);
      }
    }

    _drawNote(x, y, alpha, p) {
      const ctx = this.ctx;

      // outer glow
      ctx.save();
      ctx.globalAlpha = alpha * 0.75;

      // ring
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,240,255,0.55)";
      ctx.beginPath();
      ctx.arc(x, y, 12 + p * 6, 0, Math.PI * 2);
      ctx.stroke();

      // inner core
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(255,255,255,0.20)";
      ctx.beginPath();
      ctx.arc(x, y, 6 + p * 2, 0, Math.PI * 2);
      ctx.fill();

      // trail
      ctx.globalAlpha = alpha * 0.35;
      ctx.strokeStyle = "rgba(156,60,255,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x, y - 52);
      ctx.stroke();

      ctx.restore();
    }
  }

  NS.Renderer = Renderer;
})();
