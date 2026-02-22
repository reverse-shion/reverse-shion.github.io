// /di/js/engine/fx/core.js
export class FXCore {
  constructor({ layer, app }) {
    if (!layer) throw new Error("FXCore: layer required");
    if (!app) throw new Error("FXCore: app required");
    this.layer = layer;
    this.app = app;
  }

  getResColor() {
    const c = getComputedStyle(this.app).getPropertyValue("--res-color").trim();
    return c || "rgba(0,240,255,.9)";
  }

  createParticle(size = 12) {
    const el = document.createElement("div");
    el.className = "fx-particle";
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    return el;
  }
}
