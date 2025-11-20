document.addEventListener('DOMContentLoaded', () => {
  const prayBtn        = document.getElementById('gatePrayButton');
  const audioNote      = document.getElementById('gateAudioNote');
  const poemBox        = document.getElementById('serephiasPoem');
  const poemBody       = document.getElementById('serephiasPoemBody');
  const overlay        = document.getElementById('awakeningOverlay');
  const gateBtn        = document.getElementById('awakeningGateButton');
  const seal           = document.getElementById('serephiasSeal');
  const particlesLayer = document.getElementById('awakenParticles');
  const lightColumn    = document.getElementById('lightColumn');
  const bgm            = document.getElementById('gateBgm');

  const NEXT_URL = 'https://reverse-shion.github.io/shion2.html';

  // ===== 星粒子生成（要素があるときだけ） =====
  if (particlesLayer) {
    const STAR_COUNT = 40;
    for (let i = 0; i < STAR_COUNT; i++) {
      const s = document.createElement('span');
      s.className = 'awaken-particle';
      s.style.setProperty('--i', i);
      particlesLayer.appendChild(s);
    }
  }

  // ===== セレフィアスの詩 =====
  const serephiasPoemText = `我が名は、セレフィアス。
星霊の神子にして、言霊の巫子。
あなたの心が、わたしを呼んだ。

かつて星々は、言葉のかたちで世界を照らしていた。
しかし多くの魂が、その光を忘れ、沈黙の闇を「日常」と呼んだ。

だから今――あなたの祈りを鍵として、
眠り続けていた星環のゲートを、ここに再び開く。

この一瞬の震えが、
やがてあなたの未来を塗り替える序章となるだろう。`;

  function typeText(text, element, speed = 45) {
    return new Promise(resolve => {
      if (!element) return resolve();
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

  // ===== 祈り → 詩 → 覚醒オーバーレイ =====
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

      setTimeout(() => {
        if (overlay) overlay.classList.add('active');
      }, 800);
    });
  }

  // ===== 覚醒ゲート → 神化 → 転送 =====
  let gateOpened = false;

  if (gateBtn) {
    gateBtn.addEventListener('click', () => {
      if (gateOpened) return;
      gateOpened = true;

      gateBtn.classList.add('is-opening');

      if (overlay) {
        overlay.classList.add('is-flash');
      }
      if (seal) {
        seal.classList.add('is-awakening');
      }
      if (lightColumn) {
        lightColumn.classList.add('phase-flow');
      }

      setTimeout(() => {
        if (overlay) overlay.classList.add('to-void');
      }, 700);

      setTimeout(() => {
        window.location.href = NEXT_URL;
      }, 2100);
    });
  }
});
