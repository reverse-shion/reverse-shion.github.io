window.TB?.ready(() => {
  const menuButton = document.querySelector('[data-portal-menu-button]');
  const nav = document.querySelector('[data-portal-nav]');

  if (!menuButton || !nav) return;

  const isMobile = () => window.matchMedia('(max-width: 860px)').matches;

  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'メニューを開く');
    if (isMobile()) {
      nav.hidden = true;
    }
  };

  const openMenu = () => {
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'メニューを閉じる');
    nav.hidden = false;
  };

  const toggleMenu = () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      closeMenu();
      return;
    }
    openMenu();
  };

  if (isMobile()) {
    nav.hidden = true;
  }

  menuButton.addEventListener('click', toggleMenu);

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (isMobile()) closeMenu();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      menuButton.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (isMobile()) {
      const expanded = menuButton.getAttribute('aria-expanded') === 'true';
      nav.hidden = !expanded;
      return;
    }

    nav.hidden = false;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'メニューを開く');
  });
});
