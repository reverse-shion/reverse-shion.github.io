document.addEventListener('DOMContentLoaded', () => {
  const overlay         = document.getElementById('awakeningOverlay');
  const crystalWrap     = document.querySelector('.crystal-wrap');
  const awakenGate      = document.getElementById('awakeningGate');
  const lightColumn     = document.getElementById('lightColumn');
  const resonateBtn     = document.getElementById('resonateButton');
  const bgm             = document.getElementById('gateBgm');
  const NEXT_URL        = 'https://reverse-shion.github.io/shion2.html';

  let gateOpened = false;

  // 共鳴ボタンクリック → 覚醒 → 完全同期フェードアウト
  resonateBtn.addEventListener('click', () => {
    if (gateOpened) return;
    gateOpened = true;

    // 覚醒演出
    awakenGate.classList.add('is-opening');
    awakenGate.classList.add('phase-aura');
    setTimeout(() => awakenGate.classList.remove('phase-aura'), 900);

    setTimeout(() => {
      awakenGate.classList.add('phase-seal');
      setTimeout(() => awakenGate.classList.remove('phase-seal'), 900);
    }, 250);

    lightColumn.classList.add('phase-flow');
    overlay.classList.add('is-flash');

    // ←ここが大事！親コンテナだけをフェードアウト
    setTimeout(() => {
      crystalWrap.classList.remove('is-visible');
      crystalWrap.classList.add('is-hidden');
    }, 700);

    // 暗転 → 転送
    setTimeout(() => overlay.classList.add('to-void'), 700);
    setTimeout(() => window.location.href = NEXT_URL, 2100);
  });

  // （以下、祈りボタンや詩の演出など元のコードはそのまま残す）
  // ...（省略：元の長いJS部分をここにそのまま貼り付け）
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
    // 2. セレフィアスの詩（ページ内）
    // =========================
    const pagePoemText = [
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
    ].join('\\n');

    // オーバーレイ用の詩（少し短めの祈詩）
    const overlayPoemText = [
      '星に触れし心よ――',
      'その痛みは、光の欠片。',
      'その祈りは、未来の種子。',
      '',
      'わたしは聞いている。',
      'あなたの共鳴を。'
    ].join('\\n');

    function typeText(text, element, speed = 45) {
      return new Promise(resolve => {
        if (!element) { resolve(); return; }
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
    // 3. BGMフェードイン
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
    // 4. FLOW
    // 祈りボタン → ページ詩 → オーバーレイ詩
    // =========================
    let hasPrayed  = false;
    let gateOpened = false;

    if (prayBtn) {
      prayBtn.addEventListener('click', async () => {
        if (hasPrayed) return;
        hasPrayed = true;

        prayBtn.classList.add('is-disabled');
        if (audioNote) audioNote.classList.add('is-visible');

        fadeInBgm();

        if (poemBox) poemBox.classList.add('is-open');
        await typeText(pagePoemText, poemBody, 42);

        // ページ詩の後、オーバーレイ演出へ
        setTimeout(async () => {
          overlay.classList.add('active');
          body.classList.add('gate-active');

          // オーバーレイ詩を表示
          overlayPoem.classList.add('is-visible');
          await typeText(overlayPoemText, overlayPoem, 46);

          // 詩のあと星環メッセージ
          setTimeout(() => {
            overlayMessage.classList.add('is-visible');
          }, 500);

          // さらに遅らせてクリスタル＋共鳴ボタン出現
          setTimeout(() => {
            gateVisual.classList.add('is-visible');
          }, 1400);

        }, 800);
      });
    }

    // =========================
    // 5. 共鳴ボタン → 覚醒 → 転送
    // =========================
    if (resonateBtn) {
      resonateBtn.addEventListener('click', () => {
        if (gateOpened) return;
        gateOpened = true;

        // クリスタル覚醒演出
        awakenGate.classList.add('is-opening');
        awakenGate.classList.add('phase-aura');
        setTimeout(() => {
          awakenGate.classList.remove('phase-aura');
        }, 900);

        setTimeout(() => {
          awakenGate.classList.add('phase-seal');
          setTimeout(() => {
            awakenGate.classList.remove('phase-seal');
          }, 900);
        }, 250);

        // 逆流星レーン & フラッシュ
        if (lightColumn) {
          lightColumn.classList.add('phase-flow');
        }
        overlay.classList.add('is-flash');

        // 少し遅らせて暗転
        setTimeout(() => {
          overlay.classList.add('to-void');
        }, 700);

        // 最後に星環ページへ
        setTimeout(() => {
          window.location.href = NEXT_URL;
        }, 2100);
      });
    }
  });
  
