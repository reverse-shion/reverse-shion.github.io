document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-summon-root]');
  if (!root) return;

  const cardWrap = root.querySelector('[data-summon-card]');
  const card = cardWrap?.querySelector('.tb-arcana-card');
  const status =
    root.querySelector('[data-summon-status]') ||
    root.querySelector('.tb-summon-status');
  const pameraImage = root.querySelector('[data-pamera-image]');

  if (!card || !status || !pameraImage) {
    alert(
      [
        `card: ${!!card}`,
        `status: ${!!status}`,
        `pameraImage: ${!!pameraImage}`,
        `url: ${location.href}`
      ].join('\n')
    );
    return;
  }

  const PAMERA_MEMBERS = [
    {
      key: 'fool',
      name: '愚者',
      image: './img/pamera/cards/pamera-fool.webp',
      url: './projects/pamera/fool.html'
    },
    {
      key: 'magician',
      name: '魔術師',
      image: './img/pamera/cards/pamera-magician.webp',
      url: './projects/pamera/magician.html'
    },
    {
      key: 'high-priestess',
      name: '女教皇',
      image: './img/pamera/cards/pamera-high-priestess.webp',
      url: './projects/pamera/high-priestess.html'
    },
    {
      key: 'empress',
      name: '女帝',
      image: './img/pamera/cards/pamera-empress.webp',
      url: './projects/pamera/empress.html'
    },
    {
      key: 'emperor',
      name: '皇帝',
      image: './img/pamera/cards/pamera-emperor.webp',
      url: './projects/pamera/emperor.html'
    }
  ];

  let revealedMember = null;
  let locked = false;

  const setStatus = (message) => {
    status.textContent = message;
  };

  const pickRandomMember = () => {
    const index = Math.floor(Math.random() * PAMERA_MEMBERS.length);
    return PAMERA_MEMBERS[index];
  };

  const revealMember = () => {
    const pick = pickRandomMember();
    revealedMember = pick;

    pameraImage.src = pick.image;
    pameraImage.alt = `Pamera ${pick.name}`;

    root.dataset.state = 'revealed';
    card.dataset.phase = 'revealed';
    card.dataset.flip = 'true';
    card.dataset.linkReady = 'true';

    setStatus('接続完了：もう一度カードに触れると、その存在のページへ進みます。');
  };

  const navigateToMember = () => {
    if (!revealedMember) return;
    window.location.href = revealedMember.url;
  };

  const onCardAction = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (locked) return;
    locked = true;

    const isFlipped = card.dataset.flip === 'true';
    const linkReady = card.dataset.linkReady === 'true';

    if (!isFlipped) {
      revealMember();
      window.setTimeout(() => {
        locked = false;
      }, 300);
      return;
    }

    if (linkReady) {
      navigateToMember();
      return;
    }

    locked = false;
  };

  card.dataset.phase = 'idle';
  card.dataset.flip = 'false';
  card.dataset.linkReady = 'false';
  setStatus('待機中：カードに触れると、Pameraとの接続が始まります。');

  card.addEventListener('click', onCardAction, { passive: false });
  card.addEventListener('pointerup', onCardAction, { passive: false });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onCardAction(event);
    }
  });
});
