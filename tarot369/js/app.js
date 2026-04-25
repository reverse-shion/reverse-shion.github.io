const CONFIG = {
  consultationUrl: "https://lin.ee/LYnlU0f",
  cardBasePath: "../love/tarot/",
  cardBackImage: "../love/tarot/card-back.webp"
};

const TOPIC_COPY = {
  self: {
    label: "今のあなたへ",
    hint: "今の自分に必要なテーマを、一枚のカードが静かに映します。",
    bridge:
      "この一枚は、今のあなたの心に強く出ているテーマを映しています。ただ、本当の迷いは一枚だけでは見えきらないこともあります。個人鑑定では、今の状況・本音・これからの選択まで丁寧に整理できます。"
  },
  love: {
    label: "恋愛について",
    hint: "相手の気持ち、関係の流れ、自分の本音を一枚から受け取ります。",
    bridge:
      "この一枚は、今の恋に流れている大きな気配を映しています。ただ、相手の本音、連絡の意味、待つべきか動くべきかまでは、状況に合わせて深く読む必要があります。個人鑑定では、恋の背景まで丁寧に整理できます。"
  },
  work: {
    label: "仕事・活動について",
    hint: "今の活動、仕事、進む方向に必要な言葉を受け取ります。",
    bridge:
      "この一枚は、仕事や活動における今のテーマを映しています。ただ、何を優先すべきか、どこを変えるべきか、今後どう動くべきかは状況によって変わります。個人鑑定では、現実的な流れまで整理できます。"
  },
  relation: {
    label: "人間関係について",
    hint: "人との距離感、言葉、関係性に必要なメッセージを受け取ります。",
    bridge:
      "この一枚は、人間関係の中で今あなたが受け取るべきテーマを映しています。ただ、相手の本音、距離感、どう関わるべきかは一枚だけでは見えきらないこともあります。個人鑑定では、心を守る関わり方まで丁寧に見ていけます。"
  }
};

