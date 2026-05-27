window.ShionReportRenderer = (() => {
  "use strict";

  const CARD_POOL = [
    {
      name: "太陽",
      essence: "素直な喜びと安心感",
      current: "今は、考えすぎるよりも明るい事実を拾い直す時期です。",
      gap: "不安が強くなると、相手の小さな反応まで悪い意味に受け取りやすくなります。",
      action: "今日は、疑う言葉よりも安心を育てる一言を選んでください。"
    },
    {
      name: "月",
      essence: "揺れる心と見えない本音",
      current: "今は、答えがはっきり見えず、心が先に不安を作りやすい時期です。",
      gap: "曖昧さに耐えきれず、まだ決まっていない未来を悪い方へ決めつけやすくなります。",
      action: "今日は、結論を急がず、自分が何に傷ついているのかを静かに言葉にしてください。"
    },
    {
      name: "星",
      essence: "希望と回復の光",
      current: "今は、失った自信を少しずつ取り戻していく時期です。",
      gap: "期待しすぎるほど、現実との差に傷つきやすくなります。",
      action: "今日は、相手の反応だけで自分の価値を決めないことが大切です。"
    },
    {
      name: "皇帝",
      essence: "現実を動かす意志",
      current: "今は、気持ちだけで流されず、関係の土台を見直す時期です。",
      gap: "正しさを急ぐと、相手の気持ちより結論を優先しやすくなります。",
      action: "今日は、感情をぶつける前に、自分が本当に望む形を整理してください。"
    },
    {
      name: "女帝",
      essence: "愛情と受け取る力",
      current: "今は、愛されたい気持ちと、自分を大切にする感覚を取り戻す時期です。",
      gap: "与えすぎるほど、見返りがない時に苦しくなりやすいです。",
      action: "今日は、相手に尽くす前に、自分の心を満たす行動を選んでください。"
    },
    {
      name: "隠者",
      essence: "静かな確認と内省",
      current: "今は、外側の答えよりも、自分の本音を見つめ直す時期です。",
      gap: "ひとりで抱え込みすぎると、不安が現実以上に大きくなります。",
      action: "今日は、誰かの反応を待つより、自分の気持ちを一度整理してください。"
    },
    {
      name: "節制",
      essence: "距離感と調和",
      current: "今は、近づきすぎず離れすぎず、関係の温度を整える時期です。",
      gap: "焦って動くほど、相手とのペースの違いが目立ちやすくなります。",
      action: "今日は、急な変化よりも、続けられる小さな安心を重ねてください。"
    },
    {
      name: "世界",
      essence: "ひとつの区切りと完成",
      current: "今は、この恋の中で何を学んできたのかが見えてくる時期です。",
      gap: "完璧な答えを求めるほど、今ある大切なものを見落としやすくなります。",
      action: "今日は、足りないものだけでなく、ここまで育ってきたものにも目を向けてください。"
    },
    {
      name: "恋人",
      essence: "選ぶ勇気と心の一致",
      current: "今は、相手の気持ちだけでなく、自分がどうしたいのかを選ぶ時期です。",
      gap: "嫌われたくない気持ちが強いと、本音を隠して合わせすぎてしまいます。",
      action: "今日は、相手に選ばれるためではなく、自分の心に嘘をつかない選択をしてください。"
    },
    {
      name: "力",
      essence: "優しさの中にある強さ",
      current: "今は、感情を押し殺すのではなく、やさしく扱う力が必要な時期です。",
      gap: "我慢を愛情だと思い込むと、自分だけが苦しくなりやすいです。",
      action: "今日は、強がるよりも、傷ついた気持ちを認めることから始めてください。"
    },
    {
      name: "正義",
      essence: "誠実さと関係のバランス",
      current: "今は、この恋が自分にとって健やかな形かどうかを見極める時期です。",
      gap: "好きという気持ちだけで、違和感や不公平さを見ないふりしやすくなります。",
      action: "今日は、相手を責める前に、自分が何を大切にしたいのかを明確にしてください。"
    },
    {
      name: "運命の輪",
      essence: "流れの変化とタイミング",
      current: "今は、関係の流れが少しずつ切り替わろうとしている時期です。",
      gap: "動かない時間を停滞だと決めつけると、必要な変化を見逃しやすくなります。",
      action: "今日は、無理に動かすより、流れが変わる小さなサインを見つけてください。"
    }
  ];

  const RELATION_TEMPLATES = [
    {
      attraction: "惹かれ合う理由があります。",
      mismatch: "お互いの優しさの形が違うため、伝え方で誤解が起きやすいです。",
      distance: "今は距離感を整える時期です。",
      avoid: "確認せずに不安を決めつけること。",
      action: "気持ちをぶつけるより、伝え方を整えることが大切です。",
      hint: "短い言葉で安心を重ねましょう。"
    },
    {
      attraction: "安心と刺激の両方を交換できる組み合わせです。",
      mismatch: "自由とつながりのバランスで揺れやすいです。",
      distance: "近づきたい気持ちと慎重さが並ぶ距離です。",
      avoid: "反応の遅さを愛情の欠如と断定すること。",
      action: "急がせるより、受け取りやすい形で伝えましょう。",
      hint: "余白を残した連絡が関係を育てます。"
    },
    {
      attraction: "静かに信頼を積み重ねやすい関係です。",
      mismatch: "察し合いに頼りすぎるとすれ違います。",
      distance: "言葉が少ないほど不安が増えやすい距離です。",
      avoid: "結論を急いで試すような言い方をすること。",
      action: "小さな確認を習慣にするのが鍵です。",
      hint: "誠実な一言を先に届けてください。"
    },
    {
      attraction: "お互いに成長を促し合う力があります。",
      mismatch: "与えすぎる側に偏ると苦しさが出ます。",
      distance: "支えたい気持ちが先行しやすい距離です。",
      avoid: "無理を隠して合わせ続けること。",
      action: "自分を削らずに優しさを渡す意識が大切です。",
      hint: "境界線を守るほど長続きします。"
    },
    {
      attraction: "心の奥で同じ光を探している2人です。",
      mismatch: "ペースの違いで不安が生まれやすいです。",
      distance: "今は追うより整える距離が合っています。",
      avoid: "答えを迫って相手を追い込むこと。",
      action: "焦らず、安心できる時間を少しずつ重ねましょう。",
      hint: "相手のペースを尊重する一歩が有効です。"
    }
  ];

  const DEFAULT_PRODUCTS = {
    paidReport: {
      name: "この恋の現在地レポート",
      regularPrice: 4980,
      launchPrice: 2980,
      url: "#paid-report"
    },
    premiumReading: {
      name: "相手の本音と今後の流れ タロット鑑定",
      price: 6800,
      url: "#premium-reading"
    },
    deepReading: {
      name: "深掘り恋愛タロット鑑定書",
      price: 12800,
      url: "#deep-reading"
    }
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function hash(value) {
    const text = String(value ?? "");
    let total = 2166136261;

    for (let i = 0; i < text.length; i += 1) {
      total ^= text.charCodeAt(i);
      total = Math.imul(total, 16777619);
    }

    return total >>> 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatPrice(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString("ja-JP") : "";
  }

  function getSafeProducts(products = {}) {
    return {
      paidReport: { ...DEFAULT_PRODUCTS.paidReport, ...(products.paidReport || {}) },
      premiumReading: { ...DEFAULT_PRODUCTS.premiumReading, ...(products.premiumReading || {}) },
      deepReading: { ...DEFAULT_PRODUCTS.deepReading, ...(products.deepReading || {}) }
    };
  }

  function toDays(dateString) {
    if (!dateString) return 0;

    const time = new Date(`${dateString}T12:00:00+09:00`).getTime();
    return Number.isFinite(time) ? time / 86400000 : 0;
  }

  function pick(pool, key) {
    if (!Array.isArray(pool) || pool.length === 0) {
      throw new Error("pick() requires a non-empty array.");
    }

    return pool[hash(key) % pool.length];
  }

  function getSeimeiCardData(birthDate) {
    return pick(CARD_POOL, birthDate);
  }

  function getCurrentPositionCardData(birthDate, targetDate) {
    const progress = getLifeProgressPercent(birthDate, targetDate);
    const index = clamp(Math.floor(progress / (100 / CARD_POOL.length)), 0, CARD_POOL.length - 1);

    return CARD_POOL[index];
  }

  function getSeimeiCard(birthDate) {
    return getSeimeiCardData(birthDate).name;
  }

  function getCurrentPositionCard(birthDate, targetDate) {
    return getCurrentPositionCardData(birthDate, targetDate).name;
  }

  function getLifeProgressPercent(birthDate, targetDate) {
    const birthDays = toDays(birthDate);
    const targetDays = toDays(targetDate);

    if (!birthDays || !targetDays) return 0;

    const elapsed = Math.max(0, targetDays - birthDays);
    const base = 365.2425 * 100;

    return clamp((elapsed / base) * 100, 0, 100);
  }

  function getRelationshipReading(userCards, partnerCards) {
    const mix = [
      userCards.seimei.name,
      userCards.current.name,
      partnerCards.seimei.name,
      partnerCards.current.name
    ].join("|");

    return pick(RELATION_TEMPLATES, mix);
  }

  function buildSingleReading(input) {
    const seimei = getSeimeiCardData(input.singleBirthDate);
    const current = getCurrentPositionCardData(input.singleBirthDate, input.readingDate);
    const progress = getLifeProgressPercent(input.singleBirthDate, input.readingDate);

    return {
      name: input.singleName,
      seimei,
      current,
      progress,
      progressLabel: progress.toFixed(2)
    };
  }

  function buildRelationshipReading(input) {
    const userCards = {
      seimei: getSeimeiCardData(input.userBirthDate),
      current: getCurrentPositionCardData(input.userBirthDate, input.readingDate)
    };

    const partnerCards = {
      seimei: getSeimeiCardData(input.partnerBirthDate),
      current: getCurrentPositionCardData(input.partnerBirthDate, input.readingDate)
    };

    return {
      userName: input.userName,
      partnerName: input.partnerName,
      userCards,
      partnerCards,
      relationship: getRelationshipReading(userCards, partnerCards)
    };
  }

  function renderSingleResult(input, products = DEFAULT_PRODUCTS) {
    const safeProducts = getSafeProducts(products);
    const reading = buildSingleReading(input);
    const name = escapeHtml(reading.name);
    const seimei = reading.seimei;
    const current = reading.current;
    const progressLabel = reading.progressLabel;

    return `
      <section class="card result-card">
        <p class="eyebrow">SHION SEIMEI READING</p>
        <h2>星命現在地診断（無料結果）</h2>

        <div class="current-message">
          <p><strong>${name}</strong>さんは今、「${current.name}」の場所にいます。</p>
          <p>${current.current}</p>
        </div>

        <div class="relation-grid">
          <div>
            <h3>星命カード</h3>
            <p><strong>${seimei.name}</strong></p>
            <p>${seimei.essence}</p>
          </div>
          <div>
            <h3>現在地カード</h3>
            <p><strong>${current.name}</strong></p>
            <p>${current.essence}</p>
          </div>
        </div>

        <div class="reading-sections">
          <div class="reading-block">
            <h3>本質と現在地のズレ</h3>
            <p>${current.gap}</p>
          </div>
          <div class="reading-block">
            <h3>今日からの一歩</h3>
            <p>${current.action}</p>
          </div>
        </div>

        <div class="progress" aria-label="現在地 ${progressLabel}%">
          <span style="width:${progressLabel}%"></span>
        </div>
        <p class="subtle">現在地：人生100年地図の約${progressLabel}%</p>

        <a class="cta" href="${escapeHtml(safeProducts.premiumReading.url)}">個人鑑定の案内を見る</a>
      </section>`;
  }

  function renderRelationshipResult(input, products = DEFAULT_PRODUCTS) {
    const safeProducts = getSafeProducts(products);
    const reading = buildRelationshipReading(input);
    const userName = escapeHtml(reading.userName);
    const partnerName = escapeHtml(reading.partnerName);
    const userCards = reading.userCards;
    const partnerCards = reading.partnerCards;
    const rel = reading.relationship;

    return `
      <section class="card result-card">
        <p class="eyebrow">SHION LOVE READING</p>
        <h2>この恋の現在地診断（無料結果）</h2>

        <div class="current-message">
          <p>${rel.attraction}</p>
          <p>ただし今は、好きな気持ちだけで進めるよりも、2人の距離感を丁寧に見直すタイミングです。</p>
        </div>

        <div class="relation-grid">
          <div>
            <h3>あなた</h3>
            <p><strong>${userName}</strong></p>
            <p>星命カード：${userCards.seimei.name}</p>
            <p>現在地カード：${userCards.current.name}</p>
          </div>
          <div>
            <h3>お相手</h3>
            <p><strong>${partnerName}</strong></p>
            <p>星命カード：${partnerCards.seimei.name}</p>
            <p>現在地カード：${partnerCards.current.name}</p>
          </div>
        </div>

        <div class="reading-sections">
          <div class="reading-block">
            <h3>惹かれ合う理由</h3>
            <p>${rel.attraction}</p>
          </div>
          <div class="reading-block">
            <h3>すれ違いやすいポイント</h3>
            <p>${rel.mismatch}</p>
          </div>
          <div class="reading-block">
            <h3>今の2人の距離感</h3>
            <p>${rel.distance}</p>
          </div>
          <div class="reading-block">
            <h3>やってはいけない行動</h3>
            <p>${rel.avoid}</p>
          </div>
          <div class="reading-block">
            <h3>関係を育てるヒント</h3>
            <p>${rel.hint}</p>
          </div>
          <div class="reading-block">
            <h3>今日の一歩</h3>
            <p>${rel.action}</p>
          </div>
        </div>

        <p><strong>ひとりで抱えたままにしなくて大丈夫です。</strong></p>

        <div class="sales-block main-offer">
          <h3>もっと詳しく知りたい方へ</h3>
          <p>${escapeHtml(safeProducts.paidReport.name)}（通常${formatPrice(safeProducts.paidReport.regularPrice)}円→記念価格${formatPrice(safeProducts.paidReport.launchPrice)}円）</p>
          <a class="cta" href="${escapeHtml(safeProducts.paidReport.url)}">この恋の現在地レポートを見る</a>
        </div>

        <div class="sales-block">
          <h3>相手の本音まで知りたい方へ</h3>
          <a class="cta ghost" href="${escapeHtml(safeProducts.premiumReading.url)}">相手の本音と今後をタロットで見る</a>
        </div>

        <div class="sales-block">
          <a class="cta ghost" href="${escapeHtml(safeProducts.deepReading.url)}">深掘り鑑定書を見る</a>
        </div>
      </section>`;
  }

  function renderNotice() {
    return `
      <section class="card subtle">
        <p>注意：この診断は、寿命や未来を断定するものではありません。人生100年という大きな地図を使い、今のあなたがどの地点にいるのかを象徴的に読み解くものです。</p>
        <p>相手の言動によって強い恐怖、支配、暴力、脅し、過度な束縛を感じている場合は、相性の問題として抱え込まないでください。その場合は占いの結果よりも、あなた自身の安全を最優先にしてください。信頼できる人や専門窓口に相談することをおすすめします。</p>
      </section>`;
  }

  function render(el, input, data = {}) {
    if (!el) {
      throw new Error("Result container is required.");
    }

    const products = getSafeProducts(data.PRODUCTS);
    const isPair = input.diagnosisType === "pair";

    const html = isPair
      ? renderRelationshipResult(input, products)
      : renderSingleResult(input, products);

    el.innerHTML = html + renderNotice();

    return {
      diagnosisType: input.diagnosisType,
      rendered: true,
      mode: isPair ? "relationship" : "single"
    };
  }

  return {
    render,
    getSeimeiCard,
    getCurrentPositionCard,
    getLifeProgressPercent,
    getRelationshipReading,
    renderSingleResult,
    renderRelationshipResult
  };
})();
