(function () {
  const LOADER = {
    cssId: 'sv-skit-style',
    engineUrl: '/js/skitEngine.js',
    skitUrl: '/skits/skit_001.json',
    rootId: 'sv-skit',
    buttonId: 'sv-skit-launch',
    overlayClass: 'sv-overlay',
    pulseTimer: null,
    inactivityMs: 30000,
    engineReady: false,
    overlayOpen: false,
    lastFocus: null,
    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    },
    setup() {
      if (document.getElementById(this.rootId)) return;
      this.ensureCss();
      this.injectRoot();
      this.loadEngine();
    },
    ensureCss() {
      if (document.getElementById(this.cssId)) return;
      const link = document.createElement('link');
      link.id = this.cssId;
      link.rel = 'stylesheet';
      link.href = '/css/shiopon-skit.css';
      document.head.appendChild(link);
    },
    loadEngine() {
      if (window.SV_SkitEngine) {
        this.engineReady = true;
        return;
      }
      const script = document.createElement('script');
      script.src = this.engineUrl;
      script.async = false;
      script.onload = () => {
        this.engineReady = true;
      };
      document.head.appendChild(script);
    },

    waitForEngine() {
      if (this.engineReady) return Promise.resolve(true);
      return new Promise((resolve) => {
        const started = Date.now();
        const poll = () => {
          if (this.engineReady) return resolve(true);
          if (Date.now() - started > 3000) return resolve(false);
          setTimeout(poll, 50);
        };
        poll();
      });
    },
    injectRoot() {
      const root = document.createElement('div');
      root.id = this.rootId;
      root.setAttribute('aria-live', 'polite');
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
        </div>`;

      const btn = root.querySelector(`#${this.buttonId}`);
      btn.addEventListener('click', () => this.open());
      this.setupPulse(btn);

      const overlay = root.querySelector(`.${this.overlayClass}`);
      overlay.addEventListener('click', (e) => {
        if (e.target.dataset.svClose === 'backdrop') {
          this.close();
        }
      });

      root.querySelector('.sv-overlay-close').addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => this.handleGlobalKey(e));
    },
    setupPulse(btn) {
      const resetPulse = () => {
        btn.classList.remove('sv-pulse');
        clearTimeout(this.pulseTimer);
        this.pulseTimer = setTimeout(() => btn.classList.add('sv-pulse'), this.inactivityMs);
      };
      resetPulse();
      ['click', 'touchstart', 'mousemove', 'keydown'].forEach((evt) => {
        document.addEventListener(evt, resetPulse, { passive: true });
      });
    },
    async open() {
      if (this.overlayOpen) return;
      const ready = await this.waitForEngine();
      if (!ready) return;
      const root = document.getElementById(this.rootId);
      const overlay = root.querySelector(`.${this.overlayClass}`);
      this.lastFocus = document.activeElement;
      overlay.classList.remove('sv-hidden');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('sv-skit-lock');
      this.overlayOpen = true;
      const panel = overlay.querySelector('.sv-overlay-panel');
      panel.focus({ preventScroll: true });
      this.trapFocus(panel);
      const engineRoot = overlay.querySelector('.sv-engine-root');
      await window.SV_SkitEngine.start({ rootEl: engineRoot, skitUrl: this.skitUrl });
    },
    close() {
      if (!this.overlayOpen) return;
      const root = document.getElementById(this.rootId);
      const overlay = root.querySelector(`.${this.overlayClass}`);
      overlay.classList.add('sv-hidden');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('sv-skit-lock');
      this.overlayOpen = false;
      if (window.SV_SkitEngine && typeof window.SV_SkitEngine.stop === 'function') {
        window.SV_SkitEngine.stop();
      }
      if (this.lastFocus) {
        this.lastFocus.focus({ preventScroll: true });
      } else {
        root.querySelector(`#${this.buttonId}`).focus({ preventScroll: true });
      }
    },
    handleGlobalKey(e) {
      if (!this.overlayOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    },
    trapFocus(panel) {
      const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      panel.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const focusable = Array.from(panel.querySelectorAll(focusableSelectors)).filter((el) => !el.hasAttribute('disabled'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });
    },
  };

  LOADER.init();
})();
