// /di/js/engine/fx/burst.js
// BURST — FLASHY "Resonance Spark" (PRO)
// - Punchy, colorful, clearly visible on video backgrounds
// - White-hot core + colored glow (so color never "disappears")
// - Still world-safe (NOT fireworks), iOS-safe (low DOM, transform/opacity/filter only)
// - Resonance drives count / brightness / spread (clamped)

export function attachBurst(FX) {
  FX.prototype.burst = function (x, y) {
    const color = this.getResColor();

    // intensity 0..1
    const k = Math.max(0, Math.min(1, Number(this.intensity) || 0));

    // iOS-safe limits (but more "punch" via glow/core, not count)
    const COUNT_MIN = 8;
    const COUNT_MAX = 18;
    const count = Math.round(COUNT_MIN + (COUNT_MAX - COUNT_MIN) * (k * 0.95));

    // spread: slightly wider (still controlled)
    const spread = 12 + k * 18; // px radius-ish
    const lifeBase = 380;       // ms
    const lifeJit  = 180;       // ms

    // helpers
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // "screen" blend boosts visibility on video backgrounds
    const BLEND = "screen";

    // ----- CORE SPARKLE (big, short) -----
    const coreN = k > 0.6 ? 2 : 1;

    for (let c = 0; c < coreN; c++) {
      const sz = Math.round(16 + k * 12 + this.rand(-2, 4));

      const core = this.createParticle(sz, {
        shape: "star",
        alpha: 1.0,
        spread: 0.2,
        className: "burstCore",
      });

      core.style.left = `${x}px`;
      core.style.top = `${y}px`;

      // ✅ White-hot core + colored glow (color stays visible)
      const g1 = Math.round(22 + k * 24);
      const g2 = Math.round(56 + k * 42);
      const g3 = Math.round(90 + k * 60);

      core.style.background = color;
      core.style.mixBlendMode = BLEND;
      core.style.opacity = "1";
      core.style.boxShadow =
        `0 0 ${Math.round(g1 * 0.55)}px rgba(255,255,255,0.92), ` + // white core
        `0 0 ${g1}px ${color}, ` +                                   // color glow
        `0 0 ${g2}px ${color}, ` +                                   // outer color
        `0 0 ${g3}px rgba(255,255,255,0.18)`;                        // soft halo

      core.style.filter =
        `brightness(${(1.55 + k * 0.55).toFixed(2)}) saturate(1.85) contrast(1.10)`;

      const startS = 0.58 + this.rand(-0.06, 0.08);
      const endS = 1.55 + k * 0.70 + this.rand(-0.08, 0.18);
      const rot0 = this.rand(-18, 18);
      const rot1 = rot0 + this.rand(-70, 70);

      core.style.transform =
        `translate(-50%,-50%) scale(${startS.toFixed(3)}) rotate(${rot0.toFixed(1)}deg)`;
      this.layer.appendChild(core);

      requestAnimationFrame(() => {
        const dur = 280 + k * 110 + this.rand(-20, 50);
        core.style.transition =
          `transform ${dur}ms cubic-bezier(.15,.95,.2,1), opacity ${dur}ms ease, filter ${dur}ms ease`;
        core.style.transform =
          `translate(-50%,-50%) scale(${endS.toFixed(3)}) rotate(${rot1.toFixed(1)}deg)`;
        core.style.opacity = "0";
        core.style.filter =
          `brightness(${(1.10 + k * 0.20).toFixed(2)}) saturate(1.25) contrast(1.05)`;
      });

      setTimeout(() => core.remove(), 460);
    }

    // ----- DUST SPARKLES (main) -----
    for (let i = 0; i < count; i++) {
      // size variance: biased small, but with some pop
      const base = 9 + k * 7;
      const size = Math.round(base + this.rand(-3, 10));

      const el = this.createParticle(size, {
        shape: "star",
        // ✅ raise floor so low-k is still visible
        alpha: clamp(0.90 + k * 0.10, 0.90, 1.0),
        spread: 1.0,
        className: "burstDust",
      });

      // radial distribution (biased near center)
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.pow(Math.random(), 0.58) * spread; // slightly tighter bias -> denser
      const dx = Math.cos(ang) * rad;
      const dy = Math.sin(ang) * rad;

      el.style.left = `${x + dx}px`;
      el.style.top = `${y + dy}px`;

      el.style.background = color;
      el.style.mixBlendMode = BLEND;
      el.style.opacity = "1";

      // ✅ White core + color glow (makes color readable)
      const glow = 12 + k * 22 + this.rand(-2, 6);
      const halo = 30 + k * 36 + this.rand(-4, 10);
      const far  = 54 + k * 52 + this.rand(-8, 18);

      el.style.boxShadow =
        `0 0 ${Math.round(glow * 0.50)}px rgba(255,255,255,0.65), ` + // white core
        `0 0 ${glow.toFixed(0)}px ${color}, ` +                        // color glow
        `0 0 ${halo.toFixed(0)}px ${color}, ` +                        // outer color
        `0 0 ${far.toFixed(0)}px rgba(255,255,255,0.10)`;              // soft far halo

      el.style.filter =
        `brightness(${(1.35 + k * 0.45).toFixed(2)}) saturate(1.70) contrast(1.08)`;

      // motion: punchy outward + fade
      const startS = 0.52 + this.rand(-0.10, 0.18);
      const endS = 1.20 + k * 0.95 + this.rand(-0.08, 0.55);

      const rot0 = this.rand(-22, 22);
      const rot1 = rot0 + this.rand(-120, 120);

      el.style.transform =
        `translate(-50%,-50%) scale(${startS.toFixed(3)}) rotate(${rot0.toFixed(1)}deg)`;
      this.layer.appendChild(el);

      requestAnimationFrame(() => {
        const dur = lifeBase + this.rand(-60, lifeJit) + k * 90;
        el.style.transition =
          `transform ${dur}ms cubic-bezier(.14,.90,.22,1), opacity ${dur}ms ease, filter ${dur}ms ease`;
        el.style.transform =
          `translate(-50%,-50%) scale(${endS.toFixed(3)}) rotate(${rot1.toFixed(1)}deg)`;
        el.style.opacity = "0";
        el.style.filter =
          `brightness(${(1.05 + k * 0.20).toFixed(2)}) saturate(1.20) contrast(1.05)`;
      });

      // cleanup
      const kill = 560 + k * 120;
      setTimeout(() => el.remove(), kill);
    }
  };
}
