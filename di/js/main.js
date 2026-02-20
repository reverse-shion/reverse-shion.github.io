/* /di/js/main.js (STABLE FULL) */
(() => {
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

  const $ = (id) => document.getElementById(id);

  // ★ iOS入力遅延補正（当たりにくい時は 0.06〜0.12 で調整）
  const INPUT_LAT = 0.06;

  function loadScriptsSequentially(files) {
    return files.reduce((p, src) => {
      return p.then(
        () =>
          new Promise((resolve, reject) => {
            const s = document.createElement("script");
            const u = new URL(src);
            u.searchParams.set("v", String(Date.now())); // cache bust
            s.src = u.toString();
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Failed to load: " + src));
            document.head.appendChild(s);
          })
      );
    }, Promise.resolve());
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
    return { meta: { title: "DiCo ARU Phase1 (fallback)", bpm }, offset: 0.0, scroll: { approach: 1.25 }, notes };
  }

  // notes t が ms っぽい時は秒に寄せる（安全策）
  function normalizeChartTime(chart) {
    const first = chart?.notes?.[0]?.t;
    if (typeof first !== "number") return chart;

    // 例: 12000 とかなら ms の可能性が高い
    const msLike = first > 1000;
    if (!msLike) return chart;

    const fixed = {
      ...chart,
      notes: (chart.notes || []).map(n => ({ ...n, t: (n.t || 0) / 1000 })),
      offset: (chart.offset || 0) / 1000,
    };
    console.warn("[DiCo] chart time looks like ms. normalized to seconds.");
    return fixed;
  }

  async function boot() {
    // ===== DOM =====
    const app = $("app");
    const canvas = $("noteCanvas");
    const hitZone = $("hitZone");
    const bgVideo = $("bgVideo");

    const startBtn = $("startBtn");
    const stopBtn = $("stopBtn");
    const restartBtn = $("restartBtn");

    const music = $("music");
    const seTap = $("seTap");
    const seGreat = $("seGreat");

    if (!app || !canvas || !hitZone || !startBtn || !stopBtn || !restartBtn || !music) {
      throw new Error("Missing required DOM elements (check ids).");
    }

    // ===== background video init (idleでも流したいならここをONにする) =====
    // 「STOPでも流し続けたい」なら true に。
    const BG_ALWAYS_PLAY = false;

    try {
      if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        bgVideo.loop = true;
        if (BG_ALWAYS_PLAY) bgVideo.play().catch(() => {});
      }
    } catch {}

    // ===== chart =====
    let chart = null;
    try {
      chart = await fetchJSON("charts/chart_001.json");
    } catch (e) {
      chart = fallbackChart();
      console.warn("[DiCo] chart json not found. Using fallback.", e);
    }
    chart = normalizeChartTime(chart);

    // ===== engine =====
    const E = window.DI_ENGINE;
    if (!E) throw new Error("DI_ENGINE not found. engine scripts failed to load.");

    console.log("[DiCo] noteSkin =", E.noteSkin?.name || "(none)");

    const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });
    const timing = new E.Timing({ chart });
    const judge = new E.Judge({ chart, timing });
    const fx = new E.FX({ fxLayer: $("fxLayer") });
    const ui = new E.UI({
      app,
      score: $("score"), combo: $("combo"), maxCombo: $("maxCombo"), timeDup: $("time_dup"),
      sideScore: $("sideScore"), sideCombo: $("sideCombo"), sideMaxCombo: $("sideMaxCombo"), time: $("time"),
      resValue: $("resValue"), resFill: $("resFill"), avatarRing: $("avatarRing"),
      judge: $("judge"), judgeMain: $("judgeMain"), judgeSub: $("judgeSub"),
      result: $("result"),
      resultScore: $("resultScore"), resultMaxCombo: $("resultMaxCombo"),
      aruProg: $("aruProg"), aruValue: $("aruValue"), dicoLine: $("dicoLine"),
      ariaLive: $("ariaLive"),
      hitFlash: $("hitFlash"),
    });

    const render = new E.Renderer({ canvas, chart, timing });

    // ===== state =====
    let raf = 0;
    let running = false;
    let starting = false; // 二重スタート防止

    // ===== helpers =====
    function stopRAF() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    async function hardResetMedia({ resetVideo = false } = {}) {
      // musicを確実に止めて先頭へ
      try { music.pause(); } catch {}
      try { music.currentTime = 0; } catch {}

      // bgVideoも止める/戻す（必要時）
      if (bgVideo) {
        try { bgVideo.pause(); } catch {}
        if (resetVideo) {
          try { bgVideo.currentTime = 0; } catch {}
        }
      }
    }

    async function safePlayMedia() {
      // iOSはplayが弾かれることがあるので握りつぶす
      try { await music.play(); } catch (e) { /* blocked OK */ }
      if (bgVideo) {
        try { await bgVideo.play(); } catch (e) { /* blocked OK */ }
      }
    }

    function setState(state) {
      app.dataset.state = state;
    }

    // ===== input =====
    const input = new E.Input({
      element: hitZone,
      onTap: (x, y, t, ev) => {
        // playing中だけ反応（idle/resultで誤爆防止）
        if (!running || app.dataset.state !== "playing") return;

        audio.playTap();
        fx.burstAt(x, y);

        // ★iOS用: 入力補正を足して判定
        const res = judge.hit(timing.getSongTime() + INPUT_LAT);
        ui.onJudge(res);

        if (res && (res.name === "GREAT" || res.name === "PERFECT")) {
          audio.playGreat();
          ui.flashHit();
          fx.sparkLine();
        }
      }
    });

    // ===== loop =====
    function tick() {
      if (!running) return;           // ✅ running中だけ動作
      raf = requestAnimationFrame(tick);

      const t = timing.getSongTime();
      render.draw(t);

      ui.update({
        t,
        score: judge.state.score,
        combo: judge.state.combo,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance,
        state: app.dataset.state
      });

      if (timing.isEnded(t)) endGame();
    }

    // ===== actions =====
    async function startGame({ fromRestart = false } = {}) {
      if (running || starting) return;
      starting = true;

      // unlock（ユーザー操作に紐づく開始時に必ず）
      await audio.unlock();

      // 重要：毎回確実に「最初から」始める
      await hardResetMedia({ resetVideo: false });

      judge.reset();
      timing.start(audio);

      setState("playing");
      running = true;

      ui.hideResult();
      ui.toast(fromRestart ? "RESTART" : "START");

      // media再生（ブロックされてもゲームは進む設計）
      await safePlayMedia();

      stopRAF();
      tick();

      starting = false;
    }

    function stopGame() {
      if (!running) return;

      running = false;
      stopRAF();
      timing.stop(audio);

      // STOPで背景も止める（常に流したいなら BG_ALWAYS_PLAY=true にしてここを外す）
      if (!BG_ALWAYS_PLAY) {
        try { bgVideo?.pause(); } catch {}
      }

      setState("idle");
      ui.toast("STOP");
    }

    function endGame() {
      if (!running && app.dataset.state === "result") return;

      running = false;
      stopRAF();
      timing.stop(audio);

      if (!BG_ALWAYS_PLAY) {
        try { bgVideo?.pause(); } catch {}
      }

      setState("result");
      ui.showResult({
        score: judge.state.score,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance
      });
      ui.toast("RESULT");
    }

    async function restartGame() {
      stopGame();
      await startGame({ fromRestart: true });
    }

    // ===== bind buttons =====
    startBtn.addEventListener("click", () => startGame());
    stopBtn.addEventListener("click", () => stopGame());
    restartBtn.addEventListener("click", () => restartGame());

    // ===== init =====
    setState("idle");
    ui.update({ t: 0, score: 0, combo: 0, maxCombo: 0, resonance: 0, state: "idle" });

    render.resize();
    window.addEventListener("resize", () => {
      render.resize();
      input.recalc();
    }, { passive: true });

    console.log("[DiCo] boot OK");
  }

  loadScriptsSequentially(ENGINE_FILES)
    .then(() => boot())
    .catch((err) => {
      console.error(err);
      const el = document.getElementById("ariaLive");
      if (el) el.textContent = "Boot error: " + err.message;
    });
})();
