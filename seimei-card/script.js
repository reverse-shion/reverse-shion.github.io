const MAJOR_CARD_TABLE = [
  { start: 320, end: 419, sign: "牡羊座", card: "皇帝", typeName: "開拓の星命" },
  { start: 420, end: 520, sign: "牡牛座", card: "教皇", typeName: "信頼の星命" },
  { start: 521, end: 620, sign: "双子座", card: "恋人", typeName: "選択の星命" },
  { start: 621, end: 721, sign: "蟹座", card: "戦車", typeName: "守護の星命" },
  { start: 722, end: 822, sign: "獅子座", card: "力", typeName: "輝命の星命" },
  { start: 823, end: 922, sign: "乙女座", card: "隠者", typeName: "探究の星命" },
  { start: 923, end: 1022, sign: "天秤座", card: "正義", typeName: "調律の星命" },
  { start: 1023, end: 1121, sign: "蠍座", card: "死神", typeName: "再生の星命" },
  { start: 1122, end: 1220, sign: "射手座", card: "節制", typeName: "旅路の星命" },
  { start: 1221, end: 119, sign: "山羊座", card: "悪魔", typeName: "現実の星命" },
  { start: 120, end: 217, sign: "水瓶座", card: "星", typeName: "希望の星命" },
  { start: 218, end: 319, sign: "魚座", card: "月", typeName: "夢幻の星命" }
];

const DECAN_CARD_TABLE = [
  { start: 320, end: 329, sign: "牡羊座", card: "ワンド2" },
  { start: 330, end: 408, sign: "牡羊座", card: "ワンド3" },
  { start: 409, end: 419, sign: "牡羊座", card: "ワンド4" },
  { start: 420, end: 429, sign: "牡牛座", card: "ペンタクル5" },
  { start: 430, end: 509, sign: "牡牛座", card: "ペンタクル6" },
  { start: 510, end: 520, sign: "牡牛座", card: "ペンタクル7" },
  { start: 521, end: 530, sign: "双子座", card: "ソード8" },
  { start: 531, end: 609, sign: "双子座", card: "ソード9" },
  { start: 610, end: 620, sign: "双子座", card: "ソード10" },
  { start: 621, end: 630, sign: "蟹座", card: "カップ2" },
  { start: 701, end: 711, sign: "蟹座", card: "カップ3" },
  { start: 712, end: 721, sign: "蟹座", card: "カップ4" },
  { start: 722, end: 801, sign: "獅子座", card: "ワンド5" },
  { start: 802, end: 811, sign: "獅子座", card: "ワンド6" },
  { start: 812, end: 822, sign: "獅子座", card: "ワンド7" },
  { start: 823, end: 901, sign: "乙女座", card: "ペンタクル8" },
  { start: 902, end: 911, sign: "乙女座", card: "ペンタクル9" },
  { start: 912, end: 922, sign: "乙女座", card: "ペンタクル10" },
  { start: 923, end: 1002, sign: "天秤座", card: "ソード2" },
  { start: 1003, end: 1012, sign: "天秤座", card: "ソード3" },
  { start: 1013, end: 1022, sign: "天秤座", card: "ソード4" },
  { start: 1023, end: 1101, sign: "蠍座", card: "カップ5" },
  { start: 1102, end: 1111, sign: "蠍座", card: "カップ6" },
  { start: 1112, end: 1121, sign: "蠍座", card: "カップ7" },
  { start: 1122, end: 1201, sign: "射手座", card: "ワンド8" },
  { start: 1202, end: 1211, sign: "射手座", card: "ワンド9" },
  { start: 1212, end: 1220, sign: "射手座", card: "ワンド10" },
  { start: 1221, end: 1230, sign: "山羊座", card: "ペンタクル2" },
  { start: 1231, end: 109, sign: "山羊座", card: "ペンタクル3" },
  { start: 110, end: 119, sign: "山羊座", card: "ペンタクル4" },
  { start: 120, end: 129, sign: "水瓶座", card: "ソード5" },
  { start: 130, end: 208, sign: "水瓶座", card: "ソード6" },
  { start: 209, end: 217, sign: "水瓶座", card: "ソード7" },
  { start: 218, end: 227, sign: "魚座", card: "カップ8" },
  { start: 228, end: 309, sign: "魚座", card: "カップ9" },
  { start: 310, end: 319, sign: "魚座", card: "カップ10" }
];

