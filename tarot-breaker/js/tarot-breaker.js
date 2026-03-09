(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer:fine)").matches;

  const starLayer = document.getElementById("tb-stars");
  const heroParticles = document.getElementById("tb-hero-particles");
  const hero = document.querySelector(".tb-hero");
  const reveals = document.querySelectorAll(".reveal");

  const summonCanvas = document.getElementById("summonCanvas");
  const summonBtn = document.querySelector(".summon-btn");
  const summonCard = document.getElementById("summonCard");
  const summonFront = document.querySelector(".tb-summon-card-front");
  const arcanaName = document.getElementById("arcanaName");
  const arcanaSubtitle = document.getElementById("arcanaSubtitle");
  const summonCircle = document.getElementById("summonCircle");

  const ARCANA_POOL = [
    {
      name: "THE FOOL",
      subtitle: "始まりの一歩、まだ名もなき可能性。",
      image: "/img/arcana/fool.webp"
    },
    {
      name: "THE MAGICIAN",
      subtitle: "意志は、現実へ触れるための最初の術。",
      image: "/img/arcana/magician.webp"
    },
    {
      name: "THE HIGH PRIESTESS",
      subtitle: "沈黙の奥に、まだ言葉にならない真実がある。",
      image: "/img/arcana/high-priestess.webp"
    },
    {
      name: "THE STAR",
      subtitle: "失われた光は、祈りのように戻ってくる。",
      image: "/img/arcana/star.webp"
    },
    {
      name: "THE MOON",
      subtitle: "揺らぎの夜を越えて、心の深層へ。",
      image: "/img/arcana/moon.webp"
    },
    {
      name: "JUDGEMENT",
      subtitle: "呼び戻されるのは、選び直すための魂。",
      image: "/img/arcana/judgement.webp"
    }
  ];

  function injectKeyframes() {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes tbStarFloat {
        0% { transform: translate3d(0, 0, 0) scale(.9); opacity: 0; }
        15% { opacity: .9; }
        85% { opacity: .7; }
        100% { transform: translate3d(var(--tb-star-drift, 0px), -80px, 0) scale(.3); opacity: 0; }
      }

      @keyframes tbHeroParticleFloat {
        0% { transform: translate3d(0, 0, 0) scale(.8); opacity: 0; }
        20% { opacity: .85; }
        100% { transform: translate3d(var(--tb-px, 0px), var(--tb-py, -90px), 0) scale(.2); opacity: 0; }
      }

      @keyframes tbSummonPulse {
        0% { transform: translate(-50%, -50%) scale(.94); opacity: .16; }
        50% { transform: translate(-50%, -50%) scale(1.03); opacity: .62; }
        100% { transform: translate(-50%, -50%) scale(1.08); opacity: .24; }
      }
    `;
    document.head.appendChild(style);
  }

  injectKeyframes();

  function createStarfield() {
    if (!starLayer) return;

    const count = reduceMotion ? 18 : 48;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const star = document.createElement("span");
      const size = Math.random() * 2.6 + 1;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const drift = (Math.random() * 60 - 30).toFixed(2);
      const duration = 8 + Math.random() * 10;
      const delay = Math.random() * 10;

      star.style.cssText = `
        position:absolute;
        width:${size}px;
        height:${size}px;
        left:${x}%;
        top:${y}%;
        border-radius:50%;
        opacity:${0.25 + Math.random() * 0.65};
        background:${i % 6 === 0 ? "#ffe3a8" : i % 4 === 0 ? "#c6a6ff" : "#ffffff"};
        box-shadow:0 0 12px rgba(123,231,255,.45);
        animation:${reduceMotion ? "none" : `tbStarFloat ${duration}s linear ${delay}s infinite`};
      `;

      star.style.setProperty("--tb-star-drift", `${drift}px`);
      frag.appendChild(star);
    }

    starLayer.appendChild(frag);
  }

  createStarfield();

  function startHeroParticles() {
    if (!heroParticles || reduceMotion) return;

    function spawn() {
      const p = document.createElement("span");
      const size = Math.random() * 3 + 1;
      const duration = 4 + Math.random() * 5;
      const px = (Math.random() * 60 - 30).toFixed(2);
      const py = (-60 - Math.random() * 80).toFixed(2);

      p.style.cssText = `
        position:absolute;
        left:${30 + Math.random() * 50}%;
        top:${40 + Math.random() * 40}%;
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${Math.random() > 0.5 ? "#ffe3a8" : "#dff6ff"};
        box-shadow:0 0 14px rgba(143,231,255,.45);
        animation:tbHeroParticleFloat ${duration}s linear forwards;
      `;
      p.style.setProperty("--tb-px", `${px}px`);
      p.style.setProperty("--tb-py", `${py}px`);

      heroParticles.appendChild(p);
      setTimeout(() => p.remove(), duration * 1000);
    }

    setInterval(() => {
      if (document.hidden) return;
      spawn();
      if (Math.random() > 0.6) spawn();
    }, 360);
  }

  startHeroParticles();

  function initReveal() {
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px"
    });

    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 6, 5) * 70}ms`;
      io.observe(el);
    });
  }

  initReveal();

  function initHeroParallax() {
    if (!hero || reduceMotion) return;

    const rings = hero.querySelectorAll(".tb-hero-ring");
    const light = hero.querySelector(".tb-hero-lightpath");

    let ticking = false;

    function update() {
      const y = window.scrollY;

      rings.forEach((ring, i) => {
        const speed = i === 0 ? 0.03 : 0.018;
        ring.style.transform = `translate(-50%, calc(-50% + ${y * speed}px))`;
      });

      if (light) {
        light.style.transform = `translateX(-50%) translateY(${y * 0.06}px)`;
      }

      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  initHeroParallax();

  function initCursorTrail() {
    if (!finePointer || reduceMotion) return;

    let throttle = null;

    window.addEventListener("mousemove", (e) => {
      if (throttle) return;

      throttle = setTimeout(() => {
        throttle = null;
      }, 18);

      const star = document.createElement("i");
      star.className = "cursor-star";
      star.style.left = `${e.clientX}px`;
      star.style.top = `${e.clientY}px`;

      document.body.appendChild(star);
      setTimeout(() => star.remove(), 700);
    }, { passive: true });
  }

  initCursorTrail();

  function initMagnet() {
    if (!finePointer || reduceMotion) return;

    document.querySelectorAll(".tb-btn, .tb-story").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  initMagnet();

  function initPageTransition() {
    document.querySelectorAll("a[href]").forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href) return;
        if (href.startsWith("#")) return;
        if (link.target === "_blank") return;
        if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

        const url = new URL(href, location.href);
        if (url.origin !== location.origin) return;

        e.preventDefault();
        document.body.classList.add("page-out");

        setTimeout(() => {
          location.href = url.href;
        }, 380);
      });
    });
  }

  initPageTransition();

  function initSummonSystem() {
    if (!summonCanvas || !summonBtn || !summonCard || !summonFront || !arcanaName || !arcanaSubtitle) return;

    const ctx = summonCanvas.getContext("2d");
    let particles = [];
    let rafId = null;
    let running = false;

    function resizeCanvas() {
      const rect = summonCanvas.getBoundingClientRect();
      summonCanvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio));
      summonCanvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio));
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function createParticles(centerX, centerY) {
      particles = [];

      const count = reduceMotion ? 40 : 120;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 120 + Math.random() * 180;

        particles.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          tx: centerX,
          ty: centerY,
          size: Math.random() * 2.2 + 1,
          speed: 0.018 + Math.random() * 0.02,
          life: 1
        });
      }
    }

    function renderParticles() {
      const rect = summonCanvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      let alive = 0;

      for (const p of particles) {
        p.x += (p.tx - p.x) * p.speed;
        p.y += (p.ty - p.y) * p.speed;
        p.life -= 0.008;

        if (p.life > 0.02) {
          alive += 1;
          ctx.beginPath();
          ctx.fillStyle = `rgba(220,240,255,${Math.max(0, p.life)})`;
          ctx.shadowColor = "rgba(143,231,255,.45)";
          ctx.shadowBlur = 12;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;

      if (alive > 0 && running) {
        rafId = requestAnimationFrame(renderParticles);
      } else {
        running = false;
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    }

    function resetSummonState() {
      summonCard.classList.remove("is-visible", "is-flipped");
      arcanaName.classList.remove("is-visible");
      arcanaSubtitle.classList.remove("is-visible");
      if (summonCircle) summonCircle.classList.remove("is-active");

      arcanaName.textContent = "";
      arcanaSubtitle.textContent = "";

      if (rafId) cancelAnimationFrame(rafId);
      running = false;
      particles = [];
      const rect = summonCanvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }

    function summon() {
      resetSummonState();

      const picked = ARCANA_POOL[Math.floor(Math.random() * ARCANA_POOL.length)];
      summonFront.style.backgroundImage = `url("${picked.image}")`;
      arcanaName.textContent = picked.name;
      arcanaSubtitle.textContent = picked.subtitle;

      if (summonCircle) {
        summonCircle.classList.add("is-active");
        summonCircle.style.animation = reduceMotion ? "none" : "tbSummonPulse 1.8s ease-out 1";
      }

      const rect = summonCanvas.getBoundingClientRect();
      createParticles(rect.width / 2, rect.height * 0.48);

      running = true;
      renderParticles();

      setTimeout(() => {
        summonCard.classList.add("is-visible");
      }, 180);

      setTimeout(() => {
        summonCard.classList.add("is-flipped");
      }, 980);

      setTimeout(() => {
        arcanaName.classList.add("is-visible");
      }, 1600);

      setTimeout(() => {
        arcanaSubtitle.classList.add("is-visible");
      }, 1780);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });
    summonBtn.addEventListener("click", summon);
  }

  initSummonSystem();
})();
