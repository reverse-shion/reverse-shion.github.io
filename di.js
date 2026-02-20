/* di.js — DiCo ARU Phase1
   - IRIS HUD sizing + Resonance works
   - PERFECT/GREAT/GOOD
   - Particles flow: Hit -> guide arc -> top-right ring, then ring "click" rotate & resonance increments
   - Thin lane is CSS only
   - Hit circle never clipped (clamp hitY with safe-area)
*/
(function(){
  "use strict";

  // ===== DOM =====
  const app = document.getElementById("app");
  const canvas = document.getElementById("noteCanvas");
  const ctx = canvas?.getContext("2d", { alpha:true });

  const bgVideo = document.getElementById("bgVideo");
  const music = document.getElementById("music");
  const seTap = document.getElementById("seTap");
  const seGreat = document.getElementById("seGreat")
                || document.getElementById("sePerfect")
                || document.getElementById("se_great")
                || document.getElementById("seGod");

  // IRIS HUD
  const sideScore = document.getElementById("sideScore");
  const sideCombo = document.getElementById("sideCombo");
  const maxComboEl = document.getElementById("maxCombo");
  const resFill = document.getElementById("resFill");
  const resValue = document.getElementById("resValue");
  const irisRing = document.getElementById("irisRing");
  const dicoFace = document.getElementById("dicoFace");

  // legacy (hidden)
  const legacyScore = document.getElementById("score");
  const legacyCombo = document.getElementById("combo");
  const legacyTime = document.getElementById("time");
  const legacyMax = document.getElementById("legacyMaxCombo");

  const targetRoot = document.getElementById("targetRoot");
  const judge = document.getElementById("judge") || document.getElementById("judgeText");
  const judgeMain = document.getElementById("judgeMain");
  const judgeSub  = document.getElementById("judgeSub");

  const result = document.getElementById("result");
  const resultScore = document.getElementById("resultScore");
  const resultMaxCombo = document.getElementById("resultMaxCombo");
  const aruProg = document.getElementById("aruProg");
  const aruValue = document.getElementById("aruValue");
  const dicoLine = document.getElementById("dicoLine");

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const restartBtn = document.getElementById("restartBtn");
  const ariaLive = document.getElementById("ariaLive");

  const fxLayer = document.getElementById("fxLayer");

  if(!app || !canvas || !ctx || !music) return;

  // ===== Config =====
  const CFG = Object.freeze({
    BPM: 145,
    BEAT: 60 / 145,

    HIT_Y_RATIO: 0.72,        // base ratio
    HIT_CLAMP_TOP: 0.56,      // clamp so it's not too high
    HIT_CLAMP_BOTTOM_PX: 190, // keep full target visible

    NOTE_SPEED: 650,          // px/sec
    TAP_R: 12,
    HOLD_R: 18,

    PERFECT_PX: 10,           // ★NEW
    GREAT_PX: 24,
    GOOD_PX: 44,

    TAP_ACCEPT_R: 160,
    HIT_WINDOW_PX: 70,

    SCORE_PERFECT: 120,
    SCORE_GREAT:   100,
    SCORE_GOOD:     60,

    RES_MAX: 100,
    RES_ADD_PERFECT: 3.2,
    RES_ADD_GREAT:   2.1,
    RES_ADD_GOOD:    1.0,

    FACE_THRESHOLDS: [35, 70], // 0-34 face1, 35-69 face2, 70+ face3

    FALL_LEAD: 1.4,
    DURATION_FALLBACK: 70,

    DPR_MAX: 2,
    DRAW_PAD: 140,

    // FX
    PFX_DPR_MAX: 2,
    FLOW_TIME: 420,  // ms (particle travel)
    RING_TICK_DEG: 11,
  });

  // ===== State =====
  const S = {
    running:false,
    primed:false,
    starting:false,
    raf:0,

    w:0,h:0,dpr:1,

    notes:[],
    duration:CFG.DURATION_FALLBACK,

    score:0,
    combo:0,
    maxCombo:0,
    res:0, // resonance 0..100

    holding:false,
    holdNote:null,

    pointerDown:false,
    pointerX:0,
    pointerY:0,

    ringRot: 0, // degrees
  };

  // ===== Utils =====
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const lerp = (a,b,t)=>a+(b-a)*t;

  function setVhVar(){
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  function getSafeInsets(){
    // iOS env(safe-area-inset-*) can't be read reliably in JS w/o computed style trick.
    // We'll approximate with visualViewport offsets if available.
    const vv = window.visualViewport;
    const top = vv ? Math.max(0, vv.offsetTop) : 0;
    return { top, bottom: 0 };
  }

  function computeHitY(){
    const { top } = getSafeInsets();
    const base = S.h * CFG.HIT_Y_RATIO;
    const minY = S.h * CFG.HIT_CLAMP_TOP;
    const maxY = S.h - CFG.HIT_CLAMP_BOTTOM_PX; // ensure target doesn't clip
    return clamp(base + top*0.3, minY, maxY);
  }

  function syncHitCss(){
    const y = computeHitY();
    // CSS custom property for target + judge placement
    const pct = (y / S.h) * 100;
    app.style.setProperty("--hitY", `${pct}%`);
  }

  function resize(){
    setVhVar();
    S.dpr = Math.min(CFG.DPR_MAX, window.devicePixelRatio || 1);
    S.w = window.innerWidth;
    S.h = window.innerHeight;

    canvas.width  = Math.floor(S.w * S.dpr);
    canvas.height = Math.floor(S.h * S.dpr);
    canvas.style.width = `${S.w}px`;
    canvas.style.height = `${S.h}px`;
    ctx.setTransform(S.dpr,0,0,S.dpr,0,0);

    syncHitCss();
    resizeFx();
  }
  window.addEventListener("resize", resize, { passive:true });

  function setState(state){
    app.dataset.state = state;
    if(result){
      result.setAttribute("aria-hidden", state === "result" ? "false" : "true");
    }
  }

  function announce(msg){
    if(ariaLive) ariaLive.textContent = msg;
  }

  async function safePlay(el){
    try{
      const p = el.play();
      if(p && typeof p.then === "function") await p;
      return true;
    }catch{ return false; }
  }

  async function primeMedia(){
    if(S.primed) return true;
    S.primed = true;

    if(bgVideo){
      bgVideo.playsInline = true;
      bgVideo.muted = true;
      await safePlay(bgVideo);
      bgVideo.pause();
      bgVideo.currentTime = 0;
    }

    await safePlay(music);
    music.pause();
    music.currentTime = 0;

    try{
      if(seTap) seTap.volume = 0.9;
      if(seGreat) seGreat.volume = 0.95;
    }catch{}

    return true;
  }

  // ===== Geometry =====
  function getHitY(){ return computeHitY(); }

  function isTapInsideTarget(px, py){
    const cx = S.w / 2;
    const cy = getHitY();
    const dx = px - cx;
    const dy = py - cy;
    return (dx*dx + dy*dy) <= (CFG.TAP_ACCEPT_R * CFG.TAP_ACCEPT_R);
  }

  // ===== Judge UI =====
  function flashTarget(kind){
    if(!targetRoot) return;
    targetRoot.classList.remove("good","great");
    void targetRoot.offsetWidth;
    if(kind === "GOOD") targetRoot.classList.add("good");
    else targetRoot.classList.add("great");
  }

  let judgeTimer = 0;
  function showJudge(kind, sub){
    if(!judge) return;
    judge.classList.remove("show","good","great","miss");
    if(judgeMain) judgeMain.textContent = kind;
    if(judgeSub)  judgeSub.textContent  = sub || "SYNC";
    void judge.offsetWidth;

    if(kind === "MISS") judge.classList.add("show","miss");
    else if(kind === "GOOD") judge.classList.add("show","good");
    else judge.classList.add("show","great"); // PERFECT/GREAT
    clearTimeout(judgeTimer);
    judgeTimer = setTimeout(()=> judge.classList.remove("show","good","great","miss"), 460);
  }

  function playSe(kind){
    if(seTap){
      try{ seTap.currentTime = 0; seTap.play().catch(()=>{}); }catch{}
    }
    if((kind === "PERFECT" || kind === "GREAT") && seGreat){
      try{ seGreat.currentTime = 0; seGreat.play().catch(()=>{}); }catch{}
    }
  }

  // ===== FX canvas =====
  let fxCanvas = null;
  let fctx = null;
  let fxDpr = 1;

  function ensureFxCanvas(){
    if(fxCanvas) return;
    fxCanvas = document.createElement("canvas");
    fxCanvas.id = "fxCanvas";
    fxCanvas.style.position = "absolute";
    fxCanvas.style.inset = "0";
    fxCanvas.style.zIndex = "25";
    fxCanvas.style.pointerEvents = "none";
    fxCanvas.style.width = "100%";
    fxCanvas.style.height = "100%";
    (fxLayer || app).appendChild(fxCanvas);
    fctx = fxCanvas.getContext("2d", { alpha:true });
    resizeFx();
  }

  function resizeFx(){
    if(!fxCanvas || !fctx) return;
    fxDpr = Math.min(CFG.PFX_DPR_MAX, window.devicePixelRatio || 1);
    fxCanvas.width  = Math.floor(window.innerWidth * fxDpr);
    fxCanvas.height = Math.floor(window.innerHeight * fxDpr);
    fctx.setTransform(fxDpr,0,0,fxDpr,0,0);
  }

  // ===== Particle FLOW (Hit -> IRIS ring) =====
  const FLOW = { list: [], on:false, raf:0, guides: [] };

  function getIrisTargetPoint(){
    const ring = irisRing || document.getElementById("irisAvatar");
    if(!ring) return { x: S.w - 40, y: 40 };
    const r = ring.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }

  function spawnFlow(kind){
    ensureFxCanvas();
    if(!fctx) return;

    const start = { x: S.w/2, y: getHitY() };
    const end = getIrisTargetPoint();

    const profile = (() => {
      if(kind === "PERFECT") return { n: 28, speed: 1.15, glow: 1.20 };
      if(kind === "GREAT")   return { n: 18, speed: 1.00, glow: 1.00 };
      if(kind === "GOOD")    return { n: 10, speed: 0.90, glow: 0.75 };
      return { n: 0, speed: 0, glow: 0 };
    })();

    if(profile.n <= 0) return;

    // guide arc (a short-lived arc/line to show “conduit”)
    FLOW.guides.push({
      t0: performance.now(),
      ms: 220,
      a: 0.55,
      start, end
    });

    for(let i=0;i<profile.n;i++){
      const s = (Math.random()*0.6 + 0.2) * 1.0;
      // control points (curve) that “bows” outward a bit, like arc route
      const midx = lerp(start.x, end.x, 0.52);
      const midy = lerp(start.y, end.y, 0.52);
      const bend = (Math.random()*0.6 + 0.4) * (Math.random()<0.5 ? -1 : 1);
      const cx1 = lerp(start.x, midx, 0.55) + bend * 90;
      const cy1 = lerp(start.y, midy, 0.55) - 40;
      const cx2 = lerp(midx, end.x, 0.55) + bend * 55;
      const cy2 = lerp(midy, end.y, 0.55) + 25;

      FLOW.list.push({
        kind,
        t0: performance.now(),
        dur: CFG.FLOW_TIME / profile.speed,
        // bezier control
        x0:start.x, y0:start.y,
        x1:cx1, y1:cy1,
        x2:cx2, y2:cy2,
        x3:end.x, y3:end.y,
        size: 1.4 + Math.random()*2.6*s,
        glow: profile.glow,
        jitter: (Math.random()*0.8 + 0.2) * 0.8,
      });
    }

    if(!FLOW.on){
      FLOW.on = true;
      FLOW.raf = requestAnimationFrame(tickFlow);
    }
  }

  function bezier(t, p0,p1,p2,p3){
    const u = 1 - t;
    const tt = t*t;
    const uu = u*u;
    const uuu = uu*u;
    const ttt = tt*t;
    return uuu*p0 + 3*uu*t*p1 + 3*u*tt*p2 + ttt*p3;
  }

  function drawGuide(g){
    const now = performance.now();
    const k = clamp((now - g.t0)/g.ms, 0, 1);
    const a = g.a * (1-k);

    const { start, end } = g;
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2 - 90;

    fctx.save();
    fctx.globalAlpha = a;
    fctx.lineWidth = 2;
    fctx.strokeStyle = `rgba(0,240,255,${0.18*a + 0.05})`;
    fctx.beginPath();
    fctx.moveTo(start.x, start.y);
    fctx.quadraticCurveTo(cx, cy, end.x, end.y);
    fctx.stroke();
    fctx.restore();
  }

  function tickFlow(){
    if(!fctx || !fxCanvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    fctx.clearRect(0,0,w,h);

    // guides
    for(let i=FLOW.guides.length-1;i>=0;i--){
      const g = FLOW.guides[i];
      const k = (performance.now() - g.t0)/g.ms;
      if(k >= 1) FLOW.guides.splice(i,1);
      else drawGuide(g);
    }

    // particles
    let anyArrive = false;

    for(let i=FLOW.list.length-1;i>=0;i--){
      const p = FLOW.list[i];
      const now = performance.now();
      const t = clamp((now - p.t0) / p.dur, 0, 1);

      const x = bezier(t, p.x0,p.x1,p.x2,p.x3);
      const y = bezier(t, p.y0,p.y1,p.y2,p.y3);

      const a = (1 - t);
      const glow = (10 + 16*p.glow) * a;

      // cyan body
      fctx.beginPath();
      fctx.arc(x, y, p.size, 0, Math.PI*2);
      fctx.fillStyle = `rgba(0,240,255,${0.55*a})`;
      fctx.fill();

      // gold sparkle hint for PERFECT
      if(p.kind === "PERFECT"){
        fctx.beginPath();
        fctx.arc(x, y, p.size*0.7, 0, Math.PI*2);
        fctx.fillStyle = `rgba(230,201,107,${0.38*a})`;
        fctx.fill();
      }

      // aura
      fctx.beginPath();
      fctx.arc(x, y, p.size + glow, 0, Math.PI*2);
      fctx.strokeStyle = `rgba(0,240,255,${0.08*a})`;
      fctx.lineWidth = 2;
      fctx.stroke();

      if(t >= 1){
        FLOW.list.splice(i,1);
        anyArrive = true;
      }
    }

    if(anyArrive){
      // ring tick on arrival batch (small but satisfying)
      ringTick();
    }

    if(FLOW.list.length || FLOW.guides.length){
      FLOW.raf = requestAnimationFrame(tickFlow);
    }else{
      FLOW.on = false;
      fctx.clearRect(0,0,w,h);
    }
  }

  // ===== Ring tick + resonance UI =====
  let ringTickTimer = 0;
  function ringTick(){
    if(!irisRing) return;
    // debounce to avoid too-fast stacking
    const now = performance.now();
    if(now - ringTickTimer < 60) return;
    ringTickTimer = now;

    S.ringRot = (S.ringRot + CFG.RING_TICK_DEG) % 360;
    irisRing.style.transform = `rotate(${S.ringRot}deg)`;
    // tiny click feel
    irisRing.animate(
      [{ transform:`rotate(${S.ringRot}deg) scale(1)` },
       { transform:`rotate(${S.ringRot}deg) scale(1.04)` },
       { transform:`rotate(${S.ringRot}deg) scale(1)` }],
      { duration: 130, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }

  function setResonance(n){
    S.res = clamp(n, 0, CFG.RES_MAX);
    const pct = Math.round(S.res);
    if(resValue) resValue.textContent = String(pct);
    if(resFill) resFill.style.width = `${pct}%`;

    // face stage
    if(dicoFace){
      const stage = (S.res >= CFG.FACE_THRESHOLDS[1]) ? 3 :
                    (S.res >= CFG.FACE_THRESHOLDS[0]) ? 2 : 1;
      const cur = Number(dicoFace.dataset.face || "1");
      if(stage !== cur){
        dicoFace.dataset.face = String(stage);
        dicoFace.src = `assets/dico_face_${stage}.png`;
      }
    }
  }

  // ===== Scoring =====
  function padScore(n){
    const s = String(Math.max(0, Math.floor(n)));
    return s.padStart(6, "0");
  }

  function applyHit(kind){
    // 1) Judge text
    showJudge(kind, "SYNC");

    // 2) Particles
    spawnFlow(kind);

    // Score / combo / res
    if(kind === "PERFECT"){
      S.score += CFG.SCORE_PERFECT;
      setResonance(S.res + CFG.RES_ADD_PERFECT);
      flashTarget("GREAT");
    }else if(kind === "GREAT"){
      S.score += CFG.SCORE_GREAT;
      setResonance(S.res + CFG.RES_ADD_GREAT);
      flashTarget("GREAT");
    }else{
      S.score += CFG.SCORE_GOOD;
      setResonance(S.res + CFG.RES_ADD_GOOD);
      flashTarget("GOOD");
    }

    S.combo++;
    if(S.combo > S.maxCombo) S.maxCombo = S.combo;

    if(sideScore) sideScore.textContent = padScore(S.score);
    if(sideCombo) sideCombo.textContent = String(S.combo);
    if(maxComboEl) maxComboEl.textContent = String(S.maxCombo);

    // legacy update (hidden but safe)
    if(legacyScore) legacyScore.textContent = String(S.score);
    if(legacyCombo) legacyCombo.textContent = String(S.combo);
    if(legacyMax) legacyMax.textContent = String(S.maxCombo);

    playSe(kind);

    if("vibrate" in navigator) navigator.vibrate(kind === "PERFECT" ? 14 : kind === "GREAT" ? 12 : 8);
  }

  function applyMiss(show=true){
    S.combo = 0;
    if(sideCombo) sideCombo.textContent = "0";
    if(legacyCombo) legacyCombo.textContent = "0";
    if(show){
      showJudge("MISS", "NO SYNC");
      if("vibrate" in navigator) navigator.vibrate(10);
    }
  }

  // ===== Chart =====
  function buildNotes(){
    S.notes.length = 0;

    let t = 1.0;
    const beat = CFG.BEAT;

    function addTap(beats=1){
      S.notes.push({ t, type:"tap", dur:0, hit:false });
      t += beat * beats;
    }
    function addBurst16(count){
      for(let i=0;i<count;i++){
        S.notes.push({ t, type:"tap", dur:0, hit:false });
        t += beat * 0.5;
      }
    }
    function addTriplet(){
      const step = beat / 3;
      for(let i=0;i<3;i++){
        S.notes.push({ t, type:"tap", dur:0, hit:false });
        t += step;
      }
    }
    function addHold(beats=2){
      S.notes.push({ t, type:"hold", dur: beat * beats, hit:false, holdState:"idle" });
      t += beat * beats;
    }

    for(let i=0;i<8;i++) addTap(0.5);
    t += beat * 1.0;
    addBurst16(12);

    t += beat * 0.5;
    addTriplet();
    t += beat * 0.5;
    addTriplet();

    t += beat * 0.5;
    addHold(2);
    t += beat * 0.5;

    for(let i=0;i<6;i++) addTap(0.5);
    addBurst16(8);
    for(let i=0;i<6;i++) addTap(0.5);

    while(t < (S.duration - 1.0)){
      addTap(0.5);
      if(Math.random() < 0.16) addBurst16(6);
      if(Math.random() < 0.14) addTriplet();
      if(Math.random() < 0.12) addHold(1.5);
      if(Math.random() < 0.10) t += beat * 0.5;
    }

    S.notes.sort((a,b)=>a.t-b.t);
  }

  // ===== Position-based judgement =====
  function noteY(note, now){
    const hitY = getHitY();
    const diff = note.t - now;
    return hitY - diff * CFG.NOTE_SPEED;
  }

  function findHittableNote(now){
    let best=null;
    let bestAbs=1e9;

    for(const n of S.notes){
      if(n.hit) continue;

      const y = noteY(n, now);
      const dy = Math.abs(y - getHitY());
      if(dy > CFG.HIT_WINDOW_PX) continue;
      if(n.type==="hold" && n.holdState==="holding") continue;

      if(dy < bestAbs){
        bestAbs = dy;
        best = n;
      }
    }
    return { note: best, dy: bestAbs };
  }

  function judgeByDy(dy){
    if(dy <= CFG.PERFECT_PX) return "PERFECT";
    if(dy <= CFG.GREAT_PX)   return "GREAT";
    if(dy <= CFG.GOOD_PX)    return "GOOD";
    return "MISS";
  }

  function startHolding(note){
    S.holding = true;
    S.holdNote = note;
    note.holdState = "holding";
    if(targetRoot) targetRoot.classList.add("holding");
    showJudge("HOLD", "KEEP");
  }

  function finishHolding(kind){
    const n = S.holdNote;
    if(!n) return;

    n.hit = true;
    n.holdState = "done";
    S.holding = false;
    S.holdNote = null;

    if(targetRoot) targetRoot.classList.remove("holding");
    applyHit(kind);
  }

  function failHolding(){
    const n = S.holdNote;
    if(n){
      n.hit = true;
      n.holdState = "done";
    }
    S.holding = false;
    S.holdNote = null;
    if(targetRoot) targetRoot.classList.remove("holding");
    applyMiss(true);
  }

  function tryHit(px, py){
    if(!S.running) return;

    // accept only inside target circle
    if(!isTapInsideTarget(px, py)) return;

    const now = music.currentTime;

    // while holding: no extra judgement
    if(S.holding) return;

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

  // ===== Render =====
  function draw(){
    if(!S.running) return;

    ctx.clearRect(0,0,S.w,S.h);

    const now = music.currentTime;

    const remain = Math.max(0, S.duration - now);
    if(legacyTime) legacyTime.textContent = remain.toFixed(1);

    const cx = S.w / 2;

    for(const n of S.notes){
      if(n.hit) continue;

      const y = noteY(n, now);
      if(y < -CFG.DRAW_PAD || y > S.h + CFG.DRAW_PAD) continue;

      if(n.type==="tap"){
        // auto miss only when passed window
        if((now - n.t) * CFG.NOTE_SPEED > CFG.GOOD_PX + 18){
          n.hit = true;
          applyMiss(true);
          continue;
        }

        ctx.beginPath();
        ctx.arc(cx, y, CFG.TAP_R, 0, Math.PI*2);
        ctx.fillStyle = "rgba(0,240,255,0.88)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, y, CFG.TAP_R + 10, 0, Math.PI*2);
        ctx.strokeStyle = "rgba(0,240,255,0.18)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if(n.type==="hold"){
        ctx.beginPath();
        ctx.arc(cx, y, CFG.HOLD_R, 0, Math.PI*2);
        ctx.fillStyle = "rgba(230,201,107,0.28)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, y, CFG.HOLD_R + 14, 0, Math.PI*2);
        ctx.strokeStyle = "rgba(230,201,107,0.22)";
        ctx.lineWidth = 3;
        ctx.stroke();

        if(n.holdState==="holding"){
          const endT = n.t + n.dur;

          if(!S.pointerDown){
            failHolding();
            continue;
          }
          if(now >= endT){
            finishHolding("PERFECT");
            continue;
          }
        }

        if(n.holdState==="idle"){
          if((now - n.t) * CFG.NOTE_SPEED > CFG.GOOD_PX + 18){
            n.hit = true;
            applyMiss(true);
            continue;
          }
        }
      }
    }

    if(now >= S.duration - 0.02){
      endGame();
      return;
    }

    S.raf = requestAnimationFrame(draw);
  }

  // ===== Run control =====
  function resetRun(){
    S.score=0; S.combo=0; S.maxCombo=0;
    setResonance(0);
    S.ringRot = 0;
    if(irisRing) irisRing.style.transform = "rotate(0deg)";

    if(sideScore) sideScore.textContent = "000000";
    if(sideCombo) sideCombo.textContent = "0";
    if(maxComboEl) maxComboEl.textContent = "0";

    if(legacyScore) legacyScore.textContent="0";
    if(legacyCombo) legacyCombo.textContent="0";
    if(legacyMax) legacyMax.textContent="0";
    if(legacyTime) legacyTime.textContent="--";
  }

  async function startGame(){
    if(S.starting) return;
    S.starting = true;

    await primeMedia();

    S.duration = (Number.isFinite(music.duration) && music.duration > 5)
      ? music.duration
      : CFG.DURATION_FALLBACK;

    resetRun();
    buildNotes();
    ensureFxCanvas();

    if(bgVideo){
      bgVideo.currentTime = 0;
      await safePlay(bgVideo);
    }

    music.currentTime = 0;
    const ok = await safePlay(music);
    if(!ok){
      setState("idle");
      S.running = false;
      S.starting = false;
      announce("Playback blocked. Tap START.");
      return;
    }

    setState("running");
    S.running = true;
    announce("Game started.");

    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(draw);
    S.starting = false;
  }

  function stopGame(){
    S.running=false;
    cancelAnimationFrame(S.raf);

    try{ music.pause(); }catch{}
    try{ bgVideo && bgVideo.pause(); }catch{}

    if(targetRoot) targetRoot.classList.remove("holding","good","great");

    // stop FX
    if(FLOW.on){
      cancelAnimationFrame(FLOW.raf);
      FLOW.on = false;
      FLOW.list.length = 0;
      FLOW.guides.length = 0;
      if(fctx) fctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    }

    setState("idle");
    announce("Ready. Tap START.");
  }

  async function restartGame(){
    stopGame();
    await startGame();
  }

  function endGame(){
    S.running=false;
    cancelAnimationFrame(S.raf);

    try{ music.pause(); }catch{}
    try{ bgVideo && bgVideo.pause(); }catch{}

    setState("result");

    if(resultScore) resultScore.textContent = String(S.score);
    if(resultMaxCombo) resultMaxCombo.textContent = String(S.maxCombo);

    // ARU ring uses resonance as proxy
    const pct = clamp(S.res,0,100);
    if(aruValue) aruValue.textContent = `${pct.toFixed(0)}%`;
    if(aruProg){
      const C = 276.46;
      const offset = C * (1 - pct/100);
      aruProg.style.strokeDasharray = String(C);
      aruProg.style.strokeDashoffset = String(offset);
    }
    if(dicoLine){
      const lines = [
        "しーちゃんに、君の想いは届いたよ。",
        "こんなに想ってくれて、ありがとう。",
        "今日の共鳴、ちゃんと残ったよ。",
        "大丈夫。次はもっと光る。"
      ];
      const pick = (S.score >= 3500) ? 1 : (S.score >= 1800) ? 0 : (S.score >= 800) ? 2 : 3;
      dicoLine.textContent = lines[pick];
    }

    announce("Run complete.");
  }

  // ===== Input =====
  function pointerPos(e){
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
  }

  function onPointerDown(e){
    if(!S.primed) primeMedia();
    if(S.running) e.preventDefault();

    S.pointerDown = true;
    const p = pointerPos(e);
    S.pointerX = p.x;
    S.pointerY = p.y;

    tryHit(p.x, p.y);
  }

  function onPointerUp(e){
    if(S.running) e.preventDefault();
    S.pointerDown = false;

    if(S.holding){
      failHolding();
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown, { passive:false });
  canvas.addEventListener("pointerup", onPointerUp, { passive:false });
  canvas.addEventListener("pointercancel", ()=>{
    S.pointerDown=false;
    if(S.holding) failHolding();
  }, { passive:true });

  canvas.addEventListener("touchstart", (e)=>{
    if(S.running) e.preventDefault();
  }, { passive:false });

  // ===== Buttons =====
  startBtn?.addEventListener("click", startGame);
  stopBtn?.addEventListener("click", stopGame);
  restartBtn?.addEventListener("click", restartGame);

  // ===== Init =====
  function init(){
    resize();
    setState("idle");
    resetRun();
    announce("Ready. Tap START.");

    music.addEventListener("loadedmetadata", ()=>{
      if(Number.isFinite(music.duration) && music.duration > 5) S.duration = music.duration;
    });

    ensureFxCanvas();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, { once:true });
  }else{
    init();
  }
})();
