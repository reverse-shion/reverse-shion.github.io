window.TB?.ready(() => {
  const intro = document.querySelector('[data-tb-intro]');
  if (!intro) return;

  const skip = intro.querySelector('[data-tb-intro-skip]');
  const key = 'tb-intro-seen-v1';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finish = () => {
    intro.classList.add('is-hiding');
    setTimeout(() => {
      intro.hidden = true;
      intro.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('tb-intro-lock');
    }, 420);
  };

  if (localStorage.getItem(key) === '1' || reduceMotion) {
    intro.hidden = true;
    intro.setAttribute('aria-hidden', 'true');
    return;
  }

  document.body.classList.add('tb-intro-lock');
  intro.hidden = false;
  intro.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => intro.classList.add('is-active'));

  let done = false;
  const closeOnce = () => {
    if (done) return;
    done = true;
    try { localStorage.setItem(key, '1'); } catch {}
    finish();
  };

  skip?.addEventListener('click', closeOnce);
  setTimeout(closeOnce, 2600);
});
