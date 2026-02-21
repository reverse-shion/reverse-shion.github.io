// /di/js/result/index.js
import { CFG } from "./config.js";
import { ensureOverlayRoot, ensureShell } from "./dom.js";
import { paintAndAnimate } from "./paint.js";

function wireReplayOnce(overlayRoot, app) {
  const replayBtn = overlayRoot.querySelector("#tbReplayBtn");
  if (!replayBtn || replayBtn.__tbBound) return;

  replayBtn.__tbBound = true;
  replayBtn.addEventListener(
    "click",
    () => {
      overlayRoot.classList.remove(CFG.ROOT_ACTIVE_CLASS);
      overlayRoot.setAttribute("aria-hidden", "true");
      if (app) app.classList.remove(CFG.APP_CUT_CLASS);

      const startBtn = document.getElementById("startBtn");
      if (startBtn) { startBtn.click(); return; }
      const restartBtn = document.getElementById("restartBtn");
      restartBtn?.click?.();
    },
    { passive: true }
  );
}

export function init(opts) {
  const app = opts?.app || document.getElementById("app");

  // ✅ init時点では作らない（ここがポイント）
  let overlayRoot = null;

  return {
    show(payload) {
      // ✅ 必要になった瞬間に生成
      overlayRoot ||= ensureOverlayRoot();
      ensureShell(overlayRoot);
      wireReplayOnce(overlayRoot, app);

      if (app) app.classList.add(CFG.APP_CUT_CLASS);

      overlayRoot.classList.add(CFG.ROOT_ACTIVE_CLASS);
      overlayRoot.removeAttribute("aria-hidden");

      paintAndAnimate(overlayRoot, payload || {});
    },

    hide() {
      if (!overlayRoot) return;
      overlayRoot.classList.remove(CFG.ROOT_ACTIVE_CLASS);
      overlayRoot.setAttribute("aria-hidden", "true");
      if (app) app.classList.remove(CFG.APP_CUT_CLASS);
    },
  };
}
