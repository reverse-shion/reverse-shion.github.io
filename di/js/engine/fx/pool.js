// /di/js/engine/fx/pool.js
export class ParticlePool {
  constructor(limit = 80) {
    this.limit = limit;
    this.pool = [];
  }

  acquire(createFn) {
    return this.pool.pop() || createFn();
  }

  release(el) {
    if (this.pool.length >= this.limit) return;
    el.remove();
    el.style.cssText = "";
    this.pool.push(el);
  }
}
