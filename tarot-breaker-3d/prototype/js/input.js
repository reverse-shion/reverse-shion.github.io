import { clamp } from './state.js?v=p2-1.3.0';

export class InputController {
  constructor({ stick, thumb, look, onLook, onInteract, target = window }) {
    this.stick = stick;
    this.thumb = thumb;
    this.look = look;
    this.keys = new Set();
    this.enabled = false;
    this.axis = { x: 0, z: 0 };
    this.pointers = new Map();
    this.cleanups = [];

    const on = (el, type, fn, options) => {
      el.addEventListener(type, fn, options);
      this.cleanups.push(() => el.removeEventListener(type, fn, options));
    };

    const setCapture = (el, id) => {
      try { el.setPointerCapture(id); } catch (_) {}
    };

    const moveActive = () => [...this.pointers.values()].some(p => p.kind === 'move');
    const lookActive = () => [...this.pointers.values()].some(p => p.kind === 'look');

    const beginMove = (e, el, originX, originY, radius = 44) => {
      if (!this.enabled || moveActive()) return false;
      e.preventDefault();
      setCapture(el, e.pointerId);
      this.pointers.set(e.pointerId, {
        kind: 'move',
        el,
        x: e.clientX,
        y: e.clientY,
        originX,
        originY,
        radius
      });
      this.updateMove(e, this.pointers.get(e.pointerId));
      return true;
    };

    const beginLook = (e, el) => {
      if (!this.enabled || lookActive()) return false;
      e.preventDefault();
      setCapture(el, e.pointerId);
      this.pointers.set(e.pointerId, {
        kind: 'look',
        el,
        x: e.clientX,
        y: e.clientY
      });
      return true;
    };

    const finish = e => {
      const entry = this.pointers.get(e.pointerId);
      if (!entry) return;
      this.pointers.delete(e.pointerId);
      if (entry.kind === 'move') this.axis = { x: 0, z: 0 };
      try {
        if (entry.el.hasPointerCapture?.(e.pointerId)) entry.el.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };

    // Mobile: the screen itself is the controller.
    // Left half = move from the point where the thumb lands.
    // Right half = camera. No visible joystick is required.
    on(look, 'pointerdown', e => {
      if (!this.enabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const coarse = e.pointerType === 'touch' || e.pointerType === 'pen';
      const width = target.innerWidth || document.documentElement.clientWidth || 390;
      if (coarse && !moveActive() && e.clientX < width * 0.5) {
        beginMove(e, look, e.clientX, e.clientY, 44);
      } else {
        beginLook(e, look);
      }
    });

    on(look, 'pointermove', e => {
      const p = this.pointers.get(e.pointerId);
      if (!this.enabled || !p) return;
      e.preventDefault();
      if (p.kind === 'move') {
        this.updateMove(e, p);
      } else {
        onLook(e.clientX - p.x, e.clientY - p.y);
        p.x = e.clientX;
        p.y = e.clientY;
      }
    });

    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      on(look, type, finish);
    }

    // Hidden fallback target retained for automated tests and non-touch fallback.
    on(stick, 'pointerdown', e => {
      if (!this.enabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const rect = stick.getBoundingClientRect();
      const radius = Math.max(24, Math.min(rect.width || 100, rect.height || 100) * 0.32);
      beginMove(e, stick, rect.left + rect.width / 2, rect.top + rect.height / 2, radius);
    });

    on(stick, 'pointermove', e => {
      const p = this.pointers.get(e.pointerId);
      if (!this.enabled || !p || p.kind !== 'move') return;
      e.preventDefault();
      this.updateMove(e, p);
    });

    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      on(stick, type, finish);
    }

    on(target, 'keydown', e => {
      if (!this.enabled || /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target?.tagName)) return;
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
        this.keys.add(e.code);
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

  updateMove(e, entry) {
    const dx = e.clientX - entry.originX;
    const dy = e.clientY - entry.originY;
    const distance = Math.hypot(dx, dy);
    const deadzone = 6;

    if (distance <= deadzone) {
      this.axis = { x: 0, z: 0 };
      return;
    }

    let x = dx / distance;
    let z = dy / distance;
    const absX = Math.abs(x);
    const absZ = Math.abs(z);

    // Strong cardinal assistance for touch screens. A mostly vertical gesture
    // becomes perfectly straight forward/back even when the thumb drifts sideways.
    if (absX <= absZ * 0.58) {
      x = 0;
      z = Math.sign(z);
    } else if (absZ <= absX * 0.42) {
      x = Math.sign(x);
      z = 0;
    }

    // Reach normal walking speed quickly without requiring a long swipe.
    const strength = clamp((distance - deadzone) / 26, 0, 1);
    this.axis = { x: x * strength, z: z * strength };
  }

  sample() {
    if (!this.enabled) return { x: 0, z: 0 };
    const has = (...codes) => codes.some(c => this.keys.has(c)) ? 1 : 0;
    return {
      x: clamp(this.axis.x + has('KeyD','ArrowRight') - has('KeyA','ArrowLeft'), -1, 1),
      z: clamp(this.axis.z + has('KeyS','ArrowDown') - has('KeyW','ArrowUp'), -1, 1)
    };
  }

  reset() {
    const pointers = [...this.pointers.entries()];
    this.pointers.clear();
    for (const [id, p] of pointers) {
      try {
        if (p.el.hasPointerCapture?.(id)) p.el.releasePointerCapture(id);
      } catch (_) {}
    }
    this.keys.clear();
    this.axis = { x: 0, z: 0 };
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
