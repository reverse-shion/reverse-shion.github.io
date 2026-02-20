/* /di/js/main.js */
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

  function $(id) { return document.getElementById(id); }

  function loadScriptsSequentially(files) {
    return files.reduce((p, src) => {
      return p.then(() => new Promise((resolve, reject) => {
        const s = document.createElement("script");
        const u = new URL(src);
        u.searchParams.set("v", String(Date.now()));
        s.src = u.toString();
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load: " + src));
        document.head.appendChild(s);
      }));
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

  async function boot() {
    const app = $("app");
    const canvas = $("noteCanvas");
    const hitZone = $("hitZone");           // ✅ 追加
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

    try {
      if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        bgVideo.loop = true;
        bgVideo.play().catch(() => {});
      }
    } catch {}

    let chart = null;
    try {
      chart = await fetchJSON("charts/chart_001.json");
    } catch (e) {
      chart = fallbackChart();
      console.warn("[DiCo] chart json not found. Using fallback.", e);
    }

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

    // ✅ Inputは hitZone に付ける（canvasは pointer-events:none でもOKになる）
    const input = new E.Input({
      element: hitZone,
      onTap: (x, y, t, ev) => {
        // x,y は hitZone基準。FXは画面演出なのでそのままOK
        audio.playTap();
        fx.burstAt(x, y);

        // 判定は「今の曲時間」でOK（入力時刻tを使いたいなら judge.hit(t) に後で拡張）
        const res = judge.hit(timing.getSongTime());
        ui.onJudge(res);

        if (res && (res.name === "GREAT" || res.name === "PERFECT")) {
          audio.playGreat();
          ui.flashHit();
          fx.sparkLine();
        }
      }
    });

    let raf = 0;
    let running = false;

    function tick() {
      raf = requestAnimationFrame(tick);
      if (!running) return;

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

    async function startGame() {
      if (running) return;
      await audio.unlock();
      try { bgVideo?.play().catch(() => {}); } catch {}

      judge.reset();
      timing.start(audio);

      app.dataset.state = "playing";
      running = true;

      ui.hideResult();
      ui.toast("START");

      cancelAnimationFrame(raf);
      tick();
    }

    function stopGame() {
      if (!running) return;
      running = false;
      timing.stop(audio);
      app.dataset.state = "idle";
      ui.toast("STOP");
    }

    function endGame() {
      running = false;
      timing.stop(audio);
      app.dataset.state = "result";
      ui.showResult({
        score: judge.state.score,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance
      });
      ui.toast("RESULT");
    }

    async function restartGame() {
      stopGame();
      await startGame();
    }

    startBtn.addEventListener("click", () => startGame());
    stopBtn.addEventListener("click", () => stopGame());
    restartBtn.addEventListener("click", () => restartGame());

    app.dataset.state = "idle";
    ui.update({ t: 0, score: 0, combo: 0, maxCombo: 0, resonance: 0, state: "idle" });

    render.resize();

    // ✅ resize時にhitZoneのrectも更新（inputはhitZone基準になった）
    window.addEventListener("resize", () => { render.resize(); input.recalc(); });

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
