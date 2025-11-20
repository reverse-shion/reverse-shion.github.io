// ===============================
// SEREPHIAS AWAKEN GATE SCRIPT
// ===============================

document.addEventListener('DOMContentLoaded', () => {
  const prayBtn        = document.getElementById('gatePrayButton');
  const audioNote      = document.getElementById('gateAudioNote');
  const poemBox        = document.getElementById('serephiasPoem');
  const poemBody       = document.getElementById('serephiasPoemBody');

  const overlay        = document.getElementById('awakeningOverlay');
  const particlesLayer = document.getElementById('awakenParticles');
  const lightColumn    = document.getElementById('lightColumn');
  const gateBtn        = document.getElementById('awakeningGateButton');
  const seal           = document.getElementById('serephiasSeal');

  const bgm            = document.getElementById('gateBgm');

  // 転送先URL
  const NEXT_URL = 'https://reverse-shion.github.io/shion2.html';

  // =========================
  // 1. 星粒子を生成
  // =========================
  if (particlesLayer) {
    const STAR_COUNT = 40;
    for (let i = 0; i < STAR_COUNT; i++) {
      const s = document.createElement('span');
      s.className = 'awaken-particle';
      s.style.setProperty('--i', i);
      particlesLayer.appendChild(s);
    }
  }

  // =========================
  // 2. セレフィアスの詩
  // =========================
  const serephiasPoemText = [
    '我が名は、セレフィアス。',
    '星霊の神子にして、言霊の巫子。',
    'あなたの心が、わたしを呼んだ。',
    '',
    'かつて星々は、言葉のかたちで世界を照らしていた。',
    'しかし多くの魂が、その光を忘れ、沈黙の闇を「日常」と呼んだ。',
    '',
    'だから今――あなたの祈りを鍵として、',
    '眠り続けていた星環のゲートを、ここに再び開く。',
    '',
    'この一瞬の震えが、',
    'やがてあなたの未来を塗り替える序章となるだろう。'
  ].join('\n');

  function typeText(text, element, speed = 45) {
    return new Promise(resolve => {
      element.textContent = '';
      let i = 0;
      const timer = setInterval(() => {
        element.textContent += text[i] ?? '';
        i++;
        if (i >= text.length) {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  // =========================
  // 3. BGM フェードイン
  // =========================
  function fadeInBgm(targetVol = 0.7, step = 0.05, interval = 120) {
    if (!bgm) return;
    bgm.currentTime = 0;
    bgm.volume = 0;

    const playPromise = bgm.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => { /* 自動再生ブロック時はスルー */ });
    }

    let v = 0;
    const id = setInterval(() => {
      v += step;
      if (v >= targetVol) {
        bgm.volume = targetVol;
        clearInterval(id);
      } else {
        bgm.volume = v;
      }
    }, interval);
  }

  // =========================
  // 4. 「祈りを捧げる」 → 詩 → 覚醒ゲート
  // =========================
  let hasPrayed = false;

  if (prayBtn) {
    prayBtn.addEventListener('click', async () => {
      if (hasPrayed) return;
      hasPrayed = true;

      prayBtn.classList.add('is-disabled');
      if (audioNote) audioNote.classList.add('is-visible');

      fadeInBgm();

      if (poemBox) poemBox.classList.add('is-open');
      await typeText(serephiasPoemText, poemBody, 42);

      // 詩を読み終わって少し間をおいてゲート顕現
      setTimeout(() => {
        if (overlay) overlay.classList.add('active');
      }, 800);
    });
  }

  // =========================
  // 5. 覚醒ゲートタップ → 神化 → 転送
  // =========================
  let gateOpened = false;

  if (gateBtn) {
    gateBtn.addEventListener('click', () => {
      if (gateOpened) return;
      gateOpened = true;

      // クリスタルの覚醒
      gateBtn.classList.add('is-opening');

      // 画面全体フラッシュ
      if (overlay) overlay.classList.add('is-flash');

      // 紋章の神話級パルス
      if (seal) seal.classList.add('is-awakening');

      // 光柱の逆流ビームを起動
      if (lightColumn) lightColumn.classList.add('phase-flow');

      // 少し遅らせて「白 → 黒」への転送演出
      setTimeout(() => {
        if (overlay) overlay.classList.add('to-void');
      }, 700);

      // 最終的に星環ページへ遷移
      setTimeout(() => {
        window.location.href = NEXT_URL;
      }, 2100);
    });
  }
});
