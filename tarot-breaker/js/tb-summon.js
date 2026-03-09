window.TB?.ready(() => {
  const root = document.querySelector('[data-summon-root]');
  if (!root) return;

  const button = root.querySelector('[data-summon-button]');
  const card = root.querySelector('.tb-arcana-card');
  const status = root.querySelector('[data-summon-status]');
  const nameEl = root.querySelector('[data-arcana-name]');
  const subtitleEl = root.querySelector('[data-arcana-subtitle]');
  const themeEl = root.querySelector('[data-arcana-theme]');
  const keywordEl = root.querySelector('[data-arcana-keyword]');
  const omenEl = root.querySelector('[data-arcana-omen]');

  const storageKey = 'tb-daily-spread';
  const fallback = [
    {
      id: 'arcana-fb-01',
      name: 'The Gatekeeper',
      subtitle: 'Threshold Signal',
      message: '境界に立つ呼吸が、最初の星界接続となる。',
      keyword: '境界 / 受容 / 始動',
      meaning: '門前で留まり、兆しを受信する。'
    },
    {
      id: 'arcana-fb-02',
      name: 'The Resonance',
      subtitle: 'Echo Link',
      message: '誰かの声と重なった瞬間、灯火は再起動する。',
      keyword: '共鳴 / 再起 / 連結',
      meaning: '今の選択は、孤立ではなく共振で開く。'
    },
    {
      id: 'arcana-fb-03',
      name: 'The Quiet Star',
      subtitle: 'Silent Observatory',
      message: '静かな夜ほど、徴は澄んだ輪郭を持つ。',
      keyword: '沈黙 / 観測 / 余韻',
      meaning: '急がず観測するほど、言葉は正確になる。'
    }
  ];

  const todayKey = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const parseStored = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.date || !parsed?.card) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const storeCard = (cardData) => {
    localStorage.setItem(storageKey, JSON.stringify({ date: todayKey(), card: cardData }));
  };

  const renderCard = (pick) => {
    subtitleEl.textContent = pick.subtitle || 'Stellar Omen';
    nameEl.textContent = pick.name || 'Unknown Arcana';
    themeEl.textContent = pick.message || pick.theme || '星界からの徴を受信しました。';
    keywordEl.textContent = pick.keyword || pick.meaning || '――';
    omenEl.textContent = pick.meaning || pick.omen || '今日の一枚は、あなたの歩幅に静かに同調します。';
  };

  let arcana = fallback;
  let busy = false;

  const setIdle = () => {
    card.dataset.phase = 'idle';
  };

  fetch('./data/arcana.json')
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('json load failed'))))
    .then((data) => {
      if (Array.isArray(data?.cards) && data.cards.length) {
        arcana = data.cards;
      }
      const stored = parseStored();
      if (stored?.date === todayKey()) {
        renderCard(stored.card);
        card.dataset.flip = 'true';
        card.dataset.phase = 'revealed';
        button.disabled = true;
        button.textContent = '本日の記録を表示中';
        status.textContent = '本日のタロット展開は記録されています。受信済みの一枚を、必要なだけ見届けてください。';
      } else {
        setIdle();
        status.textContent = '待機中：セレフィーズ認証は静かに維持されています。';
      }
    })
    .catch(() => {
      const stored = parseStored();
      if (stored?.date === todayKey()) {
        renderCard(stored.card);
        card.dataset.flip = 'true';
        card.dataset.phase = 'revealed';
        button.disabled = true;
        button.textContent = '本日の記録を表示中';
        status.textContent = '本日のタロット展開は記録されています。予備記録から同期表示しています。';
        return;
      }
      setIdle();
      status.textContent = '接続注意：記録の読み込みに失敗したため、予備アーカイブで展開できます。';
    });

  button.addEventListener('click', async () => {
    if (busy || button.disabled) return;

    const stored = parseStored();
    if (stored?.date === todayKey()) {
      renderCard(stored.card);
      card.dataset.flip = 'true';
      card.dataset.phase = 'revealed';
      button.disabled = true;
      button.textContent = '本日の記録を表示中';
      status.textContent = '本日のタロット展開は記録されています。受信済みの一枚を確認してください。';
      return;
    }

    busy = true;
    button.disabled = true;
    button.textContent = '星界接続中...';
    card.dataset.flip = 'false';
    card.dataset.phase = 'connecting';
    status.textContent = '星界接続を開始。観測窓を開いています…';
    await sleep(860);

    status.textContent = '観測同期中… 一枚の徴を受信しています。';
    await sleep(780);

    const pick = arcana[Math.floor(Math.random() * arcana.length)];
    renderCard(pick);
    card.dataset.flip = 'true';
    card.dataset.phase = 'revealed';
    storeCard(pick);

    status.textContent = '展開完了：今日の一枚を記録しました。門はまだ開いています。';
    button.textContent = '本日の記録を表示中';
    busy = false;
  });
});
