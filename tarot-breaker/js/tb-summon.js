TB.ready(() => {
  const root = document.querySelector('[data-summon-root]');
  if (!root) return;

  const button = root.querySelector('[data-summon-button]');
  const cardWrap = root.querySelector('[data-summon-card]');
  const card = cardWrap?.querySelector('.tb-arcana-card');
  const status = root.querySelector('[data-summon-status]');
  const pameraImage = root.querySelector('[data-pamera-image]');

  if (!button || !card || !status || !pameraImage) {
    console.warn('tb-summon: required elements not found');
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

  const setIdle = () => {
    root.dataset.state = 'idle';
    card.dataset.phase = 'idle';
    card.dataset.flip = 'false';
    card.dataset.linkReady = 'false';
    status.textContent = '待機中：カードに触れると、Pameraとの接続が始まります。';
    card.setAttribute('aria-label', 'Pamera召喚カード');
  };

  const setReady = () => {
    revealedMember = null;
    root.dataset.state = 'ready';
    card.dataset.phase = 'ready';
    card.dataset.flip = 'false';
    card.dataset.linkReady = 'false';
    button.textContent = '再召喚する';
    status.textContent = '接続準備完了：カードに触れてPameraを召喚してください。';
    card.focus({ preventScroll: true });
  };

  const revealMember = () => {
    const pick = PAMERA_MEMBERS[Math.floor(Math.random() * PAMERA_MEMBERS.length)];
    revealedMember = pick;

    pameraImage.src = pick.image;
    pameraImage.alt = `Pamera ${pick.name}`;

    root.dataset.state = 'revealed';
    card.dataset.phase = 'revealed';
    card.dataset.flip = 'true';
    card.dataset.linkReady = 'true';
    card.setAttribute('aria-label', `Pamera ${pick.name} が応答中。再タップで個別ページへ移動`);
    status.textContent = '接続完了：もう一度カードに触れると、その存在のページへ進みます。';
  };

  const onCardAction = () => {
    if (card.dataset.phase === 'idle') {
      status.textContent = 'まず「Pamera召喚」を押して、接続を開始してください。';
      return;
    }

    if (card.dataset.linkReady === 'true' && revealedMember) {
      location.href = revealedMember.url;
      return;
    }

    revealMember();
  };

  button.addEventListener('click', setReady);
  card.addEventListener('click', onCardAction);
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onCardAction();
  });

  setIdle();
});
