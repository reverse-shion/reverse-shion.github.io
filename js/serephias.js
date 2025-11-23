// ===============================
// セレフィアスの間 スクリプト
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const opening = document.getElementById('sereOpening');
  const mainView = document.getElementById('sereMain');
  const frames = Array.from(document.querySelectorAll('.opening-frame'));
  const particlesLayer = document.getElementById('openingParticles');
  const skipBtn = document.getElementById('skipOpening');
  const shortBox = document.getElementById('shortMessage');
  const longBox = document.getElementById('longMessage');

  let frameIndex = 0;
  const frameDuration = 2000; // 2秒
  let frameTimer = null;
  let openingFinished = false;
  let skipRequested = false;

  // ---- 1. 星屑パーティクル生成 ----
  createParticles(particlesLayer, 40);

  // ---- 2. 4カットのオープニング開始 ----
  startOpeningSequence();

  // ---- 3. スキップボタン ----
  skipBtn.addEventListener('click', () => {
    skipRequested = true;
    finishOpening(true);
  });

  // ---- 4. 深層ゲートの状態設定 ----
  setupDeepGate();

  // ==========================
  // オープニング関連関数
  // ==========================
  function startOpeningSequence() {
    if (frames.length === 0) {
      // 画像がない場合は即本編へ
      finishOpening(false);
      return;
    }
    showFrame(0);
    frameTimer = setTimeout(nextFrame, frameDuration);
  }

  function showFrame(index) {
    frames.forEach((img, i) => {
      if (i === index) {
        img.classList.add('visible');
      } else {
        img.classList.remove('visible');
      }
    });
  }

  function nextFrame() {
    if (skipRequested || openingFinished) return;

    frameIndex++;
    if (frameIndex < frames.length) {
      showFrame(frameIndex);
      frameTimer = setTimeout(nextFrame, frameDuration);
    } else {
      // 最後の全身カットが表示されたあと、テキストへ
      setTimeout(() => {
        startTextSequence();
      }, 1000); // 静止1秒
    }
  }

  function startTextSequence() {
    if (skipRequested || openingFinished) {
      finishOpening(true);
      return;
    }

    const shortLines = [
      '我が名は──セレフィアス。',
      '星霊の神子にして、',
      '言霊の巫子。',
      'あなたの心が、わたしを呼んだ。',
      'この言葉が──運命を変える。'
    ];

    const longLines = [
      'あなたがこの門を越えたということは、',
      'もう “星の記憶” から逃れられないということ。',
      '',
      '光は失われてはいない。',
      'ただ、思い出されるのを待っているだけ。',
      'あなたの星は、まだ沈んでいない。',
      '',
      'そして——',
      'あなたの魂の奥底で眠る“始原の声”も、',
      'いま静かに目を覚まそうとしている。',
      '',
      'さあ——歩もう。',
      '星の言霊（ことだま）が導く場所へ。',
      '',
      'ここは、魂がひらかれる場所。',
      'ようこそ──星霊の間へ。'
    ];

    // ショートメッセージ → ロングメッセージ → 本殿へ
    typeLines(shortLines, shortBox, () => {
      if (skipRequested || openingFinished) {
        finishOpening(true);
        return;
      }
      typeLines(longLines, longBox, () => {
        if (skipRequested || openingFinished) {
          finishOpening(true);
          return;
        }
        setTimeout(() => {
          finishOpening(false);
        }, 800);
      });
    });
  }

  /**
   * 配列のテキストをタイプライタ表示
   * @param {string[]} lines
   * @param {HTMLElement} container
   * @param {Function} onComplete
   */
  function typeLines(lines, container, onComplete) {
    container.innerHTML = '';
    let lineIndex = 0;

    function typeNextLine() {
      if (skipRequested) {
        // スキップ時：残りの行を一気に表示
        for (; lineIndex < lines.length; lineIndex++) {
          const p = document.createElement('p');
          p.textContent = lines[lineIndex];
          container.appendChild(p);
        }
        onComplete && onComplete();
        return;
      }

      if (lineIndex >= lines.length) {
        onComplete && onComplete();
        return;
      }

      const text = lines[lineIndex];
      const p = document.createElement('p');
      container.appendChild(p);
      let charIndex = 0;
      const charDelay = 60; // ms
      const lineGap = 600; // 次の行までの間

      function typeChar() {
        if (skipRequested) {
          p.textContent = text;
          // 残りも全部出す
          lineIndex++;
          for (; lineIndex < lines.length; lineIndex++) {
            const pRest = document.createElement('p');
            pRest.textContent = lines[lineIndex];
            container.appendChild(pRest);
          }
          onComplete && onComplete();
          return;
        }

        if (charIndex <= text.length) {
          p.textContent = text.slice(0, charIndex++);
          setTimeout(typeChar, charDelay);
        } else {
          lineIndex++;
          setTimeout(typeNextLine, lineGap);
        }
      }

      typeChar();
    }

    typeNextLine();
  }

  /**
   * オープニング終了 → 本殿へ遷移
   * @param {boolean} immediate 即座に遷移するか（スキップ時 true）
   */
  function finishOpening(immediate) {
    if (openingFinished) return;
    openingFinished = true;
    clearTimeout(frameTimer);

    if (immediate) {
      opening.classList.add('fade-out');
      setTimeout(() => {
        opening.classList.add('hidden');
        mainView.classList.remove('hidden');
      }, 300);
    } else {
      opening.classList.add('fade-out');
      setTimeout(() => {
        opening.classList.add('hidden');
        mainView.classList.remove('hidden');
      }, 800);
    }
  }

  // ==========================
  // 星屑パーティクル生成
  // ==========================
  function createParticles(container, count) {
    if (!container) return;
    const width = container.offsetWidth || window.innerWidth;
    const height = container.offsetHeight || window.innerHeight;

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      dot.className = 'particle';
      const x = Math.random() * width;
      const delay = Math.random() * 8;
      const duration = 12 + Math.random() * 10;

      dot.style.left = `${x}px`;
      dot.style.animationDuration = `${duration}s`;
      dot.style.animationDelay = `${delay}s`;
      container.appendChild(dot);
    }
  }

  // ==========================
  // 深層星界ゲートの状態設定
  // ==========================
  function setupDeepGate() {
    const gateBtn = document.getElementById('deepGateBtn');
    const gateSub = document.getElementById('deepGateSub');
    if (!gateBtn || !gateSub) return;

    const today = new Date();
    const day = today.getDate();
    const isOpen = day === 1 || day === 15;

    if (isOpen) {
      gateBtn.classList.add('active');
      gateBtn.disabled = false;
      gateSub.textContent = '― 本日、星界への扉は開いています ―';

      gateBtn.addEventListener('click', () => {
        // ★ 深層部ページのURLを差し替えてください
        window.location.href = 'deep-gate.html';
      });
    } else {
      gateBtn.classList.add('disabled');
      gateBtn.disabled = true;
      gateSub.textContent = '本日は閉じています（毎月1日・15日に開門）';
    }
  }
});
