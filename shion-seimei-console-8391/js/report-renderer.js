window.ShionReportRenderer = (() => {
  const CARD_POOL = ["太陽", "月", "星", "皇帝", "女帝", "隠者", "節制", "世界", "恋人", "力", "正義", "運命の輪"];

  const toDays = (d) => new Date(d + "T12:00:00+09:00").getTime() / 86400000;
  const seed = (s) => s.replace(/-/g, "").split("").reduce((a, n) => a + Number(n), 0);

  function getSeimeiCard(birthDate) {
    return CARD_POOL[seed(birthDate) % CARD_POOL.length];
  }

  function getLifeProgressPercent(birthDate, targetDate) {
    const elapsed = Math.max(0, toDays(targetDate) - toDays(birthDate));
    const base = 365.2425 * 100;
    return Math.min(100, (elapsed / base) * 100);
  }

  function getCurrentPositionCard(birthDate, targetDate) {
    const p = getLifeProgressPercent(birthDate, targetDate);
    return CARD_POOL[Math.floor(p / (100 / CARD_POOL.length)) % CARD_POOL.length];
  }

  function getRelationshipReading(userCards, partnerCards) {
    const mix = `${userCards.seimei}-${userCards.current}-${partnerCards.seimei}-${partnerCards.current}`;
    const type = seed(mix) % 5;
    const templates = [
      ["惹かれ合う理由があります。", "お互いの優しさの形が違うため、伝え方で誤解が起きやすいです。", "今は距離感を整える時期です。", "気持ちをぶつけるより、伝え方を整えることが大切です。", "確認せずに不安を決めつけること。", "短い言葉で安心を重ねましょう。"],
      ["安心と刺激の両方を交換できる組み合わせです。", "自由とつながりのバランスで揺れやすいです。", "近づきたい気持ちと慎重さが並ぶ距離です。", "急がせるより、受け取りやすい形で伝えましょう。", "反応の遅さを愛情の欠如と断定すること。", "余白を残した連絡が関係を育てます。"],
      ["静かに信頼を積み重ねやすい関係です。", "察し合いに頼りすぎるとすれ違います。", "言葉が少ないほど不安が増えやすい距離です。", "小さな確認を習慣にするのが鍵です。", "結論を急いで試すような言い方をすること。", "誠実な一言を先に届けてください。"],
      ["お互いに成長を促し合う力があります。", "与えすぎる側に偏ると苦しさが出ます。", "支えたい気持ちが先行しやすい距離です。", "自分を削らずに優しさを渡す意識が大切です。", "無理を隠して合わせ続けること。", "境界線を守るほど長続きします。"],
      ["心の奥で同じ光を探している2人です。", "ペースの違いで不安が生まれやすいです。", "今は追うより整える距離が合っています。", "焦らず、安心できる時間を少しずつ重ねましょう。", "答えを迫って相手を追い込むこと。", "相手のペースを尊重する一歩が有効です。"]
    ][type];

    return { reassurance: templates[0], attraction: templates[0], mismatch: templates[1], distance: templates[2], action: templates[3], avoid: templates[4], hint: templates[5] };
  }

  function renderSingleResult(input, products) {
    const seimei = getSeimeiCard(input.singleBirthDate);
    const current = getCurrentPositionCard(input.singleBirthDate, input.readingDate);
    const progress = getLifeProgressPercent(input.singleBirthDate, input.readingDate);
    return `
      <section class="card result-card"><h2>星命現在地診断（無料結果）</h2>
      <p><strong>${input.singleName}</strong>さんの星命カードは「${seimei}」、現在地カードは「${current}」です。</p>
      <p>生まれ持った心のテーマは、丁寧に自分の光を育てること。今の人生章は、選び方を整える場面です。</p>
      <p>本質と現在地のズレは「急ぎたい気持ちと整えたい現実」です。つまずきやすい理由は、焦りで本音が後回しになること。</p>
      <p>今日から意識したい一言：<strong>小さく整えて、静かに進む。</strong></p>
      <div class="progress"><span style="width:${progress.toFixed(2)}%"></span></div>
      <p class="subtle">現在地：人生100年地図の約${progress.toFixed(2)}%</p>
      <a class="cta" href="${products.premiumReading.url}">個人鑑定の案内を見る</a>
      </section>`;
  }

  function renderRelationshipResult(input, products) {
    const userCards = { seimei: getSeimeiCard(input.userBirthDate), current: getCurrentPositionCard(input.userBirthDate, input.readingDate) };
    const partnerCards = { seimei: getSeimeiCard(input.partnerBirthDate), current: getCurrentPositionCard(input.partnerBirthDate, input.readingDate) };
    const rel = getRelationshipReading(userCards, partnerCards);
    return `
    <section class="card result-card"><h2>この恋の現在地診断（無料結果）</h2>
    <div class="relation-grid"><div><h3>あなた</h3><p>星命カード：${userCards.seimei}</p><p>現在地カード：${userCards.current}</p></div><div><h3>お相手</h3><p>星命カード：${partnerCards.seimei}</p><p>現在地カード：${partnerCards.current}</p></div></div>
    <h3>関係マップ</h3><ul><li>惹かれ合う理由：${rel.attraction}</li><li>すれ違いやすいポイント：${rel.mismatch}</li><li>今の2人の距離感：${rel.distance}</li><li>やってはいけない行動：${rel.avoid}</li><li>関係を育てるヒント：${rel.hint}</li></ul>
    <p>${rel.reassurance} ひとりで抱えたままにしなくて大丈夫です。</p>
    <div class="sales-block main-offer"><h3>もっと詳しく知りたい方へ</h3><p>${products.paidReport.name}（通常${products.paidReport.regularPrice.toLocaleString()}円→記念価格${products.paidReport.launchPrice.toLocaleString()}円）</p><a class="cta" href="${products.paidReport.url}">この恋の現在地レポートを見る</a></div>
    <div class="sales-block"><h3>相手の本音まで知りたい方へ</h3><a class="cta ghost" href="${products.premiumReading.url}">相手の本音と今後をタロットで見る</a></div>
    <div class="sales-block"><a class="cta ghost" href="${products.deepReading.url}">深掘り鑑定書を見る</a></div>
    </section>`;
  }

  function render(el, input, data) {
    el.innerHTML = input.diagnosisType === "pair" ? renderRelationshipResult(input, data.PRODUCTS) : renderSingleResult(input, data.PRODUCTS);
    el.innerHTML += `<section class="card subtle"><p>注意：この診断は、寿命や未来を断定するものではありません。人生100年という大きな地図を使い、今のあなたがどの地点にいるのかを象徴的に読み解くものです。</p><p>相手の言動によって強い恐怖、支配、暴力、脅し、過度な束縛を感じている場合は、相性の問題として抱え込まないでください。 その場合は占いの結果よりも、あなた自身の安全を最優先にしてください。信頼できる人や専門窓口に相談することをおすすめします。</p></section>`;
    return {};
  }

  return { render, getSeimeiCard, getCurrentPositionCard, getLifeProgressPercent, getRelationshipReading, renderSingleResult, renderRelationshipResult };
})();
