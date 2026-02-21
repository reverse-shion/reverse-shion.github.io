// /di/js/result/index.js
import { CFG } from "./config.js";
import { ensureOverlayRoot, ensureShell } from "./dom.js";
import { paintAndAnimate } from "./paint.js";

/**
 * リプレイ押下時：
 * - overlay を先に確実に閉じる（display:none + pointer-events:none）
 * - app の cut を解除
 * - そのあと START/RESTART を発火
 */
function wireReplayOnce(overlayRoot, api) {
  const replayBtn = overlayRoot.querySelector("#tbReplayBtn");
  if (!replayBtn || replayBtn.__tbBound) return;

  replayBtn.__tbBound = true;
  replayBtn.addEventListener("click", () => {
    api.hide(); // ✅ 先に閉じる

    const startBtn = document.getElementById("startBtn");
    if (startBtn) return startBtn.click();

    const restartBtn = document.getElementById("restartBtn");
    restartBtn?.click?.();
  });
}

export function init(opts = {}) {
  const app = opts.app || document.getElementById("app");
  let overlayRoot = null;

  const api = {
    show(payload = {}) {
      overlayRoot ||= ensureOverlayRoot();
      ensureShell(overlayRoot);
      wireReplayOnce(overlayRoot, api);

      // ✅ まず「触れる」状態に戻す
      overlayRoot.style.display = "block";
      overlayRoot.style.pointerEvents = "auto";
      overlayRoot.removeAttribute("aria-hidden");

      // 下レイヤーを切る
      if (app) app.classList.add(CFG.APP_CUT_CLASS);

      // active
      overlayRoot.classList.add(CFG.ROOT_ACTIVE_CLASS);

      paintAndAnimate(overlayRoot, payload);
    },

    hide() {
      // ✅ overlayが未生成でも cut は必ず解除（B対策）
      if (app) app.classList.remove(CFG.APP_CUT_CLASS);

      if (!overlayRoot) return;

      overlayRoot.classList.remove(CFG.ROOT_ACTIVE_CLASS);
      overlayRoot.setAttribute("aria-hidden", "true");

      // ✅ ここが最重要：透明膜を絶対残さない（A対策）
      overlayRoot.style.pointerEvents = "none";
      overlayRoot.style.display = "none";
    },
  };

  return api;
}
