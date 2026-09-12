import { clamp } from './state.js?v=p2-1.2.0';

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

    const showFloatingStick = (x, y) => {
      const width = target.innerWidth || document.documentElement.clientWidth || 390;
      const height = target.innerHeight || document.documentElement.clientHeight || 844;
      const half = 65;
      const px = clamp(x, half + 8, width - half - 8);
      const py = clamp(y, half + 8, height - half - 8);
      this.stick.style.left = `${px}px`;
      this.stick.style.top = `${py}px`;
      this.stick.style.bottom = 'auto';
      this.stick.classList.add('is-active');
    };

    const hideFloatingStick = () => {
      this.stick.classList.remove('is-active');
      this.thumb.style.transform = '';
    };

    const beginMove = (e, el, originX, originY, floating = true, radius = 54) => {
      if (!this.enabled || moveActive()) return false;
      e.preventDefault();
      setCapture(el, e.pointerId);
      this.pointers.set(e.pointerId, {
        kind: 'move', el, x: e.clientX, y: e.clientY,
        originX, originY, floating, radius
      });
      if (floating) showFloatingStick(originX, originY);
      this.updateMove(e, this.pointers.get(e.pointerId));
      return true;
    };

    const beginLook = (e, el) => {
      if (!this.enabled || lookActive()) return false;
      e.preventDefault();
      setCapture(el, e.pointerId);
      this.pointers.set(e.pointerId, { kind: 'look', el, x: e.clientX, y: e.clientY });
      return true;
    };

    const finish = e => {
      const entry = this.pointers.get(e.pointerId);
      if (!entry) return;
      this.pointers.delete(e.pointerId);
      if (entry.kind === 'move') {
        this.axis = { x: 0, z: 0 };
        hideFloatingStick();
      }
      try {
        if (entry.el.hasPointerCapture?.(e.pointerId)) entry.el.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };

    // The whole play field is the touch surface. On phones/tablets, touching the
    // left half creates a floating movement stick under the thumb; the right half
    // controls the camera. This avoids forcing the player to hit one fixed circle.
    on(look, 'pointerdown', e => {
      if (!this.enabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const coarse = e.pointerType === 'touch' || e.pointerType === 'pen';
      const width = target.innerWidth || document.documentElement.clientWidth || 390;
      if (coarse && !moveActive() && e.clientX <= width * 0.52) {
        beginMove(e, look, e.clientX, e.clientY, true, 54);
      } else {
        beginLook(e, look);
      }
    });

    on(look, 'pointermove', e => {
      const p = this.pointers.get(e.pointerId);
      if (!this.enabled || !p) return;
      e.preventDefault();
      if (p.kind === 'move') this.updateMove(e, p);
      else {
        onLook(e.clientX - p.x, e.clientY - p.y);
        p.x = e.clientX;
        p.y = e.clientY;
      }
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(look, type, finish);

    // Keep the old stick target functional for automated tests / accessibility,
    // even though the visible mobile stick is now only a floating indicator.
    on(stick, 'pointerdown', e => {
      if (!this.enabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const rect = stick.getBoundingClientRect();
      const radius = Math.max(24, Math.min(rect.width, rect.height) * 0.32);
      beginMove(e, stick, rect.left + rect.width / 2, rect.top + rect.height / 2, false, radius);
    });
    on(stick, 'pointermove', e => {
      const p = this.pointers.get(e.pointerId);
      if (!this.enabled || !p || p.kind !== 'move') return;
      e.preventDefault();
      this.updateMove(e, p);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(stick, type, finish);

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
    const radius = entry.radius || 54;
    let x = (e.clientX - entry.originX) / radius;
    let z = (e.clientY - entry.originY) / radius;
    const rawSize = Math.hypot(x, z);
    if (rawSize > 1) { x /= rawSize; z /= rawSize; }

    // Mild axis snapping makes "straight ahead" easy even when the thumb drifts.
    if (Math.abs(x) < 0.18) x = 0;
    if (Math.abs(z) < 0.18) z = 0;
    const size = Math.hypot(x, z);
    if (size > 1) { x /= size; z /= size; }

    this.axis = rawSize < 0.10 ? { x: 0, z: 0 } : { x, z };
    this.thumb.style.transform = `translate(${x * radius}px, ${z * radius}px)`;
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
      try { if (p.el.hasPointerCapture?.(id)) p.el.releasePointerCapture(id); } catch (_) {}
    }
    this.keys.clear();
    this.axis = { x: 0, z: 0 };
    this.stick.classList.remove('is-active');
    this.thumb.style.transform = '';
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
