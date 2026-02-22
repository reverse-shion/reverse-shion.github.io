/* /di/js/main.js
   PHASE1 PRO — HYBRID MODULE SAFE (NO-COLLISION / NO-REGRESSION)
   - main.js: ESModule only
   - engine: legacy scripts (window.DI_ENGINE)
   - idempotent loader (safe if called twice)
   - single-run guard + abortable listeners
   - deterministic lifecycle: boot -> idle -> playing -> result
*/

"use strict";

/* ===============================
   MODULE SAFE BASE
================================= */
const BASE = new URL("./", import.meta.url);

/* ===============================
   BUILD FILE URLS
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

// ✅ result.js は “legacy script” として読む運用もできるが、
// ここでは「存在すれば使う / 無ければfallback」方式にして衝突をゼロにする。
const PRESENTATION_FILES = ["result.js"].map((p) => new URL(p, BASE).toString());

/* ===============================
   GLOBAL SINGLETON KEY (NO DOUBLE BOOT)
================================= */
const APP_KEY = "__DICO_PHASE1__";

/* ===============================
   DOM HELPERS
================================= */
const $ = (id) => document.getElementById(id);

function assertEl(el, name) {
  if (!el) throw new Error(`Missing required DOM element: #${name}`);
  return el;
}

const INPUT_LAT = 0.06;

const STATES = Object.freeze({
  IDLE: "idle",
  PLAYING: "playing",
  RESULT: "result",
});

function setState(app, s) {
  app.dataset.state = s;
}
function getState(app) {
  return app.dataset.state || STATES.IDLE;
}

/* ===============================
   IDempotent Script Loader
   - same src will never be loaded twice
   - promise cached per src
================================= */
const __scriptCache = (globalThis[APP_KEY] ||= {}).scriptCache || new Map();
(globalThis[APP_KEY] ||= {}).scriptCache = __scriptCache;

function loadScriptOnce(src) {
  if (__scriptCache.has(src)) return __scriptCache.get(src);

  const p = new Promise((resolve, reject) => {
    // already present?
    const found = [...document.scripts].some((s) => s.src === src);
    if (found) return resolve();

    const s = document.createElement("script");
    const u = new URL(src);
    u.searchParams.set("v", String(Date.now())); // iOS sanity; still ok because cache map is by base src
    s.src = u.toString();
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load: " + src));
    document.head.appendChild(s);
  });

  __scriptCache.set(src, p);
  return p;
}

async function loadScriptsSequentially(files) {
  for (const src of files) {
    await loadScriptOnce(src);
  }
}

async function ensureLegacyLoaded() {
  await loadScriptsSequentially(ENGINE_FILES);

  // presentation is optional
  try {
    await loadScriptsSequentially(PRESENTATION_FILES);
  } catch (e) {
    console.warn("[DiCo] presentation load failed (fallback continues):", e);
  }
}

/* ===============================
   FETCH JSON
================================= */
async function fetchJSON(url) {
  const u = new URL(url, BASE).toString();
  const r = await fetch(u, { cache: "no-store" });
  if (!r.ok) throw new Error(`fetch failed ${u}: ${r.status}`);
  return r.json();
}

