/* /di/js/main.js (PAUSE/RESTART STABLE) */
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

  // iOS向け：当たりづらいなら 0.06→0.08→0.10 と増やす
  const INPUT_LAT = 0.06;

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

  function setState(app, s){ app.dataset.state = s; }

  async function boot() {
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

    // bg video setup
    try {
      if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        bgVideo.loop = true;
      }
    } catch {}

    // chart
    let chart = null;
    try { chart = await fetchJSON("charts/chart_001.json"); }
    catch (e) { chart = fallbackChart(); console.warn("[DiCo] chart fallback", e); }

    // engine
    const E = window.DI_ENGINE;
    if (!E) throw new Error("DI_ENGINE not found.");

    const audio = new E.AudioManager({ music, seTap, seGreat, bgVideo });
    const timing = new E.Timing({ chart });
    const judge  = new E.Judge({ chart, timing });
    const fx     = new E.FX({ fxLayer: $("fxLayer") });
    const ui     = new E.UI({
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

    // ====== STATE MACHINE ======
    // idle -> playing -> paused -> playing -> ... -> result
    let raf = 0;
    let running = false;
    let starting = false;

    // pause/resume用に保持
    let pausedSongTime = 0;
    let pausedMusicTime = 0;
    let wasPlayingVideo = false;

    function stopRAF(){
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function tick(){
      if (!running) return;
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

    async function hardResetToStart(){
      // メディアを先頭へ
      try { music.pause(); } catch {}
      try { music.currentTime = 0; } catch {}

      try { bgVideo?.pause(); } catch {}
      // bgVideoは最初からに戻したいなら0に（任意）
      // try { bgVideo.currentTime = 0; } catch {}

      // pause情報リセット
      pausedSongTime = 0;
      pausedMusicTime = 0;
      wasPlayingVideo = false;

      judge.reset();
      // timingを“新規開始”させる
      // engine側の実装に依存するので start(audio) を必ず呼ぶ
      timing.start(audio);
    }

    async function startOrResume(){
      if (starting) return;
      starting = true;

      await audio.unlock();

      const state = app.dataset.state;

      // 1) pausedなら「再開」
      if (state === "paused") {
        // 音を止めた位置から復帰
        try { music.currentTime = pausedMusicTime || 0; } catch {}
        try { await music.play(); } catch {}

        if (bgVideo) {
          try {
            if (wasPlayingVideo) await bgVideo.play();
          } catch {}
        }

        // timingは engine 実装次第で再開機能がないので、
        // “見た目だけ止まってた”場合に備え、startを呼び直しつつ
        // songTimeが進むことを優先する。
        timing.start(audio);

        setState(app, "playing");
        running = true;
        stopRAF();
        tick();

        ui.toast("RESUME");
        starting = false;
        return;
      }

      // 2) idle/resultなら「最初から開始」
      if (state === "idle" || state === "result") {
        await hardResetToStart();

        setState(app, "playing");
        running = true;

        ui.hideResult();
        ui.toast("START");

        try { await music.play(); } catch {}
        try { bgVideo?.play().catch(() => {}); } catch {}

        stopRAF();
        tick();

        starting = false;
        return;
      }

      // playing中にstart押したら無視
      starting = false;
    }

    function pauseGame(){
      if (!running) return;

      // いったん停止して位置を保存
      pausedSongTime = timing.getSongTime();
      pausedMusicTime = (() => {
        try { return music.currentTime || 0; } catch { return 0; }
      })();

      wasPlayingVideo = (() => {
        try { return !!bgVideo && !bgVideo.paused; } catch { return false; }
      })();

      running = false;
      stopRAF();

      // timing停止
      timing.stop(audio);

      // メディア停止
      try { music.pause(); } catch {}
      try { bgVideo?.pause(); } catch {}

      setState(app, "paused");
      ui.toast("PAUSE");
    }

    function endGame(){
      running = false;
      stopRAF();
      timing.stop(audio);

      try { music.pause(); } catch {}
      try { bgVideo?.pause(); } catch {}

      setState(app, "result");
      ui.showResult({
        score: judge.state.score,
        maxCombo: judge.state.maxCombo,
        resonance: judge.state.resonance
      });
      ui.toast("RESULT");
    }

    async function restartGame(){
      // いつでも「最初からやり直し」
      running = false;
      stopRAF();
      timing.stop(audio);

      try { music.pause(); } catch {}
      try { bgVideo?.pause(); } catch {}

      setState(app, "idle");
      await startOrResume(); // idle扱いで最初から開始
    }

    // ===== input =====
    const input = new E.Input({
      element: hitZone,
      onTap: (x, y) => {
        if (!running || app.dataset.state !== "playing") return;

        audio.playTap();
        fx.burstAt(x, y);

        const res = judge.hit(timing.getSongTime() + INPUT_LAT);
        ui.onJudge(res);

        if (res && (res.name === "GREAT" || res.name === "PERFECT")) {
          audio.playGreat();
          ui.flashHit();
          fx.sparkLine();
        }
      }
    });

    // ===== buttons =====
    startBtn.addEventListener("click", () => startOrResume());
    stopBtn.addEventListener("click", () => pauseGame());
    restartBtn.addEventListener("click", () => restartGame());

    // ===== init =====
    setState(app, "idle");
    ui.update({ t: 0, score: 0, combo: 0, maxCombo: 0, resonance: 0, state: "idle" });

    render.resize();
    window.addEventListener("resize", () => { render.resize(); input.recalc(); }, { passive: true });

    console.log("[DiCo] boot OK (pause/restart stable)");
  }

  loadScriptsSequentially(ENGINE_FILES)
    .then(() => boot())
    .catch((err) => {
      console.error(err);
      const el = document.getElementById("ariaLive");
      if (el) el.textContent = "Boot error: " + err.message;
    });
})();
