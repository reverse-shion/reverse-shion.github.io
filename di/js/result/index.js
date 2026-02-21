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

// main.js 互換：window.DI_RESULT.init が返す show/hide を提供
export function init(opts) {
  const app = opts?.app || document.getElementById("app");

  // 既存 #result は「使わない」（固定が効かない事故を防ぐ）
  const overlayRoot = ensureOverlayRoot();
  ensureShell(overlayRoot);
  wireReplayOnce(overlayRoot, app);

  return {
    show(payload) {
      ensureShell(overlayRoot);
      wireReplayOnce(overlayRoot, app);

      // app以下を強制非表示（UIのゴミが残らないように）
      if (app) app.classList.add(CFG.APP_CUT_CLASS);

      // overlayを最前面で有効化
      overlayRoot.classList.add(CFG.ROOT_ACTIVE_CLASS);
      overlayRoot.removeAttribute("aria-hidden");

      paintAndAnimate(overlayRoot, payload || {});
    },

    hide() {
      overlayRoot.classList.remove(CFG.ROOT_ACTIVE_CLASS);
      overlayRoot.setAttribute("aria-hidden", "true");
      if (app) app.classList.remove(CFG.APP_CUT_CLASS);
    },
  };
}
