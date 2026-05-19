(function (root, factory) {
  let tarot78 = root.ShionTarot78;

  if (typeof require === 'function' && (!tarot78 || typeof module !== 'undefined')) {
    try {
      tarot78 = require('./tarot-78.js');
    } catch (error) {
      tarot78 = null;
    }
  }

  const data = factory(tarot78 || {});

  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  root.ShionTarotMapping = data;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (Tarot78) {
  'use strict';

  const ELEMENT_TEXT = {
    木: '伸びていく力。始めること、育てること、未来へ向かう意志を表します。',
    火: '心に火を灯す力。行動、表現、情熱、前へ出る勇気を表します。',
    土: '現実に根を張る力。生活、責任、安定、積み重ねを表します。',
    金: '切り分ける力。判断、整理、決断、不要なものを手放す意志を表します。',
    水: '心を受け取る力。感情、直感、癒し、まだ言葉にならない本音を表します。'
  };

  const FALLBACK_MAJORS = [
    {
      id: 'fool',
      number: 0,
      nameJa: '愚者',
      nameEn: 'The Fool',
      element: '木',
      keywords: ['自由', '始まり', '可能性'],
      essence: 'まだ形になっていない未来へ、怖さを抱えながらも一歩を出そうとしている時です。',
      shadow: '自由でいたい気持ちが強くなるほど、現実の確認を後回しにしやすくなります。',
      adjustment: '勢いだけで決めず、「どこへ向かいたいのか」を一つだけ言葉にしてください。',
      humanMessage: '怖いのに進みたいなら、それは無謀ではありません。心が新しい景色を求めているサインです。',
      action: 'やってみたいことを一つだけ書き出してください。大きく始めなくて大丈夫です。'
    },
    {
      id: 'magician',
      number: 1,
      nameJa: '魔術師',
      nameEn: 'The Magician',
      element: '木',
      keywords: ['創造', '意志', '実行'],
      essence: '手元にあるものを使って、思いを現実へ移していく合図です。',
      shadow: '準備ばかり増えて、実際に出すことが怖くなる時があります。',
      adjustment: '完璧を待つより、まず一つだけ形にしてみてください。',
      humanMessage: 'あなたの中には、もう材料があります。足りないものより、今あるものの使い方を見てください。',
      action: '考えていることを一つ、投稿・連絡・メモ・作業のどれかに変えてください。'
    },
    {
      id: 'high-priestess',
      number: 2,
      nameJa: '女教皇',
      nameEn: 'The High Priestess',
      element: '水',
      keywords: ['直感', '静けさ', '洞察'],
      essence: '言葉になる前の違和感や、本当は気づいている答えを映しています。',
      shadow: '感じ取る力が強いぶん、確認しないまま不安な結論を作ってしまうことがあります。',
      adjustment: '直感を大切にしながらも、事実と言葉で確かめてください。',
      humanMessage: '違和感は無視しなくて大丈夫です。ただ、怖い結論に急がなくても大丈夫です。',
      action: '「実際に起きたこと」と「自分が感じたこと」を分けて書いてください。'
    },
    {
      id: 'empress',
      number: 3,
      nameJa: '女帝',
      nameEn: 'The Empress',
      element: '木',
      keywords: ['愛情', '育成', '豊かさ'],
      essence: '愛情や安心を育て、自分にも相手にも温かさを戻していく時です。',
      shadow: '与えることに慣れすぎると、自分の疲れに気づくのが遅れます。',
      adjustment: '誰かを満たす前に、自分の心と身体にも栄養を戻してください。',
      humanMessage: 'あなたの優しさは、誰かを包む力になります。でも、空っぽになるまで与えなくていいのです。',
      action: '今日は自分のための休息を一つ入れてください。温かい飲み物でも十分です。'
    },
    {
      id: 'emperor',
      number: 4,
      nameJa: '皇帝',
      nameEn: 'The Emperor',
      element: '土',
      keywords: ['責任', '決断', '土台'],
      essence: '守りたいもののために、現実的な土台を作ろうとしている時です。',
      shadow: '責任感が強くなるほど、全部を自分で背負おうとして心が硬くなりやすいです。',
      adjustment: '支配するより、安心できる仕組みを作ることが大切です。',
      humanMessage: '本当の強さは、何も頼らないことではありません。背負い方を見直すことも強さです。',
      action: '今日やることを三つに絞ってください。残りは後日に回して大丈夫です。'
    },
    {
      id: 'hierophant',
      number: 5,
      nameJa: '教皇',
      nameEn: 'The Hierophant',
      element: '土',
      keywords: ['信頼', '学び', '導き'],
      essence: '信頼できる言葉や人とのつながりから、自分の道を見つける時です。',
      shadow: '正しさや常識を大切にしすぎて、自分の本音を後回しにすることがあります。',
      adjustment: '「こうあるべき」だけでなく、「本当はどうしたいか」も見てください。',
      humanMessage: '誠実でいることと、我慢し続けることは同じではありません。',
      action: '信頼できる人に、今の気持ちを一言だけ話してみてください。'
    },
    {
      id: 'lovers',
      number: 6,
      nameJa: '恋人',
      nameEn: 'The Lovers',
      element: '木',
      keywords: ['選択', '関係', '心の一致'],
      essence: '相手に選ばれるかではなく、自分が何を選びたいのかを問われています。',
      shadow: '選ばれたい気持ちが強くなると、自分の本当の望みが見えにくくなります。',
      adjustment: '相手の気持ちだけでなく、自分が安心できるかも見てください。',
      humanMessage: '愛されるかどうかだけではなく、あなた自身がその関係を選びたいかも大切です。',
      action: 'その関係で「嬉しいこと」と「苦しいこと」を一つずつ書き出してください。'
    },
    {
      id: 'chariot',
      number: 7,
      nameJa: '戦車',
      nameEn: 'The Chariot',
      element: '火',
      keywords: ['前進', '集中', '突破'],
      essence: '迷いを抱えたままでも、目的地を決めて進もうとしている時です。',
      shadow: '早く結果を出したくて、自分や相手を急かしてしまうことがあります。',
      adjustment: '勢いより方向です。どこへ向かうのかを先に決めてください。',
      humanMessage: '進む力はあります。だからこそ、焦りではなく意志でハンドルを握りましょう。',
      action: '今週中に進めることを一つ決め、具体的な日時を入れてください。'
    },
    {
      id: 'strength',
      number: 8,
      nameJa: '力',
      nameEn: 'Strength',
      element: '火',
      keywords: ['勇気', '忍耐', '優しさ'],
      essence: '力で押し切るのではなく、揺れる心と丁寧に向き合う時です。',
      shadow: '耐えられる人ほど、つらさを「まだ大丈夫」と片づけてしまうことがあります。',
      adjustment: '強い人にも休む場所が必要です。我慢だけで越えようとしないでください。',
      humanMessage: 'ここまで耐えてきたことには意味があります。でも、これ以上ひとりで抱えなくてもいいのです。',
      action: '我慢していることを一つだけ言葉にしてください。紙に書くだけでも大丈夫です。'
    },
    {
      id: 'hermit',
      number: 9,
      nameJa: '隠者',
      nameEn: 'The Hermit',
      element: '水',
      keywords: ['内省', '探求', '答え'],
      essence: '外の声を少し離れ、自分の中に残っている答えを探す時です。',
      shadow: '考え込むほど、一人で抱えてしまい、誰にも届かない場所に入り込みやすくなります。',
      adjustment: '一人の時間は大切です。ただ、必要な言葉まで閉じ込めないでください。',
      humanMessage: '沈黙の中に答えはあります。でも、その答えを自分だけで背負わなくても大丈夫です。',
      action: '今考えていることを三行だけ書き出してください。頭の外へ出すだけで道が見えます。'
    },
    {
      id: 'wheel',
      number: 10,
      nameJa: '運命の輪',
      nameEn: 'Wheel of Fortune',
      element: '水',
      keywords: ['転機', '循環', 'タイミング'],
      essence: '止まっていたものが少しずつ動き始め、状況の向きが変わる時です。',
      shadow: '流れに任せすぎると、自分がどうしたいのかを見失いやすくなります。',
      adjustment: '偶然を待つだけでなく、どの流れに乗るかを自分で選んでください。',
      humanMessage: '置いていかれるのではありません。今は、選んで乗っていく時です。',
      action: '最近起きた小さな変化を一つ書き出し、それをどう活かすか考えてください。'
    },
    {
      id: 'justice',
      number: 11,
      nameJa: '正義',
      nameEn: 'Justice',
      element: '金',
      keywords: ['判断', '均衡', '誠実'],
      essence: '感情と現実を並べて、自分にとって納得できる選択を探す時です。',
      shadow: '正しいかどうかに寄りすぎると、心の痛みや苦しさを切り捨ててしまうことがあります。',
      adjustment: '冷静な判断に、心の納得も加えてください。',
      humanMessage: '苦しさも、大切な判断材料です。無視しなくて大丈夫です。',
      action: 'メリット・デメリットだけでなく、「自分の心がどう感じるか」も書いてください。'
    },
    {
      id: 'hanged-man',
      number: 12,
      nameJa: '吊るされた男',
      nameEn: 'The Hanged Man',
      element: '水',
      keywords: ['停止', '受容', '視点転換'],
      essence: '思うように動けない時間の中で、見方を変えるきっかけが来ています。',
      shadow: '我慢に意味を持たせようとして、苦しさを正当化してしまうことがあります。',
      adjustment: '無理に進むより、別の角度から見てみてください。',
      humanMessage: '止まっているように見える時間にも、心はちゃんと何かを学んでいます。',
      action: '今の状況を、別の人から相談されたつもりで見直してください。'
    },
    {
      id: 'death',
      number: 13,
      nameJa: '死神',
      nameEn: 'Death',
      element: '金',
      keywords: ['区切り', '手放し', '再生'],
      essence: 'もう合わなくなった形を終わらせ、次の自分へ戻るための区切りです。',
      shadow: '終わりが近づくほど、すべてを失うように感じて怖くなることがあります。',
      adjustment: '全部を捨てる必要はありません。残すものと手放すものを分けてください。',
      humanMessage: '終わりは罰ではありません。次の自分に戻るための区切りです。',
      action: '残したいものと、もう苦しくなっているものを一つずつ書いてください。'
    },
    {
      id: 'temperance',
      number: 14,
      nameJa: '節制',
      nameEn: 'Temperance',
      element: '水',
      keywords: ['調和', '回復', 'なじませる'],
      essence: '違うものを無理なくなじませ、心と現実を回復させていく時です。',
      shadow: '場を保とうとするほど、自分だけが我慢して合わせてしまうことがあります。',
      adjustment: '調和とは、自分を消すことではありません。あなたの気持ちも入れてください。',
      humanMessage: 'あなたが合わせてきた場の中に、あなた自身の声は入っていましたか。',
      action: '自分が譲っていることを一つ見つけ、本当はどうしたいかを書いてください。'
    },
    {
      id: 'devil',
      number: 15,
      nameJa: '悪魔',
      nameEn: 'The Devil',
      element: '土',
      keywords: ['執着', '欲求', '本音'],
      essence: '離れられない感情の奥にある、寂しさや本音が見えやすい時です。',
      shadow: '欲しい、認められたい、離れたくない気持ちが強くなり、自分でも苦しくなることがあります。',
      adjustment: '欲を責めるより、その奥にある不安や寂しさを見てください。',
      humanMessage: '執着は弱さではありません。心が何かを強く求めているサインです。',
      action: '手放せないものが、安心・承認・愛情のどれに近いか考えてください。'
    },
    {
      id: 'tower',
      number: 16,
      nameJa: '塔',
      nameEn: 'The Tower',
      element: '金',
      keywords: ['気づき', '崩れる形', '再構築'],
      essence: '無理に積み上げてきたものが崩れ、本当は苦しかった部分が見えています。',
      shadow: '急な変化を、すべてが終わったように感じてしまうことがあります。',
      adjustment: '崩れたものだけでなく、なぜ無理が積み上がっていたのかを見てください。',
      humanMessage: 'それは罰ではありません。もう続けられない形に、心が気づいたのです。',
      action: '今いちばん無理をしていることを一つだけ認めてください。'
    },
    {
      id: 'star',
      number: 17,
      nameJa: '星',
      nameEn: 'The Star',
      element: '木',
      keywords: ['希望', '癒し', '未来'],
      essence: 'まだ遠く感じる未来に、進むための希望を見つける時です。',
      shadow: '希望を見るだけで安心してしまうと、現実の一歩が止まりやすくなります。',
      adjustment: '希望を、今日できる行動に落としてください。',
      humanMessage: '今はまだ遠く感じても、光は消えていません。',
      action: '未来のために、今日できる行動を一つ選んでください。'
    },
    {
      id: 'moon',
      number: 18,
      nameJa: '月',
      nameEn: 'The Moon',
      element: '水',
      keywords: ['不安', '直感', '確認'],
      essence: 'はっきりしない状況の中で、不安と本音を見分ける時です。',
      shadow: '想像が膨らむほど、不安を事実のように感じてしまうことがあります。',
      adjustment: '見えないものを怖がりすぎず、確認できることから見てください。',
      humanMessage: '不安になるのは弱いからではありません。大切だからこそ、心が先に揺れるのです。',
      action: '不安を一つ書き、その横に「確認できること」を一つだけ書いてください。'
    },
    {
      id: 'sun',
      number: 19,
      nameJa: '太陽',
      nameEn: 'The Sun',
      element: '火',
      keywords: ['喜び', '解放', '成果'],
      essence: '心が明るさを取り戻し、自分らしく進みやすくなる時です。',
      shadow: '明るく動ける時ほど、勢いで大切な確認を飛ばしてしまうことがあります。',
      adjustment: '喜びを一時的な勢いで終わらせず、続けられる形にしてください。',
      humanMessage: '笑える時間は、ちゃんと戻ってきます。その光を受け取って大丈夫です。',
      action: '今日うれしかったことを一つ残してください。'
    },
    {
      id: 'judgement',
      number: 20,
      nameJa: '審判',
      nameEn: 'Judgement',
      element: '火',
      keywords: ['再出発', '目覚め', '選び直し'],
      essence: '過去を責め続けるのではなく、今からもう一度選び直す時です。',
      shadow: '昔の後悔が強くなると、今の自分まで責めてしまうことがあります。',
      adjustment: '過去を責めるより、今なら選び直せることを見てください。',
      humanMessage: '遅すぎることはありません。眠っていた声が、もう一度立ち上がろうとしています。',
      action: '昔あきらめたことの中で、今なら少しできそうなことを書いてください。'
    },
    {
      id: 'world',
      number: 21,
      nameJa: '世界',
      nameEn: 'The World',
      element: '土',
      keywords: ['完成', '統合', '一区切り'],
      essence: 'ここまでの経験が一つの形になり、次の扉が見えてくる時です。',
      shadow: '一区切りが近づくほど、終わる寂しさや次へ進む怖さが出ることがあります。',
      adjustment: '終わりにしがみつかず、ここまでの経験を次へ持っていきましょう。',
      humanMessage: '積み重ねてきたものは、ちゃんと形になっています。終わりは喪失ではなく、次の扉でもあります。',
      action: 'ここまで頑張ったことを一つ認めて、次に持っていくものを決めてください。'
    }
  ];

  const SPREAD_POSITIONS = {
    1: ['今のメッセージ'],
    2: ['今の流れ', '見直す鍵'],
    3: ['今の流れ', '心の奥', '進む道'],
    4: ['現状', '心の奥', '課題', '未来への一歩'],
    5: ['現状', '心の奥', '課題', '助けになる力', '未来への一歩']
  };

  const ELEMENT_TAROT_RESONANCE = {
    木: ['愚者', '魔術師', '女帝', '恋人', '星'],
    火: ['戦車', '力', '太陽', '審判'],
    土: ['皇帝', '教皇', '悪魔', '世界'],
    金: ['正義', '死神', '塔'],
    水: ['女教皇', '隠者', '運命の輪', '吊るされた男', '節制', '月']
  };

  function safeText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    const text = String(value).trim();
    return text === '' ? fallback : text;
  }

  function normalizeName(name) {
    return safeText(name)
      .toLowerCase()
      .replace(/正位置|逆位置|upright|reversed/gi, '')
      .replace(/\bthe\b/gi, '')
      .replace(/[ 　]/g, '')
      .replace(/[・.．、:：\-_/]/g, '')
      .trim();
  }

  function unique(values) {
    const result = [];

    (Array.isArray(values) ? values : []).forEach(function (value) {
      if (value && result.indexOf(value) === -1) {
        result.push(value);
      }
    });

    return result;
  }

  function majorTopicSentence(nameJa, focus) {
    return `${nameJa}は、「${focus}」について今のあなたに必要な視点を映します。答えを急ぐより、心がどこで反応しているのかを見てください。`;
  }

  function getTarot78MajorCards() {
    if (!Tarot78 || !Array.isArray(Tarot78.TAROT_78_CARDS)) return [];

    return Tarot78.TAROT_78_CARDS.filter(function (card) {
      return card && card.category === 'major';
    });
  }

  function findFallbackMajorByName(name) {
    const key = normalizeName(name);

    return FALLBACK_MAJORS.find(function (card) {
      return normalizeName(card.nameJa) === key ||
        normalizeName(card.nameEn) === key ||
        normalizeName(card.id) === key;
    }) || null;
  }

  function findFallbackMajorByNumber(number) {
    const target = Number(number);

    return FALLBACK_MAJORS.find(function (card) {
      return card.number === target;
    }) || null;
  }

  function createAliases(card) {
    const aliases = [
      card.id,
      card.nameJa,
      card.nameEn,
      String(card.number),
      `${card.number}.${card.nameJa}`,
      `${card.number} ${card.nameJa}`
    ];

    if (card.nameEn === 'Wheel of Fortune') aliases.push('wheeloffortune');
    if (card.nameEn === 'The High Priestess') aliases.push('highpriestess');
    if (card.nameEn === 'The Hanged Man') aliases.push('hangedman');
    if (card.nameEn === 'Judgement') aliases.push('judgment');

    return unique(aliases);
  }

  function createCard(source) {
    const fallback =
      findFallbackMajorByName(source && source.nameJa) ||
      findFallbackMajorByNumber(source && source.number) ||
      source ||
      {};

    const id = safeText(source && source.id, fallback.id);
    const number = Number.isFinite(Number(source && source.number))
      ? Number(source.number)
      : Number(fallback.number);

    const nameJa = safeText(source && source.nameJa, fallback.nameJa);
    const nameEn = safeText(source && source.nameEn, fallback.nameEn);
    const element = safeText(source && source.element, fallback.element);

    const keywords = unique(
      (Array.isArray(source && source.keywords) && source.keywords.length
        ? source.keywords
        : Array.isArray(source && source.uprightKeywords) && source.uprightKeywords.length
          ? source.uprightKeywords
          : fallback.keywords) || []
    );

    const essence = safeText(source && source.uprightMeaning, fallback.essence);
    const shadow = safeText(source && source.shadow, fallback.shadow);
    const adjustment = safeText(source && source.adjustment, fallback.adjustment);
    const humanMessage = safeText(source && source.humanMessage, fallback.humanMessage || essence);
    const action = safeText(source && source.actionAdvice, fallback.action);

    const card = {
      id,
      category: 'major',
      number,
      rank: null,
      suit: null,
      element,
      nameJa,
      nameEn,
      keywords,
      uprightKeywords: keywords,

      uprightMeaning: essence,
      reversedKeywords: [],
      reversedMeaning: '詩韻式では逆位置を採用しません。正位置の中にある光・影・見直す鍵として読みます。',

      loveMeaning: safeText(
        source && source.loveMeaning,
        majorTopicSentence(nameJa, '心の選択や関係の向き合い方')
      ),
      workMeaning: safeText(
        source && source.workMeaning,
        majorTopicSentence(nameJa, '仕事の方向性や役割の選び方')
      ),
      moneyMeaning: safeText(
        source && source.moneyMeaning,
        majorTopicSentence(nameJa, 'お金との向き合い方や安心の作り方')
      ),
      relationshipMeaning: safeText(
        source && source.relationshipMeaning,
        majorTopicSentence(nameJa, '人との距離感や信頼の置き方')
      ),

      timingMeaning: safeText(
        source && source.timingMeaning,
        `${nameJa}は、意識が切り替わりやすい時期を示します。焦って答えを出すより、今起きている変化を落ち着いて見てください。`
      ),
      personImage: safeText(
        source && source.personImage,
        `${keywords[0] || '気づき'}を通して、今の状況に必要な視点を運ぶ人物像です。`
      ),

      light: safeText(source && source.light, essence),
      shadow,
      adjustment: safeText(
        adjustment,
        '良い・悪いで決めつけず、今の自分に必要な見直しを一つ選んでください。'
      ),
      humanMessage,
      actionAdvice: action,
      caution: safeText(
        source && source.caution,
        '未来を断定せず、今の気持ち・現実・次の行動を分けて読んでください。'
      ),

      elementResonance: {
        element,
        text: ELEMENT_TEXT[element] || '今の心と現実を結び直す力'
      },

      seimeiResonanceText: safeText(
        source && source.seimeiResonanceText,
        `${nameJa}は星命タイプを決めるカードではありません。今の課題、心の反応、次に取る行動と共鳴する補助線です。`
      )
    };

    card.aliases = createAliases(card);
    return card;
  }

  const tarot78Majors = getTarot78MajorCards();

  const TAROT_CARDS = (tarot78Majors.length ? tarot78Majors : FALLBACK_MAJORS)
    .map(createCard)
    .sort(function (a, b) {
      return a.number - b.number;
    });

  function findTarotByName(name) {
    const key = normalizeName(name);

    if (!key) return null;

    return TAROT_CARDS.find(function (card) {
      if (normalizeName(card.nameJa) === key) return true;
      if (normalizeName(card.nameEn) === key) return true;
      if (normalizeName(card.id) === key) return true;

      return Array.isArray(card.aliases) && card.aliases.some(function (alias) {
        return normalizeName(alias) === key;
      });
    }) || null;
  }

  function findTarotById(id) {
    const key = normalizeName(id);

    return TAROT_CARDS.find(function (card) {
      return normalizeName(card.id) === key;
    }) || null;
  }

  function getTarotByNumber(number) {
    const target = Number(number);

    return TAROT_CARDS.find(function (card) {
      return card.number === target;
    }) || null;
  }

  function getTarotByElement(element) {
    const target = safeText(element);

    return TAROT_CARDS.filter(function (card) {
      return card.element === target;
    });
  }

  function getResonantCardsByElement(element) {
    const names = ELEMENT_TAROT_RESONANCE[element] || [];

    return names
      .map(findTarotByName)
      .filter(Boolean);
  }

  function getAllTarotCards() {
    return TAROT_CARDS.slice();
  }

  return {
    TAROT_CARDS,
    SPREAD_POSITIONS,
    ELEMENT_TAROT_RESONANCE,
    ELEMENT_TEXT,

    findTarotByName,
    findTarotById,
    getTarotByNumber,
    getTarotByElement,
    getResonantCardsByElement,
    getAllTarotCards,

    normalizeName
  };
});
