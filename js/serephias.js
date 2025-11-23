// ===============================
// セレフィアスの間 スクリプト
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const opening      = document.getElementById('sereOpening');
  const mainView     = document.getElementById('sereMain');
  const frames       = Array.from(document.querySelectorAll('.opening-frame'));
  const particles    = document.getElementById('openingParticles');
  const skipBtn      = document.getElementById('skipOpening');
  const shortBox     = document.getElementById('shortMessage');
  const longBox      = document.getElementById('longMessage');
  const imageLayer   = document.querySelector('.opening-image-layer');
  const textWrap     = document.querySelector('.opening-text-wrap');

  let frameIndex     = 0;
  const frameDuration = 2000; // 2秒
  let frameTimer     = null;
  let openingFinished = false;
  let skipRequested   = false;

  // 星屑生成
  createParticles(particles, 40);

  // オープニング開始
  startOpeningSequence();

  // スキップボタン
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      skipRequested = true;
      finishOpening(true);
    });
  }

  // 深層ゲート状態設定
  setupDeepGate();

  // ==========================
  // オープニング：4カット
  // ==========================
  function startOpeningSequence() {
    if (!frames.length) {
      finishOpening(false);
      return;
    }
    showFrame(0);
    frameTimer = setTimeout(nextFrame, frameDuration);
  }

  function showFrame(index) {
    frames.forEach((img, i) => {
      img.classList.toggle('visible', i === index);
    });
  }

  function nextFrame() {
    if (skipRequested || openingFinished) return;

    frameIndex++;
    if (frameIndex < frames.length) {
      showFrame(frameIndex);
      frameTimer = setTimeout(nextFrame, frameDuration);
    } else {
      // 最後の全身のあと、少し“間”をおいてテキストへ
      setTimeout(startTextSequence, 1000);
    }
  }

  // ==========================
  // テキスト演出
  // ==========================
  function startTextSequence() {
    if (skipRequested || openingFinished) {
      finishOpening(true);
      return;
    }

    // ★ここで画像を淡く＆テキストボックスをフェードイン
    if (imageLayer) {
      imageLayer.classList.add('dimmed');
    }
    if (textWrap) {
      textWrap.classList.add('visible');
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
        setTimeout(() => finishOpening(false), 800);
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
    if (!container) {
      onComplete && onComplete();
      return;
    }

    container.innerHTML = '';
    let lineIndex = 0;

    function typeNextLine() {
      if (skipRequested) {
        // スキップ時：残り全部を一気に出す
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
      const charDelay = 60;  // 文字間
      const lineGap   = 600; // 行間

      function typeChar() {
        if (skipRequested) {
          p.textContent = text;
          lineIndex++;
          // 残りを全部一気に
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

    opening.classList.add('fade-out');

    const delay = immediate ? 300 : 800;
    setTimeout(() => {
      opening.classList.add('hidden');
      mainView.classList.remove('hidden');
      // 本殿はスクロールできる（CSS側で overflow-y:auto）
    }, delay);
  }

  // ==========================
  // 星屑パーティクル生成
  // ==========================
  function createParticles(container, count) {
    if (!container) return;
    const width = container.offsetWidth || window.innerWidth;

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

    const today  = new Date();
    const day    = today.getDate();
    const isOpen = day === 1 || day === 15;

    if (isOpen) {
      gateBtn.classList.add('active');
      gateBtn.disabled = false;
      gateSub.textContent = '― 本日、星界への扉は開いています ―';

      gateBtn.addEventListener('click', () => {
        // 深層部ページのURL
        window.location.href = 'deep-gate.html';
      });
    } else {
      gateBtn.classList.add('disabled');
      gateBtn.disabled = true;
      gateSub.textContent = '本日は閉じています（毎月1日・15日に開門）';
    }
  }
});
