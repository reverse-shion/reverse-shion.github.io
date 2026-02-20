/* /di/js/engine/input.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Input {
    constructor({ element, onTap }) {
      this.el = element;
      this.onTap = onTap;
      this.rect = null;

      this._activePointerId = null;

      this.recalc();
      this._bind();
      this._observe();
    }

    _observe() {
      try {
        if (typeof ResizeObserver !== "undefined") {
          this._ro = new ResizeObserver(() => this.recalc());
          this._ro.observe(this.el);
        }
      } catch (_) {}

      const reset = () => (this._activePointerId = null);
      window.addEventListener("resize", () => { this.recalc(); reset(); }, { passive: true });
      window.addEventListener("scroll", () => { this.recalc(); }, { passive: true });
      window.addEventListener("blur", reset, { passive: true });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) reset();
      }, { passive: true });
    }

    recalc() {
      this.rect = this.el.getBoundingClientRect();
    }

    _getRectFresh() {
      // iOSのアドレスバー伸縮などでズレるので、タップ時に必ず取り直す
      this.rect = this.el.getBoundingClientRect();
      return this.rect;
    }

    _xyFromPointer(e) {
      const r = this._getRectFresh();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    _xyFromTouch(e) {
      const r = this._getRectFresh();
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!t) return { x: r.width / 2, y: r.height / 2 };
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }

    _emit(x, y, e) {
      const t = (typeof e?.timeStamp === "number" && e.timeStamp > 0) ? e.timeStamp : performance.now();
      this.onTap?.(x, y, t, e);
    }

    _bind() {
      const el = this.el;
      const hasPointer = "PointerEvent" in window;

      if (hasPointer) {
        const down = (e) => {
          if (e.isPrimary === false) return;
          if (this._activePointerId !== null) return;

          this._activePointerId = e.pointerId;

          // ★これが重要：pointerup/cancel を確実に受け取る
          try { el.setPointerCapture(e.pointerId); } catch (_) {}

          e.preventDefault();
          const { x, y } = this._xyFromPointer(e);
          this._emit(x, y, e);
        };

        const up = (e) => {
          if (this._activePointerId === e.pointerId) this._activePointerId = null;
          try { el.releasePointerCapture(e.pointerId); } catch (_) {}
        };

        el.addEventListener("pointerdown", down, { passive: false });
        el.addEventListener("pointerup", up, { passive: true });
        el.addEventListener("pointercancel", up, { passive: true });
        el.addEventListener("lostpointercapture", () => { this._activePointerId = null; }, { passive: true });
      } else {
        // 古いiOS用
        el.addEventListener("touchstart", (e) => {
          if (e.touches && e.touches.length > 1) return;
          e.preventDefault();
          const { x, y } = this._xyFromTouch(e);
          this._emit(x, y, e);
        }, { passive: false });
      }
    }

    simTapCenter() {
      const r = this._getRectFresh();
      this.onTap?.(r.width / 2, r.height / 2, performance.now(), null);
    }
  }

  NS.Input = Input;
})();
