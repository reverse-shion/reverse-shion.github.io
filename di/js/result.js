/* /di/js/result.js
   TAROT BREAKER – RESULT PRESENTATION (GAUGE CSS OUTSOURCED TO aru-gauge.css) [v1.4.2-PRO]
   ✅ ARUリングゲージのCSSは /di/css/aru-gauge.css に統合
   ✅ result.js は「値(変数)更新」「result表示/カット」「ARUレイヤー例外可視化」だけ担当
   ✅ iOS/Safari含む：visibility hard-cut 下でも .aruLayer / .aruFX を確実に生かす
   ✅ ARUゲージ(aru-gauge.css)と RESONANCE(結果%表示)が必ず一致する
*/
(function () {
  "use strict";

  const CFG = Object.freeze({
    VERSION: "1.4.2-PRO",
    STYLE_ID: "tbResultOverlayStyles_v142_min_pro",
    SHELL_CLASS: "tbResultOverlayShell",
    ROOT_ACTIVE_CLASS: "tb-active",
    APP_CUT_CLASS: "tb-result-active",

    // GitHub Pages-safe absolute path
    EYE_IMAGE_URL: "/di/dico_eye_result.png",

    NAME_CALL_THRESHOLD: 50,
    COUNTUP_FRAMES: 56,
    Z_MAX: 2147483647,

    // Eye image tuning
    EYE_BG_SIZE: 190, // %
    EYE_BG_POS_X: 37, // %
    EYE_BG_POS_Y: 33, // %

    // ARU gauge bridge targets (aru-gauge.css)
    ARU_LAYER_SELECTOR: ".aruLayer",
    ARU_SCORE_SELECTOR: ".aruScore",

    ARU: Object.freeze({
      // iris tint
      TINT_MIN: 0.24,
      TINT_MAX: 0.72,
      TINT_GLOW_WEIGHT: 0.46,

      // bloom behind everything
      BLOOM_ALPHA_BASE: 0.14,
      BLOOM_ALPHA_WEIGHT: 0.72,

      // pulse
      PULSE_MIN: 0.94,
      PULSE_MAX: 1.10,
    }),
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

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

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
    const A = hexToRgb(hexA),
      B = hexToRgb(hexB);
    return { r: lerp(A.r, B.r, t), g: lerp(A.g, B.g, t), b: lerp(A.b, B.b, t) };
  }

  // ✅ 蛍光色寄せ（とにかく“見える”）
  const COLORS = Object.freeze({
    neonCyan: "#00F6FF",
    neonViolet: "#A855FF",
    neonPink: "#FF2FEA",
    neonLime: "#B8FF3D",
    neonGold: "#FFE85A",
    white: "#FFFFFF",
  });

  // Score -> ARU hue (蛍光帯域)
  function aruColorByScoreP(p) {
    if (p < 0.22) return rgbToCss(mix(COLORS.neonCyan, COLORS.neonViolet, p / 0.22), 0.995);
    if (p < 0.48) return rgbToCss(mix(COLORS.neonViolet, COLORS.neonPink, (p - 0.22) / 0.26), 0.995);
    if (p < 0.72) return rgbToCss(mix(COLORS.neonPink, COLORS.neonGold, (p - 0.48) / 0.24), 0.995);
    if (p < 0.9) return rgbToCss(mix(COLORS.neonGold, COLORS.neonLime, (p - 0.72) / 0.18), 0.995);
    return rgbToCss(mix(COLORS.neonLime, COLORS.white, (p - 0.9) / 0.1), 0.999);
  }

  function lineBy(resPercent, nameOrNull) {
    const name = nameOrNull;
    if (resPercent >= 100) {
      return name
        ? `……ARU、完成。\n${name}──君の想いは、瞳に宿った。`
        : `……ARU、完成。\n君の想いは、瞳に宿った。`;
    }
    if (resPercent >= 80) {
      return name ? `${name}。\n波形が綺麗。あと少しで“完成域”。` : `波形が綺麗。\nあと少しで“完成域”。`;
    }
    if (resPercent >= 50) {
      return name ? `${name}。\n揺らぎはある。だから、伸びる。` : `揺らぎはある。\nだから、伸びる。`;
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

    // 注意: ARUリングゲージは aru-gauge.css の .aruLayer / .aruGauge で管理
    shell.innerHTML = `
      <div class="tbResultOverlayBlack" aria-hidden="true"></div>

      <div class="tbEyeStage" aria-label="ARU Eye">
        <div class="tbEye" id="tbEye" aria-hidden="true">
          <div class="tbEyeNoise"></div>
          <div class="tbAruTint" aria-hidden="true"></div>
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
/* ===== TB RESULT OVERLAY v${CFG.VERSION} (MIN + ARU BRIDGE) ===== */

#result{
  position: fixed !important;
  inset: 0 !important;
  z-index: ${CFG.Z_MAX} !important;
  display: block !important;
  pointer-events: none;
  background: #000 !important;

  isolation: isolate !important;
  contain: layout paint style !important;
  transform: translateZ(0) !important;

  --tb-eye-size: ${CFG.EYE_BG_SIZE}%;
  --tb-eye-pos: ${CFG.EYE_BG_POS_X}% ${CFG.EYE_BG_POS_Y}%;

  /* runtime vars */
  --tb-aru: rgba(0,246,255,0.995);
  --tb-glow: 0.35;
  --tb-specular: 0;

  --tb-aru-tint: ${CFG.ARU.TINT_MIN};
  --tb-bloom-a: ${CFG.ARU.BLOOM_ALPHA_BASE};
}

#result.${CFG.ROOT_ACTIVE_CLASS}{ pointer-events: auto; }

/* HARD CUT (visibility) */
#app.${CFG.APP_CUT_CLASS} *{ visibility: hidden !important; }
#app.${CFG.APP_CUT_CLASS} #result,
#app.${CFG.APP_CUT_CLASS} #result *{ visibility: visible !important; }

/* ✅ keep external ARU layers alive (aru-gauge / aru-fx) */
#app.${CFG.APP_CUT_CLASS} .aruFX,
#app.${CFG.APP_CUT_CLASS} .aruFX *,
#app.${CFG.APP_CUT_CLASS} .aruLayer,
#app.${CFG.APP_CUT_CLASS} .aruLayer *{
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

/* Background + bloom */
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
  inset:-8%;
  background:
    radial-gradient(circle at 50% 44%,
      color-mix(in srgb, var(--tb-aru) 46%, transparent) 0%,
      rgba(0,0,0,0) 68%);
  mix-blend-mode: screen;
  opacity: var(--tb-bloom-a);
  filter: blur(12px);
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

  -webkit-mask-image: -webkit-radial-gradient(white, black);
  transform: translateZ(0);
}

/* Vignette */
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
  z-index: 0;
}

/* Layer order */
#result .tbEyeNoise{ z-index: 1; }
#result .tbAruTint{  z-index: 2; }
#result .tbCore{     z-index: 4; }
#result .tbSpecular{ z-index: 5; }

/* Noise scan */
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

/* Iris tint */
#result .tbAruTint{
  position:absolute;
  inset:0;
  pointer-events:none;

  background:
    radial-gradient(circle at 50% 52%,
      color-mix(in srgb, var(--tb-aru) 86%, transparent) 0%,
      color-mix(in srgb, var(--tb-aru) 42%, transparent) 42%,
      rgba(0,0,0,0) 64%);

  -webkit-mask: radial-gradient(circle at 50% 52%,
    rgba(255,255,255,1) 0%,
    rgba(255,255,255,1) 48%,
    rgba(255,255,255,0) 66%);
          mask: radial-gradient(circle at 50% 52%,
    rgba(255,255,255,1) 0%,
    rgba(255,255,255,1) 48%,
    rgba(255,255,255,0) 66%);

  mix-blend-mode: color;
  opacity: var(--tb-aru-tint);
  filter: saturate(1.38) brightness(1.08);
}

/* Core */
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
    0 0 calc(12px + var(--tb-glow)*36px) color-mix(in srgb, var(--tb-aru) 60%, transparent),
    0 0 calc(24px + var(--tb-glow)*54px) color-mix(in srgb, var(--tb-aru) 34%, transparent);

  animation: tbCorePulse 2.6s ease-in-out infinite;
}

/* Specular */
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

@media (prefers-reduced-motion: reduce){
  #result .tbEyeNoise,
  #result .tbCore{ animation: none !important; }
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
@keyframes tbCorePulse{
  0%,100%{ transform: scale(${CFG.ARU.PULSE_MIN}); filter: brightness(1.00); }
  50%{ transform: scale(${CFG.ARU.PULSE_MAX}); filter: brightness(1.10); }
}
`;
    document.head.appendChild(s);
  }

  // =========================
  // ARU gauge bridge (aru-gauge.css)
  // =========================
  function setAruState(app, resPercent) {
    // data-aru-state is used by aru-gauge.css / aru-fx.css
    if (resPercent >= 100) app.dataset.aruState = "max";
    else if (resPercent >= 80) app.dataset.aruState = "high";
    else if (resPercent >= 50) app.dataset.aruState = "mid";
    else app.dataset.aruState = "low";
  }

  function syncAruGauge(app, resPercent) {
    // 0..1
    const v = clamp(resPercent / 100, 0, 1);
    app.style.setProperty("--aru-value", String(v));

    // Optional: force result-only triggers for CSS that relies on them
    app.dataset.state = "result";
    setAruState(app, resPercent);

    // Update center text inside aru-gauge layer (if present)
    const scoreEl = document.querySelector(CFG.ARU_SCORE_SELECTOR);
    if (scoreEl) scoreEl.textContent = `${resPercent}%`;
  }

  // =========================
  // Paint / Animate
  // =========================
  function paintAndAnimate(root, app, payload) {
    const percentEl = root.querySelector("#tbResPercent");
    const lineEl = root.querySelector("#tbLine");
    if (!percentEl || !lineEl) return;

    const resPercent = normalizePercent(payload?.resonance ?? 0);
    const score = toNum(payload?.score, 0);
    const maxCombo = toNum(payload?.maxCombo, 0);

    const scoreP = normalizeScore01(score, maxCombo, resPercent);
    const aruColor = aruColorByScoreP(scoreP);

    const glow = clamp(0.18 + (resPercent / 100) * 0.58 + scoreP * 0.22, 0.18, 1.0);
    const specular = scoreP >= 0.9 ? clamp((scoreP - 0.9) / 0.1, 0, 1) : 0;
    const tint = clamp(CFG.ARU.TINT_MIN + glow * CFG.ARU.TINT_GLOW_WEIGHT, CFG.ARU.TINT_MIN, CFG.ARU.TINT_MAX);
    const bloomA = clamp(CFG.ARU.BLOOM_ALPHA_BASE + glow * CFG.ARU.BLOOM_ALPHA_WEIGHT, 0, 0.9);

    root.style.setProperty("--tb-aru", aruColor);
    root.style.setProperty("--tb-glow", String(glow));
    root.style.setProperty("--tb-specular", String(specular * 0.9));
    root.style.setProperty("--tb-aru-tint", String(tint));
    root.style.setProperty("--tb-bloom-a", String(bloomA));

    // ✅ aru-gauge.css と完全同期（82%なら0.82）
    if (app) syncAruGauge(app, resPercent);

    const name = safeUserName();
    const callName = !!name && resPercent >= CFG.NAME_CALL_THRESHOLD;
    lineEl.innerText = lineBy(resPercent, callName ? name : null);

    // Count-up display (result readout)
    percentEl.textContent = "0%";
    let cur = 0;
    const target = clamp(resPercent, 0, 100);
    const step = Math.max(1, Math.ceil(target / CFG.COUNTUP_FRAMES));

    function tick() {
      cur = clamp(cur + step, 0, target);
      percentEl.textContent = `${cur}%`;

      // ✅ 中央の aruScore も同じカウントで追従させたい場合（任意）
      if (app) {
        const scoreEl = document.querySelector(CFG.ARU_SCORE_SELECTOR);
        if (scoreEl) scoreEl.textContent = `${cur}%`;
        app.style.setProperty("--aru-value", String(clamp(cur / 100, 0, 1)));
        setAruState(app, cur);
      }

      if (cur < target) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function wireReplayOnce(root, app) {
    const replayBtn = root.querySelector("#tbReplayBtn");
    if (!replayBtn || replayBtn.__tbBound) return;

    replayBtn.__tbBound = true;
    replayBtn.addEventListener(
      "click",
      () => {
        root.classList.remove(CFG.ROOT_ACTIVE_CLASS);
        if (app) {
          app.classList.remove(CFG.APP_CUT_CLASS);
          // result-state cleanup (optional)
          // app.dataset.state = "";
          // delete app.dataset.aruState;
        }

        const startBtn = document.getElementById("startBtn");
        if (startBtn) {
          startBtn.click();
          return;
        }
        const restartBtn = document.getElementById("restartBtn");
        restartBtn?.click?.();
      },
      { passive: true }
    );
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

          if (app) {
            // ✅ hard cut on (and used by aru-fx.css)
            app.classList.add(CFG.APP_CUT_CLASS);
          }

          root.classList.add(CFG.ROOT_ACTIVE_CLASS);

          paintAndAnimate(root, app, payload || {});
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