const COURT_CARD_TABLE = [
  { start: 310, end: 408, card: "ワンドのクイーン" },
  { start: 409, end: 509, card: "ペンタクルのキング" },
  { start: 510, end: 609, card: "ソードのナイト" },
  { start: 610, end: 711, card: "カップのクイーン" },
  { start: 712, end: 811, card: "ワンドのキング" },
  { start: 812, end: 911, card: "ペンタクルのナイト" },
  { start: 912, end: 1012, card: "ソードのクイーン" },
  { start: 1013, end: 1111, card: "カップのキング" },
  { start: 1112, end: 1211, card: "ワンドのナイト" },
  { start: 1212, end: 109, card: "ペンタクルのクイーン" },
  { start: 110, end: 208, card: "ソードのキング" },
  { start: 209, end: 309, card: "カップのナイト" }
];

const READING_DATA = {
  "皇帝": { cardName: "皇帝", typeName: "開拓の星命", essence: "自分の手で未来を切り開こうとする力", light: "決断力、行動力、道を作る力", shadow: "強がり、孤独、弱音を見せられないこと", love: "好きな人の前でも主導権を握ろうとしやすい", work: "目標を決め、現実を動かす力がある", relation: "頼られる一方で、本音を見せにくいことがある", message: "頼ることは、あなたの強さを失うことではありません。", shioponLine: "この星命はね、自分の道を作る火を持ってるの……ぴょん。" },
  "教皇": { cardName: "教皇", typeName: "信頼の星命", essence: "大切なものを丁寧に守り育てる力", light: "誠実さ、信頼、安定感", shadow: "変化への不安、執着、頑固さ", love: "軽い関係より、安心できる関係を求める", work: "信頼を積み重ねる仕事や、教える役割に向いている", relation: "価値観の違いに戸惑いやすい", message: "変わることは、大切なものを裏切ることではありません。", shioponLine: "この星命はね、ゆっくり根を張る愛の音がするの……ぴょん。" },
  "恋人": { cardName: "恋人", typeName: "選択の星命", essence: "出会いと言葉を通して自分を知る力", light: "会話力、柔軟性、選ぶ力", shadow: "迷いすぎること、本音を隠すこと", love: "言葉の温度で愛情を感じやすい", work: "人と人をつなぐこと、言葉を扱うことに力が出る", relation: "相手に合わせすぎると自分の軸が揺れやすい", message: "正解を探すより、何を大切にしたいかを選んでください。", shioponLine: "この星命はね、心と心を結ぶ風みたいなの……ぴょん。" },
  "戦車": { cardName: "戦車", typeName: "守護の星命", essence: "大切なものを守るために進む力", light: "情の深さ、行動力、守護力", shadow: "感情に振り回されること、防衛的になること", love: "好きな人を守りたい気持ちが強い", work: "目標に向かって進む力と、仲間を守る力がある", relation: "大切な人ほど抱え込みすぎることがある", message: "誰かを守る前に、あなた自身の心も守ってください。", shioponLine: "この星命はね、優しさで前に進む力なの……ぴょん。" },
  "力": { cardName: "力", typeName: "輝命の星命", essence: "心をほどくやさしい強さ", light: "魅力、表現力、包み込む力", shadow: "認められたい不安、強がり、寂しさ", love: "愛されている実感が薄いと不安になりやすい", work: "人を励ますこと、魅力を表現することに力が出る", relation: "明るく振る舞いながら、本当の寂しさを隠すことがある", message: "無理に輝かなくても、あなたの光は消えません。", shioponLine: "この星命はね、やさしい火を持ってるの……ぴょん。" },
  "隠者": { cardName: "隠者", typeName: "探究の星命", essence: "表面的な答えではなく、本質を探し続ける力", light: "観察力、誠実さ、深い洞察", shadow: "考えすぎ、自己否定、完璧主義", love: "相手の言葉や態度を細かく読みすぎる", work: "研究、分析、技術の積み重ねに強い", relation: "人との距離感を慎重に取りすぎることがある", message: "すべてを正しく理解しようとしなくても大丈夫です。", shioponLine: "この星命はね、静かなランプみたいに心の奥を照らすの……ぴょん。" },
  "正義": { cardName: "正義", typeName: "調律の星命", essence: "心の天秤を感じ取り、関係を整える力", light: "冷静さ、調整力、美意識、公平さ", shadow: "我慢しすぎること、相手に合わせすぎること", love: "大切にされているか、対等かを強く気にする", work: "判断力、調整力、バランス感覚を活かせる", relation: "平和のために自分の本音を後回しにしやすい", message: "本当の優しさは、我慢ではなく心の天秤を戻すことです。", shioponLine: "この星命はね、ちゃんと向き合いたい心の音なの……ぴょん。" },
  "死神": { cardName: "死神", typeName: "再生の星命", essence: "終わりの先に新しい自分を生み出す力", light: "深い愛情、覚悟、変化する力", shadow: "執着、疑い、手放せない痛み", love: "中途半端な関係より、深く結ばれることを求める", work: "変化の時期に強く、再構築する力がある", relation: "失う怖さから、握りしめすぎることがある", message: "終わりは敗北ではなく、再生の入口になることがあります。", shioponLine: "この星命はね、古い殻を脱いで光に戻る力なの……ぴょん。" },
  "節制": { cardName: "節制", typeName: "旅路の星命", essence: "違うものを混ぜ合わせ、新しい意味を育てる力", light: "柔軟性、成長力、広い視野", shadow: "飽きやすさ、落ち着かなさ、現実逃避", love: "束縛より、一緒に成長できる関係を求める", work: "異なる要素をつなぎ、新しい形にする力がある", relation: "自由を大切にする一方で、約束が重く感じることがある", message: "自由と誠実さは、どちらか一つを選ぶものではありません。", shioponLine: "この星命はね、旅の途中で心を整える水みたいなの……ぴょん。" },
  "悪魔": { cardName: "悪魔", typeName: "現実の星命", essence: "現実の重さを知りながら、それを形にする力", light: "継続力、責任感、社会的な力", shadow: "我慢、依存、損得への縛られ", love: "離れられない関係や執着に悩みやすい", work: "結果を出す力、現実を形にする力がある", relation: "責任感から、苦しい関係でも離れにくいことがある", message: "あなたを縛る鎖は、気づいた瞬間からほどき始められます。", shioponLine: "この星命はね、重たい鎖に見えて、本当は形にする力なの……ぴょん。" },
  "星": { cardName: "星", typeName: "希望の星命", essence: "まだ見ぬ未来に希望を見つける力", light: "独自性、発想力、希望を届ける力", shadow: "孤独、理解されにくさ、距離感", love: "自由と尊重のある関係を求める", work: "新しい発想や未来を見せる仕事に力が出る", relation: "理解されない痛みから、距離を取りすぎることがある", message: "あなたの願いは、誰かの未来を照らす星になることがあります。", shioponLine: "この星命はね、遠くにいても消えない希望の光なの……ぴょん。" },
  "月": { cardName: "月", typeName: "夢幻の星命", essence: "見えない心の揺れを感じ取る力", light: "共感力、想像力、癒し、直感", shadow: "不安、妄想、境界線の曖昧さ", love: "相手の気持ちを感じ取りすぎて苦しくなりやすい", work: "感性、想像力、癒しに関わる分野に力が出る", relation: "相手の影まで抱え込みやすい", message: "不安は、いつも真実とは限りません。", shioponLine: "この星命はね、暗い夜でも歩けるだけの光をくれるの……ぴょん。" }
};

