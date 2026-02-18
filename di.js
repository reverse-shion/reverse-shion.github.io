(() => {
  "use strict";

  // ====== DEBUG ======
  const DEBUG = new URLSearchParams(location.search).has("debug");
  const log = (...a) => DEBUG && console.log("[DI]", ...a);

  // ====== STATE ======
  let music, video, canvas, ctx, scoreEl, comboEl, startBtn;

  let notes = [];
  let score = 0;
  let combo = 0;
  let running = false;

  const duration = 60; // seconds
  const noteEvery = 0.6; // seconds
  const judgePerfect = 0.08;
  const judgeGood = 0.15;

  // time source fallback (when audio doesn't advance)
  let t0Perf = 0;
  let lastAudioTime = 0;
  let stuckCount = 0;

  function $(id) { return document.getElementById(id); }

  function must(el, name) {
    if (!el) throw new Error(`Missing element: ${name}`);
    return el;
  }

  function createNotes() {
    notes = [];
    for (let t = 1; t < duration; t += noteEvery) {
      notes.push({ time: t, hit: false });
    }
  }

  function setVhVar() {
    // iOS safe height対応
    const vh = (window.visualViewport?.height ?? window.innerHeight) * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  function resizeCanvas() {
    setVhVar();
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.visualViewport?.height ?? window.innerHeight);
    canvas.width = w;
    canvas.height = h;
  }

  // iOSでaudio currentTimeが進まない/遅い場合のフォールバック
  function getGameTime() {
    const at = Number.isFinite(music?.currentTime) ? music.currentTime : 0;

    // audioが進んでいるならそれを使う
    if (at > 0 && at !== lastAudioTime) {
      lastAudioTime = at;
      stuckCount = 0;
      return at;
    }

    // audioが止まってる/進まない → perf時計で進める
    if (running) {
      if (at === lastAudioTime) stuckCount++;
      const pt = (performance.now() - t0Perf) / 1000;
      // stuckCountが増えているならperf時計採用
      if (stuckCount > 5) return pt;
      // 少しはaudioを信じたいので軽く混ぜる
      return Math.max(at, pt);
    }
    return at;
  }

  function drawNote(y, kind = "cyan") {
    ctx.fillStyle = kind;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, y, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    if (!running) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const time = getGameTime();

    // 判定ライン（見やすいガイド）
    const judgeY = canvas.height * 0.6;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(canvas.width / 2 - 60, judgeY + 18, 120, 2);

    for (const note of notes) {
      if (note.hit) continue;

      const diff = note.time - time;
      const y = judgeY - diff * 400;

      // 通過MISS（少し猶予）
      if (diff < -0.22) {
        note.hit = true;
        combo = 0;
        continue;
      }

      // 画面外は描かない（軽量化）
      if (y < -40 || y > canvas.height + 40) continue;

      drawNote(y, "cyan");
    }

    // HUD更新
    scoreEl.textContent = String(score);
    comboEl.textContent = String(combo);

    // 終了
    if (time >= duration) {
      running = false;
      try { music.pause(); } catch {}
      try { video.pause(); } catch {}
      alert(`RESULT\nScore: ${score}`);
      return;
    }

    requestAnimationFrame(loop);
  }

  function judge() {
    if (!running) return;

    const time = getGameTime();
    let best = null;
    let closest = 999;

    for (const note of notes) {
      if (note.hit) continue;
      const d = Math.abs(note.time - time);
      if (d < closest) { closest = d; best = note; }
    }
    if (!best) return;

    if (closest <= judgePerfect) {
      best.hit = true;
      combo++;
      score += 100 + combo * 6;
      log("PERFECT", closest.toFixed(3));
    } else if (closest <= judgeGood) {
      best.hit = true;
      combo++;
      score += 55 + combo * 3;
      log("GOOD", closest.toFixed(3));
    } else {
      combo = 0;
      log("MISS", closest.toFixed(3));
    }
  }

  async function startGame() {
    score = 0;
    combo = 0;
    createNotes();
    running = true;

    // perf時計の基準
    t0Perf = performance.now();
    lastAudioTime = 0;
    stuckCount = 0;

    // 先にリサイズ
    resizeCanvas();

    // 再生準備
    try { music.currentTime = 0; } catch {}
    try { video.currentTime = 0; } catch {}

    // iOS: play() は Promise。失敗したら理由を出す（debug時）
    try {
      const p1 = music.play();
      const p2 = video.play();
      if (p1?.then) await p1;
      if (p2?.then) await p2;
      log("play ok");
    } catch (e) {
      // 音声再生がブロックされても、ゲームはperf時計で動かす
      log("play blocked", e);
    }

    loop();
  }

  function bind() {
    // DOM参照
    music = must($("music"), "music");
    video = must($("bgVideo"), "bgVideo");
    canvas = must($("noteCanvas"), "noteCanvas");
    ctx = canvas.getContext("2d", { alpha: true });

    scoreEl = must($("score"), "score");
    comboEl = must($("combo"), "combo");
    startBtn = must($("startBtn"), "startBtn");

    // リサイズ
    window.addEventListener("resize", resizeCanvas);
    window.visualViewport?.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // iOS: clickよりpointerdownが安定
    startBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      startGame();
    }, { passive: false });

    // 判定入力
    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      judge();
    }, { passive: false });

    log("bound ok");
  }

  // ★重要：DOMが揃ってから初期化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
