(function (root, factory) {
  let tarot = root.ShionTarotMapping;
  if (typeof require === 'function' && (!tarot || typeof module !== 'undefined')) tarot = require('./tarot-mapping.js');
  const api = factory(tarot);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionReadingTemplate = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (Tarot) {
  const bannedReplacements = [
    [/絶対に破産します/g, 'お金の流れを整える意識が大切になりやすい時期です'], [/絶対に結婚できません/g, '関係性は急いで決めつけず、対話と行動の一致を見ていくことが大切です'], [/あなたは不幸な宿命です/g, '今は整えるテーマが見えやすい時期です'], [/何をしても無駄です/g, '小さく見直すことで流れが変わりやすくなります'], [/病気になります/g, '心身の不安がある場合は専門家へ相談してください'], [/死にます/g, '命や健康に関する断定はできません'], [/投資すれば必ず儲かります/g, 'お金の判断は専門家への相談とリスク確認が大切です'], [/借金は必ず解決します/g, 'お金の困りごとは公的窓口や専門家に相談しながら整理してください'], [/相手は必ず戻ってきます/g, '相手の気持ちは断定せず、行動と言葉の一致を見てください'], [/この時期に必ず成功します/g, '準備と条件整理が成果につながりやすくなります'], [/必ず/g, '〜につながりやすく'], [/悪い/g, '整える余地がある'], [/失敗/g, '見直しのサイン'], [/金運が弱い/g, 'お金の流れを整える意識が大切']
  ];
  function filterForbidden(text) { return bannedReplacements.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text); }
  function tarotLine(entry, index, positions) { const card = Tarot.findTarotByName(entry.name); if (!card) return ''; const isRev = entry.orientation === 'reversed'; return `${positions[index]}：${card.nameJa}（${isRev ? '逆位置' : '正位置'}）\nキーワード：${(isRev ? card.reversedKeywords : card.uprightKeywords).join('、')}\n読み：${isRev ? card.reversedMeaning : card.uprightMeaning}\n共鳴：${card.seimeiResonanceText}\n行動：${card.actionAdvice}`; }
  function generateReading(input, chart, tarotEntries = []) {
    const name = input.name ? `${input.name}さん` : 'ご相談者さま'; const type = chart.seimei.baseType; const positions = Tarot.SPREAD_POSITIONS[tarotEntries.length] || [];
    const tarotText = tarotEntries.length ? tarotEntries.map((e,i) => tarotLine(e,i,positions)).join('\n\n') : 'タロットは未統合です。必要に応じて共鳴カードを選んでください。';
    const text = `${name}へ\n\n1. 導入\nここまで抱えてきた不安や迷いを、まずは少しだけ横に置いて大丈夫です。この鑑定は、算命学参考データ（簡易・要確認を含む）と詩韻式星命タイプ、タロット共鳴カードを分けて見ながら、今できる現実的な一歩を整えるための下書きです。\n\n2. 生年月日から見た本質\n${input.birthDate}の簡易日柱は${chart.pillars.day.name}（${chart.pillars.day.label}）です。日干${chart.sanmeiReference.dayStem}は、五行${chart.sanmeiReference.element}・${chart.sanmeiReference.yinYang}で、${chart.sanmeiReference.symbol}の象徴を持ちます。本質には「${chart.sanmeiReference.essence}」が出やすく、注意点として「${chart.sanmeiReference.caution}」をやわらかく整えることが大切です。\n\n3. 星命タイプの説明\n詩韻式独自解釈では、基本タイプは「${type.name}」、補助タイプは「${chart.seimei.subType.name}」です。${type.shortTitle}として、${type.essence}を持ちます。${chart.seimei.nuance}\n\n4. 今の悩みに対する見立て\n相談ジャンルは「${input.topic}」です。${input.memo ? `メモには「${input.memo}」とあります。` : '詳しい悩みメモは未入力です。'} ${chart.seimei.topicFocus}\n\n5. タロットからのメッセージ\n${tarotText}\n\n6. 注意点\n${type.shadow}が強く出ると、心が疲れやすくなることがあります。怖がる必要はありません。事実、感情、次の行動を分けると、道しるべが見えやすくなります。\n\n7. 今やるべきこと\n- いま一番気になっていることを一文で書く\n- 今日できる小さな確認を一つ選ぶ\n- 大きな決断は条件を整理してから進める\n\n8. 最後の一言\n${type.message} 焦らなくて大丈夫です。星の言葉は、あなたを縛るものではなく、現実を整えるためのやさしい光です。`;
    return filterForbidden(text);
  }
  function polishShionStyle(text) {
    let polished = filterForbidden(text).replace(/あなたは([^。\n]+)です/g, 'あなたは$1の傾向が出やすいです').replace(/必ず([^。\n]+)/g, '$1につながりやすくなります');
    if (!polished.startsWith('まずは')) polished = `まずは、ここまで向き合ってきたご自身を責めずにいてください。星の言葉を、現実を整える道しるべとして一緒に見ていきます。\n\n${polished}`;
    if (!/今できること/.test(polished)) polished += '\n\n今できること\n- 心配を一つ紙に書き出す\n- 事実と想像を分ける\n- 次の小さな行動を一つだけ決める';
    if (!polished.endsWith('大丈夫だよ。')) polished += '\n\n小さく整えれば、光は戻ってきます。大丈夫だよ。';
    return filterForbidden(polished);
  }
  return { filterForbidden, generateReading, polishShionStyle };
});
