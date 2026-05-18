(function (root, factory) {
  let tarot = root.ShionTarotMapping;
  let monthly = root.ShionMonthlyReading;

  if (typeof require === 'function' && (!tarot || typeof module !== 'undefined')) {
    tarot = require('./tarot-mapping.js');
  }
  if (typeof require === 'function' && (!monthly || typeof module !== 'undefined')) {
    try { monthly = require('./monthly-reading.js'); } catch (error) { monthly = null; }
  }

  const api = factory(tarot || {}, monthly || {});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionReadingTemplate = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (Tarot, MonthlyReading) {
  const bannedReplacements = [
    [/絶対に破産します/g, 'お金の流れを整える必要が見えやすい時期です'],
    [/絶対に結婚できません/g, '関係性は急いで決めつけず、対話と行動の一致を見ていくことが大切です'],
    [/あなたは不幸な宿命です/g, '今は整えるテーマが見えやすい時期です'],
    [/何をしても無駄です/g, '小さく見直すことで流れが変わりやすくなります'],
    [/病気になります/g, '心身の不安がある場合は専門家へ相談してください'],
    [/死にます/g, '命や健康に関する断定はできません'],
    [/投資すれば必ず儲かります/g, 'お金の判断は専門家への相談とリスク確認が大切です'],
    [/借金は必ず解決します/g, 'お金の困りごとは公的窓口や専門家に相談しながら整理してください'],
    [/相手は必ず戻ってきます/g, '相手の気持ちは断定せず、行動と言葉の一致を見てください'],
    [/この時期に必ず成功します/g, '準備と条件整理が成果につながりやすくなります'],
    [/悪い運命/g, '整えるテーマ'],
    [/金運が弱い/g, 'お金の流れを整える意識が大切'],
    [/失敗する/g, '見直しが必要になりやすい']
  ];

  const DEFAULT_POSITIONS = {
    1: ['今のテーマ'],
    2: ['今の流れ', '整える鍵'],
    3: ['今の流れ', '心の奥', '進む道'],
    4: ['現状', '心の奥', '整える課題', '未来への一歩'],
    5: ['現状', '心の奥', '課題', '助けになる力', '未来への一歩']
  };

  const TAROT_NAME_ALIASES = {
    fool: '愚者',
    magician: '魔術師',
    highpriestess: '女教皇',
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
      essence: 'まだ名前のない自由。決まっていないからこそ、未来を選び直せる力。',
      shadow: '自由でいたい気持ちが強くなるほど、責任や現実から少し離れたくなることがあります。',
      adjustment: '勢いだけで飛び出すより、「どこへ向かいたいのか」を一つだけ決めると流れが整います。',
      humanMessage: '怖さがあるのに進みたいなら、それは無謀ではなく、心が新しい景色を求めているサインです。',
      action: 'やってみたいことを一つだけメモしてください。大きく始めなくて大丈夫です。'
    },
    '魔術師': {
      essence: '可能性を現実に変える始まりの力。手元にあるものから、最初の形を作るカードです。',
      shadow: 'アイデアが多いほど、準備や構想だけで止まってしまうことがあります。',
      adjustment: '完璧な準備を待つより、ひとつ形にすることが大切です。小さな完成が次の流れを呼びます。',
      humanMessage: 'あなたの中には、もう材料があります。足りないものを数えるより、今あるものをどう使うかを見てください。',
      action: '考えていることを一つ、投稿・連絡・メモ・作業のどれかに変えてください。'
    },
    '女教皇': {
      essence: '静かな直感と、まだ言葉にならない真実。心の奥で答えを感じ取るカードです。',
      shadow: '感じ取る力が強い時ほど、確認しないまま心の中で結論を作ってしまうことがあります。',
      adjustment: '直感を大切にしながらも、事実と言葉で確かめることが必要です。',
      humanMessage: 'あなたが感じている違和感は、無視しなくて大丈夫です。ただ、それを怖い結論に急がなくても大丈夫です。',
      action: '「見た事実」と「感じたこと」を分けて書き出してください。'
    },
    '女帝': {
      essence: '受け入れ、育て、満たす力。愛情や豊かさを現実に広げるカードです。',
      shadow: '与える力が強くなりすぎると、相手を優先しすぎて自分の満たされなさに気づけなくなります。',
      adjustment: '誰かを満たす前に、自分の心と身体にも栄養を戻してください。',
      humanMessage: 'あなたの優しさは、誰かを包む力になります。でも、あなた自身が空っぽになってまで与えなくていいのです。',
      action: '自分のために、温かい飲み物・食事・休息のどれかを一つ選んでください。'
    },
    '皇帝': {
      essence: '責任、決断、土台を作る力。現実を支え、形にするカードです。',
      shadow: '守ろうとする気持ちが強いほど、正しさや管理で押し切りたくなることがあります。',
      adjustment: '支配するより、安心できる仕組みを作ることが大切です。',
      humanMessage: '強くあろうとしてきたあなたは、きっと一人で多くを背負ってきたはずです。でも、本当の強さは頼らないことではありません。',
      action: '今日やることを三つに絞り、残りは後日に回してください。'
    },
    '教皇': {
      essence: '信頼、教え、受け継がれる知恵。人とのつながりの中で道を見つけるカードです。',
      shadow: '常識や正しさを大切にするあまり、自分の本音を押し込めてしまうことがあります。',
      adjustment: '「こうあるべき」だけでなく、「本当はどうしたいか」も同じくらい大切にしてください。',
      humanMessage: 'あなたが守ってきた誠実さは、本物です。ただ、誠実でいることと、我慢し続けることは同じではありません。',
      action: '信頼できる人に、今の気持ちを一言だけ話してみてください。'
    },
    '恋人': {
      essence: '選択、心の一致、関係性の分岐点。何を選ぶかで未来が変わるカードです。',
      shadow: '相手に選ばれたい気持ちが強くなると、自分が何を選びたいのか見えにくくなります。',
      adjustment: '相手の気持ちだけでなく、自分の心が本当に安心できるかを見てください。',
      humanMessage: '愛されるかどうかだけを見ていると、あなたの心が置き去りになります。あなたにも選ぶ権利があります。',
      action: 'その関係で「嬉しいこと」と「苦しいこと」を一つずつ書き出してください。'
    },
    '戦車': {
      essence: '前進、意志、突破力。迷いを抱えながらも進もうとするカードです。',
      shadow: '進みたい気持ちが強いほど、焦りで自分や相手を急かしてしまうことがあります。',
      adjustment: '目的地とペースを整えてください。勢いよりも方向性が大切です。',
      humanMessage: '今のあなたには進む力があります。でも、無理に走り切らなくて大丈夫です。ちゃんとハンドルを握ることが大切です。',
      action: '今週中に進めることを一つだけ決め、具体的な日時を入れてください。'
    },
    '力': {
      essence: '優しさ、忍耐、内なる強さ。力でねじ伏せず、心で向き合うカードです。',
      shadow: '耐えられる力があるほど、つらさを我慢で処理してしまうことがあります。',
      adjustment: '強いから大丈夫、ではなく、強い人にも休む場所が必要です。',
      humanMessage: 'あなたがここまで耐えてきたことは、ちゃんと意味があります。でも、これ以上ひとりで抱えなくてもいいのです。',
      action: '我慢していることを一つだけ言葉にしてください。誰かに言えないなら、紙でも大丈夫です。'
    },
    '隠者': {
      essence: '内省、探究、静かな答え。外の声を離れ、自分の真実を探すカードです。',
      shadow: '深く考えるほど、一人で抱え込み、誰にも届かない場所に閉じこもってしまうことがあります。',
      adjustment: '一人の時間は大切ですが、必要な言葉だけは外へ出してください。',
      humanMessage: 'あなたの沈黙の中には、ちゃんと答えがあります。ただ、その答えを自分だけで背負わなくても大丈夫です。',
      action: '今考えていることを三行だけ書き出してください。整理するだけで道が見えます。'
    },
    '運命の輪': {
      essence: '流れ、転機、巡り合わせ。止まっていたものが動き出すカードです。',
      shadow: '流れに任せすぎると、自分がどうしたいのかを見失いやすくなります。',
      adjustment: '偶然を待つだけでなく、どの流れに乗るかを自分で選ぶことが大切です。',
      humanMessage: '今、何かが少しずつ動き始めています。怖くても、それはあなたを置き去りにする流れではありません。',
      action: '最近起きた小さな変化を一つ書き出し、それをどう活かすか考えてください。'
    },
    '正義': {
      essence: '判断、均衡、誠実な選択。感情と現実を並べて見るカードです。',
      shadow: '正しさを求めるほど、心の痛みや迷いを切り捨ててしまうことがあります。',
      adjustment: '冷静な判断に、心の納得も加えてください。',
      humanMessage: '正しいかどうかだけでは測れない想いがあります。あなたの心が苦しいなら、それも大切な判断材料です。',
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
      humanMessage: '終わりは罰ではありません。もう合わなくなった形を脱ぎ、次の自分に戻るための区切りです。',
      action: '今の自分に必要なもの、もう苦しくなっているものを一つずつ書いてください。'
    },
    '節制': {
      essence: '調和、回復、混ぜ合わせる力。違うものを無理なく馴染ませるカードです。',
      shadow: 'バランスを取ろうとするほど、自分だけが我慢して整えてしまうことがあります。',
      adjustment: '調和とは、自分を消すことではありません。あなたの気持ちも混ぜていいのです。',
      humanMessage: 'あなたが整えてきた場の中に、あなた自身の声は入っていましたか。今度はそこを大切にしてください。',
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
      humanMessage: 'それは罰ではありません。あなたを苦しめていた形が、もう続けられないと教えてくれているのです。',
      action: '今いちばん無理をしていることを一つだけ認めてください。認めるだけでも流れは変わります。'
    },
    '星': {
      essence: '希望、癒し、未来への光。まだ遠くても、進む先に光を見つけるカードです。',
      shadow: '希望を見るだけで現実の一歩が止まると、夢が遠いままになってしまいます。',
      adjustment: '希望を小さな行動として現実に置いてください。',
      humanMessage: '今はまだ遠く感じても、光は消えていません。あなたが見上げているその星は、ちゃんと道しるべになります。',
      action: '未来のために今日できる小さな行動を一つ選んでください。'
    },
    '月': {
      essence: '不安、直感、揺れる心。はっきりしない夜の中で、本音を探すカードです。',
      shadow: '想像が膨らむほど、不安を事実のように感じてしまうことがあります。',
      adjustment: '見えないものを怖がりすぎず、確認できることから整えてください。',
      humanMessage: '不安になるのは、あなたが弱いからではありません。大切だからこそ、心が先に揺れてしまうのです。',
      action: '不安を一つ書き、その横に「確認できること」を一つだけ書いてください。'
    },
    '太陽': {
      essence: '喜び、解放、生命力。心が明るさを取り戻すカードです。',
      shadow: '明るく進める時ほど、勢いで大切なことを見落としてしまうことがあります。',
      adjustment: '喜びを一時的な勢いで終わらせず、続けられる形に整えてください。',
      humanMessage: 'あなたが笑える時間は、ちゃんと戻ってきます。その光を、無理なく続く日常に置いていきましょう。',
      action: '今日うれしかったことを一つ残してください。小さな喜びが次の力になります。'
    },
    '審判': {
      essence: '目覚め、再出発、呼び戻される本当の自分。過去を越えて選び直すカードです。',
      shadow: '過去を思い出すほど、あの時できなかった自分を責めてしまうことがあります。',
      adjustment: '過去を責めるより、今なら選び直せることに意識を向けてください。',
      humanMessage: '遅すぎることはありません。あなたの中で眠っていた声が、もう一度立ち上がろうとしています。',
      action: '昔あきらめたこと、今なら少しできそうなことを一つ書いてください。'
    },
    '世界': {
      essence: '完成、統合、一区切り。ここまでの経験が一つの形になるカードです。',
      shadow: '完成に近づくほど、終わることへの寂しさや、次へ進む怖さが出ることがあります。',
      adjustment: '終わりにしがみつかず、ここまでの経験を持って次の循環へ進んでください。',
      humanMessage: 'あなたが積み重ねてきたものは、ちゃんと形になっています。終わりは喪失ではなく、次の扉でもあります。',
      action: 'ここまで頑張ったことを一つ認めて、次に進む準備を始めてください。'
    }
  };

  function safeText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
  }

  function compact(text) {
    return safeText(text)
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .trim();
  }

  function filterForbidden(text) {
    let result = safeText(text);

    bannedReplacements.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, replacement);
    });

    return result;
  }

  function normalizeCardKey(name) {
    const raw = safeText(name);

    const cleaned = raw
      .replace(/正位置|逆位置|upright|reversed/gi, '')
      .replace(/the/gi, '')
      .replace(/[ 　]/g, '')
      .replace(/^[0-9０-９]+[.．、:：\-_/]*/g, '')
      .replace(/^[IVXLCDMⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ]+[.．、:：\-_/]*/gi, '')
      .toLowerCase()
      .trim();

    if (TAROT_NAME_ALIASES[cleaned]) return TAROT_NAME_ALIASES[cleaned];

    const jaNames = Object.keys(SHION_TAROT_INSIGHTS);
    const direct = jaNames.find((n) => raw.includes(n));
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
      const found = Tarot.findTarotByName(name);
      if (found) return found;

      const normalized = normalizeCardKey(name);
      const foundByNormalized = Tarot.findTarotByName(normalized);
      if (foundByNormalized) return foundByNormalized;
    }

    return null;
  }

  function getTarotInsight(card, entryName) {
    const rawName = card && card.nameJa ? card.nameJa : entryName;
    const key = normalizeCardKey(rawName);

    return SHION_TAROT_INSIGHTS[key] || {
      essence: 'このカードは、今の心の流れを映し、現実を整えるための象徴として現れています。',
      shadow: '象徴の力が強く出すぎると、気持ちや行動に偏りが生まれることがあります。',
      adjustment: '良い・悪いで決めつけず、今どこを整えると自分らしさに戻れるのかを見てください。',
      humanMessage: 'カードは未来を縛るものではありません。今の心が見落としていた声を、そっと照らすものです。',
      action: '今いちばん気になることを一つだけ書き出し、今日できる小さな行動を選んでください。'
    };
  }

  function getTypeValue(type, key, fallback = '') {
    if (!type) return fallback;

    if (type[key]) return type[key];

    if (type.readingBlocks && type.readingBlocks[key]) {
      return type.readingBlocks[key];
    }

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

    return '今は、気持ち・状況・次の行動を分けて見つめることで、現実の流れを整えやすい時です。';
  }

  function formatMemo(input) {
    const memo = safeText(input && input.memo);

    if (!memo) {
      return '詳しい悩みメモは未入力です。だからこそ今回は、生年月日から見える星命の傾向を中心に、今の心が整いやすい方向を見ていきます。';
    }

    return `メモには「${memo}」とあります。

この言葉には、今の心が何を怖がっていて、何を大切にしたいのかが少し滲んでいます。
悩みは、弱さではありません。
本当は大切にしたいものがあるから、人は迷います。`;
  }

  function tarotLine(entry, index, positions) {
    if (!entry || !entry.name) return '';

    const card = findTarot(entry.name);
    const position = positions[index] || `カード${index + 1}`;
    const displayName = card && card.nameJa ? card.nameJa : normalizeCardKey(entry.name);
    const insight = getTarotInsight(card, displayName);

    const keywords = card && Array.isArray(card.uprightKeywords)
      ? card.uprightKeywords
      : [];

    const mappingMeaning = card && card.uprightMeaning
      ? card.uprightMeaning
      : '';

    const resonance = card && card.seimeiResonanceText
      ? card.seimeiResonanceText
      : 'このカードは、今の星命タイプが持つ力を現実へ落とし込むための補助線になります。';

    const actionAdvice = card && card.actionAdvice
      ? card.actionAdvice
      : insight.action;

    return compact(
`${position}：${displayName}

象徴：
${keywords.length ? keywords.join('、') : insight.essence}

本質：
${insight.essence}

${mappingMeaning ? `補助解釈：\n${mappingMeaning}\n` : ''}影として出やすいこと：
${insight.shadow}

整えるポイント：
${insight.adjustment}

心への言葉：
${insight.humanMessage}

星命との共鳴：
${resonance}

今できる行動：
${actionAdvice || insight.action}`
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

ここに出ている言葉は、あなたを決めつけるためのものではありません。
今の心がどこで疲れていて、どこにまだ光が残っているのか。
それを一緒に見つけるための鑑定です。`
    );
  }

  function buildSanmeiSection(ctx) {
    return compact(
`1. 生年月日から見える、あなたの芯

${ctx.birthDate}の簡易日柱は、${ctx.dayName}（${ctx.dayLabel}）です。

この日干は、あなたが無意識に大切にしている「生き方の芯」を映しています。
頑張ろうとする時、傷ついた時、誰かを大切にしたい時。
ふと表に出てくる心の癖のようなものです。

日干は${ctx.dayStem}。
五行では${ctx.element}、陰陽では${ctx.yinYang}の性質を持ち、象徴は「${ctx.symbol}」です。

この星には、
「${ctx.sanmeiEssence}」
という本質が出やすくなります。

ただし、
「${ctx.caution}」
が強く出ると、気づかないうちに心が硬くなったり、無理を重ねやすくなります。

${ctx.deep ? `${ctx.deep}\n` : ''}ここで大切なのは、弱点として責めることではありません。
その性質が強く出た時に、どう整えれば自分らしく戻れるかを見ることです。`
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

だから今必要なのは、自分を責めることではなく、
その力を、もう一度あなた自身の味方に戻すことです。`
    );
  }

  function buildTopicSection(ctx) {
    return compact(
`3. 「${ctx.topic}」についての見立て

${ctx.memoText}

${ctx.topicText}

今の悩みは、すぐに白黒をつけるよりも、
「事実」
「感情」
「次にできる行動」
を分けて見つめると、心が少し落ち着きやすくなります。

感情は間違いではありません。
けれど、感情だけで未来を決めなくても大丈夫です。`
    );
  }

  function buildThemeSection(ctx) {
    return compact(
`4. テーマ別に見たあなたの流れ

恋愛：
${ctx.love}

仕事：
${ctx.work}

金運：
${ctx.money}

人間関係：
${ctx.relationship}

どのテーマでも共通しているのは、あなたが自分の気持ちを置き去りにしないことです。

誰かのために頑張る力がある人ほど、
自分の小さな違和感を後回しにしやすいものです。

その違和感は、わがままではありません。
あなたの心が「少し整えてほしい」と知らせている声です。`
    );
  }

  function buildTarotSection(ctx) {
    return compact(
`5. タロットからのメッセージ

詩韻式では、タロットの逆位置は採用しません。
すべてのカードを、正位置の象徴として読みます。

ただし、すべてを良い意味だけには読みません。

一枚のカードの中には、
光も、影も、偏りも、整えるための鍵もあります。

カードは怖がらせるものではありません。
今のあなたが見落としている心の声を、そっと映してくれる鏡です。

${ctx.tarotText}`
    );
  }

  function buildActionSection(ctx) {
    return compact(
`6. 今やるべきこと

今のあなたに必要なのは、全部を一度に変えることではありません。

まずは、次の三つだけで大丈夫です。

- いま一番気になっていることを、一文で書く
- それが「事実」なのか「想像」なのかを分ける
- 今日できる小さな確認を一つだけ選ぶ

そして、もう一つだけ。

${ctx.advice}

大きな決断は、心が少し落ち着いてからで大丈夫です。
焦って答えを出すより、整った状態で選ぶ方が、未来はやさしく変わります。`
    );
  }

  function buildClosingSection(ctx) {
    return compact(
`7. 最後の一言

${ctx.message}

${ctx.reassurance}

ここまで読んで、少しでも胸に残る言葉があったなら、
それが今のあなたに必要な星の声です。

大丈夫だよ。
あなたの未来は、怖がらせるためではなく、整えるために開かれていきます。`
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
        'あなたの星命には、今の自分を整えながら未来へ進む力が宿っています。'
      ),
      hook: getTypeValue(
        type,
        'hook',
        'あなたは、自分の中にある本音を少しずつ言葉にしていくことで流れが整いやすい方です。'
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
      sanmeiEssence: safeText(sanmeiReference.essence, '本質を整える力'),
      caution: safeText(sanmeiReference.caution, '無理をしすぎないこと'),
      deep: safeText(sanmeiReference.deep, ''),

      typeName: safeText(type.name, '星命タイプ'),
      subTypeName: safeText(subType.name, '補助タイプ'),
      typeShortTitle: safeText(type.shortTitle, 'その人らしい光を持つ星命'),
      strength: getTypeValue(
        type,
        'strength',
        type.essence || '今ある力を、現実の小さな行動へ変えていける力'
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
        '仕事では、自分の役割と条件を整理することで、力を注ぐ場所が見えやすくなります。'
      ),
      money: getTypeValue(
        type,
        'money',
        '金運では、不安で動くより、お金の流れを見える形に整えることが安心につながります。'
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
        '今日できる小さな一歩を一つだけ決めてください。'
      ),
      message: getTypeValue(
        type,
        'message',
        '星の言葉は、現実を整えるためのやさしい光です。'
      ),
      reassurance: getTypeValue(
        type,
        'reassurance',
        '大丈夫だよ。小さく整えれば、光は戻ってきます。'
      )
    };
  }

  function buildFutureSection(input, chart, tarotEntries, futureScores, futureReading) {
    const text = safeText(
      futureReading || (MonthlyReading && typeof MonthlyReading.buildFutureReading === 'function'
        ? MonthlyReading.buildFutureReading(input, chart, tarotEntries, futureScores || [])
        : '')
    );

    if (!text) {
      return compact(
`4. 今年の総合運

未来鑑定は、鑑定対象年と月別スコアを重ねることで表示されます。
今は本質と現在のテーマを中心に、次の小さな一歩を整えていきます。`
      );
    }

    return text;
  }

  function buildCoreReading(input, chart, tarotEntries, futureScores, futureReading) {
    const ctx = createContext(input, chart, tarotEntries);

    return compact(
      [
        buildOpeningSection(ctx),
        buildSanmeiSection(ctx),
        buildSeimeiSection(ctx),
        buildTopicSection(ctx),
        buildFutureSection(input, chart, tarotEntries, futureScores, futureReading),
        buildTarotSection(ctx),
        buildActionSection(ctx),
        buildClosingSection(ctx)
      ].join('\n\n')
    );
  }

  function generateReading(input, chart, tarotEntries = [], futureScores = [], futureReading = '') {
    const text = buildCoreReading(input, chart, tarotEntries, futureScores, futureReading);
    return filterForbidden(text);
  }

  function polishShionStyle(text) {
    let polished = compact(filterForbidden(text));

    if (!polished) {
      polished =
        '今は、心の中にある不安や迷いを少しずつ言葉にしていく時です。焦らず、事実と感情を分けながら、次の小さな一歩を見つけていきましょう。';
    }

    if (!polished.startsWith('まずは') && !polished.includes('へ\n\n')) {
      polished =
        `まずは、ここまで向き合ってきたご自身を責めずにいてください。\n` +
        `星の言葉を、現実を整える道しるべとして一緒に見ていきます。\n\n` +
        polished;
    }

    if (!/今やるべきこと|今できること/.test(polished)) {
      polished +=
        '\n\n今できること\n' +
        '- 心配を一つ紙に書き出す\n' +
        '- 事実と想像を分ける\n' +
        '- 次の小さな行動を一つだけ決める';
    }

    if (!/大丈夫だよ。?$/.test(polished)) {
      polished += '\n\n小さく整えれば、光は戻ってきます。大丈夫だよ。';
    }

    return filterForbidden(compact(polished));
  }

  return {
    filterForbidden,
    generateReading,
    polishShionStyle,
    tarotLine,
    buildTarotText
  };
});
