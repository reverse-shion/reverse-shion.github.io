/* /di/js/engine/input.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Input {
    constructor({ element, onTap }) {
      this.el = element;
      this.onTap = onTap;

      this.rect = null;

      // track active pointer to avoid multi-fire
      this._activePointerId = null;

      this._bind();
      this.recalc();
      this._observe();
    }

    _observe() {
      // Keep rect fresh on layout changes
      try {
        if (typeof ResizeObserver !== "undefined") {
          this._ro = new ResizeObserver(() => this.recalc());
          this._ro.observe(this.el);
        }
      } catch (_) {}

      // iOS address bar / orientation changes
      window.addEventListener("resize", () => this.recalc(), { passive: true });
      window.addEventListener("scroll", () => this.recalc(), { passive: true });
    }

    recalc() {
      this.rect = this.el.getBoundingClientRect();
    }

    _getRectFresh() {
      // If rect is missing or suspiciously old, refresh.
      // (Simple strategy: refresh every tap + cached for that tap)
      if (!this.rect) this.rect = this.el.getBoundingClientRect();
      return this.rect;
    }

    _xyFromPointerEvent(e) {
      const r = this._getRectFresh();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    _xyFromTouchEvent(e) {
      const r = this._getRectFresh();
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!t) return { x: r.width / 2, y: r.height / 2 };
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }

    _emitTap(x, y, e) {
      // Pass high-res time to judge layer if it wants it
      const t = (e && typeof e.timeStamp === "number" && e.timeStamp > 0)
        ? e.timeStamp
        : performance.now();

      this.onTap?.(x, y, t, e);
    }

    _bind() {
      // IMPORTANT: ensure element is not hijacked by browser gestures
      // (CSS should also set touch-action:none on the hit area)
      const el = this.el;

      const hasPointer = "PointerEvent" in window;

      if (hasPointer) {
        el.addEventListener(
          "pointerdown",
          (e) => {
            // Only primary button / primary contact
            if (e.isPrimary === false) return;

            // Avoid double taps from multi-pointer
            if (this._activePointerId !== null) return;
            this._activePointerId = e.pointerId;

            e.preventDefault();

            const { x, y } = this._xyFromPointerEvent(e);
            this._emitTap(x, y, e);
          },
          { passive: false }
        );

        el.addEventListener(
          "pointerup",
          (e) => {
            if (this._activePointerId === e.pointerId) this._activePointerId = null;
          },
          { passive: true }
        );

        el.addEventListener(
          "pointercancel",
          (e) => {
            if (this._activePointerId === e.pointerId) this._activePointerId = null;
          },
          { passive: true }
        );
      } else {
        // Older iOS fallback (no pointer events)
        el.addEventListener(
          "touchstart",
          (e) => {
            // single-touch only
            if (e.touches && e.touches.length > 1) return;

            e.preventDefault();

            const { x, y } = this._xyFromTouchEvent(e);
            this._emitTap(x, y, e);
          },
          { passive: false }
        );
      }
    }

    simTapCenter() {
      const r = this._getRectFresh();
      this.onTap?.(r.width / 2, r.height / 2, performance.now(), null);
    }
  }

  NS.Input = Input;
})();
