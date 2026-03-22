window.TB?.ready(() => {
  const intro = document.querySelector("[data-tb-intro]");
  if (!intro) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    intro.hidden = true;
    intro.setAttribute("aria-hidden", "true");
    document.body.classList.remove("tb-intro-lock");
    return;
  }

  const ACTIVE_CLASS = "is-active";
  const HIDING_CLASS = "is-hiding";
  const LOCK_CLASS = "tb-intro-lock";

  const MIN_VISIBLE_MS = 2400;
  const FADE_OUT_MS = 640;
  const ACTIVATE_DELAY_MS = 60;

  let isClosed = false;
  let isCleaningUp = false;

  let visibleTimer = null;
  let activateTimer = null;
  let cleanupTimer = null;

  const clearTimers = () => {
    if (visibleTimer) {
      window.clearTimeout(visibleTimer);
      visibleTimer = null;
    }
    if (activateTimer) {
      window.clearTimeout(activateTimer);
      activateTimer = null;
    }
    if (cleanupTimer) {
      window.clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }
  };

  const removeCloseListeners = () => {
    intro.removeEventListener("pointerdown", handleEarlyClose);
    intro.removeEventListener("click", handleEarlyClose);
    window.removeEventListener("keydown", handleEarlyClose);
    window.removeEventListener("pagehide", cleanup);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  const cleanup = () => {
    if (isCleaningUp) return;
    isCleaningUp = true;

    clearTimers();

    intro.hidden = true;
    intro.setAttribute("aria-hidden", "true");
    intro.classList.remove(ACTIVE_CLASS, HIDING_CLASS);
    intro.removeAttribute("data-intro-state");
    document.body.classList.remove(LOCK_CLASS);

    removeCloseListeners();
  };

  const finish = () => {
    if (isClosed) return;
    isClosed = true;

    intro.setAttribute("data-intro-state", "closing");
    intro.classList.remove(ACTIVE_CLASS);
    intro.classList.add(HIDING_CLASS);

    cleanupTimer = window.setTimeout(() => {
      cleanup();
    }, FADE_OUT_MS);
  };

  const closeOnce = () => {
    if (isClosed) return;
    finish();
  };

  function handleEarlyClose(event) {
    event.stopPropagation();
    closeOnce();
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      cleanup();
    }
  };

  const addCloseListeners = () => {
    /* window全体ではなく intro 自体だけで受ける */
    intro.addEventListener("pointerdown", handleEarlyClose, { once: true, passive: false });
    intro.addEventListener("click", handleEarlyClose, { once: true, passive: false });

    window.addEventListener("keydown", handleEarlyClose, { once: true });
    window.addEventListener("pagehide", cleanup, { once: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
  };

  intro.hidden = false;
  intro.setAttribute("aria-hidden", "false");
  intro.setAttribute("data-intro-state", "preparing");
  document.body.classList.add(LOCK_CLASS);

  addCloseListeners();

  activateTimer = window.setTimeout(() => {
    requestAnimationFrame(() => {
      intro.setAttribute("data-intro-state", "active");
      intro.classList.add(ACTIVE_CLASS);
    });
  }, ACTIVATE_DELAY_MS);

  visibleTimer = window.setTimeout(() => {
    closeOnce();
  }, MIN_VISIBLE_MS);
});
