(function (root, factory) {
  const api = factory(root.ShionUtils, root.ShionTarotInsights);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionUiRender = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (Utils, SharedTarotInsights) {
  'use strict';

  const escapeHtml =
    Utils && typeof Utils.escapeHtml === 'function'
      ? Utils.escapeHtml
      : function fallbackEscapeHtml(value) {
          return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        };

  const ELEMENT_ORDER = ['木', '火', '土', '金', '水'];

  const ELEMENT_LABELS = {
    木: {
      label: '始める力',
      note: '新しい一歩、発信、未来へ伸びる力'
    },
    火: {
      label: '表現する力',
      note: '情熱、喜び、魅力を外へ出す力'
    },
    土: {
      label: '現実化する力',
      note: '生活、土台、続けるための力'
    },
    金: {
      label: '選び取る力',
      note: '判断、整理、不要なものを手放す力'
    },
    水: {
      label: '感じ取る力',
      note: '感情、直感、本音に気づく力'
    }
  };

  const MONTH_TYPE_STATUS = {
    追い風月: 'strength',
    慎重月: 'shadow',
    転換期: 'important',
    整える月: 'simplified'
  };

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

  const LOCAL_TAROT_INSIGHTS = {
    '愚者': {
      essence: 'まだ名前のない自由。決まっていないからこそ、未来を選び直せる力。',
      shadow: '自由でいたい気持ちが強くなるほど、責任や現実から少し離れたくなることがあります。',
      adjustment: '勢いだけで飛び出すより、「どこへ向かいたいのか」を一つだけ決めると進みやすくなります。',
      message: '怖さがあるのに進みたいなら、それは無謀ではなく、心が新しい景色を求めているサインです。',
      action: 'やってみたいことを一つだけメモしてください。大きく始めなくて大丈夫です。'
    },
    '魔術師': {
      essence: '可能性を現実に変える始まりの力。手元にあるものから、最初の形を作るカードです。',
      shadow: 'アイデアが多いほど、準備や構想だけで止まってしまうことがあります。',
      adjustment: '完璧な準備を待つより、ひとつ形にすることが大切です。',
      message: 'あなたの中には、もう材料があります。足りないものを数えるより、今あるものをどう使うかを見てください。',
      action: '考えていることを一つ、投稿・連絡・メモ・作業のどれかに変えてください。'
    },
    '女教皇': {
      essence: '静かな直感と、まだ言葉にならない真実。心の奥で答えを感じ取るカードです。',
      shadow: '感じ取る力が強い時ほど、確認しないまま心の中で結論を作ってしまうことがあります。',
      adjustment: '直感を大切にしながらも、事実と言葉で確かめることが必要です。',
      message: '違和感は無視しなくて大丈夫です。ただ、それを怖い結論に急がなくても大丈夫です。',
      action: '「見た事実」と「感じたこと」を分けて書き出してください。'
    },
    '女帝': {
      essence: '受け入れ、育て、満たす力。愛情や豊かさを現実に広げるカードです。',
      shadow: '与える力が強くなりすぎると、自分の満たされなさに気づけなくなることがあります。',
      adjustment: '誰かを満たす前に、自分の心と身体にも栄養を戻してください。',
      message: 'あなたの優しさは、誰かを包む力になります。でも、空っぽになるまで与えなくていいのです。',
      action: '自分のために、温かい飲み物・食事・休息のどれかを一つ選んでください。'
    },
    '皇帝': {
      essence: '責任、決断、土台を作る力。現実を支え、形にするカードです。',
      shadow: '守ろうとする気持ちが強いほど、正しさや管理で押し切りたくなることがあります。',
      adjustment: '支配するより、安心できる仕組みを作ることが大切です。',
      message: '本当の強さは、何も頼らないことではありません。背負い方を見直すことも強さです。',
      action: '今日やることを三つに絞り、残りは後日に回してください。'
    },
    '教皇': {
      essence: '信頼、教え、受け継がれる知恵。人とのつながりの中で道を見つけるカードです。',
      shadow: '常識や正しさを大切にするあまり、自分の本音を押し込めてしまうことがあります。',
      adjustment: '「こうあるべき」だけでなく、「本当はどうしたいか」も大切にしてください。',
      message: '誠実でいることと、我慢し続けることは同じではありません。',
      action: '信頼できる人に、今の気持ちを一言だけ話してみてください。'
    },
    '恋人': {
      essence: '選択、心の一致、関係性の分岐点。何を選ぶかで未来が変わるカードです。',
      shadow: '相手に選ばれたい気持ちが強くなると、自分が何を選びたいのか見えにくくなります。',
      adjustment: '相手の気持ちだけでなく、自分の心が本当に安心できるかを見てください。',
      message: '愛されるかどうかだけではなく、あなた自身がその関係を選びたいかも大切です。',
      action: 'その関係で「嬉しいこと」と「苦しいこと」を一つずつ書き出してください。'
    },
    '戦車': {
      essence: '前進、意志、突破力。迷いを抱えながらも進もうとするカードです。',
      shadow: '進みたい気持ちが強いほど、焦りで自分や相手を急かしてしまうことがあります。',
      adjustment: '目的地とペースを見直してください。勢いよりも方向性が大切です。',
      message: '進む力はあります。だからこそ、どこへ向かうのかを決めることが大切です。',
      action: '今週中に進めることを一つだけ決め、具体的な日時を入れてください。'
    },
    '力': {
      essence: '優しさ、忍耐、内なる強さ。力でねじ伏せず、心で向き合うカードです。',
      shadow: '耐えられる力があるほど、つらさを我慢で処理してしまうことがあります。',
      adjustment: '強いから大丈夫、ではなく、強い人にも休む場所が必要です。',
      message: 'ここまで耐えてきたことには意味があります。でも、これ以上ひとりで抱えなくてもいいのです。',
      action: '我慢していることを一つだけ言葉にしてください。誰かに言えないなら、紙でも大丈夫です。'
    },
    '隠者': {
      essence: '内省、探究、静かな答え。外の声を離れ、自分の真実を探すカードです。',
      shadow: '深く考えるほど、一人で抱え込み、誰にも届かない場所に閉じこもってしまうことがあります。',
      adjustment: '一人の時間は大切ですが、必要な言葉だけは外へ出してください。',
      message: '沈黙の中に答えはあります。ただ、その答えを自分だけで背負わなくても大丈夫です。',
      action: '今考えていることを三行だけ書き出してください。整理するだけで道が見えます。'
    },
    '運命の輪': {
      essence: '流れ、転機、巡り合わせ。止まっていたものが動き出すカードです。',
      shadow: '流れに任せすぎると、自分がどうしたいのかを見失いやすくなります。',
      adjustment: '偶然を待つだけでなく、どの流れに乗るかを自分で選ぶことが大切です。',
      message: '何かが少しずつ動き始めています。その流れに置いていかれるのではなく、選んで乗っていきましょう。',
      action: '最近起きた小さな変化を一つ書き出し、それをどう活かすか考えてください。'
    },
    '正義': {
      essence: '判断、均衡、誠実な選択。感情と現実を並べて見るカードです。',
      shadow: '正しさを求めるほど、心の痛みや迷いを切り捨ててしまうことがあります。',
      adjustment: '冷静な判断に、心の納得も加えてください。',
      message: '正しいかどうかだけでは測れない想いがあります。苦しさも大切な判断材料です。',
      action: 'メリット・デメリットだけでなく、「自分の心がどう感じるか」も書き出してください。'
    },
    '吊るされた男': {
      essence: '停止、受容、視点の転換。動けない時間の中に意味を見つけるカードです。',
      shadow: '我慢を意味のあるものにしようとして、苦しさを正当化してしまうことがあります。',
      adjustment: '無理に進むより、見方を変えることで抜け道が見えてきます。',
      message: '止まっているように見える時間にも、心はちゃんと何かを学んでいます。焦らなくて大丈夫です。',
      action: '今の状況を、別の人に相談されたつもりで見直してみてください。'
    },
    '死神': {
      essence: '終わり、手放し、再生。古い形を閉じ、新しい流れへ向かうカードです。',
      shadow: '終わりが見える時ほど、すべてを失うように感じて怖くなることがあります。',
      adjustment: '全部を捨てる必要はありません。残すものと手放すものを分けてください。',
      message: '終わりは罰ではありません。もう合わなくなった形を脱ぎ、次の自分へ戻るための区切りです。',
      action: '今の自分に必要なもの、もう苦しくなっているものを一つずつ書いてください。'
    },
    '節制': {
      essence: '調和、回復、混ぜ合わせる力。違うものを無理なく馴染ませるカードです。',
      shadow: 'バランスを取ろうとするほど、自分だけが我慢して整えてしまうことがあります。',
      adjustment: '調和とは、自分を消すことではありません。あなたの気持ちも混ぜていいのです。',
      message: 'あなたが整えてきた場の中に、あなた自身の声は入っていましたか。今度はそこを大切にしてください。',
      action: '自分が譲っていることを一つ見つけ、本当はどうしたいかを書いてください。'
    },
    '悪魔': {
      essence: '欲望、執着、本音の影。心が何に縛られているかを映すカードです。',
      shadow: '欲しい、離れられない、やめられないという感情に、自分でも苦しくなることがあります。',
      adjustment: '欲を責めるより、その奥にある寂しさや不安を見てください。',
      message: '執着は弱さではなく、心が何かを強く求めているサインです。ただ、それに飲まれなくても大丈夫です。',
      action: '今手放せないものが「安心」「承認」「愛情」のどれに近いか考えてください。'
    },
    '塔': {
      essence: '崩壊、気づき、真実の露呈。無理に積み上げたものが崩れ、本質が見えるカードです。',
      shadow: '突然の変化に、すべてが壊れたように感じてしまうことがあります。',
      adjustment: '崩れたものを見るだけでなく、なぜ無理が積み上がっていたのかを見てください。',
      message: 'それは罰ではありません。苦しめていた形が、もう続けられないと教えてくれているのです。',
      action: '今いちばん無理をしていることを一つだけ認めてください。認めるだけでも流れは変わります。'
    },
    '星': {
      essence: '希望、癒し、未来への光。まだ遠くても、進む先に光を見つけるカードです。',
      shadow: '希望を見るだけで現実の一歩が止まると、夢が遠いままになってしまいます。',
      adjustment: '希望を小さな行動として現実に置いてください。',
      message: '今はまだ遠く感じても、光は消えていません。その星は、ちゃんと道しるべになります。',
      action: '未来のために今日できる小さな行動を一つ選んでください。'
    },
    '月': {
      essence: '不安、直感、揺れる心。はっきりしない夜の中で、本音を探すカードです。',
      shadow: '想像が膨らむほど、不安を事実のように感じてしまうことがあります。',
      adjustment: '見えないものを怖がりすぎず、確認できることから見てください。',
      message: '不安になるのは弱いからではありません。大切だからこそ、心が先に揺れてしまうのです。',
      action: '不安を一つ書き、その横に「確認できること」を一つだけ書いてください。'
    },
    '太陽': {
      essence: '喜び、解放、生命力。心が明るさを取り戻すカードです。',
      shadow: '明るく進める時ほど、勢いで大切なことを見落としてしまうことがあります。',
      adjustment: '喜びを一時的な勢いで終わらせず、続けられる形にしてください。',
      message: '笑える時間は、ちゃんと戻ってきます。その光を、無理なく続く日常に置いていきましょう。',
      action: '今日うれしかったことを一つ残してください。小さな喜びが次の力になります。'
    },
    '審判': {
      essence: '目覚め、再出発、呼び戻される本当の自分。過去を越えて選び直すカードです。',
      shadow: '過去を思い出すほど、あの時できなかった自分を責めてしまうことがあります。',
      adjustment: '過去を責めるより、今なら選び直せることに意識を向けてください。',
      message: '遅すぎることはありません。眠っていた声が、もう一度立ち上がろうとしています。',
      action: '昔あきらめたこと、今なら少しできそうなことを一つ書いてください。'
    },
    '世界': {
      essence: '完成、統合、一区切り。ここまでの経験が一つの形になるカードです。',
      shadow: '完成に近づくほど、終わることへの寂しさや、次へ進む怖さが出ることがあります。',
      adjustment: '終わりにしがみつかず、ここまでの経験を持って次の循環へ進んでください。',
      message: '積み重ねてきたものは、ちゃんと形になっています。終わりは喪失ではなく、次の扉でもあります。',
      action: 'ここまで頑張ったことを一つ認めて、次に進む準備を始めてください。'
    }
  };

  const TAROT_INSIGHTS =
    SharedTarotInsights && typeof SharedTarotInsights === 'object'
      ? Object.assign({}, LOCAL_TAROT_INSIGHTS, SharedTarotInsights)
      : LOCAL_TAROT_INSIGHTS;

  function text(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    const trimmed = String(value).trim();
    return trimmed === '' ? fallback : trimmed;
  }

  function has(value) {
    return text(value).length > 0;
  }

  function esc(value) {
    return escapeHtml(text(value));
  }

  function html(value) {
    return esc(value).replace(/\n/g, '<br>');
  }

  function joinJa(values, fallback = '参考なし') {
    const list = Array.isArray(values) ? values.filter(has) : [];
    return list.length ? list.join('、') : fallback;
  }

  function statusClass(status) {
    return `status status-${text(status, 'default')}`;
  }

  function badge(label, status = 'simplified') {
    return `<span class="${esc(statusClass(status))}">${esc(label)}</span>`;
  }

  function paragraph(value, className = '') {
    if (!has(value)) return '';
    const cls = className ? ` class="${esc(className)}"` : '';
    return `<p${cls}>${html(value)}</p>`;
  }

  function note(value, className = '') {
    if (!has(value)) return '';
    const cls = className ? ` ${esc(className)}` : '';
    return `<div class="note-box${cls}">${paragraph(value)}</div>`;
  }

  function miniCard(title, body, className = '') {
    if (!has(body)) return '';
    const cls = className ? ` ${esc(className)}` : '';
    return `
      <article class="mini-card${cls}">
        <h3>${esc(title)}</h3>
        ${paragraph(body)}
      </article>
    `;
  }

  function readingBlock(title, body, className = '') {
    if (!has(body)) return '';
    const cls = className ? ` ${esc(className)}` : '';
    return `
      <div class="tarot-reading-block${cls}">
        <h4>${esc(title)}</h4>
        ${paragraph(body)}
      </div>
    `;
  }

  function getTypeValue(type, key, fallback = '') {
    if (!type) return fallback;
    if (has(type[key])) return type[key];
    if (type.readingBlocks && has(type.readingBlocks[key])) return type.readingBlocks[key];
    return fallback;
  }

  function normalizeCardKey(name) {
    const raw = text(name);
    if (TAROT_INSIGHTS[raw]) return raw;

    const cleaned = raw
      .replace(/正位置|逆位置|upright|reversed/gi, '')
      .replace(/\bthe\b/gi, '')
      .replace(/[ 　]/g, '')
      .replace(/^[0-9０-９]+[.．、:：\-_/]*/g, '')
      .replace(/^[IVXLCDMⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ]+[.．、:：\-_/]*/gi, '')
      .toLowerCase()
      .trim();

    if (TAROT_NAME_ALIASES[cleaned]) return TAROT_NAME_ALIASES[cleaned];

    const direct = Object.keys(TAROT_INSIGHTS).find((nameJa) => raw.includes(nameJa));
    if (direct) return direct;

    return raw;
  }

  function getTarotInsight(cardName) {
    const key = normalizeCardKey(cardName);

    return TAROT_INSIGHTS[key] || {
      essence: 'このカードは、今の心の状態を映し、現実を見るための象徴として現れています。',
      shadow: '象徴の力が強く出すぎると、気持ちや行動に偏りが生まれることがあります。',
      adjustment: '良い・悪いで決めつけず、今どこを見直すと自分らしさに戻れるのかを見てください。',
      message: 'カードは未来を縛るものではありません。今の心が見落としていた声に気づくためのものです。',
      action: '今いちばん気になることを一つだけ書き出し、今日できる行動を選んでください。'
    };
  }

  function getPositions(entriesLength, positions) {
    if (Array.isArray(positions) && positions.length) return positions;
    return DEFAULT_POSITIONS[entriesLength] || DEFAULT_POSITIONS[3];
  }

  function safeCardName(entry, card) {
    if (card && has(card.nameJa)) return card.nameJa;
    return normalizeCardKey(entry && entry.name ? entry.name : 'カード');
  }

  function scoreText(value) {
    const num = Number(value);
    return Number.isFinite(num) ? String(Math.round(num)) : '未算出';
  }

  function monthLabel(item) {
    if (!item) return '';
    if (has(item.label)) return item.label;
    return item.month ? `${item.month}月` : '';
  }

  function monthType(item) {
    return text(item && item.monthType, '整える月');
  }

  function monthTypeStatus(type) {
    return MONTH_TYPE_STATUS[type] || 'simplified';
  }

  function futureMonthList(items, fallback = '未算出') {
    const list = Array.isArray(items)
      ? items.map(monthLabel).filter(has)
      : [];

    return list.length ? list.join('・') : fallback;
  }

  function elementLabelList(values, fallback = '参考なし') {
    const list = Array.isArray(values)
      ? values
          .map((element) => {
            const info = ELEMENT_LABELS[element];
            return info ? info.label : element;
          })
          .filter(has)
      : [];

    return list.length ? list.join('、') : fallback;
  }

  function collectThemes(months) {
    if (!Array.isArray(months)) return [];

    return months.reduce((acc, item) => {
      const themes = item && Array.isArray(item.themes) ? item.themes : [];
      themes.forEach((theme) => {
        if (has(theme) && !acc.includes(theme)) acc.push(theme);
      });
      return acc;
    }, []);
  }

  function firstTheme(item, fallback = '見直し') {
    const themes = item && Array.isArray(item.themes) ? item.themes.filter(has) : [];
    return themes[0] || fallback;
  }

  function joinedThemes(item, fallback = '見直し・準備') {
    const themes = item && Array.isArray(item.themes) ? item.themes.filter(has).slice(0, 3) : [];
    return themes.length ? themes.join('・') : fallback;
  }

  function buildMonthlyLeadText(item) {
    const monthLead = text(item && item.monthLead);
    const themeText = text(item && item.themeText);
    const parts = [];

    if (monthLead) parts.push(monthLead);
    if (themeText && themeText !== monthLead) parts.push(themeText);

    return parts.join('\n');
  }

  function monthlyFallbackText(item) {
    const label = monthLabel(item);
    const type = monthType(item);
    const theme = firstTheme(item);

    if (type === '追い風月') {
      return `${label}は、行動が反応につながりやすい月です。「${theme}」を意識して、できることを一つ外へ出してみてください。`;
    }

    if (type === '慎重月') {
      return `${label}は、急ぐより確認を大切にしたい月です。焦って決めず、いったん持ち帰る余裕を持ってください。`;
    }

    if (type === '転換期') {
      return `${label}は、気持ちや状況の向きが変わりやすい月です。違和感が出たら、無視せず立ち止まって見てください。`;
    }

    return `${label}は、足元を見直す月です。予定や気持ちを一つ片づけるだけでも、次の一歩が軽くなります。`;
  }

  function monthlyCautionText(item) {
    return text(item && item.cautionText);
  }

  function monthlyActionText(item) {
    return text(item && item.monthlyAction, '今月できることを一つだけ選んで、無理のない形で進めてください。');
  }

  function monthlyKeywordText(item) {
    return text(item && item.monthlyKeyword, '焦らず、今できることから');
  }

  function renderScorePills(item) {
    return `
      <div class="score-pill-row" aria-label="月別スコア">
        <span class="score-pill love">恋愛 ${esc(scoreText(item && item.loveScore))}</span>
        <span class="score-pill work">仕事 ${esc(scoreText(item && item.workScore))}</span>
        <span class="score-pill money">金運 ${esc(scoreText(item && item.moneyScore))}</span>
        <span class="score-pill caution">注意 ${esc(scoreText(item && item.cautionScore))}</span>
      </div>
    `;
  }

  function renderHero(type) {
    const coreLine = getTypeValue(
      type,
      'coreLine',
      'あなたの星命には、今の自分を見つめ直しながら未来へ進む力が宿っています。'
    );

    const hook = getTypeValue(
      type,
      'hook',
      'あなたは、自分の中にある本音を少しずつ言葉にしていくことで道が見えやすい方です。'
    );

    const pain = getTypeValue(
      type,
      'pain',
      '今は、気持ちを抱え込みすぎず、事実と想像を分けて見つめることが大切です。'
    );

    return `
      <section class="result-card result-hero" aria-labelledby="result-hero-title">
        <div class="result-kicker">${badge('詩韻式 星命鑑定', 'simplified')}</div>
        <h2 id="result-hero-title">あなたの今年の物語</h2>
        <p class="core-line">${html(coreLine)}</p>
        ${paragraph(hook, 'lead-text')}
        ${paragraph(pain, 'soft-text')}
      </section>
    `;
  }

  function renderChart(chart = {}) {
    const pillars = chart.pillars || {};
    const ref = chart.sanmeiReference || {};
    const seimei = chart.seimei || {};
    const type = seimei.baseType || {};
    const subType = seimei.subType || {};

    const year = pillars.year || {};
    const month = pillars.month || {};
    const day = pillars.day || {};

    const strength = getTypeValue(
      type,
      'strength',
      type.essence || '今ある力を、現実の行動へ変えていける力'
    );

    return `
      ${renderHero(type)}

      <section class="result-card" aria-labelledby="core-section-title">
        <h2 id="core-section-title">1. 生年月日から見える、あなたの芯</h2>
        <p>
          ここでは、専門用語そのものよりも、
          あなたが無意識に大切にしている生き方の癖を見ていきます。
        </p>
        <p class="soft-text">
          頑張ろうとする時、傷ついた時、誰かを大切にしたい時。
          ふと表に出る心の反応に、あなたらしさが出ます。
        </p>

        ${paragraph(ref.deep, 'lead-text')}

        <details class="basis-details">
          <summary>診断に使用した参考データを見る</summary>
          <dl class="data-list">
            <dt>日干</dt>
            <dd>${esc(ref.dayStem || '未算出')}（五行${esc(ref.element || '参考')}・${esc(ref.yinYang || '参考')}／${esc(ref.symbol || '象徴')}）</dd>

            <dt>年柱</dt>
            <dd>${esc(year.name || '未算出')} ${badge(year.label || '参考値', year.status || 'simplified')}</dd>

            <dt>月柱</dt>
            <dd>${esc(month.name || '未算出')} ${badge(month.label || '参考値', month.status || 'simplified')}</dd>

            <dt>日柱</dt>
            <dd>${esc(day.name || '未算出')} ${badge(day.label || '参考値', day.status || 'simplified')}</dd>
          </dl>
        </details>

        ${note('大切なのは、性質を良い・悪いで決めることではありません。疲れた時にどこへ寄りやすいかを知り、自分に戻る方法を見つけることです。')}
      </section>

      <section class="result-card" aria-labelledby="basis-section-title">
        <h2 id="basis-section-title">2. 計算根拠</h2>
        <p class="soft-text">
          この項目は鑑定の透明性を保つための参考データです。
          細かな干支計算は、環境や暦法によって確認が必要な場合があります。
        </p>

        <details class="basis-details">
          <summary>計算根拠を確認する</summary>
          <p><strong>年柱：</strong>${esc(year.basis || '参考算出')}</p>
          <p><strong>月柱：</strong>${esc(month.basis || '参考算出')}</p>
          <p><strong>日柱：</strong>${esc(day.basis || '参考算出')}</p>
        </details>
      </section>

      <section class="result-card" aria-labelledby="seimei-section-title">
        <h2 id="seimei-section-title">3. 詩韻式 星命タイプ</h2>
        <p>${badge('詩韻式独自解釈・簡易判定', 'simplified')}</p>

        <h3>${esc(type.name || '星命タイプ')}</h3>
        ${paragraph(type.shortTitle, 'lead-text')}

        ${paragraph(seimei.basis)}
        <p><strong>補助タイプ：</strong>${esc(subType.name || '補助タイプ未算出')}</p>
        ${paragraph(seimei.nuance)}

        ${note(`あなたの中にある力：\n${strength}`, 'important-note')}
      </section>
    `;
  }

  function renderFiveElements(balance = {}) {
    const counts = balance.counts || {};
    const values = ELEMENT_ORDER.map((element) => Number(counts[element] || 0));
    const max = Math.max.apply(null, values.concat([1]));

    const rows = ELEMENT_ORDER.map((element) => {
      const value = Number(counts[element] || 0);
      const width = Math.max((value / max) * 100, value > 0 ? 8 : 0);
      const info = ELEMENT_LABELS[element] || { label: element, note: '' };

      return `
        <div class="bar-row balance-row">
          <span class="balance-name">
            <strong>${esc(info.label)}</strong>
            <small>${esc(element)}：${esc(info.note)}</small>
          </span>
          <div class="bar" aria-hidden="true"><i style="width:${width}%"></i></div>
          <b>${esc(value)}</b>
        </div>
      `;
    }).join('');

    return `
      <section class="result-card" aria-labelledby="five-elements-title">
        <h2 id="five-elements-title">4. 心と行動のバランス</h2>
        <p class="soft-text">
          ここでは五行を、専門用語ではなく「心と行動の使い方」として見ています。
          どれが多いから良い、少ないから悪いというものではありません。
        </p>

        <div class="five-elements-bars balance-bars">
          ${rows}
        </div>

        <div class="summary-list">
          <p><strong>今、出やすい力：</strong>${esc(elementLabelList(balance.strongest))}</p>
          <p><strong>控えめになりやすい力：</strong>${esc(elementLabelList(balance.weakest))}</p>
          <p><strong>意識すると助けになる力：</strong>${esc(elementLabelList(balance.supplement))}</p>
        </div>

        ${paragraph(balance.note)}
      </section>
    `;
  }

  function renderTypeCards(type = {}) {
    const coreLine = getTypeValue(type, 'coreLine', '');
    const hook = getTypeValue(type, 'hook', '');
    const pain = getTypeValue(type, 'pain', '');
    const reassurance = getTypeValue(type, 'reassurance', '');

    return `
      <section class="result-card" aria-labelledby="type-flow-title">
        <h2 id="type-flow-title">5. 星命タイプから見た、心の流れ</h2>
        ${coreLine ? `<p class="core-line small">${html(coreLine)}</p>` : ''}
        ${paragraph(hook, 'lead-text')}
        ${paragraph(pain, 'soft-text')}
      </section>

      <section class="result-card grid-mini" aria-label="星命タイプの詳細">
        ${miniCard('6. あなたの強み', type.strength || type.essence, 'strength-card')}
        ${miniCard('7. 疲れた時に出やすい形', type.shadow, 'shadow-card')}
        ${miniCard('8. 恋愛で出やすいこと', type.love)}
        ${miniCard('9. 仕事で活きる力', type.work)}
        ${miniCard('10. 金運の見直し方', type.money)}
        ${miniCard('11. 人間関係の癖', type.relationship)}
        ${miniCard('12. 今の運気テーマ', type.advice, 'action-card')}
      </section>

      ${
        reassurance
          ? `
            <section class="result-card seimei-message-card">
              <h2>星命からのひとこと</h2>
              <p class="final-message">${html(reassurance)}</p>
            </section>
          `
          : ''
      }
    `;
  }

  function renderTarotCard(entry, index, resolvedPositions, findCard, topic) {
    const card = typeof findCard === 'function' ? findCard(entry.name) : null;
    const cardName = safeCardName(entry, card);
    const insight = getTarotInsight(cardName);

    const keywords =
      card && Array.isArray(card.uprightKeywords)
        ? card.uprightKeywords.filter(has).join('、')
        : '';

    const uprightMeaning = card && has(card.uprightMeaning) ? card.uprightMeaning : '';
    const resonance =
      card && has(card.seimeiResonanceText)
        ? card.seimeiResonanceText
        : 'このカードは、今の星命タイプが持つ力を現実へ落とし込むための補助線になります。';

    const actionAdvice =
      card && has(card.actionAdvice)
        ? card.actionAdvice
        : insight.action;

    return `
      <article class="tarot-card">
        <h3>${esc(resolvedPositions[index] || `カード${index + 1}`)}：${esc(cardName)}</h3>
        <p class="soft-text">詩韻式では、このカードを正位置の象徴として読みます。</p>

        ${keywords ? `<p><strong>キーワード：</strong>${esc(keywords)}</p>` : ''}

        ${readingBlock('本質', insight.essence)}
        ${uprightMeaning ? readingBlock('補助解釈', uprightMeaning) : ''}
        ${readingBlock('影として出やすいこと', insight.shadow)}
        ${readingBlock('見直すポイント', insight.adjustment)}
        ${readingBlock('心への言葉', insight.message)}

        ${readingBlock(
          `相談ジャンル「${topic}」に対して`,
          '急いで答えを決めるより、今の感情・相手や状況の現実・次に取れる行動を分けて見ていくと、判断しやすくなります。'
        )}

        ${readingBlock('星命との共鳴', resonance)}
        ${readingBlock('今できる行動', actionAdvice, 'action')}
      </article>
    `;
  }

  function renderTarot(entries = [], positions = [], findCard = () => null, topic = '総合') {
    if (!Array.isArray(entries) || !entries.length) {
      return `
        <section class="result-card" aria-labelledby="tarot-section-title">
          <h2 id="tarot-section-title">13. タロット共鳴メッセージ</h2>
          <p>
            カードを選ぶと、今の状態・心の偏り・見直す鍵・行動指針としての共鳴メッセージを表示します。
          </p>
          ${note('詩韻式では逆位置は採用しません。すべてのカードを正位置の象徴として読み、その中にある光・影・調整点を見ていきます。')}
        </section>
      `;
    }

    const resolvedPositions = getPositions(entries.length, positions);
    const items = entries
      .map((entry, index) => renderTarotCard(entry, index, resolvedPositions, findCard, topic))
      .join('');

    return `
      <section class="result-card" aria-labelledby="tarot-section-title">
        <h2 id="tarot-section-title">13. タロット共鳴メッセージ</h2>
        ${note('詩韻式では逆位置は採用しません。すべてのカードを正位置の象徴として読み、その中にある光・影・偏り・見直す鍵を見ていきます。')}
        <div class="tarot-card-list">
          ${items}
        </div>
      </section>
    `;
  }

  function renderFutureSummaryCards(months, helpers) {
    const safeHelpers = helpers || {};
    const getTurning = safeHelpers.getTurningPointMonths || function (items) { return (items || []).slice(0, 3); };
    const getLove = safeHelpers.getLoveOpportunityMonths || function (items) { return (items || []).slice(0, 3); };
    const getWorkMoney = safeHelpers.getWorkMoneyMonths || function (items) { return (items || []).slice(0, 3); };
    const getCaution = safeHelpers.getCautionMonths || function (items) { return (items || []).slice(0, 3); };

    const themes = collectThemes(months).slice(0, 5).join('・') || '見直し・準備・対話';

    const tailwind = months.filter((item) => monthType(item) === '追い風月');
    const cautious = months.filter((item) => monthType(item) === '慎重月');
    const turning = months.filter((item) => monthType(item) === '転換期');

    return `
      <div class="future-summary-grid">
        ${miniCard('今年の総合テーマ', themes, 'action-card')}
        ${miniCard('追い風月', futureMonthList(tailwind, '今回は大きな追い風月より、準備や見直しが中心です'), 'strength-card')}
        ${miniCard('慎重に見たい月', futureMonthList(cautious, futureMonthList(getCaution(months, 3))), 'shadow-card')}
        ${miniCard('転換期', futureMonthList(turning, futureMonthList(getTurning(months, 3))), 'important-card')}
        ${miniCard('恋愛・出会い', futureMonthList(getLove(months, 3)))}
        ${miniCard('仕事・金運', futureMonthList(getWorkMoney(months, 3)))}
      </div>
    `;
  }

  function renderMonthCard(item) {
    const type = monthType(item);
    const lead = buildMonthlyLeadText(item) || monthlyFallbackText(item);
    const caution = monthlyCautionText(item);
    const action = monthlyActionText(item);
    const keyword = monthlyKeywordText(item);

    return `
      <article class="future-month-card ${esc(`future-month-${monthTypeStatus(type)}`)}">
        <header class="future-month-header">
          <div>
            <h3>${esc(monthLabel(item))}</h3>
            <p class="future-month-theme">${esc(joinedThemes(item))}</p>
          </div>
          ${badge(type, monthTypeStatus(type))}
        </header>

        ${renderScorePills(item)}

        <div class="future-month-body">
          ${paragraph(lead, 'soft-text')}
          ${caution ? paragraph(caution, 'future-caution-text') : ''}
        </div>

        <div class="future-month-action">
          <strong>今月の行動</strong>
          ${paragraph(action)}
        </div>

        <p class="future-keyword">「${esc(keyword)}」</p>
      </article>
    `;
  }

  function renderFutureReadingBox(futureReading) {
    if (!has(futureReading)) {
      return note('未来鑑定文は生成後に表示されます。', 'soft-note');
    }

    return `
      <div class="future-reading-box">
        <h3>鑑定書本文</h3>
        <p class="soft-text">
          月ごとの動きを見た後に、今年全体の読み解きを文章で確認できます。
          気になるところだけでも大丈夫です。今の自分に近い言葉を拾ってみてください。
        </p>
        <pre id="futureReadingText" class="reading-pre">${esc(futureReading)}</pre>
      </div>
    `;
  }

  function renderFuture(scores = [], futureReading = '', helpers = {}) {
    const months = Array.isArray(scores) ? scores : [];
    const monthCards = months.length
      ? months.map(renderMonthCard).join('')
      : note('月別スコアが生成されると、ここに12ヶ月分の未来鑑定カードが表示されます。');

    const copyButton = has(futureReading)
      ? '<button type="button" class="ghost section-copy" data-copy-target="futureReadingText">未来鑑定をコピー</button>'
      : '';

    return `
      <section class="result-card future-card" aria-labelledby="future-section-title">
        <div class="section-title-row">
          <div>
            <h2 id="future-section-title">あなたの今年の物語</h2>
            <p class="soft-text">
              月ごとの追い風、立ち止まりたい時期、選び直すタイミングを見ていきます。
              良い・悪いではなく、あなたが無理なく進むための目安です。
            </p>
          </div>
          ${copyButton}
        </div>

        ${renderFutureSummaryCards(months, helpers)}

        <div class="future-score-guide">
          ${note('数字は運の良し悪しではありません。恋愛・仕事・金運・注意が、どれだけ表に出やすいかを見るための目安です。注意が高い月は怖い月ではなく、確認を丁寧にしたい月として読んでください。')}
        </div>

        <div class="future-month-grid">
          ${monthCards}
        </div>

        ${renderFutureReadingBox(futureReading)}
      </section>
    `;
  }

  function renderActionAndFinal(type = {}) {
    const advice = getTypeValue(
      type,
      'advice',
      '今日できる一歩を一つだけ決めてください。'
    );

    const message = getTypeValue(
      type,
      'message',
      '星の言葉は、現実を見つめ直すためのやさしい光です。'
    );

    const reassurance = getTypeValue(
      type,
      'reassurance',
      '大丈夫だよ。今できることから始めれば、未来は少しずつ変わります。'
    );

    return `
      <section class="result-card action-result-card" aria-labelledby="action-section-title">
        <h2 id="action-section-title">14. 今やるべきこと</h2>
        ${paragraph(advice, 'lead-text')}

        <ul class="action-list">
          <li>いま一番気になっていることを、一文で書く</li>
          <li>それが「事実」なのか「想像」なのかを分ける</li>
          <li>今日できる確認を一つだけ選ぶ</li>
        </ul>

        <p class="soft-text">
          大きな決断は、心が少し落ち着いてからで大丈夫です。
          焦って答えを出すより、今の自分に合う形で選ぶ方が、未来は変わりやすくなります。
        </p>
      </section>

      <section class="result-card final-card" aria-labelledby="final-section-title">
        <h2 id="final-section-title">15. 最後の一言</h2>
        ${paragraph(message, 'lead-text')}
        <p class="final-message">${html(reassurance)}</p>
        <p class="soft-text">
          ここまで読んで、少しでも胸に残る言葉があったなら、
          それが今のあなたに必要なメッセージです。
        </p>
      </section>
    `;
  }

  return {
    renderChart,
    renderFiveElements,
    renderTypeCards,
    renderTarot,
    renderFuture,
    renderActionAndFinal,

    normalizeCardKey,
    getTarotInsight
  };
});
