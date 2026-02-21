/* /di/js/main.js
   DiCo ARU – PRO STABLE FINAL
   - GitHub Pages safe
   - iOS safe audio
   - Classic + ESM mixed loader
   - Deterministic state machine
*/

(() => {
  "use strict";

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

  const PRESENTATION_FILES = [
    "result.js",
  ].map(p => new URL(p, BASE).toString());

  const $ = id => document.getElementById(id);

  const STATES = Object.freeze({
    IDLE: "idle",
    PLAYING: "playing",
    RESULT: "result",
  });

  /* ===============================
     SCRIPT LOADER
  =============================== */

  function loadScriptsSequentially(files, { module = false } = {}) {
    return files.reduce((p, src) => {
      return p.then(() => new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src + "?v=" + Date.now();
        s.async = false;
        if (module) s.type = "module";
        s.onload = resolve;
        s.onerror = () => reject(new Error("Failed to load: " + src));
        document.head.appendChild(s);
      }));
    }, Promise.resolve());
  }

  async function loadAll() {
    await loadScriptsSequentially(ENGINE_FILES, { module: false });
    await loadScriptsSequentially(PRESENTATION_FILES, { module: true });
  }

  /* ===============================
     BOOT
  =============================== */

  async function boot() {
    const app = $("app");
    const canvas = $("noteCanvas");
    const hitZone = $("hitZone");

    const startBtn = $("startBtn");
    const restartBtn = $("restartBtn");
    const stopBtn = $("stopBtn");

    const music = $("music");
    const bgVideo = $("bgVideo");

    const E = window.DI_ENGINE;
    if (!E) throw new Error("DI_ENGINE missing");

    const audio = new E.AudioManager({ music, bgVideo });
    const ui = new E.UI({
      app,
      score: $("score"),
      combo: $("combo"),
      maxCombo: $("maxCombo"),
      timeDup: $("time_dup"),
      resValue: $("resValue"),
      resFill: $("resFill"),
      result: $("result"),
      resultScore: $("resultScore"),
      resultMaxCombo: $("resultMaxCombo"),
      aruProg: $("aruProg"),
      aruValue: $("aruValue"),
    });

    const resultPresenter = window.DI_RESULT?.init({
      app,
      root: $("result"),
    }) || { show() {}, hide() {} };

    let timing, judge, render;
    let running = false;
    let raf = 0;
    let locked = false;

    function rebuild(chart) {
      timing = new E.Timing({ chart });
      judge = new E.Judge({ chart, timing });
      render = new E.Renderer({ canvas, chart, timing });
      render.resize();
    }

    const chart = await fetch("./js/charts/chart_001.json")
      .then(r => r.json())
      .catch(() => ({ notes: [] }));

    rebuild(chart);

    function setState(s) {
      app.dataset.state = s;
    }

    function loop() {
      if (!running) return;
      raf = requestAnimationFrame(loop);

      const t = timing.getSongTime();
      judge.sweepMiss(t);
      render.draw(t);

      ui.update({
        t,
        score: judge.state.score,
        combo: judge.state.combo,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance,
        state: app.dataset.state,
      });

      if (timing.isEnded(t)) endGame("ENDED");
    }

    function stopLoop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    /* ===============================
       AUDIO SAFE START
    =============================== */

    async function safePlay() {
      try {
        const p = music.play();
        if (p?.then) {
          await p;
        }
      } catch (e) {
        console.error("Audio blocked:", e);
      }
    }

    async function startGame() {
      if (locked || running) return;
      locked = true;

      // iOS gesture unlock
      await safePlay();
      music.pause();
      music.currentTime = 0;

      rebuild(chart);
      judge.reset();

      timing.start(audio, { reset: true });

      setState(STATES.PLAYING);
      resultPresenter.hide();
      ui.hideResult();

      running = true;
      loop();

      await safePlay();

      locked = false;
    }

    function endGame(reason) {
      if (!running) return;

      stopLoop();
      music.pause();

      setState(STATES.RESULT);

      const payload = {
        score: judge.state.score,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance,
        reason,
      };

      ui.showResult(payload);
      resultPresenter.show(payload);
    }

    /* ===============================
       BUTTONS
    =============================== */

    startBtn.addEventListener("click", startGame);
    restartBtn?.addEventListener("click", startGame);
    stopBtn?.addEventListener("click", () => endGame("STOP"));

    // expose for result overlay
    window.__DICO_START = startGame;

    setState(STATES.IDLE);
  }

  /* ===============================
     ENTRY
  =============================== */

  (async () => {
    try {
      await loadAll();
      await boot();
      console.log("[DiCo] PRO STABLE boot OK");
    } catch (e) {
      console.error("BOOT FAILED:", e);
    }
  })();

})();
