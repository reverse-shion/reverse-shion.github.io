// ===============================
// SEREPHIAS AWAKEN GATE SCRIPT
// ===============================

document.addEventListener('DOMContentLoaded', () => {
  const prayBtn        = document.getElementById('gatePrayButton');
  const audioNote      = document.getElementById('gateAudioNote');
  const poemBox        = document.getElementById('serephiasPoem');
  const poemBody       = document.getElementById('serephiasPoemBody');
  const overlay        = document.getElementById('awakeningOverlay');
  const gateBtn        = document.getElementById('awakeningGateButton');
  const seal           = document.getElementById('serephiasSeal');
  const particlesLayer = document.getElementById('awakenParticles');
  const bgm            = document.getElementById('gateBgm');

  // 星環へ転送する先のURL（必要に応じて変更）
  const NEXT_URL = 'https://reverse-shion.github.io/shion2.html';

  // =========================
  // 1. 星粒子を生成
  // =========================
  const STAR_COUNT = 40;
  for (let i = 0; i < STAR_COUNT; i++) {
    const s = document.createElement('span');
    s.className = 'awaken-particle';
    s.style.setProperty('--i', i);
    particlesLayer.appendChild(s);
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

  // 文字を一文字ずつ描いていく
  function typeText(text, element, speed = 45) {
    return new Promise(resolve => {
      element.textContent = '';
      let i = 0;
      const timer = setInterval(() => {
        element.textContent += text[i];
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
      playPromise.catch(() => { /* 自動再生ブロック時は黙っておく */ });
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

  prayBtn.addEventListener('click', async () => {
    if (hasPrayed) return;
    hasPrayed = true;

    prayBtn.classList.add('is-disabled');
    audioNote.classList.add('is-visible');

    fadeInBgm();
    // 詩エリアを開く
    poemBox.classList.add('is-open');
    await typeText(serephiasPoemText, poemBody, 42);

    // 少し間を置いてから覚醒ゲートを表示
    setTimeout(() => {
      overlay.classList.add('active');
    }, 800);
  });

  // =========================
  // 5. 覚醒ゲートタップ → 神化 → 転送
  // =========================
  let gateOpened = false;

  gateBtn.addEventListener('click', () => {
    if (gateOpened) return;
    gateOpened = true;

    // クリスタル覚醒アニメーション
    gateBtn.classList.add('is-opening');
    // 星光フラッシュ
    overlay.classList.add('is-flash');
    // 紋章の神話級パルス
    seal.classList.add('is-awakening');

    // 少し遅らせて「白 → 黒」への転送演出
    setTimeout(() => {
      overlay.classList.add('to-void');
    }, 700);

    // 最終的に星環ページへ遷移
    setTimeout(() => {
      window.location.href = NEXT_URL;
    }, 2100);
  });
});
