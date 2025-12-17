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
    // Scroll Sync (CSS var for "follow scroll")
    // ======================
    _scrollSyncBound: false,
    bindScrollSync() {
      if (this._scrollSyncBound) return;
      this._scrollSyncBound = true;

      const root = document.documentElement;
      const sync = () => {
        root.style.setProperty("--sv-scroll-y", window.scrollY + "px");
      };

      window.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);
      sync();
    },

    // ======================
    // Skit Random (No-Repeat, guaranteed per cycle)
    // ======================
    lastSkitKey: "sv_skit_last_v3",
    playedKey: "sv_skit_played_v3",

    // snapshot per open (prevents pool changing mid-session)
    _sessionPool: null,

    _manifestLoaded: false,
    _skitPool: null,

    // runtime guards
    _isStarting: false,
    _engineRootEl: null,

    // ======================
    // Storage (local -> session -> memory)
    // ======================
    _storageMode: null, // "local" | "session" | "memory"
    _memStore: Object.create(null),

    _getStoreMode() {
      if (this._storageMode) return this._storageMode;

      const test = (store) => {
        try {
          const k = "__sv_store_test__";
          store.setItem(k, "1");
          store.removeItem(k);
          return true;
        } catch {
          return false;
        }
      };

      try {
        if (window.localStorage && test(window.localStorage)) {
          this._storageMode = "local";
          return this._storageMode;
        }
      } catch {}

      try {
        if (window.sessionStorage && test(window.sessionStorage)) {
          this._storageMode = "session";
          return this._storageMode;
        }
      } catch {}

      this._storageMode = "memory";
      return this._storageMode;
    },

    _storeGet(key) {
      const mode = this._getStoreMode();
      try {
        if (mode === "local") return localStorage.getItem(key);
        if (mode === "session") return sessionStorage.getItem(key);
        return Object.prototype.hasOwnProperty.call(this._memStore, key) ? this._memStore[key] : null;
      } catch {
        this._storageMode = "memory";
        return Object.prototype.hasOwnProperty.call(this._memStore, key) ? this._memStore[key] : null;
      }
    },

    _storeSet(key, val) {
      const mode = this._getStoreMode();
      try {
        if (mode === "local") return localStorage.setItem(key, val);
        if (mode === "session") return sessionStorage.setItem(key, val);
        this._memStore[key] = val;
      } catch {
        this._storageMode = "memory";
        this._memStore[key] = val;
      }
    },

    _storeRemove(key) {
      const mode = this._getStoreMode();
      try {
        if (mode === "local") return localStorage.removeItem(key);
        if (mode === "session") return sessionStorage.removeItem(key);
        delete this._memStore[key];
      } catch {
        this._storageMode = "memory";
        delete this._memStore[key];
      }
    },

    _readJSON(key, fallback) {
      try {
        const raw = this._storeGet(key);
        if (!raw) return fallback;
        const v = JSON.parse(raw);
        return v == null ? fallback : v;
      } catch {
        return fallback;
      }
    },

    _writeJSON(key, value) {
      try {
        this._storeSet(key, JSON.stringify(value));
      } catch {}
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

      // ★スクロール追従のためのCSS変数同期
      this.bindScrollSync();

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
      window.ShioponSkit.next = () => this.playNextEpisode();

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
    // Manifest (supports object OR string, and dedupes)
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

        const rawUrls = src
          .map((s) => {
            if (typeof s === "string") return s;
            if (s && typeof s === "object" && typeof s.url === "string") return s.url;
            return "";
          })
          .map((u) => (typeof u === "string" ? u.trim() : ""))
          .filter(Boolean);

        const urls = Array.from(new Set(rawUrls)); // ★dedupe

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
    // Session Pool Snapshot
    // ======================
    async ensureSessionPool() {
      if (Array.isArray(this._sessionPool) && this._sessionPool.length) return this._sessionPool.slice();
      const pool = await this.loadManifest();
      this._sessionPool = pool.slice(); // snapshot at open
      return this._sessionPool.slice();
    },

    // ======================
    // Skit Selection (guaranteed no repeat until pool exhausted)
    // ======================
    async getNextSkitUrl() {
      const pool = await this.ensureSessionPool();
      if (!pool.length) return "/skits/skit_001.json";
      if (pool.length === 1) {
        this._storeSet(this.lastSkitKey, pool[0]);
        this._writeJSON(this.playedKey, [pool[0]]);
        return pool[0];
      }

      const last = String(this._storeGet(this.lastSkitKey) || "");

      let played = this._readJSON(this.playedKey, []);
      played = Array.isArray(played) ? played.filter((u) => typeof u === "string" && u) : [];
      played = played.filter((u) => pool.includes(u));

      let remaining = pool.filter((u) => !played.includes(u));

      if (remaining.length === 0) {
        played = [];
        remaining = pool.slice();
      }

      if (remaining.length > 1 && last && remaining.includes(last)) {
        remaining = remaining.filter((u) => u !== last);
      }

      const next = remaining[Math.floor(Math.random() * remaining.length)] || pool[0];

      played.push(next);
      this._writeJSON(this.playedKey, played);
      this._storeSet(this.lastSkitKey, String(next));

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
      const panel = root.querySelector(".sv-overlay-panel");
      const engineRoot = root.querySelector(".sv-engine-root");

      this._engineRootEl = engineRoot;

      overlay.addEventListener("click", (e) => {
        if (e && e.target && e.target.dataset && e.target.dataset.svClose === "backdrop") {
          this.close();
        }
      });

      root.querySelector(".sv-overlay-close")?.addEventListener("click", () => this.close());

      if (!this._globalKeyBound) {
        this._globalKeyBound = true;
        document.addEventListener("keydown", (e) => this.handleGlobalKey(e));
      }

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

      ["click", "mousemove", "keydown", "touchstart"].forEach((evt) => {
        document.addEventListener(evt, reset, { passive: true });
      });
    },

    // ======================
    // Open / Close / Next
    // ======================
    _getUserName() {
      try {
        return window.ShioponUserName || localStorage.getItem("sv_user_name") || "ゲスト";
      } catch {
        return window.ShioponUserName || "ゲスト";
      }
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

      await this.ensureSessionPool();

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
      if (this._isStarting) return;
      if (!(await this.waitForEngine())) return;

      const root = document.getElementById(this.rootId);
      const overlay = root?.querySelector(`.${this.overlayClass}`);
      const panel = overlay?.querySelector(".sv-overlay-panel");
      const engineRoot = overlay?.querySelector(".sv-engine-root");
      if (!overlay || !panel || !engineRoot) return;

      this._isStarting = true;

      try {
        window.SV_SkitEngine?.stop?.();
      } catch {}

      engineRoot.innerHTML = "";

      const userName = this._getUserName();
      const skitUrl = await this.getNextSkitUrl();

      try {
        await window.SV_SkitEngine.start({
          rootEl: engineRoot,
          skitUrl,
          userName,
          returnMode: "callback",
          onReturn: () => this.close(),
          onNext: () => this.playNextEpisode(),
        });
      } finally {
        try {
          panel.focus({ preventScroll: true });
        } catch {}
        this._isStarting = false;
      }
    },

    close() {
      if (!this.overlayOpen) return;

      const root = document.getElementById(this.rootId);
      const overlay = root?.querySelector(`.${this.overlayClass}`);
      const engineRoot = overlay?.querySelector(".sv-engine-root");
      const panel = overlay?.querySelector(".sv-overlay-panel");

      try {
        window.SV_SkitEngine?.stop?.();
      } catch {}

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
      } catch {}
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
