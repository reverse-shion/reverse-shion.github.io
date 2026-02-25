/* =========================================================
   /di/js/engine/fx/ringBeat.js
   RING BEAT SYSTEM — PRO LIGHTWEIGHT v1.0
   - combo 15 => transition + absorb-to-center + beat
   - combo break => back to rotate
   - minimal DOM: beam is 1 element, removed after animation
   ========================================================= */

export class RingBeat {
  constructor({ app, avatarRing, targetEl, fxLayer }) {
    this.app = app || null;
    this.ring = avatarRing || null;
    this.targetEl = targetEl || null;     // center target (e.g., .targetCore)
    this.fxLayer = fxLayer || document.body;

    this.enabled = !!this.ring;
    this.threshold = 15;

    this._inBeat = false;
    this._lastCombo = 0;

    // transition timings (ms)
    this._transitionMs = 180;
    this._absorbMs = 220;

    if (this.enabled) {
      // default mode
      this._setMode("rotate");
    }
  }

  setThreshold(n) {
    this.threshold = Math.max(1, Number(n || 15));
  }

  onCombo(combo) {
    if (!this.enabled) return;
    combo = Math.max(0, Number(combo || 0));

    // combo break => exit beat
    if (combo === 0 && this._inBeat) {
      this._exitBeat();
    }

    // threshold reached exactly (or crossed from below)
    const crossed = (this._lastCombo < this.threshold && combo >= this.threshold);

    if (crossed && !this._inBeat) {
      this._enterBeat();
    }

    // optional: strengthen beat amplitude after threshold (light)
    if (this._inBeat) {
      // scale max gently with combo (cap)
      const k = Math.min(1, (combo - this.threshold) / 120);
      const beatMax = 1.06 + k * 0.04; // 1.06..1.10
      this.ring.style.setProperty("--beat-max", beatMax.toFixed(3));
    }

    this._lastCombo = combo;
  }

  // -------------------------
  // Mode transitions
  // -------------------------
  _setMode(mode) {
    const el = this.ring;
    el.classList.remove("ring-rotate", "ring-transition", "ring-beat");

    if (mode === "rotate") el.classList.add("ring-rotate");
    if (mode === "transition") el.classList.add("ring-transition");
    if (mode === "beat") el.classList.add("ring-beat");
  }

  _enterBeat() {
    this._inBeat = true;

    // 1) stop rotation + flash
    this._setMode("transition");

    // 2) absorb to center (beam)
    this._emitAbsorbToCenter();

    // 3) slight "pause" then beat
    window.setTimeout(() => {
      if (!this._inBeat) return;
      this._setMode("beat");
    }, this._transitionMs);
  }

  _exitBeat() {
    this._inBeat = false;
    // reset beat strength
    this.ring.style.removeProperty("--beat-max");
    this._setMode("rotate");
  }

  // -------------------------
  // Absorb effect
  // -------------------------
  _emitAbsorbToCenter() {
    const ring = this.ring;
    const target = this.targetEl;

    if (!ring || !target) return;

    const a = ring.getBoundingClientRect();
    const b = target.getBoundingClientRect();

    const ax = a.left + a.width * 0.5;
    const ay = a.top + a.height * 0.5;

    const bx = b.left + b.width * 0.5;
    const by = b.top + b.height * 0.5;

    const dx = bx - ax;
    const dy = by - ay;

    const len = Math.max(10, Math.hypot(dx, dy));
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;

    const wrap = document.createElement("div");
    wrap.className = "fxRingAbsorb";

    const beam = document.createElement("i");
    beam.className = "beam";

    // CSS vars
    wrap.style.setProperty("--ax", `${ax}px`);
    wrap.style.setProperty("--ay", `${ay}px`);
    wrap.style.setProperty("--ang", `${ang}deg`);
    wrap.style.setProperty("--len", `${len.toFixed(1)}`);
    wrap.style.setProperty("--adur", `${this._absorbMs}ms`);

    wrap.appendChild(beam);

    // mount to fxLayer if possible (keeps it above stage)
    const mount = this.fxLayer || document.body;
    mount.appendChild(wrap);

    window.setTimeout(() => {
      wrap.remove();
    }, this._absorbMs + 60);
  }
}
