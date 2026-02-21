/* /di/js/result.js
   TAROT BREAKER – RESULT PRESENTATION (FULLSCREEN ARU EYE OVERLAY) [PROD SAFE v1.3.6]
   - Works with /di/js/main.js (expects window.DI_RESULT.init)
   - Fullscreen top-layer overlay (fixed, z-index max)
   - HARD-HIDE all game layers under #app using VISIBILITY (robust)
   - Eye image is inside circle (.tbEye) to avoid square artifacts
   - ARU is the hero: Digital ring + center core rim synced to ARU color
   - ARU tint layer makes ARU color always readable without killing the illustration
   - iOS/Safari safe stacking & masking
   - Non-destructive to #result (adds overlay shell only)
*/
(function () {
  "use strict";

  // =========================
  // Config
  // =========================
  const CFG = Object.freeze({
    VERSION: "1.3.6",
    STYLE_ID: "tbResultOverlayStyles_v136",
    SHELL_CLASS: "tbResultOverlayShell",
    ROOT_ACTIVE_CLASS: "tb-active",
    APP_CUT_CLASS: "tb-result-active",

    // GitHub Pages-safe absolute path
    EYE_IMAGE_URL: "/di/dico_eye_result.png",

    NAME_CALL_THRESHOLD: 50,
    COUNTUP_FRAMES: 56,
    Z_MAX: 2147483647,

    // ARU ring tuning
    RING_INSET_PCT: 5.5,
    RING_THICKNESS_PCT: 10.5,

    // Eye image tuning (CENTER iris + star in center)
    // ここで「虹彩/星の中心」を合わせる。JSは触らない（固定運用）
    EYE_BG_SIZE: 190,     // %
    // ★要望：もう少し右・下
    // まずはこの値で。さらに動かしたい時は +2 ずつ増減すると迷わない。
    EYE_BG_POS_X: 37,     // % 右へ
    EYE_BG_POS_Y: 33,     // % 下へ（※見た目は“Yが増えるほど下”）

    // ARU tint (iris-only) visibility guarantee
    // 目の絵を殺さない範囲で「最低でもARU色が読める」
    // === ARU COLOR VISIBILITY CONTROL ===
// 0 = ほぼ見えない
// 1 = かなり強い（絵が死ぬ一歩手前）
ARU_COLOR_STRENGTH: 0.60,  // ← 基本強度（まずここだけ触る）
ARU_COLOR_RESONANCE_BOOST: 0.28, // 共鳴による増幅
  });

  // =========================
  // Utils
  // =========================
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const toNum = (v, d = 0) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : d;
  };

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

  // Score normalization strategy:
  // - prefer maxCombo proxy: maxCombo * 120
  // - fallback: soft log
  // - fallback: resonance
  function normalizeScore01(score, maxCombo, resonancePercent) {
    const s = Math.max(0, toNum(score, 0));
    const mc = Math.max(0, toNum(maxCombo, 0));
    const proxyMax = mc > 0 ? mc * 120 : 0;

    if (proxyMax >= 240) return clamp(s / proxyMax, 0, 1);

    if (s > 0) {
      const p = Math.log10(1 + s) / Math.log10(1 + 6000);
      return clamp(p, 0, 1);
    }

    return clamp(toNum(resonancePercent, 0) / 100, 0, 1);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function hexToRgb(hex) {
    const h = String(hex).replace("#", "").trim();
    const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(v, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToCss({ r, g, b }, a = 1) {
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
  }
  function mix(hexA, hexB, t) {
    const A = hexToRgb(hexA), B = hexToRgb(hexB);
    return { r: lerp(A.r, B.r, t), g: lerp(A.g, B.g, t), b: lerp(A.b, B.b, t) };
  }

  const COLORS = Object.freeze({
    navy:   "#0b1020",
    aqua:   "#00F0FF",
    violet: "#8A2BE2",
    magenta:"#FF2FB2",
    gold:   "#FFD46A",
    white:  "#FFFFFF",
  });

  // Score -> ARU hue
  function aruColorByScoreP(p) {
    if (p < 0.20) return rgbToCss(mix(COLORS.navy,   COLORS.aqua,    p / 0.20), 0.95);
    if (p < 0.45) return rgbToCss(mix(COLORS.aqua,   COLORS.violet, (p - 0.20) / 0.25), 0.95);
    if (p < 0.70) return rgbToCss(mix(COLORS.violet, COLORS.magenta,(p - 0.45) / 0.25), 0.95);
    if (p < 0.90) return rgbToCss(mix(COLORS.magenta,COLORS.gold,   (p - 0.70) / 0.20), 0.96);
    return rgbToCss(mix(COLORS.gold,   COLORS.white, (p - 0.90) / 0.10), 0.98);
  }

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

  // =========================
  // DOM (non-destructive)
  // =========================
  function ensureShell(root) {
    let shell = root.querySelector("." + CFG.SHELL_CLASS);
    if (shell) return shell;

    shell = document.createElement("div");
    shell.className = CFG.SHELL_CLASS;
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-label", "Result");

    shell.innerHTML = `
      <div class="tbResultOverlayBlack" aria-hidden="true"></div>

      <div class="tbEyeStage" aria-label="ARU Eye">
        <div class="tbEye" id="tbEye" aria-hidden="true">
          <div class="tbEyeNoise"></div>

          <!-- ★ ARU tint overlay (iris-only). Always readable, art-safe -->
          <div class="tbAruTint" aria-hidden="true"></div>

          <div class="tbAruRing" aria-hidden="true"></div>
          <div class="tbAruRingTicks" aria-hidden="true"></div>

          <div class="tbCore" id="tbCore" aria-hidden="true"></div>

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

  // =========================
  // CSS injection (once)
  // =========================
  function injectStylesOnce() {
    if (document.getElementById(CFG.STYLE_ID)) return;

    const s = document.createElement("style");
    s.id = CFG.STYLE_ID;
    s.textContent = `
/* ===== TB RESULT OVERLAY v${CFG.VERSION} (ARU HERO / CENTERED IRIS) ===== */

#result{
  position: fixed !important;
  inset: 0 !important;
  z-index: ${CFG.Z_MAX} !important;
  display: block !important;
  pointer-events: none;
  background: #000 !important;

  /* iOS/Safari stack safety */
  isolation: isolate !important;
  contain: layout paint style !important;
  transform: translateZ(0) !important;

  /* Eye image tuning variables (CENTER iris + star) */
  --tb-eye-size: ${CFG.EYE_BG_SIZE}%;
  --tb-eye-pos: ${CFG.EYE_BG_POS_X}% ${CFG.EYE_BG_POS_Y}%;
  --tb-aru: rgba(0,240,255,0.95);
  --tb-glow: 0.35;
  --tb-specular: 0;
  --tb-aru-tint: ${CFG.ARU_TINT_MIN};
}

#result.${CFG.ROOT_ACTIVE_CLASS}{
  pointer-events: auto;
}

/* HARD CUT: hide everything under #app by visibility */
#app.${CFG.APP_CUT_CLASS} *{
  visibility: hidden !important;
}
#app.${CFG.APP_CUT_CLASS} #result,
#app.${CFG.APP_CUT_CLASS} #result *{
  visibility: visible !important;
}

/* Shell */
#result .${CFG.SHELL_CLASS}{
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 14px;
  padding: 16px;
}

