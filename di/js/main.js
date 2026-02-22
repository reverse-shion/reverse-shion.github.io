/* /di/js/main.js
   PHASE1 PRO — HYBRID MODULE SAFE
   - main.js only is ESModule
   - engine files remain legacy script (window.DI_ENGINE)
   - zero collision
   - zero regression
*/

"use strict";

/* ===============================
   MODULE SAFE BASE
   document.currentScript は module で使えない
================================= */

const BASE = new URL("./", import.meta.url);

/* ===============================
   LEGACY ENGINE FILES (UNCHANGED)
================================= */

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

const PRESENTATION_FILES = [
  "result.js",
].map((p) => new URL(p, BASE).toString());

/* =============================== */

const $ = (id) => document.getElementById(id);

const INPUT_LAT = 0.06;

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

/* ===============================
   SAFE SEQUENTIAL LOADER
================================= */

function loadScriptsSequentially(files) {
  return files.reduce((p, src) => {
    return p.then(
      () =>
        new Promise((resolve, reject) => {
          const s = document.createElement("script");
          const u = new URL(src);
          u.searchParams.set("v", String(Date.now()));
          s.src = u.toString();
          s.async = false;
          s.onload = resolve;
          s.onerror = () =>
            reject(new Error("Failed to load: " + src));
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
    console.warn("[DiCo] presentation fallback:", e);
  }
}

/* ===============================
   FETCH JSON
================================= */

async function fetchJSON(url) {
  const u = new URL(url, BASE).toString();
  const r = await fetch(u, { cache: "no-store" });
  if (!r.ok) throw new Error(`fetch failed ${u}`);
  return r.json();
}

function fallbackChart() {
  const notes = [];
  const bpm = 145;
  const beat = 60 / bpm;
  for (let t = 1; t < 60; t += beat) {
    notes.push({ t: +t.toFixed(3), type: "tap" });
  }
  return {
    meta: { title: "fallback", bpm },
    offset: 0,
    scroll: { approach: 1.25 },
    notes,
  };
}

/* ===============================
   BOOT
================================= */

async function boot() {
  const app = assertEl($("app"), "app");
  const canvas = assertEl($("noteCanvas"), "noteCanvas");
  const hitZone = assertEl($("hitZone"), "hitZone");
  const startBtn = assertEl($("startBtn"), "startBtn");
  const restartBtn = assertEl($("restartBtn"), "restartBtn");
  const music = assertEl($("music"), "music");

  const bgVideo = $("bgVideo");
  const stopBtn = $("stopBtn");
  const seTap = $("seTap");
  const seGreat = $("seGreat");

  if (bgVideo) {
    bgVideo.muted = true;
    bgVideo.playsInline = true;
    bgVideo.loop = true;
    bgVideo.preload = "metadata";
    bgVideo.pause();
  }

  let chart;
  try {
    chart = await fetchJSON("charts/chart_001.json");
  } catch {
    chart = fallbackChart();
  }

  /* ===== LEGACY ENGINE ===== */

  const E = window.DI_ENGINE;
  if (!E) throw new Error("DI_ENGINE not loaded");

  const refs = {
    app,
    avatarRing: $("avatarRing"),
    dicoFace: $("dicoFace"),
    result: $("result"),
    resultScore: $("resultScore"),
    resultMaxCombo: $("resultMaxCombo"),
    aruProg: $("aruProg"),
    aruValue: $("aruValue"),
    ariaLive: $("ariaLive"),
  };

  assertEl(refs.dicoFace, "dicoFace");

  const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });
  const fxLegacy = new E.FX({ fxLayer: $("fxLayer") });
  const ui = new E.UI(refs);

  let timing = new E.Timing({ chart });
  let judge = new E.Judge({ chart, timing });
  let render = new E.Renderer({ canvas, chart, timing });
  render.resize();

  let running = false;
  let raf = 0;
  let lock = false;

  function stopRAF() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function tick() {
    if (!running) return;
    raf = requestAnimationFrame(tick);

    const t = timing.getSongTime();
    if (!Number.isFinite(t)) return;

    judge.sweepMiss(t);
    render.draw(t);

    ui.update({
      t,
      score: judge.state.score,
      combo: judge.state.combo,
      maxCombo: judge.state.maxCombo,
      resonance: judge.state.resonance,
      state: getState(app),
    });

    if (timing.isEnded(t)) endToResult("ENDED");
  }

  async function startGame() {
    if (lock || running) return;
    lock = true;

    await audio.unlock();

    judge.reset?.();
    timing.restart?.(audio) ?? timing.start(audio);

    setState(app, STATES.PLAYING);
    running = true;

    try { await music.play(); } catch {}
    try { await bgVideo?.play?.(); } catch {}

    tick();
    lock = false;
  }

  function endToResult(reason) {
    if (getState(app) === STATES.RESULT) return;

    running = false;
    stopRAF();

    timing.stop?.(audio);
    music.pause();
    bgVideo?.pause?.();

    setState(app, STATES.RESULT);

    ui.showResult({
      score: judge.state.score,
      maxCombo: judge.state.maxCombo,
      resonance: judge.state.resonance,
      reason,
    });
  }

  const input = new E.Input({
    element: hitZone,
    onTap: (x, y) => {
      if (!running) return;

      audio.playTap();
      fxLegacy.burstAt(x, y);

      const t = timing.getSongTime();
      const res = judge.hit(t + INPUT_LAT);

      ui.onJudge(res);

      if (res && (res.name === "GREAT" || res.name === "PERFECT")) {
        audio.playGreat();
        ui.flashHit();
        fxLegacy.sparkLine();
      }
    },
  });

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);
  stopBtn?.addEventListener("click", () => endToResult("STOP"));

  setState(app, STATES.IDLE);

  console.log("[DiCo] HYBRID MODULE BOOT OK");
}

/* ===============================
   ENTRYPOINT
================================= */

(async () => {
  try {
    await loadAllScripts();
    await boot();
  } catch (err) {
    console.error(err);
  }
})();
