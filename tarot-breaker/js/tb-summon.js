console.log('[tb-summon] file loaded');

(() => {
  const init = () => {
    console.log('[tb-summon] init start');

    const root = document.querySelector('[data-summon-root]');
    console.log('[tb-summon] root =', root);

    if (!root) {
      console.warn('[tb-summon] root not found');
      return;
    }

    const button = root.querySelector('[data-summon-button]');
    const card = root.querySelector('.tb-arcana-card');
    const status = root.querySelector('[data-summon-status]');
    const nameEl = root.querySelector('[data-arcana-name]');
    const subtitleEl = root.querySelector('[data-arcana-subtitle]');
    const themeEl = root.querySelector('[data-arcana-theme]');
    const keywordEl = root.querySelector('[data-arcana-keyword]');
    const omenEl = root.querySelector('[data-arcana-omen]');

    console.log('[tb-summon] elements', {
      button, card, status, nameEl, subtitleEl, themeEl, keywordEl, omenEl
    });

    if (!button || !card || !status || !nameEl || !subtitleEl || !themeEl || !keywordEl || !omenEl) {
      console.warn('[tb-summon] required elements missing');
      return;
    }

    const deck = [
      {
        name: 'The Gatekeeper',
        subtitle: 'Threshold Signal',
        message: '境界に立つ呼吸が、最初の星界接続となる。',
        keyword: '境界 / 受容 / 始動',
        meaning: '門前で留まり、兆しを受信する。'
      },
      {
        name: 'The Resonance',
        subtitle: 'Echo Link',
        message: '誰かの声と重なった瞬間、灯火は再起動する。',
        keyword: '共鳴 / 再起 / 連結',
        meaning: '今の選択は、孤立ではなく共振で開く。'
      },
      {
        name: 'The Quiet Star',
        subtitle: 'Silent Observatory',
        message: '静かな夜ほど、徴は澄んだ輪郭を持つ。',
        keyword: '沈黙 / 観測 / 余韻',
        meaning: '急がず観測するほど、言葉は正確になる。'
      }
    ];

    let index = 0;

    button.addEventListener('click', () => {
      console.log('[tb-summon] button clicked');

      const pick = deck[index % deck.length];
      index += 1;

      subtitleEl.textContent = pick.subtitle;
      nameEl.textContent = pick.name;
      themeEl.textContent = pick.message;
      keywordEl.textContent = pick.keyword;
      omenEl.textContent = pick.meaning;

      root.dataset.state = 'revealed';
      card.dataset.phase = 'revealed';
      card.dataset.flip = 'true';
      status.textContent = `展開完了：「${pick.name}」の徴を記録しました。`;

      console.log('[tb-summon] updated', {
        state: root.dataset.state,
        phase: card.dataset.phase,
        flip: card.dataset.flip
      });
    });

    console.log('[tb-summon] listener attached');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
