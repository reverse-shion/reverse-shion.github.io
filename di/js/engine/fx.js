/* /di/js/engine/fx.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class FX {
    constructor({ fxLayer, appRoot }) {
      this.layer = fxLayer;
      this.app = appRoot;
      this._pool = [];
    }

    /* =========================
       Utility
    ========================== */

    _getResColor() {
      if (!this.app) return "rgba(0,240,255,.9)";
      return getComputedStyle(this.app)
        .getPropertyValue("--res-color")
        .trim() || "rgba(0,240,255,.9)";
    }

    _createParticle(size = 14) {
      const el = document.createElement("div");
      el.className = "fxParticle";
      el.style.width = size + "px";
      el.style.height = size + "px";
      return el;
    }

    /* =========================
       Burst (判定爆発)
    ========================== */

    burstAt(x, y) {
      if (!this.layer) return;

      const el = this._createParticle(16);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.border = `2px solid ${this._getResColor()}`;
      el.style.boxShadow = `0 0 22px ${this._getResColor()}`;

      this.layer.appendChild(el);

      requestAnimationFrame(() => {
        el.classList.add("burstGo");
      });

      setTimeout(() => el.remove(), 520);
    }

    /* =========================
       吸収ストリーム（共鳴演出）
    ========================== */

    streamToAvatar(fromX, fromY, avatarEl) {
      if (!this.layer || !avatarEl) return;

      const rect = avatarEl.getBoundingClientRect();
      const toX = rect.left + rect.width / 2;
      const toY = rect.top + rect.height / 2;

      const el = this._createParticle(10);
      el.style.left = `${fromX}px`;
      el.style.top = `${fromY}px`;
      el.style.background = this._getResColor();
      el.style.boxShadow = `0 0 14px ${this._getResColor()}`;

      this.layer.appendChild(el);

      requestAnimationFrame(() => {
        el.style.transition =
          "all .55s cubic-bezier(.2,.8,.2,1)";
        el.style.left = `${toX}px`;
        el.style.top = `${toY}px`;
        el.style.opacity = "0";
        el.style.transform = "translate(-50%,-50%) scale(.6)";
      });

      setTimeout(() => el.remove(), 600);
    }

    /* =========================
       MAXカットインフラッシュ
    ========================== */

    fullFlash() {
      if (!this.layer) return;

      const el = document.createElement("div");
      el.className = "fxFullFlash";
      el.style.background = this._getResColor();

      this.layer.appendChild(el);

      requestAnimationFrame(() => el.classList.add("go"));
      setTimeout(() => el.remove(), 600);
    }

    /* =========================
       鼓動トリガー
    ========================== */

    triggerHeartbeat() {
      if (!this.app) return;

      this.app.classList.add("isHeartbeat");
      setTimeout(() => {
        this.app.classList.remove("isHeartbeat");
      }, 650);
    }
  }

  /* =========================
     CSS Injection (Engine Level)
  ========================== */

  const style = document.createElement("style");
  style.textContent = `
    .fxParticle{
      position:absolute;
      transform: translate(-50%,-50%) scale(.6);
      border-radius:999px;
      pointer-events:none;
      opacity:0;
    }

    .fxParticle.burstGo{
      opacity:1;
      transform: translate(-50%,-50%) scale(2.4);
      transition: transform .48s ease, opacity .48s ease;
      opacity:0;
    }

    .fxFullFlash{
      position:absolute;
      inset:0;
      pointer-events:none;
      opacity:0;
      mix-blend-mode:screen;
    }

    .fxFullFlash.go{
      opacity:.25;
      transition: opacity .45s ease;
      opacity:0;
    }
  `;
  document.head.appendChild(style);

  NS.FX = FX;
})();
