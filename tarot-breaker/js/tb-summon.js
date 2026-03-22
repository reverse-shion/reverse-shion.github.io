TB.ready(() => {
  const root = document.querySelector('[data-summon-root]');
  if (!root) return;

  const cardWrap = root.querySelector('[data-summon-card]');
  const card = cardWrap?.querySelector('.tb-arcana-card');
  const status = root.querySelector('[data-summon-status]');
  const pameraImage = root.querySelector('[data-pamera-image]');

  if (!card || !status || !pameraImage) {
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
  let isNavigating = false;

  const setStatus = (message) => {
    status.textContent = message;
  };

  const setIdle = () => {
    revealedMember = null;
    isNavigating = false;

    root.dataset.state = 'idle';
    card.dataset.phase = 'idle';
    card.dataset.flip = 'false';
    card.dataset.linkReady = 'false';

    card.setAttribute('aria-label', 'Pamera召喚カード');
    setStatus('待機中：カードに触れると、Pameraとの接続が始まります。');
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

    card.setAttribute(
      'aria-label',
      `Pamera ${pick.name} が応答中。もう一度タップで個別ページへ移動`
    );

    setStatus('接続完了：もう一度カードに触れると、その存在のページへ進みます。');
  };

  const navigateToMember = () => {
    if (!revealedMember || isNavigating) return;
    isNavigating = true;
    window.location.href = revealedMember.url;
  };

  const onCardAction = () => {
    const isFlipped = card.dataset.flip === 'true';
    const linkReady = card.dataset.linkReady === 'true';

    if (!isFlipped) {
      revealMember();
      return;
    }

    if (linkReady) {
      navigateToMember();
    }
  };

  card.addEventListener('click', onCardAction);

  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onCardAction();
  });

  setIdle();
});
