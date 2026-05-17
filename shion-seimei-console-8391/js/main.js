(function () {
  const PASSWORD = 'shion-star-console';
  const $ = sel => document.querySelector(sel);
  const state = { chart:null, tarot:[] };
  function inputValue(id) { return document.getElementById(id).value; }
  function getBaseInput() { return { name:inputValue('name').trim(), birthDate:inputValue('birthDate'), gender:inputValue('gender'), topic:inputValue('topic'), memo:inputValue('memo').trim(), spread:Number(inputValue('spread')) }; }
  function showErrors(errors) { $('#messages').innerHTML = errors.map(e => `<p class="error">${ShionUtils.escapeHtml(e)}</p>`).join(''); return errors.length === 0; }
  function updateTarotSlots() {
    const count = Number(inputValue('spread')); const cards = ShionTarotMapping.TAROT_CARDS;
    $('#tarotSlots').innerHTML = Array.from({length:count}, (_, i) => `<div class="tarot-slot"><label>${i+1}枚目：${ShionTarotMapping.SPREAD_POSITIONS[count][i]}<select id="tarot-${i}"><option value="">カードを選択</option>${cards.map(c => `<option value="${c.nameJa}">${c.number}. ${c.nameJa}</option>`).join('')}</select></label><label>正逆<select id="orientation-${i}"><option value="">選択</option><option value="upright">正位置</option><option value="reversed">逆位置</option></select></label></div>`).join('');
  }
  function readTarotEntries() { const count = Number(inputValue('spread')); return Array.from({length:count}, (_, i) => ({ name:inputValue(`tarot-${i}`), orientation:inputValue(`orientation-${i}`) })); }
  function renderAll(includeTarot) {
    if (!state.chart) return;
    const type = state.chart.seimei.baseType; const entries = includeTarot ? state.tarot : [];
    $('#results').innerHTML = ShionUiRender.renderChart(state.chart) + ShionUiRender.renderFiveElements(state.chart.fiveElements) + ShionUiRender.renderTypeCards(type) + ShionUiRender.renderTarot(entries, ShionTarotMapping.SPREAD_POSITIONS[entries.length] || [], ShionTarotMapping.findTarotByName, inputValue('topic')) + ShionUiRender.renderActionAndFinal(type);
  }
  function generateBase() { const input = getBaseInput(); const errors = ShionValidation.validateBaseInput(input); if (!showErrors(errors)) return; state.chart = ShionSanmeiEngine.buildChart(input); state.tarot = []; renderAll(false); $('#finalReading').value = ShionReadingTemplate.generateReading(input, state.chart, []); }
  function generateTarotDraft() { const input = getBaseInput(); const baseErrors = ShionValidation.validateBaseInput(input); const entries = readTarotEntries(); const errors = baseErrors.concat(ShionValidation.validateTarot(entries, input.spread)); if (!showErrors(errors)) return; if (!state.chart) state.chart = ShionSanmeiEngine.buildChart(input); state.tarot = entries; renderAll(true); $('#finalReading').value = ShionReadingTemplate.generateReading(input, state.chart, entries); }
  function polish() { const current = $('#finalReading').value; if (!current.trim()) { showErrors(['先に鑑定文を生成してください。']); return; } $('#finalReading').value = ShionReadingTemplate.polishShionStyle(current); showErrors([]); }
  function resetAll() { document.getElementById('consoleForm').reset(); state.chart = null; state.tarot = []; updateTarotSlots(); $('#results').innerHTML = '<section class="result-card empty"><h2>星命カルテ</h2><p>入力後に「基本カルテ生成」を押すと、ここに結果が表示されます。</p></section>'; $('#finalReading').value = ''; showErrors([]); }
  function demo() { $('#name').value='デモ太郎'; $('#birthDate').value='1984-01-03'; $('#gender').value=''; $('#topic').value='仕事'; $('#memo').value='今後の働き方と金運が不安'; $('#spread').value='3'; updateTarotSlots(); $('#tarot-0').value='塔'; $('#orientation-0').value='upright'; $('#tarot-1').value='節制'; $('#orientation-1').value='upright'; $('#tarot-2').value='星'; $('#orientation-2').value='upright'; showErrors(['デモ入力を反映しました。必要に応じて生成ボタンを押してください。']); }
  function unlock() { if ($('#password').value === PASSWORD) { $('#lockScreen').hidden = true; $('#app').hidden = false; $('#password').value = ''; } else { $('#lockMessage').textContent = 'パスワードが違うようです。内部用ページのため、関係者に確認してください。'; } }
  document.addEventListener('DOMContentLoaded', () => {
    updateTarotSlots(); $('#spread').addEventListener('change', updateTarotSlots); $('#unlock').addEventListener('click', unlock); $('#password').addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });
    $('#generateBase').addEventListener('click', generateBase); $('#generateTarot').addEventListener('click', generateTarotDraft); $('#polish').addEventListener('click', polish); $('#reset').addEventListener('click', resetAll); $('#demo').addEventListener('click', demo);
    $('#copy').addEventListener('click', () => ShionUtils.copyText($('#finalReading').value).then(() => showErrors(['鑑定文をコピーしました。保存はしていません。'])));
  });
})();
