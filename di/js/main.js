/* /di/js/main.js
   PHASE1 PRO — STRICT DIAG + SINGLE AUDIO ROUTE (NO FREEZE)
   - Music control: ONLY via AudioManager (no direct <audio>.play/pause here)
   - Tick is guarded (try/catch) and emits ariaLive logs
   - Buttons emit logs so "click not firing" is provable
   - Drives FX: --aru-value + data-aru-state
   - Fixes HUD wiring: time_dup etc
*/
"use strict";

const BASE = new URL("./", import.meta.url);

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

const PRESENTATION_FILES = ["result.js"].map((p) => new URL(p, BASE).toString());

const APP_KEY = "__DICO_PHASE1__";
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

function setState(app, s) { app.dataset.state = s; }
function getState(app) { return app.dataset.state || STATES.IDLE; }

/* ===============================
   Idempotent legacy loader
================================= */
const __scriptCache = (globalThis[APP_KEY] ||= {}).scriptCache || new Map();
(globalThis[APP_KEY] ||= {}).scriptCache = __scriptCache;

function loadScriptOnce(src) {
  if (__scriptCache.has(src)) return __scriptCache.get(src);

  const p = new Promise((resolve, reject) => {
    const found = [...document.scripts].some((s) => s.src === src);
    if (found) return resolve();

    const s = document.createElement("script");
    const u = new URL(src);
    u.searchParams.set("v", String(Date.now())); // iOS sanity
    s.src = u.toString();
    s.async = false;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load: " + src));
    document.head.appendChild(s);
  });

  __scriptCache.set(src, p);
  return p;
}

async function loadScriptsSequentially(files) {
  for (const src of files) await loadScriptOnce(src);
}

async function ensureLegacyLoaded() {
  await loadScriptsSequentially(ENGINE_FILES);
  try { await loadScriptsSequentially(PRESENTATION_FILES); }
  catch (e) { console.warn("[DiCo] presentation load failed (fallback continues):", e); }
}

/* ===============================
   fetch chart
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
  for (let t = 1; t < total; t += beat) notes.push({ t: +t.toFixed(3), type: "tap" });
  return { meta: { title: "fallback", bpm }, offset: 0, scroll: { approach: 1.25 }, notes };
}

/* ===============================
   presenter (optional)
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
  return { show: (p) => console.log("[DiCo] RESULT (fallback)", p), hide() {} };
}

/* ===============================
   --res-color sync
================================= */
function makeResColorSync() {
  const root = document.documentElement;
  let lastHue = NaN;

  const HUE_MIN = 190;
  const HUE_MAX = 55;
  const UPDATE_STEP_DEG = 1.5;

  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  function resonanceToHue(rPct) {
    let v = Number(rPct);
    if (!Number.isFinite(v)) v = 0;
    if (v > 1.5) v /= 100;
    const x = clamp01(v);
    const eased = x * x * (3 - 2 * x);
    return HUE_MIN + (HUE_MAX - HUE_MIN) * eased;
  }

  function setByResonance(rPct) {
    const hue = resonanceToHue(rPct);
    if (Number.isFinite(lastHue) && Math.abs(hue - lastHue) < UPDATE_STEP_DEG) return;
    lastHue = hue;

    const h = hue.toFixed(2);
    root.style.setProperty("--res-hue", h);
    root.style.setProperty("--res-color", `hsl(${h}, 92%, 62%)`);
    root.style.setProperty("--res-color-soft", `hsla(${h}, 92%, 62%, .35)`);
    root.style.setProperty("--res-color-glow", `hsla(${h}, 92%, 62%, .18)`);
  }

  return { setByResonance };
}

/* ===============================
   ARU FX driver
================================= */
function applyAruState(app, resonancePct) {
  const r = Math.max(0, Math.min(100, Number(resonancePct) || 0));
  const v01 = r / 100;
  app.style.setProperty("--aru-value", v01.toFixed(3));

  let s = "low";
  if (r >= 90) s = "max";
  else if (r >= 65) s = "high";
  else if (r >= 35) s = "mid";
  app.dataset.aruState = s;
}

/* ===============================
   lifecycle
================================= */
function disposePreviousIfAny() {
  const prev = globalThis[APP_KEY];
  if (prev && typeof prev.dispose === "function") {
    try { prev.dispose(); } catch {}
  }
}

