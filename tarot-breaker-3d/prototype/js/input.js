import { clamp } from './state.js?v=p2-1.5.0';

export class InputController {
  constructor({ stick, thumb, look, onLook, onInteract, target = window }) {
    this.stick = stick;
    this.thumb = thumb;
    this.look = look;
    this.keys = new Set();
    this.enabled = false;
    this.axis = { x: 0, z: 0 };
    this.gesture = null;
    this.lookPointer = null;
    this.cleanups = [];

    const on = (el, type, fn, options) => {
      el.addEventListener(type, fn, options);
      this.cleanups.push(() => el.removeEventListener(type, fn, options));
    };

    const setCapture = (el, id) => {
      try { el.setPointerCapture(id); } catch (_) {}
    };
    const releaseCapture = (el, id) => {
      try { if (el.hasPointerCapture?.(id)) el.releasePointerCapture(id); } catch (_) {}
    };

    const beginGesture = e => {
      e.preventDefault();
      setCapture(look, e.pointerId);
      this.gesture = {
        id: e.pointerId,
        el: look,
        startX: e.clientX,
        startY: e.clientY,
        moved: false
      };
    };

    const beginLook = e => {
      e.preventDefault();
      setCapture(look, e.pointerId);
      this.lookPointer = {
        id: e.pointerId,
        el: look,
        x: e.clientX,
        y: e.clientY
      };
    };

    // Gameplay must win over Safari text selection / callouts.
    for (const type of ['contextmenu', 'selectstart', 'dragstart']) {
      on(look, type, e => e.preventDefault());
    }

    // One-finger swipe anywhere = movement command.
    // A completed swipe latches movement so the player walks smoothly without
    // repeatedly dragging. A simple tap stops movement.
    // A second simultaneous finger is reserved for manual camera adjustment.
    on(look, 'pointerdown', e => {
      if (!this.enabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const coarse = e.pointerType === 'touch' || e.pointerType === 'pen';
      if (coarse) {
        if (!this.gesture) beginGesture(e);
        else if (!this.lookPointer && e.pointerId !== this.gesture.id) beginLook(e);
        return;
      }
      if (!this.lookPointer) beginLook(e);
    }, { passive: false });

    on(look, 'pointermove', e => {
      if (!this.enabled) return;

      if (this.gesture?.id === e.pointerId) {
        e.preventDefault();
        const dx = e.clientX - this.gesture.startX;
        const dy = e.clientY - this.gesture.startY;
        const distance = Math.hypot(dx, dy);
        if (distance < 8) return;

        this.gesture.moved = true;
        // Lock to one of four cardinal directions. This removes thumb drift and
        // makes "up means straight forward" deterministic on a phone.
        if (Math.abs(dy) >= Math.abs(dx)) {
          this.axis = { x: 0, z: dy < 0 ? -1 : 1 };
        } else {
          this.axis = { x: dx < 0 ? -1 : 1, z: 0 };
        }
        return;
      }

      if (this.lookPointer?.id === e.pointerId) {
        e.preventDefault();
        onLook(e.clientX - this.lookPointer.x, e.clientY - this.lookPointer.y);
        this.lookPointer.x = e.clientX;
        this.lookPointer.y = e.clientY;
      }
    }, { passive: false });

    const finish = e => {
      if (this.gesture?.id === e.pointerId) {
        const moved = this.gesture.moved;
        releaseCapture(this.gesture.el, e.pointerId);
        this.gesture = null;
        if (!moved) this.stopMovement();
        return;
      }
      if (this.lookPointer?.id === e.pointerId) {
        releaseCapture(this.lookPointer.el, e.pointerId);
        this.lookPointer = null;
      }
    };

    on(look, 'pointerup', finish);
    on(look, 'lostpointercapture', finish);
    on(look, 'pointercancel', e => {
      if (this.gesture?.id === e.pointerId) {
        releaseCapture(this.gesture.el, e.pointerId);
        this.gesture = null;
        this.stopMovement();
      }
      if (this.lookPointer?.id === e.pointerId) {
        releaseCapture(this.lookPointer.el, e.pointerId);
        this.lookPointer = null;
      }
    });

    // Hidden compatibility target retained for the existing automated input test.
    on(stick, 'pointerdown', e => {
      if (!this.enabled) return;
      e.preventDefault();
      setCapture(stick, e.pointerId);
      const rect = stick.getBoundingClientRect();
      this.gesture = {
        id: e.pointerId,
        el: stick,
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
        moved: false
      };
    });
    on(stick, 'pointermove', e => {
      if (!this.enabled || this.gesture?.id !== e.pointerId) return;
      e.preventDefault();
      const dx = e.clientX - this.gesture.startX;
      const dy = e.clientY - this.gesture.startY;
      if (Math.hypot(dx, dy) < 6) return;
      this.gesture.moved = true;
      if (Math.abs(dy) >= Math.abs(dx)) this.axis = { x: 0, z: dy < 0 ? -1 : 1 };
      else this.axis = { x: dx < 0 ? -1 : 1, z: 0 };
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(stick, type, finish);

    on(target, 'keydown', e => {
      if (!this.enabled || /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target?.tagName)) return;
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
        this.keys.add(e.code);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        this.stopMovement();
      }
      if (e.code === 'KeyE' && !e.repeat) {
        e.preventDefault();
        onInteract();
      }
    });
    on(target, 'keyup', e => this.keys.delete(e.code));
    on(target, 'blur', () => this.reset());
    on(target, 'resize', () => this.reset());
  }

  sample() {
    if (!this.enabled) return { x: 0, z: 0 };
    const has = (...codes) => codes.some(c => this.keys.has(c)) ? 1 : 0;
    return {
      x: clamp(this.axis.x + has('KeyD','ArrowRight') - has('KeyA','ArrowLeft'), -1, 1),
      z: clamp(this.axis.z + has('KeyS','ArrowDown') - has('KeyW','ArrowUp'), -1, 1)
    };
  }

  isMoving() {
    return Math.abs(this.axis.x) > 0.01 || Math.abs(this.axis.z) > 0.01 || this.keys.size > 0;
  }

  stopMovement() {
    this.axis = { x: 0, z: 0 };
  }

  reset() {
    if (this.gesture) releaseCapture(this.gesture.el, this.gesture.id);
    if (this.lookPointer) releaseCapture(this.lookPointer.el, this.lookPointer.id);
    this.gesture = null;
    this.lookPointer = null;
    this.keys.clear();
    this.stopMovement();
  }

  setEnabled(value) {
    this.enabled = value;
    if (!value) this.reset();
  }

  dispose() {
    this.setEnabled(false);
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
  }
}
