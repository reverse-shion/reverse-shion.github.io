import { asset, loadJSON } from './config.js?v=p2-1.1.0';

// Reuses all dialogue, cast, transitions, choice and log rendering in SV_SkitEngine.
// Each visit owns a derived engine so an old fetch cannot overwrite a new visit.
export class SkitBridge {
  constructor({ host, mount, closeButton, characters, onClose, onError, source = window.SV_SkitEngine }) {
    this.host = host; this.mount = mount; this.characters = characters; this.source = source;
    this.onClose = onClose; this.onError = onError; this.session = null;
    this.closeHandler = () => this.close();
    closeButton.addEventListener('click', this.closeHandler);
    this.closeButton = closeButton;
    this.keyHandler = e => {
      if (!this.session) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); this.close(); }
      if (e.key === 'Tab') {
        const items = [...host.querySelectorAll('button,[tabindex="0"]')].filter(el => !el.hidden && !el.disabled && el.getClientRects().length);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      // Let focused buttons keep native Space/Enter behavior, rather than advancing dialogue.
      if (e.target?.tagName === 'BUTTON' && [' ', 'Enter'].includes(e.key)) e.stopPropagation();
    };
    host.addEventListener('keydown', this.keyHandler, true);
  }
  async open(event) {
    if (this.session) return;
    if (!this.source) { this.onError('会話エンジンを読み込めませんでした。ページを再読み込みしてください。'); this.onClose(false); return; }
    const root = document.createElement('div'); root.className = 'sv-engine-root';
    this.mount.replaceChildren(root);
    const abort = new AbortController();
    const engine = Object.create(this.source);
    engine.config = { ...this.source.config }; engine._preloadCache = new Map();
    const session = { engine, root, abort, closed: false, loaded: false };
    this.session = session;
    engine.fetchSkit = async url => {
      const data = await loadJSON(url, abort.signal);
      if (session.closed) throw new Error('Conversation closed');
      return data;
    };
    engine.resolvePortraitUrl = (character, expression) => asset(`assets/skit/${character.trim().toLowerCase()}/${engine.normalizeExpression(expression)}.png`);
    // The site's generic farewell addresses a visitor. Here the player is Shion:
    // leave directly, without inventing a farewell or making Shion talk to himself.
    engine.runByeSequence = () => this.close();
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
      if (this.nextBtn) { this.nextBtn.textContent = '会話を終える'; this.nextBtn.setAttribute('aria-label', '会話を終える'); }
      if (this.byeBtn) { this.byeBtn.textContent = '星界へ戻る'; this.byeBtn.setAttribute('aria-label', '星界へ戻る'); }
      const hint = this.rootEl?.querySelector('.sv-hint');
      if (hint) hint.textContent = this.isEndReached ? '会話を終えると、同じ場所へ戻ります' : '会話枠をタップして次へ';
    };
    engine.showError = () => {
      if (session.closed) return;
      this.onError('会話を読み込めませんでした。光のそばでもう一度お試しください。');
      this.close(false);
    };
    this.host.hidden = false;
    this.closeButton.focus({ preventScroll: true });
    const timer = setTimeout(() => {
      if (!session.loaded && !session.closed) { this.onError('会話の読み込みに時間がかかっています。もう一度お試しください。'); this.close(false); }
    }, 15000);
    try {
      await engine.start({ rootEl: root, skitUrl: asset(event.skitPath), userName: 'シオン', useStoredName: false,
        returnMode: 'callback', onReturn: () => this.close(), onNext: () => this.close(true) });
      session.loaded = true;
      if (!session.closed) engine.dialogueEl?.focus({ preventScroll: true });
    } catch (_) { if (!session.closed) engine.showError(); }
    finally { clearTimeout(timer); }
  }
  close(completed) {
    const session = this.session;
    if (!session || session.closed) return;
    const done = completed ?? session.engine.isEndReached;
    session.closed = true; session.abort.abort();
    session.engine.stop();
    for (const portrait of session.root.querySelectorAll('.sv-portrait')) {
      portrait.__svSwapToken = (portrait.__svSwapToken || 0) + 1;
      clearTimeout(portrait.__svSwapFallback); clearTimeout(portrait.__svMotionTimer);
    }
    session.engine._preloadCache.clear(); session.engine.rootEl = null;
    session.engine.skit = null; session.engine.nodes = {}; session.engine.currentNode = null;
    this.mount.replaceChildren(); this.host.hidden = true; this.session = null;
    this.onClose(Boolean(done));
  }
  dispose() {
    this.close(false); this.closeButton.removeEventListener('click', this.closeHandler);
    this.host.removeEventListener('keydown', this.keyHandler, true);
  }
}
