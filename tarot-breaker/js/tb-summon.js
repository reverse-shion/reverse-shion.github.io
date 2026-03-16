TB.register(() => {

  const root = document.querySelector('[data-summon-root]');
  if (!root) return;

  const button = root.querySelector('[data-summon-button]');
  const cardWrap = root.querySelector('[data-summon-card]');
  const card = cardWrap?.querySelector('.tb-arcana-card');
  const stage = root.closest('.tb-summon-stage');
  const status = root.querySelector('[data-summon-status]');

  const nameEl = root.querySelector('[data-arcana-name]');
  const subtitleEl = root.querySelector('[data-arcana-subtitle]');
  const themeEl = root.querySelector('[data-arcana-theme]');
  const keywordEl = root.querySelector('[data-arcana-keyword]');
  const omenEl = root.querySelector('[data-arcana-omen]');

  if (!button || !card) return;

  const arcana = [
    {
      name: "The Gatekeeper",
      subtitle: "Threshold Signal",
      message: "境界に立つ呼吸が、最初の星界接続となる。",
      keyword: "境界 / 受容 / 始動",
      meaning: "門前で留まり、兆しを受信する。"
    },
    {
      name: "The Resonance",
      subtitle: "Echo Link",
      message: "誰かの声と重なった瞬間、灯火は再起動する。",
      keyword: "共鳴 / 再起 / 連結",
      meaning: "今の選択は、孤立ではなく共振で開く。"
    },
    {
      name: "The Quiet Star",
      subtitle: "Silent Observatory",
      message: "静かな夜ほど、徴は澄んだ輪郭を持つ。",
      keyword: "沈黙 / 観測 / 余韻",
      meaning: "急がず観測するほど、言葉は正確になる。"
    }
  ];

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const render = (cardData) => {

    subtitleEl.textContent = cardData.subtitle;
    nameEl.textContent = cardData.name;
    themeEl.textContent = cardData.message;
    keywordEl.textContent = cardData.keyword;
    omenEl.textContent = cardData.meaning;

  };

  button.addEventListener("click", async () => {

    button.textContent = "星界接続中…";
    status.textContent = "星界回路を起動しています…";

    await sleep(700);

    status.textContent = "共鳴位相を同期中…";

    await sleep(800);

    const pick = arcana[Math.floor(Math.random() * arcana.length)];

    render(pick);

    card.dataset.phase = "revealed";
    card.dataset.flip = "true";

    button.textContent = "今日の徴を確認する";
    status.textContent = "展開完了：今日の徴を記録しました。";

  });

});
