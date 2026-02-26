/* /di/js/engine/fx/ring-resonance.js */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class RingResonance {
  constructor({ app, ring, fxLayer, icon, maxOrbs = 6 } = {}) {
    this.app = app || document.getElementById("app");
    this.ring = ring || document.getElementById("avatarRing");
    this.fxLayer = fxLayer || document.getElementById("fxLayer");
    this.icon = icon || document.getElementById("dicoFace");
    this.maxOrbs = Math.max(1, Number(maxOrbs) || 6);

    this._hue = 188;
    this._res = 0;
    this._orbPool = [];
    this._rrTimers = [];

    this._ensureStylesheet();
    this.app?.classList.add("rr-enabled");
  }

  dispose() {
    this._rrTimers.forEach((id) => clearTimeout(id));
    this._rrTimers.length = 0;
    this._orbPool.forEach((orb) => {
      orb.removeEventListener("animationend", orb._onEnd);
      orb.remove();
    });
    this._orbPool.length = 0;
  }

  setResonanceByCombo(combo = 0, threshold = 10) {
    const safeThreshold = Math.max(1, Number(threshold) || 1);
    const pct = clamp((Number(combo) || 0) / safeThreshold, 0, 1) * 100;
    this.setResonance(pct);
  }

  setResonance(pct = 0) {
    const res = clamp(Number(pct) || 0, 0, 100);
    this._res = res;

    const hue = 188 + Math.round(res * 1.36);
    const speed = (7.2 - res * 0.048).toFixed(2);
    const intensity = (res / 100).toFixed(3);

    this._hue = hue;
    this.app?.style.setProperty("--rr-hue", String(hue));
    this.app?.style.setProperty("--rr-speed", `${Math.max(2.2, Number(speed))}s`);
    this.app?.style.setProperty("--rr-intensity", intensity);

    if (this.ring) {
      this.ring.classList.toggle("rr-rainbow", res >= 100);
    }
  }

  emitOrbBurst({ x, y, judge } = {}) {
    if (!this.fxLayer || !this.ring) return;

    const j = String(judge || "GOOD").toUpperCase();
    const perfect = j === "PERFECT";
    const count = perfect ? 1 : 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i += 1) {
      const orb = this._acquireOrb();
      if (!orb) break;
      this._launchOrb(orb, { x, y, perfect, spreadIndex: i, spreadMax: count });
    }
  }

  onImpact(boost = 1) {
    const impact = clamp(Number(boost) || 0, 0, 1.5);
    this.app?.style.setProperty("--rr-impact", impact.toFixed(3));

    this.ring?.classList.remove("rr-pulse", "rr-shock");
    this.icon?.classList.remove("rr-icon-boost");
    void this.ring?.offsetWidth;

    this.ring?.classList.add("rr-pulse", "rr-shock");
    this.icon?.classList.add("rr-icon-boost");

    const t1 = window.setTimeout(() => {
      this.ring?.classList.remove("rr-pulse", "rr-shock");
    }, 360);
    const t2 = window.setTimeout(() => {
      this.icon?.classList.remove("rr-icon-boost");
      this.app?.style.setProperty("--rr-impact", "0");
    }, 420);
    this._rrTimers.push(t1, t2);
  }

  _ensureStylesheet() {
    if (document.querySelector('link[data-ring-resonance="1"]')) return;
    const href = new URL("../../../css/fx/ring-resonance.css", import.meta.url).toString();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.ringResonance = "1";
    document.head.appendChild(link);
  }

  _acquireOrb() {
    for (const orb of this._orbPool) {
      if (!orb.classList.contains("is-active")) return orb;
    }
    if (this._orbPool.length >= this.maxOrbs) return null;

    const orb = document.createElement("i");
    orb.className = "rr-orb";
    orb._onEnd = () => {
      orb.classList.remove("is-active");
      orb.style.opacity = "0";
    };
    orb.addEventListener("animationend", orb._onEnd);
    this.fxLayer.appendChild(orb);
    this._orbPool.push(orb);
    return orb;
  }

  _launchOrb(orb, { x, y, perfect, spreadIndex, spreadMax }) {
    const fxRect = this.fxLayer.getBoundingClientRect();
    const ringRect = this.ring.getBoundingClientRect();

    const ox = clamp(Number(x) || 0, 0, fxRect.width);
    const oy = clamp(Number(y) || 0, 0, fxRect.height);
    const tx = (ringRect.left + ringRect.width * 0.5) - fxRect.left;
    const ty = (ringRect.top + ringRect.height * 0.5) - fxRect.top;

    const baseAngle = Math.atan2(ty - oy, tx - ox);
    const spread = perfect ? 0 : ((spreadIndex / Math.max(1, spreadMax - 1)) - 0.5) * 0.44;
    const dist = Math.hypot(tx - ox, ty - oy);
    const curve = clamp(dist * 0.14, 20, 58);
    const cx = ox + Math.cos(baseAngle + spread) * dist * 0.58;
    const cy = oy + Math.sin(baseAngle + spread) * dist * 0.58 - curve;

    orb.style.setProperty("--ox", `${ox.toFixed(1)}px`);
    orb.style.setProperty("--oy", `${oy.toFixed(1)}px`);
    orb.style.setProperty("--cx", `${cx.toFixed(1)}px`);
    orb.style.setProperty("--cy", `${cy.toFixed(1)}px`);
    orb.style.setProperty("--tx", `${tx.toFixed(1)}px`);
    orb.style.setProperty("--ty", `${ty.toFixed(1)}px`);
    orb.style.setProperty("--size", `${perfect ? 20 : 12 + Math.random() * 4}px`);
    orb.style.setProperty("--flight", `${perfect ? 460 : 380 + Math.random() * 80}ms`);
    orb.style.setProperty("--rr-orb-scale", perfect ? "1.12" : `${0.78 + Math.random() * 0.2}`);

    orb.classList.remove("is-active");
    void orb.offsetWidth;
    orb.classList.add("is-active");

    const impactDelay = perfect ? 420 : 340;
    window.setTimeout(() => {
      if (orb.classList.contains("is-active")) {
        this.onImpact(perfect ? 1.2 : 0.86);
      }
    }, impactDelay);
  }
}
