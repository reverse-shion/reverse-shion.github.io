(function () {
  "use strict";

  const LOADER = {
    // ====== Config ======
    cssId: "sv-skit-style",
    engineUrl: "/js/skitEngine.js",
    skitUrl: "/skits/skit_001.json",
    rootId: "sv-skit",
    buttonId: "sv-skit-launch",
    overlayClass: "sv-overlay",

    pulseTimer: null,
    inactivityMs: 30000,

    engineReady: false,
    overlayOpen: false,
    lastFocus: null,

    // focus trap
    trapHandler: null,

    init() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.setup());
      } else {
        this.setup();
      }
    },

    setup() {
      // 二重注入防止
      if (document.getElementById(this.rootId)) return;

      this.ensureCss();
      this.injectRoot();
      this.loadEngine();

      // エンジン側からの「閉じて」要求（保険）
      // 例：window.dispatchEvent(new CustomEvent("sv:skit:close"))
      window.addEventListener("sv:skit:close", () => this.close());

      // 例：window.dispatchEvent(new CustomEvent("sv:skit:open"))
      window.addEventListener("sv:skit:open", () => this.open());
    },

    // ====== CSS ======
    ensureCss() {
      if (document.getElementById(this.cssId)) return;
      const link = document.createElement("link");
      link.id = this.cssId;
      link.rel = "stylesheet";
      link.href = "/css/shiopon-skit.css";
      document.head.appendChild(link);
    },

    // ====== Engine Loading ======
    loadEngine() {
      if (window.SV_SkitEngine) {
        this.engineReady = true;
        return;
      }

      const script = document.createElement("script");
      script.src = this.engineUrl;
      script.async = false;
      script.onload = () => {
        this.engineReady = true;
      };
      script.onerror = () => {
        this.engineReady = false;
        // 失敗時はボタンで通知したい場合ここで処理してOK
      };
      document.head.appendChild(script);
    },

    waitForEngine(timeoutMs = 5000) {
      if (this.engineReady && window.SV_SkitEngine) return Promise.resolve(true);

      return new Promise((resolve) => {
        const started = Date.now();
        const poll = () => {
          if (window.SV_SkitEngine) {
            this.engineReady = true;
            return resolve(true);
          }
          if (Date.now() - started > timeoutMs) return resolve(false);
          setTimeout(poll, 50);
        };
        poll();
      });
    },

    // ====== DOM Injection ======
    injectRoot() {
      const root = document.createElement("div");
      root.id = this.rootId;
      root.setAttribute("aria-live", "polite");
      document.body.appendChild(root);

      root.innerHTML = `
        <button id="${this.buttonId}" class="sv-launch-btn" type="button">みんなと話す</button>

        <div class="${this.overlayClass} sv-hidden" aria-hidden="true">
          <div class="sv-overlay-backdrop" data-sv-close="backdrop"></div>

          <div class="sv-overlay-panel" role="dialog" aria-modal="true" tabindex="-1">
            <div class="sv-overlay-header">
              <div class="sv-overlay-title">Skit</div>
              <div class="sv-overlay-actions">
                <button class="sv-overlay-close" type="button" aria-label="閉じる">×</button>
              </div>
            </div>

            <div class="sv-overlay-body">
              <div class="sv-engine-root" aria-live="polite"></div>
            </div>
          </div>
        </div>
      `;

      const btn = root.querySelector(`#${this.buttonId}`);
      btn.addEventListener("click", () => this.open());
      this.setupPulse(btn);

      const overlay = root.querySelector(`.${this.overlayClass}`);

      // 背景クリックで閉じる
      overlay.addEventListener("click", (e) => {
        if (e.target && e.target.dataset && e.target.dataset.svClose === "backdrop") {
          this.close();
        }
      });

      // ×で閉じる
      root.querySelector(".sv-overlay-close")?.addEventListener("click", () => this.close());

      // Escで閉じる
      document.addEventListener("keydown", (e) => this.handleGlobalKey(e));
    },

    // ====== Idle Pulse ======
    setupPulse(btn) {
      const resetPulse = () => {
        btn.classList.remove("sv-pulse");
        clearTimeout(this.pulseTimer);
        this.pulseTimer = setTimeout(() => btn.classList.add("sv-pulse"), this.inactivityMs);
      };

      resetPulse();
      ["click", "touchstart", "mousemove", "keydown"].forEach((evt) => {
        document.addEventListener(evt, resetPulse, { passive: true });
      });
    },

    // ====== Open/Close ======
    async open() {
      if (this.overlayOpen) return;

      const ready = await this.waitForEngine();
      if (!ready) return;

      const root = document.getElementById(this.rootId);
      if (!root) return;

      const overlay = root.querySelector(`.${this.overlayClass}`);
      const panel = overlay?.querySelector(".sv-overlay-panel");
      // open() 内の start 呼び出しをこれに差し替え
const engineRoot = overlay.querySelector('.sv-engine-root');

const userName =
  (window.ShioponUserName && String(window.ShioponUserName).trim()) ||
  (localStorage.getItem("sv_user_name") || "").trim() ||
  "ゲスト";

await window.SV_SkitEngine.start({
  rootEl: engineRoot,
  skitUrl: this.skitUrl,
  userName,
  returnMode: "callback",
  onReturn: () => this.close(),
});

      if (!overlay || !panel || !engineRoot) return;

      this.lastFocus = document.activeElement;

      // 表示
      overlay.classList.remove("sv-hidden");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("sv-skit-lock");
      this.overlayOpen = true;

      // 前回残骸を消す（再openでの重なり防止）
      engineRoot.innerHTML = "";

      // フォーカス
      panel.focus({ preventScroll: true });
      this.trapFocus(panel);

      // ★ここが「またね」連携の本丸
      // Engine側で onReturn() を呼べば、このローダーcloseに帰還する
      await window.SV_SkitEngine.start({
        rootEl: engineRoot,
        skitUrl: this.skitUrl,
        returnMode: "callback",
        onReturn: () => this.close(),
      });
    },

    close() {
      if (!this.overlayOpen) return;

      const root = document.getElementById(this.rootId);
      if (!root) return;

      const overlay = root.querySelector(`.${this.overlayClass}`);
      const engineRoot = overlay?.querySelector(".sv-engine-root");
      const panel = overlay?.querySelector(".sv-overlay-panel");

      if (!overlay) return;

      // エンジン停止（アニメ/タイマー/キー入力など）
      if (window.SV_SkitEngine && typeof window.SV_SkitEngine.stop === "function") {
        window.SV_SkitEngine.stop();
      }

      // 残骸を消す（次回openをクリーンに）
      if (engineRoot) engineRoot.innerHTML = "";

      // 非表示
      overlay.classList.add("sv-hidden");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("sv-skit-lock");
      this.overlayOpen = false;

      // focus trap解除
      this.untrapFocus(panel);

      // フォーカス復帰
      if (this.lastFocus && typeof this.lastFocus.focus === "function") {
        this.lastFocus.focus({ preventScroll: true });
      } else {
        root.querySelector(`#${this.buttonId}`)?.focus({ preventScroll: true });
      }

      this.lastFocus = null;
    },

    // ====== Global Key ======
    handleGlobalKey(e) {
      if (!this.overlayOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        this.close();
      }
    },

    // ====== Focus Trap ======
    trapFocus(panel) {
      if (!panel) return;

      // 二重登録防止
      if (this.trapHandler) return;

      const focusableSelectors =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

      this.trapHandler = (e) => {
        if (e.key !== "Tab") return;
        const focusable = Array.from(panel.querySelectorAll(focusableSelectors)).filter(
          (el) => !el.hasAttribute("disabled")
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      panel.addEventListener("keydown", this.trapHandler);
    },

    untrapFocus(panel) {
      if (!panel || !this.trapHandler) return;
      panel.removeEventListener("keydown", this.trapHandler);
      this.trapHandler = null;
    },
  };

  LOADER.init();
})();
