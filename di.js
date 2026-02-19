(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const app = $("app");
  const canvas = $("noteCanvas");
  const ctx = canvas?.getContext("2d", { alpha: true });
  const music = $("music");
  const bgVideo = $("bgVideo");

  const startBtn = $("startBtn");
  const stopBtn = $("stopBtn");
  const restartBtn = $("restartBtn");

  const scoreEl = $("score");
  const comboEl = $("combo");
  const timeEl = $("time");
  const feverFill = $("feverFill");
  const feverText = $("feverText");

  const targetRoot = $("targetRoot");
  const judgeText = $("judgeText");
  const judgeMain = $("judgeMain");
  const judgeSub = $("judgeSub");

  const upgradeOverlay = $("upgradeOverlay");
  const seTap = $("seTap");
  const sePerfect = $("sePerfect");

  if (!app || !canvas || !ctx || !music || !startBtn || !stopBtn || !restartBtn) return;

  const CFG = {
    BPM: 145,
    BEAT: 60 / 145,
    HIT_Y_RATIO: 0.74,
    NOTE_RADIUS: 12,
    NOTE_SPEED: 430,
    GREAT_WINDOW: 0.075,
    GOOD_WINDOW: 0.145,
    PREVIEW_SEC: 1.45,
    SCORE_UPGRADE_THRESHOLD: 4000,
    FREEZE_MS: 440,
    CUTIN_MS: 900,
    DIFF_MULTIPLIER: 1.2
  };

  const S = {
    state: "idle",
    running: false,
    upgrading: false,
    upgraded: false,
    raf: 0,
    w: 0,
    h: 0,
    dpr: 1,
    score: 0,
    combo: 0,
    fever: 0,
    speedMul: 1,
    notes: [],
    noteIndex: 0
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function setVhVar() {
    document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
  }

  function resize() {
    setVhVar();
    S.dpr = Math.min(2, window.devicePixelRatio || 1);
    S.w = window.innerWidth;
    S.h = window.innerHeight;
    canvas.width = Math.floor(S.w * S.dpr);
    canvas.height = Math.floor(S.h * S.dpr);
    canvas.style.width = `${S.w}px`;
    canvas.style.height = `${S.h}px`;
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  }

  function setUIState(next) {
    S.state = next;
    app.dataset.state = next;
    startBtn.disabled = next !== "idle";
    stopBtn.disabled = next === "idle";
    restartBtn.disabled = next === "idle";
  }

  function resetGameStats() {
    S.score = 0;
    S.combo = 0;
    S.fever = 0;
    S.speedMul = 1;
    S.noteIndex = 0;
    S.upgrading = false;
    S.upgraded = false;
    document.body.classList.remove("tier2");
    app.dataset.tier = "1";
    if (scoreEl) scoreEl.textContent = "0";
    if (comboEl) comboEl.textContent = "0";
    if (timeEl) timeEl.textContent = "--";
    if (feverText) feverText.textContent = "0%";
    if (feverFill) feverFill.style.width = "0%";
  }

  function buildNotes() {
    const duration = Number.isFinite(music.duration) && music.duration > 20 ? music.duration : 60;
    const notes = [];
    let t = 1.6;
    while (t < duration - 0.8) {
      const burst = Math.random() < 0.2;
      if (burst) {
        notes.push({ time: t, hit: false });
        notes.push({ time: t + CFG.BEAT * 0.32, hit: false });
        notes.push({ time: t + CFG.BEAT * 0.64, hit: false });
        t += CFG.BEAT * (1.1 + Math.random() * 0.5);
      } else {
        notes.push({ time: t, hit: false });
        t += CFG.BEAT * (0.78 + Math.random() * 1.25);
      }
    }
    S.notes = notes;
  }

  function playSe(audio) {
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.play();
    } catch {}
  }

  function showJudge(kind, sub = "SYNC") {
    if (!judgeText) return;
    judgeMain.textContent = kind;
    judgeSub.textContent = sub;
    judgeText.classList.remove("show", "good", "great");
    void judgeText.offsetWidth;
    judgeText.classList.add("show", kind.toLowerCase());
    setTimeout(() => judgeText.classList.remove("show"), 430);
  }

  function pulseTarget(kind) {
    if (!targetRoot) return;
    targetRoot.classList.remove("hit-good", "hit-great");
    void targetRoot.offsetWidth;
    targetRoot.classList.add(kind === "great" ? "hit-great" : "hit-good");
  }

  function addSuccess(kind) {
    const great = kind === "great";
    S.combo += 1;
    S.score += great ? 340 : 210;
    S.fever = clamp(S.fever + (great ? 4.2 : 2.5), 0, 100);
    if (scoreEl) scoreEl.textContent = `${S.score}`;
    if (comboEl) comboEl.textContent = `${S.combo}`;
    if (feverText) feverText.textContent = `${Math.round(S.fever)}%`;
    if (feverFill) feverFill.style.width = `${S.fever}%`;
    showJudge(great ? "GREAT" : "GOOD", great ? "PERFECT SYNC" : "STABLE SYNC");
    pulseTarget(kind);
    playSe(great ? sePerfect : seTap);
  }

  function addMiss() {
    S.combo = 0;
    if (comboEl) comboEl.textContent = "0";
    showJudge("MISS", "OUT OF RANGE");
  }

  function currentTime() {
    return music.currentTime || 0;
  }

  function judgePress() {
    if (!S.running || S.upgrading) return;
    const t = currentTime();
    let best = null;
    let bestAbs = Infinity;
    for (let i = S.noteIndex; i < S.notes.length; i += 1) {
      const n = S.notes[i];
      if (n.hit) continue;
      const diff = n.time - t;
      const abs = Math.abs(diff);
      if (abs < bestAbs) {
        best = n;
        bestAbs = abs;
      }
      if (diff > CFG.GOOD_WINDOW + 0.2) break;
    }

    if (!best) return addMiss();
    if (bestAbs <= CFG.GREAT_WINDOW) {
      best.hit = true;
      addSuccess("great");
      return;
    }
    if (bestAbs <= CFG.GOOD_WINDOW) {
      best.hit = true;
      addSuccess("good");
      return;
    }
    addMiss();
  }

  async function runUpgradeSequence() {
    if (S.upgrading || S.upgraded || !S.running) return;
    S.upgrading = true;
    setUIState("paused");

    upgradeOverlay.dataset.on = "1";
    upgradeOverlay.dataset.phase = "freeze";
    await sleep(CFG.FREEZE_MS);

    upgradeOverlay.dataset.phase = "cutin";
    await sleep(CFG.CUTIN_MS);

    S.upgraded = true;
    S.speedMul = CFG.DIFF_MULTIPLIER;
    document.body.classList.add("tier2");
    app.dataset.tier = "2";
    if (bgVideo) {
      bgVideo.style.filter = "saturate(1.58) contrast(1.18) hue-rotate(-8deg)";
      bgVideo.style.opacity = "0.43";
    }

    upgradeOverlay.dataset.on = "0";
    upgradeOverlay.dataset.phase = "idle";
    setUIState("running");
    S.upgrading = false;
  }

  function updateHUD() {
    const duration = Number.isFinite(music.duration) && music.duration > 1 ? music.duration : 60;
    const remain = Math.max(0, duration - currentTime());
    if (timeEl) {
      const m = Math.floor(remain / 60);
      const s = Math.floor(remain % 60).toString().padStart(2, "0");
      timeEl.textContent = `${m}:${s}`;
    }
  }

  function render() {
    if (!S.running) return;
    const t = currentTime();
    const hitY = S.h * CFG.HIT_Y_RATIO;
    const speed = CFG.NOTE_SPEED * S.speedMul;

    ctx.clearRect(0, 0, S.w, S.h);

    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.moveTo(S.w * 0.18, hitY);
    ctx.lineTo(S.w * 0.82, hitY);
    ctx.stroke();

    while (S.noteIndex < S.notes.length && S.notes[S.noteIndex].time < t - CFG.GOOD_WINDOW - 0.04) {
      if (!S.notes[S.noteIndex].hit) addMiss();
      S.noteIndex += 1;
    }

    for (let i = S.noteIndex; i < S.notes.length; i += 1) {
      const n = S.notes[i];
      if (n.hit) continue;
      const dt = n.time - t;
      if (dt < -0.4) continue;
      if (dt > CFG.PREVIEW_SEC + 0.4) break;
      const y = hitY - dt * speed;
      if (y < -20 || y > S.h + 20) continue;

      const alpha = clamp(1 - Math.abs(dt) / 1.4, 0.2, 1);
      const r = CFG.NOTE_RADIUS + (Math.abs(dt) < CFG.GREAT_WINDOW ? 3 : 0);
      const grad = ctx.createRadialGradient(S.w / 2, y, 2, S.w / 2, y, r + 6);
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(0.4, `rgba(0,240,255,${alpha * 0.95})`);
      grad.addColorStop(1, "rgba(0,240,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(S.w / 2, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    updateHUD();

    if (!S.upgraded && S.score >= CFG.SCORE_UPGRADE_THRESHOLD) {
      runUpgradeSequence();
    }

    if (music.ended) {
      stopGameToIdle();
      return;
    }

    S.raf = requestAnimationFrame(render);
  }

  async function primeMedia() {
    try {
      bgVideo.muted = true;
      await bgVideo.play();
      bgVideo.pause();
      bgVideo.currentTime = 0;
    } catch {}
    try {
      await music.play();
      music.pause();
      music.currentTime = 0;
    } catch {}
  }

  async function startGame() {
    if (S.running) return;
    await primeMedia();
    resetGameStats();
    buildNotes();
    try { music.currentTime = 0; } catch {}
    try { bgVideo.currentTime = 0; } catch {}
    try { await bgVideo.play(); } catch {}
    try { await music.play(); } catch {}
    S.running = true;
    setUIState("running");
    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(render);
  }

  function stopGameToIdle() {
    S.running = false;
    S.upgrading = false;
    cancelAnimationFrame(S.raf);
    try { music.pause(); } catch {}
    try { bgVideo.pause(); } catch {}
    try { music.currentTime = 0; } catch {}
    try { bgVideo.currentTime = 0; } catch {}
    upgradeOverlay.dataset.on = "0";
    upgradeOverlay.dataset.phase = "idle";
    setUIState("idle");
    resetGameStats();
  }

  async function restartGame() {
    stopGameToIdle();
    await startGame();
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (S.running) e.preventDefault();
    judgePress();
  }, { passive: false });

  canvas.addEventListener("touchstart", (e) => {
    if (S.running) e.preventDefault();
  }, { passive: false });

  startBtn.addEventListener("click", startGame);
  stopBtn.addEventListener("click", stopGameToIdle);
  restartBtn.addEventListener("click", restartGame);

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(resize, 50), { passive: true });
  document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

  resize();
  setUIState("idle");
  resetGameStats();
})();
