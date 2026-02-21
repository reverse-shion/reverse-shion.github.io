// /di/js/result/index.js
import { CFG } from "./config.js";
import { ensureOverlayRoot, ensureShell } from "./dom.js";
import { paintAndAnimate } from "./paint.js";

/**
 * リプレイ押下時：
 * - overlay を先に確実に閉じる
 * - app の cut を解除
 * - そのあと START / RESTART を発火（既存main.jsの流れに乗せる）
 */
function wireReplayOnce(overlayRoot, app, api) {
  const replayBtn = overlayRoot.querySelector("#tbReplayBtn");
  if (!replayBtn || replayBtn.__tbBound) return;

  replayBtn.__tbBound = true;
  replayBtn.addEventListener(
    "click",
    () => {
      // ✅ 先に必ず閉じる（ここが“消えない”対策の要）
      api.hide();

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

export function init(opts = {}) {
  const app = opts.app || document.getElementById("app");

  // ✅ init時点では作らない（＝ページ表示直後に被らない）
  let overlayRoot = null;

  // show/hide を外から使うので api を先に用意
  const api = {
    show(payload = {}) {
      // ✅ 必要になった瞬間に生成
      overlayRoot ||= ensureOverlayRoot();

      // shell（HTML）も必要になった瞬間だけ
      ensureShell(overlayRoot);

      // ボタン配線（api.hide を使うので api を渡す）
      wireReplayOnce(overlayRoot, app, api);

      // 下のゲームレイヤーを切る（あなたの既存方針）
      if (app) app.classList.add(CFG.APP_CUT_CLASS);

      // overlay 表示
      overlayRoot.classList.add(CFG.ROOT_ACTIVE_CLASS);
      overlayRoot.removeAttribute("aria-hidden");

      // 描画更新（ゲージ・色・%アニメ）
      paintAndAnimate(overlayRoot, payload);
    },

    hide() {
      if (!overlayRoot) return;

      // overlay 非表示
      overlayRoot.classList.remove(CFG.ROOT_ACTIVE_CLASS);
      overlayRoot.setAttribute("aria-hidden", "true");

      // 下レイヤー復帰
      if (app) app.classList.remove(CFG.APP_CUT_CLASS);
    },
  };

  return api;
}