const CARDS = [
  {
    slug: "fool",
    name: "愚者",
    keyword: "始まり / まだ名前のない可能性",
    main:
      "愚者は、まだ形になっていない未来の前に立つカードです。今のあなたは、怖さと期待の両方を抱えながらも、心のどこかで次の流れを感じ取っているのかもしれません。",
    sub:
      "今は完璧な準備よりも、自分の心が少し軽くなる方向へ一歩だけ寄ってみてください。結論を急がなくても、物語はもう静かに始まっています。",
    cta:
      "始まりの前の迷いを、あなたの状況に合わせて丁寧に整理できます。"
  },
  {
    slug: "magician",
    name: "魔術師",
    keyword: "言葉 / 形にする力",
    main:
      "魔術師は、まだ外に出ていない力を現実へ変えるカードです。あなたの中には、すでに始めるための材料があります。足りないのは能力ではなく、自分の言葉で流れを動かすきっかけかもしれません。",
    sub:
      "頭の中だけで抱えず、ひとつ言葉にして外へ出してみてください。短い宣言、小さな行動、そのどれもが未来を動かす合図になります。",
    cta:
      "今ある力をどう現実にしていくか、具体的に読み解けます。"
  },
  {
    slug: "high-priestess",
    name: "女教皇",
    keyword: "沈黙 / 静かな本音",
    main:
      "女教皇は、まだ言葉になっていない本音を映します。なんとなく引っかかる感覚、理由は分からないけれど無視できない違和感。その奥に、今のあなたが本当は知っている答えが眠っています。",
    sub:
      "急いで結論を出さなくて大丈夫です。まずは、何に違和感があるのかを静かに見つめてください。直感は、恐れではなく小さな真実として現れることがあります。",
    cta:
      "言葉にならない本音や相手の本心を、丁寧に整理できます。"
  },
  {
    slug: "empress",
    name: "女帝",
    keyword: "受け取る愛 / 自己価値",
    main:
      "女帝は、与える愛だけでなく、受け取る愛を思い出させるカードです。あなたは誰かを大切にすることには慣れていても、自分が大切にされることには遠慮してきたのかもしれません。",
    sub:
      "今日は、誰かのやさしさや自分への労わりを否定せずに受け取ってみてください。愛は、頑張って証明するものではなく、安心の中で育つものです。",
    cta:
      "愛情や関係性の流れを、あなたの状況に合わせて深く見ていけます。"
  },
  {
    slug: "emperor",
    name: "皇帝",
    keyword: "現実 / 軸を立てる",
    main:
      "皇帝は、自分の基準を立て直すカードです。周りに合わせることが増えすぎて、本当は何を守りたいのか分からなくなっていませんか。",
    sub:
      "まずは、これは守りたい、これはもう無理、という境界線を言葉にしてみてください。強さとは無理を続けることではなく、自分の軸へ戻ることです。",
    cta:
      "どう決めるべきか、どこまで守るべきかを現実的に整理できます。"
  },
  {
    slug: "hierophant",
    name: "教皇",
    keyword: "信頼 / 支えを受け取る",
    main:
      "教皇は、ひとりで抱え込まなくていいことを伝えるカードです。今の答えは、孤独な考え込みの中ではなく、信頼できる言葉や支えの中にあるのかもしれません。",
    sub:
      "頼ることは弱さではありません。心に灯りを戻すために、話すこと、学ぶこと、受け取ることを許してみてください。",
    cta:
      "一人では整理しきれない悩みの本質を、丁寧に言葉へ変えていけます。"
  },
  {
    slug: "lovers",
    name: "恋人",
    keyword: "選択 / 心が震えるほう",
    main:
      "恋人は、誰かとの関係だけでなく、自分の心が何を選ぶのかを問うカードです。正しいかどうかより、本当はどちらに心が震えているのかが大切です。",
    sub:
      "誰かに納得される答えより、自分がちゃんと納得できる選択を大切にしてください。迷っているのは弱いからではなく、大切にしたいものがあるからです。",
    cta:
      "恋愛や大切な選択の先を、相手の気持ちや流れまで含めて深く見られます。"
  },
  {
    slug: "chariot",
    name: "戦車",
    keyword: "前進 / 感情の手綱",
    main:
      "戦車は、動き出す力を示します。ただし本質は勢いだけではなく、怖さと進みたい気持ちの両方を抱えたまま、どちらへ進むかを選ぶことです。",
    sub:
      "今は、迷わずできる小さな行動をひとつ選んでみてください。全部を変えなくても、前へ進んでいる実感が流れを変えます。",
    cta:
      "今動くべきか、どう進めばいいかを具体的に読み解けます。"
  },
  {
    slug: "strength",
    name: "力",
    keyword: "やさしい強さ / 自分を責めない力",
    main:
      "力は、押し切る強さではなく、揺れる心を抱きしめる強さを示します。しんどいのに平気なふりをして、頑張りすぎていませんか。",
    sub:
      "今日はできなかったことより、できた小さなことを数えてみてください。回復は、自分を責める言葉を少しだけやさしく変えるところから始まります。",
    cta:
      "ここからどう回復していくか、あなたに合う形で整理できます。"
  },
  {
    slug: "hermit",
    name: "隠者",
    keyword: "内省 / 心の奥を照らす",
    main:
      "隠者は、外の答えではなく内側の真実を照らすカードです。人とのやりとりや情報の多さの中で、少し心が疲れているのかもしれません。",
    sub:
      "今日は少しだけ静かな時間を持って、本当は何に疲れていたのかを見つめてください。ひとりになることは孤独ではなく、心を整えるための灯りです。",
    cta:
      "誰にも言えない気持ちや本音の整理を、静かに深く見ていけます。"
  },
  {
    slug: "wheel-of-fortune",
    name: "運命の輪",
    keyword: "転機 / 流れの変化",
    main:
      "運命の輪は、流れが切り替わり始めていることを示します。思い通りにいかない出来事も、後から見れば必要な転換点だったと分かることがあります。",
    sub:
      "今は無理にコントロールしようとするより、この変化が何を教えているのかを見てみてください。輪は、見えないところで静かに回り始めています。",
    cta:
      "今後どう変わるか、いつ動くべきかを流れに沿って読み解けます。"
  },
  {
    slug: "justice",
    name: "正義",
    keyword: "見極め / 対等さ",
    main:
      "正義は、感情に飲まれず関係や状況をまっすぐ見るカードです。どこかで、自分ばかり我慢していると感じていませんか。",
    sub:
      "やさしさと我慢を同じにしないことが大切です。どこまで受け入れ、どこから自分を守るのか。その線引きは、冷たさではなく尊厳です。",
    cta:
      "どこで線を引くべきか、どう選ぶべきかを丁寧に整理できます。"
  },
  {
    slug: "hanged-man",
    name: "吊るされた男",
    keyword: "停滞 / 視点の反転",
    main:
      "吊るされた男は、進まない時間の中にある意味を示します。動けないことは失敗ではなく、見方を変えるための静かな準備かもしれません。",
    sub:
      "今は、なぜ進めないのかより、今だから見えることは何かに意識を向けてください。止まることでしか見えない景色があります。",
    cta:
      "待つべきか、見方を変えるべきかを深く整理できます。"
  },
  {
    slug: "death",
    name: "死神",
    keyword: "終わりと再生 / 古い形を脱ぐ",
    main:
      "死神は、怖い終わりではなく、古い形を脱いで次へ進むカードです。今までのやり方や関係性が、もう今のあなたには合わなくなっているのかもしれません。",
    sub:
      "手放すことは冷たさではありません。今の自分に合わなくなったものを認めることが、新しい流れを迎える入口になります。",
    cta:
      "何を手放し、ここからどう進むべきかを丁寧に見ていけます。"
  },
  {
    slug: "temperance",
    name: "節制",
    keyword: "調和 / ちょうどよい距離",
    main:
      "節制は、心と現実の温度差を整えるカードです。頑張ることには慣れていても、整えることを後回しにしていませんか。",
    sub:
      "今日は、やることだけでなく、やらないこともひとつ決めてみてください。余白があると、流れは少しずつ整っていきます。",
    cta:
      "今のあなたに合うペースや立て直し方を深く読み解けます。"
  },
  {
    slug: "devil",
    name: "悪魔",
    keyword: "執着 / 満たされなかった想い",
    main:
      "悪魔は、やめたいのに離れられない気持ちを映します。それは意志が弱いからではなく、心が何かを必死に満たそうとしているサインかもしれません。",
    sub:
      "今は自分を責めるより、その執着が何の代わりになっているのかを見つめてください。苦しさの正体が見えると、心の鎖は少しずつ緩みます。",
    cta:
      "執着や不安、本当に満たしたいものを深く整理できます。"
  },
  {
    slug: "tower",
    name: "塔",
    keyword: "崩れる幻想 / 立て直し",
    main:
      "塔は、突然の変化や衝撃を映します。けれどそれは、すべてが終わるというより、無理に保ってきた形が崩れ、本当に必要なものが見えてくる合図です。",
    sub:
      "今は無理に立て直そうとしなくて大丈夫です。まずは、何が一番つらかったのかを自分で分かってあげてください。",
    cta:
      "この出来事の意味や、ここからどう立て直すかを深く見られます。"
  },
  {
    slug: "star",
    name: "星",
    keyword: "希望 / 傷のあとに残る光",
    main:
      "星は、傷ついたあとに残る静かな希望を示します。まだ全部は整っていなくても、心のどこかでこのまま終わらない気がしているのかもしれません。",
    sub:
      "大きな確信でなくて大丈夫です。ほんの少し、大丈夫かもと思える感覚を大切にしてください。その小さな光が、次の道しるべになります。",
    cta:
      "希望を現実の一歩につなげる流れを、丁寧に見ていけます。"
  },
  {
    slug: "moon",
    name: "月",
    keyword: "不安 / 見えないものに揺れる心",
    main:
      "月は、見えないものへの不安を映します。考えすぎてしまう夜や、相手や未来の本音が分からず揺れる時間が増えているのかもしれません。",
    sub:
      "不安は弱さではなく、心が何かを守ろうとしているサインです。今は、相手のことと自分の不安を分けて見ることが大切です。",
    cta:
      "不安の正体や、見えない本音を丁寧に読み解けます。"
  },
  {
    slug: "sun",
    name: "太陽",
    keyword: "喜び / 明るみに出る気持ち",
    main:
      "太陽は、心が明るい方へ戻り始めていることを示します。遠慮や不安の奥で、本当はもう少し素直に笑いたい気持ちが戻ってきているのかもしれません。",
    sub:
      "今は、ちゃんとしなきゃより、少しでも心が明るくなることをひとつ選んでください。喜びを受け取ることも、未来を開く力です。",
    cta:
      "明るい流れをどう現実につなげるか、先の展開まで見ていけます。"
  },
  {
    slug: "judgement",
    name: "審判",
    keyword: "再浮上 / もう一度向き合う時",
    main:
      "審判は、一度閉じたものが再び意味を持ち始めるカードです。諦めたはずなのに心が反応するなら、まだ受け取るべき言葉が残っているのかもしれません。",
    sub:
      "過去に戻るためではなく、今の自分で選び直すために向き合う時期です。もう遅いと決めつける前に、心が動く理由を見つめてください。",
    cta:
      "復縁、再挑戦、もう一度向き合うべきことを深く整理できます。"
  },
  {
    slug: "world",
    name: "世界",
    keyword: "完成 / 次のステージ",
    main:
      "世界は、ここまで積み重ねてきたものが、ひとつの意味へまとまるカードです。終わりではなく完成。あなたは次の扉の前に立っています。",
    sub:
      "まずは、ここまで来た自分をちゃんと認めてください。完成を受け入れることが、次の流れを開く合図になります。",
    cta:
      "一区切りの先にある新しい流れを、丁寧に読み解けます。"
  }
];

