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
    unlock: 'unlock',
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
    const trimmed = String(value).trim();
    return trimmed === '' ? fallback : trimmed;
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
    const targetYear =
      window.ShionValidation &&
      typeof window.ShionValidation.normalizeTargetYear === 'function'
        ? window.ShionValidation.normalizeTargetYear(rawValue(SELECTORS.targetYear))
        : Number(rawValue(SELECTORS.targetYear)) || new Date().getFullYear();

    return {
      name: rawValue(SELECTORS.name).trim(),
      birthDate: rawValue(SELECTORS.birthDate),
      gender: rawValue(SELECTORS.gender),
      topic: rawValue(SELECTORS.topic),
      memo: rawValue(SELECTORS.memo).trim(),
      targetYear,
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
    if (
      window.ShionTarot78 &&
      Array.isArray(window.ShionTarot78.TAROT_78_CARDS)
    ) {
      return window.ShionTarot78.TAROT_78_CARDS;
    }

    if (
      window.ShionTarotMapping &&
      Array.isArray(window.ShionTarotMapping.TAROT_CARDS)
    ) {
      return window.ShionTarotMapping.TAROT_CARDS;
    }

    return [];
  }

  function tarotOption(card, selectedValue = '') {
    const nameJa = text(card && card.nameJa);
    if (!nameJa) return '';

    const number = text(card && card.number);
    const label =
      card && card.category === 'major'
        ? `${number}. ${nameJa}`
        : nameJa;

    const selected = selectedValue === nameJa ? ' selected' : '';

    return `<option value="${escapeHtml(nameJa)}"${selected}>${escapeHtml(label)}</option>`;
  }

  function updateTarotSlots() {
    const container = $(SELECTORS.tarotSlots);
    if (!container) return;

    const count = getSpreadCount();
    const cards = getTarotCards();
    const positions = getSpreadPositions(count);

    const previousValues = Array.from({ length: count }, (_, index) =>
      rawValue(`tarot-${index}`)
    );

    container.innerHTML = Array.from({ length: count }, (_, index) => {
      const positionLabel = positions[index] || `${index + 1}枚目`;
      const selectedValue = previousValues[index] || '';

      return `
        <div class="tarot-slot">
          <label for="tarot-${index}">
            ${escapeHtml(index + 1)}枚目：${escapeHtml(positionLabel)}
          </label>
          <select id="tarot-${index}" name="tarot-${index}">
            <option value="">カードを選択</option>
            ${cards.map((card) => tarotOption(card, selectedValue)).join('')}
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
       * 既存の validation / template との互換性を保つため、
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
        <p>
          入力後に「基本カルテを生成」を押すと、ここに星命の芯が表示されます。
        </p>
        <p class="soft-text">
          まずは生年月日から見える心の傾向を確認し、
          必要に応じてタロットと未来鑑定を重ねてください。
        </p>
      </section>
    `;
  }

  function getFindTarotFunction() {
    if (
      window.ShionTarot78 &&
      typeof window.ShionTarot78.getTarot78ByName === 'function'
    ) {
      return window.ShionTarot78.getTarot78ByName;
    }

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

  function buildFuture(input, chart, entries) {
    state.futureScores = window.ShionFutureScore.buildFutureScores(
      input,
      chart,
      entries || [],
      window.ShionTarot78
    );

    state.futureReading = window.ShionMonthlyReading.buildFutureReading(
      input,
      chart,
      entries || [],
      state.futureScores
    );
  }

  function renderAll(includeTarot) {
    const result = $(SELECTORS.results);
    if (!result || !state.chart) return;

    const input =
      state.input && Object.keys(state.input).length
        ? state.input
        : getBaseInput();

    const type =
      state.chart.seimei && state.chart.seimei.baseType
        ? state.chart.seimei.baseType
        : {};

    const entries = includeTarot ? state.tarotEntries : [];
    const positions = getSpreadPositions(entries.length || input.spread || 1);
    const findCard = getFindTarotFunction();

    result.innerHTML =
      window.ShionUiRender.renderChart(state.chart) +
      window.ShionUiRender.renderFiveElements(state.chart.fiveElements || {}) +
      window.ShionUiRender.renderTypeCards(type) +
      window.ShionUiRender.renderFuture(
        state.futureScores,
        state.futureReading,
        window.ShionFutureScore
      ) +
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
    return window.ShionReadingTemplate.generateReading(
      input,
      chart,
      entries,
      state.futureScores,
      state.futureReading
    );
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
        '必要に応じて、タロット共鳴や未来鑑定を重ねてください。'
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
        'カードの本質・影・見直す鍵を、相談内容に合わせて確認してください。'
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
    setValue(SELECTORS.name, 'デモさん');
    setValue(SELECTORS.birthDate, '1984-01-03');
    setValue(SELECTORS.gender, '');
    setValue(SELECTORS.topic, '仕事');
    setValue(SELECTORS.memo, '今後の働き方とお金のことが不安。何から動けばいいか知りたい。');
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

  function copyText(value) {
    const content = text(value);

    if (!content) {
      return Promise.reject(new Error('empty copy text'));
    }

    if (
      window.ShionUtils &&
      typeof window.ShionUtils.copyText === 'function'
    ) {
      return Promise.resolve(window.ShionUtils.copyText(content));
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(content);
    }

    return new Promise((resolve, reject) => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.setAttribute('readonly', 'readonly');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';

        document.body.appendChild(textarea);
        textarea.select();

        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);

        ok ? resolve() : reject(new Error('copy failed'));
      } catch (error) {
        reject(error);
      }
    });
  }

  function copyReading() {
    const reading = getFinalReading();

    if (!reading.trim()) {
      showErrors(['コピーする鑑定文がまだありません。']);
      return;
    }

    copyText(reading).then(
      () => showInfo(['鑑定文をコピーしました。保存はしていません。']),
      () => showErrors(['コピーに失敗しました。手動で選択してコピーしてください。'])
    );
  }

  function copySectionByTarget(targetId) {
    const target = byId(targetId);

    if (!target) {
      showErrors(['コピー対象が見つかりませんでした。']);
      return;
    }

    const value = target.value || target.textContent || '';

    if (!text(value)) {
      showErrors(['コピーできる内容がまだありません。']);
      return;
    }

    copyText(value).then(
      () => showInfo(['セクションをコピーしました。保存はしていません。']),
      () => showErrors(['コピーに失敗しました。手動で選択してください。'])
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
      setFinalReading('');

      showInfo([
        'カード枚数を変更しました。',
        'カードを選び直してから、タロット共鳴を反映してください。'
      ]);
    }
  }

  function handleBaseInputChange() {
    if (!state.chart) return;

    const currentSignature = createInputSignature(getBaseInput());

    if (currentSignature !== state.lastInputSignature) {
      state.input = {};
      state.chart = null;
      state.tarotEntries = [];
      state.futureScores = [];
      state.futureReading = '';
      state.finalReading = '';
      state.lastInputSignature = '';

      renderEmptyResult();
      setFinalReading('');

      showInfo([
        '入力内容が変更されました。',
        '古い鑑定結果とのズレを防ぐため、もう一度カルテを生成してください。'
      ]);
    }
  }

  function bindBaseInputWatchers() {
    [
      SELECTORS.name,
      SELECTORS.birthDate,
      SELECTORS.gender,
      SELECTORS.topic,
      SELECTORS.memo,
      SELECTORS.targetYear
    ].forEach((id) => {
      bind(id, 'change', handleBaseInputChange);
    });
  }

  function initialize() {
    if (!rawValue(SELECTORS.targetYear)) {
      setValue(SELECTORS.targetYear, new Date().getFullYear());
    }

    updateTarotSlots();
    renderEmptyResult();

    bind(SELECTORS.spread, 'change', handleSpreadChange);
    bind(SELECTORS.unlock, 'click', unlock);

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
      const button =
        event.target.closest &&
        event.target.closest('[data-copy-target]');

      if (!button) return;

      const targetId = button.getAttribute('data-copy-target');
      copySectionByTarget(targetId);
    });

    bindBaseInputWatchers();
    requireModules();
  }

  document.addEventListener('DOMContentLoaded', initialize);
})();
