(() => {
  const onReady = (callback) => {
    if (window.TB?.ready) {
      window.TB.ready(callback);
      return;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  };

  onReady(() => {
    const menuButton = document.querySelector('[data-portal-menu-button]');
    const nav = document.querySelector('[data-portal-nav]');
    const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
    const revealItems = Array.from(document.querySelectorAll('.reveal'));
    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    const isMobile = () => window.matchMedia('(max-width: 860px)').matches;

    const closeMenu = () => {
      if (!menuButton || !nav) return;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'メニューを開く');
      if (isMobile()) nav.hidden = true;
    };

    const openMenu = () => {
      if (!menuButton || !nav) return;
      menuButton.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-label', 'メニューを閉じる');
      nav.hidden = false;
    };

    if (menuButton && nav) {
      if (isMobile()) nav.hidden = true;

      menuButton.addEventListener('click', () => {
        const expanded = menuButton.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          closeMenu();
        } else {
          openMenu();
        }
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
    }

    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const hash = link.getAttribute('href');
        const target = hash ? document.querySelector(hash) : null;
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', hash);
        if (isMobile()) closeMenu();
      });
    });

    const setActiveNav = () => {
      const offset = 120;
      const current = sections.find((section, index) => {
        const top = section.offsetTop - offset;
        const next = sections[index + 1];
        const bottom = next ? next.offsetTop - offset : document.body.scrollHeight;
        const y = window.scrollY;
        return y >= top && y < bottom;
      });

      navLinks.forEach((link) => {
        const active = current && link.getAttribute('href') === `#${current.id}`;
        link.classList.toggle('is-active', Boolean(active));
      });
    };

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );

    revealItems.forEach((item) => revealObserver.observe(item));

    setActiveNav();
    window.addEventListener('scroll', setActiveNav, { passive: true });
  });
})();
