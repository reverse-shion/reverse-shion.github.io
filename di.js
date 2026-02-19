/* di.js — DiCo Rhythm / ARU (God-Game Edition)
   - Tap / Rapid / Burst(3連) / Hold(長押し) + Release判定
   - 3枚タロット（COMPASS/TRIGGER/ROUTE）＝一定スコア到達で出現
   - カード展開中：成功タップで「1枚ずつ光って吸収→消える」
   - 3回成功（カード3枚吸収）で God演出（SOLAR SCRIBE MODE）発動
   - 画面崩れ対策：HUD/Bottomは固定、ゲーム中の邪魔DOMはpointer-events:none
   - iOS対策：primeMedia、pointer統一、touch scroll抑止
*/
(() => {
  "use strict";

  // =========================
  // DOM
  // =========================
  const music = document.getElementById("music");
  const video = document.getElementById("bgVideo");
  const canvas = document.getElementById("noteCanvas");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const comboEl = document.getElementById("combo");
  const timeEl  = document.getElementById("time");

  const feverFill = document.getElementById("feverFill");
  const feverText = document.getElementById("feverText");

  const startBtn = document.getElementById("startBtn");
  const muteBtn  = document.getElementById("muteBtn");
  const calibBtn = document.getElementById("calibBtn");

  const fxLayer = document.getElementById("fxLayer");

  const centerBanner = document.getElementById("centerBanner");
  const bannerBig   = document.getElementById("bannerBig");
  const bannerSub   = document.getElementById("bannerSub");
  const bannerSmall = document.getElementById("bannerSmall");
  const bannerTiny  = document.getElementById("bannerTiny");

  // Myth layer
  const hieroRing     = document.getElementById("hieroRing");
  const maatScale     = document.getElementById("maatScale");
  const solarDisc     = document.getElementById("solarDisc");
  const particleField = document.getElementById("particleField");

  const protocolStack = document.getElementById("protocolStack");
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  const p3 = document.getElementById("p3");

  // Target & Judge DOM
  const targetRoot = document.getElementById("targetRoot");
  const judgeText  = document.getElementById("judgeText");
  const judgeMain  = document.getElementById("judgeMain");
  const judgeSub   = document.getElementById("judgeSub");

  // Triad cards & God mode
  const arcanaTriad = document.getElementById("arcanaTriad");
  const slotCompass = document.getElementById("slotCompass");
  const slotTrigger = document.getElementById("slotTrigger");
  const slotRoute   = document.getElementById("slotRoute");
  const godMode     = document.getElementById("godMode");

  const ariaLive = document.getElementById("ariaLive");

  // =========================
  // Settings (God-Game)
  // =========================
  const HIT_Y_RATIO = 0.82;               // ターゲット位置
  const NOTE_SPEED  = 560;                // 体感: 少し速めで気持ちいい
  const NOTE_RADIUS = 12;

  // 判定（秒）
  const JUDGE_NORMAL = { perfect: 0.075, good: 0.140 };
  const JUDGE_FEVER  = { perfect: 0.065, good: 0.120 };

  // Fever
  const FEVER_DURATION = 6.0;
  const FEVER_MAX = 100;

  // 3枚カード出現スコア（ここ到達で「タロット展開」）
  const TRIAD_SCORE_THRESHOLD = 1200;

  // カード展開中の「成功3回」で神演出
  // ※カード展開以外の成功はカウントしない（神演出が狙いやすい）
  const TRIAD_SUCCESS_REQUIRED = 3;

  // ミス時の挙動（中毒性優先：チェインだけリセット）
  const RESET_TRIAD_CHAIN_ON_MISS = true;

  // ターゲット形状進化
  const FORMS = ["eye", "ankh", "pyramid", "solar"]; // tier0..3

  // ノートタイプ
  const NT = Object.freeze({
    TAP: "tap",
    RAPID: "rapid",
    BURST: "burst", // 3連
    HOLD: "hold",
  });

  // BPM（固定でもOK / 将来解析できる）
  const BPM = 145;
  const BEAT = 60 / BPM;

  // ノーツ出現比率
  const RATE = {
    burst: 0.10, // 3連
    rapid: 0.12, // 連打
    hold:  0.16, // 長押し
  };

  // Rapid/ Burstの細かい間隔
  const BURST_SPACING = BEAT * 0.25; // 16分
  const RAPID_SPACING = BEAT * 0.20; // 連打密度

  // Hold長さ
  const HOLD_MIN_BEATS = 2.0;
  const HOLD_MAX_BEATS = 4.0;

  // Hold中の維持ボーナス（毎秒）
  const HOLD_TICK_SCORE = 18;
  const HOLD_TICK_FEVER = 2;

  // Vibration（対応端末のみ）
  const VIBRATE_OK = ("vibrate" in navigator);

  // =========================
  // State
  // =========================
  let notes = [];
  let running = false;

  let score = 0;
  let combo = 0;

  let duration = 60;
  let offsetMs = 0;

  let fever = 0;
  let feverOn = false;
  let feverUntil = 0;

  // iOS prime
  let primed = false;

  // Input state
  let isPressing = false;
  let holdTarget = null; // current hold note
  let lastHoldTickAt = 0; // for scoring ticks

  // Triad state
  let triadVisible = false;
  let triadSuccess = 0; // 0..3 (カード展開中の成功回数)
  let triadConsumedMask = 0; // bitmask 1|2|4

  // Myth protocol step 0..3 (UI演出の段階)
  let protocolStep = 0;

  // =========================
  // Utils
  // =========================
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const now = () => performance.now();

  function setVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  function resize() {
    setVh();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  async function safePlay(el) {
    try {
      const p = el.play();
      if (p && typeof p.then === "function") await p;
      return true;
    } catch {
      return false;
    }
  }

  async function primeMedia() {
    if (primed) return true;
    primed = true;

    video.muted = true;
    video.playsInline = true;

    await safePlay(video);
    video.pause();
    video.currentTime = 0;

    await safePlay(music);
    music.pause();
    music.currentTime = 0;

    return true;
  }

  // =========================
  // HUD / Banner / Judge / Target FX
  // =========================
  let bannerTimer = 0;
  function showBanner(big, sub, small, tiny = "", ms = 900) {
    if (bannerBig) bannerBig.textContent = big ?? "";
    if (bannerSub) bannerSub.textContent = sub ?? "";
    if (bannerSmall) bannerSmall.textContent = small ?? "";
    if (bannerTiny) bannerTiny.textContent = tiny ?? "";

    if (!centerBanner) return;
    centerBanner.classList.add("show");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => centerBanner.classList.remove("show"), ms);
  }

  function showJudge(main, sub) {
    if (!judgeText) return;
    judgeMain.textContent = main ?? "";
    judgeSub.textContent = sub ?? "";
    judgeText.classList.remove("show");
    void judgeText.offsetWidth;
    judgeText.classList.add("show");
  }

  function targetHitFlash() {
    if (!targetRoot) return;
    targetRoot.classList.remove("hit");
    void targetRoot.offsetWidth;
    targetRoot.classList.add("hit");
  }

  function setFever(v) {
    fever = clamp(v, 0, FEVER_MAX);
    if (feverFill) feverFill.style.width = `${fever.toFixed(0)}%`;
    if (feverText) feverText.textContent = `${fever.toFixed(0)}%`;
  }

  function enterFever() {
    feverOn = true;
    feverUntil = music.currentTime + FEVER_DURATION;
    document.body.classList.add("feverOn");
    showBanner("⚡ TAROT EXPANSION ⚡", "FEVER DRIVE", "SYNC EVERYTHING", "DiCo / ARU", 950);
    tarotBurst("FEVER");
    if (VIBRATE_OK) navigator.vibrate(20);
  }

  function exitFever() {
    feverOn = false;
    document.body.classList.remove("feverOn");
  }

  // =========================
  // FX: Card Burst (center)
  // =========================
  function spawnCard(title, power = 1) {
    if (!fxLayer) return;
    const el = document.createElement("div");
    el.className = "card";

    const rot = (Math.random() * 40 - 20) + (power >= 2 ? (Math.random() * 30 - 15) : 0);
    const ang = Math.random() * Math.PI * 2;
    const dist = (power >= 2 ? 240 : 170) + Math.random() * 70;

    el.style.setProperty("--rot", `${rot}deg`);
    el.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
    el.style.setProperty("--dy", `${Math.sin(ang) * dist}px`);
    el.dataset.title = title;

    fxLayer.appendChild(el);
    void el.offsetWidth;
    el.classList.add("play");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }

  function tarotBurst(kind = "NORMAL") {
    if (kind === "FEVER") {
      spawnCard("COMPASS", 2);
      spawnCard("TRIGGER", 2);
      spawnCard("ROUTE", 2);
      spawnCard("DiCo", 2);
    } else {
      spawnCard("COMPASS", 1);
    }
  }

  // =========================
  // Myth / Protocol UI (演出の段階)
  // =========================
  function setProtocolUI(step) {
    protocolStep = clamp(step, 0, 3);

    if (protocolStack) {
      if (protocolStep === 0) protocolStack.classList.remove("on");
      else protocolStack.classList.add("on");
    }

    if (p1) p1.dataset.state = protocolStep >= 1 ? (protocolStep >= 2 ? "done" : "on") : "idle";
    if (p2) p2.dataset.state = protocolStep >= 2 ? (protocolStep >= 3 ? "done" : "on") : "idle";
    if (p3) p3.dataset.state = protocolStep >= 3 ? "on" : "idle";

    if (hieroRing) hieroRing.classList.toggle("on", protocolStep >= 1);
    if (maatScale) maatScale.classList.toggle("on", protocolStep >= 2);
    if (solarDisc) solarDisc.classList.toggle("on", protocolStep >= 3);
    if (particleField) particleField.classList.toggle("on", protocolStep >= 1);

    // Target evolution
    if (targetRoot) {
      targetRoot.dataset.tier = String(protocolStep);
      targetRoot.dataset.form = FORMS[protocolStep] || "eye";
    }

    // God mode overlay
    if (godMode) godMode.dataset.on = protocolStep >= 3 ? "1" : "0";
  }

  // =========================
  // Triad Cards (3枚のカード展開)
  // =========================
  function triadShow() {
    triadVisible = true;
    triadSuccess = 0;
    triadConsumedMask = 0;

    if (arcanaTriad) arcanaTriad.dataset.visible = "1";
    if (slotCompass) slotCompass.classList.remove("absorb");
    if (slotTrigger) slotTrigger.classList.remove("absorb");
    if (slotRoute)   slotRoute.classList.remove("absorb");

    // 見せ方：ゲーム邪魔にならないように「短時間だけ濃く」→あとは薄く
    showBanner("⚡ TAROT EXPANSION ⚡", "3 HIT SEQUENCE", "COMPASS / TRIGGER / ROUTE", "THOTH → MAAT → RA", 1100);
    if (ariaLive) ariaLive.textContent = "Tarot expansion started.";

    // 演出段階を1へ（RECORD点火）
    setProtocolUI(Math.max(protocolStep, 1));
  }

  function triadHideSoft() {
    // UIは残すがカードは非表示（必要なら）
    triadVisible = false;
    if (arcanaTriad) arcanaTriad.dataset.visible = "0";
  }

  function triadResetChainOnly() {
    triadSuccess = 0;
    triadConsumedMask = 0;

    // カードは戻す（見た目だけ）
    for (const slot of [slotCompass, slotTrigger, slotRoute]) {
      if (!slot) continue;
      slot.classList.remove("absorb");
    }
  }

  function triadAbsorbIndex(idx1to3) {
    const map = { 1: slotCompass, 2: slotTrigger, 3: slotRoute };
    const slot = map[idx1to3];
    if (!slot) return;

    slot.classList.remove("absorb");
    void slot.offsetWidth;
    slot.classList.add("absorb");
  }

  function triadAdvanceOnSuccess() {
    if (!triadVisible) return;

    triadSuccess = clamp(triadSuccess + 1, 0, TRIAD_SUCCESS_REQUIRED);

    // 吸収（1枚ずつ）
    triadAbsorbIndex(triadSuccess);

    // Protocol演出の段階も進める
    if (triadSuccess === 1) setProtocolUI(Math.max(protocolStep, 1)); // THOTH
    if (triadSuccess === 2) setProtocolUI(Math.max(protocolStep, 2)); // MAAT
    if (triadSuccess >= 3)  setProtocolUI(3);                         // RA (God)

    // Judge text
    if (triadSuccess === 1) showJudge("SYNC", "ARCANA RECORD");
    if (triadSuccess === 2) showJudge("SYNC", "BALANCE");
    if (triadSuccess >= 3)  showJudge("GOD MODE", "SOLAR PROTOCOL");

    // 神演出
    if (triadSuccess >= TRIAD_SUCCESS_REQUIRED) {
      triggerGodSequence();
      // 次の周回を狙えるように少し待ってリセット（カード演出だけ）
      setTimeout(() => {
        // いったん非表示→再表示で「再儀式」感
        if (arcanaTriad) arcanaTriad.dataset.visible = "0";
        setTimeout(() => {
          if (arcanaTriad) arcanaTriad.dataset.visible = "1";
          triadResetChainOnly();
        }, 220);
      }, 520);
    }
  }

  function triggerGodSequence() {
    // 派手演出
    tarotBurst("FEVER");
    spawnCard("D•code", 2);
    spawnCard("SOLAR", 2);
    showBanner("SOLAR SCRIBE MODE", "D•code", "計測完了。だが選ぶのは、あなた。", "ARU", 1200);

    if (VIBRATE_OK) navigator.vibrate([20, 20, 40]);
    if (ariaLive) ariaLive.textContent = "Solar scribe mode activated.";
  }

  // =========================
  // Notes (Tap / Rapid / Burst / Hold)
  // =========================
  function createNotes() {
    notes = [];

    // 導入は少し優しめ
    let t = 1.0;

    while (t < duration) {
      const r = Math.random();

      // Burst (3連)
      if (r < RATE.burst) {
        for (let i = 0; i < 3; i++) {
          notes.push({ time: t + i * BURST_SPACING, type: NT.BURST, hit: false });
        }
        t += BEAT; // 1拍進める
        continue;
      }

      // Rapid (連打)
      if (r < RATE.burst + RATE.rapid) {
        const count = 5 + Math.floor(Math.random() * 3); // 5〜7
        for (let i = 0; i < count; i++) {
          notes.push({ time: t + i * RAPID_SPACING, type: NT.RAPID, hit: false });
        }
        t += BEAT * 1.25;
        continue;
      }

      // Hold
      if (r < RATE.burst + RATE.rapid + RATE.hold) {
        const beats = HOLD_MIN_BEATS + Math.random() * (HOLD_MAX_BEATS - HOLD_MIN_BEATS);
        const holdDur = beats * BEAT;
        notes.push({ time: t, type: NT.HOLD, duration: holdDur, hit: false, holding: false, released: false });
        t += holdDur + BEAT * 0.5;
        continue;
      }

      // Tap
      notes.push({ time: t, type: NT.TAP, hit: false });
      t += BEAT;
    }

    // time順に保証
    notes.sort((a, b) => a.time - b.time);
  }

  // =========================
  // Game Start/End
  // =========================
  async function startGame() {
    await primeMedia();

    duration = (Number.isFinite(music.duration) && music.duration > 5) ? music.duration : 60;

    // Reset state
    score = 0;
    combo = 0;
    setFever(0);
    exitFever();

    isPressing = false;
    holdTarget = null;
    lastHoldTickAt = 0;

    triadVisible = false;
    triadSuccess = 0;
    triadConsumedMask = 0;

    setProtocolUI(0);
    if (arcanaTriad) arcanaTriad.dataset.visible = "0";

    createNotes();
    running = true;

    // sync
    music.currentTime = 0;
    video.currentTime = 0;

    await safePlay(video);
    await safePlay(music);

    showBanner("DiCo", "ARU SYNC", "TAP / HOLD / RELEASE", "145 BPM", 900);

    loop();
  }

  function endGame() {
    running = false;
    try { music.pause(); } catch {}
    try { video.pause(); } catch {}
    alert(`RESULT\nScore: ${score}\nMax Combo: ${combo}`);
  }

  // =========================
  // Drawing
  // =========================
  function drawTargetCanvasFallback() {
    // DOMターゲットが主役。Canvasは薄く補助。
    const cx = canvas.clientWidth / 2;
    const hitY = canvas.clientHeight * HIT_Y_RATIO;

    ctx.save();
    ctx.globalAlpha = 0.18;

    ctx.beginPath();
    ctx.arc(cx, hitY, 26, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,240,255,0.08)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, hitY, 18, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,240,255,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  function noteColor(noteType) {
    // canvas上の色だけ（CSSのカード色と一致）
    if (feverOn) return "rgba(230,201,107,0.92)";

    switch (noteType) {
      case NT.RAPID: return "rgba(156,60,255,0.88)"; // violet
      case NT.BURST: return "rgba(255,120,60,0.88)"; // orange
      case NT.HOLD:  return "rgba(0,240,255,0.88)";  // cyan
      default:       return "rgba(0,240,255,0.88)";
    }
  }

  function drawHoldLane(cx, yStart, yEnd) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.strokeStyle = feverOn ? "rgba(230,201,107,0.22)" : "rgba(0,240,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(cx, yStart);
    ctx.lineTo(cx, yEnd);
    ctx.stroke();
    ctx.restore();
  }

  function loop() {
    if (!running) return;

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const t = music.currentTime + (offsetMs / 1000);
    const hitY = canvas.clientHeight * HIT_Y_RATIO;
    const cx = canvas.clientWidth / 2;

    // time HUD
    const remain = Math.max(0, duration - music.currentTime);
    if (timeEl) timeEl.textContent = remain.toFixed(1);

    // Fever check
    if (feverOn && music.currentTime >= feverUntil) exitFever();

    drawTargetCanvasFallback();

    // Triad auto show (score threshold)
    if (!triadVisible && score >= TRIAD_SCORE_THRESHOLD) {
      triadShow();
    }

    // Hold tick scoring (押し続けてる間)
    if (holdTarget && holdTarget.holding) {
      // tick: 0.22s
      const tickInterval = 0.22;
      const ct = music.currentTime;
      if (ct - lastHoldTickAt >= tickInterval) {
        lastHoldTickAt = ct;
        // 小刻みに快感：少しずつ加点 + fever
        score += Math.round(HOLD_TICK_SCORE * (feverOn ? 1.3 : 1.0));
        setFever(fever + HOLD_TICK_FEVER);
      }

      // 終端超過で強制ミス（離し忘れ）
      const endTime = holdTarget.time + holdTarget.duration;
      const win = feverOn ? JUDGE_FEVER : JUDGE_NORMAL;
      if (t > endTime + win.good) {
        // LATE RELEASE
        combo = 0;
        setFever(fever - 12);
        showJudge("LATE", "RELEASE");
        if (VIBRATE_OK) navigator.vibrate(10);

        holdTarget.holding = false;
        holdTarget.hit = true; // もう処理しない
        holdTarget = null;
        if (targetRoot) targetRoot.classList.remove("holding");
        if (RESET_TRIAD_CHAIN_ON_MISS && triadVisible) triadResetChainOnly();
      }
    }

    // notes drawing
    const winMiss = feverOn ? JUDGE_FEVER.good : JUDGE_NORMAL.good;

    for (const note of notes) {
      // Holdは「押し始め」と「離し」で二段階なので描画条件を分ける
      if (note.type !== NT.HOLD && note.hit) continue;

      const diff = note.time - t; // +:まだ / -:過ぎた
      const y = hitY - diff * NOTE_SPEED;

      // 画面外は描かない（holdはレーンあるので少し広め）
      if (y < -80 || y > canvas.clientHeight + 80) continue;

      // 通過MISS（Holdは開始点を逃した時にMISS扱い）
      if (note.type === NT.HOLD) {
        // 開始点を逃した（まだholdTargetでない）
        if (!note.holding && !note.hit && diff < -winMiss) {
          note.hit = true;
          combo = 0;
          setFever(fever - 12);
          showJudge("MISS", "HOLD LOST");
          if (RESET_TRIAD_CHAIN_ON_MISS && triadVisible) triadResetChainOnly();
          continue;
        }
      } else {
        // 通常ノート
        if (!note.hit && diff < -winMiss) {
          note.hit = true;
          combo = 0;
          setFever(fever - 10);
          showJudge("MISS", "SYNC LOST");
          if (RESET_TRIAD_CHAIN_ON_MISS && triadVisible) triadResetChainOnly();
          continue;
        }
      }

      // Draw
      if (note.type === NT.HOLD) {
        // hold lane: start -> end marker
        const endTime = note.time + note.duration;
        const diffEnd = endTime - t;
        const yEnd = hitY - diffEnd * NOTE_SPEED;

        // レーン
        drawHoldLane(cx, y, yEnd);

        // start head
        ctx.beginPath();
        ctx.arc(cx, y, NOTE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = noteColor(NT.HOLD);
        ctx.fill();

        // end cap
        ctx.beginPath();
        ctx.arc(cx, yEnd, NOTE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fill();

        // holding highlight
        if (note.holding) {
          ctx.beginPath();
          ctx.arc(cx, hitY, NOTE_RADIUS + 10, 0, Math.PI * 2);
          ctx.strokeStyle = feverOn ? "rgba(230,201,107,0.22)" : "rgba(0,240,255,0.20)";
          ctx.lineWidth = 3;
          ctx.stroke();
        }

      } else {
        // normal dot
        ctx.beginPath();
        ctx.arc(cx, y, NOTE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = noteColor(note.type);
        ctx.fill();

        // halo
        ctx.beginPath();
        ctx.arc(cx, y, NOTE_RADIUS + 8, 0, Math.PI * 2);
        ctx.strokeStyle = feverOn ? "rgba(230,201,107,0.18)" : "rgba(0,240,255,0.18)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // HUD
    if (scoreEl) scoreEl.textContent = String(score);
    if (comboEl) comboEl.textContent = String(combo);

    // End
    if (music.currentTime >= duration - 0.02) {
      endGame();
      return;
    }

    requestAnimationFrame(loop);
  }

  // =========================
  // Core: Find closest note
  // =========================
  function findClosestNote(t, allowHoldStart = true) {
    let best = null;
    let closest = 999;

    for (const note of notes) {
      // hold: start判定なら未hit & 未holdingを対象
      if (note.type === NT.HOLD) {
        if (!allowHoldStart) continue;
        if (note.hit || note.holding) continue;
      } else {
        if (note.hit) continue;
      }

      const d = Math.abs(note.time - t);
      if (d < closest) {
        closest = d;
        best = note;
      }
    }
    return { best, closest };
  }

  // =========================
  // Scoring helpers
  // =========================
  function addScore(kind, noteType) {
    // kind: "PERFECT" | "GOOD"
    const mult = feverOn ? 1.5 : 1.0;

    let base = 0;

    if (noteType === NT.RAPID) base = (kind === "PERFECT") ? 55 : 35;
    else if (noteType === NT.BURST) base = (kind === "PERFECT") ? 80 : 55;
    else if (noteType === NT.HOLD) base = (kind === "PERFECT") ? 120 : 90;
    else base = (kind === "PERFECT") ? 100 : 55;

    // コンボ加点（気持ちいい上振れ）
    base += combo * (kind === "PERFECT" ? 6 : 3);

    score += Math.round(base * mult);
  }

  function addFever(kind, noteType) {
    let add = 0;
    if (noteType === NT.RAPID) add = (kind === "PERFECT") ? 5 : 3;
    else if (noteType === NT.BURST) add = (kind === "PERFECT") ? 7 : 4;
    else if (noteType === NT.HOLD)  add = (kind === "PERFECT") ? 10 : 7;
    else add = (kind === "PERFECT") ? 8 : 5;

    setFever(fever + add);
  }

  function onAnySuccess(kind, noteType) {
    // 体感の気持ちよさ：軽くフラッシュ
    targetHitFlash();

    // コンボ演出：8コンボごとに小カード
    if (combo > 0 && combo % 8 === 0) spawnCard("DiCo", 1);

    // Triad中なら “成功としてカウント”
    if (triadVisible) triadAdvanceOnSuccess();

    // 小さめバナー点滅（邪魔しない）
    if (centerBanner) {
      centerBanner.classList.add("show");
      setTimeout(() => centerBanner.classList.remove("show"), 240);
    }

    // 微振動
    if (VIBRATE_OK) navigator.vibrate(kind === "PERFECT" ? 10 : 6);
  }

  function onMiss(type = "MISS") {
    combo = 0;
    setFever(fever - 8);
    showJudge(type, "NO SYNC");
    if (RESET_TRIAD_CHAIN_ON_MISS && triadVisible) triadResetChainOnly();
  }

  // =========================
  // Judge: press / release
  // =========================
  function judgePress() {
    if (!running) return;

    const t = music.currentTime + offsetMs / 1000;
    const win = feverOn ? JUDGE_FEVER : JUDGE_NORMAL;

    // Hold中に押し直しを許すと事故るので、hold中は通常判定しない（連打は pointerdown で取れる）
    // ただし holdTargetがないなら普通に探す
    const { best, closest } = findClosestNote(t, true);
    if (!best) return;

    // Perfect/Good?
    if (closest <= win.perfect) {
      if (best.type === NT.HOLD) {
        // Hold start
        best.holding = true;
        holdTarget = best;
        lastHoldTickAt = music.currentTime;
        combo++;
        addScore("PERFECT", NT.HOLD);   // 開始点の加点
        addFever("PERFECT", NT.HOLD);

        showJudge("HOLD", "KEEP PRESSING");
        if (targetRoot) targetRoot.classList.add("holding");

        onAnySuccess("PERFECT", NT.HOLD);
        if (ariaLive) ariaLive.textContent = "Hold started.";
        return;
      }

      // Normal hit
      best.hit = true;
      combo++;
      addScore("PERFECT", best.type);
      addFever("PERFECT", best.type);

      showJudge("PERFECT", best.type === NT.RAPID ? "RAPID" : best.type === NT.BURST ? "BURST" : "SYNC");
      onAnySuccess("PERFECT", best.type);
      return;
    }

    if (closest <= win.good) {
      if (best.type === NT.HOLD) {
        // Hold start (GOOD)
        best.holding = true;
        holdTarget = best;
        lastHoldTickAt = music.currentTime;
        combo++;
        addScore("GOOD", NT.HOLD);
        addFever("GOOD", NT.HOLD);

        showJudge("HOLD", "KEEP PRESSING");
        if (targetRoot) targetRoot.classList.add("holding");

        onAnySuccess("GOOD", NT.HOLD);
        if (ariaLive) ariaLive.textContent = "Hold started.";
        return;
      }

      best.hit = true;
      combo++;
      addScore("GOOD", best.type);
      addFever("GOOD", best.type);

      showJudge("GOOD", best.type === NT.RAPID ? "RAPID" : best.type === NT.BURST ? "BURST" : "SYNC");
      onAnySuccess("GOOD", best.type);
      return;
    }

    // 空振り
    onMiss("MISS");
  }

  function judgeRelease() {
    if (!running) return;
    if (!holdTarget) return;

    const t = music.currentTime + offsetMs / 1000;
    const win = feverOn ? JUDGE_FEVER : JUDGE_NORMAL;

    const end = holdTarget.time + holdTarget.duration;
    const diff = Math.abs(end - t);

    if (diff <= win.perfect) {
      // PERFECT RELEASE
      combo++;
      addScore("PERFECT", NT.HOLD);
      addFever("PERFECT", NT.HOLD);
      showJudge("PERFECT", "RELEASE");
      onAnySuccess("PERFECT", NT.HOLD);
    } else if (diff <= win.good) {
      combo++;
      addScore("GOOD", NT.HOLD);
      addFever("GOOD", NT.HOLD);
      showJudge("GOOD", "RELEASE");
      onAnySuccess("GOOD", NT.HOLD);
    } else {
      // EARLY/LATE
      combo = 0;
      setFever(fever - 10);
      showJudge(t < end ? "EARLY" : "LATE", "RELEASE");
      if (RESET_TRIAD_CHAIN_ON_MISS && triadVisible) triadResetChainOnly();
    }

    // finalize hold
    holdTarget.holding = false;
    holdTarget.hit = true;
    holdTarget = null;

    if (targetRoot) targetRoot.classList.remove("holding");
    if (ariaLive) ariaLive.textContent = "Hold released.";
  }

  // =========================
  // Input (pointer unified)
  // =========================
  function onPointerDown(e) {
    if (!primed) primeMedia();
    e.preventDefault();

    isPressing = true;
    judgePress();
  }

  function onPointerUp(e) {
    e.preventDefault();

    isPressing = false;
    judgeRelease();
  }

  function onPointerCancel() {
    // 端末が奪った時は release相当で処理
    isPressing = false;
    judgeRelease();
  }

  // iOS: canvas上で統一
  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  canvas.addEventListener("pointerup", onPointerUp, { passive: false });
  canvas.addEventListener("pointercancel", onPointerCancel, { passive: true });
  canvas.addEventListener("pointerleave", onPointerCancel, { passive: true });

  // =========================
  // Buttons
  // =========================
  startBtn?.addEventListener("click", startGame);

  muteBtn?.addEventListener("click", () => {
    music.muted = !music.muted;
    muteBtn.textContent = music.muted ? "UNMUTE" : "MUTE";
  });

  calibBtn?.addEventListener("click", () => {
    const seq = [-40, -30, -20, -10, 0, 10, 20, 30, 40];
    const idx = seq.indexOf(offsetMs);
    offsetMs = seq[(idx + 1) % seq.length];
    showBanner(`CALIB ${offsetMs}ms`, "—", "体感が合う所に合わせてOK", "", 700);
  });

  // =========================
  // Metadata
  // =========================
  music.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(music.duration) && music.duration > 5) duration = music.duration;
  });

  // =========================
  // Fever trigger
  // =========================
  function maybeEnterFever() {
    if (!feverOn && fever >= 100) {
      setFever(100);
      enterFever();
      // 連発抑制
      setFever(70);
    }
  }

  // fever check hook: after every success addFever already did setFever,
  // so patch setFever to call maybeEnterFever? ここは安全に関数で呼ぶ
  const _setFever = setFever;
  setFever = (v) => {
    _setFever(v);
    maybeEnterFever();
  };

  // =========================
  // Init UI
  // =========================
  if (timeEl) timeEl.textContent = "--";
  if (scoreEl) scoreEl.textContent = "0";
  if (comboEl) comboEl.textContent = "0";
  _setFever(0);
  setProtocolUI(0);
  if (arcanaTriad) arcanaTriad.dataset.visible = "0";
})();
