㊗️

/* /di/js/engine/fx/absorb-trigger.js
   PRO LIGHT — minimal trigger (coords -> CSS vars) for:
   - tap flash (sigil) (0.16s / perfect 0.22s)
   - absorb beam + dash particles (0.20~0.28s)
   - icon ring reaction (uses fx-ring.css classes: absorbPulse/absorbPerfect)
*/

export function createAbsorbFX({
  fxLayerId = "fxLayer",
  ringId = "avatarRing",
} = {}) {
  const $ = (id) => document.getElementById(id);

  function _ringCenter() {
    const ring = $(ringId);
    if (!ring) return null;
    const r = ring.getBoundingClientRect();
    return {
      el: ring,
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
    };
  }

  function _fireRingReact(judge) {
    const ring = $(ringId);
    if (!ring) return;

    ring.classList.add("absorbPulse");
    if (judge === "perfect") ring.classList.add("absorbPerfect");

    window.setTimeout(() => {
      ring.classList.remove("absorbPulse", "absorbPerfect");
    }, 260);
  }

  function _append(node) {
    const layer = $(fxLayerId);
    if (!layer) return false;
    layer.appendChild(node);
    return true;
  }

  // ---- NEW: tarot sigil svg (lightweight) ----
  function _sigilSVG() {
    // “タロット紋章っぽい幾何学”の最小セット（線主体＝軽い）
    // 色はCSS側で currentColor / stroke を上書きできるようにしてある
    return `
<svg viewBox="0 0 160 160" aria-hidden="true" focusable="false">
  <g fill="none" stroke="rgba(255,255,255,.86)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="80" cy="80" r="56" opacity=".55"/>
    <circle cx="80" cy="80" r="38" opacity=".35"/>
    <path d="M80 18 V142" opacity=".35"/>
    <path d="M18 80 H142" opacity=".35"/>
    <path d="M40 40 L120 120" opacity=".22"/>
    <path d="M120 40 L40 120" opacity=".22"/>
    <path d="M80 32 L96 64 L80 96 L64 64 Z" opacity=".50"/>
    <circle cx="80" cy="80" r="6" opacity=".85"/>
  </g>
</svg>`;
  }

  function fire({ x, y, judge = "great" }) {
    const tgt = _ringCenter();
    if (!tgt) return;

    // ---------- 1) tap flash (sigil) ----------
    const flash = document.createElement("div");
    flash.className = "fxTapFlash";
    flash.style.setProperty("--fx-x", `${x}px`);
    flash.style.setProperty("--fx-y", `${y}px`);

    // ▼ここが追加：紋章レイヤー
    const sigil = document.createElement("div");
    sigil.className = "tarotFlash active" + (judge === "perfect" ? " perfect" : "");
    sigil.innerHTML = _sigilSVG();
    flash.appendChild(sigil);

    if (_append(flash)) {
      // remove after anim (perfect 220ms想定 + 余裕)
      window.setTimeout(() => flash.remove(), judge === "perfect" ? 280 : 220);
    }

    // ---------- 2) absorb beam ----------
    const dx = tgt.x - x;
    const dy = tgt.y - y;
    const len = Math.max(40, Math.hypot(dx, dy));
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;

    const dur = judge === "perfect" ? 280 : 240;

    const absorb = document.createElement("div");
    absorb.className = "fxAbsorb" + (judge === "perfect" ? " is-perfect" : "");
    absorb.style.setProperty("--fx-x", `${x}px`);
    absorb.style.setProperty("--fx-y", `${y}px`);
    absorb.style.setProperty("--fx-len", `${len}px`);
    absorb.style.setProperty("--fx-ang", `${ang}deg`);
    absorb.style.setProperty("--fx-dur", `${dur}ms`);

    const beam = document.createElement("div");
    beam.className = "beam";
    if (judge === "perfect") {
      const i = document.createElement("i");
      beam.appendChild(i);
    }
    absorb.appendChild(beam);

    if (_append(absorb)) {
      window.setTimeout(() => absorb.remove(), dur + 120);
    }

    // ---------- 3) ring react ----------
    window.setTimeout(() => _fireRingReact(judge), Math.max(140, dur - 80));
  }

  function fireFromEvent(e, judge = "great") {
    const x = e?.clientX ?? 0;
    const y = e?.clientY ?? 0;
    fire({ x, y, judge });
  }

  return { fire, fireFromEvent };
}
