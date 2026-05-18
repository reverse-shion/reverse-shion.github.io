(function (root, factory) {
  const api = factory(root.ShionUtils, root.ShionTarotInsights);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionUiRender = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (Utils, SharedTarotInsights) {
  const escapeHtml =
    Utils && typeof Utils.escapeHtml === 'function'
      ? Utils.escapeHtml
      : function fallbackEscapeHtml(value) {
          return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        };

  const ELEMENT_ORDER = ['木', '火', '土', '金', '水'];

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
      adjustment: '勢いだけで飛び出すより、「どこへ向かいたいのか」を一つだけ決めると流れが整います。',
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
      message: '本当の強さは、何も頼らないことではありません。背負い方を整えることも強さです。',
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
      adjustment: '目的地とペースを整えてください。勢いよりも方向性が大切です。',
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
      adjustment: '見えないものを怖がりすぎず、確認できることから整えてください。',
      message: '不安になるのは弱いからではありません。大切だからこそ、心が先に揺れてしまうのです。',
      action: '不安を一つ書き、その横に「確認できること」を一つだけ書いてください。'
    },
    '太陽': {
      essence: '喜び、解放、生命力。心が明るさを取り戻すカードです。',
      shadow: '明るく進める時ほど、勢いで大切なことを見落としてしまうことがあります。',
      adjustment: '喜びを一時的な勢いで終わらせず、続けられる形に整えてください。',
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
    return String(value).trim();
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
      essence: 'このカードは、今の心の流れを映し、現実を整えるための象徴として現れています。',
      shadow: '象徴の力が強く出すぎると、気持ちや行動に偏りが生まれることがあります。',
      adjustment: '良い・悪いで決めつけず、今どこを整えると自分らしさに戻れるのかを見てください。',
      message: 'カードは未来を縛るものではありません。今の心が見落としていた声を、そっと照らすものです。',
      action: '今いちばん気になることを一つだけ書き出し、今日できる小さな行動を選んでください。'
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

  function renderHero(type) {
    const coreLine = getTypeValue(
      type,
      'coreLine',
      'あなたの星命には、今の自分を整えながら未来へ進む力が宿っています。'
    );

    const hook = getTypeValue(
      type,
      'hook',
      'あなたは、自分の中にある本音を少しずつ言葉にしていくことで流れが整いやすい方です。'
    );

    const pain = getTypeValue(
      type,
      'pain',
      '今は、気持ちを抱え込みすぎず、事実と想像を分けて見つめることが大切です。'
    );

    return `
      <section class="result-card result-hero" aria-labelledby="result-hero-title">
        <div class="result-kicker">${badge('詩韻式 星命鑑定', 'simplified')}</div>
        <h2 id="result-hero-title">鑑定の核心</h2>
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
      type.essence || '今ある力を、現実の小さな行動へ変えていける力'
    );

    return `
      ${renderHero(type)}

      <section class="result-card" aria-labelledby="core-section-title">
        <h2 id="core-section-title">1. 生年月日から見える、あなたの芯</h2>
        <p>
          日干は、あなたが無意識に大切にしている「生き方の芯」を映します。
          頑張ろうとする時、傷ついた時、誰かを大切にしたい時に、ふと表に出る心の癖のようなものです。
        </p>

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

        ${paragraph(ref.deep, 'lead-text')}

        ${note('ここで大切なのは、良い・悪いで決めることではありません。性質が強く出た時に、どう整えれば自分らしく戻れるかを見ることです。')}
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
    const max = Math.max(...values, 1);

    const rows = ELEMENT_ORDER.map((element) => {
      const value = Number(counts[element] || 0);
      const width = Math.max((value / max) * 100, value > 0 ? 8 : 0);

      return `
        <div class="bar-row">
          <span>${esc(element)}</span>
          <div class="bar" aria-hidden="true"><i style="width:${width}%"></i></div>
          <b>${esc(value)}</b>
        </div>
      `;
    }).join('');

    return `
      <section class="result-card" aria-labelledby="five-elements-title">
        <h2 id="five-elements-title">4. 五行バランス</h2>
        <p class="soft-text">
          五行の偏りは、欠点ではありません。
          どの力が出やすく、どこを補うと心と現実が整いやすいかを見るための地図です。
        </p>

        <div class="five-elements-bars">
          ${rows}
        </div>

        <div class="summary-list">
          <p><strong>強く出やすい五行：</strong>${esc(joinJa(balance.strongest))}</p>
          <p><strong>弱く出やすい五行：</strong>${esc(joinJa(balance.weakest))}</p>
          <p><strong>補うとよい五行：</strong>${esc(joinJa(balance.supplement))}</p>
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
        ${miniCard('8. 恋愛で出やすい流れ', type.love)}
        ${miniCard('9. 仕事で活きる力', type.work)}
        ${miniCard('10. 金運の整え方', type.money)}
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
        ${readingBlock('整えるポイント', insight.adjustment)}
        ${readingBlock('心への言葉', insight.message)}

        ${readingBlock(
          `相談ジャンル「${topic}」に対して`,
          '急いで答えを決めるより、今の感情・相手や状況の現実・次に取れる行動を分けて見ていくと、流れが整いやすくなります。'
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
            カードを選ぶと、星命タイプを決めるものではなく、
            今の状態・心の偏り・整える鍵・行動指針としての共鳴メッセージを表示します。
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
        ${note('詩韻式では逆位置は採用しません。すべてのカードを正位置の象徴として読み、その中にある光・影・偏り・整える鍵を見ていきます。')}
        <div class="tarot-card-list">
          ${items}
        </div>
      </section>
    `;
  }


  function renderFuture(scores = [], futureReading = '', helpers = {}) {
    const getTurning = helpers.getTurningPointMonths || function (items) { return (items || []).slice(0, 3); };
    const getLove = helpers.getLoveOpportunityMonths || function (items) { return (items || []).slice(0, 3); };
    const getWorkMoney = helpers.getWorkMoneyMonths || function (items) { return (items || []).slice(0, 3); };
    const getCaution = helpers.getCautionMonths || function (items) { return (items || []).slice(0, 3); };
    const list = (items) => (items || []).map((item) => esc(item.label || `${item.month}月`)).join('・') || '未算出';
    const months = Array.isArray(scores) ? scores : [];
    const themes = Array.from(new Set(months.flatMap((item) => item.themes || []))).slice(0, 5).join('・') || '整理・準備・対話';
    const rows = months.map((item) => `
      <tr>
        <th scope="row">${esc(item.label)}</th>
        <td>${esc((item.themes || []).join('・'))}</td>
        <td>${esc(item.loveScore)}</td>
        <td>${esc(item.workScore)}</td>
        <td>${esc(item.moneyScore)}</td>
        <td>${esc(item.cautionScore)}</td>
        <td>${esc(item.note)}</td>
      </tr>
    `).join('');

    return `
      <section class="result-card future-card" aria-labelledby="future-section-title">
        <div class="section-title-row">
          <h2 id="future-section-title">未来鑑定</h2>
          <button type="button" class="ghost section-copy" data-copy-target="futureReadingText">未来鑑定をコピー</button>
        </div>
        <div class="future-summary-grid">
          ${miniCard('今年の総合テーマ', themes, 'action-card')}
          ${miniCard('転換期の月', list(getTurning(months, 3)), 'strength-card')}
          ${miniCard('恋愛・出会い', list(getLove(months, 3)))}
          ${miniCard('仕事・金運', list(getWorkMoney(months, 3)))}
          ${miniCard('注意月', list(getCaution(months, 3)), 'shadow-card')}
        </div>
        <div class="monthly-table-wrap">
          <table class="monthly-table">
            <thead><tr><th>月</th><th>テーマ</th><th>恋愛</th><th>仕事</th><th>金運</th><th>注意</th><th>メモ</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <pre id="futureReadingText" class="reading-pre">${esc(futureReading || '未来鑑定文は生成後に表示されます。')}</pre>
      </section>
    `;
  }

  function renderActionAndFinal(type = {}) {
    const advice = getTypeValue(
      type,
      'advice',
      '今日できる小さな一歩を一つだけ決めてください。'
    );

    const message = getTypeValue(
      type,
      'message',
      '星の言葉は、現実を整えるためのやさしい光です。'
    );

    const reassurance = getTypeValue(
      type,
      'reassurance',
      '大丈夫だよ。小さく整えれば、光は戻ってきます。'
    );

    return `
      <section class="result-card action-result-card" aria-labelledby="action-section-title">
        <h2 id="action-section-title">14. 今やるべきこと</h2>
        ${paragraph(advice, 'lead-text')}

        <ul class="action-list">
          <li>いま一番気になっていることを、一文で書く</li>
          <li>それが「事実」なのか「想像」なのかを分ける</li>
          <li>今日できる小さな確認を一つだけ選ぶ</li>
        </ul>

        <p class="soft-text">
          大きな決断は、心が少し落ち着いてからで大丈夫です。
          焦って答えを出すより、整った状態で選ぶ方が、未来はやさしく変わります。
        </p>
      </section>

      <section class="result-card final-card" aria-labelledby="final-section-title">
        <h2 id="final-section-title">15. 最後の一言</h2>
        ${paragraph(message, 'lead-text')}
        <p class="final-message">${html(reassurance)}</p>
        <p class="soft-text">
          ここまで読んで、少しでも胸に残る言葉があったなら、
          それが今のあなたに必要な星の声です。
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

    // 将来の共通化・テスト用
    normalizeCardKey,
    getTarotInsight
  };
});
