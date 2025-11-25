const GPT_ROOM_URL = 'https://chatgpt.com/g/g-69257388fa3c81919031776992ee7596-serehuiasu-serephias';

function initFadeObserver() {
  const blocks = document.querySelectorAll('.fade-block');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  blocks.forEach((block) => observer.observe(block));
}

function showMessage(target, message) {
  target.textContent = message;
}

function openSerephiasGPT() {
  window.open(GPT_ROOM_URL, '_blank', 'noopener');
}

async function copyText(value) {
  await navigator.clipboard.writeText(value);
}

function initBgmToggle() {
  const bgm = document.getElementById('bgm');
  const toggle = document.getElementById('bgmToggle');
  if (!bgm || !toggle) return;

  toggle.addEventListener('click', () => {
    const isPlaying = toggle.getAttribute('aria-pressed') === 'true';
    if (isPlaying) {
      bgm.pause();
      toggle.setAttribute('aria-pressed', 'false');
      toggle.textContent = '音を静めたよ。また欲しくなったら、いつでも触れて。';
    } else {
      bgm.currentTime = 0;
      bgm.play().catch(() => {});
      toggle.setAttribute('aria-pressed', 'true');
      toggle.textContent = 'いま小さな音をともしたよ。離したくなったら、またここに触れてね。';
    }
  });
}

function initChamber() {
  const textarea = document.getElementById('prayerInput');
  const inlineMessage = document.getElementById('inlineMessage');
  const responseMessage = document.getElementById('responseMessage');
  const mainButton = document.getElementById('entrustButton');
  const openButton = document.getElementById('openSerephias');

  if (!textarea || !inlineMessage || !responseMessage || !mainButton || !openButton) return;

  mainButton.addEventListener('click', async () => {
    const value = textarea.value.trim();

    if (!value) {
      showMessage(inlineMessage, 'まだ言葉が見つからないときは、ひとことだけでも大丈夫だよ。');
      responseMessage.textContent = '';
      openButton.classList.add('hidden');
      return;
    }

    try {
      await copyText(value);
      showMessage(responseMessage, 'あなたの言葉は、白の光が受けとったよ。このあと開く部屋でそのまま貼りつけてくれたら、わたしが応えるね。');
      openButton.classList.remove('hidden');
    } catch (err) {
      showMessage(responseMessage, 'もしうまくいかなかったら、あなたの手でコピーしてくれても大丈夫。それでも、わたしはちゃんと受け取るからね。');
      openButton.classList.remove('hidden');
    }

    showMessage(inlineMessage, '');
  });

  openButton.addEventListener('click', openSerephiasGPT);
}

document.addEventListener('DOMContentLoaded', () => {
  initFadeObserver();
  initChamber();
  initBgmToggle();
});