const DETAIL_CARD_MESSAGES = {
  "ワンド2": "未来を見据え、最初の一歩を選ぶ", "ワンド3": "可能性を広げ、遠くへ進む", "ワンド4": "自分の居場所を築く", "ペンタクル5": "欠けた安心を取り戻す", "ペンタクル6": "与えることと受け取ることの調和", "ペンタクル7": "時間をかけて実らせる", "ソード8": "思考の檻に気づく", "ソード9": "不安な夜を言葉に変える", "ソード10": "考えすぎた痛みを終わらせる", "カップ2": "心と心を結ぶ", "カップ3": "共感と喜びを分かち合う", "カップ4": "満たされなさの奥にある本音を見る", "ワンド5": "自分の火を試す", "ワンド6": "認められることで光を増す", "ワンド7": "自分の立場を守る", "ペンタクル8": "小さな積み重ねが才能になる", "ペンタクル9": "自分の価値を静かに育てる", "ペンタクル10": "受け継ぐもの、築くものを守る", "ソード2": "心の天秤を静かに整える", "ソード3": "痛みの真実を認める", "ソード4": "傷ついた心を休ませる", "カップ5": "失ったものへの涙を受け止める", "カップ6": "過去の記憶を癒しに変える", "カップ7": "深い願望と幻想を見分ける", "ワンド8": "変化の流れに乗る", "ワンド9": "旅の途中で自分を守る", "ワンド10": "抱えすぎた荷物を見直す", "ペンタクル2": "現実の波を乗りこなす", "ペンタクル3": "努力を形にし、信頼を築く", "ペンタクル4": "守ることと手放すことを学ぶ", "ソード5": "自分らしさと孤独の扱い方を学ぶ", "ソード6": "新しい未来へ移動する", "ソード7": "本音を隠さず、自分の道を選ぶ", "カップ8": "もう満たされない場所を離れる", "カップ9": "心の願いを受け取る", "カップ10": "愛と祈りを分かち合う"
};

