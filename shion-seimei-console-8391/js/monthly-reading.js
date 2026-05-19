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
  function byMonth(a, b) { return Number(a.month || 0) - Number(b.month || 0); }
  function monthType(item) { return text(item.monthType, '整える月'); }
  function themeLine(item) { return `${item.label}は「${(item.themes || []).join('・') || '調整'}」がテーマで、${item.note || '小さく整える意識が鍵になります'}。`; }
  function joinedThemes(item) { return (item.themes || []).slice(0, 3).join('・') || '整える'; }
  function typeMonths(scores, typeName) { return (scores || []).filter((item) => monthType(item) === typeName).sort(byMonth); }

  function buildYearOverview(input = {}, chart = {}, scores = []) {
    const year = text(input.targetYear, String(new Date().getFullYear()));
    const typeName = chart.seimei && chart.seimei.baseType ? chart.seimei.baseType.name : '星命タイプ';
    const mainTheme = Array.from(new Set((scores || []).flatMap((item) => item.themes || [])))[0] || '整えて進む';
    const strength = text(chart.seimei && chart.seimei.baseType ? chart.seimei.baseType.strength : '', '着実さ');
    const shadow = text(chart.seimei && chart.seimei.baseType ? chart.seimei.baseType.shadow : '', '抱え込みすぎ');
    return `${year}年のあなたは、${typeName}としての${strength}を活かしながら、${mainTheme}を現実に移していく一年です。勢いだけで進むより、${shadow}に傾きそうな場面で立ち止まって整えるほど、止まっていた流れが動き出しやすくなります。朝の光が部屋の隅までゆっくり届くように、今年は視界が少しずつ明るくなる年です。`;
  }

  function buildTurningPointReading(scores = []) {
    const months = top(scores, 'getTurningPointMonths', 3);
    if (!months.length) return '転換期は、入力が整ってから月ごとの流れとして確認しやすくなります。';
    return `人生の転換期として見えやすいのは、${monthList(months)}です。\n${months.map(themeLine).join('\n')}\nここは断定的な出来事の月ではなく、体感として「次の選択」が見えやすい時期として扱ってください。`;
  }

  function buildMonthlyReading(scores = []) {
    if (!Array.isArray(scores) || !scores.length) return '月別運勢は、未来スコア生成後に表示されます。';
    return scores.slice().sort(byMonth).map((item) => `${item.label}｜${monthType(item)}
テーマ：${joinedThemes(item)}
恋愛${item.loveScore}／仕事${item.workScore}／金運${item.moneyScore}／注意${item.cautionScore}
${text(item.themeText, `${item.label}は流れを整える意識が鍵になる月です。`)}
${text(item.cautionText, '勢いで決めるより、確認を挟むほど整いやすくなります。')}
今月の行動：${text(item.monthlyAction, 'できることを一つだけ決めて、小さく動く。')}
この月の合言葉：${text(item.monthlyKeyword, '整えて進む')}。`).join('\n\n');
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
    const turningRank = top(scores, 'getTurningPointMonths', 3);
    const cautionRank = top(scores, 'getCautionMonths', 3);
    const tailwind = typeMonths(scores, '追い風月');
    const cautious = typeMonths(scores, '慎重月');
    const turning = typeMonths(scores, '転換期');
    const yearlyActions = ['完璧を待たず、小さく始める', '不安を頭の中だけで抱えず、短い言葉で外に出す', '収入・予定・人間関係を見える形に整理する', '動く月と休む月を分けて使う', '自分の本音を後回しにしない'];
    return compact([
      '1. 今年の結論',
      buildYearOverview(input, chart, scores),
      tarotNote,
      '2. 今年の運気マップ',
      `追い風月：${monthList(tailwind)}\n慎重月：${monthList(cautious)}\n転換期：${monthList(turning)}\n\n影響が強い順で見ると、転換期は${monthList(turningRank)}です。ただし実際の流れとしては、${monthList(turningRank.slice().sort(byMonth))}の順で体感しやすくなります。\n注意の影響が強い順は${monthList(cautionRank)}ですが、これは怖いサインではなく、確認と見直しを丁寧にすると整いやすい合図です。`,
      '3. スコアの見方',
      '数字は、良い・悪いを決める成績ではありません。そのテーマがどれだけ動きやすいか、意識に上がりやすいか、出来事として表に出やすいかを示す目安です。注意スコアが高い月は怖い月ではなく、確認・見直し・休息を丁寧にしたい月として活かしてください。',
      '4. 月別未来鑑定',
      buildMonthlyReading(scores),
      '5. 恋愛・仕事・金運の流れ',
      buildLoveReading(scores, input),
      buildWorkMoneyReading(scores, input),
      '金運は、一気に増やす発想よりも、収入の入口を増やす工夫と支出整理の両輪で育てるほど安定しやすくなります。',
      '6. 今年やるべきこと',
      yearlyActions.map((line, index) => `${index + 1}. ${line}`).join('\n'),
      '7. この先に待っている未来',
      'この流れを大切にできた場合、年の後半には曖昧だった課題が少しずつ形になりやすくなります。大きな結果を急ぐより、「この方向で進んでいい」と思える確信が育ち、選択に迷う時間が減っていきます。胸の奥の重さが少しずつほどけるように、行動と気持ちがつながりやすくなります。',
      '8. 個人鑑定へのご案内',
      'ここまでで、今年の大きな流れと、動きやすい月・慎重に整えたい月は見えてきました。ただし、恋愛の距離感、仕事の選択、金運の具体策は、今のあなたの状況によって細かく変わります。自分の場合はいつ動くべきか、どの選択が未来につながるかを深く見たい方は、個人鑑定であなたの状況に合わせてカードを展開してください。未来は、知って整えて選び直すことで、少しずつ変えていけます。'
    ].join('\n\n'));
  }

  return { buildFutureReading, buildYearOverview, buildTurningPointReading, buildMonthlyReading, buildLoveReading, buildWorkMoneyReading, buildCautionReading, buildLuckyActionReading };
});
