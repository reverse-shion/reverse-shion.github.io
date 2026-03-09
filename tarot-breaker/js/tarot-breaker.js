(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canUseFinePointer = window.matchMedia('(pointer:fine)').matches;

  const starLayer = document.getElementById('tb-stars');
  const heroParticleLayer = document.getElementById('tb-hero-particles');
  const hero = document.querySelector('.tb-hero');
  const reveals = document.querySelectorAll('.reveal');

  // -----------------------------------
  // 1) Floating background stars
  // -----------------------------------
  if (starLayer) {
    const STAR_COUNT = prefersReducedMotion ? 18 : 42;

    for (let i = 0; i < STAR_COUNT; i += 1) {
      const star = document.createElement('span');
      const size = Math.random() * 2.6 + 1;
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
      star.style.background =
        i % 6 === 0 ? '#ffe3a8' :
        i % 4 === 0 ? '#c6a6ff' :
        '#ffffff';
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

      @keyframes tbHeroParticleFloat {
        0% {
          transform: translate3d(0, 0, 0) scale(.8);
          opacity: 0;
        }
        20% {
          opacity: .85;
        }
        100% {
          transform: translate3d(var(--tb-px, 0px), var(--tb-py, -90px), 0) scale(.2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // -----------------------------------
  // 2) Hero particles
  // -----------------------------------
  if (heroParticleLayer && !prefersReducedMotion) {
    const createParticle = () => {
      const p = document.createElement('span');
      const size = Math.random() * 3 + 1;
      const left = 28 + Math.random() * 54;
      const top = 38 + Math.random() * 42;
      const duration = 4 + Math.random() * 5;
      const px = (Math.random() * 50 - 25).toFixed(2);
      const py = (-60 - Math.random() * 60).toFixed(2);

      p.style.position = 'absolute';
      p.style.left = `${left}%`;
      p.style.top = `${top}%`;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.borderRadius = '50%';
      p.style.opacity = '.85';
      p.style.background = Math.random() > 0.55 ? '#ffe3a8' : '#dff6ff';
      p.style.boxShadow = '0 0 12px rgba(143,231,255,.35)';
      p.style.setProperty('--tb-px', `${px}px`);
      p.style.setProperty('--tb-py', `${py}px`);
      p.style.animation = `tbHeroParticleFloat ${duration}s linear forwards`;

      heroParticleLayer.appendChild(p);
      window.setTimeout(() => p.remove(), duration * 1000);
    };

    window.setInterval(() => {
      if (document.hidden) return;
      createParticle();
      if (Math.random() > 0.55) createParticle();
    }, 320);
  }

  // -----------------------------------
  // 3) Reveal animations
  // -----------------------------------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    reveals.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 6, 5) * 70}ms`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // -----------------------------------
  // 4) Hero parallax
  // -----------------------------------
  if (hero && !prefersReducedMotion) {
    const rings = hero.querySelectorAll('.tb-hero-ring');
    const lightPath = hero.querySelector('.tb-hero-lightpath');

    const onScroll = () => {
      const y = window.scrollY;

      rings.forEach((ring, i) => {
        const speed = i === 0 ? 0.03 : 0.018;
        ring.style.marginTop = `${y * speed}px`;
      });

      if (lightPath) {
        lightPath.style.transform = `translateX(-50%) translateY(${y * 0.05}px)`;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // -----------------------------------
  // 5) Cursor crystal trail
  // -----------------------------------
  if (canUseFinePointer && !prefersReducedMotion) {
    let trailTimeout = null;

    window.addEventListener('mousemove', (e) => {
      if (trailTimeout) return;

      trailTimeout = window.setTimeout(() => {
        trailTimeout = null;
      }, 18);

      const dot = document.createElement('i');
      dot.className = 'cursor-star';
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;

      document.body.appendChild(dot);
      window.setTimeout(() => dot.remove(), 700);
    }, { passive: true });
  }

  // -----------------------------------
  // 6) Magnetic buttons
  // -----------------------------------
  if (canUseFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('.tb-btn, .tb-story').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.04}px, ${y * 0.04}px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  // -----------------------------------
  // 7) Smooth page-out transition
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
