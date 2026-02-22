// /di/js/engine/fx/stream.js
export function attachStream(FX) {
  FX.prototype.stream = function (x, y, target) {
    if (!target) return;

    const tr = target.getBoundingClientRect();
    const lr = this.layer.getBoundingClientRect();
    const tx = tr.left + tr.width / 2 - lr.left;
    const ty = tr.top + tr.height / 2 - lr.top;

    const color = this.getResColor();
    const k = this.intensity || 0;

    // resonance-driven stream count: 3..12
    const count = Math.round(3 + k * 9);

    for (let i = 0; i < count; i++) {
      const size = Math.round(this.rand(5, 10) + k * this.rand(0, 8));
      const el = this.createParticle(size, { shape: "star" });

      // start jitter
      const jx = this.rand(-10, 10);
      const jy = this.rand(-10, 10);

      el.style.left = `${x + jx}px`;
      el.style.top = `${y + jy}px`;

      // glow stronger
      el.style.background = color;
      el.style.boxShadow = `0 0 ${Math.round(12 + k * 22)}px ${color}, 0 0 ${Math.round(
        28 + k * 36
      )}px ${color}`;
      el.style.opacity = "1";

      const rot0 = this.rand(-45, 45);
      el.style.transform = `translate(-50%,-50%) scale(1) rotate(${rot0.toFixed(1)}deg)`;
      this.layer.appendChild(el);

      requestAnimationFrame(() => {
        const dur = 520 + this.rand(-80, 140) + k * 110;
        el.style.transition =
          `left ${dur}ms cubic-bezier(.2,.8,.2,1), ` +
          `top ${dur}ms cubic-bezier(.2,.8,.2,1), ` +
          `transform ${dur}ms cubic-bezier(.2,.8,.2,1), ` +
          `opacity ${dur}ms ease`;

        // arrive with a bit of swirl
        const midx = (x + tx) / 2 + this.rand(-18, 18);
        const midy = (y + ty) / 2 + this.rand(-18, 18);

        // two-step path: simulate by setting final, with rotation + shrink
        el.style.left = `${tx + this.rand(-6, 6)}px`;
        el.style.top = `${ty + this.rand(-6, 6)}px`;

        const endScale = (0.35 + this.rand(0, 0.25)).toFixed(3);
        const rot1 = this.rand(-220, 220);
        el.style.transform = `translate(-50%,-50%) scale(${endScale}) rotate(${rot1.toFixed(1)}deg)`;
        el.style.opacity = "0";
      });

      setTimeout(() => el.remove(), 780);
    }

    // pulse feedback on target
    target.classList.add("absorbPulse");
    setTimeout(() => target.classList.remove("absorbPulse"), 520);
  };
}
