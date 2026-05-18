(function () {
  'use strict';

  /**
   * 注意：
   * GitHub Pages のような静的サイトでは、フロント側のパスワードは本格的な認証にはなりません。
   * これは「内部用の簡易ロック」として扱ってください。
   * 本格運用では Cloudflare Access などの外部認証で保護するのが理想です。
   */
  const PASSWORD = window.SHION_CONSOLE_PASSWORD || 'shion-star-console';

  const SELECTORS = {
    lockScreen: '#lockScreen',
    app: '#app',
    password: '#password',
    unlock: '#unlock',
    lockMessage: '#lockMessage',

    form: 'consoleForm',
    messages: '#messages',
    results: '#results',
    finalReading: '#finalReading',

    name: 'name',
    birthDate: 'birthDate',
    gender: 'gender',
    topic: 'topic',
    memo: 'memo',
    targetYear: 'targetYear',
    spread: 'spread',
    tarotSlots: '#tarotSlots',

    generateBase: 'generateBase',
    generateTarot: 'generateTarot',
    polish: 'polish',
    reset: 'reset',
    demo: 'demo',
    copy: 'copy'
  };

  const AppState = {
    input: {},
    chart: null,
    tarotEntries: [],
    futureScores: [],
    futureReading: '',
    finalReading: '',
    lastInputSignature: ''
  };

  const state = AppState;
  window.ShionSeimeiAppState = AppState;

  const $ = (selector) => document.querySelector(selector);
  const byId = (id) => document.getElementById(id);

  const escapeHtml =
    window.ShionUtils && typeof window.ShionUtils.escapeHtml === 'function'
      ? window.ShionUtils.escapeHtml
      : function fallbackEscapeHtml(value) {
          return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        };

  function text(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
  }

  function rawValue(id) {
    const el = byId(id);
    return el ? el.value : '';
  }

  function setValue(id, value) {
    const el = byId(id);
    if (el) el.value = value;
  }

  function getBaseInput() {
    return {
      name: rawValue(SELECTORS.name).trim(),
      birthDate: rawValue(SELECTORS.birthDate),
      gender: rawValue(SELECTORS.gender),
      topic: rawValue(SELECTORS.topic),
      memo: rawValue(SELECTORS.memo).trim(),
      targetYear: window.ShionValidation && typeof window.ShionValidation.normalizeTargetYear === 'function'
        ? window.ShionValidation.normalizeTargetYear(rawValue(SELECTORS.targetYear))
        : (Number(rawValue(SELECTORS.targetYear)) || new Date().getFullYear()),
      spread: Number(rawValue(SELECTORS.spread) || 1)
    };
  }

  function createInputSignature(input) {
    return JSON.stringify({
      name: input.name,
      birthDate: input.birthDate,
      gender: input.gender,
      topic: input.topic,
      memo: input.memo,
      targetYear: input.targetYear,
      spread: input.spread
    });
  }

  function showMessages(messages = [], type = 'error') {
    const box = $(SELECTORS.messages);
    if (!box) return messages.length === 0;

    const safeType = type === 'info' ? 'info' : 'error';

    box.innerHTML = messages
      .filter(Boolean)
      .map((message) => `<p class="${safeType}">${escapeHtml(message)}</p>`)
      .join('');

    return messages.length === 0;
  }

  function showErrors(errors = []) {
    return showMessages(errors, 'error');
  }

  function showInfo(messages = []) {
    return showMessages(messages, 'info');
  }

  function clearMessages() {
    showMessages([], 'info');
  }

  function requireModules() {
    const missing = [];

    if (!window.ShionUtils) missing.push('ShionUtils');
    if (!window.ShionValidation) missing.push('ShionValidation');
    if (!window.ShionSanmeiEngine) missing.push('ShionSanmeiEngine');
    if (!window.ShionTarot78) missing.push('ShionTarot78');
    if (!window.ShionTarotMapping) missing.push('ShionTarotMapping');
    if (!window.ShionFutureScore) missing.push('ShionFutureScore');
    if (!window.ShionMonthlyReading) missing.push('ShionMonthlyReading');
    if (!window.ShionUiRender) missing.push('ShionUiRender');
    if (!window.ShionReadingTemplate) missing.push('ShionReadingTemplate');

    if (missing.length) {
      showErrors([
        `必要なJSが読み込まれていません：${missing.join('、')}`,
        'scriptタグの順番、ファイル名、GitHub Pages上のパスを確認してください。'
      ]);
      return false;
    }

    return true;
  }

  function getSpreadCount() {
    const count = Number(rawValue(SELECTORS.spread) || 1);
    return Number.isFinite(count) && count > 0 ? count : 1;
  }

  function getSpreadPositions(count) {
    const positions =
      window.ShionTarotMapping &&
      window.ShionTarotMapping.SPREAD_POSITIONS &&
      window.ShionTarotMapping.SPREAD_POSITIONS[count];

    if (Array.isArray(positions) && positions.length) return positions;

    return Array.from({ length: count }, (_, index) => `${index + 1}枚目`);
  }

  function getTarotCards() {
    if (window.ShionTarot78 && Array.isArray(window.ShionTarot78.TAROT_78_CARDS)) return window.ShionTarot78.TAROT_78_CARDS;
    return window.ShionTarotMapping && Array.isArray(window.ShionTarotMapping.TAROT_CARDS)
      ? window.ShionTarotMapping.TAROT_CARDS
      : [];
  }

  function tarotOption(card) {
    const number = text(card && card.number);
    const nameJa = text(card && card.nameJa);

    if (!nameJa) return '';

    const label = card && card.category === 'major' ? `${number}. ${nameJa}` : nameJa;
    return `<option value="${escapeHtml(nameJa)}">${escapeHtml(label)}</option>`;
  }

  function updateTarotSlots() {
    const container = $(SELECTORS.tarotSlots);
    if (!container) return;

    const count = getSpreadCount();
    const cards = getTarotCards();
    const positions = getSpreadPositions(count);

    container.innerHTML = Array.from({ length: count }, (_, index) => {
      const positionLabel = positions[index] || `${index + 1}枚目`;

      return `
        <div class="tarot-slot">
          <label for="tarot-${index}">
            ${escapeHtml(index + 1)}枚目：${escapeHtml(positionLabel)}
          </label>
          <select id="tarot-${index}" name="tarot-${index}">
            <option value="">カードを選択</option>
            ${cards.map(tarotOption).join('')}
          </select>
        </div>
      `;
    }).join('');

    state.tarotEntries = [];
  }

  function readTarotEntries() {
    const count = getSpreadCount();

    return Array.from({ length: count }, (_, index) => ({
      name: rawValue(`tarot-${index}`),

      /**
       * 詩韻式では逆位置を採用しません。
       * ただし既存の validation / template との互換性を保つため、
       * 内部値としては正位置固定で渡します。
       */
      orientation: 'upright'
    }));
  }

  function validateBaseInput(input) {
    if (
      window.ShionValidation &&
      typeof window.ShionValidation.validateBaseInput === 'function'
    ) {
      return window.ShionValidation.validateBaseInput(input);
    }

    const errors = [];
    if (!input.birthDate) errors.push('生年月日を入力してください。');
    if (!input.topic) errors.push('相談ジャンルを選択してください。');
    if (!input.spread || input.spread < 1) errors.push('カード枚数を選択してください。');
    return errors;
  }

  function validateTarotEntries(entries, spread) {
    if (
      window.ShionValidation &&
      typeof window.ShionValidation.validateTarot === 'function'
    ) {
      return window.ShionValidation.validateTarot(entries, spread);
    }

    const errors = [];

    if (!Array.isArray(entries) || entries.length !== spread) {
      errors.push('カード枚数が一致していません。');
      return errors;
    }

    entries.forEach((entry, index) => {
      if (!text(entry.name)) {
        errors.push(`${index + 1}枚目のカードを選択してください。`);
      }
    });

    return errors;
  }

  function renderEmptyResult() {
    const result = $(SELECTORS.results);
    if (!result) return;

    result.innerHTML = `
      <section class="result-card empty">
        <h2>星命カルテ</h2>
        <p>入力後に「基本カルテ生成」を押すと、ここに結果が表示されます。</p>
      </section>
    `;
  }

  function getFindTarotFunction() {
    if (
      window.ShionTarotMapping &&
      typeof window.ShionTarotMapping.findTarotByName === 'function'
    ) {
      return window.ShionTarotMapping.findTarotByName;
    }

    return function findTarotFallback() {
      return null;
    };
  }

  function buildChart(input) {
    return window.ShionSanmeiEngine.buildChart(input);
  }

  function ensureChart(input) {
    const signature = createInputSignature(input);

    if (!state.chart || state.lastInputSignature !== signature) {
      state.chart = buildChart(input);
      state.lastInputSignature = signature;
    }

    return state.chart;
  }

  function buildFuture(input, chart, entries) {
    state.futureScores = window.ShionFutureScore.buildFutureScores(input, chart, entries || [], window.ShionTarot78);
    state.futureReading = window.ShionMonthlyReading.buildFutureReading(input, chart, entries || [], state.futureScores);
  }

  function renderAll(includeTarot) {
    const result = $(SELECTORS.results);
    if (!result || !state.chart) return;

    const input = state.input && Object.keys(state.input).length ? state.input : getBaseInput();
    const type = state.chart.seimei && state.chart.seimei.baseType
      ? state.chart.seimei.baseType
      : {};

    const entries = includeTarot ? state.tarotEntries : [];
    const positions = getSpreadPositions(entries.length);
    const findCard = getFindTarotFunction();

    result.innerHTML =
      window.ShionUiRender.renderChart(state.chart) +
      window.ShionUiRender.renderFiveElements(state.chart.fiveElements || {}) +
      window.ShionUiRender.renderTypeCards(type) +
      window.ShionUiRender.renderFuture(state.futureScores, state.futureReading, window.ShionFutureScore) +
      window.ShionUiRender.renderTarot(entries, positions, findCard, input.topic) +
      window.ShionUiRender.renderActionAndFinal(type);
  }

  function setFinalReading(textValue) {
    const textarea = $(SELECTORS.finalReading);
    if (textarea) textarea.value = textValue || '';
    state.finalReading = textValue || '';
  }

  function getFinalReading() {
    const textarea = $(SELECTORS.finalReading);
    return textarea ? textarea.value : '';
  }

  function generateReading(input, chart, entries) {
    return window.ShionReadingTemplate.generateReading(input, chart, entries, state.futureScores, state.futureReading);
  }

  function generateBase() {
    try {
      if (!requireModules()) return;

      const input = getBaseInput();
      const errors = validateBaseInput(input);

      if (!showErrors(errors)) return;

      state.input = input;
      state.chart = buildChart(input);
      state.lastInputSignature = createInputSignature(input);
      state.tarotEntries = [];
      buildFuture(input, state.chart, []);

      renderAll(false);
      setFinalReading(generateReading(input, state.chart, []));

      showInfo([
        '基本カルテを生成しました。',
        'ここから必要に応じて、タロット共鳴メッセージを重ねられます。'
      ]);
    } catch (error) {
      console.error(error);
      showErrors([
        '基本カルテ生成中にエラーが起きました。',
        '入力内容、JSファイルの読み込み順、コンソールのエラーを確認してください。'
      ]);
    }
  }

  function generateTarotDraft() {
    try {
      if (!requireModules()) return;

      const input = getBaseInput();
      const baseErrors = validateBaseInput(input);
      const entries = readTarotEntries();
      const tarotErrors = validateTarotEntries(entries, input.spread);
      const errors = baseErrors.concat(tarotErrors);

      if (!showErrors(errors)) return;

      state.input = input;
      state.chart = buildChart(input);
      state.lastInputSignature = createInputSignature(input);
      state.tarotEntries = entries;
      buildFuture(input, state.chart, entries);

      renderAll(true);
      setFinalReading(generateReading(input, state.chart, entries));

      showInfo([
        'タロット共鳴メッセージを反映しました。',
        '詩韻式では逆位置を使わず、すべて正位置の象徴として読みます。',
        'カードの光だけでなく、影・偏り・整える鍵も一緒に見ています。'
      ]);
    } catch (error) {
      console.error(error);
      showErrors([
        'タロット共鳴メッセージ生成中にエラーが起きました。',
        'カード選択、JSファイルの読み込み順、コンソールのエラーを確認してください。'
      ]);
    }
  }

  function polish() {
    try {
      if (!requireModules()) return;

      const current = getFinalReading();

      if (!current.trim()) {
        showErrors(['先に鑑定文を生成してください。']);
        return;
      }

      const polished = window.ShionReadingTemplate.polishShionStyle(current);
      setFinalReading(polished);

      showInfo(['鑑定文を詩韻式の文体で整えました。']);
    } catch (error) {
      console.error(error);
      showErrors(['鑑定文の整え直し中にエラーが起きました。']);
    }
  }

  function resetAll() {
    const form = byId(SELECTORS.form);
    if (form) form.reset();

    state.input = {};
    state.chart = null;
    state.tarotEntries = [];
    state.futureScores = [];
    state.futureReading = '';
    state.finalReading = '';
    state.lastInputSignature = '';
    setValue(SELECTORS.targetYear, new Date().getFullYear());

    updateTarotSlots();
    renderEmptyResult();
    setFinalReading('');
    clearMessages();
  }

  function demo() {
    setValue(SELECTORS.name, 'デモ太郎');
    setValue(SELECTORS.birthDate, '1984-01-03');
    setValue(SELECTORS.gender, '');
    setValue(SELECTORS.topic, '仕事');
    setValue(SELECTORS.memo, '今後の働き方と金運が不安');
    setValue(SELECTORS.targetYear, new Date().getFullYear());
    setValue(SELECTORS.spread, '3');

    updateTarotSlots();

    setValue('tarot-0', '塔');
    setValue('tarot-1', '節制');
    setValue('tarot-2', '星');

    showInfo([
      'デモ入力を反映しました。',
      '詩韻式では逆位置を使わないため、カードはすべて正位置の象徴として読みます。',
      '必要に応じて生成ボタンを押してください。'
    ]);
  }

  function unlock() {
    const password = $(SELECTORS.password);
    const lockScreen = $(SELECTORS.lockScreen);
    const app = $(SELECTORS.app);
    const lockMessage = $(SELECTORS.lockMessage);

    if (!password || !lockScreen || !app) return;

    if (password.value === PASSWORD) {
      lockScreen.hidden = true;
      app.hidden = false;
      password.value = '';

      if (lockMessage) lockMessage.textContent = '';

      setTimeout(() => {
        const firstInput = byId(SELECTORS.name);
        if (firstInput) firstInput.focus();
      }, 0);

      return;
    }

    if (lockMessage) {
      lockMessage.textContent =
        'パスワードが違うようです。内部用ページのため、関係者に確認してください。';
    }
  }

  function copyReading() {
    const reading = getFinalReading();

    if (!reading.trim()) {
      showErrors(['コピーする鑑定文がまだありません。']);
      return;
    }

    const copyFn =
      window.ShionUtils && typeof window.ShionUtils.copyText === 'function'
        ? window.ShionUtils.copyText
        : function fallbackCopyText(value) {
            return navigator.clipboard.writeText(value);
          };

    copyFn(reading).then(
      () => showInfo(['鑑定文をコピーしました。保存はしていません。']),
      () => showErrors(['コピーに失敗しました。手動で選択してコピーしてください。'])
    );
  }

  function bind(id, eventName, handler) {
    const el = byId(id);
    if (el) el.addEventListener(eventName, handler);
  }

  function handleSpreadChange() {
    updateTarotSlots();

    if (state.chart) {
      state.tarotEntries = [];
      renderAll(false);
      showInfo([
        'カード枚数を変更しました。',
        'タロット共鳴メッセージを反映する場合は、カードを選び直してください。'
      ]);
    }
  }

  function handleBaseInputChange() {
    /**
     * 入力が変わった状態で古いチャートやタロット結果が残ると、
     * 表示と鑑定文がズレる可能性があるため、生成済み状態だけ軽く無効化します。
     */
    if (!state.chart) return;

    const currentSignature = createInputSignature(getBaseInput());
    if (currentSignature !== state.lastInputSignature) {
      state.tarotEntries = [];
      renderEmptyResult();
      setFinalReading('');
      showInfo(['入力内容が変更されました。もう一度カルテを生成してください。']);
      state.chart = null;
      state.lastInputSignature = '';
    }
  }

  function bindBaseInputWatchers() {
    [SELECTORS.name, SELECTORS.birthDate, SELECTORS.gender, SELECTORS.topic, SELECTORS.memo, SELECTORS.targetYear].forEach(
      (id) => {
        bind(id, 'change', handleBaseInputChange);
      }
    );
  }

  function initialize() {
    if (!rawValue(SELECTORS.targetYear)) setValue(SELECTORS.targetYear, new Date().getFullYear());
    updateTarotSlots();
    renderEmptyResult();

    bind(SELECTORS.spread, 'change', handleSpreadChange);
    bind(SELECTORS.unlock.replace('#', ''), 'click', unlock);

    const password = $(SELECTORS.password);
    if (password) {
      password.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') unlock();
      });
    }

    bind(SELECTORS.generateBase, 'click', generateBase);
    bind(SELECTORS.generateTarot, 'click', generateTarotDraft);
    bind(SELECTORS.polish, 'click', polish);
    bind(SELECTORS.reset, 'click', resetAll);
    bind(SELECTORS.demo, 'click', demo);
    bind(SELECTORS.copy, 'click', copyReading);
    document.addEventListener('click', (event) => {
      const button = event.target.closest && event.target.closest('[data-copy-target]');
      if (!button) return;
      const target = byId(button.getAttribute('data-copy-target'));
      const value = target ? (target.value || target.textContent || '') : '';
      const copyFn = window.ShionUtils && typeof window.ShionUtils.copyText === 'function' ? window.ShionUtils.copyText : (v) => navigator.clipboard.writeText(v);
      copyFn(value).then(() => showInfo(['セクションをコピーしました。保存はしていません。']), () => showErrors(['コピーに失敗しました。手動で選択してください。']));
    });

    bindBaseInputWatchers();

    requireModules();
  }

  document.addEventListener('DOMContentLoaded', initialize);
})();
