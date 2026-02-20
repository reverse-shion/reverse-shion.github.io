/* /di/js/main.js (PAUSE/RESUME/RESTART STABLE) */
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

    // bg video
    try {
      if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        bgVideo.loop = true;
        // ここで勝手に再生しない（ユーザー操作後にplayする）
      }
    } catch {}

    // chart
    let chart = null;
    try { chart = await fetchJSON("charts/chart_001.json"); }
    catch (e) { chart = fallbackChart(); console.warn("[DiCo] chart fallback", e); }

    const E = window.DI_ENGINE;
    if (!E) throw new Error("DI_ENGINE not found.");

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

    // ===== GAME OBJECTS =====
    let timing = null;
    let judge = null;
    let render = null;

    function rebuildGameObjects() {
      timing = new E.Timing({ chart });
      judge  = new E.Judge({ chart, timing });
      render = new E.Renderer({ canvas, chart, timing });
      render.resize();
    }

    rebuildGameObjects();

    // ===== LOOP =====
    let raf = 0;
    let running = false;
    let starting = false;

    function stopRAF() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function tick() {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      const t = timing.getSongTime();
      if (!Number.isFinite(t)) return;

      // ✅ 取り逃しを進める（当たり判定が安定する）
      judge.sweepMiss(t);

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

    // ===== ACTIONS =====

    // START: idle/resultなら最初から。pausedなら再開。
    async function startOrResume() {
      if (starting) return;
      starting = true;

      await audio.unlock();

      const state = app.dataset.state;

      // ---- RESUME ----
      if (state === "paused") {
        try { timing.resume(audio); } catch { timing.start(audio); }

        // 背景も再開したい（止めてた場合）
        try { await bgVideo?.play(); } catch {}

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
        // fresh objects
        rebuildGameObjects();

        // media reset (best-effort)
        try { music.pause(); music.currentTime = 0; } catch {}
        try { bgVideo?.pause(); } catch {}

        judge.reset();

        // ✅ timing側でreset開始（曲位置0を保証）
        if (typeof timing.restart === "function") timing.restart(audio);
        else timing.start(audio, { reset: true });

        setState(app, "playing");
        running = true;

        ui.hideResult();
        ui.toast("START");

        // play media
        try { await music.play(); } catch {}
        try { await bgVideo?.play(); } catch {}

        stopRAF();
        tick();

        starting = false;
        return;
      }

      starting = false;
    }

    // STOP: pause
    function pauseGame() {
      if (!running) return;

      running = false;
      stopRAF();

      // ✅ stopではなくpause（位置保持）
      if (typeof timing.pause === "function") timing.pause(audio);
      else timing.stop(audio);

      try { music.pause(); } catch {}
      try { bgVideo?.pause(); } catch {}

      setState(app, "paused");
      ui.toast("PAUSE");
    }

    // RESTART: always from beginning
    async function restartGame() {
      if (starting) return;
      starting = true;

      running = false;
      stopRAF();

      // stop media
      try { music.pause(); } catch {}
      try { bgVideo?.pause(); } catch {}

      // fresh objects
      rebuildGameObjects();

      // reset media time
      try { music.currentTime = 0; } catch {}
      // 背景も最初に戻したいならON
      // try { bgVideo.currentTime = 0; } catch {}

      judge.reset();

      // ✅ restart
      if (typeof timing.restart === "function") timing.restart(audio);
      else timing.start(audio, { reset: true });

      setState(app, "playing");
      running = true;

      ui.hideResult();
      ui.toast("RESTART");

      // play
      try { await music.play(); } catch {}
      try { await bgVideo?.play(); } catch {}

      stopRAF();
      tick();

      starting = false;
    }

    function endGame() {
      running = false;
      stopRAF();

      try { timing.stop(audio); } catch {}
      try { music.pause(); } catch {}
      try { bgVideo?.pause(); } catch {}

      setState(app, "result");
      ui.showResult({
        score: judge.state.score,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance
      });
      ui.toast("RESULT");
    }

    // ===== INPUT =====
    const input = new E.Input({
      element: hitZone,
      onTap: (x, y) => {
        if (!running || app.dataset.state !== "playing") return;

        audio.playTap();
        fx.burstAt(x, y);

        const t = timing.getSongTime();
        if (!Number.isFinite(t)) return;

        // ✅ hitでもmiss掃除（main側と二重でもOK）
        const res = judge.hit(t + INPUT_LAT);

        ui.onJudge(res);

        if (res && (res.name === "GREAT" || res.name === "PERFECT")) {
          audio.playGreat();
          ui.flashHit();
          fx.sparkLine();
        }
      }
    });

    // buttons
    startBtn.addEventListener("click", () => startOrResume());
    stopBtn.addEventListener("click", () => pauseGame());
    restartBtn.addEventListener("click", () => restartGame());

    // init
    setState(app, "idle");
    ui.update({ t: 0, score: 0, combo: 0, maxCombo: 0, resonance: 0, state: "idle" });

    window.addEventListener("resize", () => {
      try { render?.resize(); } catch {}
      try { input.recalc(); } catch {}
    }, { passive: true });

    console.log("[DiCo] boot OK (pause/resume stable)");
  }

  loadScriptsSequentially(ENGINE_FILES)
    .then(() => boot())
    .catch((err) => {
      console.error(err);
      const el = document.getElementById("ariaLive");
      if (el) el.textContent = "Boot error: " + err.message;
    });
})();
