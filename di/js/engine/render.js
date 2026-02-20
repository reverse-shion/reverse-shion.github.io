/* /di/js/engine/render.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Renderer {
    constructor({ canvas, chart, timing }) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.chart = chart;
      this.timing = timing;

      this.notes = (chart?.notes || [])
        .slice()
        .sort((a, b) => (Number(a?.t) || 0) - (Number(b?.t) || 0));

      this.approach = chart?.scroll?.approach ?? 1.25; // seconds
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

      this.resize();

      // stops cache (radius only) - safe for current usage
      this._gradCache = new Map();
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width * this.dpr));
      const h = Math.max(1, Math.floor(r.height * this.dpr));

      this.canvas.width = w;
      this.canvas.height = h;

      // 1 unit == 1 CSS pixel
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // Safari-safe (存在しない場合もあるのでガード)
      this.ctx.imageSmoothingEnabled = true;
      if ("imageSmoothingQuality" in this.ctx) {
        this.ctx.imageSmoothingQuality = "high";
      }
    }

    draw(songTime) {
      const ctx = this.ctx;

      // songTime が NaN の瞬間があると全滅するのでガード
      if (!Number.isFinite(songTime)) return;

      const rect = this.canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // 初期レイアウト中の 0 サイズ対策
      if (w < 2 || h < 2) return;

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const targetY = h * 0.62;

      // guides
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
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

      const spawnT = songTime + this.approach;
      const minT = songTime - 0.45;

      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        const t = Number(n?.t);

        // ✅ ここが超重要：変なノーツは弾く
        if (!Number.isFinite(t)) continue;

        if (t < minT) continue;
        if (t > spawnT) break;

        const dt = t - songTime;
        const p = 1 - (dt / this.approach);
        const y = targetY * p;

        const alpha = this._clamp(0.20 + p * 1.05, 0, 1);
        this._drawNote(cx, y, alpha, p, n);
      }
    }

    _drawNote(x, y, alpha, p, note) {
      const ctx = this.ctx;

      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      const skin = (window.DI_ENGINE && window.DI_ENGINE.noteSkin) || null;

      if (skin && typeof skin.drawNote === "function") {
        // ✅ スキン例外でゲームが死ぬのを防ぐ
        try {
          skin.drawNote(ctx, x, y, alpha, p, note, this);
        } catch (e) {
          console.warn("[noteSkin.drawNote] failed -> fallback", e);
          this._drawFallbackOrb(ctx, x, y, alpha, p);
        }
      } else {
        this._drawFallbackOrb(ctx, x, y, alpha, p);
      }

      ctx.restore();
    }

    _drawFallbackOrb(ctx, x, y, alpha, p) {
      const C_CYAN   = "rgba(0,240,255,";
      const C_VIOLET = "rgba(156,60,255,";
      const C_GOLD   = "rgba(230,201,107,";

      const near = this._easeOutCubic(this._clamp(p, 0, 1));
      const pulse = 0.85 + 0.15 * Math.sin((p * 12.0) + (y * 0.02));

      const rCore = 6 + near * 2.2;
      const rRing = 12 + near * 6.2;
      const rAura = 24 + near * 16;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      ctx.globalAlpha = alpha * 0.55 * pulse;
      ctx.shadowBlur = 26 + near * 24;
      ctx.shadowColor = `${C_CYAN}${0.55})`;
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

      ctx.globalAlpha = alpha * (0.75 + near * 0.30);
      ctx.shadowBlur = 18 + near * 18;
      ctx.shadowColor = `${C_CYAN}${0.65})`;
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

      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 10 + near * 12;
      ctx.shadowColor = "rgba(255,255,255,0.65)";
      ctx.fillStyle = this._radial(ctx, x, y, rCore + 10, [
        [0.00, `rgba(255,255,255,0.95)`],
        [0.22, `rgba(255,255,255,0.55)`],
        [0.55, `${C_CYAN}${0.25})`],
        [1.00, `rgba(255,255,255,0.00)`],
      ]);
      ctx.beginPath();
      ctx.arc(x, y, rCore + 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = alpha * (0.9 + near * 0.1);
      ctx.fillStyle = `rgba(255,255,255,0.78)`;
      ctx.beginPath();
      ctx.arc(x, y, rCore, 0, Math.PI * 2);
      ctx.fill();

      const trailLen = 64 - near * 20;
      const trailW = 10 + near * 8;

      ctx.globalAlpha = alpha * (0.26 + near * 0.32);
      ctx.shadowBlur = 22;
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

      ctx.globalAlpha = alpha * (0.18 + near * 0.22);
      ctx.shadowBlur = 16;
      ctx.shadowColor = `${C_CYAN}${0.40})`;
      ctx.lineWidth = 1.5;

      ctx.strokeStyle = `${C_CYAN}${0.70})`;
      ctx.beginPath();
      ctx.moveTo(x - (rRing + 6), y);
      ctx.lineTo(x - (rRing + 14), y);
      ctx.moveTo(x + (rRing + 6), y);
      ctx.lineTo(x + (rRing + 14), y);
      ctx.stroke();

      ctx.restore();
    }

    _radial(ctx, x, y, r, stops) {
      // radius-only cache (OK for current fallback). If skins reuse radii with different stops, remove cache.
      const key = Math.round(r * 2) / 2;

      let cached = this._gradCache.get(key);
      if (!cached) {
        cached = stops;
        this._gradCache.set(key, stops);
      }

      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      for (const [o, c] of cached) g.addColorStop(o, c);
      return g;
    }

    _clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    _easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  }

  NS.Renderer = Renderer;
})();
