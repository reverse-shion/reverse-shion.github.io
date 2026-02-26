/* /di/js/engine/fx/ringBeat.js */

export class RingBeat {
  constructor({ app, avatarRing, targetEl, fxLayer, resonanceCtrl }) {
    this.app = app || document.getElementById("app");
    this.ring = avatarRing || document.getElementById("avatarRing");
    this.targetEl = targetEl || document.querySelector(".targetCore");
    this.fxLayer = fxLayer || document.getElementById("fxLayer");
    this.resonanceCtrl = resonanceCtrl || null;

    this.threshold = 15;
    this._armed = true;
    this._lastCombo = 0;

    if (!this.ring) console.warn("[RingBeat] avatarRing missing");
    if (!this.targetEl) console.warn("[RingBeat] targetEl missing (.targetCore)");
    if (!this.fxLayer) console.warn("[RingBeat] fxLayer missing");
  }

  setThreshold(n) {
    const v = Math.max(1, Number(n) || 1);
    this.threshold = v;
    this.resonanceCtrl?.setResonanceByCombo(this._lastCombo, this.threshold);
    return v;
  }

  updateCombo(combo) {
    this.onCombo(combo);
  }

  onCombo(combo) {
    const c = Math.max(0, Number(combo) || 0);
    this._lastCombo = c;

    if (!this.ring) return;

    this._applyBeat(c);
    this.resonanceCtrl?.setResonanceByCombo(c, this.threshold);

    if (this._armed && c >= this.threshold) {
      this._armed = false;
      this._onReachThreshold();
      return;
    }

    if (c < this.threshold) {
      this._armed = true;
      this.ring.classList.remove("rb-stop", "rb-glow");
    }
  }

  emitTapAbsorb({ x, y, judge }) {
    if (!this.resonanceCtrl) return;
    this.resonanceCtrl.emitOrbBurst({ x, y, judge });
  }

  _applyBeat(combo) {
    const k = Math.min(1, combo / Math.max(10, this.threshold));
    this.ring.style.setProperty("--rb-beat", k.toFixed(3));
    this.ring.classList.add("rb-beat");
  }

  _onReachThreshold() {
    this.ring.classList.add("rb-stop", "rb-glow");
    this.resonanceCtrl?.onImpact(1);

    window.setTimeout(() => {
      if (!this.ring) return;
      this.ring.classList.remove("rb-glow");
    }, 380);
  }
}
