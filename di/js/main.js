/* /di/js/main.js
   - Loads engine scripts (non-module) and boots the game.
   - Keeps existing DOM ids (#score/#combo/#maxCombo/#time etc.) and syncs to side HUD.
*/

(() => {
  const ENGINE_FILES = [
    "./js/engine/audio.js",
    "./js/engine/timing.js",
    "./js/engine/input.js",
    "./js/engine/judge.js",
    "./js/engine/render.js",
    "./js/engine/fx.js",
    "./js/engine/ui.js",
  
      // ★ note skins (swap freely)
  "./js/notes/skin-tarot-pinkgold.js",

   ];

  function $(id) { return document.getElementById(id); }

  function loadScriptsSequentially(files) {
    return files.reduce((p, src) => {
      return p.then(() => new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load: " + src));
        document.head.appendChild(s);
      }));
    }, Promise.resolve());
  }

  async function fetchJSON(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`fetch failed ${url}: ${r.status}`);
    return await r.json();
  }

  // Fallback chart if json missing
  function fallbackChart() {
    // 60 seconds, simple 4th rhythm
    const notes = [];
    const bpm = 145;
    const beat = 60 / bpm;          // seconds per beat
    const start = 1.2;
    const total = 60.0;
    for (let t = start, i = 0; t < total; t += beat, i++) {
      // every 2 beats place a tap note
      if (i % 2 === 0) notes.push({ t: +t.toFixed(3), type: "tap" });
      // occasional doubles
      if (i % 16 === 8) notes.push({ t: +(t + beat * 0.5).toFixed(3), type: "tap" });
    }
    return {
      meta: { title: "DiCo ARU Phase1 (fallback)", bpm },
      offset: 0.0,
      scroll: { approach: 1.25 }, // seconds from spawn to hit
      notes
    };
  }

  async function boot() {
    const app = $("app");
    const canvas = $("noteCanvas");
    const bgVideo = $("bgVideo");

    // Buttons
    const startBtn = $("startBtn");
    const stopBtn = $("stopBtn");
    const restartBtn = $("restartBtn");

    // Audio elements (from HTML)
    const music = $("music");
    const seTap = $("seTap");
    const seGreat = $("seGreat");

    // Optional: try autoplay muted bg video (iOS policy ok if muted)
    try {
      bgVideo.muted = true;
      bgVideo.playsInline = true;
      bgVideo.loop = true;
      bgVideo.play().catch(() => {});
    } catch {}

    // Load chart(s)
    let chart = null;
    try {
      // prioritize chart_001.json if present
      chart = await fetchJSON("./js/charts/chart_001.json");
    } catch (e) {
      chart = fallbackChart();
      console.warn("[DiCo] chart json not found. Using fallback.", e);
    }

    // Engine must exist after scripts loaded
    const E = window.DI_ENGINE;
    if (!E) throw new Error("DI_ENGINE not found. engine scripts failed to load.");

    // Build engine parts
    const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });
    const timing = new E.Timing({ chart });
    const judge = new E.Judge({ chart, timing });
    const fx = new E.FX({ fxLayer: $("fxLayer") });
    const ui = new E.UI({
      app,
      // legacy HUD (compat)
      score: $("score"), combo: $("combo"), maxCombo: $("maxCombo"), timeDup: $("time_dup"),
      // side HUD
      sideScore: $("sideScore"), sideCombo: $("sideCombo"), sideMaxCombo: $("sideMaxCombo"), time: $("time"),
      // resonance
      resValue: $("resValue"), resFill: $("resFill"), avatarRing: $("avatarRing"),
      // judge/result
      judge: $("judge"), judgeMain: $("judgeMain"), judgeSub: $("judgeSub"),
      result: $("result"),
      resultScore: $("resultScore"), resultMaxCombo: $("resultMaxCombo"),
      aruProg: $("aruProg"), aruValue: $("aruValue"), dicoLine: $("dicoLine"),
      ariaLive: $("ariaLive"),
      hitFlash: $("hitFlash"),
    });
    const render = new E.Renderer({ canvas, chart, timing });

    // Input
    const input = new E.Input({
      element: canvas,
      onTap: (x, y) => {
        // tap SE (light), then judge
        audio.playTap();
        fx.burstAt(x, y);

        const res = judge.hit(timing.getSongTime());
        ui.onJudge(res);
        if (res && (res.name === "GREAT" || res.name === "PERFECT")) {
          audio.playGreat();
          ui.flashHit();
          fx.sparkLine(); // small HUD sparkle
        }
      }
    });

    // Game loop
    let raf = 0;
    let running = false;

    function tick() {
      raf = requestAnimationFrame(tick);
      if (!running) return;

      // song time drives everything
      const t = timing.getSongTime();

      // update renderer
      render.draw(t);

      // update UI (time, resonance etc.)
      ui.update({
        t,
        score: judge.state.score,
        combo: judge.state.combo,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance,
        state: app.dataset.state
      });

      // auto-finish at end
      if (timing.isEnded(t)) {
        endGame();
      }
    }

    async function startGame() {
      if (running) return;

      // Must be inside user gesture (button click) for iOS audio
      await audio.unlock();

      // Start bg video if stopped
      try { bgVideo.play().catch(() => {}); } catch {}

      judge.reset();
      timing.start(audio);
      app.dataset.state = "playing";
      running = true;
      ui.hideResult();
      ui.toast("START");
      tick();
    }

    function stopGame() {
      if (!running) return;
      running = false;
      timing.stop(audio);
      app.dataset.state = "idle";
      ui.toast("STOP");
    }

    function endGame() {
      running = false;
      timing.stop(audio);
      app.dataset.state = "result";
      ui.showResult({
        score: judge.state.score,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance
      });
      ui.toast("RESULT");
    }

    async function restartGame() {
      stopGame();
      await startGame();
    }

    // Wire buttons
    startBtn.addEventListener("click", () => startGame());
    stopBtn.addEventListener("click", () => stopGame());
    restartBtn.addEventListener("click", () => restartGame());

    // Keyboard (dev)
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        input.simTapCenter();
      } else if (e.code === "Enter") {
        startGame();
      } else if (e.code === "Escape") {
        stopGame();
      }
    }, { passive: false });

    // Initial UI state
    app.dataset.state = "idle";
    ui.update({
      t: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      resonance: 0,
      state: "idle"
    });
    render.resize();

    window.addEventListener("resize", () => {
      render.resize();
      input.recalc();
    });

    console.log("[DiCo] boot OK");
  }

  loadScriptsSequentially(ENGINE_FILES)
    .then(() => boot())
    .catch((err) => {
      console.error(err);
      const el = document.getElementById("ariaLive");
      if (el) el.textContent = "Boot error: " + err.message;
    });
})();
