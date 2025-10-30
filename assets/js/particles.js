(() => {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const canvas = document.getElementById('goldDust');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });
  let w,h,dpr = Math.min(devicePixelRatio||1,2), stars=[],rafId;

  const density = () => {
    const area = (w*h)/(dpr*dpr);
    return Math.max(28, Math.min(75, Math.floor(area/22000)));
  };
  function spawn(){
    const palette = [[255,215,111],[255,238,185],[212,189,255],[174,228,255]];
    const c = palette[Math.floor(Math.random()*palette.length)];
    return { x:Math.random()*w, y:Math.random()*h,
      r:(Math.random()*1.2+0.8)*dpr,
      vx:(Math.random()*0.15-0.075)*dpr,
      vy:(Math.random()*0.20-0.02)*dpr,
      tw:Math.random()*Math.PI*2, rgb:c };
  }
  function resize(){
    canvas.style.width='100vw'; canvas.style.height='100vh';
    w = canvas.width  = Math.floor(canvas.getBoundingClientRect().width*dpr);
    h = canvas.height = Math.floor(canvas.getBoundingClientRect().height*dpr);
    stars = new Array(density()).fill(0).map(spawn);
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    for (let s of stars){
      s.tw+=0.02; s.x+=s.vx; s.y+=s.vy;
      if (s.x < -6*dpr) s.x = w + 6*dpr;
      if (s.x > w+6*dpr) s.x = -6*dpr;
      if (s.y > h+6*dpr) { s.y = -6*dpr; s.x = Math.random()*w; }
      const g = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*4);
      const a = 0.10 + 0.12*Math.sin(s.tw);
      g.addColorStop(0, `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${0.65+a})`);
      g.addColorStop(1, `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    }
    rafId = requestAnimationFrame(draw);
  }
  const ro = new ResizeObserver(()=>{ requestAnimationFrame(resize) });
  ro.observe(document.documentElement);
  document.addEventListener('visibilitychange', ()=>{ if (document.hidden) cancelAnimationFrame(rafId); else draw(); });
  resize(); draw();
})();
