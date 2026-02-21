// /di/js/result/paint.js
import { CFG } from "./config.js";
import { clamp, lerp, normalizePercent, normalizeScore01, safeUserName, toNum } from "./utils.js";
import { aruColorByScoreP, lineBy } from "./copy.js";

export function paintAndAnimate(overlayRoot, payload) {
  const percentEl = overlayRoot.querySelector("#tbResPercent");
  const lineEl = overlayRoot.querySelector("#tbLine");
  if (!percentEl || !lineEl) return;

  const resPercent = normalizePercent(payload?.resonance ?? 0);
  const score = toNum(payload?.score, 0);
  const maxCombo = toNum(payload?.maxCombo, 0);

  const scoreP = normalizeScore01(score, maxCombo, resPercent);

  // Neon ARU color
  const aruColor = aruColorByScoreP(scoreP);

  // Glow power
  const glow = clamp(0.18 + (resPercent / 100) * 0.58 + scoreP * 0.22, 0.18, 1.0);

  // Specular at high score
  const specular = scoreP >= 0.90 ? clamp((scoreP - 0.90) / 0.10, 0, 1) : 0;

  // Iris tint
  const tint = clamp(
    CFG.ARU.TINT_MIN + glow * CFG.ARU.TINT_GLOW_WEIGHT,
    CFG.ARU.TINT_MIN,
    CFG.ARU.TINT_MAX
  );

  // Gauge glow grows with glow
  const gaugeGlow = Math.round(lerp(CFG.ARU.GAUGE_GLOW_BASE_PX, CFG.ARU.GAUGE_GLOW_MAX_PX, glow));
  const gaugeGlow2 = Math.round(gaugeGlow * 1.65);

  // Background bloom grows with glow
  const bloomA = clamp(CFG.ARU.BLOOM_ALPHA_BASE + glow * CFG.ARU.BLOOM_ALPHA_WEIGHT, 0, 0.90);

  // Resonance -> angle (100%=360deg)
  const angle = (clamp(resPercent, 0, 100) / 100) * 360;

  // Sync vars (overlayRootに付ける：CSS側で参照)
  overlayRoot.style.setProperty("--tb-aru", aruColor);
  overlayRoot.style.setProperty("--tb-glow", String(glow));
  overlayRoot.style.setProperty("--tb-specular", String(specular * 0.9));
  overlayRoot.style.setProperty("--tb-aru-tint", String(tint));
  overlayRoot.style.setProperty("--tb-gauge-glow", `${gaugeGlow}px`);
  overlayRoot.style.setProperty("--tb-gauge-glow2", `${gaugeGlow2}px`);
  overlayRoot.style.setProperty("--tb-bloom-a", String(bloomA));
  overlayRoot.style.setProperty("--tb-res-angle", `${angle}deg`);

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
