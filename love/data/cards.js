window.COMMON_CTA_PATTERNS = [
  "この恋を、個人鑑定で丁寧に見てもらう",
  "あの人の本音とこれからを、私の状況に合わせて相談する",
  "曖昧な関係を、このまま抱えず一度きちんと整理してみる"
];

window.COMMON_SAFE_PATTERNS = [
  "LINEからご相談いただけます。まだ相談するか迷っている段階でも大丈夫です。",
  "気持ちがうまくまとまっていなくても大丈夫です。不安を煽るような読み方や、無理な勧誘は行っていません。",
  "一人で抱えてきた気持ちも、そのまま話せます。安心してご相談ください。"
];

window.BRIDGE_PATTERNS = {
  ambiguous: [
    "今見えているのは、この恋にいちばん強く出ているテーマです。ただ、相手の本音や、この先どう動くべきかまで含めると、一枚だけでは見えきらないこともあります。個人鑑定では、あなたの状況に合わせて順番に整理していけます。",
    "曖昧な恋ほど、表面の態度だけでは判断しきれません。背景まで丁寧に見ていくことで、苦しさの正体が少しずつ分かりやすくなります。",
    "このまま一人で考え続けるより、一度きちんと見てもらうことで、『今の自分はどうしたいのか』まで整理しやすくなります。"
  ],
  progress: [
    "今見えているのは、この恋にある前向きな流れです。ただ、相手の気持ちの深さや、この先どう育てるべきかまでは、もう少し具体的に見た方が分かりやすくなります。",
    "良い流れがあるときほど、どう関わるかで未来は変わります。そこを自分の状況に合わせて整理したい方に、個人鑑定は向いています。",
    "『脈ありかも』で終わらせず、この先まで見ておきたいときに、その先の読み解きが役立ちます。"
  ],
  stable: [
    "今見えているのは、この恋の土台や整い方です。ただ、相手との相性や、どんな形で関係が育っていくのかは、もう少し丁寧に見た方が分かりやすくなります。",
    "安心できる恋ほど、感情だけでなく現実の流れも一緒に見ていくことで、これからの向き合い方がはっきりしてきます。",
    "『この関係を大切に育てていいのか』を落ち着いて確かめたいときに、個人鑑定は役立ちます。"
  ],
  turningPoint: [
    "今見えているのは、この恋の転換点です。ただ、復縁の本気度や動く時期、どんな形で流れが変わるのかまでは、もう少し深く見た方が整理しやすくなります。",
    "気持ちだけで決めると苦しくなりやすい局面ほど、現実の流れまで含めて見ていくことが大切です。",
    "『まだ待つべきか』『ここで動くべきか』を曖昧なままにしたくないときに、個人鑑定が役立ちます。"
  ],
  painful: [
    "今見えているのは、この恋の苦しさの核です。ただ、相手の本音や、この関係を続ける意味まで含めると、一枚だけでは整理しきれないこともあります。",
    "苦しいのに離れられない恋ほど、表面的な相性だけでは見抜けません。そこを丁寧に整理したい方に、個人鑑定は向いています。",
    "『どうしてこんなに苦しいのか』を一人で抱え続けるより、一度きちんと見てもらうことで、気持ちがほどけやすくなります。"
  ]
};

