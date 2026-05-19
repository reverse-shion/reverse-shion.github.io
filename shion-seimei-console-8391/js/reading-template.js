(function (root, factory) {
  let tarot = root.ShionTarotMapping;
  let monthly = root.ShionMonthlyReading;

  if (typeof require === 'function' && (!tarot || typeof module !== 'undefined')) {
    try {
      tarot = require('./tarot-mapping.js');
    } catch (error) {
      tarot = null;
    }
  }

  if (typeof require === 'function' && (!monthly || typeof module !== 'undefined')) {
    try {
      monthly = require('./monthly-reading.js');
    } catch (error) {
      monthly = null;
    }
  }

  const api = factory(tarot || {}, monthly || {});

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionReadingTemplate = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (Tarot, MonthlyReading) {
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
    1: ['今のテーマ'],
    2: ['今の流れ', '整える鍵'],
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

  const SHION_TAROT_INSIGHTS = {
    '愚者': {
      essence: 'まだ名前のない自由。決まっていないからこそ、未来を選び直せるカードです。',
      shadow: '自由でいたい気持ちが強くなるほど、責任や現実から少し離れたくなることがあります。',
      adjustment: '勢いだけで飛び出すより、「どこへ向かいたいのか」を一つだけ決めてみてください。',
      humanMessage: '怖いのに進みたいなら、それは無謀ではありません。心が新しい景色を求めているサインです。',
      action: 'やってみたいことを一つだけメモしてください。大きく始めなくて大丈夫です。'
    },
    '魔術師': {
      essence: '可能性を現実に変える始まりの力。手元にあるものから、最初の形を作るカードです。',
      shadow: 'アイデアが多いほど、準備や構想だけで止まってしまうことがあります。',
      adjustment: '完璧な準備を待つより、ひとつ形にすることが大切です。',
      humanMessage: 'あなたの中には、もう材料があります。足りないものを数えるより、今あるものをどう使うかを見てください。',
      action: '考えていることを一つ、投稿・連絡・メモ・作業のどれかに変えてください。'
    },
    '女教皇': {
      essence: '静かな直感と、まだ言葉にならない真実。心の奥で答えを感じ取るカードです。',
      shadow: '感じ取る力が強い時ほど、確認しないまま心の中で結論を作ってしまうことがあります。',
      adjustment: '直感を大切にしながらも、事実と言葉で確かめることが必要です。',
      humanMessage: '違和感は無視しなくて大丈夫です。ただ、それを怖い結論に急がなくても大丈夫です。',
      action: '「見た事実」と「感じたこと」を分けて書き出してください。'
    },
    '女帝': {
      essence: '受け入れ、育て、満たす力。愛情や豊かさを現実に広げるカードです。',
      shadow: '与える力が強くなりすぎると、自分の満たされなさに気づけなくなることがあります。',
      adjustment: '誰かを満たす前に、自分の心と身体にも栄養を戻してください。',
      humanMessage: 'あなたの優しさは、誰かを包む力になります。でも、空っぽになるまで与えなくていいのです。',
      action: '自分のために、温かい飲み物・食事・休息のどれかを一つ選んでください。'
    },
    '皇帝': {
      essence: '責任、決断、土台を作る力。現実を支え、形にするカードです。',
      shadow: '守ろうとする気持ちが強いほど、正しさや管理で押し切りたくなることがあります。',
      adjustment: '支配するより、安心できる仕組みを作ることが大切です。',
      humanMessage: '本当の強さは、何も頼らないことではありません。背負い方を見直すことも、ちゃんと強さです。',
      action: '今日やることを三つに絞り、残りは後日に回してください。'
    },
    '教皇': {
      essence: '信頼、教え、受け継がれる知恵。人とのつながりの中で道を見つけるカードです。',
      shadow: '常識や正しさを大切にするあまり、自分の本音を押し込めてしまうことがあります。',
      adjustment: '「こうあるべき」だけでなく、「本当はどうしたいか」も大切にしてください。',
      humanMessage: '誠実でいることと、我慢し続けることは同じではありません。',
      action: '信頼できる人に、今の気持ちを一言だけ話してみてください。'
    },
    '恋人': {
      essence: '選択、心の一致、関係性の分岐点。何を選ぶかで未来が変わるカードです。',
      shadow: '相手に選ばれたい気持ちが強くなると、自分が何を選びたいのか見えにくくなります。',
      adjustment: '相手の気持ちだけでなく、自分の心が本当に安心できるかを見てください。',
      humanMessage: '愛されるかどうかだけではなく、あなた自身がその関係を選びたいかも大切です。',
      action: 'その関係で「嬉しいこと」と「苦しいこと」を一つずつ書き出してください。'
    },
    '戦車': {
      essence: '前進、意志、突破力。迷いを抱えながらも進もうとするカードです。',
      shadow: '進みたい気持ちが強いほど、焦りで自分や相手を急かしてしまうことがあります。',
      adjustment: '目的地とペースを見直してください。勢いよりも方向性が大切です。',
      humanMessage: '進む力はあります。だからこそ、どこへ向かうのかを決めることが大切です。',
      action: '今週中に進めることを一つだけ決め、具体的な日時を入れてください。'
    },
    '力': {
      essence: '優しさ、忍耐、内なる強さ。力でねじ伏せず、心で向き合うカードです。',
      shadow: '耐えられる力があるほど、つらさを我慢で処理してしまうことがあります。',
      adjustment: '強いから大丈夫、ではなく、強い人にも休む場所が必要です。',
      humanMessage: 'ここまで耐えてきたことには意味があります。でも、これ以上ひとりで抱えなくてもいいのです。',
      action: '我慢していることを一つだけ言葉にしてください。誰かに言えないなら、紙でも大丈夫です。'
    },
    '隠者': {
      essence: '内省、探究、静かな答え。外の声を離れ、自分の真実を探すカードです。',
      shadow: '深く考えるほど、一人で抱え込み、誰にも届かない場所に閉じこもってしまうことがあります。',
      adjustment: '一人の時間は大切ですが、必要な言葉だけは外へ出してください。',
      humanMessage: '沈黙の中に答えはあります。ただ、その答えを自分だけで背負わなくても大丈夫です。',
      action: '今考えていることを三行だけ書き出してください。書くだけで見えてくるものがあります。'
    },
    '運命の輪': {
      essence: '流れ、転機、巡り合わせ。止まっていたものが動き出すカードです。',
      shadow: '流れに任せすぎると、自分がどうしたいのかを見失いやすくなります。',
      adjustment: '偶然を待つだけでなく、どの流れに乗るかを自分で選ぶことが大切です。',
      humanMessage: '何かが少しずつ動き始めています。置いていかれるのではなく、選んで乗っていきましょう。',
      action: '最近起きた小さな変化を一つ書き出し、それをどう活かすか考えてください。'
    },
    '正義': {
      essence: '判断、均衡、誠実な選択。感情と現実を並べて見るカードです。',
      shadow: '正しさを求めるほど、心の痛みや迷いを切り捨ててしまうことがあります。',
      adjustment: '冷静な判断に、心の納得も加えてください。',
      humanMessage: '正しいかどうかだけでは測れない想いがあります。苦しさも大切な判断材料です。',
      action: 'メリット・デメリットだけでなく、「自分の心がどう感じるか」も書き出してください。'
    },
    '吊るされた男': {
      essence: '停止、受容、視点の転換。動けない時間の中に意味を見つけるカードです。',
      shadow: '我慢を意味のあるものにしようとして、苦しさを正当化してしまうことがあります。',
      adjustment: '無理に進むより、見方を変えることで抜け道が見えてきます。',
      humanMessage: '止まっているように見える時間にも、心はちゃんと何かを学んでいます。焦らなくて大丈夫です。',
      action: '今の状況を、別の人に相談されたつもりで見直してみてください。'
    },
    '死神': {
      essence: '終わり、手放し、再生。古い形を閉じ、新しい流れへ向かうカードです。',
      shadow: '終わりが見える時ほど、すべてを失うように感じて怖くなることがあります。',
      adjustment: '全部を捨てる必要はありません。残すものと手放すものを分けてください。',
      humanMessage: '終わりは罰ではありません。もう合わなくなった形を脱ぎ、次の自分へ戻るための区切りです。',
      action: '今の自分に必要なもの、もう苦しくなっているものを一つずつ書いてください。'
    },
    '節制': {
      essence: '調和、回復、混ぜ合わせる力。違うものを無理なく馴染ませるカードです。',
      shadow: 'バランスを取ろうとするほど、自分だけが我慢してしまうことがあります。',
      adjustment: '調和とは、自分を消すことではありません。あなたの気持ちも混ぜていいのです。',
      humanMessage: 'あなたが合わせてきた場の中に、あなた自身の声は入っていましたか。今度はそこを大切にしてください。',
      action: '自分が譲っていることを一つ見つけ、本当はどうしたいかを書いてください。'
    },
    '悪魔': {
      essence: '欲望、執着、本音の影。心が何に縛られているかを映すカードです。',
      shadow: '欲しい、離れられない、やめられないという感情に、自分でも苦しくなることがあります。',
      adjustment: '欲を責めるより、その奥にある寂しさや不安を見てください。',
      humanMessage: '執着は弱さではなく、心が何かを強く求めているサインです。ただ、それに飲まれなくても大丈夫です。',
      action: '今手放せないものが「安心」「承認」「愛情」のどれに近いか考えてください。'
    },
    '塔': {
      essence: '崩壊、気づき、真実の露呈。無理に積み上げたものが崩れ、本質が見えるカードです。',
      shadow: '突然の変化に、すべてが壊れたように感じてしまうことがあります。',
      adjustment: '崩れたものを見るだけでなく、なぜ無理が積み上がっていたのかを見てください。',
      humanMessage: 'それは罰ではありません。苦しめていた形が、もう続けられないと教えてくれているのです。',
      action: '今いちばん無理をしていることを一つだけ認めてください。認めるだけでも変化は始まります。'
    },
    '星': {
      essence: '希望、癒し、未来への光。まだ遠くても、進む先に光を見つけるカードです。',
      shadow: '希望を見るだけで現実の一歩が止まると、夢が遠いままになってしまいます。',
      adjustment: '希望を行動として現実に置いてください。',
      humanMessage: '今はまだ遠く感じても、光は消えていません。その星は、ちゃんと道しるべになります。',
      action: '未来のために今日できる行動を一つ選んでください。'
    },
    '月': {
      essence: '不安、直感、揺れる心。はっきりしない夜の中で、本音を探すカードです。',
      shadow: '想像が膨らむほど、不安を事実のように感じてしまうことがあります。',
      adjustment: '見えないものを怖がりすぎず、確認できることから見てください。',
      humanMessage: '不安になるのは弱いからではありません。大切だからこそ、心が先に揺れてしまうのです。',
      action: '不安を一つ書き、その横に「確認できること」を一つだけ書いてください。'
    },
    '太陽': {
      essence: '喜び、解放、生命力。心が明るさを取り戻すカードです。',
      shadow: '明るく進める時ほど、勢いで大切なことを見落としてしまうことがあります。',
      adjustment: '喜びを一時的な勢いで終わらせず、続けられる形にしてください。',
      humanMessage: '笑える時間は、ちゃんと戻ってきます。その光を、無理なく続く日常に置いていきましょう。',
      action: '今日うれしかったことを一つ残してください。小さな喜びが次の力になります。'
    },
    '審判': {
      essence: '目覚め、再出発、呼び戻される本当の自分。過去を越えて選び直すカードです。',
      shadow: '過去を思い出すほど、あの時できなかった自分を責めてしまうことがあります。',
      adjustment: '過去を責めるより、今なら選び直せることに意識を向けてください。',
      humanMessage: '遅すぎることはありません。眠っていた声が、もう一度立ち上がろうとしています。',
      action: '昔あきらめたこと、今なら少しできそうなことを一つ書いてください。'
    },
    '世界': {
      essence: '完成、統合、一区切り。ここまでの経験が一つの形になるカードです。',
      shadow: '完成に近づくほど、終わることへの寂しさや、次へ進む怖さが出ることがあります。',
      adjustment: '終わりにしがみつかず、ここまでの経験を持って次の循環へ進んでください。',
      humanMessage: '積み重ねてきたものは、ちゃんと形になっています。終わりは喪失ではなく、次の扉でもあります。',
      action: 'ここまで頑張ったことを一つ認めて、次に進む準備を始めてください。'
    }
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

    if (SHION_TAROT_INSIGHTS[raw]) return raw;

    const cleaned = raw
      .replace(/正位置|逆位置|upright|reversed/gi, '')
      .replace(/\bthe\b/gi, '')
      .replace(/[ 　]/g, '')
      .replace(/^[0-9０-９]+[.．、:：\-_/]*/g, '')
      .replace(/^[IVXLCDMⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ]+[.．、:：\-_/]*/gi, '')
      .toLowerCase()
      .trim();

    if (TAROT_NAME_ALIASES[cleaned]) return TAROT_NAME_ALIASES[cleaned];

    const direct = Object.keys(SHION_TAROT_INSIGHTS).find((name) => raw.includes(name));
    if (direct) return direct;

    return raw;
  }

  function getPositions(count) {
    if (Tarot && Tarot.SPREAD_POSITIONS && Tarot.SPREAD_POSITIONS[count]) {
      return Tarot.SPREAD_POSITIONS[count];
    }

    return DEFAULT_POSITIONS[count] || DEFAULT_POSITIONS[3];
  }

  function findTarot(entryName) {
    const name = safeText(entryName);
    if (!name) return null;

    if (Tarot && typeof Tarot.findTarotByName === 'function') {
      const direct = Tarot.findTarotByName(name);
      if (direct) return direct;

      const normalized = normalizeCardKey(name);
      const byNormalized = Tarot.findTarotByName(normalized);
      if (byNormalized) return byNormalized;
    }

    return null;
  }

  function getTarotInsight(card, entryName) {
    const rawName = card && card.nameJa ? card.nameJa : entryName;
    const key = normalizeCardKey(rawName);

    return SHION_TAROT_INSIGHTS[key] || {
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

    return '今は、気持ち・状況・次の行動を分けて見つめることで、現実を判断しやすくなる時です。';
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
    if (!entry || !entry.name) return '';

    const card = findTarot(entry.name);
    const position = positions[index] || `カード${index + 1}`;
    const displayName = card && card.nameJa ? card.nameJa : normalizeCardKey(entry.name);
    const insight = getTarotInsight(card, displayName);

    const keywords = card && Array.isArray(card.uprightKeywords)
      ? card.uprightKeywords.filter(Boolean)
      : [];

    const mappingMeaning = card && card.uprightMeaning ? card.uprightMeaning : '';
    const resonance = card && card.seimeiResonanceText
      ? card.seimeiResonanceText
      : 'このカードは、今の星命タイプが持つ力を現実へ落とし込むための補助線になります。';

    const actionAdvice = card && card.actionAdvice ? card.actionAdvice : insight.action;

    return compact(
`${position}：${displayName}

象徴：
${keywords.length ? keywords.join('、') : insight.essence}

本質：
${insight.essence}

${mappingMeaning ? `補助解釈：\n${mappingMeaning}\n\n` : ''}影として出やすいこと：
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
    const entries = Array.isArray(tarotEntries) ? tarotEntries : [];

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

  function buildFutureSection(input, chart, tarotEntries, futureScores, futureReading) {
    const generated = MonthlyReading && typeof MonthlyReading.buildFutureReading === 'function'
      ? MonthlyReading.buildFutureReading(input, chart, tarotEntries, futureScores || [])
      : '';

    const text = safeText(futureReading || generated);

    if (!text) {
      return compact(
`5. 未来鑑定

未来鑑定は、鑑定対象年と月別スコアを重ねることで表示されます。
今は本質と現在のテーマを中心に、次の一歩を見ていきます。`
      );
    }

    return compact(
`5. 未来鑑定

${text}`
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
    return compact(
`9. 最後の一言

${ctx.message}

${ctx.reassurance}

ここまで読んで、少しでも胸に残る言葉があったなら、
それが今のあなたに必要なメッセージです。

大丈夫だよ。
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

    if (!/大丈夫だよ。?$/.test(polished)) {
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
