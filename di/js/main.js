/* /di/js/main.js
   DiCo ARU Phase1 — PRO STABLE ENTRY v2.1 (FULL INTEGRATED)
   ------------------------------------------------------------
   ✅ iOS Safari safe (gesture unlock, VIDEO PLAY IN-GESTURE)
   ✅ Prevent double-tap zoom / scroll drift (hitZone scoped)
   ✅ Deterministic state machine: idle -> playing -> result
   ✅ Single clock (Timing drives everything)
   ✅ No cache-killing loader (dev only bust / prod fixed ver)
   ✅ Heavy init deferred (FXCore lazy, but prewarmed on start)
   ✅ Robust restart (no stalled notes / audio desync)
   ✅ Debug probes for bg video stall + visualViewport drift
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

// 本番固定バージョン（更新したら文字列を変える）
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

// ---------------------------------------------------------------------// ---------------------------------------------------------------------
// DATA FETCH
// ---------------------------------------------------------------------

// ★追加：/di/ を基準にしたアセット基準（main.js は /di/js/ 配下なので 1つ上）
const ASSET_BASE = new URL("../", import.meta.url);

async function fetchJSON(url) {
  // ★ここを BASE ではなく ASSET_BASE にする
  const u = new URL(url, ASSET_BASE).toString();
  const r = await fetch(u, { cache: DEV ? "no-store" : "force-cache" });
  if (!r.ok) throw new Error(`fetch failed ${u}: ${r.status}`);
  return r.json();
}

function fallbackChart() {
  const notes = [];
  const bpm = 145;
  const beat = 60 / bpm;
  // 80秒想定
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
// VIDEO PROBES + iOS "PLAY IN GESTURE" KICK
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

// ✅ iOS最重要：ユーザー操作の同期区間で play() を叩く（awaitしない）
function kickVideoInGesture(bgVideo) {
  if (!bgVideo) return;
  try {
    bgVideo.muted = true;
    // property + attr 両方（iOSの個体差対策）
    bgVideo.playsInline = true;
    bgVideo.setAttribute("playsinline", "");
    bgVideo.setAttribute("webkit-playsinline", "");
    // preload は metadata のままでもOK。強めたいなら "auto" に。
    const p = bgVideo.play?.();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {}
}

// “後追い再生” は await しない（gesture外でも最悪害が少ない）
function bestEffortPlayVideo(bgVideo) {
  if (!bgVideo) return;
  try {
    const p = bgVideo.play?.();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {}
}

// ---------------------------------------------------------------------
// iOS SAFETY: prevent double-tap zoom / scroll drift (hitZone scoped)
// ---------------------------------------------------------------------
function preventIOSZoomAndScroll(el, { signal, debugTag = "HIT" } = {}) {
  if (!el) return () => {};
  try {
    el.style.webkitTapHighlightColor = "transparent";
    el.style.webkitUserSelect = "none";
    el.style.userSelect = "none";
    el.style.webkitTouchCallout = "none";
    // modern safari respects this; harmless otherwise
    el.style.touchAction = "manipulation";
  } catch {}

  const onTouchStart = (e) => {
    // allow 1-finger tap but block page scroll/zoom
    if (e.touches && e.touches.length === 1) e.preventDefault();
  };
  const onTouchMove = (e) => {
    e.preventDefault();
  };

  let lastTouchEnd = 0;
  const onTouchEnd = (e) => {
    const t = Date.now();
    // classic double-tap zoom window
    if (t - lastTouchEnd <= 250) e.preventDefault();
    lastTouchEnd = t;
  };

  const onGesture = (e) => {
    e.preventDefault();
  };

  el.addEventListener("touchstart", onTouchStart, { passive: false, signal });
  el.addEventListener("touchmove", onTouchMove, { passive: false, signal });
  el.addEventListener("touchend", onTouchEnd, { passive: false, signal });

  window.addEventListener("gesturestart", onGesture, { passive: false, signal });
  window.addEventListener("gesturechange", onGesture, { passive: false, signal });
  window.addEventListener("gestureend", onGesture, { passive: false, signal });

  // debug: view/zoom drift
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
  // iOS: click + pointerup both may fire → de-dupe
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

  // Prevent selection/callout globally (no scroll UI)
  try {
    app.style.webkitUserSelect = "none";
    app.style.userSelect = "none";
    app.style.webkitTapHighlightColor = "transparent";
    app.style.webkitTouchCallout = "none";
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

    // ------------------------------------------------------------
// natural end (AUDIO is source of truth)
// ------------------------------------------------------------
const a = music;

// iOS: duration が最初 NaN のことがあるので guard
const dur = Number(a?.duration);
const hasDur = Number.isFinite(dur) && dur > 0;

// 余白（秒）: 終端の誤差吸収
const EPS = 0.06;

// ✅ 1) 音源が ended なら即RESULT
// ✅ 2) duration が取れていて、t が終端付近に来たらRESULT
if (a && (a.ended || (hasDur && t >= dur - EPS))) {
  endToResult("ENDED");
  return;
}

// 旧ロジックも保険で残す（chart終端で終わるケース）
if (timing.isEnded(t)) {
  endToResult("ENDED");
  return;
}
  }

  // ------------------------------------------------------------
  // iOS gesture unlock (audio + VIDEO PLAY IN-GESTURE)
  // ------------------------------------------------------------
  function primeInGesture() {
    // ✅ 1) video must be kicked synchronously in gesture
    kickVideoInGesture(bgVideo);
    // ✅ 2) audio unlock prep
    try {
      audio.primeUnlock?.();
    } catch {}
  }

  async function unlockBestEffort() {
    try {
      await audio.unlock?.();
    } catch (e) {
      console.warn("[DiCo] audio.unlock failed (may be ok)", e?.message || e);
    }
  }

  // ------------------------------------------------------------
  // transitions
  // ------------------------------------------------------------
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

  // NOTE:
  // iOSでは「await の後の video.play」が弾かれやすい。
  // だから start/restart の入口で kickVideoInGesture を最優先で叩き、
  // 以降は bestEffortPlayVideo( awaitなし ) に留める。
  async function startFromScratch(kind = "START") {
    // ✅ gesture内で呼ばれている前提（startGame/restartGameから）
    primeInGesture();

    // audio unlock may await; keep it after video kick
    await unlockBestEffort();

    // 1) stop
    hardStopAll();

    // 2) rebuild core (fresh)
    rebuild();
    judge.reset?.();

    // 3) start timing+audio together (single clock)
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

    // 5) warm FX (optional but recommended)
    ensureFX();

    // 6) run
    running = true;
    tick();

    // 7) video best-effort (NO await)
    bestEffortPlayVideo(bgVideo);
  }

  async function startGame(e) {
    if (lock) return;
    lock = true;
    log("START: begin");
    try {
      // ✅ 最優先：gesture同期で video kick
      kickVideoInGesture(bgVideo);
      await startFromScratch("START");
      log("START: done");
    } finally {
      lock = false;
    }
  }

  async function restartGame(e) {
    if (lock) return;
    lock = true;
    log("RESTART: begin");
    try {
      // ✅ 最優先：gesture同期で video kick
      kickVideoInGesture(bgVideo);
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

    // ✅ iOS安定優先：pause すると復帰が不安定になる端末がある
    // ここは「止めない」方が安定。見た目はCSSで隠す。
    // ただし電池/負荷が気になるなら pause へ戻してOK。
    // try { bgVideo?.pause?.(); } catch {}
    // → 継続再生にする：
    bestEffortPlayVideo(bgVideo);

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

  // ------------------------------------------------------------
  // Input
  // ------------------------------------------------------------
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

      // audio feedback
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

  // ------------------------------------------------------------
  // Controls
  // ------------------------------------------------------------
  bindPress(startBtn, startGame, ac.signal);
  bindPress(restartBtn, restartGame, ac.signal);
  if (stopBtn) bindPress(stopBtn, () => endToResult("STOP"), ac.signal);

  // ------------------------------------------------------------
  // Resize/orientation/viewport drift: keep canvas/input aligned
  // ------------------------------------------------------------
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

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onResize, { passive: true, signal: ac.signal });
    window.visualViewport.addEventListener("scroll", onResize, { passive: true, signal: ac.signal });
  }

  // ------------------------------------------------------------
  // Initial state
  // ------------------------------------------------------------
  setState(app, STATES.IDLE);

  try {
    audio.stopMusic?.({ reset: true });
  } catch {}

  // idleでは動画を止めてもOKだが、復帰安定のため一旦playしておきCSSで隠す戦略も可。
  // ここは電池優先で pause。STARTで確実にkickするのでOK。
  try {
    bgVideo?.pause?.();
  } catch {}

  ui.update?.({ t: 0, score: 0, combo: 0, maxCombo: 0, resonance: 0, state: STATES.IDLE });
  log("BOOT OK");

  // ------------------------------------------------------------
  // Dispose
  // ------------------------------------------------------------
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
