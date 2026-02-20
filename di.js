(function(){
  "use strict";

  const app = document.getElementById("app");
  const stageEl = document.getElementById("stage");
  const canvas = document.getElementById("noteCanvas");
  const ctx = canvas?.getContext("2d", { alpha:true });

  const bgVideo = document.getElementById("bgVideo");
  const music   = document.getElementById("music");
  const seTap   = document.getElementById("seTap");
  const seGreat = document.getElementById("seGreat") || document.getElementById("sePerfect");

  const scoreEl    = document.getElementById("score");
  const comboEl    = document.getElementById("combo");
  const maxComboEl = document.getElementById("maxCombo");
  const timeEl     = document.getElementById("time");

  const targetRoot = document.getElementById("targetRoot");
  const judge      = document.getElementById("judge");
  const judgeMain  = document.getElementById("judgeMain");
  const judgeSub   = document.getElementById("judgeSub");

  const startBtn   = document.getElementById("startBtn");
  const stopBtn    = document.getElementById("stopBtn");
  const restartBtn = document.getElementById("restartBtn");
  const ariaLive   = document.getElementById("ariaLive");

  const fxLayer = document.getElementById("fxLayer");
  const irisRing = document.querySelector(".irisRing");
  const irisFill = document.querySelector(".irisFill");
  const irisPct  = document.querySelector(".irisPct");

  if(!app || !stageEl || !canvas || !ctx || !music) return;

  const CFG = Object.freeze({
    BPM: 145,
    BEAT: 60/145,
    HIT_Y_RATIO: 0.76,
    NOTE_SPEED: 540,
    TAP_R: 12,
    HOLD_R: 18,
    PERFECT_PX: 10,
    GREAT_PX: 22,
    GOOD_PX: 42,
    TAP_ACCEPT_R: 116,
    HIT_WINDOW_PX: 76,
    SCORE_PERFECT: 120,
    SCORE_GREAT: 100,
    SCORE_GOOD: 60,
    RES_MAX: 100,
    RES_ADD_PERFECT: 4,
    RES_ADD_GREAT: 3,
    RES_ADD_GOOD: 1,
    DURATION_FALLBACK: 70,
    DPR_MAX: 2,
    PFX_DPR_MAX: 2,
    RING_ROT_PER_100: 220,
    DRAW_PAD: 130,
  });

  const S = {
    running:false, primed:false, starting:false, raf:0,
    w:0, h:0, stageRect:null, dpr:1,
    hitY:0, targetR:114,
    notes:[], duration:CFG.DURATION_FALLBACK,
    score:0, combo:0, maxCombo:0, resonance:0,
    holding:false, holdNote:null, pointerDown:false, bandTimer:0,
    lastTouchTs:0,
  };

  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const lerp = (a,b,t)=>a+(b-a)*t;

  function setVh(){ document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`); }
  function getSafePx(name){
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
  }
  function setState(v){ app.dataset.state = v; }
  function announce(msg){ if(ariaLive) ariaLive.textContent = msg; }

  function resize(){
    setVh();
    S.dpr = Math.min(CFG.DPR_MAX, window.devicePixelRatio || 1);
    S.stageRect = stageEl.getBoundingClientRect();
    S.w = S.stageRect.width;
    S.h = S.stageRect.height;

    canvas.width = Math.floor(S.w * S.dpr);
    canvas.height = Math.floor(S.h * S.dpr);
    canvas.style.width = `${S.w}px`;
    canvas.style.height = `${S.h}px`;
    ctx.setTransform(S.dpr,0,0,S.dpr,0,0);

    const rootRect = targetRoot?.getBoundingClientRect();
    S.targetR = rootRect ? rootRect.width * 0.5 : 110;

    const safeTop = getSafePx("--safeT");
    const safeBottom = getSafePx("--safeB");
    const minY = S.targetR + 12 + Math.max(0, safeTop * 0.2);
    const maxY = S.h - S.targetR - 12 - Math.max(0, safeBottom);
    const rawY = S.h * CFG.HIT_Y_RATIO;
    S.hitY = clamp(rawY, minY, Math.max(minY + 1, maxY));

    document.documentElement.style.setProperty("--hitY", `${S.hitY}px`);
    resizeFx();
  }
  window.addEventListener("resize", resize, { passive:true });

  async function safePlay(el){
    if(!el) return false;
    try{ const p = el.play(); if(p?.then) await p; return true; } catch { return false; }
  }

  async function primeMedia(){
    if(S.primed) return true;
    S.primed = true;
    if(bgVideo){ bgVideo.playsInline = true; bgVideo.muted = true; await safePlay(bgVideo); bgVideo.pause(); bgVideo.currentTime = 0; }
    await safePlay(music); music.pause(); music.currentTime = 0;
    try{ if(seTap) seTap.volume = 0.9; if(seGreat) seGreat.volume = 0.95; } catch {}
    ensureFxCanvas();
    return true;
  }

  function getHitY(){ return S.hitY; }
  function isTapInsideTarget(px, py){
    const dx = px - S.w/2;
    const dy = py - getHitY();
    return (dx*dx + dy*dy) <= (CFG.TAP_ACCEPT_R * CFG.TAP_ACCEPT_R);
  }

  function getIrisCenter(){
    if(irisRing){
      const r = irisRing.getBoundingClientRect();
      const s = stageEl.getBoundingClientRect();
      return { x: (r.left + r.width/2) - s.left, y: (r.top + r.height/2) - s.top };
    }
    return { x: S.w - 64, y: 54 };
  }

  function updateIrisUI(){
    const pct = clamp(S.resonance,0,100);
    if(irisFill) irisFill.style.width = `${pct.toFixed(0)}%`;
    if(irisPct) irisPct.textContent = `${pct.toFixed(0)}%`;
    if(irisRing) irisRing.style.setProperty("--irisRot", `${((pct / 100) * CFG.RING_ROT_PER_100).toFixed(2)}deg`);
    const lvl = pct >= 75 ? 3 : pct >= 50 ? 2 : pct >= 25 ? 1 : 0;
    app.dataset.resLevel = String(lvl);
  }

  function ringTick(){
    if(!irisRing) return;
    irisRing.classList.remove("tick"); void irisRing.offsetWidth; irisRing.classList.add("tick");
    setTimeout(()=> irisRing?.classList.remove("tick"), 130);
  }

  function flashTarget(kind){
    if(!targetRoot) return;
    targetRoot.classList.remove("good","great"); void targetRoot.offsetWidth;
    targetRoot.classList.add((kind === "PERFECT" || kind === "GREAT") ? "great" : "good");
  }

  let judgeTimer = 0;
  function showJudge(kind, sub){
    if(!judge) return;
    judge.classList.remove("show","good","great");
    if(judgeMain) judgeMain.textContent = kind;
    if(judgeSub) judgeSub.textContent = sub || "SYNC";
    void judge.offsetWidth;
    judge.classList.add("show", (kind === "GOOD") ? "good" : (kind === "MISS" ? "" : "great"));
    clearTimeout(judgeTimer);
    judgeTimer = setTimeout(()=> judge.classList.remove("show","good","great"), 460);
  }

  function playSe(kind){
    try{ seTap && (seTap.currentTime = 0, seTap.play().catch(()=>{})); }catch{}
    if((kind === "PERFECT" || kind === "GREAT") && seGreat){
      try{ seGreat.currentTime = 0; seGreat.play().catch(()=>{}); }catch{}
    }
  }

  let fxCanvas = null;
  let fctx = null;
  const PFX = { list:[], on:false, raf:0, bursts:[] };

  function ensureFxCanvas(){
    if(fxCanvas) return;
    fxCanvas = document.createElement("canvas");
    fxCanvas.style.cssText = "position:absolute;inset:0;z-index:10;pointer-events:none;width:100%;height:100%";
    (fxLayer || app).appendChild(fxCanvas);
    fctx = fxCanvas.getContext("2d", { alpha:true });
    resizeFx();
  }
  function resizeFx(){
    if(!fctx || !fxCanvas) return;
    const dpr = Math.min(CFG.PFX_DPR_MAX, window.devicePixelRatio || 1);
    fxCanvas.width = Math.floor(S.w * dpr);
    fxCanvas.height = Math.floor(S.h * dpr);
    fctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function bezier2(p0,p1,p2,t){
    const u = 1-t; return { x: u*u*p0.x + 2*u*t*p1.x + t*t*p2.x, y: u*u*p0.y + 2*u*t*p1.y + t*t*p2.y };
  }

  function spawnHitParticles(kind){
    ensureFxCanvas(); if(!fctx) return;
    const from = { x:S.w/2, y:getHitY() };
    const to = getIrisCenter();
    const spec = kind === "PERFECT" ? { n:24, speed:1.15, glow:1.1 }
      : kind === "GREAT" ? { n:14, speed:1.0, glow:0.9 }
      : kind === "GOOD" ? { n:8, speed:0.85, glow:0.6 } : { n:0, speed:1, glow:0 };
    if(spec.n <= 0) return;

    const dur = lerp(430, 260, spec.speed);
    const mid = { x: lerp(from.x,to.x,.56), y: lerp(from.y,to.y,.34) - 54 };

    for(let i=0;i<spec.n;i++){
      const arcR = 22 + Math.random() * 18;
      PFX.list.push({
        t0:performance.now(), dur:dur + (Math.random()*120 - 60),
        x0:from.x + (Math.random()*2-1)*13, y0:from.y + (Math.random()*2-1)*13,
        c1x:mid.x + (Math.random()*2-1)*40, c1y:mid.y + (Math.random()*2-1)*30,
        x1:to.x + (Math.random()*2-1)*5, y1:to.y + (Math.random()*2-1)*5,
        size:1.4 + Math.random()*2.6, glow:spec.glow,
        color: kind === "PERFECT" ? "gold" : (kind === "GREAT" ? "mix" : "cyan"),
        ringFlash: { cx:mid.x, cy:mid.y, r:arcR, a:0.36 }
      });
    }

    PFX.bursts.push({ remain: spec.n, delta: kind === "PERFECT" ? CFG.RES_ADD_PERFECT : kind === "GREAT" ? CFG.RES_ADD_GREAT : CFG.RES_ADD_GOOD });
    if(!PFX.on){ PFX.on = true; PFX.raf = requestAnimationFrame(tickPfx); }
  }

  function consumeBurstOnArrive(){
    const burst = PFX.bursts[0];
    if(!burst) return;
    burst.remain--;
    if(burst.remain <= 0){
      ringTick();
      S.resonance = clamp(S.resonance + burst.delta, 0, CFG.RES_MAX);
      updateIrisUI();
      PFX.bursts.shift();
    }
  }

  function drawGuideArc(fx){
    if(!fx || fx.a <= 0) return;
    fctx.beginPath();
    fctx.arc(fx.cx, fx.cy, fx.r, -0.7*Math.PI, -0.12*Math.PI);
    fctx.strokeStyle = `rgba(116,240,255,${fx.a})`;
    fctx.lineWidth = 1.5;
    fctx.stroke();
  }

  function tickPfx(){
    if(!fctx || !fxCanvas) return;
    fctx.clearRect(0,0,S.w,S.h);
    const now = performance.now();

    for(let i=PFX.list.length-1;i>=0;i--){
      const p = PFX.list[i];
      const t = clamp((now - p.t0) / p.dur, 0, 1);
      const e = t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
      const pos = bezier2({x:p.x0,y:p.y0}, {x:p.c1x,y:p.c1y}, {x:p.x1,y:p.y1}, e);

      p.ringFlash.a = Math.max(0, p.ringFlash.a - 0.018);
      if(t < .6) drawGuideArc(p.ringFlash);

      fctx.beginPath(); fctx.arc(pos.x, pos.y, p.size + (1-e)*6*p.glow, 0, Math.PI*2);
      fctx.strokeStyle = `rgba(84,237,255,${0.12*(1-e)})`; fctx.stroke();

      fctx.beginPath(); fctx.arc(pos.x,pos.y,p.size,0,Math.PI*2);
      fctx.fillStyle = p.color === "gold" ? `rgba(255,214,122,${0.78*(1-e)})`
        : p.color === "mix" ? `rgba(220,245,255,${0.7*(1-e)})`
        : `rgba(78,238,255,${0.64*(1-e)})`;
      fctx.fill();

      if(t >= 1){ PFX.list.splice(i,1); consumeBurstOnArrive(); }
    }

    if(PFX.list.length){ PFX.raf = requestAnimationFrame(tickPfx); }
    else { PFX.on = false; fctx.clearRect(0,0,S.w,S.h); }
  }

  function applyScore(kind){
    if(kind === "PERFECT") S.score += CFG.SCORE_PERFECT;
    else if(kind === "GREAT") S.score += CFG.SCORE_GREAT;
    else S.score += CFG.SCORE_GOOD;
    S.combo++; S.maxCombo = Math.max(S.maxCombo, S.combo);
    if(scoreEl) scoreEl.textContent = String(S.score).padStart(6, "0");
    if(comboEl) comboEl.textContent = String(S.combo);
    if(maxComboEl) maxComboEl.textContent = String(S.maxCombo);
  }

  function applyHit(kind){
    showJudge(kind, "SYNC");
    flashTarget(kind);
    playSe(kind);
    applyScore(kind);
    spawnHitParticles(kind);
    if("vibrate" in navigator) navigator.vibrate(kind === "PERFECT" ? 14 : (kind === "GREAT" ? 10 : 7));
  }

  function applyMiss(show=true){
    S.combo = 0;
    if(comboEl) comboEl.textContent = "0";
    if(show){ showJudge("MISS", "NO SYNC"); if("vibrate" in navigator) navigator.vibrate(8); }
  }

  function buildNotes(){
    S.notes.length = 0;
    let t = 1.0;
    const beat = CFG.BEAT;
    const addTap = (b=1)=>{ S.notes.push({ t, type:"tap", hit:false, banded:false }); t += beat*b; };
    const addHold = (b=2)=>{ S.notes.push({ t, type:"hold", dur:beat*b, hit:false, holdState:"idle", banded:false }); t += beat*b; };

    for(let i=0;i<12;i++) addTap(0.5);
    addHold(2); t += beat*0.5;
    for(let i=0;i<16;i++) addTap(0.5);
    while(t < S.duration - 1.2){ addTap(0.5); if(Math.random() < 0.14) addHold(1.5); }
    S.notes.sort((a,b)=>a.t-b.t);
  }

  function noteY(note, now){ return getHitY() - (note.t - now) * CFG.NOTE_SPEED; }
  function findHittableNote(now){
    let best=null, bestAbs=1e9;
    for(const n of S.notes){
      if(n.hit) continue;
      if(n.type === "hold" && n.holdState === "holding") continue;
      const dy = Math.abs(noteY(n, now) - getHitY());
      if(dy > CFG.HIT_WINDOW_PX) continue;
      if(dy < bestAbs){ best = n; bestAbs = dy; }
    }
    return { note:best, dy:bestAbs };
  }
  function judgeByDy(dy){
    if(dy <= CFG.PERFECT_PX) return "PERFECT";
    if(dy <= CFG.GREAT_PX) return "GREAT";
    if(dy <= CFG.GOOD_PX) return "GOOD";
    return "MISS";
  }

  function startHolding(note){
    S.holding = true; S.holdNote = note; note.holdState = "holding";
    targetRoot?.classList.add("holding");
    showJudge("HOLD", "KEEP");
  }
  function finishHolding(){
    const n = S.holdNote; if(!n) return;
    n.hit = true; n.holdState = "done";
    S.holding = false; S.holdNote = null;
    targetRoot?.classList.remove("holding");
    applyHit("PERFECT");
  }
  function failHolding(){
    const n = S.holdNote; if(n){ n.hit = true; n.holdState = "done"; }
    S.holding = false; S.holdNote = null;
    targetRoot?.classList.remove("holding");
    applyMiss(true);
  }

  function tryHit(px, py){
    if(!S.running || !isTapInsideTarget(px, py)) return;
    if(S.holding) return;

    const now = music.currentTime;
    const { note, dy } = findHittableNote(now);
    if(!note) return;

    if(note.type === "hold"){
      const kind = judgeByDy(dy);
      if(kind === "MISS") return;
      startHolding(note);
      playSe("GOOD");
      return;
    }

    const kind = judgeByDy(dy);
    if(kind === "MISS") return;
    note.hit = true;
    applyHit(kind);
  }

  function bandPulse(){
    stageEl.classList.add("bandOn");
    clearTimeout(S.bandTimer);
    S.bandTimer = setTimeout(()=> stageEl.classList.remove("bandOn"), 120);
  }

  function draw(){
    if(!S.running) return;
    ctx.clearRect(0,0,S.w,S.h);
    const now = music.currentTime;
    if(timeEl) timeEl.textContent = Math.max(0, S.duration - now).toFixed(1);
    const cx = S.w / 2, hitY = getHitY();

    for(const n of S.notes){
      if(n.hit) continue;
      const y = noteY(n, now);
      if(y < -CFG.DRAW_PAD || y > S.h + CFG.DRAW_PAD) continue;
      const dy = Math.abs(y - hitY);

      if(!n.banded && dy <= CFG.GOOD_PX){ n.banded = true; bandPulse(); }

      if(n.type === "tap"){
        if((now - n.t) * CFG.NOTE_SPEED > CFG.GOOD_PX + 18){ n.hit = true; applyMiss(true); continue; }
        ctx.beginPath(); ctx.arc(cx,y,CFG.TAP_R,0,Math.PI*2); ctx.fillStyle = "rgba(83,237,255,.9)"; ctx.fill();
        ctx.beginPath(); ctx.arc(cx,y,CFG.TAP_R+9,0,Math.PI*2); ctx.strokeStyle = "rgba(83,237,255,.25)"; ctx.lineWidth = 2; ctx.stroke();
      }

      if(n.type === "hold"){
        ctx.beginPath(); ctx.arc(cx,y,CFG.HOLD_R,0,Math.PI*2); ctx.fillStyle = "rgba(255,211,120,.3)"; ctx.fill();
        ctx.beginPath(); ctx.arc(cx,y,CFG.HOLD_R+12,0,Math.PI*2); ctx.strokeStyle = "rgba(255,211,120,.24)"; ctx.stroke();

        if(n.holdState === "holding"){
          if(!S.pointerDown){ failHolding(); continue; }
          if(now >= n.t + n.dur){ finishHolding(); continue; }
        }
        if(n.holdState === "idle" && (now - n.t) * CFG.NOTE_SPEED > CFG.GOOD_PX + 18){ n.hit = true; applyMiss(true); }
      }
    }

    if(now >= S.duration - 0.02){ endGame(); return; }
    S.raf = requestAnimationFrame(draw);
  }

  function resetRun(){
    S.score=0; S.combo=0; S.maxCombo=0; S.resonance=0;
    if(scoreEl) scoreEl.textContent = "000000";
    if(comboEl) comboEl.textContent = "0";
    if(maxComboEl) maxComboEl.textContent = "0";
    if(timeEl) timeEl.textContent = "--";
    PFX.list.length=0; PFX.bursts.length=0;
    updateIrisUI();
  }

  async function startGame(){
    if(S.starting) return;
    S.starting = true;
    await primeMedia();
    S.duration = Number.isFinite(music.duration) && music.duration > 5 ? music.duration : CFG.DURATION_FALLBACK;
    resetRun(); buildNotes(); resize(); ensureFxCanvas();

    if(bgVideo){ bgVideo.currentTime = 0; await safePlay(bgVideo); }
    music.currentTime = 0;
    const ok = await safePlay(music);
    if(!ok){ setState("idle"); S.running=false; S.starting=false; announce("Playback blocked. Tap START."); return; }

    setState("running"); S.running = true; S.starting = false; announce("Game started.");
    cancelAnimationFrame(S.raf); S.raf = requestAnimationFrame(draw);
  }

  function stopGame(){
    S.running=false; cancelAnimationFrame(S.raf);
    try{ music.pause(); }catch{}
    try{ bgVideo?.pause(); }catch{}
    targetRoot?.classList.remove("holding","good","great");
    if(PFX.on){ cancelAnimationFrame(PFX.raf); PFX.on = false; }
    PFX.list.length=0; PFX.bursts.length=0;
    if(fctx) fctx.clearRect(0,0,S.w,S.h);
    setState("idle"); announce("Ready. Tap START.");
  }

  async function restartGame(){ stopGame(); await startGame(); }
  function endGame(){ S.running=false; cancelAnimationFrame(S.raf); try{music.pause();}catch{} try{bgVideo?.pause();}catch{} setState("result"); announce("Run complete."); }

  function pointerPos(e){
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e){
    if(e.pointerType === "touch") S.lastTouchTs = performance.now();
    if(e.pointerType === "mouse" && performance.now() - S.lastTouchTs < 650) return;
    if(!S.primed) primeMedia();
    if(S.running) e.preventDefault();
    S.pointerDown = true;
    const p = pointerPos(e);
    tryHit(p.x,p.y);
  }
  function onPointerUp(e){ if(S.running) e.preventDefault(); S.pointerDown = false; if(S.holding) failHolding(); }

  if(window.PointerEvent){
    canvas.addEventListener("pointerdown", onPointerDown, { passive:false });
    canvas.addEventListener("pointerup", onPointerUp, { passive:false });
    canvas.addEventListener("pointercancel", ()=>{ S.pointerDown=false; if(S.holding) failHolding(); }, { passive:true });
  }else{
    canvas.addEventListener("touchstart", (e)=>{
      if(!S.primed) primeMedia();
      if(S.running) e.preventDefault();
      const t = e.changedTouches[0]; if(!t) return;
      const rect = canvas.getBoundingClientRect();
      S.pointerDown = true; tryHit(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive:false });
    canvas.addEventListener("touchend", ()=>{ S.pointerDown=false; if(S.holding) failHolding(); }, { passive:true });
    canvas.addEventListener("mousedown", (e)=>{ const p = pointerPos(e); tryHit(p.x,p.y); }, { passive:true });
  }

  startBtn?.addEventListener("click", startGame);
  stopBtn?.addEventListener("click", stopGame);
  restartBtn?.addEventListener("click", restartGame);

  function mountStageDecor(){
    if(!stageEl.querySelector(".laneEdge.left")){ const L=document.createElement("div"); L.className="laneEdge left"; stageEl.appendChild(L); }
    if(!stageEl.querySelector(".laneEdge.right")){ const R=document.createElement("div"); R.className="laneEdge right"; stageEl.appendChild(R); }
    if(!stageEl.querySelector(".hitBand")){ const B=document.createElement("div"); B.className="hitBand"; stageEl.appendChild(B); }
  }

  function init(){
    setState("idle");
    mountStageDecor();
    resize();
    resetRun();
    announce("Ready. Tap START.");
    music.addEventListener("loadedmetadata", ()=>{ if(Number.isFinite(music.duration) && music.duration > 5) S.duration = music.duration; });
    ensureFxCanvas();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  else init();
})();
