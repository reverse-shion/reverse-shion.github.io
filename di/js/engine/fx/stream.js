// /di/js/engine/fx/stream.js
// STREAM — "Resonance Absorb" (PRO RING TARGET)
// - Particles fly to the HUD ring (rim) instead of the DiCo icon
// - Fallback to icon if ring not found
// - iOS safe: low DOM, transform/opacity only, short life
// - Adds ring pulse on absorb hit

export function attachStream(FX) {
  // --- helpers ---
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Try to find the ring element (edit selectors if needed)
  function pickRingEl() {
    return (
      document.querySelector("[data-absorb-ring]") || // ✅おすすめ：リング要素にこれ付ける
      document.querySelector("#dicoRing") ||
      document.querySelector(".dicoRing") ||
      document.querySelector(".hudRing") ||
      document.querySelector(".dicoIconRing") ||
      null
    );
  }

  // Fallback icon (current behavior)
  function pickIconEl() {
    return (
      document.querySelector("#dicoIcon") ||
      document.querySelector(".dicoIcon") ||
      document.querySelector(".dicoFace") ||
      null
    );
  }

  function getCenterAndRadius(el) {
    const rc = el.getBoundingClientRect();
    const x = rc.left + rc.width / 2;
    const y = rc.top + rc.height / 2;
    const r = Math.max(8, Math.min(rc.width, rc.height) / 2);
    return { x, y, r };
  }

  function pulseRing() {
    const el = pickRingEl();
    if (!el) return;
    el.classList.remove("ringPulse");
    // reflow
    void el.offsetWidth;
    el.classList.add("ringPulse");
  }

  // Ensure ringPulse animation exists (inject once, safe)
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
    `;
    document.head.appendChild(s);
  }

  // --- main: stream(x,y) called from tap/judge etc ---
  FX.prototype.stream = function (x, y) {
    ensureRingPulseStyle();

    const color = this.getResColor();
    const k = clamp(Number(this.intensity) || 0, 0, 1);

    // target: ring rim (preferred) -> icon center (fallback)
    const ringEl = pickRingEl();
    const iconEl = pickIconEl();
    const tgtEl = ringEl || iconEl;

    // If nothing found, target top-right-ish (safe fallback)
    let tx = innerWidth * 0.86;
    let ty = innerHeight * 0.16;
    let tr = 18;

    if (tgtEl) {
      const t = getCenterAndRadius(tgtEl);
      tx = t.x;
      ty = t.y;
      tr = t.r;
    }

    // ✅ Ring "resonance" target: land on rim, not center
    // (If ring not found, we just land near center of icon.)
    let mode = ringEl ? "rim" : "center";

    // particle count: keep iOS safe
    const COUNT_MIN = 10;
    const COUNT_MAX = 18;
    const count = Math.round(COUNT_MIN + (COUNT_MAX - COUNT_MIN) * (k * 0.95));

    // flight time
    const durBase = 260;
    const durJit = 120;

    // slight launch scatter (so it feels like "released energy")
    const launchSpread = 10 + k * 16;

    // landing spread (how wide on rim)
    const landJit = 6 + k * 10;

    // Create particles
    for (let i = 0; i < count; i++) {
      const size = Math.round(6 + k * 6 + this.rand(-2, 6));

      const p = this.createParticle(size, {
        shape: "star",
        alpha: 1.0,
        spread: 1.0,
        className: "streamAbsorb",
      });

      // start near tap point
      const a0 = Math.random() * Math.PI * 2;
      const r0 = Math.pow(Math.random(), 0.62) * launchSpread;
      const sx = x + Math.cos(a0) * r0;
      const sy = y + Math.sin(a0) * r0;

      p.style.left = `${sx}px`;
      p.style.top = `${sy}px`;

      // visual: visible on video backgrounds
      p.style.background = color;
      p.style.opacity = "1";
      p.style.mixBlendMode = "screen";

      const g1 = 10 + k * 18 + this.rand(-2, 5);
      const g2 = 24 + k * 30 + this.rand(-4, 10);
      p.style.boxShadow =
        `0 0 ${Math.round(g1 * 0.55)}px rgba(255,255,255,0.60), ` +
        `0 0 ${g1}px ${color}, ` +
        `0 0 ${g2}px ${color}, ` +
        `0 0 ${Math.round(g2 * 1.2)}px rgba(255,255,255,0.10)`;

      p.style.filter = `brightness(${(1.30 + k * 0.45).toFixed(
        2
      )}) saturate(1.65) contrast(1.06)`;

      // transform start
      const s0 = 0.55 + this.rand(-0.12, 0.18);
      const rot0 = this.rand(-25, 25);
      p.style.transform = `translate(-50%,-50%) scale(${s0.toFixed(
        3
      )}) rotate(${rot0.toFixed(1)}deg)`;

      this.layer.appendChild(p);

      // compute landing point
      let ex = tx;
      let ey = ty;

      if (mode === "rim") {
        const a1 = Math.random() * Math.PI * 2;
        const rr = tr * 0.92 + this.rand(-landJit, landJit);
        ex = tx + Math.cos(a1) * rr;
        ey = ty + Math.sin(a1) * rr;
      } else {
        // center with tiny jitter
        ex = tx + this.rand(-landJit, landJit);
        ey = ty + this.rand(-landJit, landJit);
      }

      // flight animation
      requestAnimationFrame(() => {
        const dur = durBase + this.rand(-40, durJit) + k * 70;

        // move via translate so layout cost stays low
        const dx = ex - sx;
        const dy = ey - sy;

        const s1 = 0.25 + this.rand(-0.08, 0.10); // shrink into target
        const rot1 = rot0 + this.rand(-140, 140);

        p.style.transition =
          `transform ${dur}ms cubic-bezier(.12,.92,.20,1), opacity ${dur}ms ease, filter ${dur}ms ease`;

        p.style.transform =
          `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(
            1
          )}px)) scale(${s1.toFixed(3)}) rotate(${rot1.toFixed(1)}deg)`;

        p.style.opacity = "0";
        p.style.filter = `brightness(${(1.05 + k * 0.20).toFixed(
          2
        )}) saturate(1.25) contrast(1.03)`;
      });

      // cleanup
      const kill = 420 + k * 120;
      setTimeout(() => p.remove(), kill);
    }

    // ring pulse to sell "resonance"
    if (ringEl) pulseRing();
  };
}
