// ============================================================
//  Shiopon Companion v2.0
//  --- BOOTSTRAP MODULE（DOM注入 & 起動）---
// ============================================================

(() => {
  // しおぽんマークアップ（CSSと連動する構造）
  function buildMarkup() {
    return `
      <button id="shiopon-toggle" aria-label="しおぽんを呼ぶ">
        <div class="sp-toggle-layer sp-toggle-shadow"></div>
        <div class="sp-toggle-layer sp-toggle-ear"></div>
        <div class="sp-toggle-layer sp-toggle-base"></div>
        <div class="sp-toggle-layer sp-toggle-eyes"></div>
        <div class="sp-toggle-layer sp-toggle-mouth"></div>
      </button>

      <div id="shiopon-panel" class="sp-hidden" aria-label="しおぽんパネル">
        <div class="sp-panel-inner">
          <div class="sp-avatar-area">
            <div class="sp-avatar">
              <div class="sp-layer sp-shadow"></div>
              <div class="sp-layer sp-ear"></div>
              <div class="sp-layer sp-body"></div>
              <div class="sp-layer sp-face-extra"></div>
              <div class="sp-layer sp-eyes"></div>
              <div class="sp-layer sp-mouth"></div>
            </div>
            <div class="sp-mini">
              <div class="sp-mini-shadow"></div>
              <div class="sp-mini-body"></div>
            </div>
          </div>

          <div class="sp-dialog-area">
            <div class="sp-dialog-bubble">
              <div class="sp-dialog-text" id="shiopon-text"></div>
            </div>
            <div class="sp-dialog-actions">
              <button class="sp-btn" data-sp-action="more">もっと話す</button>
              <button class="sp-btn" data-sp-action="guide">案内して</button>
              <button class="sp-btn ghost" data-sp-action="silent">今日は静かに</button>
            </div>
          </div>

          <button class="sp-close" aria-label="しおぽんをしまう">×</button>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------
  // 初期化
  // ------------------------------------------------------------
  function bootstrapShiopon() {
    // ① ルート要素の取得 or 作成
    let root = document.getElementById("shiopon-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "shiopon-root";
      document.body.appendChild(root);
    }

    // ② マークアップ注入
    root.innerHTML = buildMarkup();

    // ③ 必要なDOM参照
    const panel   = document.getElementById("shiopon-panel");
    const toggle  = document.getElementById("shiopon-toggle");
    const textEl  = document.getElementById("shiopon-text");
    const close   = panel.querySelector(".sp-close");
    const buttons = panel.querySelectorAll(".sp-btn");

    if (!panel || !toggle || !textEl) {
      console.warn("[Shiopon] 必要なDOM要素が足りません");
      return;
    }

    // ④ Visual（見た目・アニメーション）の初期化
    if (window.ShioponVisual && typeof window.ShioponVisual.init === "function") {
      window.ShioponVisual.init();
    } else {
      console.warn("[Shiopon] ShioponVisual が見つかりません（/js/shiopon-visual.js を読み込んでください）");
    }

    // ⑤ Core（セリフ・状態管理）の初期化
    if (window.ShioponCore && typeof window.ShioponCore.init === "function") {
      // Core側に「DOMハンドル一式」を渡す
      window.ShioponCore.init({
        rootEl: root,
        panelEl: panel,
        toggleEl: toggle,
        textEl,
        closeEl: close,
        actionButtons: buttons
      });
    } else {
      console.warn("[Shiopon] ShioponCore が見つかりません（/js/shiopon-core.js を読み込んでください）");
    }
  }

  // ------------------------------------------------------------
  // DOM準備完了で起動
  // ------------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapShiopon);
  } else {
    bootstrapShiopon();
  }
})();
