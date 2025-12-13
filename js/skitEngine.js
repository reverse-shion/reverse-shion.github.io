(function () {
  const Engine = {
    skit: null,
    nodes: {},
    currentNode: null,
    rootEl: null,
    autoTimer: null,
    autoMode: false,
    autoDelay: 3200,
    log: [],
    keyHandler: null,
    waitingChoice: false,

    async start({ rootEl, skitUrl }) {
      this.stop();
      this.rootEl = rootEl;
      this.log = [];
      this.autoMode = false;
      this.waitingChoice = false;
      this.currentNode = null;

      this.rootEl.innerHTML = this.renderShell();
      this.bindStaticElements();

      try {
        const data = await this.fetchSkit(skitUrl);
        this.validate(data);
        this.skit = data;
        this.nodes = data.nodes || {};

        const titleEl = this.rootEl.querySelector('.sv-title');
        if (titleEl) titleEl.textContent = data.meta?.title || 'Skit Window';

        this.autoBtn.setAttribute('aria-pressed', 'false');
        this.gotoNode(data.start);
      } catch (err) {
        this.showError(err?.message || 'スキットの読み込みに失敗しました。');
      }
    },

    stop() {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
      this.autoMode = false;
      this.waitingChoice = false;

      if (this.logPanel) {
        this.logPanel.classList.remove('sv-open');
        this.logPanel.setAttribute('aria-hidden', 'true');
      }

      // key handler cleanup
      if (this.keyHandler && this.rootEl) {
        const panel = this.rootEl.closest('.sv-overlay-panel');
        if (panel) panel.removeEventListener('keydown', this.keyHandler, true);
      }
      this.keyHandler = null;
    },

    renderShell() {
      return `
        <div class="sv-shell">
          <div class="sv-topbar">
            <div class="sv-title">${(this.skit?.meta?.title) || 'Skit Window'}</div>
            <div class="sv-controls">
              <button type="button" class="sv-btn sv-log-btn">ログ</button>
              <button type="button" class="sv-btn sv-auto-btn" aria-pressed="false">Auto</button>
            </div>
          </div>

          <div class="sv-stage" aria-live="polite">
            <div class="sv-slot" data-slot="left">
              <div class="sv-portrait" data-character="" data-motion="none">
                <div class="sv-face" role="img" aria-label=""></div>
              </div>
            </div>

            <div class="sv-slot" data-slot="center">
              <div class="sv-portrait" data-character="" data-motion="none">
                <div class="sv-face" role="img" aria-label=""></div>
              </div>
            </div>

            <div class="sv-slot" data-slot="right">
              <div class="sv-portrait" data-character="" data-motion="none">
                <div class="sv-face" role="img" aria-label=""></div>
              </div>
            </div>
          </div>

          <div class="sv-dialogue" tabindex="0">
            <div class="sv-name">...</div>
            <div class="sv-text">読み込み中...</div>
            <div class="sv-choices" hidden></div>
            <div class="sv-hint">タップ / クリック / Spaceで進む</div>
          </div>

          <div class="sv-log-panel" aria-hidden="true">
            <div class="sv-log-header">
              <div class="sv-log-title">ログ</div>
              <button class="sv-log-close" type="button">閉じる</button>
            </div>
            <div class="sv-log-body"></div>
          </div>
        </div>
      `;
    },

    bindStaticElements() {
      this.dialogueEl = this.rootEl.querySelector('.sv-dialogue');
      this.nameEl = this.rootEl.querySelector('.sv-name');
      this.textEl = this.rootEl.querySelector('.sv-text');
      this.choicesEl = this.rootEl.querySelector('.sv-choices');
      this.logPanel = this.rootEl.querySelector('.sv-log-panel');
      this.logBody = this.rootEl.querySelector('.sv-log-body');
      this.autoBtn = this.rootEl.querySelector('.sv-auto-btn');

      this.dialogueEl.addEventListener('click', () => this.handleAdvance());
      this.autoBtn.addEventListener('click', () => this.toggleAuto());
      this.rootEl.querySelector('.sv-log-btn').addEventListener('click', () => this.toggleLog(true));
      this.rootEl.querySelector('.sv-log-close').addEventListener('click', () => this.toggleLog(false));

      const panel = this.rootEl.closest('.sv-overlay-panel');
      this.keyHandler = (e) => {
        if (!this.rootEl || !this.rootEl.isConnected) return;
        if (this.waitingChoice) return;
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          this.handleAdvance();
        }
      };
      if (panel) panel.addEventListener('keydown', this.keyHandler, true);
    },

    async fetchSkit(url) {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error('スキットデータを取得できませんでした。');
      return res.json();
    },

    validate(data) {
      if (!data || !data.start || !data.nodes) {
        throw new Error('スキットデータが不正です。');
      }
      if (!data.nodes[data.start]) {
        throw new Error('開始ノードが見つかりません。');
      }
    },

    // "calm smile" -> "calm-smile"
    normalizeExpression(expression) {
      return (expression || 'normal')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
    },

    resolvePortraitUrl(character, expression) {
      const c = (character || 'unknown').trim().toLowerCase();
      const e = this.normalizeExpression(expression);
      return `/assets/skit/${c}/${e}.png`;
    },

    gotoNode(id) {
      const node = this.nodes[id];
      if (!node) {
        this.showError('次のシーンが見つかりません。');
        return;
      }
      this.currentNode = node;
      this.waitingChoice = Array.isArray(node.choices) && node.choices.length > 0;
      this.renderNode(node);
      this.scheduleAuto();
    },

    renderNode(node) {
      const castFrames = node.cast || [];
      this.renderCast(castFrames, node);
      this.renderDialogue(node);
    },

    renderCast(castFrames, node) {
      const slots = ['left', 'center', 'right'];
      const slotMap = Object.fromEntries(slots.map((s) => [s, null]));

      castFrames.forEach((frame) => {
        if (!frame?.slot) return;
        slotMap[frame.slot] = frame;
      });

      slots.forEach((slotName) => {
        const slotEl = this.rootEl.querySelector(`.sv-slot[data-slot="${slotName}"]`);
        if (!slotEl) return;

        const portrait = slotEl.querySelector('.sv-portrait');
        const faceEl = slotEl.querySelector('.sv-face');
        const frame = slotMap[slotName];

        if (!frame || frame.visible === false) {
          slotEl.classList.add('sv-hidden');
          slotEl.classList.remove('sv-speaking', 'sv-dimmed');

          if (portrait) {
            portrait.dataset.character = '';
            portrait.dataset.motion = 'none';
          }
          if (faceEl) {
            faceEl.style.backgroundImage = '';
            faceEl.setAttribute('aria-label', '');
          }
          return;
        }

        slotEl.classList.remove('sv-hidden');

        const character = frame.character || '';
        const expression = frame.expression || 'normal';
        const url = this.resolvePortraitUrl(character, expression);

        if (portrait) portrait.dataset.character = character;

        if (faceEl) {
          faceEl.style.backgroundImage = `url("${url}")`;
          faceEl.setAttribute('aria-label', `${character}:${expression}`);
        }

        const speaking = !!(frame.speaking || (frame.character && frame.character === node.speaker));
        slotEl.classList.toggle('sv-speaking', speaking);
        slotEl.classList.toggle('sv-dimmed', !speaking);

        this.applyMotion(portrait, frame.motion);
      });
    },

    applyMotion(portrait, motion) {
      if (!portrait) return;

      portrait.classList.remove('sv-motion-shake', 'sv-motion-zoomIn', 'sv-motion-zoomOut');
      portrait.dataset.motion = 'none';

      if (!motion || motion.type === 'none') return;

      const duration = motion.durationMs || 600;
      portrait.dataset.motion = motion.type;

      if (motion.type === 'shake') portrait.classList.add('sv-motion-shake');
      if (motion.type === 'zoomIn') portrait.classList.add('sv-motion-zoomIn');
      if (motion.type === 'zoomOut') portrait.classList.add('sv-motion-zoomOut');

      clearTimeout(portrait.__svMotionTimer);
      portrait.__svMotionTimer = setTimeout(() => {
        portrait.classList.remove('sv-motion-shake', 'sv-motion-zoomIn', 'sv-motion-zoomOut');
      }, duration);
    },

    renderDialogue(node) {
      this.nameEl.textContent = node.speaker || 'Narration';
      this.textEl.textContent = node.text || '';

      if (!this.waitingChoice) {
        this.choicesEl.hidden = true;
        this.choicesEl.innerHTML = '';
        this.log.push({ speaker: node.speaker || 'Narration', text: node.text || '' });
        this.refreshLog();
      } else {
        this.renderChoices(node.choices);
      }
    },

    renderChoices(choices) {
      this.choicesEl.innerHTML = '';
      this.choicesEl.hidden = false;

      choices.forEach((choice) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sv-choice-btn';
        // accept both schema styles: label / text
        btn.textContent = choice.label ?? choice.text ?? '';
        btn.addEventListener('click', () => {
          this.waitingChoice = false;
          this.choicesEl.hidden = true;
          const next = choice.next;
          if (next) this.gotoNode(next);
        });
        this.choicesEl.appendChild(btn);
      });
    },

    scheduleAuto() {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
      if (!this.autoMode || this.waitingChoice || !this.currentNode?.next) return;
      this.autoTimer = setTimeout(() => this.handleAdvance(), this.autoDelay);
    },

    handleAdvance() {
      if (this.waitingChoice) return;
      if (!this.currentNode) return;
      const nextId = this.currentNode.next;
      if (nextId) this.gotoNode(nextId);
    },

    toggleAuto() {
      this.autoMode = !this.autoMode;
      this.autoBtn.setAttribute('aria-pressed', String(this.autoMode));
      this.scheduleAuto();
    },

    toggleLog(open) {
      const willOpen = open ?? !this.logPanel.classList.contains('sv-open');
      this.logPanel.classList.toggle('sv-open', willOpen);
      this.logPanel.setAttribute('aria-hidden', String(!willOpen));
      if (willOpen) {
        this.logPanel.querySelector('.sv-log-close')?.focus({ preventScroll: true });
      } else {
        this.dialogueEl?.focus({ preventScroll: true });
      }
    },

    refreshLog() {
      this.logBody.innerHTML = '';
      this.log.slice(-50).forEach((entry) => {
        const row = document.createElement('div');
        row.className = 'sv-log-row';
        row.innerHTML = `
          <div class="sv-log-speaker"></div>
          <div class="sv-log-text"></div>
        `;
        row.querySelector('.sv-log-speaker').textContent = entry.speaker;
        row.querySelector('.sv-log-text').textContent = entry.text;
        this.logBody.appendChild(row);
      });
    },

    showError(msg) {
      if (!this.rootEl) return;
      this.rootEl.innerHTML = `
        <div class="sv-shell">
          <div class="sv-dialogue">
            <div class="sv-name">Error</div>
            <div class="sv-text"></div>
          </div>
        </div>
      `;
      const el = this.rootEl.querySelector('.sv-text');
      if (el) el.textContent = msg;
    },
  };

  window.SV_SkitEngine = Engine;
})();