const COURT_CARD_MESSAGES = {
  "ワンドのクイーン": "人を明るく照らし、場に情熱を灯す人", "ペンタクルのキング": "現実を整え、信頼できる形を築く人", "ソードのナイト": "迷いを切り開き、言葉と判断で進む人", "カップのクイーン": "心の揺れを受け止め、深い共感で包む人", "ワンドのキング": "情熱を方向づけ、人を導く火を持つ人", "ペンタクルのナイト": "小さな積み重ねを信頼に変えていく人", "ソードのクイーン": "冷静な言葉で真実を見つめる人", "カップのキング": "感情を深く理解し、穏やかに導く人", "ワンドのナイト": "理想へ向かって勢いよく進む人", "ペンタクルのクイーン": "安心できる場所を育て、現実を慈しむ人", "ソードのキング": "理性と判断で道筋を示す人", "カップのナイト": "想いを言葉や行動に乗せて届ける人"
};

const ERROR_MESSAGE = "生年月日を入力してね。しおぽんが星命カードを探しにいけないの……ぴょん。";

function parseDateInput(value) {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day, mmdd: month * 100 + day };
}

function isInRange(mmdd, start, end) {
  if (start <= end) return mmdd >= start && mmdd <= end;
  return mmdd >= start || mmdd <= end;
}

function findByDate(table, mmdd) {
  return table.find((item) => isInRange(mmdd, item.start, item.end));
}

function getMajorCardByDate(mmdd) {
  return findByDate(MAJOR_CARD_TABLE, mmdd);
}

