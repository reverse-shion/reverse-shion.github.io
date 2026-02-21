/* /di/js/main.js
   PHASE1 PRO — STABLE ENGINE CORE (FULL FX INTEGRATED)
   - Deterministic: idle -> playing -> result
   - FX unified (burst / stream / heartbeat / max flash)
   - Safe transitions / iOS-safe media
   - No double execution
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
    "result.js"
  ].map(p => new URL(p, BASE).toString());

  const $ = id => document.getElementById(id);

  const INPUT_LAT = 0.06;

  const STATES = Object.freeze({
    IDLE: "idle",
    PLAYING: "playing",
    RESULT: "result"
  });

  /* -------------------------------------------------- */
  /* Loader */
  /* -------------------------------------------------- */

  function loadScriptsSequentially(files) {
    return files.reduce((p, src) => {
      return p.then(() =>
        new Promise((resolve, reject) => {
          const s = document.createElement("script");
          const u = new URL(src);
          u.searchParams.set("v", Date.now());
          s.src = u.toString();
          s.async = false;
          s.onload = resolve;
          s.onerror = () => reject(new Error("Failed: " + src));
          document.head.appendChild(s);
        })
      );
    }, Promise.resolve());
  }

  async function loadAll() {
    await loadScriptsSequentially(ENGINE_FILES);
    try { await loadScriptsSequentially(PRESENTATION_FILES); }
    catch(e){ console.warn("Presentation load failed:", e); }
  }

  /* -------------------------------------------------- */
  /* Boot */
  /* -------------------------------------------------- */

  async function boot() {

    const app = $("app");
    const canvas = $("noteCanvas");
    const hitZone = $("hitZone");
    const startBtn = $("startBtn");
    const restartBtn = $("restartBtn");
    const music = $("music");
    const fxLayer = $("fxLayer");

    if (!app || !canvas || !hitZone || !startBtn || !restartBtn || !music) {
      throw new Error("Missing required DOM");
    }

    const bgVideo = $("bgVideo");
    const seTap = $("seTap");
    const seGreat = $("seGreat");

    if (bgVideo) {
      bgVideo.muted = true;
      bgVideo.playsInline = true;
      bgVideo.loop = true;
      bgVideo.pause();
    }

    /* -------- Chart -------- */

    async function loadChart() {
      try {
        const r = await fetch(new URL("charts/chart_001.json", BASE), { cache: "no-store" });
        if (!r.ok) throw 0;
        return await r.json();
      } catch {
        return fallbackChart();
      }
    }

    function fallbackChart() {
      const notes = [];
      const bpm = 145;
      const beat = 60 / bpm;
      for (let t = 1.2; t < 60; t += beat) {
        notes.push({ t: +t.toFixed(3), type: "tap" });
      }
      return {
        meta: { title: "Fallback", bpm },
        offset: 0,
        scroll: { approach: 1.25 },
        notes
      };
    }

    const chart = await loadChart();

    /* -------- Engine -------- */

    const E = window.DI_ENGINE;
    if (!E) throw new Error("DI_ENGINE not loaded");

    const refs = {
      app,
      avatarRing: $("avatarRing"),
      dicoFace: $("dicoFace"),
      judge: $("judge"),
      judgeMain: $("judgeMain"),
      judgeSub: $("judgeSub"),
      score: $("score"),
      combo: $("combo"),
      maxCombo: $("maxCombo"),
      resFill: $("resFill"),
      resValue: $("resValue"),
      result: $("result"),
      resultScore: $("resultScore"),
      resultMaxCombo: $("resultMaxCombo"),
      ariaLive: $("ariaLive")
    };

    const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });
    const fx = new E.FX({ fxLayer, appRoot: app });
    const ui = new E.UI(refs);

    let timing, judge, render;

    function rebuild() {
      timing = new E.Timing({ chart });
      judge = new E.Judge({ chart, timing });
      render = new E.Renderer({ canvas, chart, timing });
      render.resize();
    }

    rebuild();

    /* -------------------------------------------------- */
    /* Loop */
    /* -------------------------------------------------- */

    let raf = 0;
    let running = false;
    let locked = false;

    function setState(s) {
      app.dataset.state = s;
    }

    function getState() {
      return app.dataset.state || STATES.IDLE;
    }

    function stopRAF() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function updateResTier(res) {
      let tier = 0;
      if (res >= 50) tier = 2;
      else if (res >= 30) tier = 1;
      app.dataset.resTier = tier;
    }

    function tick() {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      const t = timing.getSongTime();
      judge.sweepMiss(t);
      render.draw(t);

      updateResTier(judge.state.resonance);

      ui.update({
        t,
        score: judge.state.score,
        combo: judge.state.combo,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance,
        state: getState()
      });

      if (timing.isEnded(t)) endGame();
    }

    /* -------------------------------------------------- */
    /* Transitions */
    /* -------------------------------------------------- */

    async function startGame() {
      if (locked || getState() === STATES.PLAYING) return;
      locked = true;

      await audio.unlock();

      rebuild();
      judge.reset?.();

      timing.start(audio, { reset: true });

      setState(STATES.PLAYING);

      running = true;
      stopRAF();
      tick();

      try {
        music.currentTime = 0;
        await music.play();
        if (bgVideo) await bgVideo.play();
      } catch {}

      locked = false;
    }

    function endGame() {
      if (getState() === STATES.RESULT) return;

      running = false;
      stopRAF();

      try { timing.stop?.(audio); } catch {}
      try { music.pause(); } catch {}
      if (bgVideo) bgVideo.pause();

      setState(STATES.RESULT);

      ui.showResult({
        score: judge.state.score,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance
      });

      if (judge.state.resonance >= 100) {
        fx.fullFlash();
      }
    }

    /* -------------------------------------------------- */
    /* Input */
    /* -------------------------------------------------- */

    new E.Input({
      element: hitZone,
      onTap: (x, y) => {

        if (!running || getState() !== STATES.PLAYING) return;

        audio.playTap();
        fx.burstAt(x, y);

        const t = timing.getSongTime();
        const res = judge.hit(t + INPUT_LAT);

        ui.onJudge(res);

        if (res && (res.name === "PERFECT" || res.name === "GREAT")) {

          audio.playGreat();
          ui.flashHit();

          const avatar = refs.avatarRing?.parentElement;
          fx.streamToAvatar(x, y, avatar);

          if (res.name === "PERFECT") {
            fx.triggerHeartbeat();
          }

          if (judge.state.resonance >= 100) {
            fx.fullFlash();
          }
        }
      }
    });

    /* -------------------------------------------------- */
    /* Buttons */
    /* -------------------------------------------------- */

    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", startGame);

    /* -------------------------------------------------- */
    /* Init */
    /* -------------------------------------------------- */

    setState(STATES.IDLE);

    ui.update({
      t: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      resonance: 0,
      state: STATES.IDLE
    });

    console.log("DiCo Engine PRO: Boot Complete");
  }

  /* -------------------------------------------------- */
  /* ENTRY */
  /* -------------------------------------------------- */

  (async () => {
    try {
      await loadAll();
      await boot();
    } catch (e) {
      console.error(e);
    }
  })();

})();