/* Background depth + ARU bloom sync */
#result .tbResultOverlayBlack{
  position:absolute;
  inset:0;
  z-index:0;
  background:
    radial-gradient(circle at 50% 44%,
      rgba(18,20,28,0.18) 0%,
      rgba(0,0,0,0.88) 56%,
      rgba(0,0,0,0.98) 100%);
}
#result .tbResultOverlayBlack::after{
  content:"";
  position:absolute;
  inset:0;
  background:
    radial-gradient(circle at 50% 44%,
      var(--tb-aru) 0%,
      rgba(0,0,0,0) 62%);
  mix-blend-mode: screen;
  opacity: calc(var(--tb-glow) * 0.85);
  filter: blur(1px);
  pointer-events:none;
}

/* Stage */
#result .tbEyeStage{
  position: relative;
  z-index: 1;
  width: min(92vw, 540px);
  display:flex;
  justify-content:center;
  align-items:center;
}

/* Eye = image inside circle */
#result .tbEye{
  position: relative;
  width: min(92vw, 540px);
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  overflow: hidden;

  background-image: url("${CFG.EYE_IMAGE_URL}");
  background-size: var(--tb-eye-size);
  background-position: var(--tb-eye-pos);
  background-repeat: no-repeat;

  box-shadow:
    0 28px 90px rgba(0,0,0,0.72),
    0 0 0 1px rgba(255,255,255,0.14) inset;

  /* iOS “round but looks square” fix */
  -webkit-mask-image: -webkit-radial-gradient(white, black);

  transform: translateZ(0);
}

