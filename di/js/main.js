/* /di/js/main.js
   DiCo ARU Phase1 — PRO STABLE ENTRY v2.1 (iOS Zoom/Drift FIXED)
   ------------------------------------------------------------
   ✅ iOS Safari safe (gesture unlock, video play in-gesture)
   ✅ Prevent double-tap zoom / scroll drift (hitZone scoped)
   ✅ Deterministic state machine: idle -> playing -> result
   ✅ Single clock (Timing drives everything)
   ✅ No cache-killing loader (dev only bust)
   ✅ Heavy init deferred (FXCore lazy)
   ✅ Robust restart (no stalled notes / audio desync)
   ✅ Debug probes for "bg video stalled", viewport/zoom changes
*/

"use strict";

import { FXCore } from "./engine/fx/index.js";

const BASE = new URL("./", import.meta.url);

const ENGINE_FILES = [
  "engine/audio.js",
  "engine/timing.js",
  "engine/input.js",
  "engine/judge.js",
  "engine/render.js",
  "engine/ui.js",
  "notes/skin-tarot-pinkgold.js",
].map((p) => new URL(p, BASE).toString());

const PRESENTATION_FILES = ["result.js"].map((p) => new URL(p, BASE).toString());

// ---------------------------------------------------------------------
// ENV / VERSION
// ---------------------------------------------------------------------
const DEV =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1" ||
  location.search.includes("dev=1") ||
  location.search.includes("nocache=1");

const BUILD_VER = "2026-02-22";

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------
const APP_KEY = "__DICO_PHASE1__";
const $ = (id) => document.getElementById(id);

const STATES = Object.freeze({ IDLE: "idle", PLAYING: "playing", RESULT: "result" });

function setState(app, s) {
  app.dataset.state = s;
}
function getState(app) {
  return app.dataset.state || STATES.IDLE;
}
function assertEl(el, name) {
  if (!el) throw new Error(`Missing #${name}`);
  return el;
}

