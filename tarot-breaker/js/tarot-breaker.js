(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -----------------------------------
  // 1) Floating star particles
  // -----------------------------------
  const starLayer = document.getElementById('tb-stars');

  if (starLayer) {
    const STAR_COUNT = prefersReducedMotion ? 18 : 42;

    for (let i = 0; i < STAR_COUNT; i += 1) {
      const star = document.createElement('span');
      const size = Math.random() * 2.8 + 1;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = 8 + Math.random() * 8;
      const drift = (Math.random() * 60 - 30).toFixed(2);

      star.style.position = 'absolute';
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${left}%`;
      star.style.top = `${top}%`;
      star.style.borderRadius = '50%';
      star.style.opacity = `${0.18 + Math.random() * 0.72}`;
      star.style.background = i % 6 === 0 ? '#ffe3a8' : (i % 4 === 0 ? '#c6a6ff' : '#ffffff');
      star.style.boxShadow = '0 0 10px rgba(123,231,255,.45)';
      star.style.animation = prefersReducedMotion
        ? 'none'
        : `tbStarFloat ${duration}s linear ${delay}s infinite`;

      star.style.setProperty('--tb-star-drift', `${drift}px`);
      starLayer.appendChild(star);
    }

    const style = document.createElement('style');
    style.textContent = `
      @keyframes tbStarFloat {
        0% {
          transform: translate3d(0, 0, 0) scale(.9);
          opacity: 0;
        }
        15% {
          opacity: .9;
        }
        85% {
          opacity: .7;
        }
        100% {
          transform: translate3d(var(--tb-star-drift, 0px), -80px, 0) scale(.3);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // -----------------------------------
  // 2) Hero sigil parallax
  // -----------------------------------
  const sigil = document.getElementById('tb-hero-sigil');
  if (sigil && !prefersReducedMotion) {
    const onScroll = () => {
      const y = window.scrollY;
      sigil.style.transform = `translateY(${y * 0.18}px) rotate(${y * 0.03}deg)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // -----------------------------------
  // 3) Subtle hero background parallax
  // -----------------------------------
  const hero = document.querySelector('.tb-hero');
  if (hero && !prefersReducedMotion) {
    const onHeroScroll = () => {
      const y = window.scrollY;
      hero.style.backgroundPosition = `center ${y * 0.06}px, center 0`;
    };
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll();
  }

  // -----------------------------------
  // 4) Cursor crystal trail (desktop only)
  // -----------------------------------
  const canUseFinePointer = window.matchMedia('(pointer:fine)').matches;
  if (canUseFinePointer && !prefersReducedMotion) {
    let trailTimeout = null;

    window.addEventListener('mousemove', (e) => {
      if (trailTimeout) return;

      trailTimeout = window.setTimeout(() => {
        trailTimeout = null;
      }, 16);

      const dot = document.createElement('i');
      dot.className = 'cursor-star';
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;

      document.body.appendChild(dot);

      window.setTimeout(() => {
        dot.remove();
      }, 700);
    }, { passive: true });
  }

  // -----------------------------------
  // 5) Smooth page-out transition
  // -----------------------------------
  document.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#')) return;
      if (link.target === '_blank') return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      e.preventDefault();
      document.body.classList.add('page-out');

      window.setTimeout(() => {
        window.location.href = url.href;
      }, 380);
    });
  });
})();