const state = {
  selectedTopic: "self",
  lastSlug: null,
  flipTimer: null,
  scrollTimer: null,
  dustSpawned: false
};

const elements = {
  year: document.getElementById("year"),
  topicButtons: Array.from(document.querySelectorAll(".topic-chip")),
  topicHint: document.getElementById("topicHint"),
  startBtn: document.getElementById("startReadingBtn"),
  resetBtn: document.getElementById("resetBtn"),
  readingPanel: document.getElementById("readingPanel"),
  cardFrame: document.getElementById("cardFrame"),
  cardFrontImage: document.getElementById("cardFrontImage"),
  cardName: document.getElementById("cardName"),
  cardKeyword: document.getElementById("cardKeyword"),
  resultBlock: document.getElementById("resultBlock"),
  resultTopic: document.getElementById("resultTopic"),
  resultMain: document.getElementById("resultMain"),
  resultSub: document.getElementById("resultSub"),
  resultBridgeText: document.getElementById("resultBridgeText"),
  ctaCopyText: document.getElementById("ctaCopyText"),
  consultBtn: document.getElementById("consultBtn"),
  consultSafeNote: document.getElementById("consultSafeNote"),
  stardust: document.querySelector(".stardust")
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clearTimers() {
  if (state.flipTimer) {
    clearTimeout(state.flipTimer);
    state.flipTimer = null;
  }

  if (state.scrollTimer) {
    clearTimeout(state.scrollTimer);
    state.scrollTimer = null;
  }
}

function chooseCard() {
  if (CARDS.length === 1) return CARDS[0];

  let nextCard = pickRandom(CARDS);

  while (nextCard.slug === state.lastSlug) {
    nextCard = pickRandom(CARDS);
  }

  state.lastSlug = nextCard.slug;
  return nextCard;
}

function setTopic(topic) {
  state.selectedTopic = topic;

  elements.topicButtons.forEach((button) => {
    const isSelected = button.dataset.topic === topic;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });

  elements.topicHint.textContent = TOPIC_COPY[topic].hint;
}

function renderCard(card) {
  const topic = TOPIC_COPY[state.selectedTopic];

  elements.cardFrame.classList.remove("is-flipped");
  elements.resultBlock.classList.remove("is-visible");

  elements.cardFrontImage.src = `${CONFIG.cardBasePath}${card.slug}.webp`;
  elements.cardFrontImage.alt = `${card.name}のカード画像`;

  elements.cardName.textContent = card.name;
  elements.cardKeyword.textContent = card.keyword;

  elements.resultTopic.textContent = topic.label;
  elements.resultMain.textContent = card.main;
  elements.resultSub.textContent = card.sub;
  elements.resultBridgeText.textContent = topic.bridge;
  elements.ctaCopyText.textContent = card.cta;
  elements.consultBtn.href = CONFIG.consultationUrl;
  elements.consultSafeNote.textContent =
    "LINEからご相談いただけます。気持ちがまとまっていなくても、そのまま話せます。";

  elements.resultBlock.hidden = false;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elements.resultBlock.classList.add("is-visible");
    });
  });

  state.flipTimer = setTimeout(() => {
    elements.cardFrame.classList.add("is-flipped");
  }, 220);

  elements.startBtn.textContent = "もう一枚、星詠を受け取る";
  elements.resetBtn.disabled = false;

  state.scrollTimer = setTimeout(() => {
    elements.readingPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 260);
}

