/* /di/js/main.js */
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

const APP_KEY = "__DICO_PHASE1__";
const $ = (id) => document.getElementById(id);
const INPUT_LAT = 0.06;

const STATES = Object.freeze({ IDLE: "idle", PLAYING: "playing", RESULT: "result" });
function setState(app, s) { app.dataset.state = s; }
function getState(app) { return app.dataset.state || STATES.IDLE; }
function assertEl(el, name) { if (!el) throw new Error(`Missing #${name}`); return el; }

const __scriptCache = (globalThis[APP_KEY] ||= {}).scriptCache || new Map();
(globalThis[APP_KEY] ||= {}).scriptCache = __scriptCache;

function loadScriptOnce(src) {
  if (__scriptCache.has(src)) return __scriptCache.get(src);
  const p = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    const u = new URL(src);
    u.searchParams.set("v", String(Date.now()));
    s.src = u.toString();
    s.async = false;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load: " + src));
    document.head.appendChild(s);
  });
  __scriptCache.set(src, p);
  return p;
}

async function loadScriptsSequentially(files) { for (const src of files) await loadScriptOnce(src); }
async function ensureLegacyLoaded() {
  await loadScriptsSequentially(ENGINE_FILES);
  try { await loadScriptsSequentially(PRESENTATION_FILES); } catch (e) { console.warn("[DiCo] presentation load failed", e); }
}

async function fetchJSON(url) {
  const u = new URL(url, BASE).toString();
  const r = await fetch(u, { cache: "no-store" });
  if (!r.ok) throw new Error(`fetch failed ${u}: ${r.status}`);
  return r.json();
}

function fallbackChart() {
  const notes = []; const bpm = 145; const beat = 60 / bpm;
  for (let t = 1; t < 60; t += beat) notes.push({ t: +t.toFixed(3), type: "tap" });
  return { meta: { title: "fallback", bpm }, offset: 0, scroll: { approach: 1.25 }, notes };
}

function getResultPresenterSafe({ refs }) {
  const impl = globalThis.DI_RESULT;
  if (impl && typeof impl.init === "function") {
    try {
      return impl.init({ app: refs.app, root: refs.result, dicoLine: refs.dicoLine, aruProg: refs.aruProg, aruValue: refs.aruValue, resultScore: refs.resultScore, resultMaxCombo: refs.resultMaxCombo, ariaLive: refs.ariaLive });
    } catch (e) { console.warn("[DiCo] DI_RESULT.init failed", e); }
  }
  return { show: () => {}, hide() {} };
}

