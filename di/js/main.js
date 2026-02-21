/* /di/js/main.js
   PHASE1 PRO — STABLE ENGINE BOOT (START / STOP / RESTART) + UI/RESULT wiring
   - Deterministic: idle -> playing -> result
   - iOS-safe: unlock on first gesture, no autoplay before gesture
   - Robust: double-run guards, media cleanup, safe fallbacks
   - UI refs are centralized here (single source of truth)
*/
(() => {
  "use strict";

  // main.js is /di/js/main.js, so BASE points to /di/js/
  const BASE = new URL("./", document.currentScript?.src || location.href);

  // Engine layer (loaded sequentially, cache-busted)
  const ENGINE_FILES = [
    "engine/audio.js",
    "engine/timing.js",
    "engine/input.js",
    "engine/judge.js",
    "engine/render.js",
    "engine/fx.js",
    "engine/ui.js",
    "notes/skin-tarot-pinkgold.js",
  ].map((p) => new URL(p, BASE).toString());

  // Presentation layer (optional; safe fallback)
  const PRESENTATION_FILES = ["result.js"].map((p) => new URL(p, BASE).toString());

  const $ = (id) => document.getElementById(id);

  // iOS tap latency tuning: 0.06 → 0.08 → 0.10
  const INPUT_LAT = 0.06;

  /** Allowed states: idle | playing | result */
  const STATES = Object.freeze({
    IDLE: "idle",
    PLAYING: "playing",
    RESULT: "result",
  });

  function assertEl(el, name) {
    if (!el) throw new Error(`Missing required DOM element: #${name}`);
    return el;
  }

  function setState(app, s) {
    app.dataset.state = s;
  }

  function getState(app) {
    return app.dataset.state || STATES.IDLE;
  }

  // ---------------------------
  // Sequential loader (cache-busted)
  // ---------------------------
  function loadScriptsSequentially(files) {
    return files.reduce((p, src) => {
      return p.then(
        () =>
          new Promise((resolve, reject) => {
            const s = document.createElement("script");
            const u = new URL(src);
            u.searchParams.set("v", String(Date.now())); // iOS sanity
            s.src = u.toString();
            s.async = false;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Failed to load: " + src));
            document.head.appendChild(s);
          })
      );
    }, Promise.resolve());
  }

  async function loadAllScripts() {
    await loadScriptsSequentially(ENGINE_FILES);
    try {
      await loadScriptsSequentially(PRESENTATION_FILES);
    } catch (e) {
      console.warn("[DiCo] presentation load failed (continue with fallback):", e);
    }
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
      notes,
    };
  }

  // ---------------------------
  // Boot
  // ---------------------------
  async function boot() {
    // ===== DOM (required) =====
    const app = assertEl($("app"), "app");
    const canvas = assertEl($("noteCanvas"), "noteCanvas");
    const hitZone = assertEl($("hitZone"), "hitZone");

    const startBtn = assertEl($("startBtn"), "startBtn");
    const restartBtn = assertEl($("restartBtn"), "restartBtn");

    const music = assertEl($("music"), "music");

    // ===== DOM (optional but recommended) =====
    const bgVideo = $("bgVideo");
    const stopBtn = $("stopBtn");
    const seTap = $("seTap");
    const seGreat = $("seGreat");

    // ===== background video: never autoplay on load =====
    if (bgVideo) {
      try {
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        bgVideo.loop = true;
        bgVideo.preload = "metadata";
        bgVideo.pause();
      } catch {}
    }

    // ===== chart =====
    let chart;
    try {
      chart = await fetchJSON("charts/chart_001.json");
    } catch (e) {
      chart = fallbackChart();
      console.warn("[DiCo] chart fallback:", e);
    }

    // ===== engine =====
    const E = window.DI_ENGINE;
    if (!E) throw new Error("DI_ENGINE not found.");

    // ---- Build refs ONCE (UI’s single source of truth) ----
    // NOTE: dicoFace is REQUIRED for face swap system.
    const refs = {
      // root/state
      app,

      // legacy HUD
      score: $("score"),
      combo: $("combo"),
      maxCombo: $("maxCombo"),
      timeDup: $("time_dup"),

      // side HUD
      sideScore: $("sideScore"),
      sideCombo: $("sideCombo"),
      sideMaxCombo: $("sideMaxCombo"),
      time: $("time"),

      // resonance HUD
      resValue: $("resValue"),
      resFill: $("resFill"),

      // avatar
      avatarRing: $("avatarRing"),
      dicoFace: $("dicoFace"), // ✅ IMPORTANT: face swap target

      // judge
      judge: $("judge"),
      judgeMain: $("judgeMain"),
      judgeSub: $("judgeSub"),

      // result overlay
      result: $("result"),
      resultScore: $("resultScore"),
      resultMaxCombo: $("resultMaxCombo"),

      // ARU
      aruProg: $("aruProg"),
      aruValue: $("aruValue"),

      // line / aria / fx
      dicoLine: $("dicoLine"),
      ariaLive: $("ariaLive"),
      hitFlash: $("hitFlash"),

      // optional preload pool (if present in HTML; harmless if null)
      face1: $("face1"),
      face2: $("face2"),
      face3: $("face3"),
      face4: $("face4"),
      face5: $("face5"),
    };

    // Hard assert: if you want face changes, dicoFace must exist.
    // (fail fast: better than “why doesn’t it change?”)
    assertEl(refs.dicoFace, "dicoFace");

    const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });
    const fx = new E.FX({ fxLayer: $("fxLayer") });
    const ui = new E.UI(refs);

    // ===== presentation (result.js) safe fallback =====
    // result.js should expose: window.DI_RESULT = { init({ ... }) { return { show(payload), hide() } } }
    if (!window.DI_RESULT || typeof window.DI_RESULT.init !== "function") {
      console.warn("[DiCo] DI_RESULT not found. Using safe fallback presenter.");
      window.DI_RESULT = {
        init() {
          return {
            show(payload) {
              console.log("[DiCo] RESULT (fallback):", payload);
            },
            hide() {},
          };
        },
      };
    }

    const resultPresenter = window.DI_RESULT.init({
      app,
      root: refs.result,
      dicoLine: refs.dicoLine,
      aruProg: refs.aruProg,
      aruValue: refs.aruValue,
      resultScore: refs.resultScore,
      resultMaxCombo: refs.resultMaxCombo,
      ariaLive: refs.ariaLive,
    });

    // ===== game objects =====
    let timing, judge, render;

    function rebuildGameObjects() {
      timing = new E.Timing({ chart });
      judge = new E.Judge({ chart, timing });
      render = new E.Renderer({ canvas, chart, timing });
      render.resize();
    }
    rebuildGameObjects();

    // ===== loop =====
    let raf = 0;
    let running = false;
    let transitionLock = false;

    function stopRAF() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function tick() {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      const t = timing.getSongTime();
      if (!Number.isFinite(t)) return;

      // judge + render
      judge.sweepMiss(t);
      render.draw(t);

      // ui update
      ui.update({
        t,
        score: judge.state.score,
        combo: judge.state.combo,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance,
        state: getState(app),
      });

      // natural end
      if (timing.isEnded(t)) endToResult("ENDED");
    }

    // ===== media helpers =====
    async function playBackground() {
      if (!bgVideo) return;
      try {
        await bgVideo.play();
      } catch {}
    }

    function pauseBackground() {
      if (!bgVideo) return;
      try {
        bgVideo.pause();
      } catch {}
    }

    async function resetAndPlayMedia() {
      try {
        music.pause();
        music.currentTime = 0;
      } catch {}
      try {
        await music.play();
      } catch {}
      await playBackground();
    }

    function stopMediaForResult() {
      try {
        music.pause();
      } catch {}
      pauseBackground();
    }

    function setStartLabelForState(state) {
      startBtn.textContent = state === STATES.RESULT ? "もう一回" : "START";
    }

    // ===== transitions =====
    async function startFromIdleOrResult() {
      if (transitionLock) return;
      if (getState(app) === STATES.PLAYING) return;
      transitionLock = true;

      // iOS unlock on gesture
      await audio.unlock();

      // rebuild clean run
      rebuildGameObjects();
      judge.reset?.();

      // timing start at 0
      try {
        if (typeof timing.restart === "function") timing.restart(audio);
        else timing.start(audio, { reset: true });
      } catch (e) {
        console.warn("[DiCo] timing start error:", e);
      }

      // state first (CSS flips immediately)
      setState(app, STATES.PLAYING);
      setStartLabelForState(STATES.PLAYING);

      // UI cleanup
      ui.hideResult();
      try { resultPresenter.hide?.(); } catch {}
      ui.toast("START");

      // run loop
      running = true;
      stopRAF();
      tick();

      // media after state
      await resetAndPlayMedia();

      transitionLock = false;
    }

    async function restartAlways() {
      if (transitionLock) return;
      transitionLock = true;

      // stop loop
      running = false;
      stopRAF();

      // stop media
      try { music.pause(); } catch {}
      pauseBackground();

      await audio.unlock();

      // rebuild clean start
      rebuildGameObjects();
      judge.reset?.();

      // timing restart
      try {
        if (typeof timing.restart === "function") timing.restart(audio);
        else timing.start(audio, { reset: true });
      } catch (e) {
        console.warn("[DiCo] timing restart error:", e);
      }

      // state
      setState(app, STATES.PLAYING);
      setStartLabelForState(STATES.PLAYING);

      // UI
      ui.hideResult();
      try { resultPresenter.hide?.(); } catch {}
      ui.toast("RESTART");

      // loop
      running = true;
      stopRAF();
      tick();

      // media
      await resetAndPlayMedia();

      transitionLock = false;
    }

    function endToResult(reason = "STOP") {
      if (getState(app) === STATES.RESULT) return; // double-run guard

      running = false;
      stopRAF();

      try { timing?.stop?.(audio); } catch {}
      stopMediaForResult();

      setState(app, STATES.RESULT);
      setStartLabelForState(STATES.RESULT);

      const payload = {
        score: judge.state.score,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance,
        reason,
      };

      // engine UI
      ui.showResult(payload);

      // presentation layer
      try { resultPresenter.show(payload); } catch (e) {
        console.warn("[DiCo] resultPresenter.show failed:", e);
      }

      ui.toast(reason === "ENDED" ? "RESULT" : "STOP");
    }

    // ===== input =====
    const input = new E.Input({
      element: hitZone,
      onTap: (x, y) => {
        if (!running || getState(app) !== STATES.PLAYING) return;

        audio.playTap();
        fx.burstAt(x, y);

        const t = timing.getSongTime();
        if (!Number.isFinite(t)) return;

        const res = judge.hit(t + INPUT_LAT);

        // UI reaction (faces + lines + streak bonuses)
        ui.onJudge(res);

        // audio/fx for good hits
        if (res && (res.name === "GREAT" || res.name === "PERFECT")) {
          audio.playGreat();
          ui.flashHit();
          fx.sparkLine();
        }
      },
    });

    // ===== buttons =====
    startBtn.addEventListener("click", () => startFromIdleOrResult());

    if (stopBtn) {
      stopBtn.addEventListener("click", () => {
        if (!running || getState(app) !== STATES.PLAYING) return;
        endToResult("STOP");
      });
    }

    restartBtn.addEventListener("click", () => restartAlways());

    // Optional: keyboard (desktop)
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (e.code === "Enter" || e.code === "Space") startFromIdleOrResult();
      if (e.key?.toLowerCase?.() === "r") restartAlways();
      if (e.key?.toLowerCase?.() === "s") endToResult("STOP");
    });

    // ===== init =====
    setState(app, STATES.IDLE);
    setStartLabelForState(STATES.IDLE);
    pauseBackground();

    ui.update({
      t: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      resonance: 0,
      state: STATES.IDLE,
    });

    // resize
    window.addEventListener(
      "resize",
      () => {
        try { render?.resize?.(); } catch {}
        try { input?.recalc?.(); } catch {}
      },
      { passive: true }
    );

    console.log("[DiCo] boot OK (Phase1 PRO + UI face system wired)");
  }

  // ===== ENTRYPOINT =====
  (async () => {
    try {
      await loadAllScripts();
      await boot();
    } catch (err) {
      console.error(err);
      const el = document.getElementById("ariaLive");
      if (el) el.textContent = "Boot error: " + (err?.message || String(err));
    }
  })();
})();
