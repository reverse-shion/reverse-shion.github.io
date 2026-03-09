window.TB?.ready(() => {
  const root = document.querySelector('[data-summon-root]');
  if (!root) return;

  const button = root.querySelector('[data-summon-button]');
  const card = root.querySelector('.tb-arcana-card');
  const status = root.querySelector('[data-summon-status]');
  const nameEl = root.querySelector('[data-arcana-name]');
  const themeEl = root.querySelector('[data-arcana-theme]');
  const keywordEl = root.querySelector('[data-arcana-keyword]');

  const fallback = [
    { name: 'The Gatekeeper', theme: '境界に立ち、恐れと希望の両方を受け入れる。', keyword: '境界 / 受容 / 始動' },
    { name: 'The Resonance', theme: '誰かの声が、あなたの灯火を再点火する。', keyword: '共鳴 / 再起 / 連結' },
    { name: 'The Quiet Star', theme: '静かな夜ほど、真実の言葉は遠くへ届く。', keyword: '沈黙 / 観測 / 余韻' }
  ];

  let arcana = fallback;

  fetch('./data/arcana.json')
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('json load failed'))))
    .then((data) => {
      if (Array.isArray(data?.cards) && data.cards.length) {
        arcana = data.cards;
        status.textContent = '接続完了：アルカナ記録を読み込みました。';
      }
    })
    .catch(() => {
      status.textContent = '接続注意：記録の読み込みに失敗したため、予備アーカイブを使用します。';
    });

  button.addEventListener('click', () => {
    const pick = arcana[Math.floor(Math.random() * arcana.length)];
    status.textContent = '召喚中：星界の膜が反転しています…';
    card.dataset.flip = 'false';

    setTimeout(() => {
      nameEl.textContent = pick.name;
      themeEl.textContent = pick.theme;
      keywordEl.textContent = pick.keyword;
      card.dataset.flip = 'true';
      status.textContent = '召喚完了：徴を受け取りました。';
    }, 320);
  });
});
