import { asset, loadJSON } from './config.js?v=p2-1.7.0';

// Reuses the existing dialogue/cast engine, but adapts its exit flow for the 3D memory experience.
// A memory is one self-contained event: read it to the end, tap once more, then return to the world.
export class SkitBridge {
  constructor({ host, mount, closeButton, characters, onClose, onError, source = window.SV_SkitEngine }) {
    this.host = host; this.mount = mount; this.characters = characters; this.source = source;
    this.onClose = onClose; this.onError = onError; this.session = null;
    this.closeHandler = () => this.close(false);
    closeButton.addEventListener('click', this.closeHandler);
    this.closeButton = closeButton;
    this.keyHandler = e => {
      if (!this.session) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); this.close(false); }
      if (e.key === 'Tab') {
        const items = [...host.querySelectorAll('button,[tabindex="0"]')].filter(el => !el.hidden && !el.disabled && el.getClientRects().length);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if (e.target?.tagName === 'BUTTON' && [' ', 'Enter'].includes(e.key)) e.stopPropagation();
    };
    host.addEventListener('keydown', this.keyHandler, true);
  }

  finishMemory(session = this.session) {
    if (!session || session.closed || session.finishing) return;
    session.finishing = true;
    const hint = session.root.querySelector('.sv-hint');
    if (hint) hint.textContent = '記憶を見届けました——';
    session.root.classList.add('sv-memory-complete');
    session.finishTimer = setTimeout(() => this.close(true), 420);
  }

  async open(event) {
    if (this.session) return;
    if (!this.source) { this.onError('会話エンジンを読み込めませんでした。ページを再読み込みしてください。'); this.onClose(false); return; }

    const root = document.createElement('div');
    root.className = 'sv-engine-root';
    this.mount.replaceChildren(root);

    const abort = new AbortController();
    const engine = Object.create(this.source);
    engine.config = { ...this.source.config };
    engine._preloadCache = new Map();
    const session = { engine, root, abort, closed: false, loaded: false, finishing: false, finishTimer: null };
    this.session = session;

    engine.fetchSkit = async url => {
      const data = await loadJSON(url, abort.signal);
      if (session.closed) throw new Error('Conversation closed');
      return data;
    };
    engine.resolvePortraitUrl = (character, expression) => asset(`assets/skit/${character.trim().toLowerCase()}/${engine.normalizeExpression(expression)}.png`);

    // The shared engine is also used by stand-alone skits, where farewell / next-episode
    // buttons make sense. In the 3D memory loop, those controls are replaced by one natural
    // flow: final line -> one more dialogue tap -> return to the same 3D position.
    engine.runByeSequence = () => this.close(false);
    engine.requestNextEpisode = () => this.finishMemory(session);

    const originalAdvance = engine.handleAdvance;
    engine.handleAdvance = function() {
      if (session.closed || session.finishing) return;
      if (this.isEndReached) {
        return this.requestNextEpisode();
      }
      return originalAdvance.call(this);
    };

    const renderDialogue = engine.renderDialogue;
    engine.renderDialogue = function(node) {
      renderDialogue.call(this, node);
      const name = charactersName(node.speaker);
      if (this.nameEl) this.nameEl.textContent = name;
    };
    const charactersName = id => this.characters[id]?.name || id;

    const updateEnd = engine.updateEndActions;
    engine.updateEndActions = function() {
      updateEnd.call(this);
      const actions = this.rootEl?.querySelector('.sv-dialogue-actions');
      if (actions) actions.hidden = true;
      if (this.nextBtn) this.nextBtn.hidden = true;
      if (this.byeBtn) this.byeBtn.hidden = true;
      const hint = this.rootEl?.querySelector('.sv-hint');
      if (hint) {
        hint.textContent = this.isEndReached
          ? '最後の言葉です。もう一度会話枠をタップすると記憶へ戻ります'
          : '会話枠をタップして次へ';
      }
    };

    engine.showError = () => {
      if (session.closed) return;
      this.onError('会話を読み込めませんでした。光のそばでもう一度お試しください。');
      this.close(false);
    };

    this.host.hidden = false;
    this.closeButton.focus({ preventScroll: true });
    const timer = setTimeout(() => {
      if (!session.loaded && !session.closed) {
        this.onError('会話の読み込みに時間がかかっています。もう一度お試しください。');
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
    this.session = null;
    this.onClose(Boolean(completed));
  }

  dispose() {
    this.close(false);
    this.closeButton.removeEventListener('click', this.closeHandler);
    this.host.removeEventListener('keydown', this.keyHandler, true);
  }
}
