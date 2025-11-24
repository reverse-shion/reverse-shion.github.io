// serephias-oracle.js

(() => {
  const TEXT_LIMIT = 400;
  const SEREPHIAS_GPT_URL = 'https://chatgpt.com/g/g-692352d953b8-xxxxxxxxxxxxxx';
  const modal = document.getElementById('oracleModal');
  const modalMessage = document.getElementById('oracleModalMessage');
  const textarea = document.getElementById('oracleWorry');
  const count = document.getElementById('oracleCount');
  const sendBtn = document.getElementById('oracleSendBtn');
  const shareXBtn = document.getElementById('oracleShareX');
  const shareCopyBtn = document.getElementById('oracleShareCopy');
  const copyMsg = document.getElementById('oracleCopyMsg');
  const starsContainer = document.getElementById('oracleStars');

  // ------------------------------
  // ユーティリティ
  // ------------------------------
  const showModal = (message) => {
    if (!modal || !modalMessage) return;
    modalMessage.textContent = message;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-active');
  };

  const hideModal = () => {
    if (!modal) return;
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.warn('Clipboard copy failed:', error);
      }
    }

    // graceful fallback
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
      star.style.bottom = `${Math.random() * 100}%`;
      star.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
      star.style.opacity = (0.3 + Math.random() * 0.7).toFixed(2);
      fragment.appendChild(star);
    }

    starsContainer.appendChild(fragment);
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
  // 送信ボタン
  // ------------------------------
  const setupSend = () => {
    if (!sendBtn || !textarea) return;

    sendBtn.addEventListener('click', async () => {
      const text = textarea.value.trim();
      if (!text) {
        alert('悩みを入力してください。');
        return;
      }

      if (text.length > TEXT_LIMIT) {
        const ok = confirm('400文字を超えていますが、このまま星霊に預けますか？');
        if (!ok) return;
      }

      const copied = await copyText(text);
      const message = copied
        ? 'あなたの言葉を星霊に預けました。\nこれからセレフィアスのお告げの間を開きます。\nページが開いたら、さきほどの言葉をそのまま貼り付けてください。'
        : '自動コピーに失敗しました。\nメッセージを選択してコピーしてからお進みください。';

      showModal(message);
      await delay(1700);
      window.open(SEREPHIAS_GPT_URL, '_blank', 'noopener');
      await delay(400);
      hideModal();
    });
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
        const copied = await copyText(window.location.href);
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
    setupCounter();
    setupSend();
    setupShare();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
