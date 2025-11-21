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
  // 0. イントロ動画制御（クロムは即スキップ）
  // ===============================
  if (introOverlay && introVideo) {
    const skipIntro = () => {
      if (introOverlay.classList.contains('is-fadeout')) return;

      introOverlay.classList.add('is-fadeout');
      setTimeout(() => {
        try { introVideo.pause(); } catch (e) {}
        introOverlay.remove();
      }, 500);
    };

    // どこをタップしてもスキップ可能（保険）
    introOverlay.addEventListener('click', skipIntro);

    // 自動再生を試みる
    const p = introVideo.play();

    if (p && typeof p.then === 'function') {
      p
        .then(() => {
          // 自動再生に成功：再生終了か 15秒で閉じる
          introVideo.addEventListener('ended', skipIntro);
          setTimeout(skipIntro, 15000);
        })
        .catch(() => {
          // ★ ここが重要：自動再生ブロックされたら即スキップ
          skipIntro();
        });
    } else {
      // play() が Promise 返さない古い挙動 → 念のためタイマーで閉じる
      introVideo.addEventListener('ended', skipIntro);
      setTimeout(skipIntro, 15000);
    }
  }
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
  // X. 浮遊クリスタル：9個／ランダム生成
  // =========================
  const crystalLayer = document.querySelector('.floating-crystal-layer');

  if (crystalLayer) {
    const MAX_CRYSTALS   = 9;
    const SPAWN_INTERVAL = 4500; // 4.5秒ごとに1つ湧く

    const sizeClasses = ['sz-s', 'sz-m', 'sz-l'];

    function spawnCrystal() {
      if (!crystalLayer) return;

      // 画面内のクリスタル数が多すぎたら一番古いものを削除
      const current = crystalLayer.querySelectorAll('.tiny-crystal');
      if (current.length >= MAX_CRYSTALS) {
        current[0].classList.add('is-fadeout');
        setTimeout(() => current[0].remove(), 3000);
      }

      const el = document.createElement('span');
      el.classList.add('tiny-crystal');

      // 大・中・小ランダム
      const sizeClass = sizeClasses[Math.floor(Math.random() * sizeClasses.length)];
      el.classList.add(sizeClass);

      // 位置：縦はやや中央〜下、横は全域
      const x = 5 + Math.random() * 90;   // 5〜95%
      const y = 18 + Math.random() * 55;  // 18〜73%

      el.style.setProperty('--x', x + '%');
      el.style.setProperty('--y', y + '%');

      // アニメーションの開始位置をずらして“永遠に湧いてる”感じに
      const offset = Math.random() * 18; // 秒
      el.style.animationDelay = `-${offset}s`;

      crystalLayer.appendChild(el);

      // 一定時間が過ぎたらフェードアウトして削除（ゴミ溜まり防止）
      const life = 22000 + Math.random() * 8000; // 22〜30秒生存
      setTimeout(() => {
        el.classList.add('is-fadeout');
        setTimeout(() => el.remove(), 3200);
      }, life);
    }

    // 初期状態として数個まとめて生成
    for (let i = 0; i < MAX_CRYSTALS; i++) {
      setTimeout(spawnCrystal, i * 500);
    }

    // 以後、永続的に生成
    setInterval(spawnCrystal, SPAWN_INTERVAL);
  }

  // =========================
  // 2. セレフィアスの詩
  // =========================
  const serephiasPoemText = [
    '我が名は、セレフィアス。',
    '星霊の神子にして、言霊の巫子。',
    'あなたの心が、わたしを呼んだ。',
    '',
    'かつて星々は、',
    '言葉のかたちで世界を照らしていた。',
    'しかし多くの魂が、その光を忘れ、沈黙の闇を「日常」と呼んだ。',
    '',
    'だから今――あなたの祈りを鍵として、',
    '眠り続けていた星環のゲートを、',
    'ここに再び開く。',
    '',
    'この一瞬の震えが、',
    'やがてあなたの未来を塗り替える',
    '序章となるだろう。'
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
// 5. 覚醒ゲートタップ（即プチュン→暗闇）
// =========================
if (gateBtn && overlay) {
  gateBtn.addEventListener('click', () => {
    if (gateOpened) return;
    gateOpened = true;

    // BGM停止
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
    }

    // 触れた瞬間の“反応”だけ（軽いタップ感）
    gateBtn.classList.add('tapped');

    // ★ 即プチュン開始
    overlay.classList.add('is-flash');

    // ★ プチュン途中で画面全要素を消す（0.15s）
    setTimeout(() => {
      overlay.classList.add('to-void');
    }, 150);

    // ★ 真っ黒のまま次ページへ（0.55s）
    setTimeout(() => {
      document.body.classList.remove('gate-active');
      window.location.href = NEXT_URL;
    }, 550);
  });
}
});