/* Darken edges to lock ARU into the eye */
#result .tbEye::before{
  content:"";
  position:absolute;
  inset:0;
  background:
    radial-gradient(circle at 50% 50%,
      rgba(0,0,0,0.00) 44%,
      rgba(0,0,0,0.55) 74%,
      rgba(0,0,0,0.88) 100%);
  pointer-events:none;
}

/* Noise scan (subtle) */
#result .tbEyeNoise{
  position:absolute;
  inset:-30%;
  background:
    repeating-linear-gradient(90deg,
      rgba(255,255,255,0.00) 0px,
      rgba(255,255,255,0.00) 9px,
      rgba(255,255,255,0.05) 10px,
      rgba(255,255,255,0.00) 12px);
  opacity: .09;
  mix-blend-mode: overlay;
  transform: translateX(-18%);
  animation: tbNoise 2.8s linear infinite;
  pointer-events:none;
}

/* =========================
   ARU TINT (IRIS-ONLY)
   - Always readable ARU color without killing the art
   ========================= */
#result .tbAruTint{
  position:absolute;
  inset:0;
  pointer-events:none;

  /* center-focused tint */
  background:
    radial-gradient(circle at 50% 50%,
      color-mix(in srgb, var(--tb-aru) 72%, transparent) 0%,
      rgba(0,0,0,0) 58%);

  /* restrict to iris area */
  -webkit-mask: radial-gradient(circle at 50% 50%,
    #000 0%,
    #000 46%,
    rgba(0,0,0,0) 64%);
          mask: radial-gradient(circle at 50% 50%,
    #000 0%,
    #000 46%,
    rgba(0,0,0,0) 64%);

  mix-blend-mode: color;
  opacity: var(--tb-aru-tint);
  filter: saturate(1.25) brightness(1.05);
}

/* =========================
   ARU RING (HERO)
   ========================= */
