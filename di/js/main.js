/* /di/js/main.js
   PHASE1 PRO — HYBRID MODULE SAFE (NO-COLLISION / NO-REGRESSION)
   - main.js: ESModule only
   - engine: legacy scripts (window.DI_ENGINE)
   - idempotent loader (safe if called twice)
   - single-run guard + abortable listeners
   - deterministic lifecycle: boot -> idle -> playing -> result
   - ✅ integrates CSS var: --res-color (lightweight + smooth)
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

// Optional presenter (legacy script load; DI_RESULT if exists)
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
================================= */
const __scriptCache = (globalThis[APP_KEY] ||= {}).scriptCache || new Map();
(globalThis[APP_KEY] ||= {}).scriptCache = __scriptCache;

function loadScriptOnce(src) {
  if (__scriptCache.has(src)) return __scriptCache.get(src);

  const p = new Promise((resolve, reject) => {
    // already present? (base URL match)
    const found = [...document.scripts].some((s) => s.src === src);
    if (found) return resolve();

    const s = document.createElement("script");
    const u = new URL(src);
    u.searchParams.set("v", String(Date.now())); // iOS sanity
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

  return {
    show(payload) {
      console.log("[DiCo] RESULT (fallback)", payload);
    },
    hide() {},
  };
}

/* ===============================
   LIFECYCLE (no collision)
================================= */
function disposePreviousIfAny() {
  const prev = globalThis[APP_KEY];
  if (prev && typeof prev.dispose === "function") {
    try { prev.dispose(); } catch {}
  }
}

/* ===============================
   ✅ RES COLOR SYNC (LIGHT + SMOOTH)
   - updates CSS var --res-color only when needed
   - resonance is treated as 0..100 (percent)
================================= */
function makeResColorSync() {
  const root = document.documentElement;
  let lastHue = NaN;

  // You can tune these:
  const HUE_MIN = 190; // cyan-ish
  const HUE_MAX = 55;  // gold-ish (wrap style looks good)
  const UPDATE_STEP_DEG = 2.0; // only update if hue changes enough

  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  function resonanceToHue01(rPct) {
    // rPct can be 0..100 or 0..1; normalize safely
    let v = Number(rPct);
    if (!Number.isFinite(v)) v = 0;
    if (v > 1.5) v = v / 100;     // assume percent
    const x = clamp01(v);

    // smooth curve: early subtle, later more dramatic
    const eased = x * x * (3 - 2 * x); // smoothstep
    // We want hue drift cyan->purple->gold feeling:
    // simplest: interpolate between HUE_MIN and HUE_MAX
    const hue = HUE_MIN + (HUE_MAX - HUE_MIN) * eased;
    return hue;
  }

  function setResColorByResonance(rPct) {
    const hue = resonanceToHue01(rPct);
    if (Number.isFinite(lastHue) && Math.abs(hue - lastHue) < UPDATE_STEP_DEG) return;
    lastHue = hue;

    // Core color (you can also set companion vars if needed)
    root.style.setProperty("--res-hue", String(hue.toFixed(2)));
    root.style.setProperty("--res-color", `hsl(${hue.toFixed(2)}, 92%, 62%)`);
    root.style.setProperty("--res-color-soft", `hsla(${hue.toFixed(2)}, 92%, 62%, .35)`);
    root.style.setProperty("--res-color-glow", `hsla(${hue.toFixed(2)}, 92%, 62%, .18)`);
  }

  return { setResColorByResonance };
}

/* ===============================
   BOOT
================================= */
async function boot() {
  disposePreviousIfAny();

  const instance = (globalThis[APP_KEY] ||= {});
  instance.running = true;

  const ac = new AbortController();
  instance._ac = ac;

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

  const refs = {
    app,
    avatarRing: $("avatarRing"),
    dicoFace: $("dicoFace"),

    judge: $("judge"),
    judgeMain: $("judgeMain"),
    judgeSub: $("judgeSub"),
    hitFlash: $("hitFlash"),

    result: $("result"),
    resultScore: $("resultScore"),
    resultMaxCombo: $("resultMaxCombo"),
    dicoLine: $("dicoLine"),
    aruProg: $("aruProg"),
    aruValue: $("aruValue"),
    ariaLive: $("ariaLive"),
  };

  assertEl(refs.dicoFace, "dicoFace");

  // ✅ initialize CSS var sync (safe even if CSS doesn't use it yet)
  const resColor = makeResColorSync();
  resColor.setResColorByResonance(0);

  const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });
  const fxLegacy = new E.FX({ fxLayer: $("fxLayer") });
  const ui = new E.UI(refs);

  let timing = new E.Timing({ chart });
  let judge = new E.Judge({ chart, timing });
  let render = new E.Renderer({ canvas, chart, timing });
  render.resize?.();

  const presenter = getResultPresenterSafe({ app, refs });

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

    // ✅ update color sync BEFORE/AFTER ui.update both ok.
    // Here: after judge state is updated; before ui uses it next paint.
    resColor.setResColorByResonance(judge.state.resonance);

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
    try { music.pause(); music.currentTime = 0; } catch {}
    try { await music.play(); } catch {}
    try { await bgVideo?.play?.(); } catch {}
  }

  function stopMedia() {
    try { music.pause(); } catch {}
    try { bgVideo?.pause?.(); } catch {}
  }

  async function startGame() {
    if (lock) return;
    if (running) return;
    if (getState(app) === STATES.PLAYING) return;

    lock = true;

    await audio.unlock();

    rebuild();
    judge.reset?.();

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

        // ✅ optional: micro boost on successful hit (feels addictive)
        // (tick() will naturally pull it back within a frame or two)
        // If you want stronger boost, uncomment:
        // document.documentElement.style.setProperty("--res-color", "hsla(50, 100%, 65%, 1)");
      }
    },
  });

  // listeners (AbortController prevents duplicates on re-run)
  startBtn.addEventListener("click", startGame, { signal: ac.signal });
  restartBtn.addEventListener("click", restartGame, { signal: ac.signal });
  stopBtn?.addEventListener("click", () => endToResult("STOP"), { signal: ac.signal });

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

  instance.dispose = () => {
    try { ac.abort(); } catch {}
    try { input?.destroy?.(); } catch {}
    try { running = false; } catch {}
    try { stopRAF(); } catch {}
    try { stopMedia(); } catch {}
    instance.running = false;
  };

  console.log("[DiCo] HYBRID MODULE SAFE BOOT OK (+ --res-color sync)");
}

/* ===============================
   ENTRYPOINT (single run)
================================= */
(async () => {
  try {
    await ensureLegacyLoaded();
    await boot();
  } catch (err) {
    console.error(err);
    const el = $("ariaLive");
    if (el) el.textContent = "Boot error: " + (err?.message || String(err));
  }
})();
