/* /di/js/result.js
   TAROT BREAKER – RESULT PRESENTATION (FULLSCREEN ARU EYE OVERLAY) [PROD SAFE v1.2]
   - Works with /di/js/main.js (expects window.DI_RESULT.init)
   - Fullscreen top-layer overlay (fixed, z-index max)
   - When active: hides ALL game UI under app, shows ONLY #result overlay
   - Black screen -> DiCo eye close-up
   - Pupil color driven by SCORE, glow driven by resonance (+ score)
   - MAX/detail is NOT implemented here (future: redirect page)
*/
(function () {
  "use strict";

  // ---------- utils ----------
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const toNum = (v, d = 0) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : d;
  };

  // Optional username (safe)
  function safeUserName() {
    try {
      if (typeof window.getUserName === "function") {
        const n = window.getUserName();
        if (typeof n === "string" && n.trim()) return n.trim();
      }
    } catch {}
    return null;
  }

  // Resonance can be 0..1 or 0..100
  function normalizePercent(resonance) {
    let r = toNum(resonance, 0);
    if (r <= 1.0001) r *= 100;
    return clamp(Math.round(r), 0, 100);
  }

  // Score normalization strategy (stable across charts):
  // - prefer maxCombo proxy: maxCombo * 120 approximates a "perfect chain segment"
  // - fallback: map by resonance
  function normalizeScore01(score, maxCombo, resonancePercent) {
    const s = Math.max(0, toNum(score, 0));
    const mc = Math.max(0, toNum(maxCombo, 0));
    const proxyMax = mc > 0 ? mc * 120 : 0;

    // If proxyMax exists and not tiny, use it
    if (proxyMax >= 240) {
      return clamp(s / proxyMax, 0, 1);
    }

    // If score is large anyway, use a soft log curve
    if (s > 0) {
      // smooth: score 0..6000 -> ~0..1 (soft, chart-agnostic)
      const p = Math.log10(1 + s) / Math.log10(1 + 6000);
      return clamp(p, 0, 1);
    }

    // fallback to resonance
    return clamp((toNum(resonancePercent, 0) / 100), 0, 1);
  }

  // Color palette (pupil is the “truth”; iris is subtle)
  // Score -> pupil hue:
  //  0..0.2 Navy, 0.2..0.45 Aqua, 0.45..0.7 Violet, 0.7..0.9 Magenta, 0.9..1 Gold
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hexToRgb(hex) {
    const h = String(hex).replace("#", "").trim();
    const v = h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h;
    const n = parseInt(v, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToCss({ r, g, b }, a = 1) {
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
  }
  function mix(hexA, hexB, t) {
    const A = hexToRgb(hexA), B = hexToRgb(hexB);
    return {
      r: lerp(A.r, B.r, t),
      g: lerp(A.g, B.g, t),
      b: lerp(A.b, B.b, t),
    };
  }

  const COLORS = {
    navy:   "#0b1020",
    aqua:   "#00F0FF",
    violet: "#8A2BE2",
    magenta:"#FF2FB2",
    gold:   "#FFD46A",
    white:  "#FFFFFF",
  };

  function pupilColorByScoreP(p) {
    // piecewise mix
    if (p < 0.20) return rgbToCss(mix(COLORS.navy, COLORS.aqua, p / 0.20), 0.95);
    if (p < 0.45) return rgbToCss(mix(COLORS.aqua, COLORS.violet, (p - 0.20) / 0.25), 0.95);
    if (p < 0.70) return rgbToCss(mix(COLORS.violet, COLORS.magenta, (p - 0.45) / 0.25), 0.95);
    if (p < 0.90) return rgbToCss(mix(COLORS.magenta, COLORS.gold, (p - 0.70) / 0.20), 0.96);
    return rgbToCss(mix(COLORS.gold, COLORS.white, (p - 0.90) / 0.10), 0.98);
  }

  // copy (short, “result = ritual”)
  function lineBy(resPercent, nameOrNull) {
    const name = nameOrNull;
    if (resPercent >= 100) {
      return name
        ? `……ARU、完成。\n${name}──君の想いは、瞳に宿った。`
        : `……ARU、完成。\n君の想いは、瞳に宿った。`;
    }
    if (resPercent >= 80) {
      return name
        ? `${name}。\n波形が綺麗。あと少しで“完成域”。`
        : `波形が綺麗。\nあと少しで“完成域”。`;
    }
    if (resPercent >= 50) {
      return name
        ? `${name}。\n揺らぎはある。だから、伸びる。`
        : `揺らぎはある。\nだから、伸びる。`;
    }
    return `共鳴は消えてない。\nDiDiDi…もう一回、いこ？`;
  }

  // ---------- DOM (non-destructive to engine result DOM) ----------
  // We build our overlay shell as an additional child, and NEVER wipe existing #result content.
  function ensureShell(root) {
    let shell = root.querySelector(".tbResultOverlayShell");
    if (shell) return shell;

    shell = document.createElement("div");
    shell.className = "tbResultOverlayShell";
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-label", "Result");

    shell.innerHTML = `
      <div class="tbResultOverlayBlack" aria-hidden="true"></div>

      <div class="tbEyeStage" aria-label="ARU Eye">
        <div class="tbEye" id="tbEye" aria-hidden="true">
          <div class="tbEyeNoise"></div>
          <div class="tbEyeVignette"></div>

          <div class="tbIris" id="tbIris"></div>
          <div class="tbIrisThreads"></div>

          <div class="tbPupil" id="tbPupil"></div>
          <div class="tbPupilGlow" id="tbPupilGlow"></div>

          <div class="tbSpecular" id="tbSpecular"></div>
        </div>
      </div>

      <div class="tbResultReadout" aria-label="Readout">
        <div class="tbResPercent" id="tbResPercent">0%</div>
        <div class="tbResLabel">RESONANCE</div>
      </div>

      <div class="tbLine" id="tbLine"></div>

      <div class="tbActions">
        <button class="tbBtn" id="tbReplayBtn" type="button">RESONATE AGAIN</button>
      </div>
    `;

    root.appendChild(shell);
    return shell;
  }

  // Retrigger helper
  function retrigger(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; // force reflow
    el.classList.add(cls);
  }

  // ---------- CSS injection ----------
  function injectStylesOnce() {
    if (document.getElementById("tbResultOverlayStyles")) return;

    const s = document.createElement("style");
    s.id = "tbResultOverlayStyles";
    s.textContent = `
/* ===== TB RESULT OVERLAY v1.2 ===== */

/* Base: #result becomes the fullscreen overlay container */
#result{
  position: fixed !important;
  inset: 0 !important;
  z-index: 2147483647 !important; /* max-ish */
  pointer-events: none;
  display: block;
}

/* Active overlay */
#result.tb-active{
  pointer-events: auto;
}

/* Hide everything under app while result is active:
   - We hide all direct children of #app
   - Then re-enable #result and its children.
*/
#app.tb-result-active > *{
  visibility: hidden !important;
}
#app.tb-result-active #result,
#app.tb-result-active #result *{
  visibility: visible !important;
}

/* Overlay shell */
#result .tbResultOverlayShell{
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 14px;
  padding: 16px;
}

/* Pure black (slight depth) */
#result .tbResultOverlayBlack{
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 45%, rgba(18,20,28,0.20) 0%, rgba(0,0,0,0.92) 55%, rgba(0,0,0,0.98) 100%);
}

/* Eye stage */
#result .tbEyeStage{
  position: relative;
  width: min(92vw, 520px);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Eye close-up (big) */
#result .tbEye{
  position: relative;
  width: min(92vw, 520px);
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  overflow: hidden;
  transform: translateZ(0);
  box-shadow:
    0 28px 80px rgba(0,0,0,0.70),
    0 0 0 1px rgba(255,255,255,0.12) inset;
  background: radial-gradient(circle at 50% 50%, rgba(5,6,10,0.90) 0%, rgba(0,0,0,0.98) 72%, rgba(0,0,0,1) 100%);
}

/* Subtle scan/noise */
#result .tbEyeNoise{
  position:absolute; inset:-30%;
  background:
    repeating-linear-gradient(90deg,
      rgba(255,255,255,0.00) 0px,
      rgba(255,255,255,0.00) 9px,
      rgba(255,255,255,0.05) 10px,
      rgba(255,255,255,0.00) 12px);
  opacity: .10;
  mix-blend-mode: overlay;
  transform: translateX(-18%);
  animation: tbNoise 2.8s linear infinite;
}

/* Vignette for close-up */
#result .tbEyeVignette{
  position:absolute; inset:-10%;
  background:
    radial-gradient(circle at 50% 50%,
      rgba(0,0,0,0) 48%,
      rgba(0,0,0,0.55) 72%,
      rgba(0,0,0,0.85) 100%);
}

/* Iris (kept subtle; pupil is the main actor) */
#result .tbIris{
  position:absolute; inset: 18%;
  border-radius: 999px;
  background:
    conic-gradient(from 120deg,
      rgba(0,240,255,0.26),
      rgba(138,43,226,0.22),
      rgba(255,47,178,0.22),
      rgba(0,240,255,0.26));
  filter: saturate(1.05);
  opacity: .65;
  animation: tbIris 5.8s linear infinite;
}

/* Iris threads */
#result .tbIrisThreads{
  position:absolute; inset: 18%;
  border-radius: 999px;
  background:
    repeating-radial-gradient(circle,
      rgba(255,255,255,0.06) 0px,
      rgba(255,255,255,0.06) 1px,
      rgba(0,0,0,0) 3px,
      rgba(0,0,0,0) 6px);
  opacity: .18;
  mix-blend-mode: overlay;
}

/* Pupil */
#result .tbPupil{
  position:absolute;
  inset: 40%;
  border-radius: 999px;
  background: radial-gradient(circle at 50% 50%,
    rgba(0,0,0,0.92) 0%,
    rgba(0,0,0,0.98) 60%,
    rgba(0,0,0,1) 100%);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.10) inset;
  transform: scale(1.0);
}

/* Pupil glow (color set via CSS variable) */
#result .tbPupilGlow{
  position:absolute;
  inset: 30%;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%,
      var(--tb-pupil-glow, rgba(0,240,255,0.18)) 0%,
      rgba(0,0,0,0) 65%);
  filter: blur(18px);
  opacity: var(--tb-glow-power, 0.35);
  transform: scale(1.0);
  animation: tbBreath 3.6s ease-in-out infinite;
}

/* Specular star highlight (enabled at high score) */
#result .tbSpecular{
  position:absolute;
  inset: 0;
  opacity: var(--tb-specular, 0);
  background:
    radial-gradient(circle at 35% 32%,
      rgba(255,255,255,0.62) 0%,
      rgba(255,255,255,0.18) 16%,
      rgba(0,0,0,0) 34%);
  mix-blend-mode: screen;
  filter: blur(0.5px);
}

/* Readout */
#result .tbResultReadout{
  position: relative;
  text-align: center;
  z-index: 1;
}
#result .tbResPercent{
  font-size: 56px;
  font-weight: 900;
  letter-spacing: .01em;
  color: rgba(245,245,242,0.92);
  text-shadow: 0 10px 30px rgba(0,0,0,0.65);
  line-height: 1;
}
#result .tbResLabel{
  margin-top: 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .18em;
  color: rgba(245,245,242,0.68);
}

/* Line */
#result .tbLine{
  position: relative;
  z-index: 1;
  width: min(560px, 92vw);
  text-align: center;
  white-space: pre-line;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: .03em;
  color: rgba(245,245,242,0.92);
  text-shadow: 0 8px 24px rgba(0,0,0,0.65);
}

/* Actions */
#result .tbActions{
  position: relative;
  z-index: 1;
  margin-top: 2px;
}
#result .tbBtn{
  border: 0;
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 900;
  letter-spacing: .14em;
  background: rgba(255,255,255,0.12);
  color: rgba(245,245,242,0.92);
  box-shadow: 0 18px 52px rgba(0,0,0,0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
#result .tbBtn:active{ transform: translateY(1px); }

/* Entry animation: black -> eye */
#result.tb-active .tbEye{
  animation: tbEyeIn .65s cubic-bezier(.2,.9,.2,1) both;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce){
  #result .tbEyeNoise,
  #result .tbIris,
  #result .tbPupilGlow{
    animation: none !important;
  }
}

/* Keyframes */
@keyframes tbEyeIn{
  0%{ transform: scale(0.985); filter: brightness(0.75); opacity: 0; }
  60%{ transform: scale(1.02);  filter: brightness(1.05); opacity: 1; }
  100%{ transform: scale(1.00); filter: brightness(1.00); opacity: 1; }
}
@keyframes tbBreath{
  0%,100%{ transform: scale(1.00); }
  50%{ transform: scale(1.05); }
}
@keyframes tbIris{
  0%{ transform: rotate(0deg); }
  100%{ transform: rotate(360deg); }
}
@keyframes tbNoise{
  0%{ transform: translateX(-18%); opacity: .08; }
  50%{ opacity: .12; }
  100%{ transform: translateX(18%); opacity: .08; }
}
`;
    document.head.appendChild(s);
  }

  // ---------- animation / update ----------
  // Smooth count-up, but the "eye truth" (color/glow) is set immediately based on score/resonance.
  function animate(root, payload) {
    const percentEl = root.querySelector("#tbResPercent");
    const lineEl = root.querySelector("#tbLine");
    const pupilEl = root.querySelector("#tbPupil");
    const glowEl = root.querySelector("#tbPupilGlow");
    const specEl = root.querySelector("#tbSpecular");

    if (!percentEl || !lineEl || !pupilEl || !glowEl) return;

    const resPercent = normalizePercent(payload?.resonance ?? 0);
    const score = toNum(payload?.score, 0);
    const maxCombo = toNum(payload?.maxCombo, 0);

    const scoreP = normalizeScore01(score, maxCombo, resPercent);
    const pupilColor = pupilColorByScoreP(scoreP);

    // Glow power: base from resonance, boosted by scoreP slightly
    const glowPower = clamp(0.20 + (resPercent / 100) * 0.55 + scoreP * 0.25, 0.20, 1.00);

    // Specular: only at high score
    const specular = scoreP >= 0.90 ? clamp((scoreP - 0.90) / 0.10, 0, 1) : 0;

    // Apply dynamic vars (pupil+glow)
    root.style.setProperty("--tb-pupil-glow", pupilColor);
    root.style.setProperty("--tb-glow-power", String(glowPower));
    root.style.setProperty("--tb-specular", String(specular * 0.9));

    // Also tint pupil inner ring subtly by setting box-shadow
    pupilEl.style.boxShadow = `0 0 0 1px rgba(255,255,255,0.10) inset, 0 0 ${Math.round(22 + glowPower * 34)}px ${pupilColor}`;

    // Copy
    const name = safeUserName();
    lineEl.innerText = lineBy(resPercent, (name && resPercent >= 50) ? name : null);

    // Count up percent (soft)
    percentEl.textContent = "0%";
    let cur = 0;
    const target = clamp(resPercent, 0, 100);
    const frames = 56; // ~1s @60fps
    const step = Math.max(1, Math.ceil(target / frames));

    function tick() {
      cur = clamp(cur + step, 0, target);
      percentEl.textContent = `${cur}%`;
      if (cur < target) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------- public presenter ----------
  window.DI_RESULT = {
    init(opts) {
      const root = opts?.root || document.getElementById("result");
      const app = opts?.app || document.getElementById("app");

      if (!root) return { show() {}, hide() {} };

      injectStylesOnce();
      ensureShell(root);

      // Replay wiring (reliable: click startBtn; fallback restartBtn)
      const replayBtn = root.querySelector("#tbReplayBtn");
      if (replayBtn && !replayBtn.__tbBound) {
        replayBtn.__tbBound = true;
        replayBtn.addEventListener("click", () => {
          // Hide first (clean)
          root.classList.remove("tb-active");
          root.classList.remove("active");
          if (app) app.classList.remove("tb-result-active");

          const startBtn = document.getElementById("startBtn");
          if (startBtn) { startBtn.click(); return; }
          const restartBtn = document.getElementById("restartBtn");
          restartBtn?.click?.();
        });
      }

      return {
        show(payload) {
          // 1) Activate top overlay
          root.classList.add("tb-active");
          root.classList.add("active"); // backward compat (if any CSS depends on it)

          // 2) Hide all game elements under app, show only #result
          if (app) app.classList.add("tb-result-active");

          // 3) Ensure shell exists (in case engine re-rendered #result)
          ensureShell(root);

          // 4) Animate / paint
          animate(root, payload || {});
        },
        hide() {
          root.classList.remove("tb-active");
          root.classList.remove("active");
          if (app) app.classList.remove("tb-result-active");
        },
      };
    },
  };

  // Optional backwards compat namespace
  window.TB_RESULT = window.TB_RESULT || {};
})();
