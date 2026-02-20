/* /di/js/main.js (HARD-RECOVERY + PAUSE/RESUME) */
(() => {
  const BASE = new URL("./", document.currentScript?.src || location.href);

  const ENGINE_FILES = [
    "engine/audio.js",
    "engine/timing.js",
    "engine/input.js",
    "engine/judge.js",
    "engine/render.js",
    "engine/fx.js",
    "engine/ui.js",
    "notes/skin-tarot-pinkgold.js",
  ].map(p => new URL(p, BASE).toString());

  const $ = (id) => document.getElementById(id);

  // iOS当たりづらい時：0.06→0.08→0.10で調整
  const INPUT_LAT = 0.06;

  function loadScriptsSequentially(files) {
    return files.reduce((p, src) => {
      return p.then(() => new Promise((resolve, reject) => {
        const s = document.createElement("script");
        const u = new URL(src);
        u.searchParams.set("v", String(Date.now()));
        s.src = u.toString();
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load: " + src));
        document.head.appendChild(s);
      }));
    }, Promise.resolve());
  }

  async function fetchJSON(url) {
    const u = new URL(url, BASE).toString();
    const r = await fetch(u, { cache: "no-store" });
    if (!r.ok) throw new Error(`fetch failed ${u}: ${r.status}`);
    return await r.json();
  }

  function fallbackChart() {
    const notes = [];
    const bpm = 145;
    const beat = 60 / bpm;
    const start = 1.2;
    const total = 60.0;
    for (let t = start, i = 0; t < total; t += beat, i++) {
      if (i % 2 === 0) notes.push({ t: +t.toFixed(3), type: "tap" });
      if (i % 16 === 8) notes.push({ t: +(t + beat * 0.5).toFixed(3), type: "tap" });
    }
    return { meta: { title: "DiCo ARU Phase1 (fallback)", bpm }, offset: 0.0, scroll: { approach: 1.25 }, notes };
  }

  function setState(app, s) { app.dataset.state = s; }

  async function boot() {
    // ===== DOM =====
    const app = $("app");
    const canvas = $("noteCanvas");
    const hitZone = $("hitZone");
    const bgVideo = $("bgVideo");

    const startBtn = $("startBtn");
    const stopBtn = $("stopBtn");
    const restartBtn = $("restartBtn");

    const music = $("music");
    const seTap = $("seTap");
    const seGreat = $("seGreat");

    if (!app || !canvas || !hitZone || !startBtn || !stopBtn || !restartBtn || !music) {
      throw new Error("Missing required DOM elements (check ids).");
    }

    // bg video setup
    try {
      if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        bgVideo.loop = true;
      }
    } catch {}

    // chart
    let chart = null;
    try { chart = await fetchJSON("charts/chart_001.json"); }
    catch (e) { chart = fallbackChart(); console.warn("[DiCo] chart fallback", e); }

    // engine
    const E = window.DI_ENGINE;
    if (!E) throw new Error("DI_ENGINE not found.");

    console.log("[DiCo] noteSkin =", E.noteSkin?.name || "(none)");

    // systems (stable, recreateしない)
    const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });
    const fx = new E.FX({ fxLayer: $("fxLayer") });
    const ui = new E.UI({
      app,
      score: $("score"), combo: $("combo"), maxCombo: $("maxCombo"), timeDup: $("time_dup"),
      sideScore: $("sideScore"), sideCombo: $("sideCombo"), sideMaxCombo: $("sideMaxCombo"), time: $("time"),
      resValue: $("resValue"), resFill: $("resFill"), avatarRing: $("avatarRing"),
      judge: $("judge"), judgeMain: $("judgeMain"), judgeSub: $("judgeSub"),
      result: $("result"),
      resultScore: $("resultScore"), resultMaxCombo: $("resultMaxCombo"),
      aruProg: $("aruProg"), aruValue: $("aruValue"), dicoLine: $("dicoLine"),
      ariaLive: $("ariaLive"),
      hitFlash: $("hitFlash"),
    });

    // ===== GAME OBJECTS (STOP後に壊れる可能性があるので作り直せるように let) =====
    let timing = null;
    let judge = null;
    let render = null;

    function rebuildGameObjects() {
      // ✅ ここが最重要：STOP→START/RESTARTで復帰不能になるのを物理的に潰す
      timing = new E.Timing({ chart });
      judge  = new E.Judge({ chart, timing });
      render = new E.Renderer({ canvas, chart, timing });
      render.resize();
    }

    rebuildGameObjects();

    // ===== STATE =====
    // idle -> playing -> paused -> playing ... -> result
    let raf = 0;
    let running = false;
    let starting = false;

    // pause/resume用
    let pausedMusicTime = 0;
    let pausedVideoTime = 0;
    let videoWasPlaying = false;

    function stopRAF() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function tick() {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      const t = timing.getSongTime();
      // timeが壊れたら強制停止して復旧を促す
      if (!Number.isFinite(t)) {
        console.warn("[DiCo] songTime is not finite. forcing pause.");
        pauseGame();
        return;
      }

      render.draw(t);

      ui.update({
        t,
        score: judge.state.score,
        combo: judge.state.combo,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance,
        state: app.dataset.state
      });

      if (timing.isEnded(t)) endGame();
    }

    async function safePlayMedia() {
      try { await music.play(); } catch {}
      try { await bgVideo?.play(); } catch {}
    }

    function pauseMedia() {
      try { music.pause(); } catch {}
      try { bgVideo?.pause(); } catch {}
    }

    async function resetMediaToStart() {
      try { music.pause(); } catch {}
      try { music.currentTime = 0; } catch {}

      try { bgVideo?.pause(); } catch {}
      // 背景も最初に戻したいならON
      // try { bgVideo.currentTime = 0; } catch {}
    }

    // ===== ACTIONS =====

    // START: idle/resultなら最初から開始、pausedなら再開
    async function startOrResume() {
      if (starting) return;
      starting = true;

      await audio.unlock();

      const state = app.dataset.state;

      // ---- RESUME ----
      if (state === "paused") {
        // media restore
        try { music.currentTime = pausedMusicTime || 0; } catch {}
        try { await music.play(); } catch {}

        if (bgVideo) {
          try {
            bgVideo.currentTime = pausedVideoTime || 0;
            if (videoWasPlaying) await bgVideo.play();
          } catch {}
        }

        // timingは「再開」実装がない可能性があるので、startを呼んで進行を優先
        timing.start(audio);

        setState(app, "playing");
        running = true;

        ui.toast("RESUME");

        stopRAF();
        tick();

        starting = false;
        return;
      }

      // ---- START FROM BEGINNING ----
      if (state === "idle" || state === "result") {
        // ✅ ここも最重要：開始時に必ず fresh な timing/judge/render を作る
        rebuildGameObjects();

        await resetMediaToStart();

        judge.reset();
        timing.start(audio);

        setState(app, "playing");
        running = true;

        ui.hideResult();
        ui.toast("START");

        await safePlayMedia();

        stopRAF();
        tick();

        starting = false;
        return;
      }

      // playing中は無視
      starting = false;
    }

    // STOP: 一時停止
    function pauseGame() {
      if (!running) return;

      // 保存
      try { pausedMusicTime = music.currentTime || 0; } catch { pausedMusicTime = 0; }
      try { pausedVideoTime = bgVideo?.currentTime || 0; } catch { pausedVideoTime = 0; }
      try { videoWasPlaying = !!bgVideo && !bgVideo.paused; } catch { videoWasPlaying = false; }

      running = false;
      stopRAF();

      timing.stop(audio);
      pauseMedia();

      setState(app, "paused");
      ui.toast("PAUSE");
    }

    // RESTART: いつでも最初から
    async function restartGame() {
      running = false;
      stopRAF();

      try { timing.stop(audio); } catch {}
      pauseMedia();

      // ✅ ここが最重要：RESTARTで必ず復帰するように timing/judge/render を作り直す
      rebuildGameObjects();

      await resetMediaToStart();

      judge.reset();
      timing.start(audio);

      setState(app, "playing");
      running = true;

      ui.hideResult();
      ui.toast("RESTART");

      await safePlayMedia();

      stopRAF();
      tick();
    }

    function endGame() {
      running = false;
      stopRAF();
      timing.stop(audio);
      pauseMedia();

      setState(app, "result");
      ui.showResult({
        score: judge.state.score,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance
      });
      ui.toast("RESULT");
    }

    // ===== INPUT (closureは let の timing/judge/render を参照するので、rebuild後も生きる) =====
    const input = new E.Input({
      element: hitZone,
      onTap: (x, y) => {
        // playing中だけ判定
        if (!running || app.dataset.state !== "playing") return;

        audio.playTap();
        fx.burstAt(x, y);

        const t = timing.getSongTime();
        if (!Number.isFinite(t)) return;

        const res = judge.hit(t + INPUT_LAT);
        ui.onJudge(res);

        if (res && (res.name === "GREAT" || res.name === "PERFECT")) {
          audio.playGreat();
          ui.flashHit();
          fx.sparkLine();
        }
      }
    });

    // ===== BUTTONS =====
    startBtn.addEventListener("click", () => startOrResume());
    stopBtn.addEventListener("click", () => pauseGame());
    restartBtn.addEventListener("click", () => restartGame());

    // ===== INIT =====
    setState(app, "idle");
    ui.update({ t: 0, score: 0, combo: 0, maxCombo: 0, resonance: 0, state: "idle" });

    window.addEventListener("resize", () => {
      try { render?.resize(); } catch {}
      try { input.recalc(); } catch {}
    }, { passive: true });

    console.log("[DiCo] boot OK (hard-recovery)");
  }

  loadScriptsSequentially(ENGINE_FILES)
    .then(() => boot())
    .catch((err) => {
      console.error(err);
      const el = document.getElementById("ariaLive");
      if (el) el.textContent = "Boot error: " + err.message;
    });
})();
