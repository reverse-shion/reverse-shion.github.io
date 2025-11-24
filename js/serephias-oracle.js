// serephias-oracle.js

(() => {
  const TEXT_LIMIT = 400;
  const SEREPHIAS_GPT_URL =
    'https://chatgpt.com/g/g-692352d953b08191b0b46a7358a37456-serehuiasu-serephias';
  const OVERLAY_DURATION = 4500;

  const textarea = document.getElementById('oracleWorry');
  const count = document.getElementById('oracleCount');
  const sendBtn = document.getElementById('oracleSendBtn');
  const shareXBtn = document.getElementById('oracleShareX');
  const shareCopyBtn = document.getElementById('oracleShareCopy');
  const copyMsg = document.getElementById('oracleCopyMsg');
  const starsContainer = document.getElementById('oracleStars');
  const overlay = document.getElementById('oracleOverlay');
  const overlaySparkles = document.getElementById('oracleOverlaySparkles');
  let isSending = false;

  // ------------------------------
  // クリップボードコピー処理
  // ------------------------------
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const copyWorryText = async (text) => {
    if (!navigator.clipboard?.writeText) {
      console.warn('Clipboard API is not available.');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.warn('navigator.clipboard copy failed:', error);
    }
  };

  // シェア用の汎用コピー（既存挙動を崩さないために別途用意）
  const copyGenericText = async (text) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.warn('Clipboard copy failed:', error);
      }
    }

    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'absolute';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.select();
    const succeeded = document.execCommand('copy');
    document.body.removeChild(temp);
    return succeeded;
  };

  // ------------------------------
  // 星空生成
  // ------------------------------
  const createStars = () => {
    if (!starsContainer) return;
    const STAR_COUNT = 70;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < STAR_COUNT; i++) {
      const star = document.createElement('div');
      star.className = 'oracle-star';
      const size = 1 + Math.random() * 2;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 25}%`;
      star.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`;
      star.style.animationDuration = `${(6 + Math.random() * 5).toFixed(2)}s`;
      star.style.opacity = (0.3 + Math.random() * 0.7).toFixed(2);
      fragment.appendChild(star);
    }

    starsContainer.appendChild(fragment);
  };

  const createOverlaySparkles = () => {
    if (!overlaySparkles) return;
    const COUNT = 45;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < COUNT; i++) {
      const sparkle = document.createElement('span');
      sparkle.className = 'oracle-overlay-sparkle';
      sparkle.style.left = `${Math.random() * 100}%`;
      sparkle.style.top = `${Math.random() * 30}%`;
      sparkle.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`;
      sparkle.style.animationDuration = `${(5 + Math.random() * 4).toFixed(2)}s`;
      sparkle.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
      fragment.appendChild(sparkle);
    }

    overlaySparkles.appendChild(fragment);
  };

  // ------------------------------
  // 文字数カウント
  // ------------------------------
  const setupCounter = () => {
    if (!textarea || !count) return;

    const update = () => {
      const length = textarea.value.length;
      count.textContent = `${length} / ${TEXT_LIMIT} 文字`;
      count.style.color = length > TEXT_LIMIT ? '#c0392b' : 'var(--ink-soft)';
    };

    textarea.addEventListener('input', update);
    update();
  };

  // ------------------------------
  // GPTリンクを開く
  const openSerephiasGPT = () => {
    window.open(SEREPHIAS_GPT_URL, '_blank', 'noopener');
  };

  // 送信ボタン
  // ------------------------------
  const handleSend = async () => {
    if (!textarea || isSending) return;

    const text = textarea.value.trim();
    if (!text) {
      alert('悩みを入力してください。');
      return;
    }

    if (text.length > TEXT_LIMIT) {
      const ok = confirm('400文字を超えていますが、このまま星霊に預けますか？');
      if (!ok) return;
    }

    isSending = true;
    sendBtn?.setAttribute('disabled', 'disabled');

    await copyWorryText(text);
    if (overlay) {
      overlay.classList.add('is-active');
      overlay.setAttribute('aria-hidden', 'false');
    }

    await delay(OVERLAY_DURATION);
    openSerephiasGPT();
    setTimeout(() => {
      if (overlay) {
        overlay.classList.remove('is-active');
        overlay.setAttribute('aria-hidden', 'true');
      }
      sendBtn?.removeAttribute('disabled');
      isSending = false;
    }, 800);
  };

  const setupSend = () => {
    if (!sendBtn) return;
    sendBtn.addEventListener('click', handleSend);
  };

  // ------------------------------
  // シェア周り
  // ------------------------------
  const setupShare = () => {
    if (shareXBtn) {
      shareXBtn.addEventListener('click', () => {
        const text = encodeURIComponent('星霊の神子セレフィアスに、今の悩みをそっと預ける場所。');
        const url = encodeURIComponent(window.location.href);
        const hashtags = encodeURIComponent('セレフィアスのお告げ,詩韻思想,タロット');
        const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;
        window.open(shareUrl, '_blank');
      });
    }

    if (shareCopyBtn && copyMsg) {
      shareCopyBtn.addEventListener('click', async () => {
        const copied = await copyGenericText(window.location.href);
        copyMsg.textContent = copied
          ? 'URLをコピーしました。'
          : 'コピーに失敗しました。お手数ですが手動でお願いします。';
      });
    }
  };

  // ------------------------------
  // 初期化
  // ------------------------------
  const init = () => {
    createStars();
    createOverlaySparkles();
    setupCounter();
    setupSend();
    setupShare();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
