// ===============================
// SEREPHIAS AWAKEN GATE SCRIPT
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const body           = document.body;

  const prayBtn        = document.getElementById('gatePrayButton');
  const audioNote      = document.getElementById('gateAudioNote');
  const poemBox        = document.getElementById('serephiasPoem');
  const poemBody       = document.getElementById('serephiasPoemBody');

  const overlay        = document.getElementById('awakeningOverlay');
  const particlesLayer = document.getElementById('awakenParticles');
  const lightColumn    = document.getElementById('lightColumn');
  const gateBtn        = document.getElementById('awakeningGateButton');

  const bgm            = document.getElementById('gateBgm');

  // イントロ動画
  const introOverlay   = document.getElementById('gateIntro');
  const introVideo     = document.getElementById('gateIntroVideo');

  // 転送先URL
  const NEXT_URL = 'https://reverse-shion.github.io/shion2.html';

// ===============================
// 0. イントロ動画制御（自動再生時はテキスト非表示）
// ===============================
function skipIntro() {
  if (!introOverlay) return;
  introOverlay.classList.add('is-fadeout');
  setTimeout(() => {
    introOverlay?.remove();
  }, 600);
}

function tryAutoPlay() {
  if (!introVideo || !introOverlay) return;

  const p = introVideo.play();

  if (p && typeof p.then === 'function') {
    p
      .then(() => {
        // ★ 自動再生に成功 → テキストは要らないので非表示モード
        introOverlay.classList.add('auto-playing');

        // 動画が終わったらオーバーレイを閉じる
        introVideo.addEventListener('ended', skipIntro);

        // 念のため 15 秒で強制終了
        setTimeout(() => {
          if (!introOverlay.classList.contains('is-fadeout')) {
            skipIntro();
          }
        }, 15000);
      })
      .catch(() => {
        // ★ 自動再生ブロックされた場合 → テキスト表示したまま、タップで開始
        introOverlay.classList.add('needs-tap');

        introOverlay.addEventListener('click', () => {
          introOverlay.classList.remove('needs-tap');

          introVideo.play().then(() => {
            introVideo.addEventListener('ended', skipIntro);
          });

          // 最悪 15 秒で閉じる
          setTimeout(skipIntro, 15000);
        });
      });
  } else {
    // 古いブラウザ用
    introVideo.addEventListener('ended', skipIntro);
    setTimeout(skipIntro, 15000);
  }
}

tryAutoPlay();

  // =========================
  // 1. 星粒子を生成（ココが消えてた!!）
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
      if (!element) {
        resolve();
        return;
      }
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
      playPromise.catch(() => {
        // 自動再生ブロック時は無視（ユーザー操作なので基本OK）
      });
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
  let hasPrayed  = false;
  let gateOpened = false;

  if (prayBtn) {
    prayBtn.addEventListener('click', async () => {
      if (hasPrayed) return;
      hasPrayed = true;

      // ボタン状態
      prayBtn.classList.add('is-disabled');

      // BGM フェードイン開始
      fadeInBgm();

      // 詩のボックス開いてタイピング
      if (poemBox) poemBox.classList.add('is-open');
      await typeText(serephiasPoemText, poemBody, 42);

      // 少し間をおいてゲート顕現＆スクロールロック
      setTimeout(() => {
        if (overlay) {
          overlay.classList.add('active');
          body.classList.add('gate-active');
        }
      }, 800);
    });
  }

  // =========================
  // 5. 覚醒ゲートタップ → 神化 → 転送
  // =========================
  if (gateBtn && overlay) {
    gateBtn.addEventListener('click', () => {
      if (gateOpened) return;
      gateOpened = true;

      // 次のページへ行く前に必ずBGM停止
      if (bgm) {
        bgm.pause();
        bgm.currentTime = 0;
      }

      // クリスタルの覚醒
      gateBtn.classList.add('is-opening', 'phase-aura', 'phase-seal');

      // 光柱の逆流ビーム
      if (lightColumn) {
        lightColumn.classList.add('phase-flow');
      }

      // 画面全体フラッシュ
      overlay.classList.add('is-flash');

      // 白 → 黒の転送演出
      setTimeout(() => {
        overlay.classList.add('to-void');
      }, 700);

      // 星環ページへ転送
      setTimeout(() => {
        body.classList.remove('gate-active');
        window.location.href = NEXT_URL;
      }, 2100);
    });
  }
});
