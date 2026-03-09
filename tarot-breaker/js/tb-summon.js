window.TB?.ready(() => {
  const root = document.querySelector('[data-summon-root]');
  if (!root) return;

  const button = root.querySelector('[data-summon-button]');
  const card = root.querySelector('.tb-arcana-card');
  const stage = root.closest('.tb-summon-stage') || root;
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

  const setStageState = (phase, state) => {
    card.dataset.phase = phase;
    stage.dataset.state = state;
  };

  let arcana = fallback;
  let busy = false;

  const resetIdle = () => {
    setStageState('idle', 'idle');
    status.textContent = '待機中：セレフィーズ認証は静かに維持されています。';
    button.textContent = 'タロット展開';
    button.removeAttribute('aria-busy');
  };

  const showStoredResult = (stored, fallbackMessage) => {
    renderCard(stored.card);
    setStageState('revealed', 'revealed');
    button.textContent = '今日の徴を確認する';
    status.textContent = fallbackMessage || '本日のタロット展開は記録されています。今日の徴をゆっくり読み解いてください。';
  };

  fetch('./data/arcana.json')
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('json load failed'))))
    .then((data) => {
      if (Array.isArray(data?.cards) && data.cards.length) {
        arcana = data.cards;
      }
      const stored = parseStored();
      if (stored?.date === todayKey()) {
        showStoredResult(stored);
      } else {
        resetIdle();
      }
    })
    .catch(() => {
      const stored = parseStored();
      if (stored?.date === todayKey()) {
        showStoredResult(stored, '本日のタロット展開は記録されています。予備記録から同期表示しています。');
        return;
      }
      resetIdle();
      status.textContent = '接続注意：記録の読み込みに失敗したため、予備アーカイブで展開します。';
    });

  button.addEventListener('click', async () => {
    if (busy) return;

    const stored = parseStored();
    if (stored?.date === todayKey()) {
      showStoredResult(stored, '今日の徴は記録済みです。門の前で静かに読み解いてください。');
      return;
    }

    busy = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = '星界接続中…';
    setStageState('connecting', 'connecting');
    status.textContent = '星界接続を開始。儀式回路を起動しています…';
    await sleep(900);

    status.textContent = '同期中… 星粒の位相を合わせています。';
    await sleep(1200);

    status.textContent = '徴の記録中… まもなく今日の一枚が現れます。';
    await sleep(1000);

    const pick = arcana[Math.floor(Math.random() * arcana.length)];
    renderCard(pick);
    setStageState('revealed', 'revealed');
    storeCard(pick);

    button.removeAttribute('aria-busy');
    button.textContent = '今日の徴を確認する';
    status.textContent = '展開完了：今日の一枚を記録しました。門は静かに開き続けています。';
    busy = false;
  });
});