function now() {
  return performance?.now?.() ?? Date.now();
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// ---------------------------------------------------------------------
// SCRIPT LOADER (NO CACHE KILL IN PROD)
// ---------------------------------------------------------------------
const __scriptCache = (globalThis[APP_KEY] ||= {}).scriptCache || new Map();
(globalThis[APP_KEY] ||= {}).scriptCache = __scriptCache;

function withVersion(src) {
  const u = new URL(src);
  if (DEV) u.searchParams.set("v", String(Date.now()));
  else u.searchParams.set("v", BUILD_VER);
  return u.toString();
}

function loadScriptOnce(src) {
  if (__scriptCache.has(src)) return __scriptCache.get(src);

  const p = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = withVersion(src);
    s.async = false; // keep order deterministic
    s.onload = () => resolve();
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
  const t0 = now();
  await loadScriptsSequentially(ENGINE_FILES);
  const t1 = now();
  try {
    await loadScriptsSequentially(PRESENTATION_FILES);
  } catch (e) {
    console.warn("[DiCo] presentation load failed", e);
  }
  const t2 = now();
  console.debug("[PERF] legacy(engine) ms:", (t1 - t0).toFixed(1));
  console.debug("[PERF] legacy(presentation) ms:", (t2 - t1).toFixed(1));
}

// ---------------------------------------------------------------------
// DATA FETCH
// ---------------------------------------------------------------------
async function fetchJSON(url) {
  const u = new URL(url, BASE).toString();
  const r = await fetch(u, { cache: DEV ? "no-store" : "force-cache" });
  if (!r.ok) throw new Error(`fetch failed ${u}: ${r.status}`);
  return r.json();
}

function fallbackChart() {
  const notes = [];
  const bpm = 145;
  const beat = 60 / bpm;
  for (let t = 1; t < 80; t += beat) notes.push({ t: +t.toFixed(3), type: "tap" });
  return { meta: { title: "fallback", bpm }, offset: 0, scroll: { approach: 1.25 }, notes };
}

// ---------------------------------------------------------------------
// RESULT PRESENTER SAFE
// ---------------------------------------------------------------------
function getResultPresenterSafe({ refs }) {
  const impl = globalThis.DI_RESULT;
  if (impl && typeof impl.init === "function") {
    try {
      return impl.init({
        app: refs.app,
        root: refs.result,
        dicoLine: refs.dicoLine,
        aruProg: refs.aruProg,
        aruValue: refs.aruValue,
        resultScore: refs.resultScore,
        resultMaxCombo: refs.resultMaxCombo,
        ariaLive: refs.ariaLive,
      });
    } catch (e) {
      console.warn("[DiCo] DI_RESULT.init failed", e);
    }
  }
  return { show: () => {}, hide: () => {} };
}

// ---------------------------------------------------------------------
// RES COLOR SYNC (CSS vars)
// ---------------------------------------------------------------------
function makeResColorSync() {
  const root = document.documentElement;
  let lastHue = NaN;
  const HUE_MIN = 190;
  const HUE_MAX = 55;
  const UPDATE_STEP_DEG = 1.5;

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const resonanceToHue = (rPct) => {
    let v = Number(rPct);
    if (!Number.isFinite(v)) v = 0;
    if (v > 1.5) v /= 100; // allow 0..100
    const x = clamp01(v);
    const eased = x * x * (3 - 2 * x);
    return HUE_MIN + (HUE_MAX - HUE_MIN) * eased;
  };

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

function applyAruState(app, resonancePct) {
  const r = clamp(Number(resonancePct) || 0, 0, 100);
  app.style.setProperty("--aru-value", (r / 100).toFixed(3));
  app.dataset.aruState = r >= 90 ? "max" : r >= 65 ? "high" : r >= 35 ? "mid" : "low";
}

// ---------------------------------------------------------------------
// VIDEO PROBES
// ---------------------------------------------------------------------
function attachVideoDebug(bgVideo) {
  if (!bgVideo) return;
  const evs = [
    "loadstart",
    "loadedmetadata",
    "loadeddata",
    "canplay",
    "canplaythrough",
    "stalled",
    "waiting",
    "playing",
    "pause",
    "ended",
    "error",
  ];
  for (const ev of evs) {
    bgVideo.addEventListener(
      ev,
      () => {
        console.debug("[BGV]", ev, {
          readyState: bgVideo.readyState,
          networkState: bgVideo.networkState,
          paused: bgVideo.paused,
          t: +bgVideo.currentTime.toFixed(3),
        });
      },
      { passive: true }
    );
  }
}

async function safePlayVideo(bgVideo) {
  if (!bgVideo) return;
  try {
    await bgVideo.play?.();
  } catch (e) {
    console.warn("[BGV] play failed (ok on iOS)", e?.message || e);
  }
}

// ---------------------------------------------------------------------
// iOS SAFETY: prevent double-tap zoom / scroll drift (hitZone scoped)
// ---------------------------------------------------------------------
function preventIOSZoomAndScroll(el, { signal, debugTag = "HIT" } = {}) {
  if (!el) return () => {};
  // Visual hint for Safari and prevent selection/callout without CSS edits
  try {
    el.style.webkitTapHighlightColor = "transparent";
    el.style.webkitUserSelect = "none";
    el.style.userSelect = "none";
    el.style.webkitTouchCallout = "none";
    // touch-action works on modern Safari; safe to set
    el.style.touchAction = "manipulation";
  } catch {}

  // 1) Hard block: prevent default on touchstart/move (passive:false)
  const onTouchStart = (e) => {
    // Single touch tap area: stop scroll/zoom
    if (e.touches && e.touches.length === 1) e.preventDefault();
  };
  const onTouchMove = (e) => {
    e.preventDefault();
  };

  // 2) Classic iOS double-tap zoom guard (touchend interval)
  let lastTouchEnd = 0;
  const onTouchEnd = (e) => {
    const t = Date.now();
    if (t - lastTouchEnd <= 250) e.preventDefault();
    lastTouchEnd = t;
  };

  // 3) Prevent gesture events (older iOS pinch)
  const onGesture = (e) => {
    e.preventDefault();
  };

  el.addEventListener("touchstart", onTouchStart, { passive: false, signal });
  el.addEventListener("touchmove", onTouchMove, { passive: false, signal });
  el.addEventListener("touchend", onTouchEnd, { passive: false, signal });

  // iOS Safari: gesturestart/gesturechange/gestureend (non-standard)
  window.addEventListener("gesturestart", onGesture, { passive: false, signal });
  window.addEventListener("gesturechange", onGesture, { passive: false, signal });
  window.addEventListener("gestureend", onGesture, { passive: false, signal });

  // 4) Viewport drift detection (debug only)
  if (DEV) {
    const vv = window.visualViewport;
    if (vv) {
      const logVV = () => {
        console.debug(`[${debugTag}] visualViewport`, {
          scale: vv.scale,
          w: vv.width,
          h: vv.height,
          x: vv.offsetLeft,
          y: vv.offsetTop,
        });
      };
      vv.addEventListener("resize", logVV, { passive: true, signal });
      vv.addEventListener("scroll", logVV, { passive: true, signal });
      logVV();
    } else {
      console.debug(`[${debugTag}] visualViewport not supported`);
    }
  }

  // cleanup closure (optional; AbortController handles normally)
  return () => {
    try {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("gesturestart", onGesture);
      window.removeEventListener("gesturechange", onGesture);
      window.removeEventListener("gestureend", onGesture);
    } catch {}
  };
}

// ---------------------------------------------------------------------
// INSTANCE CLEANUP
// ---------------------------------------------------------------------
function disposePreviousIfAny() {
  const prev = globalThis[APP_KEY];
  if (prev && typeof prev.dispose === "function") {
    try {
      prev.dispose();
    } catch (e) {
      console.warn("[DiCo] dispose prev failed", e);
    }
  }
}

function bindPress(btn, fn, signal) {
  let lastTs = -1;
  const wrapped = (e) => {
    const ts = Number(e?.timeStamp || 0);
    if (ts && Math.abs(ts - lastTs) < 8) return;
    lastTs = ts;
    fn(e);
  };
  btn.addEventListener("click", wrapped, { signal });
  btn.addEventListener("pointerup", wrapped, { signal });
}

// ---------------------------------------------------------------------
// BOOT
// ---------------------------------------------------------------------
async function boot() {
  disposePreviousIfAny();

  const instance = (globalThis[APP_KEY] ||= {});
  instance.running = true;

  const ac = new AbortController();

  let raf = 0;
  const stopRAF = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  // DOM refs
  const app = assertEl($("app"), "app");
  const canvas = assertEl($("noteCanvas"), "noteCanvas");
  const hitZone = assertEl($("hitZone"), "hitZone");
  const startBtn = assertEl($("startBtn"), "startBtn");
  const restartBtn = assertEl($("restartBtn"), "restartBtn");
  const stopBtn = $("stopBtn");
  const fxLayer = assertEl($("fxLayer"), "fxLayer");

  const music = assertEl($("music"), "music");
  const seTap = $("seTap");
  const seGreat = $("seGreat");
  const bgVideo = $("bgVideo");

  attachVideoDebug(bgVideo);

  // ✅ Prevent iOS zoom/drift (hitZone only)
  preventIOSZoomAndScroll(hitZone, { signal: ac.signal, debugTag: "HIT" });

  // Also prevent accidental selection on the overall app (safe, no scroll expected)
  try {
    app.style.webkitUserSelect = "none";
    app.style.userSelect = "none";
    app.style.webkitTapHighlightColor = "transparent";
  } catch {}

  // Chart load
  let chart;
  try {
    chart = await fetchJSON("charts/chart_001.json");
  } catch (e) {
    chart = fallbackChart();
    console.warn("[DiCo] chart fallback", e);
  }

  // Legacy globals
  const E = globalThis.DI_ENGINE;
  if (!E) throw new Error("DI_ENGINE not loaded (engine scripts missing)");

  // UI refs (IDs unchanged)
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
    timeDup: $("time_dup"),
    result: $("result"),
    resultScore: $("resultScore"),
    resultMaxCombo: $("resultMaxCombo"),
    dicoLine: $("dicoLine"),
    aruProg: $("aruProg"),
    aruValue: $("aruValue"),
    ariaLive: $("ariaLive"),
  };

  const log = (m) => {
    if (refs.ariaLive) refs.ariaLive.textContent = String(m);
    console.debug("[DiCo]", m);
  };

  // Visual sync
  const resColor = makeResColorSync();
  resColor.setByResonance(0);
  applyAruState(app, 0);

  // Managers
  const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });
  const ui = new E.UI(refs);
  const presenter = getResultPresenterSafe({ refs });

  // Heavy: FXCore lazy
  let fx = null;
  const ensureFX = () => (fx ||= new FXCore({ layer: fxLayer, app }));

  // Core systems (rebuildable)
  let timing = new E.Timing({ chart });
  let judge = new E.Judge({ chart, timing });
  let render = new E.Renderer({ canvas, chart, timing, judge });

  // input latency
  const INPUT_LAT = 0.06;
  judge.setInputLatency?.(INPUT_LAT);

  let running = false;
  let lock = false;

  const rebuild = () => {
    timing = new E.Timing({ chart });
    judge = new E.Judge({ chart, timing });
    judge.setInputLatency?.(INPUT_LAT);
    render = new E.Renderer({ canvas, chart, timing, judge });
    render.resize?.();
  };

  // RAF loop
  function tick() {
    if (!running) return;
    raf = requestAnimationFrame(tick);

    const t = timing.getSongTime();
    if (!Number.isFinite(t)) return;

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

    if (timing.isEnded(t)) endToResult("ENDED");
  }

  // iOS gesture unlock (audio + video)
  function primeInGesture() {
    try {
      audio.primeUnlock?.();
    } catch {}

    // iOS: ensure muted + playsinline before play
    try {
      if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.setAttribute("playsinline", "");
        bgVideo.setAttribute("webkit-playsinline", "");
      }
    } catch {}

    // fire and forget (must be inside gesture)
    safePlayVideo(bgVideo);
  }

  async function unlockBestEffort() {
    try {
      await audio.unlock?.();
    } catch (e) {
      console.warn("[DiCo] audio.unlock failed (may be ok)", e?.message || e);
    }
  }

  // transitions
  function hardStopAll() {
    running = false;
    stopRAF();
    try {
      timing.stop?.(audio);
    } catch {}
    try {
      audio.stopMusic?.({ reset: true });
    } catch {}
  }

  async function startFromScratch(kind = "START") {
    primeInGesture();
    await unlockBestEffort();

    // 1) stop
    hardStopAll();

    // 2) rebuild
    rebuild();
    judge.reset?.();

    // 3) start timing+audio
    if (kind === "RESTART" && typeof timing.restart === "function") {
      timing.restart(audio);
    } else {
      timing.start(audio, { reset: true });
    }

    // 4) show playing
    setState(app, STATES.PLAYING);
    presenter.hide?.();
    ui.hideResult?.();
    log(`STATE: PLAYING (${kind})`);

    // 5) init FX now (avoid first-tap hitch)
    ensureFX();

    // 6) run
    running = true;
    tick();

    // 7) video
    await safePlayVideo(bgVideo);
  }

  async function startGame() {
    if (lock) return;
    lock = true;
    log("START: begin");
    try {
      await startFromScratch("START");
      log("START: done");
    } finally {
      lock = false;
    }
  }

  async function restartGame() {
    if (lock) return;
    lock = true;
    log("RESTART: begin");
    try {
      await startFromScratch("RESTART");
      log("RESTART: done");
    } finally {
      lock = false;
    }
  }

  function endToResult(reason = "STOP") {
    if (getState(app) === STATES.RESULT) return;

    running = false;
    stopRAF();

    try {
      timing.stop?.(audio);
    } catch {}

    // design choice: pause video on result
    try {
      bgVideo?.pause?.();
    } catch {}

    setState(app, STATES.RESULT);
    log(`RESULT: ${reason}`);

    const payload = {
      score: judge.state.score,
      maxCombo: judge.state.maxCombo,
      resonance: judge.state.resonance,
      reason,
    };

    ui.showResult?.(payload);
    presenter.show?.(payload);
  }

  // Input
  const input = new E.Input({
    element: hitZone,
    onTap: (x, y, _ts, ev) => {
      if (!running || getState(app) !== STATES.PLAYING) return;

      // local coords (FX layer)
      const hitRect = hitZone.getBoundingClientRect();
      const clientX = Number(ev?.clientX ?? hitRect.left + x);
      const clientY = Number(ev?.clientY ?? hitRect.top + y);

      const fxRect = fxLayer.getBoundingClientRect();
      const lx = clientX - fxRect.left;
      const ly = clientY - fxRect.top;

      // FX (lazy)
      const fxi = ensureFX();
      fxi.burst(lx, ly);
      if (refs.avatarRing) fxi.stream(lx, ly, refs.avatarRing);

      // audio
      audio.playTap?.();

      // judgement
      const t = timing.getSongTime();
      if (!Number.isFinite(t)) return;

      const res = judge.hit(t);
      ui.onJudge?.(res);

      if (res && (res.name === "GREAT" || res.name === "PERFECT" || res.name === "GOOD")) {
        audio.playGreat?.();
        ui.flashHit?.();
      }
    },
  });

  // Controls
  bindPress(startBtn, startGame, ac.signal);
  bindPress(restartBtn, restartGame, ac.signal);
  if (stopBtn) bindPress(stopBtn, () => endToResult("STOP"), ac.signal);

  // Resize/orientation/viewport drift: keep canvas/input aligned
  const onResize = () => {
    try {
      render?.resize?.();
    } catch {}
    try {
      input?.recalc?.();
    } catch {}
  };

  window.addEventListener("resize", onResize, { passive: true, signal: ac.signal });
  window.addEventListener("orientationchange", onResize, { passive: true, signal: ac.signal });

  // visualViewport is the real source of drift on iOS
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onResize, { passive: true, signal: ac.signal });
    window.visualViewport.addEventListener("scroll", onResize, { passive: true, signal: ac.signal });
  }

  // Initial state
  setState(app, STATES.IDLE);

  try {
    audio.stopMusic?.({ reset: true });
  } catch {}
  try {
    bgVideo?.pause?.();
  } catch {}

  ui.update?.({ t: 0, score: 0, combo: 0, maxCombo: 0, resonance: 0, state: STATES.IDLE });
  log("BOOT OK");

  // Dispose
  instance.dispose = () => {
    try {
      ac.abort();
    } catch {}
    try {
      input?.destroy?.();
    } catch {}
    running = false;
    stopRAF();
    try {
      audio.stopMusic?.({ reset: true });
    } catch {}
    try {
      bgVideo?.pause?.();
    } catch {}
    instance.running = false;
  };
}

// ---------------------------------------------------------------------
// ENTRY
// ---------------------------------------------------------------------
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
