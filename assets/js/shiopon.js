/* ===== Shiopon Perfect JS ===== */
(() => {
  const INVITE_ID='shiopon-invite', DOCK_ID='shiopon-dock';
  const KEY_HIDE_UNTIL='shiopon.hideUntil';
  const HIDE_DAYS_DEFAULT=3, HIDE_DAYS_LONG=30;

  const invite=document.getElementById(INVITE_ID);
  const dock=document.getElementById(DOCK_ID);
  const live=document.getElementById('a11y-live');
  if(!invite||!dock) return;

  // アクセシビリティ
  let lastFocus=null, inertedSiblings=[];
  const closeBtn = invite.querySelector('.shiopon__close');
  const ctaBtn   = invite.querySelector('.shiopon__cta');
  const neverBtn = document.createElement('button');
  const laterBtn = document.createElement('button');

  // 追加オプション
  const opts = document.createElement('div');
  opts.className = 'shiopon__opts';
  neverBtn.textContent = '30日間表示しない';
  laterBtn.textContent = 'また後で';
  opts.appendChild(neverBtn); opts.appendChild(laterBtn);
  invite.querySelector('.shiopon__bubble').appendChild(opts);

  function setLive(msg){
    if (!live) return;
    live.textContent = '';
    setTimeout(()=>{ live.textContent = msg; }, 0);
  }

  function siblings(el){
    const arr=[]; let n=el.parentNode.firstElementChild;
    for (; n; n=n.nextElementSibling) if (n!==el) arr.push(n);
    return arr;
  }
  function enableInert(root){
    inertedSiblings = siblings(root);
    inertedSiblings.forEach(n=>{
      if ('inert' in n){ n.inert = true; }
      n.setAttribute('aria-hidden','true');
    });
  }
  function disableInert(){
    inertedSiblings.forEach(n=>{
      if ('inert' in n){ n.inert = false; }
      n.removeAttribute('aria-hidden');
    });
    inertedSiblings = [];
  }
  function trapFocus(e){
    if(invite.classList.contains('is-hidden')) return;
    const f = invite.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])');
    if(!f.length) return;
    const first=f[0], last=f[f.length-1];
    if(e.key === 'Tab'){
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }else if(e.key === 'Escape'){ hideInvite(HIDE_DAYS_DEFAULT, true); }
  }

  function canShow(){ return Date.now() > Number(localStorage.getItem(KEY_HIDE_UNTIL) || 0); }
  function setHideDays(days){
    const until=Date.now()+days*24*60*60*1000;
    localStorage.setItem(KEY_HIDE_UNTIL, String(until));
  }

  function showInvite(){
    lastFocus = document.activeElement;
    invite.classList.remove('is-hidden');
    invite.classList.add('is-visible');
    dock.classList.add('is-hidden');
    enableInert(invite);
    (ctaBtn||closeBtn)?.focus();
    document.addEventListener('keydown', trapFocus);
    setLive('しおぽんが開きました。LINEで星の言葉を受け取れます。');
    startCollisionWatch();
  }
  function hideInvite(days=HIDE_DAYS_DEFAULT, restoreFocus=false){
    setHideDays(days);
    invite.classList.remove('is-visible');
    invite.classList.add('is-hidden');
    dock.classList.remove('is-hidden');
    document.removeEventListener('keydown', trapFocus);
    disableInert();
    stopCollisionWatch();
    if(restoreFocus) { (lastFocus||dock)?.focus?.(); }
    setLive('しおぽんを閉じました。');
  }

  // クリック・ボタン
  invite.querySelector('.shiopon__close')?.addEventListener('click', ()=> hideInvite(HIDE_DAYS_DEFAULT, true));
  dock.addEventListener('click', showInvite);
  invite.querySelector('.shiopon__cta')?.addEventListener('click', ()=>{
    hideInvite(HIDE_DAYS_DEFAULT, true);
    dock.classList.add('is-hidden');
  });
  laterBtn.addEventListener('click', ()=> hideInvite(HIDE_DAYS_DEFAULT, true));
  neverBtn.addEventListener('click', ()=> hideInvite(HIDE_DAYS_LONG, true));

  // 出現ロジック
  if (canShow()){
    let alreadyShown = false;

    // A) セクション到達
    const targetIds = ['trinity','writings','join'];
    const targets = targetIds.map(id => document.getElementById(id)).filter(Boolean);
    const io = ('IntersectionObserver' in window)
      ? new IntersectionObserver((entries) => {
          entries.forEach(e => {
            if (e.isIntersecting && !alreadyShown){
              alreadyShown = true;
              setTimeout(showInvite, 350);
              io.disconnect();
              window.removeEventListener('scroll', onScrollOnce);
              clearTimeout(timerId);
            }
          });
        }, { rootMargin: '0px 0px -45% 0px', threshold: 0.01 })
      : null;
    targets.forEach(sec => io && io.observe(sec));

    // B) スクロール量
    const thresholdPx = Math.max(200, Math.floor(window.innerHeight * 0.25));
    function onScrollOnce(){
      if (alreadyShown) return;
      if (window.scrollY > thresholdPx){
        alreadyShown = true;
        setTimeout(showInvite, 350);
        window.removeEventListener('scroll', onScrollOnce);
        io && io.disconnect();
        clearTimeout(timerId);
      }
    }
    window.addEventListener('scroll', onScrollOnce, { passive:true });

    // C) 滞在時間フォールバック
    const timerId = setTimeout(() => {
      if (!alreadyShown){
        alreadyShown = true;
        showInvite();
        window.removeEventListener('scroll', onScrollOnce);
        io && io.disconnect();
      }
    }, 15000);
  } else {
    dock.classList.remove('is-hidden');
  }

  // 衝突回避（重要CTA等と重なりそうな時に自動で上へ避ける）
  const avoidSelector = [
    '[data-shiopon="exclude"] .cta-row',
    '[data-avoid="shiopon"]',
    'footer .sns',
  ].join(',');

  let colRaf = null;
  function rect(el){ return el.getBoundingClientRect(); }
  function overlap(a,b){
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function nudgePosition(){
    if (invite.classList.contains('is-hidden')) return;
    invite.style.right = `calc(16px + env(safe-area-inset-right, 0px))`;
    invite.style.bottom = `calc(16px + env(safe-area-inset-bottom, 0px))`;

    const avoidNodes = document.querySelectorAll(avoidSelector);
    if (!avoidNodes.length) return;

    const invRect = rect(invite);
    let maxNudge = 0;
    avoidNodes.forEach(n=>{
      const r = rect(n);
      if (overlap(invRect, r)){
        const needed = Math.ceil((invRect.bottom - r.top) + 12);
        if (needed > maxNudge) maxNudge = needed;
      }
    });

    if (maxNudge > 0){
      invite.style.bottom = `calc(${16 + maxNudge}px + env(safe-area-inset-bottom, 0px))`;
    }
  }

  function onScrollResize(){
    if (colRaf) cancelAnimationFrame(colRaf);
    colRaf = requestAnimationFrame(nudgePosition);
  }
  function startCollisionWatch(){
    window.addEventListener('scroll', onScrollResize, { passive:true });
    window.addEventListener('resize', onScrollResize, { passive:true });
    nudgePosition();
  }
  function stopCollisionWatch(){
    window.removeEventListener('scroll', onScrollResize);
    window.removeEventListener('resize', onScrollResize);
    if (colRaf) cancelAnimationFrame(colRaf);
  }
})();

/* ===== Shiopon 強制テスト表示 ===== */
(() => {
  const invite = document.getElementById('shiopon-invite');
  const dock   = document.getElementById('shiopon-dock');
  if (!invite || !dock) return;

  // ローカルストレージの非表示設定を解除
  localStorage.removeItem('shiopon.hideUntil');

  function showInvite(){
    invite.classList.remove('is-hidden');
    invite.classList.add('is-visible');
    dock.classList.add('is-hidden');
    console.log("⭐ しおぽん強制召喚完了！");
  }

  // 5秒後に自動表示
  setTimeout(showInvite, 5000);
})();
