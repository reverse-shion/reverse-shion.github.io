// /di/js/engine/fx/divine.js
export function attachDivine(FX) {
  FX.prototype.divine = function () {
    const el = document.createElement("div");
    el.className = "fxFullFlash";
    el.style.background = this.getResColor();
    this.layer.appendChild(el);

    requestAnimationFrame(() => {
      el.classList.add("go");
    });

    setTimeout(() => el.remove(), 600);
  };
}
