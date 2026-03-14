window.TB?.ready(() => {
  const intro = document.querySelector('[data-tb-intro]');
  if (!intro) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let done = false;
  let closeTimer = null;
  let cleanupTimer = null;

  const cleanup = () => {
    intro.hidden = true;
    intro.setAttribute('aria-hidden', 'true');
    intro.classList.remove('is-active', 'is-hiding');
    document.body.classList.remove('tb-intro-lock');
  };

  const finish = () => {
    intro.classList.remove('is-active');
    intro.classList.add('is-hiding');

    cleanupTimer = window.setTimeout(() => {
      cleanup();
    }, 560);
  };

  const closeOnce = () => {
    if (done) return;
    done = true;

    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    finish();
  };

  if (reduceMotion) {
    cleanup();
    return;
  }

  document.body.classList.add('tb-intro-lock');
  intro.hidden = false;
  intro.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => {
    intro.classList.add('is-active');
  });

  closeTimer = window.setTimeout(closeOnce, 2850);

  window.addEventListener(
    'pagehide',
    () => {
      if (closeTimer) window.clearTimeout(closeTimer);
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
    },
    { once: true }
  );
});
