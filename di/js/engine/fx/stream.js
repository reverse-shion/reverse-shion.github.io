// /di/js/engine/fx/stream.js
export function attachStream(FX) {
  FX.prototype.stream = function (x, y, target) {
    if (!target) return;

    const { x: tx, y: ty } = this.getCenter(target);

    const el = this.createParticle(10);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.background = this.getResColor();
    el.style.transform = "translate(-50%,-50%) scale(1)";
    el.style.boxShadow = `0 0 18px ${this.getResColor()}`;

    this.layer.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transition =
        "transform .55s cubic-bezier(.2,.8,.2,1), opacity .55s ease";
      el.style.left = `${tx}px`;
      el.style.top = `${ty}px`;
      el.style.transform = "translate(-50%,-50%) scale(.6)";
      el.style.opacity = "0";
    });

    setTimeout(() => el.remove(), 600);

    // 吸収パルス
    target.classList.add("absorbPulse");
    setTimeout(() => target.classList.remove("absorbPulse"), 600);
  };
}
