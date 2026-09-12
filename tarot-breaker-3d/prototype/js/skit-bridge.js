import { asset, loadJSON } from './config.js?v=p2-1.9.0';

// Reuses the site's skit engine while adapting it to one self-contained 3D memory.
// First view prioritizes immersion; replay adds an explicit SKIP escape hatch.
export class SkitBridge {
  constructor({ host, mount, closeButton, skipButton = null, characters, onClose, onError, source = window.SV_SkitEngine }) {
    this.host = host;
    this.mount = mount;
    this.characters = characters;
    this.source = source;
    this.onClose = onClose;
    this.onError = onError;
    this.session = null;
    this.closeButton = closeButton;
    this.skipButton = skipButton;

    this.closeHandler = () => this.close(false);
    closeButton.addEventListener('click', this.closeHandler);

    this.skipHandler = e => {
      e.preventDefault();
      e.stopPropagation();
      const session = this.session;
      if (session?.replay) this.finishMemory(session, 180);
    };
    skipButton?.addEventListener('click', this.skipHandler);

    this.keyHandler = e => {
      if (!this.session) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.close(false);
      }
      if (e.key === 'Tab') {
        const items = [...host.querySelectorAll('button,[tabindex="0"]')]
          .filter(el => !el.hidden && !el.disabled && el.getClientRects().length);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      if (e.target?.tagName === 'BUTTON' && [' ', 'Enter'].includes(e.key)) e.stopPropagation();
    };
    host.addEventListener('keydown', this.keyHandler, true);
  }

  finishMemory(session = this.session, delay = 420) {
    if (!session || session.closed || session.finishing) return;
    session.finishing = true;
    clearTimeout(session.autoFinishTimer);
    const hint = session.root.querySelector('.sv-hint');
    if (hint) {
      hint.textContent = '記憶の残響がほどけていく——';
      hint.removeAttribute('aria-label');
    }
    session.root.classList.add('sv-memory-complete');
    session.finishTimer = setTimeout(() => this.close(true), delay);
  }

  async open(event, { replay = false } = {}) {
    if (this.session) return;
    if (!this.source) {
      this.onError('会話エンジンを読み込めませんでした。ページを再読み込みしてください。');
      this.onClose(false);
      return;
    }

    const root = document.createElement('div');
    root.className = 'sv-engine-root';
    this.mount.replaceChildren(root);

    const abort = new AbortController();
    const engine = Object.create(this.source);
    engine.config = { ...this.source.config };
    engine._preloadCache = new Map();
    const session = {
      engine,
      root,
      abort,
      replay,
      closed: false,
      loaded: false,
      finishing: false,
      finishTimer: null,
      autoFinishTimer: null
    };
    this.session = session;
    if (this.skipButton) this.skipButton.hidden = !replay;

    engine.fetchSkit = async url => {
      const data = await loadJSON(url, abort.signal);
      if (session.closed) throw new Error('Conversation closed');
      return data;
    };
    engine.resolvePortraitUrl = (character, expression) =>
      asset(`assets/skit/${character.trim().toLowerCase()}/${engine.normalizeExpression(expression)}.png`);

    engine.runByeSequence = () => this.close(false);
    engine.requestNextEpisode = () => this.finishMemory(session);

    const originalAdvance = engine.handleAdvance;
    engine.handleAdvance = function() {
      if (session.closed || session.finishing) return;
      if (this.isEndReached) return this.requestNextEpisode();
      return originalAdvance.call(this);
    };

    const renderDialogue = engine.renderDialogue;
    engine.renderDialogue = function(node) {
      renderDialogue.call(this, node);
      const name = charactersName(node.speaker);
      if (this.nameEl) this.nameEl.textContent = name;
    };
    const charactersName = id => this.characters[id]?.name || id;

    const bridge = this;
    const scheduleAutoFinish = () => {
      clearTimeout(session.autoFinishTimer);
      if (session.closed || session.finishing || !engine.isEndReached || !engine.autoMode) return;
      const wait = Math.max(2200, Number(engine.autoDelay) || 3200);
      session.autoFinishTimer = setTimeout(() => bridge.finishMemory(session), wait);
    };

    const updateEnd = engine.updateEndActions;
    engine.updateEndActions = function() {
      updateEnd.call(this);
      const actions = this.rootEl?.querySelector('.sv-dialogue-actions');
      if (actions) actions.hidden = true;
      if (this.nextBtn) this.nextBtn.hidden = true;
      if (this.byeBtn) this.byeBtn.hidden = true;
      const hint = this.rootEl?.querySelector('.sv-hint');
      if (hint) {
        hint.textContent = '⌄';
        hint.setAttribute('aria-label', this.isEndReached ? 'タップして記憶へ戻る' : 'タップして続きを読む');
      }
      scheduleAutoFinish();
    };

    const toggleAuto = engine.toggleAuto;
    engine.toggleAuto = function() {
      const result = toggleAuto.call(this);
      scheduleAutoFinish();
      return result;
    };

    engine.showError = () => {
      if (session.closed) return;
      this.onError('会話を読み込めませんでした。もう一度お試しください。');
      this.close(false);
    };

    this.host.hidden = false;
    this.closeButton.focus({ preventScroll: true });
    const timer = setTimeout(() => {
      if (!session.loaded && !session.closed) {
        this.onError('記憶の読み込みに時間がかかっています。もう一度お試しください。');
        this.close(false);
      }
    }, 15000);

    try {
      await engine.start({
        rootEl: root,
        skitUrl: asset(event.skitPath),
        userName: 'シオン',
        useStoredName: false,
        returnMode: 'callback',
        onReturn: () => this.close(false),
        onNext: () => this.finishMemory(session)
      });
      session.loaded = true;
      if (!session.closed) engine.dialogueEl?.focus({ preventScroll: true });
    } catch (_) {
      if (!session.closed) engine.showError();
    } finally {
      clearTimeout(timer);
    }
  }

  close(completed = false) {
    const session = this.session;
    if (!session || session.closed) return;
    session.closed = true;
    clearTimeout(session.finishTimer);
    clearTimeout(session.autoFinishTimer);
    session.abort.abort();
    session.engine.stop();
    for (const portrait of session.root.querySelectorAll('.sv-portrait')) {
      portrait.__svSwapToken = (portrait.__svSwapToken || 0) + 1;
      clearTimeout(portrait.__svSwapFallback);
      clearTimeout(portrait.__svMotionTimer);
    }
    session.engine._preloadCache.clear();
    session.engine.rootEl = null;
    session.engine.skit = null;
    session.engine.nodes = {};
    session.engine.currentNode = null;
    this.mount.replaceChildren();
    this.host.hidden = true;
    if (this.skipButton) this.skipButton.hidden = true;
    this.session = null;
    this.onClose(Boolean(completed));
  }

  dispose() {
    this.close(false);
    this.closeButton.removeEventListener('click', this.closeHandler);
    this.skipButton?.removeEventListener('click', this.skipHandler);
    this.host.removeEventListener('keydown', this.keyHandler, true);
  }
}
