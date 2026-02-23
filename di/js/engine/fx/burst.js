// /di/js/engine/fx/burst.js
// BURST — "Resonance Summon" (GOD-PRO, iOS-safe)
// - Base: your punchy spark core + dust (kept)
// - Add: Mystic Meteors (few, long tail) => "summon feel"
// - Add: PERFECT => Iris Flash + Constellation Arc (reward)
// - Add: Combo milestone => Blessing Halo (cut-in grade but light)
// - iOS-safe: low DOM, no canvas, transform/opacity/filter only, capped counts

export function attachBurst(FX) {
  FX.prototype.burst = function (x, y, meta = null) {
    const color = this.getResColor();

    // intensity 0..1 (resonance-driven)
    const k0 = Math.max(0, Math.min(1, Number(this.intensity) || 0));

    // meta: { judge:"PERFECT|GREAT|GOOD|MISS", combo:number, milestone:boolean }
    const judge = String(meta?.judge || meta?.name || "");
    const isPerfect = meta?.perfect === true || judge === "PERFECT";
    const isGoodHit =
      isPerfect || judge === "GREAT" || judge === "GOOD" || meta?.hit === true;

    // combo milestone = "blessing"
    const milestone = meta?.milestone === true;

    // 🔧 helper
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const BLEND = "screen";

    // ✅ God-feel tuning:
    // - perfect adds "reward brightness" (not count)
    // - milestone adds "halo" moment
    const k =
      clamp(
        k0 + (isPerfect ? 0.18 : 0) + (milestone ? 0.12 : 0),
        0,
        1
      );

    // iOS-safe limits
    const COUNT_MIN = 8;
    const COUNT_MAX = 18;
    const count = Math.round(COUNT_MIN + (COUNT_MAX - COUNT_MIN) * (k * 0.95));

    const spread = 12 + k * 18;
    const lifeBase = 380;
    const lifeJit = 180;

    // ----- CORE SPARKLE (big, short) -----
    const coreN = k > 0.6 ? 2 : 1;

    for (let c = 0; c < coreN; c++) {
      const sz = Math.round(16 + k * 12 + this.rand(-2, 4));
      const core = this.createParticle(sz, {
        shape: "star",
        alpha: 1.0,
        spread: 0.2,
        className: "burstCore",
      });

      core.style.left = `${x}px`;
      core.style.top = `${y}px`;

      const g1 = Math.round(22 + k * 24);
      const g2 = Math.round(56 + k * 42);
      const g3 = Math.round(90 + k * 60);

      core.style.background = color;
      core.style.mixBlendMode = BLEND;
      core.style.opacity = "1";
      core.style.boxShadow =
        `0 0 ${Math.round(g1 * 0.55)}px rgba(255,255,255,0.92), ` +
        `0 0 ${g1}px ${color}, ` +
        `0 0 ${g2}px ${color}, ` +
        `0 0 ${g3}px rgba(255,255,255,0.18)`;

      core.style.filter = `brightness(${(1.55 + k * 0.55).toFixed(
        2
      )}) saturate(1.85) contrast(1.10)`;

      const startS = 0.58 + this.rand(-0.06, 0.08);
      const endS = 1.55 + k * 0.70 + this.rand(-0.08, 0.18);
      const rot0 = this.rand(-18, 18);
      const rot1 = rot0 + this.rand(-70, 70);

      core.style.transform = `translate(-50%,-50%) scale(${startS.toFixed(
        3
      )}) rotate(${rot0.toFixed(1)}deg)`;
      this.layer.appendChild(core);

      requestAnimationFrame(() => {
        const dur = 280 + k * 110 + this.rand(-20, 50);
        core.style.transition = `transform ${dur}ms cubic-bezier(.15,.95,.2,1), opacity ${dur}ms ease, filter ${dur}ms ease`;
        core.style.transform = `translate(-50%,-50%) scale(${endS.toFixed(
          3
        )}) rotate(${rot1.toFixed(1)}deg)`;
        core.style.opacity = "0";
        core.style.filter = `brightness(${(1.10 + k * 0.20).toFixed(
          2
        )}) saturate(1.25) contrast(1.05)`;
      });

      setTimeout(() => core.remove(), 460);
    }

    // ================================
    // GOD ADDITION 1: MYSTIC METEORS
    // ================================
    // 少数の“尾”があるだけで「召喚感」が爆上がりする
    // GOOD以上のみ（MISSで出しすぎると気持ち悪い）
    if (isGoodHit) {
      const METEOR_MIN = 1;
      const METEOR_MAX = 5;
      // PERFECTは少し増える
      const meteorCount = Math.round(
        METEOR_MIN + (METEOR_MAX - METEOR_MIN) * (k * 0.95) + (isPerfect ? 1 : 0)
      );

      for (let m = 0; m < meteorCount; m++) {
        // direction (slight upward bias = mystical)
        const ang = Math.random() * Math.PI * 2;
        const dirBias = -0.35;
        let vx = Math.cos(ang);
        let vy = Math.sin(ang) + dirBias;
        const mag = Math.max(0.0001, Math.hypot(vx, vy));
        const nx = vx / mag;
        const ny = vy / mag;

        const thick = Math.round(2 + k * 3 + this.rand(-0.5, 1.5));
        const tail = Math.round(46 + k * 84 + this.rand(-10, 26));
        const travel = 18 + k * 34 + this.rand(-6, 10);

        const met = this.createParticle(12, {
          shape: "star",
          alpha: 1.0,
          spread: 0.0,
          className: "burstMeteor",
        });

        met.style.left = `${x}px`;
        met.style.top = `${y}px`;

        met.style.width = `${thick}px`;
        met.style.height = `${tail}px`;
        met.style.borderRadius = `${Math.max(2, Math.round(thick * 1.2))}px`;
        met.style.mixBlendMode = BLEND;
        met.style.opacity = "1";

        // Tail gradient: transparent -> color -> white-hot head
        met.style.background =
          `linear-gradient(to top, ` +
          `rgba(255,255,255,0.00) 0%, ` +
          `${color} 34%, ` +
          `rgba(255,255,255,0.95) 58%, ` +
          `rgba(255,255,255,0.00) 100%)`;

        const g = 18 + k * 28 + this.rand(-4, 10);
        met.style.boxShadow =
          `0 0 ${Math.round(g * 0.35)}px rgba(255,255,255,0.70), ` +
          `0 0 ${Math.round(g)}px ${color}, ` +
          `0 0 ${Math.round(g * 1.8)}px rgba(255,255,255,0.12)`;

        met.style.filter =
          `brightness(${(1.35 + k * 0.55).toFixed(
            2
          )}) saturate(1.55) contrast(1.10) blur(${(0.35 + k * 0.55).toFixed(2)}px)`;

        const rot = (Math.atan2(ny, nx) * 180) / Math.PI + 90;
        met.style.transform = `translate(-50%,-50%) rotate(${rot.toFixed(
          1
        )}deg) scaleY(${(0.65 + this.rand(-0.08, 0.10)).toFixed(3)})`;

        this.layer.appendChild(met);

        requestAnimationFrame(() => {
          const dur = 240 + k * 160 + this.rand(-30, 70);
          const side = this.rand(-0.45, 0.45) * (12 + k * 22);
          const dx = nx * travel + side;
          const dy = ny * travel;

          met.style.transition =
            `transform ${dur}ms cubic-bezier(.10,.92,.18,1), ` +
            `opacity ${dur}ms ease, filter ${dur}ms ease`;

          met.style.transform =
            `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(
              1
            )}px)) ` +
            `rotate(${(rot + this.rand(-10, 10)).toFixed(1)}deg) ` +
            `scaleY(${(1.25 + k * 0.75 + this.rand(-0.10, 0.20)).toFixed(3)})`;

          met.style.opacity = "0";
          met.style.filter =
            `brightness(${(1.05 + k * 0.20).toFixed(
              2
            )}) saturate(1.15) contrast(1.05) blur(${(0.18 + k * 0.30).toFixed(2)}px)`;
        });

        setTimeout(() => met.remove(), 520 + k * 220);
      }
    }

    // ==========================================
    // GOD ADDITION 2: PERFECT IRIS + CONSTELLATION ARC
    // ==========================================
    if (isPerfect) {
      // Iris flash (one ring sweep)
      const iris = this.createParticle(10, {
        shape: "star",
        alpha: 1.0,
        spread: 0.0,
        className: "burstIris",
      });

      const r = Math.round(86 + k * 84); // ring size
      iris.style.left = `${x}px`;
      iris.style.top = `${y}px`;
      iris.style.width = `${r}px`;
      iris.style.height = `${r}px`;
      iris.style.borderRadius = "50%";
      iris.style.mixBlendMode = BLEND;
      iris.style.opacity = "1";

      // Thin ring with soft aura (Iris-ish)
      iris.style.background =
        `radial-gradient(circle at 50% 50%, ` +
        `rgba(255,255,255,0.00) 58%, ` +
        `rgba(255,255,255,0.85) 63%, ` +
        `${color} 67%, ` +
        `rgba(255,255,255,0.00) 74%)`;

      iris.style.boxShadow =
        `0 0 ${Math.round(26 + k * 34)}px rgba(255,255,255,0.20), ` +
        `0 0 ${Math.round(34 + k * 46)}px ${color}`;

      iris.style.filter = `brightness(1.30) saturate(1.55) contrast(1.08)`;
      iris.style.transform = `translate(-50%,-50%) scale(0.72) rotate(${this.rand(
        -18,
        18
      ).toFixed(1)}deg)`;

      this.layer.appendChild(iris);

      requestAnimationFrame(() => {
        const dur = 220 + k * 80;
        iris.style.transition =
          `transform ${dur}ms cubic-bezier(.12,.95,.18,1), opacity ${dur}ms ease, filter ${dur}ms ease`;
        iris.style.transform = `translate(-50%,-50%) scale(${(1.25 + k * 0.35).toFixed(
          3
        )}) rotate(${this.rand(-120, 120).toFixed(1)}deg)`;
        iris.style.opacity = "0";
        iris.style.filter = `brightness(1.05) saturate(1.15) contrast(1.05)`;
      });
      setTimeout(() => iris.remove(), 360 + k * 80);

      // Constellation Arc (ritual sweep)
      const arc = this.createParticle(10, {
        shape: "star",
        alpha: 1.0,
        spread: 0.0,
        className: "burstArc",
      });

      const ar = Math.round(140 + k * 140);
      arc.style.left = `${x}px`;
      arc.style.top = `${y}px`;
      arc.style.width = `${ar}px`;
      arc.style.height = `${ar}px`;
      arc.style.borderRadius = "50%";
      arc.style.mixBlendMode = BLEND;
      arc.style.opacity = "1";

      // Conic arc with radial mask (thin magical sweep)
      arc.style.background =
        `conic-gradient(from 0deg, ` +
        `rgba(255,255,255,0.00) 0deg, ` +
        `rgba(255,255,255,0.00) 80deg, ` +
        `${color} 120deg, ` +
        `rgba(255,255,255,0.95) 145deg, ` +
        `${color} 170deg, ` +
        `rgba(255,255,255,0.00) 210deg, ` +
        `rgba(255,255,255,0.00) 360deg)`;

      // Mask to thin ring band
      arc.style.webkitMaskImage =
        `radial-gradient(circle, ` +
        `rgba(0,0,0,0.00) 54%, ` +
        `rgba(0,0,0,1.00) 58%, ` +
        `rgba(0,0,0,1.00) 63%, ` +
        `rgba(0,0,0,0.00) 67%)`;
      arc.style.maskImage = arc.style.webkitMaskImage;

      arc.style.boxShadow =
        `0 0 ${Math.round(22 + k * 34)}px ${color}, ` +
        `0 0 ${Math.round(44 + k * 52)}px rgba(255,255,255,0.14)`;

      arc.style.filter = `brightness(1.28) saturate(1.50) contrast(1.10)`;
      arc.style.transform = `translate(-50%,-50%) scale(0.72) rotate(${this.rand(
        -90,
        90
      ).toFixed(1)}deg)`;

      this.layer.appendChild(arc);

      requestAnimationFrame(() => {
        const dur = 360 + k * 160;
        arc.style.transition = `transform ${dur}ms cubic-bezier(.12,.92,.16,1), opacity ${dur}ms ease, filter ${dur}ms ease`;
        arc.style.transform = `translate(-50%,-50%) scale(${(1.12 + k * 0.22).toFixed(
          3
        )}) rotate(${(420 + this.rand(-40, 40)).toFixed(1)}deg)`;
        arc.style.opacity = "0";
        arc.style.filter = `brightness(1.05) saturate(1.15) contrast(1.06)`;
      });
      setTimeout(() => arc.remove(), 560 + k * 200);
    }

    // ==========================================
    // GOD ADDITION 3: COMBO MILESTONE BLESSING HALO
    // ==========================================
    if (milestone) {
      const halo = this.createParticle(10, {
        shape: "star",
        alpha: 1.0,
        spread: 0.0,
        className: "burstBlessing",
      });

      const hr = Math.round(190 + k * 140);
      halo.style.left = `${x}px`;
      halo.style.top = `${y}px`;
      halo.style.width = `${hr}px`;
      halo.style.height = `${hr}px`;
      halo.style.borderRadius = "50%";
      halo.style.mixBlendMode = BLEND;
      halo.style.opacity = "1";

      // Strong, clean blessing ring (cut-in feel but light)
      halo.style.background =
        `radial-gradient(circle, ` +
        `rgba(255,255,255,0.00) 58%, ` +
        `rgba(255,255,255,0.88) 62%, ` +
        `${color} 66%, ` +
        `rgba(255,255,255,0.00) 72%)`;

      halo.style.boxShadow =
        `0 0 ${Math.round(34 + k * 52)}px ${color}, ` +
        `0 0 ${Math.round(70 + k * 90)}px rgba(255,255,255,0.12)`;

      halo.style.filter = `brightness(1.35) saturate(1.55) contrast(1.10)`;
      halo.style.transform = `translate(-50%,-50%) scale(0.62)`;

      this.layer.appendChild(halo);

      requestAnimationFrame(() => {
        const dur = 260 + k * 120;
        halo.style.transition = `transform ${dur}ms cubic-bezier(.10,.95,.18,1), opacity ${dur}ms ease, filter ${dur}ms ease`;
        halo.style.transform = `translate(-50%,-50%) scale(${(1.28 + k * 0.20).toFixed(
          3
        )})`;
        halo.style.opacity = "0";
        halo.style.filter = `brightness(1.05) saturate(1.15) contrast(1.06)`;
      });

      setTimeout(() => halo.remove(), 420 + k * 120);
    }

    // ----- DUST SPARKLES (main) -----
    for (let i = 0; i < count; i++) {
      const base = 9 + k * 7;
      const size = Math.round(base + this.rand(-3, 10));

      const el = this.createParticle(size, {
        shape: "star",
        alpha: clamp(0.90 + k * 0.10, 0.90, 1.0),
        spread: 1.0,
        className: "burstDust",
      });

      const ang = Math.random() * Math.PI * 2;
      const rad = Math.pow(Math.random(), 0.58) * spread;
      const dx = Math.cos(ang) * rad;
      const dy = Math.sin(ang) * rad;

      el.style.left = `${x + dx}px`;
      el.style.top = `${y + dy}px`;

      el.style.background = color;
      el.style.mixBlendMode = BLEND;
      el.style.opacity = "1";

      const glow = 12 + k * 22 + this.rand(-2, 6);
      const halo = 30 + k * 36 + this.rand(-4, 10);
      const far = 54 + k * 52 + this.rand(-8, 18);

      el.style.boxShadow =
        `0 0 ${Math.round(glow * 0.50)}px rgba(255,255,255,0.65), ` +
        `0 0 ${glow.toFixed(0)}px ${color}, ` +
        `0 0 ${halo.toFixed(0)}px ${color}, ` +
        `0 0 ${far.toFixed(0)}px rgba(255,255,255,0.10)`;

      el.style.filter = `brightness(${(1.35 + k * 0.45).toFixed(
        2
      )}) saturate(1.70) contrast(1.08)`;

      const startS = 0.52 + this.rand(-0.10, 0.18);
      const endS = 1.20 + k * 0.95 + this.rand(-0.08, 0.55);
      const rot0 = this.rand(-22, 22);
      const rot1 = rot0 + this.rand(-120, 120);

      el.style.transform = `translate(-50%,-50%) scale(${startS.toFixed(
        3
      )}) rotate(${rot0.toFixed(1)}deg)`;
      this.layer.appendChild(el);

      requestAnimationFrame(() => {
        const dur = lifeBase + this.rand(-60, lifeJit) + k * 90;
        el.style.transition =
          `transform ${dur}ms cubic-bezier(.14,.90,.22,1), opacity ${dur}ms ease, filter ${dur}ms ease`;
        el.style.transform = `translate(-50%,-50%) scale(${endS.toFixed(
          3
        )}) rotate(${rot1.toFixed(1)}deg)`;
        el.style.opacity = "0";
        el.style.filter = `brightness(${(1.05 + k * 0.20).toFixed(
          2
        )}) saturate(1.20) contrast(1.05)`;
      });

      setTimeout(() => el.remove(), 560 + k * 120);
    }
  };
}
