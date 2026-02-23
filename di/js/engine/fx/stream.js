// /di/js/engine/fx/stream.js
// STREAM — "Ring Resonance Absorb" (PRO)
// - Accepts target element as 3rd arg: stream(x, y, targetEl)
// - Flies to the RIM (outer ring) to sell "resonance", not the center
// - iOS safe: low DOM, transform/opacity/filter only

export function attachStream(FX) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function ensureRingPulseStyle() {
    if (document.getElementById("__fx_ring_pulse_style__")) return;
    const s = document.createElement("style");
    s.id = "__fx_ring_pulse_style__";
    s.textContent = `
      .ringPulse{ animation: ringPulse 220ms ease-out; }
      @keyframes ringPulse{
        0%{ transform: scale(1); filter: brightness(1); }
        40%{ transform: scale(1.06); filter: brightness(1.25); }
        100%{ transform: scale(1); filter: brightness(1); }
      }
    `;
    document.head.appendChild(s);
  }

  function pulse(el) {
    if (!el) return;
    el.classList.remove("ringPulse");
    void el.offsetWidth; // reflow
    el.classList.add("ringPulse");
  }

  FX.prototype.stream = function (x, y, targetEl) {
    ensureRingPulseStyle();

    const color = this.getResColor();
    const k = clamp(Number(this.intensity) || 0, 0, 1);

    // target: prefer provided element, fallback to #avatarRing
    const el =
      targetEl ||
      document.getElementById("avatarRing") ||
      document.querySelector(".avatarRing") ||
      null;

    // If no target found, do nothing safely
    if (!el) return;

    const rc = el.getBoundingClientRect();
    const cx = rc.left + rc.width / 2;
    const cy = rc.top + rc.height / 2;
    const r = Math.max(10, Math.min(rc.width, rc.height) / 2);

    // iOS safe count (flashiness comes from glow, not huge count)
    const COUNT_MIN = 10;
    const COUNT_MAX = 18;
    const count = Math.round(COUNT_MIN + (COUNT_MAX - COUNT_MIN) * (k * 0.95));

    // local -> viewport conversion:
    // main.js passes x,y in fxLayer local coords, but rc is viewport coords.
    // So we must convert start point to viewport coords using fxLayer rect.
    const layer = this.layer;
    const layerRect = layer.getBoundingClientRect();
    const sx0 = layerRect.left + x;
    const sy0 = layerRect.top + y;

    const durBase = 260;
    const durJit = 140;

    for (let i = 0; i < count; i++) {
      const size = Math.round(6 + k * 6 + this.rand(-2, 6));

      const p = this.createParticle(size, {
        shape: "star",
        alpha: 1.0,
        spread: 1.0,
        className: "streamAbsorb",
      });

      // start: small scatter around tap (in viewport coords)
      const launch = 8 + k * 14;
      const a0 = Math.random() * Math.PI * 2;
      const rr0 = Math.pow(Math.random(), 0.62) * launch;
      const sx = sx0 + Math.cos(a0) * rr0;
      const sy = sy0 + Math.sin(a0) * rr0;

      // end: RIM point (resonance feel)
      const a1 = Math.random() * Math.PI * 2;
      const rimJit = 5 + k * 10;
      const rr1 = r * 0.92 + this.rand(-rimJit, rimJit);
      const ex = cx + Math.cos(a1) * rr1;
      const ey = cy + Math.sin(a1) * rr1;

      // place particle in layer-local coords (because layer is the container)
      p.style.left = `${sx - layerRect.left}px`;
      p.style.top = `${sy - layerRect.top}px`;

      // vivid look on video bg
      p.style.background = color;
      p.style.opacity = "1";
      p.style.mixBlendMode = "screen";

      const g1 = 10 + k * 18 + this.rand(-2, 6);
      const g2 = 26 + k * 34 + this.rand(-4, 12);
      p.style.boxShadow =
        `0 0 ${Math.round(g1 * 0.55)}px rgba(255,255,255,0.60), ` +
        `0 0 ${g1.toFixed(0)}px ${color}, ` +
        `0 0 ${g2.toFixed(0)}px ${color}, ` +
        `0 0 ${Math.round(g2 * 1.2)}px rgba(255,255,255,0.10)`;

      p.style.filter = `brightness(${(1.30 + k * 0.45).toFixed(
        2
      )}) saturate(1.65) contrast(1.06)`;

      const s0 = 0.55 + this.rand(-0.12, 0.18);
      const rot0 = this.rand(-25, 25);
      p.style.transform = `translate(-50%,-50%) scale(${s0.toFixed(
        3
      )}) rotate(${rot0.toFixed(1)}deg)`;

      layer.appendChild(p);

      requestAnimationFrame(() => {
        const dur = durBase + this.rand(-40, durJit) + k * 80;

        // move by adjusting translate with delta (layer-local)
        const dx = (ex - layerRect.left) - (sx - layerRect.left);
        const dy = (ey - layerRect.top) - (sy - layerRect.top);

        const s1 = 0.20 + this.rand(-0.06, 0.08); // shrink into rim
        const rot1 = rot0 + this.rand(-160, 160);

        p.style.transition =
          `transform ${dur}ms cubic-bezier(.12,.92,.20,1), ` +
          `opacity ${dur}ms ease, filter ${dur}ms ease`;

        p.style.transform =
          `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(
            1
          )}px)) scale(${s1.toFixed(3)}) rotate(${rot1.toFixed(1)}deg)`;

        p.style.opacity = "0";
        p.style.filter = `brightness(${(1.05 + k * 0.20).toFixed(
          2
        )}) saturate(1.25) contrast(1.03)`;
      });

      setTimeout(() => p.remove(), 520 + k * 140);
    }

    // ring pulse sells resonance
    pulse(el);
  };
}