function drawReading() {
  clearTimers();
  const card = chooseCard();
  renderCard(card);
}

function resetReading() {
  clearTimers();

  elements.cardFrame.classList.remove("is-flipped");
  elements.cardFrontImage.src = CONFIG.cardBackImage;
  elements.cardFrontImage.alt = "カード裏面";

  elements.cardName.textContent = "カードはまだ静かに伏せられています";
  elements.cardKeyword.textContent = "星詠を始めてください";

  elements.resultBlock.classList.remove("is-visible");
  elements.resultBlock.hidden = true;

  elements.startBtn.textContent = "星詠を始める";
  elements.resetBtn.disabled = true;
}

function spawnStardust() {
  if (!elements.stardust || state.dustSpawned) return;

  state.dustSpawned = true;

  const count = 24;

  for (let i = 0; i < count; i += 1) {
    const star = document.createElement("span");
    const delay = Math.random() * 12;
    const duration = 10 + Math.random() * 12;
    const left = Math.random() * 100;
    const top = 60 + Math.random() * 40;

    star.style.left = `${left}vw`;
    star.style.top = `${top}vh`;
    star.style.animationDuration = `${duration}s`;
    star.style.animationDelay = `${delay}s`;

    elements.stardust.appendChild(star);
  }
}

function init() {
  elements.year.textContent = new Date().getFullYear();

  elements.topicButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTopic(button.dataset.topic);
    });
  });

  elements.startBtn.addEventListener("click", drawReading);
  elements.resetBtn.addEventListener("click", resetReading);

  setTopic(state.selectedTopic);
  spawnStardust();
}

document.addEventListener("DOMContentLoaded", init);
