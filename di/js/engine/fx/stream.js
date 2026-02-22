export function attachStream(FX) {
  FX.prototype.stream = function (x, y, target) {
    if (!target) return;

    const tr = target.getBoundingClientRect();
    const lr = this.layer.getBoundingClientRect();
    const tx = tr.left + tr.width / 2 - lr.left;
    const ty = tr.top + tr.height / 2 - lr.top;

    const el = this.createParticle(10);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.background = this.getResColor();
    el.style.transform = "translate(-50%,-50%) scale(1)";
    el.style.boxShadow = `0 0 18px ${this.getResColor()}`;
    this.layer.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transition = "transform .55s cubic-bezier(.2,.8,.2,1), opacity .55s ease, left .55s cubic-bezier(.2,.8,.2,1), top .55s cubic-bezier(.2,.8,.2,1)";
      el.style.left = `${tx}px`;
      el.style.top = `${ty}px`;
      el.style.transform = "translate(-50%,-50%) scale(.6)";
      el.style.opacity = "0";
    });

    setTimeout(() => el.remove(), 620);

    target.classList.add("absorbPulse");
    setTimeout(() => target.classList.remove("absorbPulse"), 620);
  };
}
