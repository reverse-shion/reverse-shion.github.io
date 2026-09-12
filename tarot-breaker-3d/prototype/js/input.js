import { clamp } from './state.js?v=p2-1.1.0';
export class InputController {
  constructor({ stick, thumb, look, onLook, onInteract, target = window }) {
    this.stick = stick; this.thumb = thumb; this.look = look; this.keys = new Set();
    this.enabled = false; this.axis = { x: 0, z: 0 }; this.pointers = new Map(); this.cleanups = [];
    const on = (el, type, fn, options) => { el.addEventListener(type, fn, options); this.cleanups.push(() => el.removeEventListener(type, fn, options)); };
    const finish = e => {
      const entry = this.pointers.get(e.pointerId);
      if (!entry) return;
      this.pointers.delete(e.pointerId);
      if (entry.kind === 'move') { this.axis = { x: 0, z: 0 }; thumb.style.transform = ''; }
      try { if (entry.el.hasPointerCapture(e.pointerId)) entry.el.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    for (const [el, kind] of [[stick, 'move'], [look, 'look']]) {
      on(el, 'pointerdown', e => {
        if (!this.enabled || (e.pointerType === 'mouse' && e.button !== 0) || [...this.pointers.values()].some(p => p.kind === kind)) return;
        e.preventDefault(); el.setPointerCapture(e.pointerId);
        this.pointers.set(e.pointerId, { kind, el, x: e.clientX, y: e.clientY });
        if (kind === 'move') this.updateStick(e);
      });
      on(el, 'pointermove', e => {
        const p = this.pointers.get(e.pointerId);
        if (!this.enabled || !p) return;
        e.preventDefault();
        if (kind === 'move') this.updateStick(e);
        else { onLook(e.clientX - p.x, e.clientY - p.y); p.x = e.clientX; p.y = e.clientY; }
      });
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(el, type, finish);
    }
    on(target, 'keydown', e => {
      if (!this.enabled || /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target?.tagName)) return;
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault(); this.keys.add(e.code);
      }
      if (e.code === 'KeyE' && !e.repeat) { e.preventDefault(); onInteract(); }
    });
    on(target, 'keyup', e => this.keys.delete(e.code));
    on(target, 'blur', () => this.reset());
    on(target, 'resize', () => this.reset());
  }
  updateStick(e) {
    const rect = this.stick.getBoundingClientRect(), radius = rect.width * 0.32;
    let x = (e.clientX - rect.left - rect.width / 2) / radius;
    let z = (e.clientY - rect.top - rect.height / 2) / radius;
    const size = Math.hypot(x, z);
    if (size > 1) { x /= size; z /= size; }
    this.axis = size < 0.12 ? { x: 0, z: 0 } : { x, z };
    this.thumb.style.transform = `translate(${x * radius}px, ${z * radius}px)`;
  }
  sample() {
    if (!this.enabled) return { x: 0, z: 0 };
    const has = (...codes) => codes.some(c => this.keys.has(c)) ? 1 : 0;
    return { x: clamp(this.axis.x + has('KeyD','ArrowRight') - has('KeyA','ArrowLeft'), -1, 1), z: clamp(this.axis.z + has('KeyS','ArrowDown') - has('KeyW','ArrowUp'), -1, 1) };
  }
  reset() {
    const pointers = [...this.pointers.entries()]; this.pointers.clear();
    for (const [id, p] of pointers) { try { if (p.el.hasPointerCapture(id)) p.el.releasePointerCapture(id); } catch (_) {} }
    this.keys.clear(); this.axis = { x: 0, z: 0 }; this.thumb.style.transform = '';
  }
  setEnabled(value) { this.enabled = value; if (!value) this.reset(); }
  dispose() { this.setEnabled(false); this.cleanups.forEach(fn => fn()); this.cleanups = []; }
}
