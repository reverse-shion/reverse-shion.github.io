// /di/js/engine/fx/burst.js
export function attachBurst(FX) {
  FX.prototype.burst = function (x, y) {
    const color = this.getResColor();

    // resonance-driven count: 4..14
    const k = this.intensity || 0;
    const count = Math.round(4 + k * 10);

    for (let i = 0; i < count; i++) {
      // random size: 6..18 (+ resonance bonus)
      const size = Math.round(this.rand(6, 14) + k * this.rand(0, 10));

      const el = this.createParticle(size, { shape: "star" });

      // slight spread
      const dx = this.rand(-14, 14);
      const dy = this.rand(-14, 14);

      el.style.left = `${x + dx}px`;
      el.style.top = `${y + dy}px`;

      // make it POP: fill + glow
      el.style.background = color;
      el.style.boxShadow = `0 0 ${Math.round(10 + k * 20)}px ${color}, 0 0 ${Math.round(
        22 + k * 34
      )}px ${color}`;
      el.style.filter = `brightness(${(1.05 + k * 0.35).toFixed(2)}) saturate(1.25)`;

      const startScale = this.rand(0.4, 0.9);
      const endScale = this.rand(1.6, 3.2) + k * this.rand(0.0, 1.2);

      el.style.transform = `translate(-50%,-50%) scale(${startScale.toFixed(3)}) rotate(${this.rand(
        -40,
        40
      ).toFixed(1)}deg)`;
      el.style.opacity = "1";

      this.layer.appendChild(el);

      requestAnimationFrame(() => {
        const dur = 420 + this.rand(-60, 120) + k * 80;
        el.style.transition = `transform ${dur}ms cubic-bezier(.2,.9,.2,1), opacity ${dur}ms ease, filter ${dur}ms ease`;
        el.style.transform = `translate(-50%,-50%) scale(${endScale.toFixed(3)}) rotate(${this.rand(
          -220,
          220
        ).toFixed(1)}deg)`;
        el.style.opacity = "0";
        el.style.filter = `brightness(${(0.95 + k * 0.15).toFixed(2)}) saturate(1.1)`;
      });

      setTimeout(() => el.remove(), 650);
    }
  };
}
