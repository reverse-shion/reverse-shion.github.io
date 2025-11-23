// ===============================
// セレフィアスのお告げページ JS
// ===============================

// 星粒生成
(function createStars() {
  const container = document.getElementById("oracleStars");
  if (!container) return;

  const STAR_COUNT = 70;
  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement("div");
    star.className = "oracle-star";
    const size = 1 + Math.random() * 2;
    star.style.width = size + "px";
    star.style.height = size + "px";
    star.style.left = Math.random() * 100 + "%";
    star.style.bottom = Math.random() * 100 + "%";
    star.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
    star.style.opacity = (0.3 + Math.random() * 0.7).toFixed(2);
    container.appendChild(star);
  }
})();

// 文字数カウンタ
(function setupCounter() {
  const textarea = document.getElementById("oracleWorry");
  const counter = document.getElementById("oracleCount");
  if (!textarea || !counter) return;

  const LIMIT = 400;

  const update = () => {
    const len = textarea.value.length;
    counter.textContent = `${len} / ${LIMIT} 文字`;
    if (len > LIMIT) {
      counter.style.color = "#c0392b";
    } else {
      counter.style.color = "var(--ink-soft)";
    }
  };

  textarea.addEventListener("input", update);
  update();
})();

// 「星霊へ送る」ボタン
(function setupSend() {
  const btn = document.getElementById("oracleSendBtn");
  const textarea = document.getElementById("oracleWorry");
  const flash = document.getElementById("oracleFlash");
  if (!btn || !textarea || !flash) return;

  btn.addEventListener("click", () => {
    const text = textarea.value.trim();

    if (!text) {
      alert("悩みを入力してください。");
      return;
    }
    if (text.length > 400) {
      const ok = confirm("400文字を超えていますが、このまま星霊に預けますか？");
      if (!ok) return;
    }

    // ★★ ここをシオンの「セレフィアスGPT」のURLに差し替える ★★
    const gptURL = "https://chatgpt.com/g/g-p-6923276122d88191b02691a8fee2211c";

    // GPT側で「悩み：〜」として扱いやすいように前置き
    const query = encodeURIComponent("悩み：" + text);

    // 転送演出
    flash.style.opacity = "1";

    setTimeout(() => {
      window.location.href = `${gptURL}?q=${query}`;
    }, 900);
  });
})();

// X（Twitter）シェア
function shareToX() {
  const text = encodeURIComponent(
    "星霊の神子セレフィアスに、今の悩みをそっと預ける場所。"
  );
  const url = encodeURIComponent(window.location.href);
  const hashtags = encodeURIComponent("セレフィアスのお告げ,詩韻思想,タロット");
  const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;
  window.open(shareUrl, "_blank");
}

// URLコピー
function copyOracleLink() {
  const msgEl = document.getElementById("oracleCopyMsg");
  if (!navigator.clipboard) {
    // 古いブラウザ用フォールバック
    const dummy = document.createElement("input");
    dummy.value = window.location.href;
    document.body.appendChild(dummy);
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    if (msgEl) msgEl.textContent = "URLをコピーしました。";
    return;
  }

  navigator.clipboard.writeText(window.location.href)
    .then(() => {
      if (msgEl) msgEl.textContent = "URLをコピーしました。";
    })
    .catch(() => {
      if (msgEl) msgEl.textContent = "コピーに失敗しました。お手数ですが手動でお願いします。";
    });
}
