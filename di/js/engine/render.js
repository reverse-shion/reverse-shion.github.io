/* /di/js/engine/render.js
   Renderer — chart-driven note positions using Timing.getSongTime()
*/
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Renderer {
    constructor({ canvas, chart, timing, judge }) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
      this.chart = chart || {};
      this.timing = timing;
      this.judge = judge || null;

      this.notes = (this.chart.notes || [])
        .map((n) => ({ ...n, t: Number(n?.t || 0) }))
        .filter((n) => Number.isFinite(n.t))
        .sort((a, b) => a.t - b.t);

      this.approachSeconds = Number(this.chart?.scroll?.approach ?? 1.25) || 1.25;
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      this.viewW = 0;
      this.viewH = 0;
      this.visibleStartIndex = 0;

      this.resize();
      this._bindResize();
    }

    _bindResize() {
      try {
        if (typeof ResizeObserver !== "undefined") {
          this._ro = new ResizeObserver(() => this.resize());
          this._ro.observe(this.canvas);
        } else {
          window.addEventListener("resize", () => this.resize(), { passive: true });
        }
      } catch {
        window.addEventListener("resize", () => this.resize(), { passive: true });
      }
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);

      this.viewW = w;
      this.viewH = h;

      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);

      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "medium";
    }

    _clamp(v, lo, hi) {
      return Math.max(lo, Math.min(hi, v));
    }

    _lerp(a, b, t) {
      return a + (b - a) * t;
    }

    draw(songTime) {
      const ctx = this.ctx;
      const w = this.viewW;
      const h = this.viewH;
      ctx.clearRect(0, 0, w, h);

      const laneCenterX = w * 0.5;
      const spawnY = -24;
      const hitY = h * 0.62;
      const minVisibleDt = -0.25;
      const maxVisibleDt = this.approachSeconds;

      // Move window start only forward (plus consumed notes from judge)
      const minTime = songTime - 0.25;
      while (
        this.visibleStartIndex < this.notes.length &&
        this.notes[this.visibleStartIndex].t < minTime
      ) {
        this.visibleStartIndex++;
      }

      const consumed = this.judge?.state?.idx ?? 0;
      let i = Math.max(this.visibleStartIndex, consumed);

      for (; i < this.notes.length; i++) {
        const n = this.notes[i];
        const noteTime = n.t;
        const dt = noteTime - songTime;

        if (dt > maxVisibleDt) break;
        if (dt < minVisibleDt) continue;

        // visible when dt <= approachSeconds AND dt >= -0.25
        const progress = 1 - this._clamp(dt / this.approachSeconds, 0, 1);

        const x = laneCenterX;
        const y = this._lerp(spawnY, hitY, progress);
        const scale = 0.8 + 0.6 * progress;
        const alpha = 0.25 + 0.75 * progress;

        this._drawNote(ctx, x, y, scale, alpha, progress);
      }
    }

    _drawNote(ctx, x, y, scale, alpha, progress) {
      const baseR = 16;
      const r = baseR * scale;
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--res-color")
        .trim() || "rgba(0,240,255,.95)";

      ctx.save();
      ctx.globalAlpha = this._clamp(alpha, 0, 1);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();

      ctx.globalAlpha = this._clamp(0.35 + progress * 0.65, 0, 1);
      ctx.shadowBlur = 18 + progress * 26;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.restore();
    }
  }

  NS.Renderer = Renderer;
})();
