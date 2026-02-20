/* di.js — DiCo ARU Phase1 (Taiko-ish) + IRIS吸い込みFX
   ✅ px判定（中心=PERFECT / 近い=GREAT / 円内=GOOD）
   ✅ ターゲット円内だけ受付（空打ち無反応）
   ✅ MISSは譜面を逃した時のみ表示
   ✅ 判定→粒子→右上へ→リングtick→Resonance増（因果固定）
   ✅ レーン帯：ノーツが判定帯に入った瞬間だけ発光（class付与）
*/
(function(){
  "use strict";

  // ===== DOM =====
  const app = document.getElementById("app");
  const canvas = document.getElementById("noteCanvas");
  const ctx = canvas?.getContext("2d", { alpha:true });

  const stageEl = document.querySelector(".stage");
  const bgVideo = document.getElementById("bgVideo");
  const music   = document.getElementById("music");
  const seTap   = document.getElementById("seTap");
  const seGreat = document.getElementById("seGreat")
                || document.getElementById("sePerfect")
                || document.getElementById("se_great")
                || document.getElementById("seGod");

  const scoreEl    = document.getElementById("score");
  const comboEl    = document.getElementById("combo");
  const maxComboEl = document.getElementById("maxCombo");
  const timeEl     = document.getElementById("time");

  const targetRoot = document.getElementById("targetRoot");
  const judge      = document.getElementById("judge") || document.getElementById("judgeText");
  const judgeMain  = document.getElementById("judgeMain");
  const judgeSub   = document.getElementById("judgeSub");

  const resultScore    = document.getElementById("resultScore");
  const resultMaxCombo = document.getElementById("resultMaxCombo");

  const startBtn   = document.getElementById("startBtn");
  const stopBtn    = document.getElementById("stopBtn");
  const restartBtn = document.getElementById("restartBtn");
  const ariaLive   = document.getElementById("ariaLive");

  const fxLayer = document.getElementById("fxLayer");

  // IRIS HUD (right) — CSS側class想定
  const irisHud  = document.querySelector(".irisHud");
  const irisRing = document.querySelector(".irisRing");
  const irisFill = document.querySelector(".irisFill");
  const irisPct  = document.querySelector(".irisPct");

  if(!app || !canvas || !ctx || !music) return;

  // ===== Config =====
  const CFG = Object.freeze({
    BPM: 145,
    BEAT: 60 / 145,

    HIT_Y_RATIO: 0.78,

    NOTE_SPEED: 640,     // px/sec
    TAP_R: 12,
    HOLD_R: 18,

    // 3段階（ユーザー要望：判定ごと粒子差）
    PERFECT_PX: 10,
    GREAT_PX:   20,
    GOOD_PX:    42,

    TAP_ACCEPT_R: 160,   // 受付円

    HIT_WINDOW_PX: 72,   // “候補にできる”最大dy（ミス消滅用）

    SCORE_PERFECT: 120,
    SCORE_GREAT:   100,
    SCORE_GOOD:     60,

    RES_MAX: 100,
    RES_ADD_PERFECT: 4,
    RES_ADD_GREAT:   3,
    RES_ADD_GOOD:    1,

    DURATION_FALLBACK: 70,

    DPR_MAX: 2,
    DRAW_PAD: 140,

    // FX
    EXPOSURE_MS: 140,
    PFX_DPR_MAX: 2,

    // Particle flight
    PFLIGHT_MS_MIN: 260,
    PFLIGHT_MS_MAX: 420,

    // Ring rotation mapping
    RING_ROT_PER_100: 220,   // 0%→100%で回る角度
    RING_TICK_DEG: 10,       // 粒子到達ごとのカチッ
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

    resonance:0,          // 表示される本体%
    resPending:0,         // 粒子到達で加算される予定
    resAnimRot:0,         // CSS var

    holding:false,
    holdNote:null,

    pointerDown:false,

    bandOn:false,
    bandTimer:0,
  };

  // ===== Utils =====
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const lerp  = (a,b,t)=>a+(b-a)*t;

  function setVhVar(){
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
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

    resizeFx();
  }
  window.addEventListener("resize", resize, { passive:true });

  function setState(state){ app.dataset.state = state; }
  function announce(msg){ if(ariaLive) ariaLive.textContent = msg; }

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

    ensureFxCanvas();
    return true;
  }

  // ===== Geometry =====
  function getHitY(){ return S.h * CFG.HIT_Y_RATIO; }

  function isTapInsideTarget(px, py){
    const cx = S.w / 2;
    const cy = getHitY();
    const dx = px - cx;
    const dy = py - cy;
    return (dx*dx + dy*dy) <= (CFG.TAP_ACCEPT_R * CFG.TAP_ACCEPT_R);
  }

  function getIrisCenter(){
    // 右上リング中心（無い場合は適当fallback）
    if(irisRing){
      const r = irisRing.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    }
    return { x: S.w - 54, y: 54 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safeT"))||0) };
  }

  // ===== HUD update (NO OVERLAP + moving gauge) =====
  function updateIrisUI(){
    const pct = clamp(S.resonance, 0, 100);
    if(irisFill) irisFill.style.width = `${pct.toFixed(0)}%`;
    if(irisPct)  irisPct.textContent = `${pct.toFixed(0)}%`;

    // 常時回転：%に追従（スクショ右の“リンク回る” 느낌）
    const baseRot = (pct/100) * CFG.RING_ROT_PER_100;
    S.resAnimRot = baseRot;
    if(irisRing){
      irisRing.style.setProperty("--irisRot", `${baseRot.toFixed(2)}deg`);
    }
  }

  function ringTick(){
    if(!irisRing) return;
    irisRing.classList.remove("tick");
    void irisRing.offsetWidth;
    irisRing.classList.add("tick");
    // tick後、基準回転に戻す（見た目は“カチッ”）
    setTimeout(()=> irisRing && irisRing.classList.remove("tick"), 150);
  }

  // ===== FX: target & judge =====
  function flashTarget(kind){
    if(!targetRoot) return;
    targetRoot.classList.remove("good","great");
    void targetRoot.offsetWidth;
    if(kind === "GREAT" || kind === "PERFECT") targetRoot.classList.add("great");
    else targetRoot.classList.add("good");
  }

  let judgeTimer = 0;
  function showJudge(kind, sub){
    if(!judge) return;
    judge.classList.remove("show","good","great");
    if(judgeMain) judgeMain.textContent = kind;
    if(judgeSub)  judgeSub.textContent  = sub || "SYNC";
    void judge.offsetWidth;

    if(kind === "GOOD") judge.classList.add("show","good");
    else if(kind === "GREAT" || kind === "PERFECT") judge.classList.add("show","great");
    else judge.classList.add("show");

    clearTimeout(judgeTimer);
    judgeTimer = setTimeout(()=> judge.classList.remove("show","good","great"), 460);
  }

  function playSe(kind){
    if(seTap){
      try{ seTap.currentTime = 0; seTap.play().catch(()=>{}); }catch{}
    }
    if((kind === "GREAT" || kind === "PERFECT") && seGreat){
      try{ seGreat.currentTime = 0; seGreat.play().catch(()=>{}); }catch{}
    }
  }

  // ===== Exposure (PERFECT/GREAT) =====
  let exposureTimer = 0;
  function exposureUp(){
    app.classList.add("exposureUp");
    clearTimeout(exposureTimer);
    exposureTimer = setTimeout(()=> app.classList.remove("exposureUp"), CFG.EXPOSURE_MS);
  }

  // ===== FX Canvas & Particles (hit → iris) =====
  let fxCanvas = null;
  let fctx = null;
  let fxDpr = 1;

  function ensureFxCanvas(){
    if(fxCanvas) return;
    fxCanvas = document.createElement("canvas");
    fxCanvas.id = "fxCanvas";
    fxCanvas.style.position = "absolute";
    fxCanvas.style.inset = "0";
    fxCanvas.style.zIndex = "10";
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

  const PFX = {
    list: [],
    on:false,
    raf:0,
    bursts: [], // {remain, resDelta}
  };

  function addBurst(resDelta, particleCount){
    PFX.bursts.push({ remain: particleCount, resDelta });
  }

  function consumeBurstOnArrive(){
    if(!PFX.bursts.length) return;
    const b = PFX.bursts[0];
    b.remain--;
    ringTick(); // 4. リングが少し回転（粒子ごと）

    if(b.remain <= 0){
      // 5. Resonance% 数値が増える（到達後）
      S.resonance = clamp(S.resonance + b.resDelta, 0, CFG.RES_MAX);
      updateIrisUI();

      // 6. 閾値越えなら段階遷移（必要ならclassで演出できる）
      // 例：app.dataset.resLevel = "0..4"
      const lvl = (S.resonance>=100) ? 4 : (S.resonance>=75) ? 3 : (S.resonance>=50) ? 2 : (S.resonance>=25) ? 1 : 0;
      app.dataset.resLevel = String(lvl);

      PFX.bursts.shift();
    }
  }

  function spawnHitParticles(kind){
    ensureFxCanvas();
    if(!fctx) return;

    const from = { x: S.w/2, y: getHitY() };
    const to   = getIrisCenter();

    // 判定別：数/速度/光量
    const spec = (() => {
      if(kind === "PERFECT") return { n: 22, sp: 1.15, a: 1.0, glow: 1.1 };
      if(kind === "GREAT")   return { n: 14, sp: 1.00, a: 0.85, glow: 0.9 };
      if(kind === "GOOD")    return { n:  8, sp: 0.92, a: 0.65, glow: 0.7 };
      return { n: 0, sp: 1.0, a: 0.0, glow: 0.0 };
    })();

    if(spec.n <= 0) return;

    const ms = lerp(CFG.PFLIGHT_MS_MAX, CFG.PFLIGHT_MS_MIN, spec.sp);
    const durBase = clamp(ms, 180, 520);

    // “途中で円環（導線）に沿う”感じの制御点（右上へ巻き込む）
    // hit→中腹（右寄り）→iris
    const mid = {
      x: lerp(from.x, to.x, 0.62),
      y: lerp(from.y, to.y, 0.28),
    };
    const swirl = (Math.random()<0.5 ? -1 : 1);
    const ctrl = {
      x: mid.x + swirl * (80 + Math.random()*60),
      y: mid.y - (40 + Math.random()*40),
    };

    for(let i=0;i<spec.n;i++){
      const jitter = 14;
      const x0 = from.x + (Math.random()*2-1)*jitter;
      const y0 = from.y + (Math.random()*2-1)*jitter;

      PFX.list.push({
        t0: performance.now(),
        dur: durBase + (Math.random()*120 - 60),
        x0, y0,
        c1x: ctrl.x + (Math.random()*2-1)*28,
        c1y: ctrl.y + (Math.random()*2-1)*28,
        x1: to.x + (Math.random()*2-1)*6,
        y1: to.y + (Math.random()*2-1)*6,

        size: 1.4 + Math.random()*2.8,
        alpha: spec.a,
        glow: spec.glow,
        hue: (kind==="PERFECT") ? "gold" : (kind==="GREAT") ? "mix" : "cyan",
      });
    }

    if(!PFX.on){
      PFX.on = true;
      PFX.raf = requestAnimationFrame(tickPfx);
    }
  }

  function bezier2(p0, p1, p2, t){
    const a = (1-t)*(1-t);
    const b = 2*(1-t)*t;
    const c = t*t;
    return { x: a*p0.x + b*p1.x + c*p2.x, y: a*p0.y + b*p1.y + c*p2.y };
  }

  function tickPfx(){
    if(!fctx || !fxCanvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    fctx.clearRect(0,0,w,h);

    const now = performance.now();

    for(let i=PFX.list.length-1;i>=0;i--){
      const p = PFX.list[i];
      const t = clamp((now - p.t0) / p.dur, 0, 1);

      // easeInOut
      const tt = t<.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;

      const pos = bezier2(
        {x:p.x0, y:p.y0},
        {x:p.c1x, y:p.c1y},
        {x:p.x1, y:p.y1},
        tt
      );

      const a = (1 - tt) * p.alpha;

      // trail hint (導線)
      if(tt < 0.92){
        fctx.beginPath();
        fctx.arc(pos.x, pos.y, p.size + 8*p.glow*(1-tt), 0, Math.PI*2);
        fctx.strokeStyle = `rgba(0,240,255,${0.06*a})`;
        fctx.lineWidth = 2;
        fctx.stroke();
      }

      // core
      fctx.beginPath();
      fctx.arc(pos.x, pos.y, p.size, 0, Math.PI*2);

      if(p.hue === "gold"){
        fctx.fillStyle = `rgba(255,210,110,${0.75*a})`;
      }else if(p.hue === "mix"){
        fctx.fillStyle = `rgba(255,210,110,${0.45*a})`;
      }else{
        fctx.fillStyle = `rgba(0,240,255,${0.60*a})`;
      }
      fctx.fill();

      // aura
      fctx.beginPath();
      fctx.arc(pos.x, pos.y, p.size + 10*p.glow, 0, Math.PI*2);
      fctx.strokeStyle = `rgba(0,240,255,${0.10*a})`;
      fctx.lineWidth = 2;
      fctx.stroke();

      // arrive
      if(t >= 1){
        PFX.list.splice(i,1);
        consumeBurstOnArrive();
      }
    }

    if(PFX.list.length){
      PFX.raf = requestAnimationFrame(tickPfx);
    }else{
      PFX.on = false;
      fctx.clearRect(0,0,w,h);
    }
  }

  // ===== Scoring (score/combo immediate, resonance delayed) =====
  function applyScore(kind){
    if(kind === "PERFECT") S.score += CFG.SCORE_PERFECT;
    else if(kind === "GREAT") S.score += CFG.SCORE_GREAT;
    else S.score += CFG.SCORE_GOOD;

    S.combo++;
    if(S.combo > S.maxCombo) S.maxCombo = S.combo;

    if(scoreEl) scoreEl.textContent = String(S.score);
    if(comboEl) comboEl.textContent = String(S.combo);
    if(maxComboEl) maxComboEl.textContent = String(S.maxCombo);
  }

  function enqueueResonance(kind){
    let delta = 0;
    if(kind === "PERFECT") delta = CFG.RES_ADD_PERFECT;
    else if(kind === "GREAT") delta = CFG.RES_ADD_GREAT;
    else if(kind === "GOOD") delta = CFG.RES_ADD_GOOD;

    // 粒子数に比例して「到達→加算」を見せる
    const particles = (kind==="PERFECT") ? 18 : (kind==="GREAT") ? 12 : 7;
    addBurst(delta, particles);
    spawnHitParticles(kind);
  }

  function applyHit(kind){
    // 1. 判定テキスト
    flashTarget(kind);
    showJudge(kind, "SYNC");
    playSe(kind);

    // score/comboは即反映（気持ちいい）
    applyScore(kind);

    // 2. 粒子発生 → 3. 右上へ → 4. tick → 5. %増（到達時）
    enqueueResonance(kind);

    // 露出UPはPERFECT/GREATで強く
    if(kind === "PERFECT" || kind === "GREAT") exposureUp();

    if("vibrate" in navigator) navigator.vibrate(kind === "PERFECT" ? 14 : (kind==="GREAT" ? 12 : 8));
  }

  function applyMiss(show=true){
    S.combo = 0;
    if(comboEl) comboEl.textContent = "0";
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

    function addTap(beats=1){ S.notes.push({ t, type:"tap", dur:0, hit:false, banded:false }); t += beat * beats; }
    function addBurst16(count){
      for(let i=0;i<count;i++){
        S.notes.push({ t, type:"tap", dur:0, hit:false, banded:false });
        t += beat * 0.5;
      }
    }
    function addTriplet(){
      const step = beat / 3;
      for(let i=0;i<3;i++){
        S.notes.push({ t, type:"tap", dur:0, hit:false, banded:false });
        t += step;
      }
    }
    function addHold(beats=2){
      S.notes.push({ t, type:"hold", dur: beat * beats, hit:false, holdState:"idle", banded:false });
      t += beat * beats;
    }

    for(let i=0;i<8;i++) addTap(0.5);
    t += beat * 1.0;
    addBurst16(12);

    t += beat * 0.5; addTriplet();
    t += beat * 0.5; addTriplet();

    t += beat * 0.5; addHold(2);
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
    if(n){ n.hit = true; n.holdState = "done"; }
    S.holding = false;
    S.holdNote = null;
    if(targetRoot) targetRoot.classList.remove("holding");
    applyMiss(true);
  }

  function tryHit(px, py){
    if(!S.running) return;

    if(!isTapInsideTarget(px, py)) return;

    const now = music.currentTime;

    if(S.holding){
      // HOLD中の連打は無反応（MISS出さない）
      return;
    }

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

  // ===== HitBand (notes enter window -> stage.bandOn) =====
  function bandPulse(){
    if(!stageEl) return;
    stageEl.classList.add("bandOn");
    clearTimeout(S.bandTimer);
    S.bandTimer = setTimeout(()=> stageEl.classList.remove("bandOn"), 120);
  }

  // ===== Render =====
  function draw(){
    if(!S.running) return;

    ctx.clearRect(0,0,S.w,S.h);

    const now = music.currentTime;
    const remain = Math.max(0, S.duration - now);
    if(timeEl) timeEl.textContent = remain.toFixed(1);

    const cx = S.w / 2;
    const hitY = getHitY();

    for(const n of S.notes){
      if(n.hit) continue;

      const y = noteY(n, now);
      if(y < -CFG.DRAW_PAD || y > S.h + CFG.DRAW_PAD) continue;

      const dy = Math.abs(y - hitY);

      // ノーツが判定帯へ入った瞬間だけ光る
      if(!n.banded && dy <= CFG.GOOD_PX){
        n.banded = true;
        bandPulse();
      }

      if(n.type==="tap"){
        // 通過MISS（ここだけ表示）
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
        ctx.fillStyle = "rgba(230,201,107,0.30)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, y, CFG.HOLD_R + 14, 0, Math.PI*2);
        ctx.strokeStyle = "rgba(230,201,107,0.22)";
        ctx.lineWidth = 3;
        ctx.stroke();

        if(n.holdState==="holding"){
          const endT = n.t + n.dur;

          if(!S.pointerDown){ failHolding(); continue; }

          if(now >= endT){
            // HOLD成功は基本PERFECTに寄せて中毒感
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
    S.resonance=0;
    if(scoreEl) scoreEl.textContent="0";
    if(comboEl) comboEl.textContent="0";
    if(maxComboEl) maxComboEl.textContent="0";
    if(timeEl) timeEl.textContent="--";

    PFX.list.length = 0;
    PFX.bursts.length = 0;

    updateIrisUI();
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
    app.classList.remove("exposureUp");

    if(PFX.on){
      cancelAnimationFrame(PFX.raf);
      PFX.on = false;
      PFX.list.length = 0;
      PFX.bursts.length = 0;
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

    announce("Run complete.");
  }

  // ===== Input (canvas only) =====
  function pointerPos(e){
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
  }

  function onPointerDown(e){
    if(!S.primed) primeMedia();
    if(S.running) e.preventDefault();

    S.pointerDown = true;
    const p = pointerPos(e);
    tryHit(p.x, p.y);
  }

  function onPointerUp(e){
    if(S.running) e.preventDefault();
    S.pointerDown = false;

    if(S.holding){ failHolding(); }
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
  function mountStageDecor(){
    if(!stageEl) return;
    if(!stageEl.querySelector(".laneEdge.left")){
      const L = document.createElement("div");
      L.className = "laneEdge left";
      stageEl.appendChild(L);
    }
    if(!stageEl.querySelector(".laneEdge.right")){
      const R = document.createElement("div");
      R.className = "laneEdge right";
      stageEl.appendChild(R);
    }
    if(!stageEl.querySelector(".hitBand")){
      const B = document.createElement("div");
      B.className = "hitBand";
      stageEl.appendChild(B);
    }
  }

  function init(){
    resize();
    mountStageDecor();

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
