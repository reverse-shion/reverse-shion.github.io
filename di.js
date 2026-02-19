/* di.js — DiCo ARU Phase1 (Taiko-ish) + GREAT露出UP＆粒子吸い込み（ARU起動感）
   ✅ 判定は ms ではなく px（見た目どおり：円の中=GOOD / 中心=GREAT）
   ✅ ターゲット円の中タップだけ受付（誤タップ抑制）
   ✅ “円の中で叩いたのにMISS”を潰す：MISSは「譜面を逃した時のみ」表示（空打ちは無反応）
   ✅ 譜面にメリハリ：8分/16分連打/3連/間 + 大ノーツ=HOLD（長押し）
   ✅ GREAT演出：露出アップ + 粒子吸い込み（視覚×聴覚でARU起動感）
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
  // 互換：seGreat が無ければ sePerfect / se_god を拾う
  const seGreat = document.getElementById("seGreat")
                || document.getElementById("sePerfect")
                || document.getElementById("se_great")
                || document.getElementById("seGod");

  const scoreEl = document.getElementById("score");
  const comboEl = document.getElementById("combo");
  const maxComboEl = document.getElementById("maxCombo");
  const timeEl = document.getElementById("time");

  const targetRoot = document.getElementById("targetRoot");
  const judge = document.getElementById("judge") || document.getElementById("judgeText");
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

  const fxLayer = document.getElementById("fxLayer");

  if(!app || !canvas || !ctx || !music) return;

  // ===== Config =====
  const CFG = Object.freeze({
    BPM: 145,
    BEAT: 60 / 145,

    HIT_Y_RATIO: 0.78,

    NOTE_SPEED: 640,     // px/sec
    TAP_R: 12,
    HOLD_R: 18,

    // 判定は px で保証（中心=GREAT / 円内=GOOD）
    GREAT_PX: 14,         // 中心判定
    GOOD_PX: 42,          // 円の中判定
    // ターゲット内の“受付円”（これより外は完全無視）
    TAP_ACCEPT_R: 160,

    // 「円内で叩いたのにMISS」対策：ヒット対象にできる最大dy
    HIT_WINDOW_PX: 64,    // GOOD_PXより少し余裕（取り逃がしを減らす）

    SCORE_GREAT: 100,
    SCORE_GOOD:  60,

    ARU_MAX: 100,
    ARU_ADD_GREAT: 3,
    ARU_ADD_GOOD:  1,

    FALL_LEAD: 1.4,
    DURATION_FALLBACK: 70,

    DPR_MAX: 2,
    DRAW_PAD: 140,

    // GREAT FX
    EXPOSURE_MS: 140,
    PFX_DPR_MAX: 2,
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

    resizeFx();
  }
  window.addEventListener("resize", resize, { passive:true });

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

  // ===== Hit Geometry =====
  function getHitY(){ return S.h * CFG.HIT_Y_RATIO; }

  function isTapInsideTarget(px, py){
    const cx = S.w / 2;
    const cy = getHitY();
    const dx = px - cx;
    const dy = py - cy;
    return (dx*dx + dy*dy) <= (CFG.TAP_ACCEPT_R * CFG.TAP_ACCEPT_R);
  }

  // ===== FX: target & judge =====
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
    if(judgeMain) judgeMain.textContent = kind;
    if(judgeSub)  judgeSub.textContent  = sub || "SYNC";
    void judge.offsetWidth;
    if(kind === "GOOD") judge.classList.add("show","good");
    else if(kind === "GREAT") judge.classList.add("show","great");
    else judge.classList.add("show");
    clearTimeout(judgeTimer);
    judgeTimer = setTimeout(()=> judge.classList.remove("show","good","great"), 460);
  }

  function playSe(kind){
    // タップは常に軽く
    if(seTap){
      try{ seTap.currentTime = 0; seTap.play().catch(()=>{}); }catch{}
    }
    // GREAT時だけ“上乗せ”
    if(kind === "GREAT" && seGreat){
      try{ seGreat.currentTime = 0; seGreat.play().catch(()=>{}); }catch{}
    }
  }

  // ===== GREAT FX: exposure + particle suck =====
  // ---- FX canvas (tap-through) ----
  let fxCanvas = null;
  let fctx = null;
  let fxDpr = 1;

  function ensureFxCanvas(){
    if(fxCanvas) return;
    fxCanvas = document.createElement("canvas");
    fxCanvas.id = "fxCanvas";
    fxCanvas.style.position = "absolute";
    fxCanvas.style.inset = "0";
    fxCanvas.style.zIndex = "10";          // HUDより下/上は好み。tapは取らない
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

  const PFX = { list: [], on:false, raf:0 };

  function spawnSuckBurst(power=1){
    ensureFxCanvas();
    if(!fctx) return;

    const cx = window.innerWidth / 2;
    const cy = getHitY();

    const count = Math.floor(14 + 18 * power);
    const R = Math.min(window.innerWidth, window.innerHeight);

    for(let i=0;i<count;i++){
      const ang = Math.random() * Math.PI * 2;
      const r = (Math.random() * 0.55 + 0.25) * R;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;

      PFX.list.push({
        x, y,
        vx: 0, vy: 0,
        life: 1,
        pull: 0.014 + Math.random() * 0.012,
        size: 1.2 + Math.random() * 2.8,
        twist: (Math.random() * 0.8 + 0.2) * (Math.random()<0.5 ? -1 : 1),
      });
    }

    if(!PFX.on){
      PFX.on = true;
      PFX.raf = requestAnimationFrame(tickPfx);
    }
  }

  function tickPfx(){
    if(!fctx || !fxCanvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = getHitY();

    fctx.clearRect(0,0,w,h);

    for(let i=PFX.list.length-1;i>=0;i--){
      const p = PFX.list[i];
      p.life -= 0.045;

      const dx = cx - p.x;
      const dy = cy - p.y;
      const dist = Math.max(12, Math.hypot(dx,dy));

      const ax = (dx / dist) * (dist * p.pull);
      const ay = (dy / dist) * (dist * p.pull);

      const tx = -dy / dist * p.twist * 0.8;
      const ty =  dx / dist * p.twist * 0.8;

      p.vx = (p.vx + ax + tx) * 0.88;
      p.vy = (p.vy + ay + ty) * 0.88;

      p.x += p.vx;
      p.y += p.vy;

      const a = Math.max(0, p.life);
      const glow = 8 * a;

      // gold core
      fctx.beginPath();
      fctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      fctx.fillStyle = `rgba(255,210,110,${0.58*a})`;
      fctx.fill();

      // cyan aura
      fctx.beginPath();
      fctx.arc(p.x, p.y, p.size + glow, 0, Math.PI*2);
      fctx.strokeStyle = `rgba(0,240,255,${0.10*a})`;
      fctx.lineWidth = 2;
      fctx.stroke();

      if(p.life <= 0 || dist < 18){
        PFX.list.splice(i,1);
      }
    }

    if(PFX.list.length){
      PFX.raf = requestAnimationFrame(tickPfx);
    }else{
      PFX.on = false;
      fctx.clearRect(0,0,w,h);
    }
  }

  let exposureTimer = 0;
  function exposureUp(){
    app.classList.add("exposureUp");
    clearTimeout(exposureTimer);
    exposureTimer = setTimeout(()=> app.classList.remove("exposureUp"), CFG.EXPOSURE_MS);
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

    // ★ ARU起動感：GREATで露出アップ + 粒子吸い込み（GOODでも弱く）
    if(kind === "GREAT"){
      exposureUp();
      spawnSuckBurst(1.0);
    }else{
      spawnSuckBurst(0.35);
    }

    if("vibrate" in navigator) navigator.vibrate(kind === "GREAT" ? 12 : 8);
  }

  function applyMiss(show=true){
    // “円内で叩いたのにMISS”を消すため
    // MISS表示は「譜面を逃した時のみ」＝ draw側の自動MISSで呼ぶ
    S.combo = 0;
    if(comboEl) comboEl.textContent = "0";
    if(show){
      showJudge("MISS", "NO SYNC");
      if("vibrate" in navigator) navigator.vibrate(10);
    }
  }

  // ===== Chart (Taiko-ish patterns) =====
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
        t += beat * 0.5; // 16分（体感連打）
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

    // --- Intro: 8分 ---
    for(let i=0;i<8;i++) addTap(0.5);

    // --- 間 ---
    t += beat * 1.0;

    // --- 連打（太鼓感） ---
    addBurst16(12);

    // --- 3連×2 ---
    t += beat * 0.5;
    addTriplet();
    t += beat * 0.5;
    addTriplet();

    // --- HOLD ---
    t += beat * 0.5;
    addHold(2);
    t += beat * 0.5;

    // --- メリハリ ---
    for(let i=0;i<6;i++) addTap(0.5);
    addBurst16(8);
    for(let i=0;i<6;i++) addTap(0.5);

    // --- 以降はブロックをランダム混ぜ（単調回避） ---
    while(t < (S.duration - 1.0)){
      addTap(0.5);

      // “太鼓の達人っぽい”アクセント頻度
      if(Math.random() < 0.16) addBurst16(6);
      if(Math.random() < 0.14) addTriplet();
      if(Math.random() < 0.12) addHold(1.5);

      // 呼吸（間）も入れる
      if(Math.random() < 0.10) t += beat * 0.5;
    }

    S.notes.sort((a,b)=>a.t-b.t);
  }

  // ===== Position-based judgement core =====
  function noteY(note, now){
    const hitY = getHitY();
    const diff = note.t - now;
    return hitY - diff * CFG.NOTE_SPEED;
  }

  // “叩ける範囲”のノーツだけ候補にする（ズレMISS対策の要）
  function findHittableNote(now){
    let best=null;
    let bestAbs=1e9;

    for(const n of S.notes){
      if(n.hit) continue;

      const y = noteY(n, now);
      const dy = Math.abs(y - getHitY());

      // ヒット可能窓を超えているノーツは候補にしない
      if(dy > CFG.HIT_WINDOW_PX) continue;

      // HOLDは開始時だけ狙う（holding中は別処理）
      if(n.type==="hold" && n.holdState==="holding") continue;

      if(dy < bestAbs){
        bestAbs = dy;
        best = n;
      }
    }

    return { note: best, dy: bestAbs };
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
    applyMiss(true);
  }

  function tryHit(px, py){
    if(!S.running) return;

    // ターゲット円の中以外は完全無視（太鼓っぽい“空打ち無反応”）
    if(!isTapInsideTarget(px, py)) return;

    const now = music.currentTime;

    // HOLD中：押し続けるだけ（追加判定なし）
    if(S.holding){
      // 連打でMISSが出ないよう、ここは無反応
      return;
    }

    const { note, dy } = findHittableNote(now);
    if(!note) return; // 叩くタイミングにノーツが無い＝無反応が気持ちいい

    // HOLD開始
    if(note.type === "hold"){
      const kind = judgeByDy(dy);
      if(kind === "MISS") return; // 中でも、窓外なら無反応
      startHolding(note);
      playSe("GOOD");
      return;
    }

    // TAP
    const kind = judgeByDy(dy);
    if(kind === "MISS"){
      // “円内で叩いたのにMISS”を避ける：窓内以外は候補にならないので原則ここに来ない
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

    const remain = Math.max(0, S.duration - now);
    if(timeEl) timeEl.textContent = remain.toFixed(1);

    const cx = S.w / 2;

    // ノーツ描画 & 自動MISS（通過）
    for(const n of S.notes){
      if(n.hit) continue;

      const y = noteY(n, now);

      if(y < -CFG.DRAW_PAD || y > S.h + CFG.DRAW_PAD) continue;

      // TAP
      if(n.type==="tap"){
        // 通過MISS：GOOD窓を超えたらMISS（ここだけは表示）
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

      // HOLD
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

          // 押してない＝失敗
          if(!S.pointerDown){
            failHolding();
            continue;
          }

          // 終点到達：成功（Phase1は基本GREATで気持ちよく）
          if(now >= endT){
            finishHolding("GREAT");
            continue;
          }
        }

        // 開始できずに通過：MISS（表示）
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

    // FX canvasもここで確実に生成
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

    // PFX stop
    if(PFX.on){
      cancelAnimationFrame(PFX.raf);
      PFX.on = false;
      PFX.list.length = 0;
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
    // client座標→CSSピクセル（判定はCSSピクセルで統一）
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

    // HOLD中に離したら失敗（太鼓感）
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

    // 初期からFX準備（任意）
    ensureFxCanvas();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, { once:true });
  }else{
    init();
  }
})();