#result .tbAruRing{
  position:absolute;
  inset: ${CFG.RING_INSET_PCT}%;
  border-radius: 999px;
  pointer-events:none;

  background:
    conic-gradient(
      from 180deg,
      rgba(0,0,0,0) 0deg,
      var(--tb-aru) 60deg,
      rgba(255,47,178,0.78) 130deg,
      var(--tb-aru) 220deg,
      rgba(0,0,0,0) 360deg
    );

  -webkit-mask: radial-gradient(circle,
    transparent calc(100% - ${CFG.RING_THICKNESS_PCT}%),
    #000 calc(100% - ${CFG.RING_THICKNESS_PCT}% + 1%));
          mask: radial-gradient(circle,
    transparent calc(100% - ${CFG.RING_THICKNESS_PCT}%),
    #000 calc(100% - ${CFG.RING_THICKNESS_PCT}% + 1%));

  mix-blend-mode: screen;
  opacity: calc(0.78 + var(--tb-glow) * 0.22);
  filter: blur(0.25px);
  animation: tbRingSpin 8.8s linear infinite;
}

#result .tbAruRingTicks{
  position:absolute;
  inset: ${CFG.RING_INSET_PCT}%;
  border-radius: 999px;
  pointer-events:none;

  background:
    repeating-conic-gradient(
      from 0deg,
      rgba(255,255,255,0.00) 0deg,
      rgba(255,255,255,0.00) 6deg,
      rgba(255,255,255,0.14) 6.5deg,
      rgba(255,255,255,0.00) 7deg
    );

  -webkit-mask: radial-gradient(circle,
    transparent calc(100% - ${CFG.RING_THICKNESS_PCT}%),
    #000 calc(100% - ${CFG.RING_THICKNESS_PCT}% + 1%));
          mask: radial-gradient(circle,
    transparent calc(100% - ${CFG.RING_THICKNESS_PCT}%),
    #000 calc(100% - ${CFG.RING_THICKNESS_PCT}% + 1%));

  mix-blend-mode: overlay;
  opacity: 0.55;
  filter: blur(0.15px);
  animation: tbTicksFlicker 1.9s ease-in-out infinite;
}

/* =========================
   CORE (CENTER SPHERE)
   ========================= */
#result .tbCore{
  position:absolute;
  inset: 40%;
  border-radius: 999px;
  pointer-events:none;

  background:
    radial-gradient(circle at 36% 32%,
      rgba(255,255,255,0.55) 0%,
      rgba(235,235,235,0.22) 18%,
      rgba(120,120,120,0.30) 44%,
      rgba(40,40,40,0.85) 78%,
      rgba(0,0,0,0.95) 100%);

  box-shadow:
    0 0 0 1px rgba(255,255,255,0.10) inset,
    0 0 0 2px rgba(255,255,255,0.04) inset,
    0 0 20px rgba(0,0,0,0.38),
    0 0 calc(12px + var(--tb-glow)*44px) color-mix(in srgb, var(--tb-aru) 55%, transparent),
    0 0 calc(26px + var(--tb-glow)*64px) color-mix(in srgb, var(--tb-aru) 28%, transparent);

  animation: tbCorePulse 2.6s ease-in-out infinite;
}

/* Specular sparkle at high score */
#result .tbSpecular{
  position:absolute;
  inset: 0;
  opacity: var(--tb-specular);
  background:
    radial-gradient(circle at 35% 32%,
      rgba(255,255,255,0.62) 0%,
      rgba(255,255,255,0.18) 16%,
      rgba(0,0,0,0) 34%);
  mix-blend-mode: screen;
  filter: blur(0.5px);
  pointer-events:none;
}

/* Readout */
#result .tbResultReadout{ position: relative; text-align:center; z-index: 1; }
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

/* Copy */
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

/* Button */
#result .tbActions{ position: relative; z-index: 1; margin-top: 2px; }
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

/* Entry */
#result.${CFG.ROOT_ACTIVE_CLASS} .tbEye{
  animation: tbEyeIn .65s cubic-bezier(.2,.9,.2,1) both;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce){
  #result .tbEyeNoise,
  #result .tbAruRing,
  #result .tbAruRingTicks,
  #result .tbCore{
    animation: none !important;
  }
}

