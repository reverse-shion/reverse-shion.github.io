// ===== Re:verse Shion Lang Switch (Global) =====
(function(){
  const current = location.pathname;
  const isEnglish = current.startsWith('/en/');
  const en = isEnglish ? current : '/en' + current;
  const ja = current.replace(/^\/en/, '');

  document.querySelectorAll('[lang="en"]').forEach(e => e.href = en);
  document.querySelectorAll('[lang="ja"]').forEach(e => e.href = ja);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    const lang = btn.getAttribute('lang');
    const active = (isEnglish && lang==='en') || (!isEnglish && lang==='ja');
    if(active) btn.classList.add('is-current');
  });
})();