window.LOVE_CARDS = [
  {
    id: "fool",
    slug: "fool",
    nameJa: "愚者",
    keyword: "始まり / ためらいと一歩",
    bridgeType: "ambiguous",
    mainPatterns: [
      "あの人との関係は、まだはっきりと形になる前だからこそ、不安と期待が交互に押し寄せやすい時期です。",
      "連絡の有無や空気の揺れに心が振り回されるのは、それだけこの恋を軽く扱っていない証でもあります。",
      "このカードは、恋が終わったのではなく、まだ名前のついていない可能性の中にあることを伝えています。"
    ],
    subPatterns: [
      "今は答えを急ぐより、自分の気持ちを整えながら、関わり方を軽やかに保つことが大切です。",
      "追うか離れるかの二択にせず、無理のない接点を残しておくことで、関係は少しずつ育ちやすくなります。",
      "揺れる自分を責めなくて大丈夫です。あなたの想いは重いのではなく、まっすぐです。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "magician",
    slug: "magician",
    nameJa: "魔術師",
    keyword: "言葉 / きっかけづくり",
    bridgeType: "progress",
    mainPatterns: [
      "止まって見える恋でも、言葉ひとつで空気が動き出す余地は、まだ残っています。",
      "既読無視や連絡待ちが続くと、相手の事情ばかりを考えて、自分の本音が置き去りになりやすくなります。",
      "このカードは、恋を無理に動かすというより、あなた自身の言葉を取り戻す時期だと伝えています。"
    ],
    subPatterns: [
      "長文や重い気持ちをぶつけなくても大丈夫です。短くても、あなたらしい温度のある言葉が流れを変えます。",
      "答えを急がせるより、相手が返しやすい一言を置くことが、関係の呼吸を整えます。",
      "相手の反応だけで、自分の価値を決めなくて大丈夫です。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "high-priestess",
    slug: "high-priestess",
    nameJa: "女教皇",
    keyword: "静かな本音 / 見えない温度差",
    bridgeType: "ambiguous",
    mainPatterns: [
      "嫌われた気もするのに、完全に終わった感じもしない。その曖昧さこそが、今の恋のリアルです。",
      "はっきりしない関係ほど、答えを急ぐほど心が削れやすくなります。",
      "このカードは、あなたが薄く感じ取っている違和感や気配を、無視しなくていいと伝えています。"
    ],
    subPatterns: [
      "今は相手を追って確かめるより、自分の感情を落ち着かせる時間を持つことが先です。",
      "待つことは何もしないことではありません。心の軸を整えることで、次の一手は変わります。",
      "大切にしたい恋だから揺れるのであって、あなたが弱いからではありません。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "empress",
    slug: "empress",
    nameJa: "女帝",
    keyword: "受け取る愛 / 自己価値",
    bridgeType: "stable",
    mainPatterns: [
      "あなたは待っているだけのようでいて、実はこの関係をずっと支えてきた人なのかもしれません。",
      "尽くすほど不安になる恋には、まずあなた自身が満たされていいという許可が必要です。",
      "このカードは、愛される価値を証明し続けなくていいと伝えています。"
    ],
    subPatterns: [
      "相手の都合に合わせるだけでなく、自分が安心できる関係の条件も大切にしてください。",
      "嫌われたくないより、大切にされたいを基準にすると、恋の見え方は少しずつ変わります。",
      "優しさは我慢とは違います。あなたが心地よくいられる恋を選んで大丈夫です。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "emperor",
    slug: "emperor",
    nameJa: "皇帝",
    keyword: "現実性 / 関係の定義",
    bridgeType: "turningPoint",
    mainPatterns: [
      "復縁や関係修復を望むときほど、気持ちだけでは進みにくい局面があります。",
      "好きという感情が強いほど、相手の態度に心が揺れやすくなるからこそ、今は冷静な軸が必要です。",
      "このカードは、恋を守るために現実を整える段階に入っていることを示しています。"
    ],
    subPatterns: [
      "会話の目的をひとつに絞るなど、小さな整理が関係の安定につながります。",
      "戻りたいだけでなく、戻ってからどうしたいかまで描けると、流れは変わります。",
      "あなたが悪いのではなく、今は優しさに加えて、落ち着いた見極めが必要なだけです。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "hierophant",
    slug: "hierophant",
    nameJa: "教皇",
    keyword: "信頼 / 関係の本質",
    bridgeType: "stable",
    mainPatterns: [
      "この恋は、刺激よりも信頼が育つことで深まっていく関係かもしれません。",
      "相手の反応が派手でなくても、静かに誠実さが残っているなら、見落とさなくて大丈夫です。",
      "このカードは、形だけの恋ではなく、長く続く関わり方を問いかけています。"
    ],
    subPatterns: [
      "今は目先の反応より、この人とどんな関係を築きたいかを見つめ直す時期です。",
      "安心できるやり取りが増えるほど、恋の温度は自然に安定していきます。",
      "派手な愛情表現がなくても、誠実さは別の形で表れることがあります。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "lovers",
    slug: "lovers",
    nameJa: "恋人",
    keyword: "惹かれ合い / 選ぶ気持ち",
    bridgeType: "progress",
    mainPatterns: [
      "この恋には、確かに心が動く理由があります。ただの思い込みではなく、感情の交流が起きている可能性があります。",
      "だからこそ、期待が膨らむほど小さな反応にも敏感になりやすい時期です。",
      "このカードは、惹かれ合う気持ちと同時に、どう関わるかの選択も必要だと伝えています。"
    ],
    subPatterns: [
      "恋が盛り上がるほど、勢いだけで進まないことが大切です。",
      "相手の好意を確かめたい気持ちが強いときほど、自分がどうしたいかも忘れないでください。",
      "心が動いている恋だからこそ、丁寧に育てる価値があります。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "chariot",
    slug: "chariot",
    nameJa: "戦車",
    keyword: "進展 / 勢いとコントロール",
    bridgeType: "progress",
    mainPatterns: [
      "この恋には、まだ前に進む勢いが残っています。ただし、勢いのまま走るとすれ違いやすい面もあります。",
      "会いたい、話したい、はっきりさせたいという気持ちが強まる時期かもしれません。",
      "このカードは、進展の可能性と同時に、感情をうまく扱うことの大切さを示しています。"
    ],
    subPatterns: [
      "動くなら、焦りではなく意図を持って動くことが大切です。",
      "勢いのある恋ほど、タイミングを見誤ると空回りしやすくなります。",
      "あなたの気持ちが強いこと自体は悪くありません。大切なのは、その力の向け方です。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "strength",
    slug: "strength",
    nameJa: "力",
    keyword: "想いの強さ / やさしい忍耐",
    bridgeType: "painful",
    mainPatterns: [
      "この恋で一番強いのは、押し切る力ではなく、あなたの中にあるやさしい粘り強さかもしれません。",
      "相手の反応に一喜一憂しながらも、簡単には投げ出せない想いがあるのではないでしょうか。",
      "このカードは、感情に飲まれずに愛を保つ強さを示しています。"
    ],
    subPatterns: [
      "今は無理に答えを奪いに行くより、関係の呼吸を壊さないことが大切です。",
      "あなたが我慢し続けるべきという意味ではなく、感情の扱い方に力があるということです。",
      "揺れながらも相手を思えることは、弱さではなく強さです。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "hermit",
    slug: "hermit",
    nameJa: "隠者",
    keyword: "距離 / 心の整理",
    bridgeType: "ambiguous",
    mainPatterns: [
      "今の恋は、動きが少ないからこそ不安になりやすい時期かもしれません。",
      "でもそれは、完全に気持ちが消えたというより、お互いに心を整理している時間である可能性もあります。",
      "このカードは、急がずに見つめ直すことで見えてくる真実があると伝えています。"
    ],
    subPatterns: [
      "連絡が少ない時期ほど、相手の沈黙をすべて悪い意味で受け取らないことが大切です。",
      "今は自分の本音を整理することで、この恋に必要な距離感が分かってきます。",
      "静かな時間は、不安だけでできているわけではありません。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "wheel-of-fortune",
    slug: "wheel-of-fortune",
    nameJa: "運命の輪",
    keyword: "転機 / 流れの変化",
    bridgeType: "turningPoint",
    mainPatterns: [
      "この恋は、ずっと同じではなく、これから流れが変わっていく可能性を持っています。",
      "停滞が長かったとしても、それが永遠に続くとは限りません。",
      "このカードは、あなたの恋に転機が近づいていることを示しています。"
    ],
    subPatterns: [
      "変化の前は、気持ちが落ち着かなくなることがあります。",
      "今は無理に結果を掴みにいくより、流れが動いたときに受け取れるよう整えておくことが大切です。",
      "悪い流れが続いたからといって、これからも同じとは限りません。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "justice",
    slug: "justice",
    nameJa: "正義",
    keyword: "見極め / 対等な関係",
    bridgeType: "turningPoint",
    mainPatterns: [
      "この恋で今必要なのは、感情に流されることよりも、関係をまっすぐ見つめることかもしれません。",
      "好きだから許してしまうことと、対等に向き合うことは別です。",
      "このカードは、恋を続けるなら何を大切にしたいのかを問いかけています。"
    ],
    subPatterns: [
      "相手の言葉と行動が一致しているかを、静かに見てみましょう。",
      "苦しいのに我慢し続ける関係なら、一度立ち止まる勇気も必要です。",
      "あなたが安心できる恋であっていい。その視点を忘れないでください。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "hanged-man",
    slug: "hanged-man",
    nameJa: "吊るされた男",
    keyword: "停滞 / 報われにくさの意味",
    bridgeType: "painful",
    mainPatterns: [
      "この恋は、頑張っているのに報われにくい感覚を抱えやすい時期かもしれません。",
      "連絡を待つ、気を遣う、考え続ける。そうした積み重ねで、心が疲れていないでしょうか。",
      "このカードは、今は無理に動かすより、見方を変えることで開ける恋だと伝えています。"
    ],
    subPatterns: [
      "耐え続けることだけが正解ではありません。今の関わり方で本当にいいのか見直してみてください。",
      "苦しいのに手放せない恋は、執着ではなく、未消化の想いが残っていることもあります。",
      "あなたが尽くしてきたこと自体は、決して無意味ではありません。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "death",
    slug: "death",
    nameJa: "死神",
    keyword: "終わりと再生 / 切り替わる流れ",
    bridgeType: "turningPoint",
    mainPatterns: [
      "このカードは、怖さよりも、今までの恋の形が変わる節目を示しています。",
      "もう同じやり方では続かない、と心のどこかで感じているのかもしれません。",
      "終わりは必ずしも別れだけではなく、関係のあり方を変える再生でもあります。"
    ],
    subPatterns: [
      "過去の形にしがみつくほど苦しくなる時期です。今の現実を見つめることで、新しい流れが生まれます。",
      "復縁を望む場合も、一度関係の古い痛みを整理することが必要です。",
      "何かが終わるからこそ、あなたが本当に欲しい愛が見えてきます。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "temperance",
    slug: "temperance",
    nameJa: "節制",
    keyword: "歩み寄り / ちょうどよい距離",
    bridgeType: "stable",
    mainPatterns: [
      "この恋には、極端さよりも穏やかな調整が必要なようです。",
      "好きなのに噛み合わないときは、どちらかが悪いというより、ペースや温度差の問題かもしれません。",
      "このカードは、焦らず歩み寄ることで関係が整っていく可能性を示しています。"
    ],
    subPatterns: [
      "会う頻度、連絡の仕方、距離感など、小さな調整が恋を楽にしてくれます。",
      "無理に近づきすぎることも、急に引いてしまうことも、今は避けたいところです。",
      "あなたに必要なのは、完璧な答えではなく、心地よいバランスです。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "devil",
    slug: "devil",
    nameJa: "悪魔",
    keyword: "執着 / 離れにくい関係",
    bridgeType: "painful",
    mainPatterns: [
      "好きという気持ちだけでは説明しきれないほど、この恋に心を縛られている感覚があるかもしれません。",
      "離れたほうが楽だと分かっていても、気になってしまう。そんな複雑さが出やすいカードです。",
      "このカードは、恋の魅力と苦しさが強く結びついている可能性を示しています。"
    ],
    subPatterns: [
      "相手の一言や反応ひとつで心が大きく揺れるなら、まず自分の心の消耗を見つめてみてください。",
      "執着しているからダメなのではなく、それだけ未消化の想いが深いのかもしれません。",
      "今必要なのは、自分を責めることではなく、絡まった気持ちをほどくことです。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "tower",
    slug: "tower",
    nameJa: "塔",
    keyword: "揺らぎ / 突然の変化",
    bridgeType: "painful",
    mainPatterns: [
      "この恋は、想定外の出来事や気持ちの揺れによって、大きく心が動く時期にあるかもしれません。",
      "突然の既読無視、喧嘩、温度差の露呈など、受け止めきれない変化が起きやすいカードです。",
      "ただしこのカードは、崩れることでしか見えない本音があるとも伝えています。"
    ],
    subPatterns: [
      "今はまず、自分の心を守ることが最優先です。",
      "ショックを受けた直後ほど、相手の言動をひとつの答えとして決めつけすぎないことが大切です。",
      "苦しい出来事が起きたとしても、そこからしか始まらない整理があります。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "star",
    slug: "star",
    nameJa: "星",
    keyword: "希望 / やさしい未来",
    bridgeType: "stable",
    mainPatterns: [
      "この恋には、まだ希望を持てる光が残っています。",
      "たとえ今が不安定でも、完全に閉ざされた関係ではない可能性があります。",
      "このカードは、傷ついた心が少しずつ回復しながら、恋の未来を見直していけることを示しています。"
    ],
    subPatterns: [
      "今は急いで結論を出すより、心の回復と小さな前向きさを大切にしてください。",
      "あなたが信じたいと思える気持ちは、無理に否定しなくて大丈夫です。",
      "希望は依存ではなく、前を向くための灯りになることがあります。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "moon",
    slug: "moon",
    nameJa: "月",
    keyword: "不安 / 見えない本音",
    bridgeType: "ambiguous",
    mainPatterns: [
      "この恋は、見えないことが多いからこそ、不安が膨らみやすい時期です。",
      "あの人の気持ちが分からない、言葉をそのまま信じきれない。そんな揺れが強く出やすいかもしれません。",
      "このカードは、不安そのものよりも、見えない部分が多すぎる恋だと伝えています。"
    ],
    subPatterns: [
      "今は想像だけで答えを作りすぎないことが大切です。",
      "怖さがあるときほど、自分の不安と相手の本音を分けて考える必要があります。",
      "揺れるのは、あなたがちゃんと傷つくほど大切にしているからです。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "sun",
    slug: "sun",
    nameJa: "太陽",
    keyword: "素直さ / 明るい進展",
    bridgeType: "progress",
    mainPatterns: [
      "この恋には、前向きな気持ちや素直な交流が戻ってくる可能性があります。",
      "相手の反応が分かりやすくなったり、関係に明るさが出やすい時期かもしれません。",
      "このカードは、恋に必要な安心感や見通しが少しずつ開けていくことを示しています。"
    ],
    subPatterns: [
      "今は深読みしすぎず、素直なやり取りを大切にすると流れが軽くなります。",
      "嬉しい流れが出ているときほど、構えすぎないことが大切です。",
      "あなたが笑える恋は、それだけで大切にする価値があります。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "judgement",
    slug: "judgement",
    nameJa: "審判",
    keyword: "再浮上 / 答えが返る時",
    bridgeType: "turningPoint",
    mainPatterns: [
      "止まっていた恋が、もう一度動き出す気配があります。",
      "復縁や再連絡、気持ちの再確認など、一度遠のいたものが戻ってくる可能性を持つカードです。",
      "このカードは、過去をただ繰り返すのではなく、意味を持って再び向き合う時期だと伝えています。"
    ],
    subPatterns: [
      "戻ってくる流れがあるときほど、前と同じ関わり方を繰り返さないことが大切です。",
      "相手からの反応が来たとき、どう受け取るかで未来が変わります。",
      "あなたの中にも、もう一度向き合いたい気持ちが残っているのかもしれません。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  },
  {
    id: "world",
    slug: "world",
    nameJa: "世界",
    keyword: "成就 / ひとつの完成",
    bridgeType: "stable",
    mainPatterns: [
      "この恋は、ひとつの完成や成就に向かう力を持っています。",
      "長く揺れてきた関係でも、ようやく意味がまとまっていく時期に入るかもしれません。",
      "このカードは、恋が次の段階へ進む準備が整いつつあることを示しています。"
    ],
    subPatterns: [
      "今までの迷いや不安が、少しずつ形を持ち始める可能性があります。",
      "ただし完成とは、必ずしも理想通りになることだけではなく、納得できる着地点を得ることでもあります。",
      "あなたがこの恋から受け取るべきものは、もう近くまで来ています。"
    ],
    ctaPatterns: window.COMMON_CTA_PATTERNS,
    safePatterns: window.COMMON_SAFE_PATTERNS
  }
];