function getDecanCardByDate(mmdd) {
  return findByDate(DECAN_CARD_TABLE, mmdd);
}

function getCourtCardByDate(mmdd) {
  return findByDate(COURT_CARD_TABLE, mmdd);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function buildThemeText(theme, data) {
  const themeMap = {
    "恋愛": `恋愛では、${data.love}ところにこの星命が表れやすいです。今の恋の中で焦りや不安が出ているなら、相手を動かす前に、あなた自身が何を大切にしたいのかをそっと確かめてみてください。`,
    "仕事": `仕事では、${data.work}でしょう。才能は一気に証明するものではなく、日々の選択と積み重ねの中で輪郭を持ちます。今できる小さな一歩が、あなたらしい力を育てていきます。`,
    "人間関係": `人間関係では、${data.relation}かもしれません。近づきすぎても離れすぎても苦しくなる時は、心地よい距離感と境界線を整えることが、あなたの優しさを守ってくれます。`,
    "今の自分": `今のあなたには、${data.essence}が宿っています。光としては${data.light}があり、一方で${data.shadow}が顔を出すこともあります。どちらも否定せず、今の心の声として受け止めてみてください。`
  };
  return themeMap[theme] || themeMap["今の自分"];
}

function buildReadingText({ nickname, theme, major, decan, court }) {
  const data = READING_DATA[major.card];
  const displayName = nickname ? `${escapeHtml(nickname)}さん` : "あなた";
  const detailMessage = DETAIL_CARD_MESSAGES[decan.card];
  const courtMessage = COURT_CARD_MESSAGES[court.card];
  const themeText = buildThemeText(theme, data);

  return {
    title: `${displayName}の星命カード`,
    lead: `あなたの本星命カードは《${data.cardName}》です。あなたは、${data.typeName}を持つ人。`,
    essence: `この星命は、${data.essence}を表しています。`,
    detail: `詳細星命カードは《${decan.card}》。これは、${detailMessage}カードです。`,
    court: `コートカードは《${court.card}》。あなたの力は、${courtMessage}ところに表れます。`,
    lightShadow: `あなたの光は、${data.light}。一方で、${data.shadow}もあります。`,
    theme: themeText,
    today: data.message,
    shiopon: data.shioponLine,
    shion: "あなたの星命は、あなたを縛るためではなく、あなたの心を照らすためにあります。\n\n大丈夫だよ。"
  };
}

function renderResult({ nickname, theme, major, decan, court }) {
  const resultArea = document.getElementById("resultArea");
  const reading = buildReadingText({ nickname, theme, major, decan, court });
  const detailMessage = DETAIL_CARD_MESSAGES[decan.card];
  const courtMessage = COURT_CARD_MESSAGES[court.card];
  const data = READING_DATA[major.card];

  resultArea.innerHTML = `
    <div class="seimei-result-head">
      <p class="seimei-label">SEIMEI READING</p>
      <h2 class="seimei-result-title">${reading.title}</h2>
      <p class="seimei-result-lead">${reading.lead}</p>
    </div>

    <div class="seimei-card-grid" aria-label="診断された3つの星命カード">
      <article class="seimei-card-panel">
        <p class="seimei-card-label">MAIN CARD</p>
        <h3>本星命カード：${major.card}</h3>
        <p>${major.sign}／星命タイプ：${major.typeName}</p>
      </article>
      <article class="seimei-card-panel">
        <p class="seimei-card-label">DETAIL CARD</p>
        <h3>詳細星命カード：${decan.card}</h3>
        <p>${detailMessage}</p>
      </article>
      <article class="seimei-card-panel">
        <p class="seimei-card-label">COURT CARD</p>
        <h3>コートカード：${court.card}</h3>
        <p>${courtMessage}</p>
      </article>
    </div>

    <div class="seimei-reading">
      <section class="seimei-reading-block">
        <h3>本質</h3>
        <p>${reading.essence}</p>
      </section>
      <section class="seimei-reading-block">
        <h3>詳細星命カード</h3>
        <p>${reading.detail}</p>
      </section>
      <section class="seimei-reading-block">
        <h3>コートカード</h3>
        <p>${reading.court}</p>
      </section>
      <section class="seimei-reading-block">
        <h3>光の面と影の面</h3>
        <p>${reading.lightShadow}</p>
      </section>
      <section class="seimei-reading-block">
        <h3>恋愛傾向</h3>
        <p>${data.love}傾向があります。恋の形を断定するものではなく、心が反応しやすい温度として受け取ってください。</p>
      </section>
      <section class="seimei-reading-block">
        <h3>${theme}への星命リーディング</h3>
        <p>${reading.theme}</p>
      </section>
      <section class="seimei-reading-block">
        <h3>今日の星命メッセージ</h3>
        <p>${reading.today}</p>
      </section>
      <section class="seimei-reading-block">
        <h3>しおぽんの一言</h3>
        <p><span class="seimei-speaker">しおぽん：</span><br />${reading.shiopon}</p>
      </section>
      <section class="seimei-reading-block">
        <h3>シオンからの締め言葉</h3>
        <p><span class="seimei-speaker">シオン：</span><br />${reading.shion.replace(/\n/g, "<br />")}</p>
      </section>
    </div>

    <section class="seimei-cta" aria-labelledby="seimeiCtaTitle">
      <p class="seimei-cta-label">NEXT STEP</p>
      <h3 id="seimeiCtaTitle">この星命を、今の悩みに合わせて深く見る</h3>
      <p>あなたの星命カードは、生まれ持った心の傾向を映す一枚です。<br />けれど、今の恋や悩みの中でこの星命がどう出ているのかは、状況によって変わります。<br />相手の気持ち、関係の流れ、待つべきか動くべきかまで知りたい方は、個人鑑定で丁寧に読み解けます。</p>
      <div class="seimei-cta-actions">
        <a class="seimei-btn seimei-btn-primary" href="../consultation/index.html">この星命を、今の悩みに合わせて深く見る</a>
        <a class="seimei-btn seimei-btn-secondary" href="../tarot369/index.html">無料ワンカードも引いてみる</a>
      </div>
    </section>
  `;

  resultArea.hidden = false;
  resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initSeimeiForm() {
  const form = document.getElementById("seimeiForm");
  const errorMessage = document.getElementById("errorMessage");
  if (!form || !errorMessage) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorMessage.textContent = "";

    const formData = new FormData(form);
    const parsedDate = parseDateInput(formData.get("birthDate"));

    if (!parsedDate) {
      errorMessage.textContent = ERROR_MESSAGE;
      document.getElementById("resultArea").hidden = true;
      return;
    }

    const major = getMajorCardByDate(parsedDate.mmdd);
    const decan = getDecanCardByDate(parsedDate.mmdd);
    const court = getCourtCardByDate(parsedDate.mmdd);

    if (!major || !decan || !court) {
      errorMessage.textContent = "星命カードの判定に迷ってしまいました。日付をもう一度確認してね……ぴょん。";
      return;
    }

    renderResult({
      nickname: String(formData.get("nickname") || "").trim(),
      theme: formData.get("theme") || "今の自分",
      major,
      decan,
      court
    });
  });
}

if (typeof document !== "undefined") {
  initSeimeiForm();
}

if (typeof window !== "undefined") {
  window.seimeiCard = {
    MAJOR_CARD_TABLE,
    DECAN_CARD_TABLE,
    COURT_CARD_TABLE,
    READING_DATA,
    DETAIL_CARD_MESSAGES,
    COURT_CARD_MESSAGES,
    parseDateInput,
    isInRange,
    getMajorCardByDate,
    getDecanCardByDate,
    getCourtCardByDate,
    buildReadingText
  };
}
