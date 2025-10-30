(() => {
  const headerEl = document.querySelector('header[role="banner"]');
  if (!headerEl) return;

  const revealAt = 8;
  const compactAt = 88;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    if (y > revealAt) headerEl.classList.add('is-visible');
    else headerEl.classList.remove('is-visible');
    if (y > compactAt) headerEl.classList.add('header--compact');
    else headerEl.classList.remove('header--compact');
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking){ window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive:true });
  onScroll();

  // 現在地ハイライト
  const links = {
    trinity: document.querySelector('.nav a[href="#trinity"]'),
    writings: document.querySelector('.nav a[href="#writings"]'),
    join: document.querySelector('.nav a[href="#join"]'),
  };
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach((e)=>{
      if (e.isIntersecting){
        Object.values(links).forEach(a=>a && a.classList.remove('is-active'));
        const id = e.target.getAttribute('id');
        if (links[id]) links[id].classList.add('is-active');
      }
    });
  }, { rootMargin: "calc(-1 * var(--header-h)) 0px -55% 0px", threshold: 0.01 });

  ['trinity','writings','join'].forEach(id=>{
    const sec = document.getElementById(id);
    if (sec) observer.observe(sec);
  });
})();
