/* di.js — DiCo ARU Phase1 (Taiko-ish)
   - 判定は ms ではなく px（見た目どおり：円の中=GOOD / 中心=GREAT）
   - 譜面にメリハリ：8分/16分連打/3連/間
   - 大ノーツ=HOLD（長押し）
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

  const resultScore = document.getElementById("resultScore");
  const resultMaxCombo = document.getElementById("resultMaxCombo");
  const aruProg = document.getElementById("aruProg");
  const aruValue = document.getElementById("aruValue");
  const dicoLine = document.getElementById("dicoLine");

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const restartBtn = document.getElementById("restartBtn");
  const ariaLive = document.getElementById("ariaLive");

  if(!app || !canvas || !ctx || !music) return;

  // ===== Config =====
  const CFG = Object.freeze({
    BPM: 145,
    BEAT: 60 / 145,

    HIT_Y_RATIO: 0.78,

    NOTE_SPEED: 640,     // px/sec（少し速く、気持ちよく）
    TAP_R: 12,
    HOLD_R: 18,

    // 判定は「円の中=GOOD」「中心=GREAT」を“px”で保証する
    GREAT_PX: 14,         // 中心判定
    GOOD_PX: 42,          // 円の中判定（＝外円）
    TAP_ACCEPT_R: 160,    // ターゲット円の中タップのみ受け付け（誤タップ抑制）

    SCORE_GREAT: 100,
    SCORE_GOOD:  60,

    ARU_MAX: 100,
    ARU_ADD_GREAT: 3,
    ARU_ADD_GOOD:  1,

    FALL_LEAD: 1.4,
    DURATION_FALLBACK: 70,

    DPR_MAX: 2,
    DRAW_PAD: 140,
  });

  // ===== State =====
  const S = {
    running:false,
    primed:false,
    starting:false,
    raf:0,

    w:0,h:0,dpr:1,

    // notes: {t, type:'tap'|'hold', dur, hit, holdState}
    notes:[],
    startTime:0,
    duration:CFG.DURATION_FALLBACK,

    score:0,
    combo:0,
    maxCombo:0,
    aru:0,

    // hold input
    holding:false,
    holdNote:null,
    pointerDown:false,
    pointerX:0,
    pointerY:0,
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

  // ===== FX =====
  function flashTarget(kind){
    if(!targetRoot) return;
    targetRoot.classList.remove("good","great");
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
    if(kind === "GOOD") judge.classList.add("show","good");
    else if(kind === "GREAT") judge.classList.add("show","great");
    else judge.classList.add("show");
    clearTimeout(judgeTimer);
    judgeTimer = setTimeout(()=> judge.classList.remove("show","good","great"), 460);
  }

  function playSe(kind){
    if(seTap){
      try{ seTap.currentTime = 0; seTap.play().catch(()=>{}); }catch{}
    }
    if(kind === "GREAT" && seGreat){
      try{ seGreat.currentTime = 0; seGreat.play().catch(()=>{}); }catch{}
    }
  }

  // ===== Scoring =====
  function applyHit(kind){
    if(kind === "GREAT"){
      S.score += CFG.SCORE_GREAT;
      S.aru = clamp(S.aru + CFG.ARU_ADD_GREAT, 0, CFG.ARU_MAX);
    }else{
      S.score += CFG.SCORE_GOOD;
      S.aru = clamp(S.aru + CFG.ARU_ADD_GOOD, 0, CFG.ARU_MAX);
    }

    S.combo++;
    if(S.combo > S.maxCombo) S.maxCombo = S.combo;

    if(scoreEl) scoreEl.textContent = String(S.score);
    if(comboEl) comboEl.textContent = String(S.combo);
    if(maxComboEl) maxComboEl.textContent = String(S.maxCombo);

    flashTarget(kind);
    showJudge(kind, "SYNC");
    playSe(kind);

    if("vibrate" in navigator) navigator.vibrate(kind === "GREAT" ? 12 : 8);
  }

  function applyMiss(){
    S.combo = 0;
    if(comboEl) comboEl.textContent = "0";
    showJudge("MISS", "NO SYNC");
    if("vibrate" in navigator) navigator.vibrate(10);
  }

  // ===== Chart (Taiko-ish patterns) =====
  function buildNotes(){
    S.notes.length = 0;

    // 例：70秒の中に “譜面ブロック” を並べる（Phase1）
    // t: 秒
    // - 8分: 1/2 beat
    // - 16分: 1/4 beat（連打）
    let t = 1.0;

    const beat = CFG.BEAT;

    function addTap(beats=1){
      S.notes.push({ t, type:"tap", dur:0, hit:false });
      t += beat * beats;
    }

    function addBurst16(count){
      for(let i=0;i<count;i++){
        S.notes.push({ t, type:"tap", dur:0, hit:false });
        t += beat * 0.5; // 16分相当（BPM145で気持ちよい連打）
      }
    }

    function addTriplet(){
      // 3連：1拍を3等分
      const step = beat / 3;
      for(let i=0;i<3;i++){
        S.notes.push({ t, type:"tap", dur:0, hit:false });
        t += step;
      }
    }

    function addHold(beats=2){
      // HOLD: 開始ノーツ + 持続（beats拍ぶん）
      S.notes.push({ t, type:"hold", dur: beat * beats, hit:false, holdState:"idle" });
      t += beat * beats; // 次は終点後に続く
    }

    // --- Intro: 8分で慣らし ---
    for(let i=0;i<8;i++) addTap(0.5);

    // --- 間（呼吸） ---
    t += beat * 1.0;

    // --- 16分連打（太鼓っぽさ） ---
    addBurst16(12);

    // --- 3連＋間 ---
    t += beat * 0.5;
    addTriplet();
    t += beat * 0.5;
    addTriplet();

    // --- HOLD（大ノーツ） ---
    t += beat * 0.5;
    addHold(2);   // 2拍長押し
    t += beat * 0.5;

    // --- 8分→16分→8分でメリハリ ---
    for(let i=0;i<6;i++) addTap(0.5);
    addBurst16(8);
    for(let i=0;i<6;i++) addTap(0.5);

    // 足りない分は8分で埋める（単調回避で時々3連・HOLDを差す）
    while(t < (S.duration - 1.0)){
      addTap(0.5);
      if(Math.random() < 0.12) addTriplet();
      if(Math.random() < 0.10) addHold(1.5);
      if(Math.random() < 0.10) addBurst16(6);
    }

    // 時間でソート
    S.notes.sort((a,b)=>a.t-b.t);
  }

  // ===== Position-based judgement core =====
  function getHitY(){ return S.h * CFG.HIT_Y_RATIO; }

  function noteY(note, now){
    const hitY = getHitY();
    const diff = note.t - now;          // note is scheduled at t
    return hitY - diff * CFG.NOTE_SPEED;
  }

  function findClosestActiveNote(now){
    let best=null;
    let bestAbs=1e9;

    for(const n of S.notes){
      if(n.hit) continue;

      // HOLDの終点管理：終点を過ぎたらミス（保持してなければ）
      if(n.type==="hold" && n.holdState!=="done"){
        // start window: note.t around hit
        const y = noteY(n, now);
        const dy = Math.abs(y - getHitY());
        if(dy < bestAbs){
          bestAbs = dy;
          best = n;
        }
        continue;
      }

      // TAP
      const y = noteY(n, now);
      const dy = Math.abs(y - getHitY());
      if(dy < bestAbs){
        bestAbs = dy;
        best = n;
      }
    }

    return { note: best, dy: bestAbs };
  }

  function isTapInsideTarget(px, py){
    const cx = S.w / 2;
    const cy = getHitY();
    const dx = px - cx;
    const dy = py - cy;
    return (dx*dx + dy*dy) <= (CFG.TAP_ACCEPT_R * CFG.TAP_ACCEPT_R);
  }

  function judgeByDy(dy){
    if(dy <= CFG.GREAT_PX) return "GREAT";
    if(dy <= CFG.GOOD_PX)  return "GOOD";
    return "MISS";
  }

  function startHolding(note){
    S.holding = true;
    S.holdNote = note;
    note.holdState = "holding";
    if(targetRoot) targetRoot.classList.add("holding");
    showJudge("HOLD", "KEEP");
  }

  function finishHolding(successKind){
    const n = S.holdNote;
    if(!n) return;

    n.hit = true;
    n.holdState = "done";

    S.holding = false;
    S.holdNote = null;

    if(targetRoot) targetRoot.classList.remove("holding");
    applyHit(successKind);
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
    applyMiss();
  }

  function tryHit(px, py){
    if(!S.running) return;

    // ターゲット円の中以外は無視（誤タップ減）
    if(!isTapInsideTarget(px, py)){
      // 外を叩いたらMISS出したくないならreturn;（太鼓っぽくするなら無視が気持ちいい）
      return;
    }

    const now = music.currentTime;
    const { note, dy } = findClosestActiveNote(now);
    if(!note) return;

    // HOLDの開始判定
    if(note.type === "hold"){
      const kind = judgeByDy(dy);
      if(kind === "MISS") return; // 中に入ってない

      // HOLD開始
      startHolding(note);
      // ここは“開始”なのでSE軽め
      playSe("GOOD");
      return;
    }

    // TAP
    const kind = judgeByDy(dy);
    if(kind === "MISS"){
      // 太鼓っぽく「空打ち=無反応」にしたいなら applyMiss() を消す
      applyMiss();
      return;
    }

    note.hit = true;
    applyHit(kind);
  }

  // ===== Render =====
  function draw(){
    if(!S.running) return;

    ctx.clearRect(0,0,S.w,S.h);

    const now = music.currentTime;
    const hitY = getHitY();
    const cx = S.w / 2;

    const remain = Math.max(0, S.duration - now);
    if(timeEl) timeEl.textContent = remain.toFixed(1);

    // ノーツ描画 & 自動MISS（画面を過ぎた）
    for(const n of S.notes){
      if(n.hit) continue;

      const y = noteY(n, now);
      if(y < -CFG.DRAW_PAD || y > S.h + CFG.DRAW_PAD) continue;

      // TAP: GOOD判定を過ぎたらMISS扱い（ただし、太鼓っぽく“MISS表示しない”ならここを静かに処理）
      if(n.type==="tap"){
        if((now - n.t) * CFG.NOTE_SPEED > CFG.GOOD_PX + 18){
          n.hit = true;
          applyMiss();
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

      // HOLD: 大きいノーツ
      if(n.type==="hold"){
        // HOLD中は中心に吸い寄せるように見えるリングを描く
        ctx.beginPath();
        ctx.arc(cx, y, CFG.HOLD_R, 0, Math.PI*2);
        ctx.fillStyle = "rgba(230,201,107,0.30)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, y, CFG.HOLD_R + 14, 0, Math.PI*2);
        ctx.strokeStyle = "rgba(230,201,107,0.22)";
        ctx.lineWidth = 3;
        ctx.stroke();

        // HOLDが開始されているなら、終点まで維持チェック
        if(n.holdState==="holding"){
          const endT = n.t + n.dur;
          // 離したら失敗（pointerDown false で failHolding）
          if(!S.pointerDown){
            failHolding();
            continue;
          }
          // 終点到達で成功（終点時の位置も中心ならGREAT寄りにする）
          if(now >= endT){
            // 終点の“見た目”に合わせて GREAT/GOOD を決める（ほぼGREATになる）
            finishHolding("GREAT");
            continue;
          }
        }

        // HOLDが開始できずに通過したらMISS
        if(n.holdState==="idle"){
          if((now - n.t) * CFG.NOTE_SPEED > CFG.GOOD_PX + 18){
            n.hit = true;
            applyMiss();
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
    S.score=0; S.combo=0; S.maxCombo=0; S.aru=0;
    if(scoreEl) scoreEl.textContent="0";
    if(comboEl) comboEl.textContent="0";
    if(maxComboEl) maxComboEl.textContent="0";
    if(timeEl) timeEl.textContent="--";
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

    const pct = clamp(S.aru,0,100);
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

  // ===== Input (canvas only) =====
  function pointerPos(e){
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top)
    };
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

    // HOLD中に離したら失敗（太鼓っぽい）
    if(S.holding){
      failHolding();
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown, { passive:false });
  canvas.addEventListener("pointerup", onPointerUp, { passive:false });
  canvas.addEventListener("pointercancel", ()=>{ S.pointerDown=false; if(S.holding) failHolding(); }, { passive:true });
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
