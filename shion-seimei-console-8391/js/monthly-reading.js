(function (root, factory) {
  let futureScore = root.ShionFutureScore;
  if (typeof require === 'function' && (!futureScore || typeof module !== 'undefined')) {
    try { futureScore = require('./future-score.js'); } catch (error) { futureScore = null; }
  }
  const api = factory(futureScore || {});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionMonthlyReading = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (FutureScore) {
  'use strict';

  function text(value, fallback = '') { return value === null || value === undefined || String(value).trim() === '' ? fallback : String(value).trim(); }
  function compact(value) { return text(value).replace(/\n{3,}/g, '\n\n').trim(); }
  function monthList(items) { return (Array.isArray(items) ? items : []).map((item) => item.label || `${item.month}月`).join('・') || '流れを見ながら調整する月'; }
  function top(scores, fnName, count) { return FutureScore && typeof FutureScore[fnName] === 'function' ? FutureScore[fnName](scores, count) : []; }
  function themeLine(item) { return `${item.label}は「${(item.themes || []).join('・') || '調整'}」がテーマで、${item.note || '小さく整える意識が鍵になります'}。`; }

  function buildYearOverview(input = {}, chart = {}, scores = []) {
    const year = text(input.targetYear, String(new Date().getFullYear()));
    const typeName = chart.seimei && chart.seimei.baseType ? chart.seimei.baseType.name : '星命タイプ';
    const turning = top(scores, 'getTurningPointMonths', 3);
    const themes = Array.from(new Set((scores || []).flatMap((item) => item.themes || []))).slice(0, 4).join('・');
    return `${year}年の総合運は、${typeName}の持つ力を現実の行動へ落とし込む一年です。特に${monthList(turning)}は流れが切り替わりやすく、${themes || '整理・準備・対話'}を意識すると整いやすいです。大きく急ぐより、月ごとの小さな変化を拾うことが鍵になります。`;
  }

  function buildTurningPointReading(scores = []) {
    const months = top(scores, 'getTurningPointMonths', 3);
    if (!months.length) return '転換期は、入力が整ってから月ごとの流れとして確認しやすくなります。';
    return `人生の転換期として見えやすいのは、${monthList(months)}です。\n${months.map(themeLine).join('\n')}\nここは断定的な出来事の月ではなく、体感として「次の選択」が見えやすい時期として扱ってください。`;
  }

  function buildMonthlyReading(scores = []) {
    if (!Array.isArray(scores) || !scores.length) return '月別運勢は、未来スコア生成後に表示されます。';
    return scores.map((item) => `${item.label}：${(item.themes || []).join('・') || '調整'}。${item.note || '小さく整える月です'}（恋愛${item.loveScore}／仕事${item.workScore}／金運${item.moneyScore}／注意${item.cautionScore}）`).join('\n');
  }

  function buildLoveReading(scores = [], input = {}) {
    const months = top(scores, 'getLoveOpportunityMonths', 3);
    const topic = text(input.topic, '総合');
    const extra = topic === '恋愛' ? '出会い、進展、距離感、相手の言葉と行動の一致を丁寧に見てください。' : '恋愛以外の相談でも、人との縁が心を動かしやすい時期です。';
    return `恋愛・出会いが動きやすい月は、${monthList(months)}です。${extra}\n${months.map((item) => `${item.label}は${(item.cards || []).join('・') || '縁の気配'}が重なり、連絡、紹介、対話の温度が変わりやすい月です。`).join('\n')}`;
  }

  function buildWorkMoneyReading(scores = [], input = {}) {
    const months = top(scores, 'getWorkMoneyMonths', 3);
    const topic = text(input.topic, '総合');
    const lead = topic === '金運'
      ? '支出整理、収入の入口、蓄積の仕組みを現実的に見直すと整いやすいです。'
      : '発信、評価、学び、収益導線を小さく形にすると流れが整いやすいです。';
    return `仕事・金運が動きやすい月は、${monthList(months)}です。${lead}\n${months.map((item) => `${item.label}は仕事${item.workScore}・金運${item.moneyScore}の流れが強まりやすく、${(item.themes || [])[0] || '整理'}が鍵になります。`).join('\n')}`;
  }

  function buildCautionReading(scores = []) {
    const months = top(scores, 'getCautionMonths', 3);
    return `注意して整えたい月は、${monthList(months)}です。ここは怖がる月ではなく、確認・休息・言葉の整理を丁寧にしたい時期です。\n${months.map((item) => `${item.label}は${item.note || '確認を優先したい月'}。約束、支出、感情的な返答は一呼吸置くと整いやすいです。`).join('\n')}`;
  }

  function buildLuckyActionReading(scores = [], input = {}) {
    const topic = text(input.topic, '総合');
    const actions = {
      恋愛: ['連絡前に伝えたい本音を一文にする', '相手の行動と言葉を分けて見る', '会う予定は無理のない時間帯にする'],
      仕事: ['発信内容を一つ整える', '評価されたい作業を見える化する', '学びを小さな成果物に変える'],
      金運: ['固定費を一つ見直す', '収入の入口を紙に書く', '使う目的と守る金額を分ける'],
      人間関係: ['返事を急がず一呼吸置く', '誤解しやすい言葉を確認する', '心が楽な距離感を決める'],
      総合: ['月初にテーマを三つ書く', '不安を事実と想像に分ける', '月末にできたことを一つ認める']
    };
    const list = actions[topic] || actions['総合'];
    return `開運アクションは、${list.join('、')}ことです。小さく続けられる形にすると、未来の流れを受け取りやすくなります。`;
  }

  function buildFutureReading(input = {}, chart = {}, tarotEntries = [], scores = []) {
    const tarotNote = Array.isArray(tarotEntries) && tarotEntries.some((entry) => text(entry.name || entry.nameJa))
      ? '選ばれたタロットの象徴も、未来の流れを読む補助線として重ねています。'
      : '今回はタロット未選択です。星命の流れを中心に、未来の動きやすい月を見ています。';
    return compact([
      '今年の総合運', buildYearOverview(input, chart, scores), tarotNote,
      '人生の転換期', buildTurningPointReading(scores),
      '月別運勢', buildMonthlyReading(scores),
      '恋愛・出会い運', buildLoveReading(scores, input),
      '仕事・金運', buildWorkMoneyReading(scores, input),
      '注意すべき時期', buildCautionReading(scores),
      '開運アクション', buildLuckyActionReading(scores, input)
    ].join('\n\n'));
  }

  return { buildFutureReading, buildYearOverview, buildTurningPointReading, buildMonthlyReading, buildLoveReading, buildWorkMoneyReading, buildCautionReading, buildLuckyActionReading };
});