function fallbackChart() {
  const notes = [];
  const bpm = 145;
  const beat = 60 / bpm;
  const total = 60;

  for (let t = 1; t < total; t += beat) {
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
   RESULT PRESENTER SAFE WRAP
   - Use DI_RESULT if it exists
   - Else fallback (no throw)
================================= */
function getResultPresenterSafe({ app, refs }) {
  const impl = globalThis.DI_RESULT;

  if (impl && typeof impl.init === "function") {
    try {
      return impl.init({
        app,
        root: refs.result,
        dicoLine: refs.dicoLine,
        aruProg: refs.aruProg,
        aruValue: refs.aruValue,
        resultScore: refs.resultScore,
        resultMaxCombo: refs.resultMaxCombo,
        ariaLive: refs.ariaLive,
      });
    } catch (e) {
      console.warn("[DiCo] DI_RESULT.init failed -> fallback", e);
    }
  }

  // fallback
  return {
    show(payload) {
      // minimal, never breaks
      console.log("[DiCo] RESULT (fallback)", payload);
    },
    hide() {},
  };
}

/* ===============================
   LIFECYCLE (no collision)
   - dispose old instance on re-run
================================= */
function disposePreviousIfAny() {
  const prev = globalThis[APP_KEY];
  if (prev && prev.dispose && typeof prev.dispose === "function") {
    try { prev.dispose(); } catch {}
  }
}

/* ===============================
   BOOT
================================= */
async function boot() {
  // Prevent double boot collisions
  disposePreviousIfAny();

  // Mark running instance container
  const instance = (globalThis[APP_KEY] ||= {});
  instance.running = true;

  // AbortController: all listeners are registered with {signal}
  const ac = new AbortController();
  instance._ac = ac;

  // RAF tracking
  let raf = 0;
  const stopRAF = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  instance._stopRAF = stopRAF;

  // ===== DOM (required) =====
  const app = assertEl($("app"), "app");
  const canvas = assertEl($("noteCanvas"), "noteCanvas");
  const hitZone = assertEl($("hitZone"), "hitZone");
  const startBtn = assertEl($("startBtn"), "startBtn");
  const restartBtn = assertEl($("restartBtn"), "restartBtn");
  const music = assertEl($("music"), "music");

  // ===== DOM (optional) =====
  const bgVideo = $("bgVideo");
  const stopBtn = $("stopBtn");
  const seTap = $("seTap");
  const seGreat = $("seGreat");

  // background video: never autoplay on load
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

  // ===== legacy engine =====
  const E = globalThis.DI_ENGINE;
  if (!E) throw new Error("DI_ENGINE not loaded");

  // Keep existing IDs (compat)
  const refs = {
    // root
    app,

    // avatar + ring
    avatarRing: $("avatarRing"),
    dicoFace: $("dicoFace"),

    // judge UI (optional)
    judge: $("judge"),
    judgeMain: $("judgeMain"),
    judgeSub: $("judgeSub"),
    hitFlash: $("hitFlash"),

    // result overlay
    result: $("result"),
    resultScore: $("resultScore"),
    resultMaxCombo: $("resultMaxCombo"),
    dicoLine: $("dicoLine"),
    aruProg: $("aruProg"),
    aruValue: $("aruValue"),
    ariaLive: $("ariaLive"),
  };

  assertEl(refs.dicoFace, "dicoFace");

  // ===== instantiate engine components =====
  const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });

  // legacy FX (you can later replace with new FX core)
  const fxLegacy = new E.FX({ fxLayer: $("fxLayer") });

  const ui = new E.UI(refs);

  // game objects
  let timing = new E.Timing({ chart });
  let judge = new E.Judge({ chart, timing });
  let render = new E.Renderer({ canvas, chart, timing });
  render.resize?.();

  // result presenter
  const presenter = getResultPresenterSafe({ app, refs });

  // runtime flags
  let running = false;
  let lock = false;

  function rebuild() {
    timing = new E.Timing({ chart });
    judge = new E.Judge({ chart, timing });
    render = new E.Renderer({ canvas, chart, timing });
    render.resize?.();
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

  async function playMedia() {
    try {
      music.pause();
      music.currentTime = 0;
    } catch {}
    try {
      await music.play();
    } catch {}
    try {
      await bgVideo?.play?.();
    } catch {}
  }

  function stopMedia() {
    try { music.pause(); } catch {}
    try { bgVideo?.pause?.(); } catch {}
  }

  async function startGame() {
    // hard guards
    if (lock) return;
    if (running) return;
    if (getState(app) === STATES.PLAYING) return;

    lock = true;

    await audio.unlock();

    // clean rebuild (prevents residual state)
    rebuild();
    judge.reset?.();

    // deterministic timing start
    try {
      if (typeof timing.restart === "function") timing.restart(audio);
      else timing.start(audio, { reset: true });
    } catch (e) {
      console.warn("[DiCo] timing start error:", e);
    }

    setState(app, STATES.PLAYING);
    presenter.hide?.();
    ui.hideResult?.();

    running = true;
    stopRAF();
    tick();

    await playMedia();

    lock = false;
  }

  async function restartGame() {
    if (lock) return;
    lock = true;

    running = false;
    stopRAF();
    stopMedia();

    await audio.unlock();

    // rebuild + start
    rebuild();
    judge.reset?.();

    try {
      if (typeof timing.restart === "function") timing.restart(audio);
      else timing.start(audio, { reset: true });
    } catch (e) {
      console.warn("[DiCo] timing restart error:", e);
    }

    setState(app, STATES.PLAYING);
    presenter.hide?.();
    ui.hideResult?.();

    running = true;
    stopRAF();
    tick();

    await playMedia();

    lock = false;
  }

  function endToResult(reason = "STOP") {
    if (getState(app) === STATES.RESULT) return;

    running = false;
    stopRAF();

    try { timing.stop?.(audio); } catch {}
    stopMedia();

    setState(app, STATES.RESULT);

    const payload = {
      score: judge.state.score,
      maxCombo: judge.state.maxCombo,
      resonance: judge.state.resonance,
      reason,
    };

    ui.showResult?.(payload);
    try { presenter.show?.(payload); } catch (e) {
      console.warn("[DiCo] presenter.show failed:", e);
    }
  }

  // input
  const input = new E.Input({
    element: hitZone,
    onTap: (x, y) => {
      if (!running || getState(app) !== STATES.PLAYING) return;

      audio.playTap?.();
      fxLegacy.burstAt?.(x, y);

      const t = timing.getSongTime();
      if (!Number.isFinite(t)) return;

      const res = judge.hit(t + INPUT_LAT);

      ui.onJudge?.(res);

      if (res && (res.name === "GREAT" || res.name === "PERFECT")) {
        audio.playGreat?.();
        ui.flashHit?.();
        fxLegacy.sparkLine?.();
      }
    },
  });

  // buttons (AbortController to prevent duplicate registrations)
  startBtn.addEventListener("click", startGame, { signal: ac.signal });
  restartBtn.addEventListener("click", restartGame, { signal: ac.signal });
  stopBtn?.addEventListener("click", () => endToResult("STOP"), { signal: ac.signal });

  // resize safety
  window.addEventListener(
    "resize",
    () => {
      try { render?.resize?.(); } catch {}
      try { input?.recalc?.(); } catch {}
    },
    { passive: true, signal: ac.signal }
  );

  // init state
  setState(app, STATES.IDLE);
  stopMedia();

  ui.update?.({
    t: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    resonance: 0,
    state: STATES.IDLE,
  });

  // expose dispose (no collision guarantee)
  instance.dispose = () => {
    try { ac.abort(); } catch {}
    try { input?.destroy?.(); } catch {}
    try { running = false; } catch {}
    try { stopRAF(); } catch {}
    try { stopMedia(); } catch {}
    instance.running = false;
  };

  console.log("[DiCo] HYBRID MODULE SAFE BOOT OK (no collision)");
}

/* ===============================
   ENTRYPOINT (single run)
================================= */
(async () => {
  // If this module is evaluated again, dispose previous safely.
  // (e.g., hot reload / double script include / SPA navigation)
  try {
    await ensureLegacyLoaded();
    await boot();
  } catch (err) {
    console.error(err);
    const el = $("ariaLive");
    if (el) el.textContent = "Boot error: " + (err?.message || String(err));
  }
})();
