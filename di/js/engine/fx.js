/* /di/js/engine/fx.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class FX {
    constructor({ fxLayer }) {
      this.layer = fxLayer;
      if (!this.layer) {
        console.warn("FX: fxLayer missing");
      }
    }

    burstAt(x, y) {
      if (!this.layer) return;

      const el = document.createElement("div");
      el.className = "fxBurst";
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      this.layer.appendChild(el);

      requestAnimationFrame(() => {
        el.classList.add("go");

        // fade out slightly after appearing
        setTimeout(() => {
          el.style.opacity = "0";
        }, 80);
      });

      setTimeout(() => el.remove(), 520);
    }

    sparkLine() {
      if (!this.layer) return;

      const el = document.createElement("div");
      el.className = "fxSpark";
      el.style.left = `${30 + Math.random() * 40}%`;
      el.style.top = `${20 + Math.random() * 50}%`;

      this.layer.appendChild(el);

      requestAnimationFrame(() => {
        el.classList.add("go");

        setTimeout(() => {
          el.style.opacity = "0";
        }, 80);
      });

      setTimeout(() => el.remove(), 520);
    }
  }

  const style = document.createElement("style");
  style.textContent = `
    .fxBurst, .fxSpark{
      position:absolute;
      width:14px;
      height:14px;
      transform: translate(-50%,-50%) scale(.6);
      border-radius:999px;
      pointer-events:none;
      opacity:0;
      transition: transform .48s ease, opacity .48s ease;
      will-change: transform, opacity;
    }

    .fxBurst{
      border: 2px solid rgba(0,240,255,.65);
      box-shadow:
        0 0 18px rgba(0,240,255,.35),
        0 0 24px rgba(156,60,255,.25);
    }

    .fxBurst.go{
      opacity:1;
      transform: translate(-50%,-50%) scale(2.3);
    }

    .fxSpark{
      width:10px;
      height:10px;
      background:
        radial-gradient(circle at 50% 50%,
        rgba(255,255,255,.85),
        rgba(0,240,255,.35) 55%,
        transparent 70%);
      filter: drop-shadow(0 0 12px rgba(0,240,255,.4));
    }

    .fxSpark.go{
      opacity:1;
      transform: translate(-50%,-50%) scale(2.0);
    }
  `;
  document.head.appendChild(style);

  NS.FX = FX;
})();
