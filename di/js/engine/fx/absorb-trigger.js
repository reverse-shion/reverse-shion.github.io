/* /di/js/engine/fx/absorb-trigger.js
   Absorb Trigger FX — SELF CONTAINED (NO CSS DEPENDENCY)
   ------------------------------------------------------------
   ✅ Always visible (injects its own styles)
   ✅ Coordinates are fxLayer-local (x/y)
   ✅ Draws geometric glyph (ring + cross + arc) then "absorbs" to avatarRing
   ✅ perfect adds a subtle full-screen flash
   ✅ iOS Safari safe (no canvas, simple DOM + rAF)
*/

"use strict";

export function createAbsorbFX({ fxLayerId = "fxLayer", ringId = "avatarRing" } = {}) {
  const fxLayer = document.getElementById(fxLayerId);
  const ringEl = document.getElementById(ringId);

  // soft-fail object (never throws)
  if (!fxLayer) {
    console.warn("[AbsorbFX] missing fxLayer:", fxLayerId);
    return { fire: () => {} };
  }

  // ensure root container
  let root = fxLayer.querySelector(":scope > .absorbfx-root");
  if (!root) {
    root = document.createElement("div");
    root.className = "absorbfx-root";
    fxLayer.appendChild(root);
  }

  // inject style once (no external CSS required)
  if (!document.getElementById("absorbfx-style")) {
    const st = document.createElement("style");
    st.id = "absorbfx-style";
    st.textContent = `
      .absorbfx-root{
        position:absolute;
        inset:0;
        pointer-events:none;
        overflow:visible;
        isolation:isolate;
        transform: translateZ(0);
      }
      .absorbfx-flash{
        position:absolute;
        inset:-2px;
        pointer-events:none;
        opacity:0;
        background: radial-gradient(closest-side, rgba(120,190,255,.22), rgba(0,0,0,0));
        mix-blend-mode: screen;
        animation: absorbfxFlash 240ms ease-out forwards;
      }
      @keyframes absorbfxFlash{
        0%{ opacity:0; }
        30%{ opacity:1; }
        100%{ opacity:0; }
      }

      .absorbfx-glyph{
        position:absolute;
        width: 160px;
        height: 160px;
        left: 0;
        top: 0;
        transform: translate(-50%,-50%) scale(.92);
        opacity:0;
        filter: drop-shadow(0 0 10px rgba(120,190,255,.35))
                drop-shadow(0 0 22px rgba(120,190,255,.18));
        mix-blend-mode: screen;
        will-change: transform, opacity;
        animation: absorbfxPop 220ms ease-out forwards;
      }
      @keyframes absorbfxPop{
        0%   { opacity:0; transform: translate(-50%,-50%) scale(.75) rotate(-8deg); }
        55%  { opacity:1; transform: translate(-50%,-50%) scale(1.0) rotate(0deg); }
        100% { opacity:.95; transform: translate(-50%,-50%) scale(.98) rotate(4deg); }
      }

      .absorbfx-glyph svg{ width:100%; height:100%; display:block; }
      .absorbfx-ring{
        stroke: rgba(140,210,255,.95);
        stroke-width: 2.2;
        fill: rgba(120,190,255,.08);
      }
      .absorbfx-arc{
        stroke: rgba(255,255,255,.62);
        stroke-width: 1.6;
        fill: none;
        stroke-linecap: round;
        stroke-dasharray: 14 8;
        opacity:.9;
      }
      .absorbfx-cross{
        stroke: rgba(140,210,255,.85);
        stroke-width: 1.8;
        opacity:.85;
      }
      .absorbfx-dot{
        fill: rgba(255,255,255,.9);
        opacity:.85;
      }

      .absorbfx-stream{
        position:absolute;
        left:0;
        top:0;
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.95), rgba(120,190,255,.55), rgba(0,0,0,0));
        filter: drop-shadow(0 0 10px rgba(120,190,255,.38));
        mix-blend-mode: screen;
        transform: translate(-50%,-50%);
        will-change: transform, opacity;
      }
    `;
    document.head.appendChild(st);
  }

  // helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);

  function getRingTargetLocal() {
    // ring is optional; if missing, absorb to center-top-ish of screen
    const fxRect = fxLayer.getBoundingClientRect();
    if (!ringEl) {
      return { x: fxRect.width * 0.82, y: fxRect.height * 0.18 };
    }
    const r = ringEl.getBoundingClientRect();
    return {
      x: (r.left + r.width * 0.5) - fxRect.left,
      y: (r.top + r.height * 0.5) - fxRect.top,
    };
  }

  function flashPerfect() {
    const el = document.createElement("div");
    el.className = "absorbfx-flash";
    root.appendChild(el);
    el.addEventListener(
      "animationend",
      () => {
        el.remove();
      },
      { passive: true }
    );
  }

  function spawnGlyph(x, y, kind) {
    const g = document.createElement("div");
    g.className = "absorbfx-glyph";
    g.style.left = `${x}px`;
    g.style.top = `${y}px`;

    // perfect makes it a bit stronger
    const strong = kind === "perfect";
    const size = strong ? 176 : 160;
    g.style.width = `${size}px`;
    g.style.height = `${size}px`;

    // Small hue variance while keeping "pale blue"
    const hue = strong ? 200 : 205;
    const alphaRing = strong ? 0.98 : 0.92;
    const alphaFill = strong ? 0.10 : 0.08;

    g.innerHTML = `
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <radialGradient id="abg" cx="50%" cy="50%" r="60%">
            <stop offset="0%"  stop-color="rgba(255,255,255,.85)"/>
            <stop offset="55%" stop-color="rgba(140,210,255,.35)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
          </radialGradient>
        </defs>

        <circle cx="80" cy="80" r="54"
          class="absorbfx-ring"
          style="stroke: hsla(${hue}, 95%, 72%, ${alphaRing});
                 fill: hsla(${hue}, 95%, 62%, ${alphaFill});" />

        <path d="M80 26 A54 54 0 0 1 134 80"
          class="absorbfx-arc" />

        <line x1="28" y1="80" x2="132" y2="80" class="absorbfx-cross"/>
        <line x1="80" y1="28" x2="80" y2="132" class="absorbfx-cross"/>

        <circle cx="80" cy="80" r="26" fill="url(#abg)" opacity=".75"/>
        <circle cx="80" cy="80" r="2.3" class="absorbfx-dot"/>
        <circle cx="112" cy="64" r="1.7" class="absorbfx-dot" opacity=".6"/>
        <circle cx="56" cy="108" r="1.7" class="absorbfx-dot" opacity=".6"/>
      </svg>
    `;
    root.appendChild(g);

    // remove after short while
    setTimeout(() => {
      try {
        g.remove();
      } catch {}
    }, strong ? 520 : 420);
  }

  function spawnStream(x0, y0, x1, y1, kind) {
    const strong = kind === "perfect";
    const n = strong ? 10 : 7;

    for (let i = 0; i < n; i++) {
      const p = document.createElement("div");
      p.className = "absorbfx-stream";
      root.appendChild(p);

      const delay = i * (strong ? 10 : 12);
      const life = strong ? 320 : 280;

      const sx = x0 + rnd(-10, 10);
      const sy = y0 + rnd(-10, 10);
      const tx = x1 + rnd(-8, 8);
      const ty = y1 + rnd(-8, 8);

      const tStart = performance.now() + delay;

      const tick = (tNow) => {
        const t = (tNow - tStart) / life;
        if (t < 0) {
          requestAnimationFrame(tick);
          return;
        }
        if (t >= 1) {
          p.remove();
          return;
        }

        // ease in-out (smoothstep)
        const tt = t * t * (3 - 2 * t);

        const x = sx + (tx - sx) * tt;
        const y = sy + (ty - sy) * tt;

        // fade out near end
        const a = 1 - Math.pow(t, 1.4);
        p.style.opacity = String(clamp(a, 0, 1));
        p.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%) scale(${0.9 + tt * 0.6})`;

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    }
  }

  function fire({ x, y, judge = "great" } = {}) {
    // x/y are expected to be fxLayer-local
    const lx = Number(x);
    const ly = Number(y);
    if (!Number.isFinite(lx) || !Number.isFinite(ly)) return;

    const kind = judge === "perfect" ? "perfect" : "great";

    // Perfect subtle full screen flash
    if (kind === "perfect") flashPerfect();

    // Glyph at tap point
    spawnGlyph(lx, ly, kind);

    // Absorb stream to ring center
    const tgt = getRingTargetLocal();
    spawnStream(lx, ly, tgt.x, tgt.y, kind);
  }

  return { fire };
}
