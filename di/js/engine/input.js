/* /di/js/engine/input.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Input {
    constructor({ element, onTap }) {
      this.el = element;
      this.onTap = onTap;
      this.rect = null;

      this._bind();
      this.recalc();
    }

    recalc() {
      this.rect = this.el.getBoundingClientRect();
    }

    _xyFromEvent(e) {
      const r = this.rect || this.el.getBoundingClientRect();
      let clientX, clientY;

      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const x = (clientX - r.left);
      const y = (clientY - r.top);
      return { x, y };
    }

    _bind() {
      // Pointer events (preferred)
      const tap = (e) => {
        e.preventDefault();
        const { x, y } = this._xyFromEvent(e);
        this.onTap?.(x, y);
      };

      this.el.addEventListener("pointerdown", tap, { passive: false });

      // iOS older touch fallback
      this.el.addEventListener("touchstart", tap, { passive: false });
    }

    simTapCenter() {
      const r = this.rect || this.el.getBoundingClientRect();
      this.onTap?.(r.width / 2, r.height / 2);
    }
  }

  NS.Input = Input;
})();
