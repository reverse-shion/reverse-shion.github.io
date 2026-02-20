/* /di/js/main.js (NO-STOP / START+RESTART STABLE / RESULT=もう一回) */
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
    return {
      meta: { title: "DiCo ARU Phase1 (fallback)", bpm },
      offset: 0.0,
      scroll: { approach: 1.25 },
      notes
    };
  }

  function setState(app, s) {
    app.dataset.state = s;
  }

  async function boot() {
    const app = $("app");
    const canvas = $("noteCanvas");
    const hitZone = $("hitZone");
    const bgVideo = $("bgVideo");

    const startBtn = $("startBtn");
    const restartBtn = $("restartBtn");

    const music = $("music");
    const seTap = $("seTap");
    const seGreat = $("seGreat");

    if (!app || !canvas || !hitZone || !startBtn || !restartBtn || !music) {
      throw new Error("Missing required DOM elements (check ids).");
    }

    // bg video: never autoplay on load; control only after user gesture
    try {
      if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        bgVideo.loop = true;
        bgVideo.preload = "metadata";
        try { bgVideo.pause(); } catch {}
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

      // miss sweep for stability
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

    // ===== MEDIA HELPERS =====
    async function playBackground() {
      try { await bgVideo?.play(); } catch {}
    }
    function pauseBackground() {
      try { bgVideo?.pause(); } catch {}
    }

    function setStartLabelForState(state) {
      // idle/playing は START、result は もう一回
      startBtn.textContent = (state === "result") ? "もう一回" : "START";
    }

    // ===== ACTIONS =====

    // START: only from idle/result. (No pause/resume in Phase1)
    async function startGame() {
      if (starting) return;
      const state = app.dataset.state;
      if (state === "playing") return; // ignore during gameplay

      starting = true;

      await audio.unlock();

      // fresh objects
      rebuildGameObjects();

      // reset media
      try { music.pause(); music.currentTime = 0; } catch {}
      pauseBackground(); // idle keeps cpu low

      judge.reset();

      // timing: guarantee start at 0
      if (typeof timing.restart === "function") timing.restart(audio);
      else timing.start(audio, { reset: true });

      setState(app, "playing");
      setStartLabelForState("playing");
      running = true;

      ui.hideResult();
      ui.toast("START");

      // play media (user gesture already happened)
      try { await music.play(); } catch {}
      await playBackground();

      stopRAF();
      tick();

      starting = false;
    }

    // RESTART: always from beginning (playing/result/idle all OK)
    async function restartGame() {
      if (starting) return;
      starting = true;

      running = false;
      stopRAF();

      try { music.pause(); } catch {}
      pauseBackground();

      await audio.unlock();

      rebuildGameObjects();

      try { music.currentTime = 0; } catch {}
      // bgVideo currentTime reset is optional (heavy on iOS). Keep off by default.
      // try { if (bgVideo) bgVideo.currentTime = 0; } catch {}

      judge.reset();

      if (typeof timing.restart === "function") timing.restart(audio);
      else timing.start(audio, { reset: true });

      setState(app, "playing");
      setStartLabelForState("playing");
      running = true;

      ui.hideResult();
      ui.toast("RESTART");

      try { await music.play(); } catch {}
      await playBackground();

      stopRAF();
      tick();

      starting = false;
    }

    function endGame() {
      running = false;
      stopRAF();

      try { timing.stop(audio); } catch {}
      try { music.pause(); } catch {}
      pauseBackground(); // result: pause video to save CPU

      setState(app, "result");
      setStartLabelForState("result");

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

        // hit + latency
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
    // START button doubles as "もう一回" in result state
    startBtn.addEventListener("click", () => startGame());
    restartBtn.addEventListener("click", () => restartGame());

    // Optional: keyboard helpers (desktop)
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (e.code === "Enter" || e.code === "Space") startGame();
      if (e.key?.toLowerCase?.() === "r") restartGame();
    });

    // ===== INIT =====
    setState(app, "idle");
    setStartLabelForState("idle");

    // ensure background is not running in idle
    pauseBackground();

    ui.update({ t: 0, score: 0, combo: 0, maxCombo: 0, resonance: 0, state: "idle" });

    // resize
    window.addEventListener("resize", () => {
      try { render?.resize(); } catch {}
      try { input.recalc(); } catch {}
    }, { passive: true });

    console.log("[DiCo] boot OK (NO-STOP; start/restart stable; result label ok)");
  }

  loadScriptsSequentially(ENGINE_FILES)
    .then(() => boot())
    .catch((err) => {
      console.error(err);
      const el = document.getElementById("ariaLive");
      if (el) el.textContent = "Boot error: " + err.message;
    });
})();