/* Keyframes */
@keyframes tbEyeIn{
  0%{ transform: scale(0.985); filter: brightness(0.75); opacity: 0; }
  60%{ transform: scale(1.02);  filter: brightness(1.02); opacity: 1; }
  100%{ transform: scale(1.00); filter: brightness(1.00); opacity: 1; }
}
@keyframes tbNoise{
  0%{ transform: translateX(-18%); opacity: .07; }
  50%{ opacity: .11; }
  100%{ transform: translateX(18%); opacity: .07; }
}
@keyframes tbRingSpin{
  0%{ transform: rotate(0deg); }
  100%{ transform: rotate(360deg); }
}
@keyframes tbTicksFlicker{
  0%,100%{ opacity: 0.45; }
  50%{ opacity: 0.62; }
}
@keyframes tbCorePulse{
  0%,100%{ transform: scale(1.00); filter: brightness(1.00); }
  50%{ transform: scale(1.04); filter: brightness(1.08); }
}
`;
    document.head.appendChild(s);
  }

  // =========================
  // Paint / Animate
  // =========================
  function paintAndAnimate(root, payload) {
    const percentEl = root.querySelector("#tbResPercent");
    const lineEl = root.querySelector("#tbLine");
    if (!percentEl || !lineEl) return;

    const resPercent = normalizePercent(payload?.resonance ?? 0);
    const score = toNum(payload?.score, 0);
    const maxCombo = toNum(payload?.maxCombo, 0);

    const scoreP = normalizeScore01(score, maxCombo, resPercent);

    // ARU color (hero)
    const aruColor = aruColorByScoreP(scoreP);

    // Glow power: resonance base + score push
    const glow = clamp(0.18 + (resPercent / 100) * 0.58 + scoreP * 0.22, 0.18, 1.0);

    // Specular at high score
    const specular = scoreP >= 0.90 ? clamp((scoreP - 0.90) / 0.10, 0, 1) : 0;

    // ★ARU tint: guarantee visibility, but cap to keep art alive
    const tint = clamp(
      CFG.ARU_TINT_MIN + glow * CFG.ARU_TINT_GLOW_WEIGHT,
      CFG.ARU_TINT_MIN,
      CFG.ARU_TINT_MAX
    );

    // Sync vars across ring / core / bloom / tint
    root.style.setProperty("--tb-aru", aruColor);
    root.style.setProperty("--tb-glow", String(glow));
    root.style.setProperty("--tb-specular", String(specular * 0.9));
    root.style.setProperty("--tb-aru-tint", String(tint));

    // 画像位置は固定（CFGのみで調整する）
    // -> ここでは触らない

    const name = safeUserName();
    const callName = !!name && resPercent >= CFG.NAME_CALL_THRESHOLD;
    lineEl.innerText = lineBy(resPercent, callName ? name : null);

    // Count-up
    percentEl.textContent = "0%";
    let cur = 0;
    const target = clamp(resPercent, 0, 100);
    const step = Math.max(1, Math.ceil(target / CFG.COUNTUP_FRAMES));

    function tick() {
      cur = clamp(cur + step, 0, target);
      percentEl.textContent = `${cur}%`;
      if (cur < target) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function wireReplayOnce(root, app) {
    const replayBtn = root.querySelector("#tbReplayBtn");
    if (!replayBtn || replayBtn.__tbBound) return;

    replayBtn.__tbBound = true;
    replayBtn.addEventListener("click", () => {
      root.classList.remove(CFG.ROOT_ACTIVE_CLASS);
      if (app) app.classList.remove(CFG.APP_CUT_CLASS);

      const startBtn = document.getElementById("startBtn");
      if (startBtn) { startBtn.click(); return; }
      const restartBtn = document.getElementById("restartBtn");
      restartBtn?.click?.();
    }, { passive: true });
  }

  // =========================
  // Public API
  // =========================
  window.DI_RESULT = {
    init(opts) {
      const root = opts?.root || document.getElementById("result");
      const app = opts?.app || document.getElementById("app");
      if (!root) return { show() {}, hide() {} };

      injectStylesOnce();
      ensureShell(root);
      wireReplayOnce(root, app);

      return {
        show(payload) {
          ensureShell(root);
          wireReplayOnce(root, app);

          if (app) app.classList.add(CFG.APP_CUT_CLASS);
          root.classList.add(CFG.ROOT_ACTIVE_CLASS);

          paintAndAnimate(root, payload || {});
        },
        hide() {
          root.classList.remove(CFG.ROOT_ACTIVE_CLASS);
          if (app) app.classList.remove(CFG.APP_CUT_CLASS);
        },
      };
    },
  };

  window.TB_RESULT = window.TB_RESULT || {};
})();
