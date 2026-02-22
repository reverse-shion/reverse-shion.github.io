/* /di/js/engine/fx.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class FX {
    constructor({ fxLayer }) {
      this.layer = fxLayer;
    }

    burstAt(x, y) {
      // create a small burst ring in fxLayer coordinate space
      const el = document.createElement("div");
      el.className = "fxBurst";
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      this.layer.appendChild(el);

      requestAnimationFrame(() => el.classList.add("go"));
      setTimeout(() => el.remove(), 520);
    }

    sparkLine() {
      // tiny sparkle somewhere random
      const el = document.createElement("div");
      el.className = "fxSpark";
      el.style.left = `${30 + Math.random() * 40}%`;
      el.style.top = `${20 + Math.random() * 50}%`;
      this.layer.appendChild(el);
      requestAnimationFrame(() => el.classList.add("go"));
      setTimeout(() => el.remove(), 520);
    }
  }

  // inject minimal css for fx elements (kept in JS so you don't need extra file)
  const style = document.createElement("style");
  style.textContent = `
    .fxBurst, .fxSpark{
      position:absolute;
      width:14px; height:14px;
      transform: translate(-50%,-50%) scale(.6);
      border-radius:999px;
      pointer-events:none;
      opacity:0;
    }
    .fxBurst{
      border: 2px solid rgba(0,240,255,.55);
      box-shadow: 0 0 18px rgba(0,240,255,.20), 0 0 20px rgba(156,60,255,.14);
    }
    .fxBurst.go{
      opacity:1;
      transform: translate(-50%,-50%) scale(2.3);
      transition: transform .48s ease, opacity .48s ease;
      opacity:0;
    }
    .fxSpark{
      width:10px; height:10px;
      background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.65), rgba(0,240,255,.18) 55%, transparent 70%);
      filter: drop-shadow(0 0 10px rgba(0,240,255,.18));
    }
    .fxSpark.go{
      opacity:1;
      transform: translate(-50%,-50%) scale(2.0);
      transition: transform .48s ease, opacity .48s ease;
      opacity:0;
    }
  `;
  document.head.appendChild(style);

  NS.FX = FX;
})();
