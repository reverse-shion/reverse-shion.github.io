(() => {
  const initSummon = () => {
    const root = document.querySelector('[data-summon-root]');
    if (!root) return;

    const button = root.querySelector('[data-summon-button]');
    const cardWrap = root.querySelector('[data-summon-card]');
    const card = cardWrap?.querySelector('.tb-arcana-card');
    const status = root.querySelector('[data-summon-status]');

    const nameEl = root.querySelector('[data-arcana-name]');
    const subtitleEl = root.querySelector('[data-arcana-subtitle]');
    const themeEl = root.querySelector('[data-arcana-theme]');
    const keywordEl = root.querySelector('[data-arcana-keyword]');
    const omenEl = root.querySelector('[data-arcana-omen]');

    if (
      !button || !cardWrap || !card || !status ||
      !nameEl || !subtitleEl || !themeEl || !keywordEl || !omenEl
    ) {
      console.warn('tb-summon: required elements not found');
      return;
    }

    if (root.dataset.summonInitialized === 'true') return;
    root.dataset.summonInitialized = 'true';

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

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const setText = (el, value) => {
      el.textContent = value;
    };

    const render = (cardData) => {
      setText(subtitleEl, cardData.subtitle);
      setText(nameEl, cardData.name);
      setText(themeEl, cardData.message);
      setText(keywordEl, cardData.keyword);
      setText(omenEl, cardData.meaning);
    };

    const setIdle = () => {
      root.dataset.state = 'idle';
      card.dataset.phase = 'idle';
      card.dataset.flip = 'false';
      button.disabled = false;
      button.textContent = 'タロット展開';
      button.setAttribute('aria-expanded', 'false');
      status.textContent = '待機中：門の前で呼吸を整えると、星界接続が始まります。';
    };

    let busy = false;
    let lastIndex = -1;

    const pickArcana = () => {
      if (arcana.length === 0) {
        throw new Error('arcana deck is empty');
      }
      if (arcana.length === 1) {
        lastIndex = 0;
        return arcana[0];
      }

      let nextIndex = lastIndex;
      while (nextIndex === lastIndex) {
        nextIndex = Math.floor(Math.random() * arcana.length);
      }
      lastIndex = nextIndex;
      return arcana[nextIndex];
    };

    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true;

      try {
        button.disabled = true;
        button.textContent = '星界接続中…';
        status.textContent = '星界回路を起動しています…';

        root.dataset.state = 'charging';
        card.dataset.phase = 'charging';
        card.dataset.flip = 'false';
        button.setAttribute('aria-expanded', 'false');

        card.classList.remove('is-animating');
        void card.offsetWidth;
        card.classList.add('is-animating');

        await sleep(650);

        root.dataset.state = 'syncing';
        card.dataset.phase = 'syncing';
        status.textContent = '共鳴位相を同期中…';

        await sleep(780);

        const pick = pickArcana();
        render(pick);

        root.dataset.state = 'revealed';
        card.dataset.phase = 'revealed';
        card.dataset.flip = 'true';
        button.setAttribute('aria-expanded', 'true');

        button.textContent = 'もう一度、展開する';
        status.textContent = `展開完了：「${pick.name}」の徴を記録しました。`;
      } catch (error) {
        console.error('tb-summon error:', error);
        root.dataset.state = 'idle';
        card.dataset.phase = 'idle';
        card.dataset.flip = 'false';
        button.textContent = '再度、星界に触れる';
        button.setAttribute('aria-expanded', 'false');
        status.textContent = '接続に失敗しました。少し時間をおいて、もう一度お試しください。';
      } finally {
        button.disabled = false;
        busy = false;
        setTimeout(() => {
          card.classList.remove('is-animating');
        }, 200);
      }
    });

    setIdle();
  };

  if (window.TB && typeof window.TB.register === 'function') {
    window.TB.register(initSummon);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSummon, { once: true });
  } else {
    initSummon();
  }
})();
