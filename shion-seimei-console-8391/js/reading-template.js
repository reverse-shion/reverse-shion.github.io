(function (root, factory) {
  let tarot = root.ShionTarotMapping;
  let tarot78 = root.ShionTarot78;
  let monthly = root.ShionMonthlyReading;

  if (typeof require === 'function' && (!tarot || typeof module !== 'undefined')) {
    try {
      tarot = require('./tarot-mapping.js');
    } catch (error) {
      tarot = null;
    }
  }

  if (typeof require === 'function' && (!tarot78 || typeof module !== 'undefined')) {
    try {
      tarot78 = require('./tarot-78.js');
    } catch (error) {
      tarot78 = null;
    }
  }

  if (typeof require === 'function' && (!monthly || typeof module !== 'undefined')) {
    try {
      monthly = require('./monthly-reading.js');
    } catch (error) {
      monthly = null;
    }
  }

  const api = factory(tarot || {}, tarot78 || {}, monthly || {});

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionReadingTemplate = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (Tarot, Tarot78, MonthlyReading) {
  'use strict';

  const bannedReplacements = [
    [/絶対に破産します/g, 'お金の流れを見直す必要が出やすい時期です'],
    [/絶対に結婚できません/g, '関係性は急いで決めつけず、対話と行動の一致を見ていくことが大切です'],
    [/あなたは不幸な宿命です/g, '今は向き合うテーマが見えやすい時期です'],
    [/何をしても無駄です/g, '見方や行動を変えることで、状況が動きやすくなります'],
    [/病気になります/g, '心身の不安がある場合は、専門家へ相談してください'],
    [/死にます/g, '命や健康に関する断定はできません'],
    [/投資すれば必ず儲かります/g, 'お金の判断は、専門家への相談とリスク確認が大切です'],
    [/借金は必ず解決します/g, 'お金の困りごとは、公的窓口や専門家に相談しながら整理してください'],
    [/相手は必ず戻ってきます/g, '相手の気持ちは断定せず、言葉と行動の一致を見てください'],
    [/この時期に必ず成功します/g, '準備と条件が重なることで、成果につながりやすくなります'],
    [/悪い運命/g, '向き合うテーマ'],
    [/金運が弱い/g, 'お金の扱い方を見直す意識が大切'],
    [/失敗する/g, '見直しが必要になりやすい']
  ];

  const DEFAULT_POSITIONS = {
    1: ['今のメッセージ'],
    2: ['今の流れ', '見直す鍵'],
    3: ['今の流れ', '心の奥', '進む道'],
    4: ['現状', '心の奥', '課題', '未来への一歩'],
    5: ['現状', '心の奥', '課題', '助けになる力', '未来への一歩']
  };

  const TAROT_NAME_ALIASES = {
    fool: '愚者',
    magician: '魔術師',
    highpriestess: '女教皇',
    highpriestesss: '女教皇',
    empress: '女帝',
    emperor: '皇帝',
    hierophant: '教皇',
    lovers: '恋人',
    chariot: '戦車',
    strength: '力',
    hermit: '隠者',
    wheeloffortune: '運命の輪',
    justice: '正義',
    hangedman: '吊るされた男',
    death: '死神',
    temperance: '節制',
    devil: '悪魔',
    tower: '塔',
    star: '星',
    moon: '月',
    sun: '太陽',
    judgement: '審判',
    judgment: '審判',
    world: '世界'
  };

  function safeText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    const trimmed = String(value).trim();
    return trimmed === '' ? fallback : trimmed;
  }

  function compact(value) {
    return safeText(value)
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .trim();
  }

  function filterForbidden(value) {
    let result = safeText(value);

    bannedReplacements.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, replacement);
    });

    return result;
  }

  function normalizeCardKey(name) {
    const raw = safeText(name);

    const cleaned = raw
      .replace(/正位置|逆位置|upright|reversed/gi, '')
      .replace(/\bthe\b/gi, '')
      .replace(/[ 　]/g, '')
      .replace(/^[0-9０-９]+[.．、:：\-_/]*/g, '')
      .replace(/^[IVXLCDMⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ]+[.．、:：\-_/]*/gi, '')
      .replace(/[・.．、:：\-_/]/g, '')
      .toLowerCase()
      .trim();

    if (TAROT_NAME_ALIASES[cleaned]) return TAROT_NAME_ALIASES[cleaned];

    return raw;
  }

  function getPositions(count) {
    if (Tarot && Tarot.SPREAD_POSITIONS && Tarot.SPREAD_POSITIONS[count]) {
      return Tarot.SPREAD_POSITIONS[count];
    }

    return DEFAULT_POSITIONS[count] || DEFAULT_POSITIONS[3];
  }

  function findTarotFrom78(name) {
    if (!Tarot78 || typeof Tarot78.getTarot78ByName !== 'function') return null;

    const direct = Tarot78.getTarot78ByName(name);
    if (direct) return direct;

    const normalized = normalizeCardKey(name);
    const normalizedCard = Tarot78.getTarot78ByName(normalized);
    if (normalizedCard) return normalizedCard;

    return null;
  }

  function findTarotFromMapping(name) {
    if (!Tarot || typeof Tarot.findTarotByName !== 'function') return null;

    const direct = Tarot.findTarotByName(name);
    if (direct) return direct;

    const normalized = normalizeCardKey(name);
    const normalizedCard = Tarot.findTarotByName(normalized);
    if (normalizedCard) return normalizedCard;

    return null;
  }

  function findTarot(entryName) {
    const name = safeText(entryName);
    if (!name) return null;

    return findTarotFrom78(name) || findTarotFromMapping(name);
  }

  function getTarotInsight(card, entryName) {
    const name = safeText(card && card.nameJa, entryName || 'このカード');
    const keywords = Array.isArray(card && card.keywords) ? card.keywords.filter(Boolean) : [];
    const suit = safeText(card && card.suit);

    const suitMessage = {
      cups: '感情や思い出、心の距離感を見直す時に出やすいカードです。',
      wands: '行動、熱意、外へ出す力が問われている時に出やすいカードです。',
      swords: '考え方、言葉、判断を見直す時に出やすいカードです。',
      pentacles: '仕事、お金、生活の安定を現実的に見直す時に出やすいカードです。'
    };

    if (card) {
      return {
        essence:
          safeText(card.uprightMeaning) ||
          `${name}は、${keywords.length ? keywords.join('、') : '今のテーマ'}を通して、現実の中で何を大切にするかを見せてくれるカードです。`,

        shadow:
          safeText(card.shadow) ||
          safeText(card.caution) ||
          'その象徴が強く出すぎると、気持ちや行動が少し偏りやすくなります。',

        adjustment:
          safeText(card.adjustment) ||
          safeText(card.caution) ||
          '良い・悪いで決めつけず、今の自分にとって必要な見直しを一つだけ選んでください。',

        humanMessage:
          safeText(card.humanMessage) ||
          safeText(card.light) ||
          suitMessage[suit] ||
          `${name}は、今の状況を落ち着いて見直すための補助線として出ています。焦らず、できることから見ていきましょう。`,

        action:
          safeText(card.actionAdvice) ||
          '今いちばん気になることを一つだけ書き出し、今日できる行動を選んでください。'
      };
    }

    return {
      essence: 'このカードは、今の心の状態を映し、現実を見るための象徴として現れています。',
      shadow: '象徴の力が強く出すぎると、気持ちや行動に偏りが生まれることがあります。',
      adjustment: '良い・悪いで決めつけず、今どこを見直すと自分らしさに戻れるのかを見てください。',
      humanMessage: 'カードは未来を縛るものではありません。今の心が見落としていた声に気づくためのものです。',
      action: '今いちばん気になることを一つだけ書き出し、今日できる行動を選んでください。'
    };
  }

  function getTypeValue(type, key, fallback = '') {
    if (!type) return fallback;
    if (safeText(type[key])) return type[key];
    if (type.readingBlocks && safeText(type.readingBlocks[key])) return type.readingBlocks[key];
    return fallback;
  }

  function getTopicText(type, chart, topic) {
    const topicKey = safeText(topic, '総合');

    if (type && type.templateByTopic && type.templateByTopic[topicKey]) {
      return type.templateByTopic[topicKey];
    }

    if (chart && chart.seimei && chart.seimei.topicFocus) {
      return chart.seimei.topicFocus;
    }

    if (topicKey === '恋愛') {
      return '恋愛では、相手の気持ちを追いかけすぎると、自分の心が置き去りになりやすい時です。相手の言葉だけでなく、行動が伴っているかを見てください。';
    }

    if (topicKey === '仕事') {
      return '仕事では、頑張る量を増やすより、どこに力を使うかを選ぶことが大切です。抱えすぎているものを分けると、次の動きが見えやすくなります。';
    }

    if (topicKey === '金運') {
      return '金運では、一気に増やす発想より、守るお金と動かすお金を分けることが大切です。不安を責めず、見える形にするところから始めてください。';
    }

    if (topicKey === '人間関係') {
      return '人間関係では、相手に合わせることと、自分を大切にすることの両方が必要です。無理なく続く距離感を選んでください。';
    }

    if (topicKey === '今月の運勢') {
      return '今月は、全部を完璧にしようとするより、まず一つだけ優先順位を決めることが大切です。今の自分に合うペースを取り戻していきましょう。';
    }

    return '今は、気持ち・状況・次にできる行動を分けて見つめることで、現実を判断しやすくなる時です。';
  }

  function formatMemo(input) {
    const memo = safeText(input && input.memo);

    if (!memo) {
      return '詳しい悩みメモは未入力です。今回は、生年月日から見える星命の傾向を中心に、今のあなたに合う進み方を見ていきます。';
    }

    return compact(
`メモには「${memo}」とあります。

この言葉から、あなたが今どこで迷っていて、何を大切にしたいのかが伝わってきます。
悩みは、弱さではありません。
本当は守りたいものがあるから、人は迷います。`
    );
  }

  function tarotLine(entry, index, positions) {
    if (!entry || !safeText(entry.name || entry.nameJa)) return '';

    const selectedName = safeText(entry.name || entry.nameJa);
    const card = findTarot(selectedName);
    const position = positions[index] || `カード${index + 1}`;
    const displayName = card && card.nameJa ? card.nameJa : normalizeCardKey(selectedName);
    const insight = getTarotInsight(card, displayName);

    const keywords = card && Array.isArray(card.uprightKeywords)
      ? card.uprightKeywords.filter(Boolean)
      : card && Array.isArray(card.keywords)
        ? card.keywords.filter(Boolean)
        : [];

    const mappingMeaning = card && safeText(card.uprightMeaning) ? card.uprightMeaning : '';
    const resonance = card && safeText(card.seimeiResonanceText)
      ? card.seimeiResonanceText
      : 'このカードは、星命の性質を今の現実へ落とし込むための補助線になります。';

    const actionAdvice = card && safeText(card.actionAdvice)
      ? card.actionAdvice
      : insight.action;

    return compact(
`${position}：${displayName}

象徴：
${keywords.length ? keywords.join('、') : insight.essence}

本質：
${insight.essence}

${mappingMeaning && mappingMeaning !== insight.essence ? `補助解釈：\n${mappingMeaning}\n\n` : ''}影として出やすいこと：
${insight.shadow}

見直すポイント：
${insight.adjustment}

心への言葉：
${insight.humanMessage}

星命との共鳴：
${resonance}

今できる行動：
${actionAdvice}`
    );
  }

  function buildTarotText(tarotEntries) {
    const entries = Array.isArray(tarotEntries)
      ? tarotEntries.filter((entry) => entry && safeText(entry.name || entry.nameJa))
      : [];

    if (!entries.length) {
      return '今回はタロットカードは未選択です。\n必要に応じて、今の悩みに響くカードを一枚選ぶことで、星命のメッセージにもう一段深い補助線を引けます。';
    }

    const positions = getPositions(entries.length);

    return entries
      .map((entry, index) => tarotLine(entry, index, positions))
      .filter(Boolean)
      .join('\n\n');
  }

  function buildOpeningSection(ctx) {
    return compact(
`${ctx.name}へ

${ctx.coreLine}

${ctx.hook}

${ctx.pain}

この鑑定は、あなたを決めつけるものではありません。
今どこで疲れていて、どこにまだ可能性が残っているのか。
それを一緒に見つけるための言葉です。`
    );
  }

  function buildSanmeiSection(ctx) {
    return compact(
`1. 生年月日から見える、あなたの芯

${ctx.birthDate}の簡易日柱は、${ctx.dayName}（${ctx.dayLabel}）です。

ここで見ているのは、専門用語そのものではありません。
あなたが頑張る時、傷ついた時、誰かを大切にしたい時に出やすい反応です。

日干は${ctx.dayStem}。
五行では${ctx.element}、陰陽では${ctx.yinYang}の性質を持ち、象徴は「${ctx.symbol}」です。

この星には、
「${ctx.sanmeiEssence}」
という本質が出やすくなります。

ただし、
「${ctx.caution}」
が強く出ると、気づかないうちに無理を重ねやすくなります。

${ctx.deep ? `${ctx.deep}\n` : ''}大切なのは、弱点として責めることではありません。
自分がどこで苦しくなりやすいかを知るだけで、選び方は変えられます。`
    );
  }

  function buildSeimeiSection(ctx) {
    return compact(
`2. 詩韻式 星命タイプ

基本タイプは「${ctx.typeName}」。
補助タイプは「${ctx.subTypeName}」です。

${ctx.typeName}は、${ctx.typeShortTitle}です。

あなたの中には、
${ctx.strength}
があります。

${ctx.nuance ? `${ctx.nuance}\n` : ''}けれど、その力が強く出すぎると、
${ctx.shadow}
が起こりやすくなります。

これは運が良い・悪いという話ではありません。
あなたの力が、少し疲れた形で表に出ているだけです。

強い人ほど、強さの使い方で苦しくなることがあります。
優しい人ほど、優しさの置き場所で傷つくことがあります。

だから今必要なのは、自分を責めることではありません。
その力を、もう一度あなた自身の味方に戻すことです。`
    );
  }

  function buildTopicSection(ctx) {
    return compact(
`3. 「${ctx.topic}」について

${ctx.memoText}

${ctx.topicText}

今の悩みは、すぐに白黒をつけるよりも、
「事実」
「感情」
「次にできる行動」
を分けて見ると、心が少し落ち着きます。

感情は間違いではありません。
けれど、感情だけで未来を決めなくても大丈夫です。`
    );
  }

  function buildThemeSection(ctx) {
    return compact(
`4. テーマ別に見たあなた

恋愛：
${ctx.love}

仕事：
${ctx.work}

金運：
${ctx.money}

人間関係：
${ctx.relationship}

どのテーマでも大切なのは、自分の気持ちを置き去りにしないことです。

誰かのために頑張れる人ほど、
自分の違和感を後回しにしやすいものです。

その違和感は、わがままではありません。
心が「そろそろ見てほしい」と知らせている声です。`
    );
  }

  function stripFutureCta(textValue) {
    const textBody = safeText(textValue);
    if (!textBody) return '';

    return textBody
      .replace(/\n*8[.．]\s*個人鑑定のご案内[\s\S]*$/g, '')
      .replace(/\n*個人鑑定のご案内[\s\S]*$/g, '')
      .trim();
  }

  function buildFutureTextWithoutCta(input, chart, tarotEntries, futureScores) {
    if (!MonthlyReading || typeof MonthlyReading.buildYearOverview !== 'function') {
      return '';
    }

    const hasTarot = Array.isArray(tarotEntries) &&
      tarotEntries.some((entry) => safeText(entry && (entry.name || entry.nameJa)));

    const tarotNote = hasTarot
      ? '選ばれたタロットのメッセージも、未来を見るための補助線として重ねています。'
      : '今回はタロット未選択です。星命の傾向を中心に、今年の動きを見ています。';

    return compact(
[
  '今年の結論',
  MonthlyReading.buildYearOverview(input, chart, futureScores),
  tarotNote,

  '今年の運気マップ',
  typeof MonthlyReading.buildYearMap === 'function'
    ? MonthlyReading.buildYearMap(futureScores)
    : '',

  '数字の見方',
  typeof MonthlyReading.buildScoreGuide === 'function'
    ? MonthlyReading.buildScoreGuide()
    : '',

  '月別未来鑑定',
  typeof MonthlyReading.buildMonthlyReading === 'function'
    ? MonthlyReading.buildMonthlyReading(futureScores)
    : '',

  '恋愛・仕事・金運の流れ',
  typeof MonthlyReading.buildLoveReading === 'function'
    ? MonthlyReading.buildLoveReading(futureScores, input)
    : '',
  typeof MonthlyReading.buildWorkReading === 'function'
    ? MonthlyReading.buildWorkReading(futureScores, input)
    : '',
  typeof MonthlyReading.buildMoneyReading === 'function'
    ? MonthlyReading.buildMoneyReading(futureScores, input)
    : '',

  '今年意識したいこと',
  typeof MonthlyReading.buildLuckyActionReading === 'function'
    ? MonthlyReading.buildLuckyActionReading(futureScores, input)
    : '',

  'この先に待っている未来',
  typeof MonthlyReading.buildFutureOutlook === 'function'
    ? MonthlyReading.buildFutureOutlook(futureScores, input)
    : ''
].filter(Boolean).join('\n\n')
    );
  }

  function buildFutureSection(input, chart, tarotEntries, futureScores, futureReading) {
    const generated = buildFutureTextWithoutCta(input, chart, tarotEntries, futureScores);
    const fallback = stripFutureCta(futureReading);
    const body = safeText(generated || fallback);

    if (!body) {
      return compact(
`5. 未来鑑定

未来鑑定は、鑑定対象年と月別スコアを重ねることで表示されます。
今は本質と現在のテーマを中心に、次の一歩を見ていきます。`
      );
    }

    return compact(
`5. 未来鑑定

${body}`
    );
  }

  function buildTarotSection(ctx) {
    return compact(
`6. タロットからのメッセージ

詩韻式では、タロットの逆位置は採用しません。
すべてのカードを、正位置の象徴として読みます。

ただし、良い意味だけを見るわけではありません。
一枚のカードの中には、光も、影も、見直す鍵もあります。

カードは怖がらせるものではありません。
今のあなたが見落としている心の声を、そっと映してくれる鏡です。

${ctx.tarotText}`
    );
  }

  function buildActionSection(ctx) {
    return compact(
`7. 今やるべきこと

今のあなたに必要なのは、全部を一度に変えることではありません。

まずは、次の三つだけで大丈夫です。

- いま一番気になっていることを、一文で書く
- それが「事実」なのか「想像」なのかを分ける
- 今日できる確認を一つだけ選ぶ

そして、もう一つだけ。

${ctx.advice}

大きな決断は、心が少し落ち着いてからで大丈夫です。
焦って答えを出すより、今の自分に合う形で選ぶ方が、未来は変わりやすくなります。`
    );
  }

  function buildPersonalReadingSection(ctx) {
    const detail =
      ctx.topic === '恋愛'
        ? '相手の本音、この関係を続けるべきか、連絡のタイミングなど'
        : ctx.topic === '仕事'
          ? '今の環境を続けるべきか、動くならいつがよいか、評価につながる選択など'
          : ctx.topic === '金運'
            ? '不安の正体、支出の見直し、収入につながる行動の整理など'
            : ctx.topic === '人間関係'
              ? '今の距離感、どこまで合わせるべきか、自分を守る線引きなど'
              : '今の迷いの原因と、あなたに合う選択肢';

    return compact(
`8. もっと深く見たい方へ

ここまでで、大きな傾向と今できることは見えてきました。

ただ、実際の悩みは一人ひとり違います。
同じ「恋愛」でも、相手との距離、言葉の温度、これまでの関係で答えは変わります。

${detail}は、個人鑑定で今の状況とタロットを重ねることで、より細かく見ていけます。

必要な時は、一人で抱え込まずに相談してください。
あなたの状況に合わせて、一緒に読み解いていきましょう。`
    );
  }

  function buildClosingSection(ctx) {
    const reassurance = safeText(ctx.reassurance);
    const hasDaijoubu = /大丈夫だよ/.test(reassurance);

    return compact(
`9. 最後の一言

${ctx.message}

${reassurance}

ここまで読んで、少しでも胸に残る言葉があったなら、
それが今のあなたに必要なメッセージです。

${hasDaijoubu ? '' : '大丈夫だよ。'}
未来は、今ここからの選び方で少しずつ変えていけます。`
    );
  }

  function createContext(input, chart, tarotEntries) {
    const safeInput = input || {};
    const safeChart = chart || {};
    const seimei = safeChart.seimei || {};
    const pillars = safeChart.pillars || {};
    const sanmeiReference = safeChart.sanmeiReference || {};
    const dayPillar = pillars.day || {};

    const type = seimei.baseType || {};
    const subType = seimei.subType || {};
    const topic = safeText(safeInput.topic, '総合');

    return {
      name: safeInput.name ? `${safeInput.name}さん` : 'ご相談者さま',
      topic,

      coreLine: getTypeValue(
        type,
        'coreLine',
        'あなたの星命には、今の自分を見つめ直しながら未来へ進む力が宿っています。'
      ),
      hook: getTypeValue(
        type,
        'hook',
        'あなたは、自分の中にある本音を少しずつ言葉にしていくことで道が見えやすい方です。'
      ),
      pain: getTypeValue(
        type,
        'pain',
        '今は、気持ちを抱え込みすぎず、事実と想像を分けて見つめることが大切です。'
      ),

      birthDate: safeText(safeInput.birthDate, '未入力'),
      dayName: safeText(dayPillar.name, '未算出'),
      dayLabel: safeText(dayPillar.label, '参考値'),
      dayStem: safeText(sanmeiReference.dayStem, '未算出'),
      element: safeText(sanmeiReference.element, '参考'),
      yinYang: safeText(sanmeiReference.yinYang, '参考'),
      symbol: safeText(sanmeiReference.symbol, '象徴'),
      sanmeiEssence: safeText(sanmeiReference.essence, '本質を形にする力'),
      caution: safeText(sanmeiReference.caution, '無理をしすぎないこと'),
      deep: safeText(sanmeiReference.deep, ''),

      typeName: safeText(type.name, '星命タイプ'),
      subTypeName: safeText(subType.name, '補助タイプ'),
      typeShortTitle: safeText(type.shortTitle, 'その人らしい光を持つ星命'),
      strength: getTypeValue(
        type,
        'strength',
        type.essence || '今ある力を、現実の行動へ変えていける力'
      ),
      shadow: getTypeValue(
        type,
        'shadow',
        '抱え込みすぎ、考えすぎ、焦りすぎには少し注意が必要です。'
      ),
      nuance: safeText(seimei.nuance, ''),

      memoText: formatMemo(safeInput),
      topicText: getTopicText(type, safeChart, topic),

      love: getTypeValue(
        type,
        'love',
        '恋愛では、相手の気持ちを決めつけず、自分の心も大切にしながら対話することが鍵になります。'
      ),
      work: getTypeValue(
        type,
        'work',
        '仕事では、自分の役割と条件を分けて見ることで、力を注ぐ場所が見えやすくなります。'
      ),
      money: getTypeValue(
        type,
        'money',
        '金運では、不安で動くより、お金の入口と出口を見える形にすることが安心につながります。'
      ),
      relationship: getTypeValue(
        type,
        'relationship',
        '人間関係では、相手に合わせるだけでなく、自分の心が苦しくならない距離感を見つめることが大切です。'
      ),

      tarotText: buildTarotText(tarotEntries),

      advice: getTypeValue(
        type,
        'advice',
        '今日できる一歩を一つだけ決めてください。'
      ),
      message: getTypeValue(
        type,
        'message',
        '星の言葉は、現実を見つめ直すためのやさしい光です。'
      ),
      reassurance: getTypeValue(
        type,
        'reassurance',
        '大丈夫だよ。今できることから始めれば、未来は少しずつ変わります。'
      )
    };
  }

  function buildCoreReading(input, chart, tarotEntries, futureScores, futureReading) {
    const ctx = createContext(input, chart, tarotEntries);

    return compact(
      [
        buildOpeningSection(ctx),
        buildSanmeiSection(ctx),
        buildSeimeiSection(ctx),
        buildTopicSection(ctx),
        buildThemeSection(ctx),
        buildFutureSection(input, chart, tarotEntries, futureScores, futureReading),
        buildTarotSection(ctx),
        buildActionSection(ctx),
        buildPersonalReadingSection(ctx),
        buildClosingSection(ctx)
      ].join('\n\n')
    );
  }

  function generateReading(input, chart, tarotEntries = [], futureScores = [], futureReading = '') {
    const result = buildCoreReading(input, chart, tarotEntries, futureScores, futureReading);
    return filterForbidden(compact(result));
  }

  function alreadyHasClosing(textValue) {
    const value = safeText(textValue);
    return (
      /大丈夫だよ。?$/.test(value) ||
      /大丈夫だよ。?\s*未来は/.test(value) ||
      /未来は、今ここからの選び方で少しずつ変えていけます。?$/.test(value)
    );
  }

  function polishShionStyle(value) {
    let polished = compact(filterForbidden(value));

    if (!polished) {
      polished =
        '今は、不安や迷いを少しずつ言葉にしていく時です。焦らず、事実と感情を分けながら、次にできることを一つ見つけていきましょう。';
    }

    if (!polished.startsWith('まずは') && !polished.includes('へ\n\n')) {
      polished =
        'まずは、ここまで向き合ってきたご自身を責めずにいてください。\n' +
        '星の言葉を、現実を見るための道しるべとして一緒に見ていきます。\n\n' +
        polished;
    }

    if (!/今やるべきこと|今できること|今日できる/.test(polished)) {
      polished +=
        '\n\n今できること\n' +
        '- 心配を一つ紙に書き出す\n' +
        '- 事実と想像を分ける\n' +
        '- 今日できる確認を一つだけ決める';
    }

    if (!alreadyHasClosing(polished)) {
      polished += '\n\n未来は、今ここからの選び方で少しずつ変えていけます。大丈夫だよ。';
    }

    return filterForbidden(compact(polished));
  }

  return {
    filterForbidden,
    generateReading,
    polishShionStyle,
    tarotLine,
    buildTarotText,
    normalizeCardKey,
    getTarotInsight
  };
});
