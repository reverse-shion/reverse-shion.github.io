/* /di/js/engine/fx/ringBeat.js
   RingBeat — LIGHTWEIGHT THRESHOLD MODE (spin stop + glow + absorb-to-center)
   - No heavy canvas, only 1 DOM element created on demand
   - Works with avatarRing (#avatarRing) and targetEl (.targetCore)
*/

export class RingBeat {
  constructor({ app, avatarRing, targetEl, fxLayer }) {
    this.app = app || document.getElementById("app");
    this.ring = avatarRing || document.getElementById("avatarRing");
    this.targetEl = targetEl || document.querySelector(".targetCore");
    this.fxLayer = fxLayer || document.getElementById("fxLayer");

    this.threshold = 15;
    this._armed = true;          // trigger once per reach
    this._lastCombo = 0;
    this._absorbEl = null;

    // safety
    if (!this.ring) console.warn("[RingBeat] avatarRing missing");
    if (!this.targetEl) console.warn("[RingBeat] targetEl missing (.targetCore)");
    if (!this.fxLayer) console.warn("[RingBeat] fxLayer missing");
  }

  setThreshold(n) {
    const v = Math.max(1, Number(n) || 1);
    this.threshold = v;
    return v;
  }

  // compatibility (some code calls updateCombo)
  updateCombo(combo) { this.onCombo(combo); }

  onCombo(combo) {
    const c = Math.max(0, Number(combo) || 0);
    this._lastCombo = c;

    if (!this.ring) return;

    // beat intensity always reflects combo (your "鼓動=繋がり")
    this._applyBeat(c);

    // trigger: crossing threshold upward
    if (this._armed && c >= this.threshold) {
      this._armed = false;
      this._onReachThreshold();
      return;
    }

    // reset arming if combo drops (MISS etc.)
    if (c < this.threshold) {
      this._armed = true;
      // return to spin mode
      this.ring.classList.remove("rb-stop", "rb-glow");
      this.app?.classList?.remove("rb-absorb-active");
    }
  }

  _applyBeat(combo) {
    // map combo to 0..1 (gentle)
    const k = Math.min(1, combo / Math.max(10, this.threshold));
    this.ring.style.setProperty("--rb-beat", k.toFixed(3));
    this.ring.classList.add("rb-beat");
  }

  _onReachThreshold() {
    // 1) stop spin + glow
    this.ring.classList.add("rb-stop", "rb-glow");

    // 2) absorb animation (ring center -> target center)
    this._fireAbsorb();

    // 3) after absorb, switch to pure beat (keep glow slightly, spin stays stopped)
    window.setTimeout(() => {
      if (!this.ring) return;
      this.ring.classList.remove("rb-glow");
      // keep rb-stop + rb-beat
    }, 520);
  }

  _fireAbsorb() {
    if (!this.app || !this.fxLayer || !this.ring || !this.targetEl) return;

    const r0 = this.ring.getBoundingClientRect();
    const t0 = this.targetEl.getBoundingClientRect();
    const fx = this.fxLayer.getBoundingClientRect();

    const sx = (r0.left + r0.width / 2) - fx.left;
    const sy = (r0.top + r0.height / 2) - fx.top;
    const ex = (t0.left + t0.width / 2) - fx.left;
    const ey = (t0.top + t0.height / 2) - fx.top;

    // create element once
    const el = (this._absorbEl ||= this._createAbsorbEl());
    if (!el) return;

    // set CSS vars (local to fxLayer)
    el.style.setProperty("--sx", `${sx}px`);
    el.style.setProperty("--sy", `${sy}px`);
    el.style.setProperty("--ex", `${ex}px`);
    el.style.setProperty("--ey", `${ey}px`);

    // “arrival” size relates to threshold feel
    const size = Math.round(18 + Math.min(1, this.threshold / 25) * 10);
    el.style.setProperty("--rb-dot", `${size}px`);

    // run
    this.app.classList.add("rb-absorb-active");
    el.classList.remove("rb-run");
    // reflow to restart animation reliably on iOS
    void el.offsetWidth;
    el.classList.add("rb-run");

    // cleanup class
    window.setTimeout(() => {
      this.app?.classList?.remove("rb-absorb-active");
    }, 560);
  }

  _createAbsorbEl() {
    const el = document.createElement("div");
    el.className = "rbAbsorb";
    this.fxLayer.appendChild(el);
    return el;
  }
}
