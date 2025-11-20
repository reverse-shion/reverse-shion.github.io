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
});