function makeResColorSync() {
  const root = document.documentElement;
  let lastHue = NaN;
  const HUE_MIN = 190; const HUE_MAX = 55; const UPDATE_STEP_DEG = 1.5;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const resonanceToHue = (rPct) => {
    let v = Number(rPct); if (!Number.isFinite(v)) v = 0; if (v > 1.5) v /= 100;
    const x = clamp01(v); const eased = x * x * (3 - 2 * x);
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
  const r = Math.max(0, Math.min(100, Number(resonancePct) || 0));
  app.style.setProperty("--aru-value", (r / 100).toFixed(3));
  app.dataset.aruState = r >= 90 ? "max" : r >= 65 ? "high" : r >= 35 ? "mid" : "low";
}

function disposePreviousIfAny() {
  const prev = globalThis[APP_KEY];
  if (prev && typeof prev.dispose === "function") { try { prev.dispose(); } catch {} }
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

async function boot() {
  disposePreviousIfAny();
  const instance = (globalThis[APP_KEY] ||= {});
  instance.running = true;

  const ac = new AbortController();
  let raf = 0;
  const stopRAF = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };

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

  let chart;
  try { chart = await fetchJSON("charts/chart_001.json"); } catch (e) { chart = fallbackChart(); console.warn("[DiCo] chart fallback", e); }

  const E = globalThis.DI_ENGINE;
  if (!E) throw new Error("DI_ENGINE not loaded");

  const refs = {
    app, avatarRing: $("avatarRing"), dicoFace: $("dicoFace"), face1: $("face1"), face2: $("face2"), face3: $("face3"), face4: $("face4"), face5: $("face5"),
    judge: $("judge"), judgeMain: $("judgeMain"), judgeSub: $("judgeSub"), hitFlash: $("hitFlash"),
    sideScore: $("sideScore"), sideCombo: $("sideCombo"), sideMaxCombo: $("sideMaxCombo"), resValue: $("resValue"), resFill: $("resFill"), time: $("time"),
    score: $("score"), combo: $("combo"), maxCombo: $("maxCombo"), timeDup: $("time_dup"),
    result: $("result"), resultScore: $("resultScore"), resultMaxCombo: $("resultMaxCombo"), dicoLine: $("dicoLine"), aruProg: $("aruProg"), aruValue: $("aruValue"), ariaLive: $("ariaLive"),
  };

  const log = (m) => { if (refs.ariaLive) refs.ariaLive.textContent = String(m); console.debug("[DiCo]", m); };
  const resColor = makeResColorSync();
  resColor.setByResonance(0);
  applyAruState(app, 0);

  const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });
  const fx = new FXCore({ layer: fxLayer, app });
  const ui = new E.UI(refs);

  let timing = new E.Timing({ chart });
  let judge = new E.Judge({ chart, timing });
  judge.setInputLatency?.(INPUT_LAT);
  let render = new E.Renderer({ canvas, chart, timing, judge });
  const presenter = getResultPresenterSafe({ refs });

  let running = false;
  let lock = false;

  const rebuild = () => {
    timing = new E.Timing({ chart });
    judge = new E.Judge({ chart, timing });
    judge.setInputLatency?.(INPUT_LAT);
    render = new E.Renderer({ canvas, chart, timing, judge });
    render.resize?.();
  };

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
    ui.update({ t, score: judge.state.score, combo: judge.state.combo, maxCombo: judge.state.maxCombo, resonance: res, state: getState(app) });

    if (timing.isEnded(t)) endToResult("ENDED");
  }

  function primeInGesture() { try { audio.primeUnlock?.(); } catch {} }
  async function unlockBestEffort() { try { await audio.unlock?.(); } catch {} }

  async function startGame() {
    if (lock) return;
    lock = true;
    log("START: begin");
    try {
      primeInGesture();
      await unlockBestEffort();

      // ensure deterministic start from any state including RESULT
      running = false;
      stopRAF();
      timing.stop?.(audio);
      audio.stopMusic?.({ reset: true });

      rebuild();
      judge.reset?.();
      timing.start(audio, { reset: true });

      setState(app, STATES.PLAYING);
      log("STATE: PLAYING");
      presenter.hide?.();
      ui.hideResult?.();

      running = true;
      tick();
      try { await bgVideo?.play?.(); } catch {}
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
      primeInGesture();
      await unlockBestEffort();

      // fixed restart order
      running = false;                    // 1 disable input via running guard
      stopRAF();                          // 2
      timing.stop?.(audio);               // 3
      audio.stopMusic?.({ reset: true }); // 4 sync reset now

      rebuild();                          // 5
      judge.reset?.();
      timing.restart(audio);              // 6 timing+audio together(reset=true)

      setState(app, STATES.PLAYING);      // 7
      log("STATE: PLAYING");
      presenter.hide?.();
      ui.hideResult?.();

      running = true;
      tick();                             // 8
      try { await bgVideo?.play?.(); } catch {}
      log("RESTART: done");
    } finally {
      lock = false;
    }
  }

  function endToResult(reason = "STOP") {
    if (getState(app) === STATES.RESULT) return;
    running = false;
    stopRAF();
    try { timing.stop?.(audio); } catch {}
    try { bgVideo?.pause?.(); } catch {}

    setState(app, STATES.RESULT);
    log(`RESULT: ${reason}`);

    const payload = { score: judge.state.score, maxCombo: judge.state.maxCombo, resonance: judge.state.resonance, reason };
    ui.showResult?.(payload);
    presenter.show?.(payload);
  }

  const input = new E.Input({
    element: hitZone,
    onTap: (x, y, _ts, ev) => {
      if (!running || getState(app) !== STATES.PLAYING) return;

      const hitRect = hitZone.getBoundingClientRect();
      const clientX = Number(ev?.clientX ?? (hitRect.left + x));
      const clientY = Number(ev?.clientY ?? (hitRect.top + y));
      const fxRect = fxLayer.getBoundingClientRect();
      const lx = clientX - fxRect.left;
      const ly = clientY - fxRect.top;

      fx.burst(lx, ly);
      if (refs.avatarRing) fx.stream(lx, ly, refs.avatarRing);

      audio.playTap?.();
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

  bindPress(startBtn, startGame, ac.signal);
  bindPress(restartBtn, restartGame, ac.signal);
  if (stopBtn) bindPress(stopBtn, () => endToResult("STOP"), ac.signal);

  window.addEventListener("resize", () => {
    try { render?.resize?.(); } catch {}
    try { input?.recalc?.(); } catch {}
  }, { passive: true, signal: ac.signal });

  setState(app, STATES.IDLE);
  audio.stopMusic?.({ reset: true });
  try { bgVideo?.pause?.(); } catch {}
  ui.update?.({ t: 0, score: 0, combo: 0, maxCombo: 0, resonance: 0, state: STATES.IDLE });
  log("BOOT OK");

  instance.dispose = () => {
    try { ac.abort(); } catch {}
    try { input?.destroy?.(); } catch {}
    running = false;
    stopRAF();
    try { audio.stopMusic?.({ reset: true }); } catch {}
    try { bgVideo?.pause?.(); } catch {}
    instance.running = false;
  };
}

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
