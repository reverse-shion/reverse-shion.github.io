/* di.js — DiCo ARU Phase1 (Base)
   - 中央神域：意味UIを置かない（判定はターゲット上に一瞬）
   - 1 lane / GREAT & GOOD / 光＋SEで中毒性
   - requestAnimationFrame only
   - iOS: prime media on user gesture, tap is canvas only
   - ARU energy: 抽象→可視化（結果画面のみリング表示）
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
  const seGreat = document.getElementById("seGreat");

  const scoreEl = document.getElementById("score");
  const comboEl = document.getElementById("combo");
  const maxComboEl = document.getElementById("maxCombo");
  const timeEl = document.getElementById("time");

  const targetRoot = document.getElementById("targetRoot");
  const judge = document.getElementById("judge");
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

  if(!app || !canvas || !ctx || !music || !startBtn || !stopBtn || !restartBtn){
    console.error("[di.js] Missing required elements.");
    return;
  }

  // ===== Config (feel-good) =====
  const CFG = Object.freeze({
    BPM: 145,
    BEAT: 60 / 145,

    HIT_Y_RATIO: 0.78,

    NOTE_SPEED: 610,   // px per sec (爽快)
    NOTE_RADIUS: 12,

    // judgement windows (sec)
    GREAT: 0.060,  // ±60ms
    GOOD:  0.120,  // ±120ms

    // scoring
    SCORE_GREAT: 100,
    SCORE_GOOD:  60,
    COMBO_BONUS_GREAT: 6,
    COMBO_BONUS_GOOD:  3,

    // run
    FALL_LEAD: 1.2,      // spawn lead (sec)
    DURATION_FALLBACK: 60,

    // ARU (hidden during play; shown only on result)
    ARU_MAX: 100,
    ARU_ADD_GREAT: 3,
    ARU_ADD_GOOD:  1,

    // canvas
    DPR_MAX: 2,
    DRAW_PAD: 120
  });

  // ===== State =====
  const S = {
    running:false,
    primed:false,
    starting:false,
    raf:0,

    w:0,h:0,dpr:1,

    notes:[],
    nextBeatTime: 0,
    startTime: 0,

    score:0,
    combo:0,
    maxCombo:0,

    aru:0,

    // input
    pointerDown:false,
  };

  // ===== Utils =====
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));

  function setVhVar(){
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  function resize(){
    setVhVar();
    S.dpr = Math.min(CFG.DPR_MAX, window.devicePixelRatio || 1);
    S.w = window.innerWidth;
    S.h = window.innerHeight;

    const stageTop = 0; // canvas is stage-only; we just use full stage area via CSS size
    canvas.width  = Math.floor(S.w * S.dpr);
    canvas.height = Math.floor(S.h * S.dpr);
    canvas.style.width = `${S.w}px`;
    canvas.style.height = `${S.h}px`;
    ctx.setTransform(S.dpr,0,0,S.dpr,0,0);
  }
  window.addEventListener("resize", resize, { passive:true });
  resize();

  function setState(state){
    app.dataset.state = state;
  }

  function announce(msg){
    if(ariaLive) ariaLive.textContent = msg;
  }

  // iOS prime
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

    // video prime (muted)
    if(bgVideo){
      bgVideo.playsInline = true;
      bgVideo.muted = true;
      await safePlay(bgVideo);
      bgVideo.pause();
      bgVideo.currentTime = 0;
    }
    // audio prime
    await safePlay(music);
    music.pause();
    music.currentTime = 0;

    // se prime (optional)
    try{
      seTap && (seTap.volume = 0.9);
      seGreat && (seGreat.volume = 0.9);
    }catch{}

    return true;
  }

  // ===== Notes =====
  function spawnNote(atTime){
    // one lane center
    S.notes.push({
      t: atTime,
      hit:false
    });
  }

  function buildNotes(){
    S.notes.length = 0;
    // beat grid start after a short intro
    S.nextBeatTime = 1.0;
    // generate ahead in render loop
  }

  // ===== FX =====
  function flashTarget(kind){
    if(!targetRoot) return;
    targetRoot.classList.remove("good","great");
    // reflow
    void targetRoot.offsetWidth;
    targetRoot.classList.add(kind === "GREAT" ? "great" : "good");
  }

  let judgeTimer = 0;
  function showJudge(kind, sub){
    if(!judge) return;
    judge.classList.remove("show","good","great");
    judgeMain.textContent = kind;
    judgeSub.textContent = sub || "SYNC";
    void judge.offsetWidth;
    judge.classList.add("show", kind === "GREAT" ? "great" : "good");
    clearTimeout(judgeTimer);
    judgeTimer = setTimeout(()=> judge.classList.remove("show","good","great"), 460);
  }

  function playSe(kind){
    // tap always
    if(seTap){
      try{
        seTap.currentTime = 0;
        seTap.play().catch(()=>{});
      }catch{}
    }
    // great overlay
    if(kind === "GREAT" && seGreat){
      try{
        seGreat.currentTime = 0;
        seGreat.play().catch(()=>{});
      }catch{}
    }
  }

  // ===== Scoring =====
  function applyHit(kind){
    // score
    if(kind === "GREAT"){
      S.score += CFG.SCORE_GREAT + (S.combo * CFG.COMBO_BONUS_GREAT);
      S.aru = clamp(S.aru + CFG.ARU_ADD_GREAT, 0, CFG.ARU_MAX);
    }else{
      S.score += CFG.SCORE_GOOD + (S.combo * CFG.COMBO_BONUS_GOOD);
      S.aru = clamp(S.aru + CFG.ARU_ADD_GOOD, 0, CFG.ARU_MAX);
    }

    // combo
    S.combo++;
    if(S.combo > S.maxCombo) S.maxCombo = S.combo;

    // UI
    scoreEl && (scoreEl.textContent = String(S.score));
    comboEl && (comboEl.textContent = String(S.combo));
    maxComboEl && (maxComboEl.textContent = String(S.maxCombo));

    flashTarget(kind);
    showJudge(kind, "SYNC");
    playSe(kind);

    // tiny time-slice “feel” without stalling logic: micro vibration (optional)
    if("vibrate" in navigator){
      navigator.vibrate(kind === "GREAT" ? 12 : 8);
    }
  }

  function applyMiss(){
    S.combo = 0;
    comboEl && (comboEl.textContent = "0");
    showJudge("MISS", "NO SYNC");
    if("vibrate" in navigator) navigator.vibrate(10);
  }

  // ===== Judge press =====
  function tryHit(){
    if(!S.running) return;
    const t = music.currentTime;

    // find closest active note
    let best = null;
    let bestD = 999;

    // small scan window around t (performance fine for Phase1)
    for(const n of S.notes){
      if(n.hit) continue;
      const d = Math.abs(n.t - t);
      if(d < bestD){
        bestD = d;
        best = n;
      }
      // early break if notes are in time order and far ahead (optional)
    }

    if(!best) return applyMiss();

    if(bestD <= CFG.GREAT){
      best.hit = true;
      applyHit("GREAT");
      return;
    }
    if(bestD <= CFG.GOOD){
      best.hit = true;
      applyHit("GOOD");
      return;
    }

    applyMiss();
  }

  // ===== Render =====
  function draw(){
    if(!S.running) return;

    ctx.clearRect(0,0,S.w,S.h);

    const t = music.currentTime;
    const hitY = S.h * CFG.HIT_Y_RATIO;
    const cx = S.w / 2;

    // time
    const remain = Math.max(0, S.duration - t);
    timeEl && (timeEl.textContent = remain.toFixed(1));

    // generate notes ahead
    while(S.nextBeatTime < t + CFG.FALL_LEAD){
      spawnNote(S.nextBeatTime);
      S.nextBeatTime += CFG.BEAT;
    }

    // draw notes
    const missLine = CFG.GOOD; // auto-miss when past this window
    for(const n of S.notes){
      if(n.hit) continue;

      const diff = n.t - t;
      const y = hitY - diff * CFG.NOTE_SPEED;

      if(y < -CFG.DRAW_PAD || y > S.h + CFG.DRAW_PAD) continue;

      // auto miss (passed)
      if(diff < -missLine){
        n.hit = true;
        applyMiss();
        continue;
      }

      // body
      ctx.beginPath();
      ctx.arc(cx, y, CFG.NOTE_RADIUS, 0, Math.PI*2);
      ctx.fillStyle = "rgba(0,240,255,0.88)";
      ctx.fill();

      // halo
      ctx.beginPath();
      ctx.arc(cx, y, CFG.NOTE_RADIUS + 8, 0, Math.PI*2);
      ctx.strokeStyle = "rgba(0,240,255,0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // end
    if(t >= S.duration - 0.02){
      endGame();
      return;
    }

    S.raf = requestAnimationFrame(draw);
  }

  // ===== Run control =====
  function resetRun(){
    S.score = 0;
    S.combo = 0;
    S.maxCombo = 0;
    S.aru = 0;

    scoreEl && (scoreEl.textContent = "0");
    comboEl && (comboEl.textContent = "0");
    maxComboEl && (maxComboEl.textContent = "0");
    timeEl && (timeEl.textContent = "--");

    if(result) result.setAttribute("aria-hidden","true");
  }

  async function startGame(){
    if(S.starting) return;
    S.starting = true;

    await primeMedia();

    // duration
    S.duration = (Number.isFinite(music.duration) && music.duration > 5)
      ? music.duration
      : CFG.DURATION_FALLBACK;

    resetRun();
    buildNotes();

    // start media (must be user gesture)
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
    S.running = false;
    cancelAnimationFrame(S.raf);
    try{ music.pause(); }catch{}
    try{ bgVideo && bgVideo.pause(); }catch{}
    setState("idle");
    announce("Ready. Tap START.");
  }

  async function restartGame(){
    stopGame();
    await startGame();
  }

  function endGame(){
    S.running = false;
    cancelAnimationFrame(S.raf);
    try{ music.pause(); }catch{}
    try{ bgVideo && bgVideo.pause(); }catch{}

    // result view
    setState("result");

    if(resultScore) resultScore.textContent = String(S.score);
    if(resultMaxCombo) resultMaxCombo.textContent = String(S.maxCombo);

    // ARU ring (result only)
    const pct = clamp(S.aru, 0, 100);
    if(aruValue) aruValue.textContent = `${pct.toFixed(0)}%`;

    // stroke progress
    // circumference ~ 276.46 (r=44)
    if(aruProg){
      const C = 276.46;
      const offset = C * (1 - pct/100);
      aruProg.style.strokeDasharray = String(C);
      aruProg.style.strokeDashoffset = String(offset);
    }

    // positive lines only
    if(dicoLine){
      const lines = [
        "しーちゃんに、君の想いは届いたよ。",
        "こんなに想ってくれて、ありがとう。",
        "今日の共鳴、ちゃんと残ったよ。",
        "大丈夫。次はもっと光る。"
      ];
      // choose by score tier
      const pick = (S.score >= 3500) ? 1 : (S.score >= 1800) ? 0 : (S.score >= 800) ? 2 : 3;
      dicoLine.textContent = lines[pick];
    }

    announce("Run complete.");
  }

  // ===== Input (canvas only) =====
  function onPointerDown(e){
    if(!S.primed) primeMedia();
    if(S.running) e.preventDefault();
    S.pointerDown = true;
    tryHit();
  }
  function onPointerUp(e){
    if(S.running) e.preventDefault();
    S.pointerDown = false;
  }

  canvas.addEventListener("pointerdown", onPointerDown, { passive:false });
  canvas.addEventListener("pointerup", onPointerUp, { passive:false });
  canvas.addEventListener("pointercancel", ()=>{ S.pointerDown=false; }, { passive:true });

  // iOS insurance: prevent zoom/scroll
  canvas.addEventListener("touchstart", (e)=>{ if(S.running) e.preventDefault(); }, { passive:false });

  // ===== Buttons =====
  startBtn.addEventListener("click", startGame);
  stopBtn.addEventListener("click", stopGame);
  restartBtn.addEventListener("click", restartGame);

  // ===== Init =====
  function init(){
    setVhVar();
    setState("idle");
    resetRun();
    announce("Ready. Tap START.");

    // try load metadata
    music.addEventListener("loadedmetadata", ()=>{
      if(Number.isFinite(music.duration) && music.duration > 5) S.duration = music.duration;
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, { once:true });
  }else{
    init();
  }
})();
