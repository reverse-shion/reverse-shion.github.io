(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('[data-summon-root]');
    const card = document.querySelector('.tb-arcana-card');
    const status = document.querySelector('[data-summon-status]');
    const pameraImage = document.querySelector('[data-pamera-image]');

    alert('tb-summon loaded');

    if (!root || !card || !status || !pameraImage) {
      alert('required elements not found');
      return;
    }

    const members = [
      {
        name: '愚者',
        image: './img/pamera/cards/pamera-fool.webp',
        url: './projects/pamera/fool.html'
      },
      {
        name: '魔術師',
        image: './img/pamera/cards/pamera-magician.webp',
        url: './projects/pamera/magician.html'
      },
      {
        name: '女教皇',
        image: './img/pamera/cards/pamera-high-priestess.webp',
        url: './projects/pamera/high-priestess.html'
      },
      {
        name: '女帝',
        image: './img/pamera/cards/pamera-empress.webp',
        url: './projects/pamera/empress.html'
      },
      {
        name: '皇帝',
        image: './img/pamera/cards/pamera-emperor.webp',
        url: './projects/pamera/emperor.html'
      }
    ];

    let revealed = null;

    const pick = () => members[Math.floor(Math.random() * members.length)];

    const act = () => {
      alert('card tapped');

      if (card.dataset.flip !== 'true') {
        revealed = pick();
        pameraImage.src = revealed.image;
        pameraImage.alt = revealed.name;
        card.dataset.flip = 'true';
        card.dataset.linkReady = 'true';
        status.textContent = '接続完了：もう一度カードに触れると、その存在のページへ進みます。';
        return;
      }

      if (revealed) {
        window.location.href = revealed.url;
      }
    };

    card.addEventListener('click', act);
    card.addEventListener('pointerup', act);

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        act();
      }
    });

    status.textContent = '待機中：カードに触れると、Pameraとの接続が始まります。';
  });
})();
