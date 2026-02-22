// /di/js/engine/fx/burst.js
export function attachBurst(FX) {
  FX.prototype.burst = function (x, y) {
    const el = this.createParticle(16);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.border = `2px solid ${this.getResColor()}`;
    el.style.transform = "translate(-50%,-50%) scale(.6)";
    this.layer.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transition = "transform .45s ease, opacity .45s ease";
      el.style.opacity = "1";
      el.style.transform = "translate(-50%,-50%) scale(2.4)";
      el.style.opacity = "0";
    });

    setTimeout(() => el.remove(), 500);
  };
}
