(function () {
  "use strict";

  const LOADER = {
    // ====== Config ======
    cssId: "sv-skit-style",
    engineUrl: "/js/skitEngine.js",
    manifestUrl: "/skits/manifest.json",

    rootId: "sv-skit",
    overlayClass: "sv-overlay",

    inactivityMs: 30000,
    pulseTimer: null,

    engineReady: false,
    overlayOpen: false,
    lastFocus: null,

    // focus trap
    trapHandler: null,

    // ====== Skit Random (No-Repeat) ======
    skitBagKey: "sv_skit_bag_v2",
    lastSkitKey: "sv_skit_last_v2",

    _manifestLoaded: false,
    _skitPool: null,

    // ======================
    // Init
    // ======================
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

      // 外部イベント
      window.addEventListener("sv:skit:close", () => this.close());
      window.addEventListener("sv:skit:open", () => this.open());

      // 公開API（partials から呼ぶ）
      window.ShioponSkit = window.ShioponSkit || {};
      window.ShioponSkit.open = () => this.open();
      window.ShioponSkit.close = () => this.close();

      // 外部ボタンを監視して bind
      this.bindExternalLaunchButton();
    },

    // ======================
    // CSS
    // ======================
    ensureCss() {
      if (document.getElementById(this.cssId)) return;
      const link = document.createElement("link");
      link.id = this.cssId;
      link.rel = "stylesheet";
      link.href = "/css/shiopon-skit.css";
      document.head.appendChild(link);
    },

    // ======================
    // Engine Loading
    // ======================
    loadEngine() {
      if (window.SV_SkitEngine) {
        this.engineReady = true;
        return;
      }

      const script = document.createElement("script");
      script.src = this.engineUrl;
      script.async = false;
      script.onload = () => (this.engineReady = true);
      script.onerror = () => (this.engineReady = false);
      document.head.appendChild(script);
    },

    waitForEngine(timeoutMs = 5000) {
      if (this.engineReady && window.SV_SkitEngine) return Promise.resolve(true);

      return new Promise((resolve) => {
        const start = Date.now();
        const poll = () => {
          if (window.SV_SkitEngine) {
            this.engineReady = true;
            return resolve(true);
          }
          if (Date.now() - start > timeoutMs) return resolve(false);
          setTimeout(poll, 50);
        };
        poll();
      });
    },

    // ======================
    // Manifest
    // ======================
    async loadManifest() {
      if (this._manifestLoaded && this._skitPool?.length) {
        return this._skitPool.slice();
      }

      try {
        const res = await fetch(this.manifestUrl + "?v=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error("manifest fetch failed");

        const json = await res.json();
        const urls = (json?.skits || [])
          .map((s) => (typeof s?.url === "string" ? s.url.trim() : ""))
          .filter(Boolean);

        if (!urls.length) throw new Error("manifest empty");

        this._skitPool = urls;
        this._manifestLoaded = true;
        return urls.slice();
      } catch (_) {
        this._skitPool = ["/skits/skit_001.json"];
        this._manifestLoaded = true;
        return this._skitPool.slice();
      }
    },

    // ======================
    // Skit Selection
    // ======================
    _readJSON(key, fallback) {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
      } catch {
        return fallback;
      }
    },

    _writeJSON(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },

    _shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    async getNextSkitUrl() {
      const pool = await this.loadManifest();
      const last = String(localStorage.getItem(this.lastSkitKey) || "");

      let bag = this._readJSON(this.skitBagKey, []);
      if (!bag.length) {
        bag = this._shuffle(pool.slice());
        if (bag[0] === last && bag.length > 1) {
          [bag[0], bag[1]] = [bag[1], bag[0]];
        }
      }

      let next = bag.shift();
      if (pool.length >= 2 && next === last) {
        next = bag.find((u) => u !== last) || next;
      }

      this._writeJSON(this.skitBagKey, bag);
      localStorage.setItem(this.lastSkitKey, next);
      return next;
    },

    // ======================
    // DOM Injection（Overlay only）
    // ======================
    injectRoot() {
      const root = document.createElement("div");
      root.id = this.rootId;
      document.body.appendChild(root);

      root.innerHTML = `
        <div class="${this.overlayClass} sv-hidden" aria-hidden="true">
          <div class="sv-overlay-backdrop" data-sv-close="backdrop"></div>
          <div class="sv-overlay-panel" role="dialog" aria-modal="true" tabindex="-1">
            <div class="sv-overlay-header">
              <div class="sv-overlay-title">Skit</div>
              <button class="sv-overlay-close" type="button" aria-label="閉じる">×</button>
            </div>
            <div class="sv-overlay-body">
              <div class="sv-engine-root" aria-live="polite"></div>
            </div>
          </div>
        </div>
      `;

      const overlay = root.querySelector(`.${this.overlayClass}`);

      overlay.addEventListener("click", (e) => {
        if (e.target?.dataset?.svClose === "backdrop") this.close();
      });

      root.querySelector(".sv-overlay-close")?.addEventListener("click", () => this.close());
      document.addEventListener("keydown", (e) => this.handleGlobalKey(e));
    },

    // ======================
    // External Button Bind
    // ======================
    bindExternalLaunchButton() {
      const tryBind = () => {
        const btn = document.getElementById("svTalkBtn");
        if (!btn || btn.dataset.svBound === "1") return false;

        btn.dataset.svBound = "1";
        btn.addEventListener("click", () => this.open());
        this.setupPulse(btn);
        return true;
      };

      if (tryBind()) return;

      const mo = new MutationObserver(() => {
        if (tryBind()) mo.disconnect();
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    },

    // ======================
    // Pulse
    // ======================
    setupPulse(btn) {
      const reset = () => {
        btn.classList.remove("sv-pulse");
        clearTimeout(this.pulseTimer);
        this.pulseTimer = setTimeout(() => btn.classList.add("sv-pulse"), this.inactivityMs);
      };
      reset();
      ["click", "mousemove", "keydown", "touchstart"].forEach((e) =>
        document.addEventListener(e, reset, { passive: true })
      );
    },

    // ======================
    // Open / Close
    // ======================
    async open() {
      if (this.overlayOpen) return;
      if (!(await this.waitForEngine())) return;

      const root = document.getElementById(this.rootId);
      const overlay = root.querySelector(`.${this.overlayClass}`);
      const panel = overlay.querySelector(".sv-overlay-panel");
      const engineRoot = overlay.querySelector(".sv-engine-root");

      this.lastFocus = document.activeElement;

      overlay.classList.remove("sv-hidden");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("sv-skit-lock");
      this.overlayOpen = true;

      engineRoot.innerHTML = "";
      panel.focus({ preventScroll: true });
      this.trapFocus(panel);

      const userName =
        window.ShioponUserName ||
        localStorage.getItem("sv_user_name") ||
        "ゲスト";

      const skitUrl = await this.getNextSkitUrl();

      await window.SV_SkitEngine.start({
        rootEl: engineRoot,
        skitUrl,
        userName,
        returnMode: "callback",
        onReturn: () => this.close(),
      });
    },

    close() {
      if (!this.overlayOpen) return;

      const root = document.getElementById(this.rootId);
      const overlay = root.querySelector(`.${this.overlayClass}`);
      const engineRoot = overlay.querySelector(".sv-engine-root");
      const panel = overlay.querySelector(".sv-overlay-panel");

      window.SV_SkitEngine?.stop?.();
      engineRoot.innerHTML = "";

      overlay.classList.add("sv-hidden");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("sv-skit-lock");
      this.overlayOpen = false;

      this.untrapFocus(panel);
      this.lastFocus?.focus?.({ preventScroll: true });
      this.lastFocus = null;
    },

    // ======================
    // Focus
    // ======================
    handleGlobalKey(e) {
      if (this.overlayOpen && e.key === "Escape") {
        e.preventDefault();
        this.close();
      }
    },

    trapFocus(panel) {
      if (this.trapHandler) return;
      this.trapHandler = (e) => {
        if (e.key !== "Tab") return;
        const f = panel.querySelectorAll(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      panel.addEventListener("keydown", this.trapHandler);
    },

    untrapFocus(panel) {
      panel?.removeEventListener("keydown", this.trapHandler);
      this.trapHandler = null;
    },
  };

  LOADER.init();
})();
