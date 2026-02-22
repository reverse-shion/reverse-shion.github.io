/* /di/js/engine/render.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Renderer {
    constructor({ canvas, chart, timing }) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
      this.chart = chart;
      this.timing = timing;

      // notes
      this.notes = (chart?.notes || []).slice().sort((a, b) => (a.t || 0) - (b.t || 0));
      this.approach = chart?.scroll?.approach ?? 1.25; // seconds

      // dpr (cap to 2)
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      // view size cache (CSS px)
      this.viewW = 0;
      this.viewH = 0;

      // cursor for visible window
      this._i0 = 0;

      // small cache for gradients "stops" only (cheap)
      this._stopCache = new Map();

      this.resize();

      // optional: auto-resize (safe even if not used)
      this._bindResize();
    }

    _bindResize() {
      // ResizeObserver is best; fallback to window resize
      try {
        if (typeof ResizeObserver !== "undefined") {
          this._ro = new ResizeObserver(() => this.resize());
          this._ro.observe(this.canvas);
        } else {
          window.addEventListener("resize", () => this.resize(), { passive: true });
        }
      } catch (_) {
        window.addEventListener("resize", () => this.resize(), { passive: true });
      }
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);

      this.viewW = w;
      this.viewH = h;

      // set backing store
      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);

      // map drawing units to CSS px
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // smoothing: medium is safer perf-wise on mobile
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "medium";
    }

    draw(songTime) {
      const ctx = this.ctx;
      const w = this.viewW;
      const h = this.viewH;

      // clear in CSS px space (transform maps to backing)
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const targetY = h * 0.62;

      // ---- lane guides (keep super light) ----
      this._drawLane(ctx, cx, targetY, h);

      // ---- notes window ----
      const spawnT = songTime + this.approach;
      const minT = songTime - 0.45;

      // advance start cursor (notes older than minT are never visible)
      while (this._i0 < this.notes.length && (this.notes[this._i0].t || 0) < minT) {
        this._i0++;
      }

      // render only visible range
      for (let i = this._i0; i < this.notes.length; i++) {
        const n = this.notes[i];
        const t = n.t || 0;
        if (t > spawnT) break;

        const dt = t - songTime;
        const p = 1 - (dt / this.approach); // 0..1
        const y = targetY * p;

        // alpha
        const a = this._clamp(0.18 + p * 1.05, 0, 1);

        this._drawNote(cx, y, a, p, n);
      }
    }

    _drawLane(ctx, cx, targetY, h) {
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
    }

    // ✅ skin優先 / なければfallback（軽量LOD付き）
    _drawNote(x, y, alpha, p, note) {
      const ctx = this.ctx;

      const skin = (window.DI_ENGINE && window.DI_ENGINE.noteSkin) || null;

      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      // ---- LOD: far -> mid -> near ----
      // far: super cheap dot
      if (p < 0.55) {
        this._drawFarDot(ctx, x, y, alpha, p);
        ctx.restore();
        return;
      }

      // skin present: trust skin (but you can still LOD if you want inside skin)
      if (skin && typeof skin.drawNote === "function") {
        // skin signature: (ctx, x, y, alpha, p, note, renderer)
        skin.drawNote(ctx, x, y, alpha, p, note, this);
        ctx.restore();
        return;
      }

      // fallback: mid/near split
      if (p < 0.78) {
        this._drawMidRing(ctx, x, y, alpha, p);
      } else {
        this._drawNearOrb(ctx, x, y, alpha, p);
      }

      ctx.restore();
    }

    _drawFarDot(ctx, x, y, alpha, p) {
      // super light: 1 arc fill
      const near = this._clamp(p, 0, 1);
      const r = 4.2 + near * 1.2;

      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // tiny hint of color (no blur)
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillStyle = "rgba(0,240,255,0.55)";
      ctx.beginPath();
      ctx.arc(x, y, r + 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawMidRing(ctx, x, y, alpha, p) {
      // light: ring + small core (NO shadowBlur)
      const near = this._easeOutCubic(this._clamp(p, 0, 1));
      const rCore = 5.5 + near * 1.2;
      const rRing = 10.5 + near * 3.0;

      ctx.globalCompositeOperation = "source-over";

      // ring stroke
      ctx.globalAlpha = alpha * 0.75;
      ctx.lineWidth = 2.2 + near * 0.6;
      ctx.strokeStyle = "rgba(0,240,255,0.70)";
      ctx.beginPath();
      ctx.arc(x, y, rRing, 0, Math.PI * 2);
      ctx.stroke();

      // subtle violet accent
      ctx.globalAlpha = alpha * 0.35;
      ctx.strokeStyle = "rgba(156,60,255,0.55)";
      ctx.beginPath();
      ctx.arc(x, y, rRing - 2.2, 0, Math.PI * 2);
      ctx.stroke();

      // core
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.beginPath();
      ctx.arc(x, y, rCore, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawNearOrb(ctx, x, y, alpha, p) {
      // near: allow glow + gradients, but only when close
      const C_CYAN = "rgba(0,240,255,";
      const C_VIOLET = "rgba(156,60,255,";
      const C_GOLD = "rgba(230,201,107,";

      const near = this._easeOutCubic(this._clamp(p, 0, 1));
      const pulse = 0.85 + 0.15 * Math.sin((p * 12.0) + (y * 0.02));

      const rCore = 6 + near * 2.2;
      const rRing = 12 + near * 6.2;
      const rAura = 24 + near * 16;

      // Use lighter only for near (expensive)
      this.ctx.globalCompositeOperation = "lighter";

      // AURA (blur only near)
      ctx.globalAlpha = alpha * 0.55 * pulse;
      ctx.shadowBlur = 18 + near * 18;
      ctx.shadowColor = `${C_CYAN}${0.45})`;
      ctx.fillStyle = this._radial(ctx, x, y, rAura, [
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
      ctx.shadowBlur = 12 + near * 12;
      ctx.shadowColor = `${C_CYAN}${0.55})`;
      ctx.lineWidth = 2.6 + near * 1.2;
      ctx.strokeStyle = this._radial(ctx, x, y, rRing, [
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
      ctx.shadowBlur = 8 + near * 10;
      ctx.shadowColor = "rgba(255,255,255,0.55)";
      ctx.fillStyle = this._radial(ctx, x, y, rCore + 10, [
        [0.00, `rgba(255,255,255,0.92)`],
        [0.22, `rgba(255,255,255,0.52)`],
        [0.55, `${C_CYAN}${0.24})`],
        [1.00, `rgba(255,255,255,0.00)`],
      ]);
      ctx.beginPath();
      ctx.arc(x, y, rCore + 8, 0, Math.PI * 2);
      ctx.fill();

      // inner bead (no blur)
      ctx.shadowBlur = 0;
      ctx.globalAlpha = alpha * (0.9 + near * 0.1);
      ctx.fillStyle = `rgba(255,255,255,0.78)`;
      ctx.beginPath();
      ctx.arc(x, y, rCore, 0, Math.PI * 2);
      ctx.fill();

      // TRAIL (near only, keep simple)
      const trailLen = 54 - near * 14;
      const trailW = 10 + near * 6;

      ctx.globalAlpha = alpha * (0.20 + near * 0.28);
      ctx.shadowBlur = 14;
      ctx.shadowColor = `${C_VIOLET}${0.38})`;

      const g = ctx.createLinearGradient(x, y - 6, x, y - trailLen);
      g.addColorStop(0.00, `${C_CYAN}${0.50})`);
      g.addColorStop(0.45, `${C_VIOLET}${0.36})`);
      g.addColorStop(1.00, `${C_CYAN}${0.00})`);

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.quadraticCurveTo(x - trailW, y - trailLen * 0.55, x, y - trailLen);
      ctx.quadraticCurveTo(x + trailW, y - trailLen * 0.55, x, y - 10);
      ctx.closePath();
      ctx.fill();

      // SPARK TICKS (small)
      ctx.globalAlpha = alpha * (0.14 + near * 0.18);
      ctx.shadowBlur = 10;
      ctx.shadowColor = `${C_CYAN}${0.32})`;
      ctx.lineWidth = 1.3;

      ctx.strokeStyle = `${C_CYAN}${0.66})`;
      ctx.beginPath();
      ctx.moveTo(x - (rRing + 6), y);
      ctx.lineTo(x - (rRing + 12), y);
      ctx.moveTo(x + (rRing + 6), y);
      ctx.lineTo(x + (rRing + 12), y);
      ctx.stroke();

      // reset composite
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
    }

    _radial(ctx, x, y, r, stops) {
      // NOTE: cannot cache gradient object safely (depends on x,y),
      // but we can cache the stop list identity by a small key.
      const key = Math.round(r * 2) / 2;
      let cachedStops = this._stopCache.get(key);
      if (!cachedStops) {
        cachedStops = stops;
        this._stopCache.set(key, stops);
      }
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      for (const [o, c] of cachedStops) g.addColorStop(o, c);
      return g;
    }

    _clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }
    _easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
  }

  NS.Renderer = Renderer;
})();
