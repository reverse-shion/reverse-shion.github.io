(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionTarot78 = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const SUITS = {
    wands: {
      ja: 'ワンド',
      en: 'Wands',
      element: '火',
      theme: '行動・情熱・発信',
      loveFocus: '気持ちをどう伝えるか',
      workFocus: '動き出す力と発信の仕方',
      moneyFocus: '収入につながる行動力',
      relationFocus: '勢いと距離感の扱い方',
      personTone: '熱量があり、自分から場を動かす人'
    },
    cups: {
      ja: 'カップ',
      en: 'Cups',
      element: '水',
      theme: '感情・愛情・受容',
      loveFocus: '心のつながりと安心感',
      workFocus: '気持ちを大切にした働き方',
      moneyFocus: '満たされ方とお金の使い方',
      relationFocus: '共感と気持ちの受け渡し',
      personTone: '感情に寄り添い、相手の気持ちを受け取る人'
    },
    swords: {
      ja: 'ソード',
      en: 'Swords',
      element: '風',
      theme: '思考・判断・言葉',
      loveFocus: '言葉のすれ違いと本音の確認',
      workFocus: '判断力、情報整理、言葉の使い方',
      moneyFocus: '冷静な判断とリスク確認',
      relationFocus: '誤解を減らす対話',
      personTone: '頭の回転が早く、言葉で状況を切り分ける人'
    },
    pentacles: {
      ja: 'ペンタクル',
      en: 'Pentacles',
      element: '土',
      theme: '現実・仕事・お金',
      loveFocus: '安心できる関係を現実に育てること',
      workFocus: '積み重ね、評価、安定した成果',
      moneyFocus: '収入、支出、生活の土台',
      relationFocus: '信頼を時間をかけて育てること',
      personTone: '現実感があり、結果を少しずつ積み上げる人'
    }
  };

  const MAJORS = [
    {
      number: 0,
      nameJa: '愚者',
      nameEn: 'The Fool',
      keywords: ['自由', '始まり', '可能性'],
      essence: 'まだ名前もついていない未来へ、怖さを抱えながらも一歩を出そうとするカードです。',
      shadow: '自由でいたい気持ちが強くなるほど、現実の確認を後回しにして、ふわふわした不安を残しやすくなります。',
      action: '「やってみたい」と思うことを、まず一つだけ紙に書いてください。大きく動かなくて大丈夫です。'
    },
    {
      number: 1,
      nameJa: '魔術師',
      nameEn: 'The Magician',
      keywords: ['創造', '意志', '実行'],
      essence: 'あなたの手元にあるものを使って、思いを現実へ変えていくカードです。',
      shadow: '準備ばかり増えて、実際に出すことが怖くなる時があります。完璧を待つほど、最初の一歩が重くなります。',
      action: '考えていることを一つ、投稿・連絡・メモ・作業のどれかに変えてください。形にした瞬間から動き始めます。'
    },
    {
      number: 2,
      nameJa: '女教皇',
      nameEn: 'The High Priestess',
      keywords: ['直感', '静けさ', '洞察'],
      essence: '言葉になる前の違和感や、本当は気づいている答えをそっと映すカードです。',
      shadow: '感じ取る力が強いぶん、確認しないまま不安な結論を作ってしまうことがあります。',
      action: '「実際に起きたこと」と「自分が感じたこと」を分けて書いてください。そこから答えが見えやすくなります。'
    },
    {
      number: 3,
      nameJa: '女帝',
      nameEn: 'The Empress',
      keywords: ['愛情', '育成', '豊かさ'],
      essence: '愛情や安心を育て、自分にも相手にも温かさを戻していくカードです。',
      shadow: '与えることに慣れすぎると、自分が疲れていることに気づくのが遅れます。',
      action: '今日は誰かのためではなく、自分のための休息を一つ入れてください。温かい飲み物でも十分です。'
    },
    {
      number: 4,
      nameJa: '皇帝',
      nameEn: 'The Emperor',
      keywords: ['責任', '決断', '土台'],
      essence: '守りたいもののために、現実的な土台を作っていくカードです。',
      shadow: '責任感が強くなるほど、全部を自分で背負おうとして、心が硬くなりやすいです。',
      action: '今日やることを三つに絞ってください。背負う量を減らすことも、ちゃんと強さです。'
    },
    {
      number: 5,
      nameJa: '教皇',
      nameEn: 'The Hierophant',
      keywords: ['信頼', '学び', '導き'],
      essence: '信頼できる言葉や人とのつながりから、自分の道を見つけるカードです。',
      shadow: '正しさや常識を大切にしすぎて、自分の本音を後回しにすることがあります。',
      action: '信頼できる人に、今の気持ちを一言だけ話してみてください。抱え込まないことが次の鍵です。'
    },
    {
      number: 6,
      nameJa: '恋人',
      nameEn: 'The Lovers',
      keywords: ['選択', '関係', '心の一致'],
      essence: '相手に選ばれるかではなく、自分が心から選びたいと思えるかを問うカードです。',
      shadow: '選ばれたい気持ちが強くなると、自分の本当の望みが見えにくくなります。',
      action: 'その関係で「嬉しいと感じること」と「苦しいと感じること」を、一つずつ書き出してください。'
    },
    {
      number: 7,
      nameJa: '戦車',
      nameEn: 'The Chariot',
      keywords: ['前進', '集中', '突破'],
      essence: '迷いを抱えたままでも、目的地を決めて進もうとするカードです。',
      shadow: '早く結果を出したくて、自分や相手を急かしてしまうことがあります。',
      action: '今週中に進めることを一つだけ決めて、具体的な日時を入れてください。勢いより方向が大切です。'
    },
    {
      number: 8,
      nameJa: '力',
      nameEn: 'Strength',
      keywords: ['勇気', '忍耐', '優しさ'],
      essence: '力で押し切るのではなく、揺れる心と丁寧に向き合うカードです。',
      shadow: '耐えられる人ほど、つらさを「まだ大丈夫」と片づけてしまうことがあります。',
      action: '我慢していることを一つだけ言葉にしてください。誰かに言えないなら、紙に書くだけでも大丈夫です。'
    },
    {
      number: 9,
      nameJa: '隠者',
      nameEn: 'The Hermit',
      keywords: ['内省', '探求', '答え'],
      essence: '外の声を少し離れ、自分の中に残っている本当の答えを探すカードです。',
      shadow: '考え込むほど、一人で抱えてしまい、誰にも届かない場所に入り込みやすくなります。',
      action: '今考えていることを三行だけ書き出してください。頭の中から外へ出すだけで、道が見えます。'
    },
    {
      number: 10,
      nameJa: '運命の輪',
      nameEn: 'Wheel of Fortune',
      keywords: ['転機', '循環', 'タイミング'],
      essence: '止まっていたものが動き始め、状況の向きが変わるカードです。',
      shadow: '流れに任せすぎると、自分がどうしたいのかを見失いやすくなります。',
      action: '最近起きた小さな変化を一つ書いてください。それをどう活かすかが、次の分かれ道になります。'
    },
    {
      number: 11,
      nameJa: '正義',
      nameEn: 'Justice',
      keywords: ['判断', '均衡', '誠実'],
      essence: '感情と現実を並べて、自分にとって納得できる選択を探すカードです。',
      shadow: '正しいかどうかに寄りすぎると、心の痛みや苦しさを切り捨ててしまうことがあります。',
      action: 'メリット・デメリットだけでなく、「自分の心がどう感じるか」も書いてください。'
    },
    {
      number: 12,
      nameJa: '吊るされた男',
      nameEn: 'The Hanged Man',
      keywords: ['停止', '受容', '視点転換'],
      essence: '思うように動けない時間の中で、見方を変えるきっかけをくれるカードです。',
      shadow: '我慢に意味を持たせようとして、苦しさを正当化してしまうことがあります。',
      action: '今の状況を、別の人から相談されたつもりで見直してください。自分責めが少し弱まります。'
    },
    {
      number: 13,
      nameJa: '死神',
      nameEn: 'Death',
      keywords: ['区切り', '手放し', '再生'],
      essence: 'もう合わなくなった形を終わらせ、次の自分へ戻るためのカードです。',
      shadow: '終わりが近づくほど、すべてを失うように感じて怖くなることがあります。',
      action: '残したいものと、もう苦しくなっているものを一つずつ書いてください。終わりは罰ではありません。'
    },
    {
      number: 14,
      nameJa: '節制',
      nameEn: 'Temperance',
      keywords: ['調和', '回復', 'なじませる'],
      essence: '違うものを無理なくなじませ、心と現実を回復させていくカードです。',
      shadow: '場を保とうとするほど、自分だけが我慢して合わせてしまうことがあります。',
      action: '自分が譲っていることを一つ見つけてください。そして、本当はどうしたいかを書いてみてください。'
    },
    {
      number: 15,
      nameJa: '悪魔',
      nameEn: 'The Devil',
      keywords: ['執着', '欲求', '本音'],
      essence: '離れられない感情の奥にある、寂しさや本音を映すカードです。',
      shadow: '欲しい、認められたい、離れたくない気持ちが強くなり、自分でも苦しくなることがあります。',
      action: '手放せないものが、安心・承認・愛情のどれに近いか考えてください。責めるより、まず理解しましょう。'
    },
    {
      number: 16,
      nameJa: '塔',
      nameEn: 'The Tower',
      keywords: ['気づき', '崩れる形', '再構築'],
      essence: '無理に積み上げてきたものが崩れ、本当は苦しかった部分が見えるカードです。',
      shadow: '急な変化を、すべてが終わったように感じてしまうことがあります。',
      action: '今いちばん無理をしていることを一つだけ認めてください。認めることから立て直しが始まります。'
    },
    {
      number: 17,
      nameJa: '星',
      nameEn: 'The Star',
      keywords: ['希望', '癒し', '未来'],
      essence: 'まだ遠く感じる未来に、進むための希望を見つけるカードです。',
      shadow: '希望を見るだけで安心してしまうと、現実の一歩が止まりやすくなります。',
      action: '未来のために、今日できる行動を一つ選んでください。小さくても、ちゃんと希望に近づきます。'
    },
    {
      number: 18,
      nameJa: '月',
      nameEn: 'The Moon',
      keywords: ['不安', '直感', '確認'],
      essence: 'はっきりしない状況の中で、不安と本音を見分けるカードです。',
      shadow: '想像が膨らむほど、不安を事実のように感じてしまうことがあります。',
      action: '不安を一つ書き、その横に「確認できること」を一つだけ書いてください。怖さを事実に戻しましょう。'
    },
    {
      number: 19,
      nameJa: '太陽',
      nameEn: 'The Sun',
      keywords: ['喜び', '解放', '成果'],
      essence: '心が明るさを取り戻し、自分らしく進みやすくなるカードです。',
      shadow: '明るく動ける時ほど、勢いで大切な確認を飛ばしてしまうことがあります。',
      action: '今日うれしかったことを一つ残してください。喜びをちゃんと受け取ることも、次の力になります。'
    },
    {
      number: 20,
      nameJa: '審判',
      nameEn: 'Judgement',
      keywords: ['再出発', '目覚め', '選び直し'],
      essence: '過去を責め続けるのではなく、今からもう一度選び直すカードです。',
      shadow: '昔の後悔が強くなると、今の自分まで責めてしまうことがあります。',
      action: '昔あきらめたことの中で、今なら少しできそうなことを書いてください。遅すぎることはありません。'
    },
    {
      number: 21,
      nameJa: '世界',
      nameEn: 'The World',
      keywords: ['完成', '統合', '一区切り'],
      essence: 'ここまでの経験が一つの形になり、次の扉が見えてくるカードです。',
      shadow: '一区切りが近づくほど、終わる寂しさや次へ進む怖さが出ることがあります。',
      action: 'ここまで頑張ったことを一つ認めてください。その上で、次に持っていくものを決めましょう。'
    }
  ];

  const NUMBER_MEANINGS = {
    1: {
      keywords: ['始まり', '種', 'きっかけ'],
      essence: 'まだ小さいけれど、確かな始まりが生まれる数字です。',
      shadow: '期待が先に大きくなり、最初の一歩を重く感じることがあります。',
      action: 'まずは一つだけ、形にして外へ出してください。'
    },
    2: {
      keywords: ['選択', '関係', '調整'],
      essence: '自分と相手、自分と現実を見比べながら選ぶ数字です。',
      shadow: '迷いすぎると、相手や状況に合わせすぎてしまうことがあります。',
      action: '自分が選びたい方と、怖くて選べない方を分けて書いてください。'
    },
    3: {
      keywords: ['成長', '表現', '協力'],
      essence: '一人で抱えていたものを外へ出し、広げていく数字です。',
      shadow: '反応を気にしすぎると、自分の言葉が薄くなりやすいです。',
      action: '考えていることを、誰かに伝わる形へ少しだけ変えてください。'
    },
    4: {
      keywords: ['安定', '土台', '維持'],
      essence: '続けるための土台を作り、安心を固める数字です。',
      shadow: '守ろうとするほど、変化を怖がりやすくなります。',
      action: '今守りたいものと、変えてもよいものを分けてください。'
    },
    5: {
      keywords: ['揺れ', '変化', '学び'],
      essence: '予定通りにいかない中で、本当に必要な学びが見えてくる数字です。',
      shadow: '揺れを悪いものと決めつけると、焦りが強くなります。',
      action: '今起きている変化から、学べることを一つだけ拾ってください。'
    },
    6: {
      keywords: ['調和', '回復', '分かち合い'],
      essence: '関係や生活の中に、無理のない調和を戻す数字です。',
      shadow: '合わせることを優先しすぎると、自分の本音が後回しになります。',
      action: '相手に合わせていることの中から、一つだけ自分の希望を入れてください。'
    },
    7: {
      keywords: ['探求', '見極め', '集中'],
      essence: '簡単に答えを出さず、自分の中で深く確かめる数字です。',
      shadow: '考えすぎると、動く前に疲れてしまうことがあります。',
      action: '今確かめたいことを一つに絞ってください。'
    },
    8: {
      keywords: ['継続', '力', '積み重ね'],
      essence: '続けてきたことが力になり、現実に手応えを作る数字です。',
      shadow: '頑張れるからこそ、休む判断が遅れやすくなります。',
      action: '続けることと休むことを、同じくらい大切に扱ってください。'
    },
    9: {
      keywords: ['成熟', '成果', '内省'],
      essence: 'ここまでの経験を受け取り、次へ渡す準備をする数字です。',
      shadow: 'まだ足りない部分ばかり見て、自分の成長を認めにくくなります。',
      action: 'ここまでできたことを一つだけ、きちんと認めてください。'
    },
    10: {
      keywords: ['完成', '次の段階', '循環'],
      essence: 'ひとつの区切りを迎え、次の流れへ移る数字です。',
      shadow: '終わりを怖がると、次の始まりを受け取りにくくなります。',
      action: '終わらせることと、次に始めることを一つずつ決めてください。'
    }
  };

  const COURTS = [
    {
      rank: 'page',
      rankJa: 'ペイジ',
      rankEn: 'Page',
      keywords: ['知らせ', '学び', '純粋さ'],
      essence: 'まだ未熟でも、心が新しい方向へ反応し始めている人物像です。',
      shadow: '経験不足から、不安になったり、受け身になりすぎることがあります。',
      action: '知らないことを責めず、まず一つ学ぶ姿勢を持ってください。'
    },
    {
      rank: 'knight',
      rankJa: 'ナイト',
      rankEn: 'Knight',
      keywords: ['行動', '接近', '勢い'],
      essence: '気持ちや考えを、実際の行動へ移そうとする人物像です。',
      shadow: '勢いが強い時ほど、相手や状況の温度を見落としやすいです。',
      action: '動く前に、相手や状況に合うペースかを一度確認してください。'
    },
    {
      rank: 'queen',
      rankJa: 'クイーン',
      rankEn: 'Queen',
      keywords: ['受容', '成熟', '育成'],
      essence: '自分の内側を満たしながら、周りにも安心を渡せる人物像です。',
      shadow: '受け止める力がある分、抱え込みすぎることがあります。',
      action: '誰かを受け止める前に、自分の心の余裕を確認してください。'
    },
    {
      rank: 'king',
      rankJa: 'キング',
      rankEn: 'King',
      keywords: ['責任', '判断', '統率'],
      essence: '状況を見て、責任ある判断を下そうとする人物像です。',
      shadow: '正しく導こうとするほど、柔らかさを失いやすくなります。',
      action: '結論を出す前に、相手の気持ちや現場の温度も見てください。'
    }
  ];

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function unique(values) {
    const result = [];
    (Array.isArray(values) ? values : []).forEach(function (value) {
      if (value && result.indexOf(value) === -1) result.push(value);
    });
    return result;
  }

  function buildTopicMeaning(nameJa, focus, suitTheme) {
    return `${nameJa}は、${suitTheme}を通して「${focus}」を見直すカードです。すぐに答えを決めるより、今の気持ちと現実の動きを分けて見ると判断しやすくなります。`;
  }

  function buildMajorTopicMeaning(nameJa, focus) {
    return `${nameJa}は、「${focus}」について今のあなたに必要な視点を映します。良い・悪いで決めるより、何を選び直す時期なのかを見てください。`;
  }

  function createCard(config) {
    const keywords = unique(config.keywords || []);

    return {
      id: config.id,
      category: config.category,
      number: config.number === undefined ? null : config.number,
      rank: config.rank || null,
      suit: config.suit || null,
      element: config.element || '',
      nameJa: config.nameJa,
      nameEn: config.nameEn,
      keywords: keywords,
      uprightKeywords: keywords,

      uprightMeaning: config.uprightMeaning,
      seimeiResonanceText: config.seimeiResonanceText,

      loveMeaning: config.loveMeaning,
      workMeaning: config.workMeaning,
      moneyMeaning: config.moneyMeaning,
      relationshipMeaning: config.relationshipMeaning,
      timingMeaning: config.timingMeaning,
      personImage: config.personImage,

      light: config.light,
      shadow: config.shadow,
      actionAdvice: config.actionAdvice,
      caution: config.caution
    };
  }

  function createMajorCard(card) {
    return createCard({
      id: `major_${pad(card.number)}`,
      category: 'major',
      number: card.number,
      nameJa: card.nameJa,
      nameEn: card.nameEn,
      keywords: card.keywords,
      uprightMeaning: card.essence,
      seimeiResonanceText: `${card.nameJa}は、今のあなたに「${card.keywords[0]}」という大きなテーマを見せています。未来を決めつけるためではなく、本音と現実をもう一度並べるためのカードです。`,
      loveMeaning: buildMajorTopicMeaning(card.nameJa, '心の選択や関係の向き合い方'),
      workMeaning: buildMajorTopicMeaning(card.nameJa, '仕事の方向性や役割の選び方'),
      moneyMeaning: buildMajorTopicMeaning(card.nameJa, 'お金との向き合い方や安心の作り方'),
      relationshipMeaning: buildMajorTopicMeaning(card.nameJa, '人との距離感や信頼の置き方'),
      timingMeaning: `${card.nameJa}は、意識が切り替わりやすい時期を示します。焦って答えを出すより、現実に起きている変化を丁寧に見てください。`,
      personImage: `${card.keywords[0]}を通して、今の状況に大切な気づきを運ぶ人物像です。`,
      light: card.essence,
      shadow: card.shadow,
      actionAdvice: card.action,
      caution: '未来を断定せず、今の気持ち・現実・次の行動を分けて読んでください。'
    });
  }

  function createAceCard(suitKey) {
    const suit = SUITS[suitKey];
    const number = NUMBER_MEANINGS[1];

    return createCard({
      id: `ace_${suitKey}`,
      category: 'ace',
      number: 1,
      rank: 'ace',
      suit: suitKey,
      element: suit.element,
      nameJa: `${suit.ja}のエース`,
      nameEn: `Ace of ${suit.en}`,
      keywords: unique(number.keywords.concat([suit.theme])),
      uprightMeaning: `${suit.ja}のエースは、${suit.theme}に新しい入口が生まれるカードです。まだ大きな結果ではなくても、心や現実が次の方向へ反応し始めています。`,
      seimeiResonanceText: `${suit.ja}のエースは、今の星命に「始まりの合図」を重ねます。無理に広げず、まず一つのきっかけを大切にしてください。`,
      loveMeaning: buildTopicMeaning(`${suit.ja}のエース`, suit.loveFocus, suit.theme),
      workMeaning: buildTopicMeaning(`${suit.ja}のエース`, suit.workFocus, suit.theme),
      moneyMeaning: buildTopicMeaning(`${suit.ja}のエース`, suit.moneyFocus, suit.theme),
      relationshipMeaning: buildTopicMeaning(`${suit.ja}のエース`, suit.relationFocus, suit.theme),
      timingMeaning: `${suit.ja}のエースは、新しいきっかけが生まれやすい時期を示します。最初から完璧にしようとしなくて大丈夫です。`,
      personImage: `${suit.personTone}。ただし、まだ始まりの段階なので、育てる時間が必要です。`,
      light: number.essence,
      shadow: number.shadow,
      actionAdvice: number.action,
      caution: '期待だけで決めず、始まりを現実の行動へ移せるかを見てください。'
    });
  }

  function createNumberedCard(suitKey, cardNumber) {
    const suit = SUITS[suitKey];
    const number = NUMBER_MEANINGS[cardNumber];

    return createCard({
      id: `${suitKey}_${pad(cardNumber)}`,
      category: 'numbered',
      number: cardNumber,
      suit: suitKey,
      element: suit.element,
      nameJa: `${suit.ja}の${cardNumber}`,
      nameEn: `${cardNumber} of ${suit.en}`,
      keywords: unique(number.keywords.concat([suit.theme])),
      uprightMeaning: `${suit.ja}の${cardNumber}は、${suit.theme}の中で「${number.keywords[0]}」がテーマになるカードです。${number.essence}`,
      seimeiResonanceText: `${suit.ja}の${cardNumber}は、星命の性質を日常の出来事に落とし込む補助線です。今すぐ結論を急がず、目の前の反応を見てください。`,
      loveMeaning: buildTopicMeaning(`${suit.ja}の${cardNumber}`, suit.loveFocus, suit.theme),
      workMeaning: buildTopicMeaning(`${suit.ja}の${cardNumber}`, suit.workFocus, suit.theme),
      moneyMeaning: buildTopicMeaning(`${suit.ja}の${cardNumber}`, suit.moneyFocus, suit.theme),
      relationshipMeaning: buildTopicMeaning(`${suit.ja}の${cardNumber}`, suit.relationFocus, suit.theme),
      timingMeaning: `${suit.ja}の${cardNumber}は、日常の中で${number.keywords[0]}が表に出やすい時期を示します。小さな違和感も見落とさないでください。`,
      personImage: `${suit.personTone}。${number.keywords[0]}を通して、今の状況に影響を与える人物像です。`,
      light: number.essence,
      shadow: number.shadow,
      actionAdvice: number.action,
      caution: '状況を一面だけで判断せず、気持ち・事実・行動を分けて見てください。'
    });
  }

  function createCourtCard(suitKey, court) {
    const suit = SUITS[suitKey];

    return createCard({
      id: `${suitKey}_${court.rank}`,
      category: 'court',
      rank: court.rank,
      suit: suitKey,
      element: suit.element,
      nameJa: `${suit.ja}の${court.rankJa}`,
      nameEn: `${court.rankEn} of ${suit.en}`,
      keywords: unique(court.keywords.concat([suit.theme])),
      uprightMeaning: `${suit.ja}の${court.rankJa}は、${suit.theme}をまとった人物像や、あなた自身の振る舞いを映します。${court.essence}`,
      seimeiResonanceText: `${suit.ja}の${court.rankJa}は、星命の力が人間関係や行動パターンとして表に出ることを示します。相手だけでなく、自分の反応も見てください。`,
      loveMeaning: buildTopicMeaning(`${suit.ja}の${court.rankJa}`, suit.loveFocus, suit.theme),
      workMeaning: buildTopicMeaning(`${suit.ja}の${court.rankJa}`, suit.workFocus, suit.theme),
      moneyMeaning: buildTopicMeaning(`${suit.ja}の${court.rankJa}`, suit.moneyFocus, suit.theme),
      relationshipMeaning: buildTopicMeaning(`${suit.ja}の${court.rankJa}`, suit.relationFocus, suit.theme),
      timingMeaning: `${suit.ja}の${court.rankJa}は、人物との関わりや自分の態度が結果に影響しやすい時期を示します。`,
      personImage: `${suit.personTone}で、${court.keywords[0]}の雰囲気を持つ人物像です。`,
      light: court.essence,
      shadow: court.shadow,
      actionAdvice: court.action,
      caution: '相手を決めつけず、言葉と行動の一致を見てください。'
    });
  }

  const majorCards = MAJORS.map(createMajorCard);
  const aceCards = Object.keys(SUITS).map(createAceCard);

  const numberedCards = Object.keys(SUITS).reduce(function (cards, suitKey) {
    for (let number = 2; number <= 10; number += 1) {
      cards.push(createNumberedCard(suitKey, number));
    }
    return cards;
  }, []);

  const courtCards = Object.keys(SUITS).reduce(function (cards, suitKey) {
    COURTS.forEach(function (court) {
      cards.push(createCourtCard(suitKey, court));
    });
    return cards;
  }, []);

  const TAROT_78_CARDS = majorCards.concat(aceCards, numberedCards, courtCards);

  function normalizeName(name) {
    return String(name || '')
      .trim()
      .toLowerCase()
      .replace(/[ 　]/g, '')
      .replace(/正位置|逆位置|upright|reversed/gi, '');
  }

  function getTarot78ById(id) {
    return TAROT_78_CARDS.find(function (card) {
      return card.id === id;
    }) || null;
  }

  function getTarot78ByName(name) {
    const key = normalizeName(name);

    return TAROT_78_CARDS.find(function (card) {
      return normalizeName(card.nameJa) === key ||
        normalizeName(card.nameEn) === key ||
        normalizeName(card.id) === key;
    }) || null;
  }

  function getTarot78ByCategory(category) {
    return TAROT_78_CARDS.filter(function (card) {
      return card.category === category;
    });
  }

  function getTarot78BySuit(suit) {
    return TAROT_78_CARDS.filter(function (card) {
      return card.suit === suit;
    });
  }

  function getAllTarot78Cards() {
    return TAROT_78_CARDS.slice();
  }

  return {
    SUITS,
    TAROT_78_CARDS,
    getAllTarot78Cards,
    getTarot78ById,
    getTarot78ByName,
    getTarot78ByCategory,
    getTarot78BySuit
  };
});
