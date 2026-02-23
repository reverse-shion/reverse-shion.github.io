// /di/js/engine/fx/stream.js
// STREAM — Tap -> Constellation Arc -> Ring Absorb (GOD-PRO)
// ✅ Start = tap (fxLayer local coords)
// ✅ End   = ring rim (fxLayer local coords)
// ✅ Path  = 2-step curve (constellation arc feel) — iOS safe
// ✅ PERFECT: IrisPulse + stronger "suction pressure"
// ✅ Milestone: BlessPulse (cut-in grade but light)

export function attachStream(FX) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function ensureRingPulseStyle() {
    if (document.getElementById("__fx_ring_pulse_style__")) return;
    const s = document.createElement("style");
    s.id = "__fx_ring_pulse_style__";
    s.textContent = `
      .ringPulse{ animation: ringPulse 220ms ease-out; }
      @keyframes ringPulse{
        0%{ transform: scale(1); filter: brightness(1); }
        40%{ transform: scale(1.06); filter: brightness(1.25); }
        100%{ transform: scale(1); filter: brightness(1); }
      }

      /* PERFECT: iris-like quick flash (more "summon" than "pop") */
      .irisPulse{ animation: irisPulse 260ms cubic-bezier(.12,.95,.18,1); }
      @keyframes irisPulse{
        0%{ transform: scale(1); filter: brightness(1) saturate(1); }
        35%{ transform: scale(1.08); filter: brightness(1.55) saturate(1.45) contrast(1.08); }
        70%{ transform: scale(1.02); filter: brightness(1.25) saturate(1.20); }
        100%{ transform: scale(1); filter: brightness(1) saturate(1); }
      }

      /* combo milestone blessing */
      .blessPulse{ animation: blessPulse 320ms cubic-bezier(.10,.95,.18,1); }
      @keyframes blessPulse{
        0%{ transform: scale(1); filter: brightness(1); }
        30%{ transform: scale(1.10); filter: brightness(1.65) contrast(1.10); }
        65%{ transform: scale(1.03); filter: brightness(1.30); }
        100%{ transform: scale(1); filter: brightness(1); }
      }
    `;
    document.head.appendChild(s);
  }

  function pulse(el, mode = "normal") {
    if (!el) return;
    if (mode === "perfect") {
      el.classList.remove("irisPulse");
      void el.offsetWidth;
      el.classList.add("irisPulse");
      return;
    }
    if (mode === "bless") {
      el.classList.remove("blessPulse");
      void el.offsetWidth;
      el.classList.add("blessPulse");
      return;
    }
    el.classList.remove("ringPulse");
    void el.offsetWidth;
    el.classList.add("ringPulse");
  }

  FX.prototype.stream = function (x, y, targetEl, meta = null) {
    ensureRingPulseStyle();

    const layer = this.layer; // #fxLayer
    if (!layer) return;

    const color = this.getResColor();
    const k0 = clamp(Number(this.intensity) || 0, 0, 1);

    const judge = String(meta?.judge || meta?.name || "");
    const isPerfect = meta?.perfect === true || judge === "PERFECT";
    const milestone = meta?.milestone === true;

    // perfect feels stronger but don't explode counts (iOS safe)
    const k = clamp(k0 + (isPerfect ? 0.18 : 0) + (milestone ? 0.10 : 0), 0, 1);

    const el =
      targetEl ||
      document.getElementById("avatarRing") ||
      document.querySelector(".avatarRing") ||
      null;
    if (!el) return;

    // --- convert target rect (viewport) -> layer local coords ---
    const layerRect = layer.getBoundingClientRect();
    const rc = el.getBoundingClientRect();

    const cx = rc.left + rc.width / 2 - layerRect.left;
    const cy = rc.top + rc.height / 2 - layerRect.top;
    const r = Math.max(10, Math.min(rc.width, rc.height) / 2);

    // count: keep low, add quality via glow/path
    const COUNT_MIN = 10;
    const COUNT_MAX = 18;
    const count = Math.round(COUNT_MIN + (COUNT_MAX - COUNT_MIN) * (k * 0.95) + (isPerfect ? 2 : 0));

    // duration: perfect = slightly faster suction
    const durBase = isPerfect ? 220 : 260;
    const durJit = 140;

    // tap散り
    const launch = 8 + k * 14;

    // rim着地点の揺れ
    const rimJit = 5 + k * 10;

    for (let i = 0; i < count; i++) {
      const size = Math.round((isPerfect ? 7 : 6) + k * 6 + this.rand(-2, 6));

      const p = this.createParticle(size, {
        shape: "star",
        alpha: 1.0,
        spread: 1.0,
        className: "streamAbsorb",
      });

      // ✅ START = TAP（layer local）
      const a0 = Math.random() * Math.PI * 2;
      const rr0 = Math.pow(Math.random(), 0.62) * launch;
      const sx = x + Math.cos(a0) * rr0;
      const sy = y + Math.sin(a0) * rr0;

      // ✅ END = RING RIM（layer local）
      const a1 = Math.random() * Math.PI * 2;
      const rr1 = r * 0.92 + this.rand(-rimJit, rimJit);
      const ex = cx + Math.cos(a1) * rr1;
      const ey = cy + Math.sin(a1) * rr1;

      // Place at start
      p.style.left = `${sx}px`;
      p.style.top = `${sy}px`;

      p.style.background = color;
      p.style.opacity = "1";
      p.style.mixBlendMode = "screen";

      // “吸い込み圧”＝rim直前だけ白熱感を足す（perfect強化）
      const g1 = 10 + k * 18 + this.rand(-2, 6);
      const g2 = 26 + k * 34 + this.rand(-4, 12);
      p.style.boxShadow =
        `0 0 ${Math.round(g1 * 0.55)}px rgba(255,255,255,${isPerfect ? "0.78" : "0.60"}), ` +
        `0 0 ${g1.toFixed(0)}px ${color}, ` +
        `0 0 ${g2.toFixed(0)}px ${color}, ` +
        `0 0 ${Math.round(g2 * 1.2)}px rgba(255,255,255,${isPerfect ? "0.14" : "0.10"})`;

      p.style.filter = `brightness(${(1.30 + k * 0.45 + (isPerfect ? 0.12 : 0)).toFixed(
        2
      )}) saturate(1.65) contrast(1.06)`;

      const s0 = 0.55 + this.rand(-0.12, 0.18);
      const rot0 = this.rand(-25, 25);
      p.style.transform = `translate(-50%,-50%) scale(${s0.toFixed(3)}) rotate(${rot0.toFixed(1)}deg)`;

      layer.appendChild(p);

      // ==========================
      // Constellation Arc (2-step curve)
      // ==========================
      requestAnimationFrame(() => {
        const total = durBase + this.rand(-40, durJit) + k * 70;

        // split into 2 steps: 55% + 45%
        const d1 = Math.round(total * 0.55);
        const d2 = Math.max(80, total - d1);

        const dx = ex - sx;
        const dy = ey - sy;

        // curve control (single bend)
        // perpendicular curve amount (bigger = more mystical)
        const bend = (10 + k * 26) * (this.rand(0, 1) < 0.5 ? -1 : 1);
        const px = -dy; // perpendicular vector
        const py = dx;
        const pm = Math.max(0.001, Math.hypot(px, py));
        const ux = px / pm;
        const uy = py / pm;

        // mid point: somewhere between start and end + perpendicular offset
        const midT = 0.48 + this.rand(-0.08, 0.10);
        const mx = dx * midT + ux * bend;
        const my = dy * midT + uy * bend;

        // Step1: go to mid (slightly bigger = "gathering")
        const sMid = (0.62 + this.rand(-0.08, 0.10)) * (isPerfect ? 1.05 : 1.0);
        const rotMid = rot0 + this.rand(-120, 120);

        p.style.transition =
          `transform ${d1}ms cubic-bezier(.12,.92,.20,1), ` +
          `opacity ${total}ms ease, filter ${total}ms ease`;

        p.style.transform =
          `translate(calc(-50% + ${mx.toFixed(1)}px), calc(-50% + ${my.toFixed(1)}px)) ` +
          `scale(${sMid.toFixed(3)}) rotate(${rotMid.toFixed(1)}deg)`;

        // Step2: go to rim (shrink into rim) — a bit faster at the end
        setTimeout(() => {
          const sEnd = 0.18 + this.rand(-0.05, 0.06);
          const rot1 = rotMid + this.rand(-160, 160);

          // end “white-hot” for perfect (micro reward)
          if (isPerfect) {
            p.style.filter = `brightness(${(1.75 + k * 0.30).toFixed(2)}) saturate(1.55) contrast(1.10)`;
          }

          p.style.transition =
            `transform ${d2}ms cubic-bezier(.08,.96,.16,1), ` +
            `opacity ${d2}ms ease, filter ${d2}ms ease`;

          p.style.transform =
            `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) ` +
            `scale(${sEnd.toFixed(3)}) rotate(${rot1.toFixed(1)}deg)`;

          p.style.opacity = "0";
        }, Math.max(16, d1 - 6));
      });

      setTimeout(() => p.remove(), 560 + k * 160);
    }

    // Ring feedback: normal / perfect / blessing
    if (milestone) pulse(el, "bless");
    else if (isPerfect) pulse(el, "perfect");
    else pulse(el, "normal");
  };
}
