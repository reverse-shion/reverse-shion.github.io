// ===============================
// SEREPHIAS AWAKEN GATE SCRIPT
// ===============================

document.addEventListener('DOMContentLoaded', () => {
  const prayBtn        = document.getElementById('gatePrayButton');
  const audioNote      = document.getElementById('gateAudioNote');
  const poemBox        = document.getElementById('serephiasPoem');
  const poemBody       = document.getElementById('serephiasPoemBody');

  const overlay        = document.getElementById('awakeningOverlay');   // .awakening-overlay
  const gateBtn        = document.getElementById('awakeningGateButton'); // .awaken-gate
  const seal           = document.getElementById('serephiasSeal');       // 紋章PNGを包む要素
  const particlesLayer = document.getElementById('awakenParticles');     // 星粒子レイヤー

  const bgm            = document.getElementById('gateBgm');

  // 逆流用レーンがある場合だけ拾う（なければ null のままでもOK）
  const reverseLane    = document.querySelector('.reverse-stars');

  // 星環へ転送する先のURL（必要に応じて変更）
  const NEXT_URL = 'https://reverse-shion.github.io/shion2.html';

  // =========================
  // 1. 星粒子を生成
  // =========================
  const STAR_COUNT = 40;
  if (particlesLayer) {
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
      playPromise.catch(() => {});
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

      // 詩エリアを開く
      if (poemBox) poemBox.classList.add('is-open');
      if (poemBody) {
        await typeText(serephiasPoemText, poemBody, 42);
      }

      // 少し間を置いてから覚醒ゲートを表示
      setTimeout(() => {
        if (overlay) overlay.classList.add('active');
      }, 800);
    });
  }

  // =========================
  // 5. 覚醒ゲートタップ → 神化4段階 → 転送
  // =========================
  let gateOpened = false;

  if (gateBtn) {
    gateBtn.addEventListener('click', () => {
      if (gateOpened) return;
      gateOpened = true;

      // ── 段階1：覚醒（ゲート自体が開く）
      gateBtn.classList.add('is-opening');   // .awaken-gate.is-opening

      // 紋章パルス（あれば）
      if (seal) {
        seal.classList.add('is-awakening');  // #serephiasSeal.is-awakening
      }

      // 逆流レーンがある場合：少し遅らせて起動
      if (reverseLane) {
        setTimeout(() => {
          reverseLane.classList.add('is-active'); // CSS側で .reverse-stars.is-active にアニメ付与
        }, 300);
      }

      // ── 段階2：星光フラッシュ
      setTimeout(() => {
        if (overlay) overlay.classList.add('is-flash'); // .awakening-overlay.is-flash
      }, 450);

      // ── 段階3：白 → 黒の世界反転（fadeToVoid）
      setTimeout(() => {
        if (overlay) overlay.classList.add('to-void');  // .awakening-overlay.to-void
      }, 900);

      // ── 段階4：星環ページへ転送
      setTimeout(() => {
        window.location.href = NEXT_URL;
      }, 2000);
    });
  }
});
