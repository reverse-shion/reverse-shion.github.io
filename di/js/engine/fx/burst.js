// /di/js/engine/fx/burst.js
// BURST — World-safe "Resonance Spark"
// - looks flashy without becoming "fireworks"
// - star particles with size variance
// - resonance drives count / brightness / spread (clamped)
// - iOS safe: low DOM count + transform/opacity only

export function attachBurst(FX) {
  FX.prototype.burst = function (x, y) {
    const color = this.getResColor();

    // intensity 0..1
    const k = Math.max(0, Math.min(1, Number(this.intensity) || 0));

    // world-safe limits
    const COUNT_MIN = 6;
    const COUNT_MAX = 14; // keep light on iOS
    const count = Math.round(COUNT_MIN + (COUNT_MAX - COUNT_MIN) * (k * 0.92));

    // spread: modest (world-safe), slightly increases with resonance
    const spread = 10 + k * 12; // px radius-ish
    const lifeBase = 360;       // ms
    const lifeJit  = 140;       // ms

    // --- core sparkle (1~2 big, short) ---
    const coreN = k > 0.65 ? 2 : 1;
    for (let c = 0; c < coreN; c++) {
      const sz = Math.round(14 + k * 10 + this.rand(-2, 3));
      const core = this.createParticle(sz, {
        shape: "star",
        alpha: 0.95,
        spread: 0.25, // almost fixed
        className: "burstCore",
      });

      core.style.left = `${x}px`;
      core.style.top = `${y}px`;

      // glow: strong but controlled
      const g1 = Math.round(16 + k * 18);
      const g2 = Math.round(36 + k * 30);
      core.style.background = color;
      core.style.boxShadow = `0 0 ${g1}px ${color}, 0 0 ${g2}px rgba(255,255,255,0.12)`;
      core.style.filter = `brightness(${(1.15 + k * 0.25).toFixed(2)}) saturate(1.25)`;

      const startS = 0.55 + this.rand(-0.06, 0.08);
      const endS = 1.35 + k * 0.55 + this.rand(-0.08, 0.14);
      const rot0 = this.rand(-14, 14);
      const rot1 = rot0 + this.rand(-35, 35);

      core.style.transform = `translate(-50%,-50%) scale(${startS.toFixed(3)}) rotate(${rot0.toFixed(1)}deg)`;
      this.layer.appendChild(core);

      requestAnimationFrame(() => {
        const dur = 260 + k * 80 + this.rand(-20, 40);
        core.style.transition = `transform ${dur}ms cubic-bezier(.2,.9,.2,1), opacity ${dur}ms ease, filter ${dur}ms ease`;
        core.style.transform = `translate(-50%,-50%) scale(${endS.toFixed(3)}) rotate(${rot1.toFixed(1)}deg)`;
        core.style.opacity = "0";
        core.style.filter = `brightness(${(1.0 + k * 0.10).toFixed(2)}) saturate(1.1)`;
      });

      setTimeout(() => core.remove(), 420);
    }

    // --- dust sparkles (main) ---
    for (let i = 0; i < count; i++) {
      // size variance: 6..18-ish (biased small)
      const base = 8 + k * 6;
      const size = Math.round(base + this.rand(-3, 9));

      const el = this.createParticle(size, {
        shape: "star",
        alpha: 0.78 + k * 0.18, // world-safe
        spread: 1.0,            // enable size randomness in core.js too
        className: "burstDust",
      });

      // radial distribution (biased near center)
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.pow(Math.random(), 0.62) * spread; // bias
      const dx = Math.cos(ang) * rad;
      const dy = Math.sin(ang) * rad;

      el.style.left = `${x + dx}px`;
      el.style.top = `${y + dy}px`;

      // look: soft neon sparkle (not fireworks)
      el.style.background = color;

      const glow = 8 + k * 14 + this.rand(-2, 4);
      const halo = 18 + k * 22 + this.rand(-4, 8);
      el.style.boxShadow = `0 0 ${glow.toFixed(0)}px ${color}, 0 0 ${halo.toFixed(0)}px rgba(255,255,255,0.10)`;
      el.style.filter = `brightness(${(1.05 + k * 0.20).toFixed(2)}) saturate(1.18)`;

      // motion: short "breathe outward" + fade
      const startS = 0.50 + this.rand(-0.12, 0.18);
      const endS = 1.05 + k * 0.70 + this.rand(-0.10, 0.40);

      // small rotation only (world-safe)
      const rot0 = this.rand(-18, 18);
      const rot1 = rot0 + this.rand(-60, 60);

      el.style.transform = `translate(-50%,-50%) scale(${startS.toFixed(3)}) rotate(${rot0.toFixed(1)}deg)`;
      this.layer.appendChild(el);

      requestAnimationFrame(() => {
        const dur = lifeBase + this.rand(-40, lifeJit) + k * 60;
        el.style.transition =
          `transform ${dur}ms cubic-bezier(.2,.85,.2,1), opacity ${dur}ms ease, filter ${dur}ms ease`;
        el.style.transform = `translate(-50%,-50%) scale(${endS.toFixed(3)}) rotate(${rot1.toFixed(1)}deg)`;
        el.style.opacity = "0";
        el.style.filter = `brightness(${(0.98 + k * 0.12).toFixed(2)}) saturate(1.08)`;
      });

      // cleanup
      const kill = 520 + k * 80;
      setTimeout(() => el.remove(), kill);
    }
  };
}
