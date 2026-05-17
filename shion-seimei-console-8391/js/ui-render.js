(function (root, factory) {
  const api = factory(root.ShionUtils);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionUiRender = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (Utils) {
  const h = Utils.escapeHtml;
  const statusClass = s => `status status-${s}`;
  function badge(label, status) { return `<span class="${statusClass(status)}">${h(label)}</span>`; }
  function renderChart(chart) {
    const p = chart.pillars, ref = chart.sanmeiReference, type = chart.seimei.baseType;
    return `<section class="result-card"><h2>1. 算命学参考データ</h2><dl class="data-list"><dt>日干</dt><dd>${h(ref.dayStem)}（五行${h(ref.element)}・${h(ref.yinYang)}／${h(ref.symbol)}）</dd><dt>年柱</dt><dd>${h(p.year.name)} ${badge(p.year.label,p.year.status)}</dd><dt>月柱</dt><dd>${h(p.month.name)} ${badge(p.month.label,p.month.status)}</dd><dt>日柱</dt><dd>${h(p.day.name)} ${badge(p.day.label,p.day.status)}</dd></dl></section>
    <section class="result-card"><h2>2. 計算根拠</h2><p><strong>年柱：</strong>${h(p.year.basis)}</p><p><strong>月柱：</strong>${h(p.month.basis)}</p><p><strong>日柱：</strong>${h(p.day.basis)}</p></section>
    <section class="result-card"><h2>3. 詩韻式 星命タイプ</h2><p>${badge('詩韻式独自解釈・簡易判定', 'simplified')}</p><h3>${h(type.name)}</h3><p>${h(type.shortTitle)}</p><p>${h(chart.seimei.basis)}</p><p>補助タイプ：${h(chart.seimei.subType.name)}</p></section>`;
  }
  function renderFiveElements(balance) {
    const max = Math.max(...Object.values(balance.counts), 1);
    const rows = Object.entries(balance.counts).map(([e,v]) => `<div class="bar-row"><span>${h(e)}</span><div class="bar"><i style="width:${(v/max)*100}%"></i></div><b>${v}</b></div>`).join('');
    return `<section class="result-card"><h2>4. 五行バランス</h2>${rows}<p>強い五行：${h(balance.strongest.join('、'))}</p><p>弱い五行：${h(balance.weakest.join('、'))}</p><p>補うとよい五行：${h(balance.supplement.join('、'))}</p><p>${h(balance.note)}</p></section>`;
  }
  function renderTypeCards(type) {
    return `<section class="result-card grid-mini"><article><h2>5. 強み</h2><p>${h(type.strength)}</p></article><article><h2>6. 弱点・注意点</h2><p>${h(type.shadow)}</p></article><article><h2>7. 恋愛傾向</h2><p>${h(type.love)}</p></article><article><h2>8. 仕事傾向</h2><p>${h(type.work)}</p></article><article><h2>9. 金運傾向</h2><p>${h(type.money)}</p></article><article><h2>10. 人間関係の癖</h2><p>${h(type.relationship)}</p></article><article><h2>11. 今の運気テーマ</h2><p>${h(type.advice)}</p></article></section>`;
  }
  function renderTarot(entries, positions, findCard, topic) {
    if (!entries.length) return `<section class="result-card"><h2>12. タロット共鳴メッセージ</h2><p>カードを選ぶと、星命タイプを決めるものではなく、今の状態・課題・行動指針としての共鳴メッセージを表示します。</p></section>`;
    const items = entries.map((e,i) => { const c = findCard(e.name); const rev = e.orientation === 'reversed'; return `<article class="tarot-card"><h3>${h(positions[i])}：${h(c.nameJa)}（${rev ? '逆位置' : '正位置'}）</h3><p>キーワード：${h((rev ? c.reversedKeywords : c.uprightKeywords).join('、'))}</p><p>${h(rev ? c.reversedMeaning : c.uprightMeaning)}</p><p>相談ジャンル「${h(topic)}」に対して：急がず、行動と言葉を現実的に整える視点を持つと読みます。</p><p>${h(c.seimeiResonanceText)}</p><p>行動アドバイス：${h(c.actionAdvice)}</p></article>`; }).join('');
    return `<section class="result-card"><h2>12. タロット共鳴メッセージ</h2>${items}</section>`;
  }
  function renderActionAndFinal(type) { return `<section class="result-card"><h2>13. 今やるべきこと</h2><p>${h(type.advice)}</p></section><section class="result-card"><h2>14. 最後の一言</h2><p>${h(type.message)}</p></section>`; }
  return { renderChart, renderFiveElements, renderTypeCards, renderTarot, renderActionAndFinal };
});
