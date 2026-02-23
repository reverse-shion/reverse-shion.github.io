// /di/js/engine/fx/stream.js
// STREAM — Tap -> Fly -> Ring Absorb (RIM) [PRO]
// ✅ Start position = tap (fxLayer local coords)
// ✅ End position   = ring rim (fxLayer local coords)
// ✅ iOS safe: low DOM count, transform/opacity/filter only

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

    const layer = this.layer; // #fxLayer
    if (!layer) return;

    const color = this.getResColor();
    const k = clamp(Number(this.intensity) || 0, 0, 1);

    const el =
      targetEl ||
      document.getElementById("avatarRing") ||
      document.querySelector(".avatarRing") ||
      null;

    if (!el) return;

    // --- convert target rect (viewport) -> layer local coords ---
    const layerRect = layer.getBoundingClientRect();
    const rc = el.getBoundingClientRect();

    const cx = (rc.left + rc.width / 2) - layerRect.left;
    const cy = (rc.top + rc.height / 2) - layerRect.top;
    const r = Math.max(10, Math.min(rc.width, rc.height) / 2);

    // iOS safe count（派手さは glow で作る）
    const COUNT_MIN = 10;
    const COUNT_MAX = 18;
    const count = Math.round(COUNT_MIN + (COUNT_MAX - COUNT_MIN) * (k * 0.95));

    const durBase = 260;
    const durJit = 140;

    // tap周りの「出現の散り」
    const launch = 8 + k * 14;

    // rim着地点の揺れ
    const rimJit = 5 + k * 10;

    for (let i = 0; i < count; i++) {
      const size = Math.round(6 + k * 6 + this.rand(-2, 6));

      const p = this.createParticle(size, {
        shape: "star",
        alpha: 1.0,
        spread: 1.0,
        className: "streamAbsorb",
      });

      // ✅ START = TAP（layer local）
      const a0 = Math.random() * Math.PI * 2;
      const rr0 = Math.pow(Math.random(), 0.62) * launch;
      const sx = x + Math.cos(a0) * rr0;
      const sy = y + Math.sin(a0) * rr0;

      // ✅ END = RING RIM（layer local）
      const a1 = Math.random() * Math.PI * 2;
      const rr1 = r * 0.92 + this.rand(-rimJit, rimJit);
      const ex = cx + Math.cos(a1) * rr1;
      const ey = cy + Math.sin(a1) * rr1;

      // Place at start
      p.style.left = `${sx}px`;
      p.style.top = `${sy}px`;

      // Vivid on video bg
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

      // Animate: move from tap->rim by delta
      requestAnimationFrame(() => {
        const dur = durBase + this.rand(-40, durJit) + k * 80;

        const dx = ex - sx;
        const dy = ey - sy;

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

    // ring pulse = resonance feedback
    pulse(el);
  };
}
