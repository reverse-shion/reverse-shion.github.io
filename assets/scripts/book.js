// ===============================
// Re:verse Shion — book.js
// 詩／経典／註解 切替 ＋ 行フェード演出
// ===============================
document.addEventListener('DOMContentLoaded', () => {

  // ===== Mode Switching =====
  const switcher = document.querySelector('.mode-switch');
  if (switcher) {
    const buttons = switcher.querySelectorAll('button');
    const sections = document.querySelectorAll('.mode');
    const storageKey = 'bookMode';

    const setMode = (mode) => {
      sections.forEach(s => s.hidden = !s.classList.contains('mode--' + mode));
      buttons.forEach(b => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
      localStorage.setItem(storageKey, mode);
    };

    const saved = localStorage.getItem(storageKey);
    setMode(saved || 'poem');

    switcher.addEventListener('click', e => {
      if (e.target.matches('button[data-mode]')) {
        setMode(e.target.dataset.mode);
      }
    });
  }

  // ===== Line Fade Animation =====
  const lines = document.querySelectorAll('.line');
  lines.forEach((line, i) => {
    line.style.opacity = 0;
    line.style.animation = `lineFade 1.4s ease forwards ${i * 1.3}s`;
  });
});
