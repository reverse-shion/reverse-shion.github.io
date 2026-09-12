import { clamp } from './state.js?v=p2-1.6.0';

export class InputController {
  constructor({ stick, thumb, look, onLook, onInteract, target = window }) {
    this.stick = stick;
    this.thumb = thumb;
    this.look = look;
    this.keys = new Set();
    this.enabled = false;
    this.forward = 0;
    this.drivePointer = null;
    this.lookPointer = null;
    this.cleanups = [];

    const on = (el, type, fn, options) => {
      el.addEventListener(type, fn, options);
      this.cleanups.push(() => el.removeEventListener(type, fn, options));
    };
    const setCapture = (el, id) => { try { el.setPointerCapture(id); } catch (_) {} };
    const releaseCapture = (el, id) => { try { if (el.hasPointerCapture?.(id)) el.releasePointerCapture(id); } catch (_) {} };

    const beginDrive = (e, el = look) => {
      e.preventDefault();
      setCapture(el, e.pointerId);
      this.drivePointer = {
        id: e.pointerId,
        el,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY
      };
      this.forward = 0;
    };

    const beginLook = e => {
      e.preventDefault();
      setCapture(look, e.pointerId);
      this.lookPointer = { id: e.pointerId, el: look, x: e.clientX, y: e.clientY };
    };

    for (const type of ['contextmenu', 'selectstart', 'dragstart']) {
      on(look, type, e => e.preventDefault());
    }

    // One finger: walk and steer. Up/down controls walking speed; horizontal
    // movement turns Shion's body/view instead of sliding sideways.
    // A second finger is reserved for free-look adjustment.
    on(look, 'pointerdown', e => {
      if (!this.enabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (e.target?.closest?.('button, [role="button"]')) return;
      const coarse = e.pointerType === 'touch' || e.pointerType === 'pen';
      if (coarse) {
        if (!this.drivePointer) beginDrive(e);
        else if (!this.lookPointer && e.pointerId !== this.drivePointer.id) beginLook(e);
        return;
      }
      if (!this.lookPointer) beginLook(e);
    }, { passive: false });

    on(look, 'pointermove', e => {
      if (!this.enabled) return;
      if (this.drivePointer?.id === e.pointerId) {
        e.preventDefault();
        const p = this.drivePointer;
        const totalY = e.clientY - p.startY;
        const stepX = e.clientX - p.lastX;
        p.lastX = e.clientX;
        p.lastY = e.clientY;

        // Vertical displacement becomes continuous walking while the finger stays down.
        // Small movements are ignored; ~42px reaches full walking speed.
        const deadzone = 5;
        if (Math.abs(totalY) <= deadzone) this.forward = 0;
        else this.forward = clamp(-(totalY - Math.sign(totalY) * deadzone) / 37, -1, 1);

        // Horizontal finger movement rotates the body/view, so a curve feels like walking
        // around a corner rather than strafing across the floor.
        if (Math.abs(stepX) > 0.1) onLook(stepX * 1.15, 0);
        return;
      }

      if (this.lookPointer?.id === e.pointerId) {
        e.preventDefault();
        const p = this.lookPointer;
        onLook(e.clientX - p.x, e.clientY - p.y);
        p.x = e.clientX;
        p.y = e.clientY;
      }
    }, { passive: false });

    const finish = e => {
      if (this.drivePointer?.id === e.pointerId) {
        releaseCapture(this.drivePointer.el, e.pointerId);
        this.drivePointer = null;
        this.forward = 0;
      }
      if (this.lookPointer?.id === e.pointerId) {
        releaseCapture(this.lookPointer.el, e.pointerId);
        this.lookPointer = null;
      }
    };

    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(look, type, finish);

    // Hidden fallback target retained for test/non-touch compatibility.
    on(stick, 'pointerdown', e => {
      if (!this.enabled) return;
      beginDrive(e, stick);
    });
    on(stick, 'pointermove', e => {
      if (!this.enabled || this.drivePointer?.id !== e.pointerId) return;
      e.preventDefault();
      const p = this.drivePointer;
      const totalY = e.clientY - p.startY;
      const stepX = e.clientX - p.lastX;
      p.lastX = e.clientX;
      const deadzone = 5;
      this.forward = Math.abs(totalY) <= deadzone ? 0 : clamp(-(totalY - Math.sign(totalY) * deadzone) / 37, -1, 1);
      if (Math.abs(stepX) > 0.1) onLook(stepX * 1.15, 0);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(stick, type, finish);

    on(target, 'keydown', e => {
      if (!this.enabled || /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target?.tagName)) return;
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
        this.keys.add(e.code);
      }
      if (e.code === 'Space') { e.preventDefault(); this.stopMovement(); }
      if (e.code === 'KeyE' && !e.repeat) { e.preventDefault(); onInteract(); }
    });
    on(target, 'keyup', e => this.keys.delete(e.code));
    on(target, 'blur', () => this.reset());
    on(target, 'resize', () => this.reset());
  }

  sample() {
    if (!this.enabled) return { x: 0, z: 0 };
    const has = (...codes) => codes.some(c => this.keys.has(c)) ? 1 : 0;
    return {
      // Touch never strafes. A/D remains available on desktop.
      x: clamp(has('KeyD','ArrowRight') - has('KeyA','ArrowLeft'), -1, 1),
      z: clamp(-this.forward + has('KeyS','ArrowDown') - has('KeyW','ArrowUp'), -1, 1)
    };
  }

  isMoving() {
    return Math.abs(this.forward) > 0.03 ||
      ['KeyW','KeyS','ArrowUp','ArrowDown','KeyA','KeyD','ArrowLeft','ArrowRight'].some(code => this.keys.has(code));
  }

  stopMovement() {
    this.forward = 0;
    if (this.drivePointer) {
      this.drivePointer.startY = this.drivePointer.lastY;
    }
  }

  reset() {
    if (this.drivePointer) releaseCapture(this.drivePointer.el, this.drivePointer.id);
    if (this.lookPointer) releaseCapture(this.lookPointer.el, this.lookPointer.id);
    this.drivePointer = null;
    this.lookPointer = null;
    this.keys.clear();
    this.forward = 0;
  }

  setEnabled(value) { this.enabled = value; if (!value) this.reset(); }
  dispose() { this.setEnabled(false); this.cleanups.forEach(fn => fn()); this.cleanups = []; }
}
