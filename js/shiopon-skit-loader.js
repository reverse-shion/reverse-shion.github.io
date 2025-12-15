(function () {
  "use strict";

  const LOADER = {
    // ======================
    // Config
    // ======================
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

    // global listeners (avoid double bind)
    _globalKeyBound: false,
    _externalEventsBound: false,
    _nextEventBound: false,

    // ======================
    // Skit Random (No-Repeat)
    // ======================
    // bag = remaining urls to play this cycle
    skitBagKey: "sv_skit_bag_v2",
    lastSkitKey: "sv_skit_last_v2",

    _manifestLoaded: false,
    _skitPool: null,

    // runtime guards
    _isStarting: false,
    _engineRootEl: null,

    // ======================
    // Storage / Memory fallback
    // ======================
    _storageOK: null,
    _memBag: null,
    _memLast: "",

    _canUseStorage() {
      if (this._storageOK !== null) return this._storageOK;
      try {
        const k = "__sv_storage_test__";
        localStorage.setItem(k, "1");
        localStorage.removeItem(k);
        this._storageOK = true;
      } catch {
        this._storageOK = false;
      }
      return this._storageOK;
    },

    // ======================
    // Init
    // ======================
    init() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.setup(), { once: true });
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

      // 外部イベント（open/close）
      if (!this._externalEventsBound) {
        this._externalEventsBound = true;
        window.addEventListener("sv:skit:close", () => this.close());
        window.addEventListener("sv:skit:open", () => this.open());
      }

      // 「次へ」要求イベント（エンジン側が CustomEvent を投げる場合に対応）
      // 例: window.dispatchEvent(new CustomEvent("sv:skit:next"));
      if (!this._nextEventBound) {
        this._nextEventBound = true;
        window.addEventListener("sv:skit:next", () => {
          if (this.overlayOpen) this.playNextEpisode();
        });
      }

      // 公開API（partials から呼ぶ）
      window.ShioponSkit = window.ShioponSkit || {};
      window.ShioponSkit.open = () => this.open();
      window.ShioponSkit.close = () => this.close();
      window.ShioponSkit.next = () => this.playNextEpisode(); // 任意：外から次へ

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
      script.async = false; // keep order
      script.onload = () => (this.engineReady = true);
      script.onerror = () => (this.engineReady = false);
      document.head.appendChild(script);
    },

    waitForEngine(timeoutMs = 8000) {
      if (this.engineReady && window.SV_SkitEngine) return Promise.resolve(true);

      return new Promise((resolve) => {
        const start = Date.now();
        const poll = () => {
          if (window.SV_SkitEngine) {
            this.engineReady = true;
            return resolve(true);
          }
          if (Date.now() - start > timeoutMs) return resolve(false);
          setTimeout(poll, 60);
        };
        poll();
      });
    },

    // ======================
    // Manifest (FIXED: supports object OR string entries)
    // ======================
    async loadManifest() {
      if (this._manifestLoaded && Array.isArray(this._skitPool) && this._skitPool.length) {
        return this._skitPool.slice();
      }

      try {
        const res = await fetch(this.manifestUrl + "?v=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error("manifest fetch failed");

        const json = await res.json();
        const src = json && Array.isArray(json.skits) ? json.skits : [];

        const urls = src
          .map((s) => {
            // supports: [{url:"/skits/a.json"}] or ["/skits/a.json"]
            if (typeof s === "string") return s;
            if (s && typeof s === "object" && typeof s.url === "string") return s.url;
            return "";
          })
          .map((u) => (typeof u === "string" ? u.trim() : ""))
          .filter(Boolean);

        if (!urls.length) throw new Error("manifest empty");

        this._skitPool = urls;
        this._manifestLoaded = true;
        return urls.slice();
      } catch (_) {
        // fallback
        this._skitPool = ["/skits/skit_001.json"];
        this._manifestLoaded = true;
        return this._skitPool.slice();
      }
    },

    // ======================
    // Storage helpers (storage-safe)
    // ======================
    _readJSON(key, fallback) {
      if (!this._canUseStorage()) return fallback;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const v = JSON.parse(raw);
        return v == null ? fallback : v;
      } catch {
        return fallback;
      }
    },

    _writeJSON(key, value) {
      if (!this._canUseStorage()) return;
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // storage failed -> switch to memory mode
        this._storageOK = false;
      }
    },

    _shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    },

    // ======================
    // Skit Selection (No-Repeat until exhausted, with memory fallback)
    // ======================
    async getNextSkitUrl() {
      const pool = await this.loadManifest();
      if (!pool.length) return "/skits/skit_001.json";

      const useStorage = this._canUseStorage();

      const last = useStorage
        ? String(localStorage.getItem(this.lastSkitKey) || "")
        : String(this._memLast || "");

      let bag = useStorage
        ? this._readJSON(this.skitBagKey, [])
        : (Array.isArray(this._memBag) ? this._memBag.slice() : []);

      bag = Array.isArray(bag) ? bag.filter((u) => typeof u === "string" && u) : [];

      // When bag is empty -> refill with shuffled pool
      if (bag.length === 0) {
        bag = this._shuffle(pool.slice());

        // avoid same as last at head if possible
        if (bag.length > 1 && bag[0] === last) {
          const t = bag[0];
          bag[0] = bag[1];
          bag[1] = t;
        }
      }

      // Pick next
      let next = bag.shift();

      // Safety: if still equals last (rare), swap with first different in bag
      if (pool.length > 1 && next === last) {
        const idx = bag.findIndex((u) => u !== last);
        if (idx >= 0) {
          const alt = bag[idx];
          bag[idx] = next;
          next = alt;
        }
      }

      // Persist (storage or memory)
      if (useStorage) {
        this._writeJSON(this.skitBagKey, bag);
        try {
          localStorage.setItem(this.lastSkitKey, next);
        } catch {
          // storage died mid-run -> fall back to memory immediately
          this._storageOK = false;
          this._memBag = bag.slice();
          this._memLast = next || "";
        }
      } else {
        this._memBag = bag.slice();
        this._memLast = next || "";
      }

      return next || pool[0];
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
      const panel = root.querySelector(".sv-overlay-panel");
      const engineRoot = root.querySelector(".sv-engine-root");

      this._engineRootEl = engineRoot;

      overlay.addEventListener("click", (e) => {
        if (e && e.target && e.target.dataset && e.target.dataset.svClose === "backdrop") {
          this.close();
        }
      });

      root.querySelector(".sv-overlay-close")?.addEventListener("click", () => this.close());

      // Global Escape
      if (!this._globalKeyBound) {
        this._globalKeyBound = true;
        document.addEventListener("keydown", (e) => this.handleGlobalKey(e));
      }

      // Ensure focus trap works (panel always exists)
      if (panel) this.untrapFocus(panel);
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

      // passive events where possible
      ["click", "mousemove", "keydown", "touchstart"].forEach((evt) => {
        document.addEventListener(evt, reset, { passive: true });
      });
    },

    // ======================
    // Open / Close / Next
    // ======================
    _getUserName() {
      return window.ShioponUserName || localStorage.getItem("sv_user_name") || "ゲスト";
    },

    async open() {
      if (this.overlayOpen) return;
      if (!(await this.waitForEngine())) return;

      const root = document.getElementById(this.rootId);
      if (!root) return;

      const overlay = root.querySelector(`.${this.overlayClass}`);
      const panel = overlay?.querySelector(".sv-overlay-panel");
      const engineRoot = overlay?.querySelector(".sv-engine-root");
      if (!overlay || !panel || !engineRoot) return;

      this.lastFocus = document.activeElement;

      overlay.classList.remove("sv-hidden");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("sv-skit-lock");
      this.overlayOpen = true;

      engineRoot.innerHTML = "";
      panel.focus({ preventScroll: true });
      this.trapFocus(panel);

      await this.playNextEpisode();
    },

    async playNextEpisode() {
      if (!this.overlayOpen) return;
      if (this._isStarting) return; // guard against double clicks/events
      if (!(await this.waitForEngine())) return;

      const root = document.getElementById(this.rootId);
      const overlay = root?.querySelector(`.${this.overlayClass}`);
      const panel = overlay?.querySelector(".sv-overlay-panel");
      const engineRoot = overlay?.querySelector(".sv-engine-root");
      if (!overlay || !panel || !engineRoot) return;

      this._isStarting = true;

      // stop current skit cleanly
      try {
        window.SV_SkitEngine?.stop?.();
      } catch {
        // ignore
      }

      // clear DOM between episodes (Safari stability)
      engineRoot.innerHTML = "";

      const userName = this._getUserName();
      const skitUrl = await this.getNextSkitUrl();

      try {
        await window.SV_SkitEngine.start({
          rootEl: engineRoot,
          skitUrl,
          userName,

          // keep overlay open by default
          returnMode: "callback",

          // close request (bye button etc.)
          onReturn: () => this.close(),

          // next request (new "next" button etc.)
          onNext: () => this.playNextEpisode(),
        });
      } finally {
        // re-focus panel (keep keyboard nav stable)
        try {
          panel.focus({ preventScroll: true });
        } catch {
          // ignore
        }
        this._isStarting = false;
      }
    },

    close() {
      if (!this.overlayOpen) return;

      const root = document.getElementById(this.rootId);
      const overlay = root?.querySelector(`.${this.overlayClass}`);
      const engineRoot = overlay?.querySelector(".sv-engine-root");
      const panel = overlay?.querySelector(".sv-overlay-panel");

      // stop engine first
      try {
        window.SV_SkitEngine?.stop?.();
      } catch {
        // ignore
      }

      if (engineRoot) engineRoot.innerHTML = "";

      if (overlay) {
        overlay.classList.add("sv-hidden");
        overlay.setAttribute("aria-hidden", "true");
      }
      document.body.classList.remove("sv-skit-lock");
      this.overlayOpen = false;

      this.untrapFocus(panel);

      try {
        this.lastFocus?.focus?.({ preventScroll: true });
      } catch {
        // ignore
      }
      this.lastFocus = null;
      this._isStarting = false;
    },

    // ======================
    // Focus
    // ======================
    handleGlobalKey(e) {
      if (!this.overlayOpen) return;
      if (!e) return;

      if (e.key === "Escape") {
        e.preventDefault();
        this.close();
      }
    },

    trapFocus(panel) {
      if (!panel || this.trapHandler) return;

      this.trapHandler = (e) => {
        if (!e || e.key !== "Tab") return;

        const focusables = panel.querySelectorAll(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

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
      if (!panel || !this.trapHandler) return;
      panel.removeEventListener("keydown", this.trapHandler);
      this.trapHandler = null;
    },
  };

  LOADER.init();
})();
