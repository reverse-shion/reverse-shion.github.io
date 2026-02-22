// /di/js/engine/fx/core.js
// FX CORE — PRO STABLE (iOS Safari safe)
// - intensity: 0..1 (accept 0..100 too)
// - res color: cached to avoid getComputedStyle spam
// - particle: CSS-var driven (size/alpha/tail) + optional star clip-path
// - minimal DOM writes, predictable defaults

export class FXCore {
  constructor({ layer, app }) {
    if (!layer) throw new Error("FXCore: layer required");
    if (!app) throw new Error("FXCore: app required");

    this.layer = layer;
    this.app = app;

    // 0..1
    this.intensity = 0;

    // cached color
    this._lastColor = "";
    this._lastColorTs = 0;

    // constants
    this._COLOR_TTL_MS = 80;
    this._DEFAULT_COLOR = "rgba(0,240,255,.95)";

    // precomputed star polygon
    this._STAR_CP =
      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
  }

  // -------------------------
  // Intensity (0..1 or 0..100)
  // -------------------------
  setIntensity(v) {
    let x = Number(v);
    if (!Number.isFinite(x)) x = 0;

    // accept 0..100
    if (x > 1.0001) x = x / 100;

    // clamp
    if (x < 0) x = 0;
    if (x > 1) x = 1;

    this.intensity = x;
    return x;
  }

  // -------------------------
  // Resonance color (cached)
  // -------------------------
  getResColor() {
    const now = (globalThis.performance && performance.now) ? performance.now() : Date.now();

    if (this._lastColor && now - this._lastColorTs < this._COLOR_TTL_MS) {
      return this._lastColor;
    }

    let c = "";
    try {
      c = getComputedStyle(this.app).getPropertyValue("--res-color").trim();
    } catch {
      c = "";
    }

    this._lastColor = c || this._DEFAULT_COLOR;
    this._lastColorTs = now;
    return this._lastColor;
  }

  // -------------------------
  // Particle factory
  // -------------------------
  // opt:
  //  - shape: "star" | "circle" | "auto"
  //  - alpha: number (0..1)
  //  - spread: number (size random multiplier range, e.g. 1.0)
  //  - tail: number (stream tail multiplier)
  //  - tailRotDeg: number (deg)
  //  - className: additional class string ("stream" etc)
  createParticle(baseSize = 14, opt = {}) {
    const el = document.createElement("div");
    el.className = "fx-particle";

    // extra class
    if (opt.className) el.classList.add(opt.className);

    // iOS safe defaults (no layout thrash)
    el.style.position = "absolute";
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.pointerEvents = "none";
    el.style.opacity = "1";
    el.style.willChange = "transform, opacity, left, top, filter";
    el.style.transform = "translate(-50%,-50%) translateZ(0)";

    // randomize size via CSS var (preferred)
    const size = this._randSize(baseSize, opt.spread);
    el.style.setProperty("--fx-size", `${size.toFixed(2)}px`);

    // alpha
    const a = this._clamp01(
      Number.isFinite(+opt.alpha) ? +opt.alpha : (0.92 + (Math.random() * 0.08))
    );
    el.style.setProperty("--fx-alpha", `${a.toFixed(3)}`);

    // tail settings (used by CSS for .stream::after)
    if (Number.isFinite(+opt.tail)) {
      el.style.setProperty("--fx-tail", `${(+opt.tail).toFixed(2)}`);
    }
    if (Number.isFinite(+opt.tailRotDeg)) {
      el.style.setProperty("--fx-tail-rot", `${(+opt.tailRotDeg).toFixed(1)}deg`);
    }

    // shape: star / circle
    const shape = opt.shape || "auto";
    if (shape === "star" || shape === "auto") {
      // star is the desired default for this project
      // (circle can be forced by opt.shape="circle")
      if (shape !== "circle") {
        el.style.borderRadius = "0px";
        el.style.clipPath = this._STAR_CP;
        el.style.webkitClipPath = this._STAR_CP;
      }
    } else if (shape === "circle") {
      // fallback circle
      el.style.borderRadius = "999px";
      el.style.clipPath = "";
      el.style.webkitClipPath = "";
    }

    return el;
  }

  // -------------------------
  // Helpers
  // -------------------------
  rand(a, b) {
    return a + Math.random() * (b - a);
  }

  _clamp01(x) {
    if (!Number.isFinite(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  }

  _randSize(baseSize, spread) {
    const b = Math.max(6, Number(baseSize) || 14);

    // spread = 0.0 -> fixed
    // spread = 1.0 -> ~50%..150%
    const sp = Number.isFinite(+spread) ? Math.max(0, +spread) : 1.0;

    if (sp <= 0.0001) return b;

    // slightly bias to smaller sizes (more “粒”感)
    const r = Math.pow(Math.random(), 0.65); // 0..1 (biased)
    const min = b * (1 - sp * 0.45);
    const max = b * (1 + sp * 0.85);

    return Math.max(6, min + (max - min) * r);
  }
}
