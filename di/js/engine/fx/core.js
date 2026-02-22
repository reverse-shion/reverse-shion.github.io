// /di/js/engine/fx/core.js
export class FXCore {
  constructor({ layer, app }) {
    if (!layer) throw new Error("FXCore: layer required");
    if (!app) throw new Error("FXCore: app required");
    this.layer = layer;
    this.app = app;

    // 0..1 (resonance intensity)
    this.intensity = 0;

    // small cache to avoid repeated getComputedStyle bursts
    this._lastColor = "";
    this._lastColorTs = 0;
  }

  // Accept 0..1 or 0..100
  setIntensity(v) {
    let x = Number(v);
    if (!Number.isFinite(x)) x = 0;
    if (x > 1.5) x = x / 100;
    this.intensity = Math.max(0, Math.min(1, x));
    return this.intensity;
  }

  getResColor() {
    const now = performance.now();
    if (now - this._lastColorTs < 80 && this._lastColor) return this._lastColor;

    const c = getComputedStyle(this.app).getPropertyValue("--res-color").trim();
    this._lastColor = c || "rgba(0,240,255,.95)";
    this._lastColorTs = now;
    return this._lastColor;
  }

  // Star clip-path (5-point)
  static starClipPath() {
    // 10 points polygon for a star
    return "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
  }

  createParticle(size = 12, opt = {}) {
    const el = document.createElement("div");
    el.className = "fx-particle";

    // size
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    // make it visible by default
    el.style.opacity = "1";
    el.style.position = "absolute";
    el.style.pointerEvents = "none";
    el.style.willChange = "transform, opacity, left, top, filter";

    // star shape
    if (opt.shape === "star") {
      const cp = FXCore.starClipPath();
      el.style.clipPath = cp;
      el.style.webkitClipPath = cp;

      // if existing CSS forces border-radius, override
      el.style.borderRadius = "0px";
    }

    return el;
  }

  // helpers
  rand(a, b) {
    return a + Math.random() * (b - a);
  }
}