async function boot() {
  disposePreviousIfAny();

  const instance = (globalThis[APP_KEY] ||= {});
  instance.running = true;

  const ac = new AbortController();
  instance._ac = ac;

  let raf = 0;
  const stopRAF = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  instance._stopRAF = stopRAF;

  // required DOM
  const app = assertEl($("app"), "app");
  const canvas = assertEl($("noteCanvas"), "noteCanvas");
  const hitZone = assertEl($("hitZone"), "hitZone");
  const startBtn = assertEl($("startBtn"), "startBtn");
  const restartBtn = assertEl($("restartBtn"), "restartBtn");
  const stopBtn = $("stopBtn");

  const music = assertEl($("music"), "music");
  const seTap = $("seTap");
  const seGreat = $("seGreat");
  const bgVideo = $("bgVideo");

  if (bgVideo) {
    try {
      bgVideo.muted = true;
      bgVideo.playsInline = true;
      bgVideo.loop = true;
      bgVideo.preload = "metadata";
      bgVideo.pause();
    } catch {}
  }

  // chart
  let chart;
  try { chart = await fetchJSON("charts/chart_001.json"); }
  catch (e) { chart = fallbackChart(); console.warn("[DiCo] chart fallback:", e); }

  // engine
  const E = globalThis.DI_ENGINE;
  if (!E) throw new Error("DI_ENGINE not loaded");

  // refs (match di.html exactly)
  const refs = {
    app,

    avatarRing: $("avatarRing"),
    dicoFace: $("dicoFace"),
    face1: $("face1"),
    face2: $("face2"),
    face3: $("face3"),
    face4: $("face4"),
    face5: $("face5"),

    judge: $("judge"),
    judgeMain: $("judgeMain"),
    judgeSub: $("judgeSub"),
    hitFlash: $("hitFlash"),

    sideScore: $("sideScore"),
    sideCombo: $("sideCombo"),
    sideMaxCombo: $("sideMaxCombo"),
    resValue: $("resValue"),
    resFill: $("resFill"),
    time: $("time"),

    score: $("score"),
    combo: $("combo"),
    maxCombo: $("maxCombo"),
    timeDup: $("time_dup"), // ✅ underscore

    result: $("result"),
    resultScore: $("resultScore"),
    resultMaxCombo: $("resultMaxCombo"),
    dicoLine: $("dicoLine"),
    aruProg: $("aruProg"),
    aruValue: $("aruValue"),
    ariaLive: $("ariaLive"),
  };

  assertEl(refs.dicoFace, "dicoFace");
  const log = (m) => { if (refs.ariaLive) refs.ariaLive.textContent = String(m); };

  const resColor = makeResColorSync();
  resColor.setByResonance(0);
  applyAruState(app, 0);

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

    try {
      const t = timing.getSongTime();
      if (!Number.isFinite(t)) {
        log("tick: time NaN (timing)");
        return;
      }

      judge.sweepMiss(t);
      render.draw(t);

      const res = judge.state.resonance;
      resColor.setByResonance(res);
      applyAruState(app, res);

      ui.update({
        t,
        score: judge.state.score,
        combo: judge.state.combo,
        maxCombo: judge.state.maxCombo,
        resonance: res,
        state: getState(app),
      });

      // (optional) live proof that loop runs
      // log(`t=${t.toFixed(2)} score=${judge.state.score}`);

      if (timing.isEnded(t)) endToResult("ENDED");
    } catch (e) {
      console.error(e);
      log("tick error: " + (e?.message || String(e)));
      // keep running but stop to avoid infinite crash spam:
      endToResult("ERROR");
    }
  }

  async function playBGVideo() {
    try { await bgVideo?.play?.(); } catch {}
  }
  function stopBGVideo() {
    try { bgVideo?.pause?.(); } catch {}
  }

  async function startGame() {
    log("START clicked");
    if (lock || running || getState(app) === STATES.PLAYING) return;

    lock = true;
    await audio.unlock();

    rebuild();
    judge.reset?.();

    // ✅ timing drives audio via AudioManager
    try {
      if (typeof timing.restart === "function") timing.restart(audio);
      else timing.start(audio, { reset: true });
    } catch (e) {
      console.warn("[DiCo] timing start error:", e);
      log("timing start error");
    }

    setState(app, STATES.PLAYING);
    presenter.hide?.();
    ui.hideResult?.();

    running = true;
    stopRAF();
    tick();

    await playBGVideo();
    lock = false;
  }

  async function restartGame() {
    log("RESTART clicked");
    if (lock) return;
    lock = true;

    // stop loop first
    running = false;
    stopRAF();

    // ✅ stop music ONLY via AudioManager
    try { audio.stopMusic?.(); } catch {}
    stopBGVideo();

    await audio.unlock();

    rebuild();
    judge.reset?.();

    try {
      if (typeof timing.restart === "function") timing.restart(audio);
      else timing.start(audio, { reset: true });
    } catch (e) {
      console.warn("[DiCo] timing restart error:", e);
      log("timing restart error");
    }

    setState(app, STATES.PLAYING);
    presenter.hide?.();
    ui.hideResult?.();

    running = true;
    stopRAF();
    tick();

    await playBGVideo();
    lock = false;
  }

  function endToResult(reason = "STOP") {
    if (getState(app) === STATES.RESULT) return;

    log("RESULT: " + reason);

    running = false;
    stopRAF();

    try { timing.stop?.(audio); } catch {}
    try { audio.stopMusic?.(); } catch {}
    stopBGVideo();

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

      if (res && (res.name === "GREAT" || res.name === "PERFECT" || res.name === "GOOD")) {
        // GOODでもスコア増えるので、ここで鳴らしてもOK
        audio.playGreat?.();
        ui.flashHit?.();
        fxLegacy.sparkLine?.();
      }
    },
  });

  // listeners
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

  // init
  setState(app, STATES.IDLE);
  try { audio.stopMusic?.(); } catch {}
  stopBGVideo();

  applyAruState(app, 0);
  resColor.setByResonance(0);
  ui.update?.({ t: 0, score: 0, combo: 0, maxCombo: 0, resonance: 0, state: STATES.IDLE });
  log("BOOT OK");

  instance.dispose = () => {
    try { ac.abort(); } catch {}
    try { input?.destroy?.(); } catch {}
    try { running = false; } catch {}
    try { stopRAF(); } catch {}
    try { audio.stopMusic?.(); } catch {}
    try { stopBGVideo(); } catch {}
    instance.running = false;
  };
}

// entry
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
