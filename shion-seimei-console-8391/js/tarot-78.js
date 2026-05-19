(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

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
      personTone: '熱量があり、自分から場を動かす人',
      message: '思っているだけで止めず、外へ出す勇気を教えてくれるスートです。'
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
      personTone: '感情に寄り添い、相手の気持ちを受け取る人',
      message: '本音や寂しさ、安心したい気持ちを丁寧に見せてくれるスートです。'
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
      personTone: '頭の回転が早く、言葉で状況を切り分ける人',
      message: '感情に飲まれず、言葉と事実を見直す必要を教えてくれるスートです。'
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
      personTone: '現実感があり、結果を少しずつ積み上げる人',
      message: '生活、仕事、お金、信頼など、現実の手応えを見せてくれるスートです。'
    }
  };

  const MAJORS = [
    {
      number: 0,
      nameJa: '愚者',
      nameEn: 'The Fool',
      keywords: ['自由', '始まり', '可能性'],
      essence: 'まだ形になっていない未来へ、怖さを抱えながらも一歩を踏み出そうとするカードです。',
      shadow: '自由でいたい気持ちが強くなるほど、現実の確認を後回しにしてしまうことがあります。',
      adjustment: '勢いだけで決めず、「どこへ向かいたいのか」を一つだけ言葉にしてみてください。',
      humanMessage: '怖いのに進みたいなら、それは無謀ではありません。心が新しい景色を求めているサインです。',
      action: 'やってみたいことを一つだけメモしてください。大きく始めなくて大丈夫です。'
    },
    {
      number: 1,
      nameJa: '魔術師',
      nameEn: 'The Magician',
      keywords: ['創造', '意志', '実行'],
      essence: '手元にあるものを使い、可能性を現実へ変えていくカードです。',
      shadow: '考えやアイデアが増えるほど、準備だけで止まってしまうことがあります。',
      adjustment: '完璧な準備を待つより、まず一つ形にしてみてください。',
      humanMessage: 'あなたの中には、もう材料があります。足りないものを数えるより、今あるものをどう使うかを見てください。',
      action: '考えていることを一つ、投稿・連絡・メモ・作業のどれかに変えてください。'
    },
    {
      number: 2,
      nameJa: '女教皇',
      nameEn: 'The High Priestess',
      keywords: ['直感', '静けさ', '洞察'],
      essence: '静かな直感と、まだ言葉にならない本音を映すカードです。',
      shadow: '感じ取る力が強い時ほど、確認しないまま心の中で結論を作ってしまうことがあります。',
      adjustment: '直感を大切にしながらも、事実と言葉で確かめることが必要です。',
      humanMessage: '違和感は無視しなくて大丈夫です。ただ、それを怖い結論に急がなくても大丈夫です。',
      action: '「見た事実」と「感じたこと」を分けて書き出してください。'
    },
    {
      number: 3,
      nameJa: '女帝',
      nameEn: 'The Empress',
      keywords: ['愛情', '育成', '豊かさ'],
      essence: '受け入れ、育て、満たしていく力を示すカードです。',
      shadow: '与える力が強くなりすぎると、自分の寂しさや疲れに気づきにくくなります。',
      adjustment: '誰かを満たす前に、自分の心と身体にも栄養を戻してください。',
      humanMessage: 'あなたの優しさは、誰かを包む力になります。でも、空っぽになるまで与えなくていいのです。',
      action: '自分のために、温かい飲み物・食事・休息のどれかを一つ選んでください。'
    },
    {
      number: 4,
      nameJa: '皇帝',
      nameEn: 'The Emperor',
      keywords: ['責任', '決断', '土台'],
      essence: '責任を持ち、現実に土台を作っていくカードです。',
      shadow: '守ろうとする気持ちが強いほど、正しさや管理で押し切りたくなることがあります。',
      adjustment: '支配するより、安心できる仕組みを作ることが大切です。',
      humanMessage: '本当の強さは、何も頼らないことではありません。背負い方を見直すことも、ちゃんと強さです。',
      action: '今日やることを三つに絞り、残りは後日に回してください。'
    },
    {
      number: 5,
      nameJa: '教皇',
      nameEn: 'The Hierophant',
      keywords: ['信頼', '学び', '導き'],
      essence: '信頼、学び、受け継がれる知恵を示すカードです。',
      shadow: '常識や正しさを大切にするあまり、自分の本音を押し込めてしまうことがあります。',
      adjustment: '「こうあるべき」だけでなく、「本当はどうしたいか」も大切にしてください。',
      humanMessage: '誠実でいることと、我慢し続けることは同じではありません。',
      action: '信頼できる人に、今の気持ちを一言だけ話してみてください。'
    },
    {
      number: 6,
      nameJa: '恋人',
      nameEn: 'The Lovers',
      keywords: ['選択', '関係', '心の一致'],
      essence: '選ばれるかどうかではなく、自分が何を選びたいのかを問うカードです。',
      shadow: '相手に選ばれたい気持ちが強くなると、自分の望みが見えにくくなります。',
      adjustment: '相手の気持ちだけでなく、自分の心が本当に安心できるかを見てください。',
      humanMessage: '愛されるかどうかだけではなく、あなた自身がその関係を選びたいかも大切です。',
      action: 'その関係で「嬉しいこと」と「苦しいこと」を一つずつ書き出してください。'
    },
    {
      number: 7,
      nameJa: '戦車',
      nameEn: 'The Chariot',
      keywords: ['前進', '集中', '突破'],
      essence: '迷いを抱えながらも、前へ進もうとする力を示すカードです。',
      shadow: '進みたい気持ちが強いほど、焦りで自分や相手を急かしてしまうことがあります。',
      adjustment: '目的地とペースを見直してください。勢いよりも方向性が大切です。',
      humanMessage: '進む力はあります。だからこそ、どこへ向かうのかを決めることが大切です。',
      action: '今週中に進めることを一つだけ決め、具体的な日時を入れてください。'
    },
    {
      number: 8,
      nameJa: '力',
      nameEn: 'Strength',
      keywords: ['勇気', '忍耐', '優しさ'],
      essence: '我慢ではなく、優しさで向き合う本当の強さを示すカードです。',
      shadow: '耐えられる力があるほど、つらさを一人で抱えてしまうことがあります。',
      adjustment: '強いから大丈夫、ではなく、強い人にも休む場所が必要です。',
      humanMessage: 'ここまで耐えてきたことには意味があります。でも、これ以上ひとりで抱えなくてもいいのです。',
      action: '我慢していることを一つだけ言葉にしてください。誰かに言えないなら、紙でも大丈夫です。'
    },
    {
      number: 9,
      nameJa: '隠者',
      nameEn: 'The Hermit',
      keywords: ['内省', '探求', '答え'],
      essence: '外の声から離れ、自分の中にある答えを探すカードです。',
      shadow: '深く考えるほど、一人で抱え込み、誰にも届かない場所に閉じこもってしまうことがあります。',
      adjustment: '一人の時間は大切ですが、必要な言葉だけは外へ出してください。',
      humanMessage: '沈黙の中に答えはあります。ただ、その答えを自分だけで背負わなくても大丈夫です。',
      action: '今考えていることを三行だけ書き出してください。書くだけで見えてくるものがあります。'
    },
    {
      number: 10,
      nameJa: '運命の輪',
      nameEn: 'Wheel of Fortune',
      keywords: ['転機', '循環', 'タイミング'],
      essence: '止まっていたものが動き出し、タイミングが変わっていくカードです。',
      shadow: '流れに任せすぎると、自分がどうしたいのかを見失いやすくなります。',
      adjustment: '偶然を待つだけでなく、どの流れに乗るかを自分で選ぶことが大切です。',
      humanMessage: '何かが少しずつ動き始めています。置いていかれるのではなく、選んで乗っていきましょう。',
      action: '最近起きた小さな変化を一つ書き出し、それをどう活かすか考えてください。'
    },
    {
      number: 11,
      nameJa: '正義',
      nameEn: 'Justice',
      keywords: ['判断', '均衡', '誠実'],
      essence: '感情と現実を並べて、誠実な判断をしていくカードです。',
      shadow: '正しさを求めるほど、心の痛みや迷いを切り捨ててしまうことがあります。',
      adjustment: '冷静な判断に、心の納得も加えてください。',
      humanMessage: '正しいかどうかだけでは測れない想いがあります。苦しさも大切な判断材料です。',
      action: 'メリット・デメリットだけでなく、「自分の心がどう感じるか」も書き出してください。'
    },
    {
      number: 12,
      nameJa: '吊るされた男',
      nameEn: 'The Hanged Man',
      keywords: ['停止', '受容', '視点転換'],
      essence: '動けない時間の中で、見方を変える必要を示すカードです。',
      shadow: '我慢を意味のあるものにしようとして、苦しさを正当化してしまうことがあります。',
      adjustment: '無理に進むより、見方を変えることで抜け道が見えてきます。',
      humanMessage: '止まっているように見える時間にも、心はちゃんと何かを学んでいます。焦らなくて大丈夫です。',
      action: '今の状況を、別の人に相談されたつもりで見直してみてください。'
    },
    {
      number: 13,
      nameJa: '死神',
      nameEn: 'Death',
      keywords: ['区切り', '手放し', '再生'],
      essence: '古い形を終わらせ、次の自分へ向かうための区切りを示すカードです。',
      shadow: '終わりが見える時ほど、すべてを失うように感じて怖くなることがあります。',
      adjustment: '全部を捨てる必要はありません。残すものと手放すものを分けてください。',
      humanMessage: '終わりは罰ではありません。もう合わなくなった形を脱ぎ、次の自分へ戻るための区切りです。',
      action: '今の自分に必要なもの、もう苦しくなっているものを一つずつ書いてください。'
    },
    {
      number: 14,
      nameJa: '節制',
      nameEn: 'Temperance',
      keywords: ['調和', '回復', 'なじませる'],
      essence: '違うものを少しずつ馴染ませ、無理のない形へ戻していくカードです。',
      shadow: 'バランスを取ろうとするほど、自分だけが我慢してしまうことがあります。',
      adjustment: '調和とは、自分を消すことではありません。あなたの気持ちも混ぜていいのです。',
      humanMessage: 'あなたが合わせてきた場の中に、あなた自身の声は入っていましたか。今度はそこを大切にしてください。',
      action: '自分が譲っていることを一つ見つけ、本当はどうしたいかを書いてください。'
    },
    {
      number: 15,
      nameJa: '悪魔',
      nameEn: 'The Devil',
      keywords: ['執着', '欲求', '本音'],
      essence: '心が何に縛られているのか、本音の影を映すカードです。',
      shadow: '欲しい、離れられない、やめられないという感情に、自分でも苦しくなることがあります。',
      adjustment: '欲を責めるより、その奥にある寂しさや不安を見てください。',
      humanMessage: '執着は弱さではなく、心が何かを強く求めているサインです。ただ、それに飲まれなくても大丈夫です。',
      action: '今手放せないものが「安心」「承認」「愛情」のどれに近いか考えてください。'
    },
    {
      number: 16,
      nameJa: '塔',
      nameEn: 'The Tower',
      keywords: ['気づき', '崩れる形', '再構築'],
      essence: '無理に積み上げたものが崩れ、本当の問題が見えてくるカードです。',
      shadow: '突然の変化に、すべてが壊れたように感じてしまうことがあります。',
      adjustment: '崩れたものを見るだけでなく、なぜ無理が積み上がっていたのかを見てください。',
      humanMessage: 'それは罰ではありません。苦しめていた形が、もう続けられないと教えてくれているのです。',
      action: '今いちばん無理をしていることを一つだけ認めてください。認めるだけでも変化は始まります。'
    },
    {
      number: 17,
      nameJa: '星',
      nameEn: 'The Star',
      keywords: ['希望', '癒し', '未来'],
      essence: 'まだ遠くても、未来に希望を置き直すカードです。',
      shadow: '希望を見るだけで現実の一歩が止まると、夢が遠いままになってしまいます。',
      adjustment: '希望を行動として現実に置いてください。',
      humanMessage: '今はまだ遠く感じても、光は消えていません。その星は、ちゃんと道しるべになります。',
      action: '未来のために今日できる行動を一つ選んでください。'
    },
    {
      number: 18,
      nameJa: '月',
      nameEn: 'The Moon',
      keywords: ['不安', '直感', '確認'],
      essence: '不安と直感が混ざる中で、本当の気持ちを探すカードです。',
      shadow: '想像が膨らむほど、不安を事実のように感じてしまうことがあります。',
      adjustment: '見えないものを怖がりすぎず、確認できることから見てください。',
      humanMessage: '不安になるのは弱いからではありません。大切だからこそ、心が先に揺れてしまうのです。',
      action: '不安を一つ書き、その横に「確認できること」を一つだけ書いてください。'
    },
    {
      number: 19,
      nameJa: '太陽',
      nameEn: 'The Sun',
      keywords: ['喜び', '解放', '成果'],
      essence: '心が明るさを取り戻し、素直な喜びへ向かうカードです。',
      shadow: '明るく進める時ほど、勢いで大切なことを見落としてしまうことがあります。',
      adjustment: '喜びを一時的な勢いで終わらせず、続けられる形にしてください。',
      humanMessage: '笑える時間は、ちゃんと戻ってきます。その光を、無理なく続く日常に置いていきましょう。',
      action: '今日うれしかったことを一つ残してください。小さな喜びが次の力になります。'
    },
    {
      number: 20,
      nameJa: '審判',
      nameEn: 'Judgement',
      keywords: ['再出発', '目覚め', '選び直し'],
      essence: '過去を越えて、もう一度自分を選び直すカードです。',
      shadow: '過去を思い出すほど、あの時できなかった自分を責めてしまうことがあります。',
      adjustment: '過去を責めるより、今なら選び直せることに意識を向けてください。',
      humanMessage: '遅すぎることはありません。眠っていた声が、もう一度立ち上がろうとしています。',
      action: '昔あきらめたこと、今なら少しできそうなことを一つ書いてください。'
    },
    {
      number: 21,
      nameJa: '世界',
      nameEn: 'The World',
      keywords: ['完成', '統合', '一区切り'],
      essence: 'ここまでの経験が一つにつながり、次の段階へ向かうカードです。',
      shadow: '完成に近づくほど、終わることへの寂しさや、次へ進む怖さが出ることがあります。',
      adjustment: '終わりにしがみつかず、ここまでの経験を持って次の循環へ進んでください。',
      humanMessage: '積み重ねてきたものは、ちゃんと形になっています。終わりは喪失ではなく、次の扉でもあります。',
      action: 'ここまで頑張ったことを一つ認めて、次に進む準備を始めてください。'
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
      if (value && result.indexOf(value) === -1) {
        result.push(value);
      }
    });

    return result;
  }

  function topicSentence(nameJa, focus, suit) {
    return `${nameJa}は、「${focus}」を見つめるカードです。${suit.message}`;
  }

  function majorTopicSentence(nameJa, focus) {
    return `${nameJa}は、「${focus}」について今のあなたに必要な視点を映します。答えを急ぐより、心がどこで反応しているのかを見てください。`;
  }

  function createAliases(card) {
    const aliases = [card.nameJa, card.nameEn, card.id];

    if (card.category === 'major') {
      aliases.push(String(card.number));
      aliases.push(`${card.number}. ${card.nameJa}`);
      aliases.push(`${card.number} ${card.nameJa}`);
      aliases.push(`${pad(card.number)} ${card.nameJa}`);
    }

    if (card.category === 'numbered' && card.suit && card.number) {
      const suit = SUITS[card.suit];
      aliases.push(`${suit.ja}${card.number}`);
      aliases.push(`${suit.ja} ${card.number}`);
      aliases.push(`${suit.ja}の${card.number}`);
      aliases.push(`${card.number} of ${suit.en}`);
    }

    if (card.category === 'ace' && card.suit) {
      const suit = SUITS[card.suit];
      aliases.push(`${suit.ja}エース`);
      aliases.push(`${suit.ja}のエース`);
      aliases.push(`Ace of ${suit.en}`);
    }

    if (card.category === 'court' && card.suit && card.rank) {
      const suit = SUITS[card.suit];
      aliases.push(`${suit.ja}${card.rankJa || ''}`);
      aliases.push(`${suit.ja}の${card.rankJa || ''}`);
      aliases.push(`${card.rankEn || ''} of ${suit.en}`);
    }

    return unique(aliases);
  }

  function createCard(config) {
    const keywords = unique(config.keywords || []);

    const card = {
      id: config.id,
      category: config.category,
      number: config.number === undefined ? null : config.number,
      rank: config.rank || null,
      rankJa: config.rankJa || '',
      rankEn: config.rankEn || '',
      suit: config.suit || null,
      suitTheme: config.suitTheme || '',
      element: config.element || '',
      nameJa: config.nameJa,
      nameEn: config.nameEn,
      keywords,
      uprightKeywords: keywords,

      uprightMeaning: config.uprightMeaning || '',
      seimeiResonanceText: config.seimeiResonanceText || '',

      loveMeaning: config.loveMeaning || '',
      workMeaning: config.workMeaning || '',
      moneyMeaning: config.moneyMeaning || '',
      relationshipMeaning: config.relationshipMeaning || '',
      timingMeaning: config.timingMeaning || '',
      personImage: config.personImage || '',

      light: config.light || '',
      shadow: config.shadow || '',
      adjustment: config.adjustment || '',
      humanMessage: config.humanMessage || '',
      actionAdvice: config.actionAdvice || '',
      caution: config.caution || ''
    };

    card.aliases = createAliases(card);
    return card;
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
      seimeiResonanceText: `${card.nameJa}は、今のあなたに「${card.keywords[0]}」という大きなテーマを見せています。未来を決めつけるためではなく、本音と現実を並べ直すためのカードです。`,
      loveMeaning: majorTopicSentence(card.nameJa, '心の選択や関係の向き合い方'),
      workMeaning: majorTopicSentence(card.nameJa, '仕事の方向性や役割の選び方'),
      moneyMeaning: majorTopicSentence(card.nameJa, 'お金との向き合い方や安心の作り方'),
      relationshipMeaning: majorTopicSentence(card.nameJa, '人との距離感や信頼の置き方'),
      timingMeaning: `${card.nameJa}は、意識が切り替わりやすい時期を示します。焦って答えを出すより、現実に起きている変化を落ち着いて見てください。`,
      personImage: `${card.keywords[0]}を通して、今の状況に大切な気づきを運ぶ人物像です。`,
      light: card.humanMessage,
      shadow: card.shadow,
      adjustment: card.adjustment,
      humanMessage: card.humanMessage,
      actionAdvice: card.action,
      caution: card.adjustment || '未来を断定せず、今の気持ち・現実・次の行動を分けて読んでください。'
    });
  }

  function createAceCard(suitKey) {
    const suit = SUITS[suitKey];
    const number = NUMBER_MEANINGS[1];
    const nameJa = `${suit.ja}のエース`;

    return createCard({
      id: `ace_${suitKey}`,
      category: 'ace',
      number: 1,
      rank: 'ace',
      suit: suitKey,
      suitTheme: suit.theme,
      element: suit.element,
      nameJa,
      nameEn: `Ace of ${suit.en}`,
      keywords: unique(number.keywords.concat([suit.theme])),
      uprightMeaning: `${nameJa}は、${suit.theme}に新しい入口が生まれるカードです。まだ大きな結果ではなくても、心や現実が次の方向へ反応し始めています。`,
      seimeiResonanceText: `${nameJa}は、星命に始まりの合図を重ねます。無理に広げず、まず一つのきっかけを大切にしてください。`,
      loveMeaning: topicSentence(nameJa, suit.loveFocus, suit),
      workMeaning: topicSentence(nameJa, suit.workFocus, suit),
      moneyMeaning: topicSentence(nameJa, suit.moneyFocus, suit),
      relationshipMeaning: topicSentence(nameJa, suit.relationFocus, suit),
      timingMeaning: `${nameJa}は、新しいきっかけが生まれやすい時期を示します。最初から完璧にしようとしなくて大丈夫です。`,
      personImage: `${suit.personTone}。ただし、まだ始まりの段階なので、育てる時間が必要です。`,
      light: number.essence,
      shadow: number.shadow,
      adjustment: '期待だけで決めず、始まりを現実の行動へ移せるかを見てください。',
      humanMessage: suit.message,
      actionAdvice: number.action,
      caution: '期待だけで決めず、始まりを現実の行動へ移せるかを見てください。'
    });
  }

  function createNumberedCard(suitKey, cardNumber) {
    const suit = SUITS[suitKey];
    const number = NUMBER_MEANINGS[cardNumber];
    const nameJa = `${suit.ja}の${cardNumber}`;

    return createCard({
      id: `${suitKey}_${pad(cardNumber)}`,
      category: 'numbered',
      number: cardNumber,
      suit: suitKey,
      suitTheme: suit.theme,
      element: suit.element,
      nameJa,
      nameEn: `${cardNumber} of ${suit.en}`,
      keywords: unique(number.keywords.concat([suit.theme])),
      uprightMeaning: `${nameJa}は、${suit.theme}の中で「${number.keywords[0]}」がテーマになるカードです。${number.essence}`,
      seimeiResonanceText: `${nameJa}は、星命の性質が日常の出来事として表に出ることを示します。大きく構えすぎず、目の前の反応を見てください。`,
      loveMeaning: topicSentence(nameJa, suit.loveFocus, suit),
      workMeaning: topicSentence(nameJa, suit.workFocus, suit),
      moneyMeaning: topicSentence(nameJa, suit.moneyFocus, suit),
      relationshipMeaning: topicSentence(nameJa, suit.relationFocus, suit),
      timingMeaning: `${nameJa}は、日常の中で${number.keywords[0]}が表に出やすい時期を示します。小さな違和感も見落とさないでください。`,
      personImage: `${suit.personTone}。${number.keywords[0]}を通して、今の状況に影響を与える人物像です。`,
      light: number.essence,
      shadow: number.shadow,
      adjustment: '一面だけで判断せず、気持ち・事実・行動を落ち着いて見てください。',
      humanMessage: suit.message,
      actionAdvice: number.action,
      caution: '一面だけで判断せず、気持ち・事実・行動を落ち着いて見てください。'
    });
  }

  function createCourtCard(suitKey, court) {
    const suit = SUITS[suitKey];
    const nameJa = `${suit.ja}の${court.rankJa}`;

    return createCard({
      id: `${suitKey}_${court.rank}`,
      category: 'court',
      rank: court.rank,
      rankJa: court.rankJa,
      rankEn: court.rankEn,
      suit: suitKey,
      suitTheme: suit.theme,
      element: suit.element,
      nameJa,
      nameEn: `${court.rankEn} of ${suit.en}`,
      keywords: unique(court.keywords.concat([suit.theme])),
      uprightMeaning: `${nameJa}は、${suit.theme}をまとった人物像や、あなた自身の振る舞いを映します。${court.essence}`,
      seimeiResonanceText: `${nameJa}は、星命の力が人間関係や行動パターンとして表に出ることを示します。相手だけでなく、自分の反応も見てください。`,
      loveMeaning: topicSentence(nameJa, suit.loveFocus, suit),
      workMeaning: topicSentence(nameJa, suit.workFocus, suit),
      moneyMeaning: topicSentence(nameJa, suit.moneyFocus, suit),
      relationshipMeaning: topicSentence(nameJa, suit.relationFocus, suit),
      timingMeaning: `${nameJa}は、人物との関わりや自分の態度が結果に影響しやすい時期を示します。`,
      personImage: `${suit.personTone}で、${court.keywords[0]}の雰囲気を持つ人物像です。`,
      light: court.essence,
      shadow: court.shadow,
      adjustment: '相手を決めつけず、言葉と行動の一致を見てください。',
      humanMessage: suit.message,
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
      .replace(/正位置|逆位置|upright|reversed/gi, '')
      .replace(/[・.．、:：\-_/]/g, '');
  }

  function getTarot78ById(id) {
    return TAROT_78_CARDS.find(function (card) {
      return card.id === id;
    }) || null;
  }

  function getTarot78ByName(name) {
    const key = normalizeName(name);

    return TAROT_78_CARDS.find(function (card) {
      if (normalizeName(card.nameJa) === key) return true;
      if (normalizeName(card.nameEn) === key) return true;
      if (normalizeName(card.id) === key) return true;

      return Array.isArray(card.aliases) && card.aliases.some(function (alias) {
        return normalizeName(alias) === key;
      });
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
    MAJORS,
    NUMBER_MEANINGS,
    COURTS,
    TAROT_78_CARDS,
    getAllTarot78Cards,
    getTarot78ById,
    getTarot78ByName,
    getTarot78ByCategory,
    getTarot78BySuit
  };
});
