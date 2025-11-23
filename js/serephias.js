// ===============================
// セレフィアスの間 スクリプト
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const body           = document.body;

  const opening        = document.getElementById('sereOpening');
  const mainView       = document.getElementById('sereMain');

  const frames         = Array.from(document.querySelectorAll('.opening-frame'));
  const particlesLayer = document.getElementById('openingParticles');
  const mainParticles  = document.getElementById('mainParticles');

  const skipBtn        = document.getElementById('skipOpening');
  const shortBox       = document.getElementById('shortMessage');
  const longBox        = document.getElementById('longMessage');

  const welcomeText    = document.getElementById('welcomeText');
  const nameAskBlock   = document.getElementById('nameAskBlock');
  const nameAskText    = document.getElementById('nameAskText');
  const nameInput      = document.getElementById('userNameInput');
  const nameSubmitBtn  = document.getElementById('nameSubmitBtn');
  const nameResult     = document.getElementById('nameResult');
  const gateSection    = document.getElementById('gateSection');

  let frameIndex       = 0;
  const frameDuration  = 2000; // 2秒
  let frameTimer       = null;
  let openingFinished  = false;
  let skipRequested    = false;

  // オープニング中はスクロールロック
  body.classList.add('gate-active');

  // =====================================
  // 1. オープニング：パーティクル生成
  // =====================================
  createParticles(particlesLayer, 50, 'opening');

  // =====================================
  // 2. 4カットのオープニング開始
  // =====================================
  startOpeningSequence();

  // =====================================
  // 3. スキップボタン
  // =====================================
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      skipRequested = true;
      finishOpening(true);
    });
  }

  // =====================================
  // 4. 深層星界ゲート状態設定
  // =====================================
  setupDeepGate();

  // =====================================
  // 5. 名前儀式（ローカルストレージ）
  // =====================================
  const STORAGE_KEY = 'serephiasUserName';
  const storedName = window.localStorage.getItem(STORAGE_KEY);

  if (storedName && storedName.trim() !== '') {
    // 既に名前がある場合：ウェルカム＋ボタン表示
    showWelcomeAndGates(storedName.trim());
  } else {
    // 初回：名前入力受付
    setupNameInput();
  }

  // ==========================
  // オープニング関連関数
  // ==========================
  function startOpeningSequence() {
    if (!frames.length) {
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

    // テキストフェーズ：画像を薄くする
    body.classList.add('opening-text-phase');

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
    if (!container) {
      onComplete && onComplete();
      return;
    }

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
      const charDelay = 60; // 文字間
      const lineGap = 600; // 行間の“間”

      function typeChar() {
        if (skipRequested) {
          p.textContent = text;
          // 残り行を全て表示
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
   * オープニング終了 → 白い本殿へ遷移
   * @param {boolean} immediate 即座に遷移するか（スキップ時 true）
   */
  function finishOpening(immediate) {
    if (openingFinished) return;
    openingFinished = true;
    clearTimeout(frameTimer);

    const fadeDuration = immediate ? 300 : 900;

    opening.classList.add('fade-out');

    setTimeout(() => {
      opening.classList.add('hidden');
      body.classList.remove('gate-active'); // スクロール解除
      mainView.classList.remove('hidden');

      // 白背景側のパーティクル生成
      createParticles(mainParticles, 60, 'main');
    }, fadeDuration);
  }

  // ==========================
  // 星屑パーティクル生成
  // mode: 'opening' | 'main'
  // ==========================
  function createParticles(container, count, mode) {
    if (!container) return;
    const width = container.offsetWidth || window.innerWidth;
    const height = container.offsetHeight || window.innerHeight;

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      dot.className = 'particle';

      const x = Math.random() * width;
      const delay = Math.random() * 10;
      const duration = 14 + Math.random() * 12;

      dot.style.left = `${x}px`;
      dot.style.animationDuration = `${duration}s`;
      dot.style.animationDelay = `${delay}s`;

      if (mode === 'opening') {
        // 黒背景用：金〜紫
        dot.style.background =
          'radial-gradient(circle, rgba(255, 229, 180, 1) 0, rgba(255, 229, 180, 0) 65%)';
      } else {
        // 白背景用：蒼・紫・黒のグラデーション風
        const choice = Math.random();
        if (choice < 0.33) {
          dot.style.background =
            'radial-gradient(circle, rgba(120, 154, 255, 0.95) 0, rgba(120, 154, 255, 0) 65%)';
        } else if (choice < 0.66) {
          dot.style.background =
            'radial-gradient(circle, rgba(186, 142, 255, 0.95) 0, rgba(186, 142, 255, 0) 65%)';
        } else {
          dot.style.background =
            'radial-gradient(circle, rgba(40, 24, 60, 0.85) 0, rgba(40, 24, 60, 0) 65%)';
        }
      }

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

  // ==========================
  // 名前入力セットアップ
  // ==========================
  function setupNameInput() {
    if (!nameInput || !nameSubmitBtn || !nameAskBlock) return;

    nameSubmitBtn.addEventListener('click', handleNameSubmit);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleNameSubmit();
      }
    });
  }

  function handleNameSubmit() {
    if (!nameInput) return;
    const raw = nameInput.value || '';
    const name = raw.trim();

    if (!name) {
      // 空の場合は軽くバイブさせる
      nameInput.classList.add('input-error');
      setTimeout(() => nameInput.classList.remove('input-error'), 300);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, name);

    if (nameResult) {
      nameResult.textContent = `${name}…… その響き、確かに受け取りました。`;
    }

    // 少し間を置いてボタン群を出す
    setTimeout(() => {
      showWelcomeAndGates(name);
    }, 900);
  }

  function showWelcomeAndGates(name) {
    if (welcomeText) {
      welcomeText.textContent = `${name}、<br>今日もここに<br>来てくれたのですね。`;
      welcomeText.classList.remove('hidden');
    }

    if (nameAskBlock) {
      nameAskBlock.classList.add('hidden');
    }

    if (gateSection) {
      gateSection.classList.remove('hidden');
    }
  }
});
