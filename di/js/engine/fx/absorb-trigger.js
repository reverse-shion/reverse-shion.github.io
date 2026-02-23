/* /di/js/engine/fx/absorb-trigger.js
   PRO LIGHT — minimal trigger (coords -> CSS vars) for:
   - tap flash (0.12s)
   - absorb beam + dash particles (0.20~0.28s)
   - icon ring reaction (glow + ripple + spin kick, perfect boosts)
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

  // 共通：受信フラッシュ
  ring.classList.add("absorbPulse");

  // Perfectだけ強化
  if (judge === "perfect") {
    ring.classList.add("absorbPerfect");
  }

  // 早めに切る（CSSは0.6sでも体感は短く）
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

  function fire({ x, y, judge = "great" }) {
    const tgt = _ringCenter();
    if (!tgt) return;

    // ---------- 1) tap flash ----------
    const flash = document.createElement("div");
    flash.className = "fxTapFlash";
    flash.style.setProperty("--fx-x", `${x}px`);
    flash.style.setProperty("--fx-y", `${y}px`);
    if (_append(flash)) {
      // remove after anim
      window.setTimeout(() => flash.remove(), 160);
    }

    // ---------- 2) absorb beam ----------
    const dx = tgt.x - x;
    const dy = tgt.y - y;
    const len = Math.max(40, Math.hypot(dx, dy));
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;

    const dur = (judge === "perfect") ? 280 : 240;

    const absorb = document.createElement("div");
    absorb.className = "fxAbsorb" + (judge === "perfect" ? " is-perfect" : "");
    absorb.style.setProperty("--fx-x", `${x}px`);
    absorb.style.setProperty("--fx-y", `${y}px`);
    absorb.style.setProperty("--fx-len", `${len}px`);
    absorb.style.setProperty("--fx-ang", `${ang}deg`);
    absorb.style.setProperty("--fx-dur", `${dur}ms`);

    const beam = document.createElement("div");
    beam.className = "beam";
    // for perfect: add third thin line via <i>
    if (judge === "perfect") {
      const i = document.createElement("i");
      beam.appendChild(i);
    }
    absorb.appendChild(beam);

    if (_append(absorb)) {
      window.setTimeout(() => absorb.remove(), dur + 120);
    }

    // ---------- 3) ring react ----------
    // delay so it feels like "arrive"
    window.setTimeout(() => _fireRingReact(judge), Math.max(140, dur - 80));
  }

  // Utility: from pointer event (client coords)
  function fireFromEvent(e, judge = "great") {
    const x = e?.clientX ?? 0;
    const y = e?.clientY ?? 0;
    fire({ x, y, judge });
  }

  return { fire, fireFromEvent };
}
