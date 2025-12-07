// ============================================================
//  Shiopon Companion v2.0
//  --- BOOTSTRAP MODULE（DOM注入 & 起動 & イベント結線）---
// ============================================================

(() => {
  "use strict";

  // ------------------------------------------------------------
  // 1. しおぽん用マークアップ（CSS構造と連動）
  // ------------------------------------------------------------
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
  // 2. メイン処理
  // ------------------------------------------------------------
  function bootstrapShiopon() {
    // すでに初期化済みならスキップ（二重起動防止）
    if (document.body.dataset.shioponBootstrapped === "1") return;
    document.body.dataset.shioponBootstrapped = "1";

    // ① ルート要素の取得 or 作成
    let root = document.getElementById("shiopon-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "shiopon-root";
      document.body.appendChild(root);
    }

    // ② マークアップ注入（既存内容は v2 用に差し替え）
    root.innerHTML = buildMarkup();

    // ③ 必要な DOM 参照
    const panel   = document.getElementById("shiopon-panel");
    const toggle  = document.getElementById("shiopon-toggle");
    const textEl  = document.getElementById("shiopon-text");
    const close   = panel ? panel.querySelector(".sp-close") : null;
    const buttons = panel ? panel.querySelectorAll(".sp-btn") : null;

    if (!panel || !toggle || !textEl || !close || !buttons || !buttons.length) {
      console.warn("[Shiopon] 初期化に必要な DOM 要素が足りません。");
      return;
    }

    // ④ Visual（見た目・アニメーション）の初期化
    if (window.ShioponVisual && typeof window.ShioponVisual.init === "function") {
      try {
        window.ShioponVisual.init();
      } catch (e) {
        console.error("[Shiopon] ShioponVisual.init() 実行時にエラー:", e);
      }
    } else {
      console.warn("[Shiopon] ShioponVisual が見つかりません。（/js/shiopon-visual.js を確認）");
    }

    // ⑤ Core（状態管理・セリフ）の初期化
    if (window.ShioponCore && typeof window.ShioponCore.init === "function") {
      try {
        // v2 Core は引数不要：内部で TXT 読み込みのみ行う
        const result = window.ShioponCore.init();
        // init が Promise の場合のみ catch
        if (result && typeof result.then === "function") {
          result.catch((e) => {
            console.error("[Shiopon] ShioponCore.init() 非同期処理でエラー:", e);
          });
        }
      } catch (e) {
        console.error("[Shiopon] ShioponCore.init() 実行時にエラー:", e);
      }
    } else {
      console.warn("[Shiopon] ShioponCore が見つかりません。（/js/shiopon-core.js を確認）");
    }

    // ⑥ サイレント状態の復元（あれば）
    try {
      if (window.ShioponCore && typeof window.ShioponCore.getState === "function") {
        const st = window.ShioponCore.getState();
        if (st && st.silent) {
          root.classList.add("sp-silent");
        }
      }
    } catch (e) {
      console.warn("[Shiopon] サイレント状態の復元に失敗しました:", e);
    }

    // ⑦ イベント結線
    // トグル：開閉
    toggle.addEventListener("click", () => {
      const isVisible = panel.classList.contains("sp-visible");

      if (!window.ShioponCore) {
        // Core が無くても最低限の開閉だけは動かす
        panel.classList.toggle("sp-visible", !isVisible);
        panel.classList.toggle("sp-hidden", isVisible);
        return;
      }

      if (isVisible) {
        if (typeof window.ShioponCore.hidePanel === "function") {
          window.ShioponCore.hidePanel();
        } else {
          panel.classList.remove("sp-visible");
          panel.classList.add("sp-hidden");
        }
      } else {
        if (typeof window.ShioponCore.showPanel === "function") {
          window.ShioponCore.showPanel();
        } else {
          panel.classList.remove("sp-hidden");
          panel.classList.add("sp-visible");
        }
      }
    });

    // 閉じるボタン
    close.addEventListener("click", () => {
      if (window.ShioponCore && typeof window.ShioponCore.hidePanel === "function") {
        window.ShioponCore.hidePanel();
      } else {
        panel.classList.remove("sp-visible");
        panel.classList.add("sp-hidden");
      }
    });

    // 「もっと話す」「案内して」「今日は静かに」
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.spAction;
        if (!action) return;
        if (window.ShioponCore && typeof window.ShioponCore.handleAction === "function") {
          window.ShioponCore.handleAction(action);
        }
      });
    });
  }

  // ------------------------------------------------------------
  // 3. DOM 準備完了で起動
  //    ※ Core / Visual 定義より後に必ず実行されるように調整
  // ------------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapShiopon, { once: true });
  } else {
    // すでに読み込み済みの場合でも、window.onload まで待ってから起動
    window.addEventListener("load", bootstrapShiopon, { once: true });
  }
})();


