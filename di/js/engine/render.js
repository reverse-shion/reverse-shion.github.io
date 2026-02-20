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
      this._gradCache = new Map();
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      this.canvas.width  = Math.floor(r.width  * this.dpr);
      this.canvas.height = Math.floor(r.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // iOSでの見た目安定
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
    }

    draw(songTime) {
      const ctx = this.ctx;
      const w = this.canvas.getBoundingClientRect().width;
      const h = this.canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const targetY = h * 0.62;

      // ---- lane guides (thin) ----
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;

      ctx.strokeStyle = "rgba(0,240,255,0.22)";
      ctx.beginPath();
      ctx.moveTo(cx - 70, 0);
      ctx.lineTo(cx - 70, h);
      ctx.stroke();

      ctx.strokeStyle = "rgba(156,60,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(cx + 70, 0);
      ctx.lineTo(cx + 70, h);
      ctx.stroke();

      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "rgba(255,255,255,0.30)";
      ctx.beginPath();
      ctx.moveTo(cx - 115, targetY);
      ctx.lineTo(cx + 115, targetY);
      ctx.stroke();

      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "rgba(0,240,255,0.32)";
      ctx.beginPath();
      ctx.moveTo(cx - 105, targetY + 2);
      ctx.lineTo(cx + 105, targetY + 2);
      ctx.stroke();

      ctx.restore();

      // ---- notes window ----
      const spawnT = songTime + this.approach;
      const minT   = songTime - 0.45;

      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (n.t < minT) continue;
        if (n.t > spawnT) break;

        const dt = n.t - songTime;
        const p  = 1 - (dt / this.approach);    // 0..1
        const y  = targetY * p;

        const a = this._clamp(0.20 + p * 1.05, 0, 1);
        this._drawNote(cx, y, a, p, n);         // ✅ noteも渡す
      }
    }

    // ✅ skin優先 / なければfallback
    _drawNote(x, y, alpha, p, note) {
      const ctx = this.ctx;

      // ここが最重要：スキンがあればそっちを呼ぶ
      const skin = (window.DI_ENGINE && window.DI_ENGINE.noteSkin) || null;

      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      if (skin && typeof skin.drawNote === "function") {
        // skin signature: (ctx, x, y, alpha, p, note, renderer)
        skin.drawNote(ctx, x, y, alpha, p, note, this);
      } else {
        this._drawFallbackOrb(ctx, x, y, alpha, p);
      }

      ctx.restore();
    }

    // ===== fallback: 旧 _drawNote の中身をここへ移動 =====
    _drawFallbackOrb(ctx, x, y, alpha, p) {
      const C_CYAN   = "rgba(0,240,255,";
      const C_VIOLET = "rgba(156,60,255,";
      const C_GOLD   = "rgba(230,201,107,";

      const near  = this._easeOutCubic(this._clamp(p, 0, 1));
      const pulse = 0.85 + 0.15 * Math.sin((p * 12.0) + (y * 0.02));

      const rCore = 6  + near * 2.2;
      const rRing = 12 + near * 6.2;
      const rAura = 24 + near * 16;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // AURA
      ctx.globalAlpha  = alpha * 0.55 * pulse;
      ctx.shadowBlur   = 26 + near * 24;
      ctx.shadowColor  = `${C_CYAN}${0.55})`;
      ctx.fillStyle    = this._radial(x, y, rAura, [
        [0.00, `${C_CYAN}${0.00})`],
        [0.22, `${C_CYAN}${0.12})`],
        [0.52, `${C_VIOLET}${0.10})`],
        [0.78, `${C_GOLD}${0.08})`],
        [1.00, `${C_CYAN}${0.00})`],
      ]);
      ctx.beginPath();
      ctx.arc(x, y, rAura, 0, Math.PI * 2);
      ctx.fill();

      // RING
      ctx.globalAlpha = alpha * (0.75 + near * 0.30);
      ctx.shadowBlur  = 18 + near * 18;
      ctx.shadowColor = `${C_CYAN}${0.65})`;
      ctx.lineWidth   = 2.6 + near * 1.2;
      ctx.strokeStyle = this._radial(x, y, rRing, [
        [0.00, `${C_CYAN}${0.85})`],
        [0.55, `${C_VIOLET}${0.60})`],
        [0.85, `${C_GOLD}${0.55})`],
        [1.00, `${C_CYAN}${0.70})`],
      ]);
      ctx.beginPath();
      ctx.arc(x, y, rRing, 0, Math.PI * 2);
      ctx.stroke();

      // CORE bloom
      ctx.globalAlpha = alpha;
      ctx.shadowBlur  = 10 + near * 12;
      ctx.shadowColor = "rgba(255,255,255,0.65)";
      ctx.fillStyle   = this._radial(x, y, rCore + 10, [
        [0.00, `rgba(255,255,255,0.95)`],
        [0.22, `rgba(255,255,255,0.55)`],
        [0.55, `${C_CYAN}${0.25})`],
        [1.00, `rgba(255,255,255,0.00)`],
      ]);
      ctx.beginPath();
      ctx.arc(x, y, rCore + 8, 0, Math.PI * 2);
      ctx.fill();

      // inner bead
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = alpha * (0.9 + near * 0.1);
      ctx.fillStyle   = `rgba(255,255,255,0.78)`;
      ctx.beginPath();
      ctx.arc(x, y, rCore, 0, Math.PI * 2);
      ctx.fill();

      // TRAIL
      const trailLen = 64 - near * 20;
      const trailW   = 10 + near * 8;

      ctx.globalAlpha = alpha * (0.26 + near * 0.32);
      ctx.shadowBlur  = 22;
      ctx.shadowColor = `${C_VIOLET}${0.45})`;

      const g = ctx.createLinearGradient(x, y - 6, x, y - trailLen);
      g.addColorStop(0.00, `${C_CYAN}${0.55})`);
      g.addColorStop(0.45, `${C_VIOLET}${0.42})`);
      g.addColorStop(1.00, `${C_CYAN}${0.00})`);

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.quadraticCurveTo(x - trailW, y - trailLen * 0.55, x, y - trailLen);
      ctx.quadraticCurveTo(x + trailW, y - trailLen * 0.55, x, y - 10);
      ctx.closePath();
      ctx.fill();

      // SPARK TICKS
      ctx.globalAlpha = alpha * (0.18 + near * 0.22);
      ctx.shadowBlur  = 16;
      ctx.shadowColor = `${C_CYAN}${0.40})`;
      ctx.lineWidth   = 1.5;

      ctx.strokeStyle = `${C_CYAN}${0.70})`;
      ctx.beginPath();
      ctx.moveTo(x - (rRing + 6), y);
      ctx.lineTo(x - (rRing + 14), y);
      ctx.moveTo(x + (rRing + 6), y);
      ctx.lineTo(x + (rRing + 14), y);
      ctx.stroke();

      ctx.restore();
    }

    _radial(x, y, r, stops) {
      // cache stop list by rounded radius
      const key = Math.round(r * 2) / 2;
      let cached = this._gradCache.get(key);
      if (!cached) {
        cached = stops;
        this._gradCache.set(key, stops);
      }
      const g = this.ctx.createRadialGradient(x, y, 0, x, y, r);
      for (const [o, c] of cached) g.addColorStop(o, c);
      return g;
    }

    _clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
    _easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
  }

  NS.Renderer = Renderer;
})();
