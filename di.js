/* di.js — DiCo Rhythm / ARU (Solar Protocol) [COMPLETE REWRITE for 状態UI完成形]
   ✅ di.html（START/STOP/RESTARTのみ）に完全追従
   ✅ iOS安定：primeMedia / pointer統一 / ダブルタップズーム抑止 / safeRAF
   ✅ Tap / Rapid / Burst(3連) / Hold(長押し) + Release判定
   ✅ FEVER：100%で自動発動（短く強く、戻りも気持ちいい）
   ✅ TRIAD：スコア到達で展開 → 成功3回でGOD（SOLAR SCRIBE MODE）
   ✅ 画面崩れ対策：演出DOMは pointer-events:none 前提
*/
(() => {
  "use strict";

  function initDiGame() {
    // =========================
    // DOM
    // =========================
    const app    = document.getElementById("app");
    const music  = document.getElementById("music");
    const video  = document.getElementById("bgVideo");
    const canvas = document.getElementById("noteCanvas");
    const ctx    = canvas?.getContext("2d", { alpha: true });

    const scoreEl = document.getElementById("score");
    const comboEl = document.getElementById("combo");
    const timeEl  = document.getElementById("time");

    const feverFill = document.getElementById("feverFill");
    const feverText = document.getElementById("feverText");

    const startBtn   = document.getElementById("startBtn");
    const stopBtn    = document.getElementById("stopBtn");
    const restartBtn = document.getElementById("restartBtn");

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

    // 必須チェック（di.htmlの完成形に合わせて最小）
    const required = { app, music, video, canvas, ctx, startBtn, stopBtn, restartBtn };
    const missing = Object.entries(required).filter(([, el]) => !el).map(([id]) => id);
    if (missing.length) {
      console.error(`[di.js] Missing required elements: ${missing.join(", ")}`);
      return;
    }

    // =========================
    // Tunables (Feel-Good Core)
    // =========================
    const CFG = Object.freeze({
      HIT_Y_RATIO: 0.78,
      NOTE_SPEED:  610,
      NOTE_RADIUS: 12,

      BPM: 145,
      BEAT: 60 / 145,

      JUDGE_NORMAL: { perfect: 0.075, good: 0.145 },
      JUDGE_FEVER:  { perfect: 0.065, good: 0.125 },

      FEVER_MAX: 100,
      FEVER_DURATION: 6.2,
      FEVER_DECAY_AFTER: 70,

      TRIAD_SCORE_THRESHOLD: 1200,
      TRIAD_SUCCESS_REQUIRED: 3,

      RATE: { burst: 0.10, rapid: 0.12, hold: 0.16 },
      BURST_SPACING: (60/145) * 0.25,
      RAPID_SPACING: (60/145) * 0.20,
      HOLD_MIN_BEATS: 2.0,
      HOLD_MAX_BEATS: 4.0,

      HOLD_TICK_INTERVAL: 0.22,
      HOLD_TICK_SCORE: 18,
      HOLD_TICK_FEVER: 2,

      RESET_TRIAD_CHAIN_ON_MISS: true,
      FORMS: ["eye", "ankh", "pyramid", "solar"],

      DPR_MAX: 2,
      DRAW_PAD: 100,
    });

    const NT = Object.freeze({
      TAP:   "tap",
      RAPID: "rapid",
      BURST: "burst",
      HOLD:  "hold",
    });

    const VIBRATE_OK = ("vibrate" in navigator);

    // =========================
    // State
    // =========================
    const S = {
      running: false,
      primed: false,
      starting: false,

      notes: [],
      noteIndex: 0,

      score: 0,
      combo: 0,
      maxCombo: 0,

      duration: 60,
      offsetMs: 0, // 将来のOFFSET復帰用に温存（UIなし）

      fever: 0,
      feverOn: false,
      feverUntil: 0,

      pointerDown: false,
      holdTarget: null,
      lastHoldTickAt: 0,

      triadVisible: false,
      triadSuccess: 0,
      protocolStep: 0,

      bannerTimer: 0,

      w: 0,
      h: 0,
      dpr: 1,
      raf: 0,
    };

    // =========================
    // Utils
    // =========================
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    function safeRAF(fn) {
      cancelAnimationFrame(S.raf);
      S.raf = requestAnimationFrame(fn);
    }

    function setVhVar() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    }

    function resize() {
      setVhVar();
      S.dpr = Math.min(CFG.DPR_MAX, window.devicePixelRatio || 1);
      S.w = window.innerWidth;
      S.h = window.innerHeight;

      canvas.width  = Math.floor(S.w * S.dpr);
      canvas.height = Math.floor(S.h * S.dpr);
      canvas.style.width  = `${S.w}px`;
      canvas.style.height = `${S.h}px`;

      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();

    // =========================
    // Safe Media (iOS prime)
    // =========================
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
      if (S.primed) return true;
      S.primed = true;

      // iOS: playsInline / muted 先に
      video.playsInline = true;
      video.muted = true;

      // ユーザー操作中に一度だけ再生→停止で権限確保
      await safePlay(video);
      try { video.pause(); } catch {}
      try { video.currentTime = 0; } catch {}

      await safePlay(music);
      try { music.pause(); } catch {}
      try { music.currentTime = 0; } catch {}

      return true;
    }

    // =========================
    // UI helpers
    // =========================
    function setUIState(state) {
      app.dataset.state = state;
      const isIdle = state === "idle";

      // 状態UI完成形：START/STOP/RESTARTのみ
      startBtn.disabled   = !isIdle;
      stopBtn.disabled    = isIdle;
      restartBtn.disabled = isIdle;
    }

    function announce(msg) {
      if (ariaLive) ariaLive.textContent = msg;
    }

    function showBanner(big, sub, small, tiny = "", ms = 900) {
      if (bannerBig)   bannerBig.textContent   = big ?? "";
      if (bannerSub)   bannerSub.textContent   = sub ?? "";
      if (bannerSmall) bannerSmall.textContent = small ?? "";
      if (bannerTiny)  bannerTiny.textContent  = tiny ?? "";

      if (!centerBanner) return;
      centerBanner.classList.add("show");
      clearTimeout(S.bannerTimer);
      S.bannerTimer = setTimeout(() => centerBanner.classList.remove("show"), ms);
    }

    function showJudge(main, sub) {
      if (!judgeText) return;
      if (judgeMain) judgeMain.textContent = main ?? "";
      if (judgeSub)  judgeSub.textContent  = sub ?? "";

      judgeText.classList.remove("show");
      void judgeText.offsetWidth; // restart anim
      judgeText.classList.add("show");
    }

    function targetHitFlash() {
      if (!targetRoot) return;
      targetRoot.classList.remove("hit");
      void targetRoot.offsetWidth;
      targetRoot.classList.add("hit");
    }

    // =========================
    // Fever
    // =========================
    function setFever(v) {
      S.fever = clamp(v, 0, CFG.FEVER_MAX);
      if (feverFill) feverFill.style.width = `${S.fever.toFixed(0)}%`;
      if (feverText) feverText.textContent = `${S.fever.toFixed(0)}%`;

      if (!S.feverOn && S.fever >= CFG.FEVER_MAX) {
        S.fever = CFG.FEVER_MAX;
        enterFever();
        // 連発抑制（気持ちいい戻り）
        S.fever = CFG.FEVER_DECAY_AFTER;
        if (feverFill) feverFill.style.width = `${S.fever.toFixed(0)}%`;
        if (feverText) feverText.textContent = `${S.fever.toFixed(0)}%`;
      }
    }

    function enterFever() {
      S.feverOn = true;
      S.feverUntil = music.currentTime + CFG.FEVER_DURATION;
      document.body.classList.add("feverOn");
      showBanner("⚡ TAROT EXPANSION ⚡", "FEVER DRIVE", "SYNC EVERYTHING", "DiCo / ARU", 980);
      tarotBurst("FEVER");
      if (VIBRATE_OK) navigator.vibrate(20);
      announce("Fever drive activated.");
    }

    function exitFever() {
      S.feverOn = false;
      document.body.classList.remove("feverOn");
      announce("Fever ended.");
    }

    // =========================
    // FX: Card Burst
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
        spawnCard("ROUTE",   2);
        spawnCard("DiCo",    2);
      } else {
        spawnCard("COMPASS", 1);
      }
    }

    // =========================
    // Myth / Protocol (di.html に存在する要素だけ)
    // =========================
    function setProtocolUI(step) {
      S.protocolStep = clamp(step, 0, 3);

      if (hieroRing)     hieroRing.classList.toggle("on", S.protocolStep >= 1);
      if (maatScale)     maatScale.classList.toggle("on", S.protocolStep >= 2);
      if (solarDisc)     solarDisc.classList.toggle("on", S.protocolStep >= 3);
      if (particleField) particleField.classList.toggle("on", S.protocolStep >= 1);

      if (targetRoot) {
        targetRoot.dataset.tier = String(S.protocolStep);
        targetRoot.dataset.form = CFG.FORMS[S.protocolStep] || "eye";
      }

      if (godMode) godMode.dataset.on = (S.protocolStep >= 3) ? "1" : "0";
    }

    // =========================
    // TRIAD
    // =========================
    function triadShow() {
      S.triadVisible = true;
      S.triadSuccess = 0;

      if (arcanaTriad) arcanaTriad.dataset.visible = "1";
      slotCompass?.classList.remove("absorb");
      slotTrigger?.classList.remove("absorb");
      slotRoute?.classList.remove("absorb");

      showBanner("⚡ TAROT EXPANSION ⚡", "3 HIT SEQUENCE", "COMPASS / TRIGGER / ROUTE", "THOTH → MAAT → RA", 1120);
      announce("Tarot expansion started.");
      setProtocolUI(Math.max(S.protocolStep, 1));
    }

    function triadResetChainOnly() {
      S.triadSuccess = 0;
      slotCompass?.classList.remove("absorb");
      slotTrigger?.classList.remove("absorb");
      slotRoute?.classList.remove("absorb");
    }

    function triadAbsorbIndex(idx1to3) {
      const map = { 1: slotCompass, 2: slotTrigger, 3: slotRoute };
      const slot = map[idx1to3];
      if (!slot) return;
      slot.classList.remove("absorb");
      void slot.offsetWidth;
      slot.classList.add("absorb");
    }

    function triggerGodSequence() {
      tarotBurst("FEVER");
      spawnCard("D•code", 2);
      spawnCard("SOLAR",  2);

      showBanner("SOLAR SCRIBE MODE", "D•code", "計測完了。だが選ぶのは、あなた。", "ARU", 1250);
      if (VIBRATE_OK) navigator.vibrate([18, 18, 36]);
      announce("Solar scribe mode activated.");
    }

    function triadAdvanceOnSuccess() {
      if (!S.triadVisible) return;

      S.triadSuccess = clamp(S.triadSuccess + 1, 0, CFG.TRIAD_SUCCESS_REQUIRED);
      triadAbsorbIndex(S.triadSuccess);

      if (S.triadSuccess === 1) setProtocolUI(Math.max(S.protocolStep, 1));
      if (S.triadSuccess === 2) setProtocolUI(Math.max(S.protocolStep, 2));
      if (S.triadSuccess >= 3)  setProtocolUI(3);

      if (S.triadSuccess === 1) showJudge("SYNC", "ARCANA RECORD");
      if (S.triadSuccess === 2) showJudge("SYNC", "BALANCE");
      if (S.triadSuccess >= 3)  showJudge("GOD MODE", "SOLAR PROTOCOL");

      if (S.triadSuccess >= CFG.TRIAD_SUCCESS_REQUIRED) {
        triggerGodSequence();

        // ループ気持ちよく：一瞬消して再点灯→儀式継続
        setTimeout(() => {
          if (arcanaTriad) arcanaTriad.dataset.visible = "0";
          setTimeout(() => {
            if (arcanaTriad) arcanaTriad.dataset.visible = "1";
            triadResetChainOnly();
          }, 220);
        }, 520);
      }
    }

    // =========================
    // Notes: generation
    // =========================
    function createNotes() {
      const notes = [];
      const d = S.duration;

      let t = 1.0; // intro 余裕
      const rateBurst = CFG.RATE.burst;
      const rateRapid = CFG.RATE.rapid;
      const rateHold  = CFG.RATE.hold;

      while (t < d) {
        const r = Math.random();

        if (r < rateBurst) {
          for (let i = 0; i < 3; i++) {
            notes.push({ time: t + i * CFG.BURST_SPACING, type: NT.BURST, hit: false });
          }
          t += CFG.BEAT;
          continue;
        }

        if (r < rateBurst + rateRapid) {
          const count = 5 + Math.floor(Math.random() * 3); // 5..7
          for (let i = 0; i < count; i++) {
            notes.push({ time: t + i * CFG.RAPID_SPACING, type: NT.RAPID, hit: false });
          }
          t += CFG.BEAT * 1.25;
          continue;
        }

        if (r < rateBurst + rateRapid + rateHold) {
          const beats = CFG.HOLD_MIN_BEATS + Math.random() * (CFG.HOLD_MAX_BEATS - CFG.HOLD_MIN_BEATS);
          const holdDur = beats * CFG.BEAT;
          notes.push({
            time: t,
            type: NT.HOLD,
            duration: holdDur,
            hit: false,
            holding: false,
          });
          t += holdDur + CFG.BEAT * 0.5;
          continue;
        }

        notes.push({ time: t, type: NT.TAP, hit: false });
        t += CFG.BEAT;
      }

      notes.sort((a, b) => a.time - b.time);
      S.notes = notes;
      S.noteIndex = 0;
    }

    // =========================
    // Scoring / Feel
    // =========================
    function judgeWindow() {
      return S.feverOn ? CFG.JUDGE_FEVER : CFG.JUDGE_NORMAL;
    }

    function addScore(kind, noteType) {
      const mult = S.feverOn ? 1.5 : 1.0;

      let base = 0;
      if (noteType === NT.RAPID) base = (kind === "PERFECT") ? 55 : 35;
      else if (noteType === NT.BURST) base = (kind === "PERFECT") ? 80 : 55;
      else if (noteType === NT.HOLD) base = (kind === "PERFECT") ? 120 : 90;
      else base = (kind === "PERFECT") ? 100 : 55;

      base += S.combo * (kind === "PERFECT" ? 6 : 3); // 気持ちよさの核
      S.score += Math.round(base * mult);
    }

    function addFever(kind, noteType) {
      let add = 0;
      if (noteType === NT.RAPID) add = (kind === "PERFECT") ? 5 : 3;
      else if (noteType === NT.BURST) add = (kind === "PERFECT") ? 7 : 4;
      else if (noteType === NT.HOLD)  add = (kind === "PERFECT") ? 10 : 7;
      else add = (kind === "PERFECT") ? 8 : 5;

      setFever(S.fever + add);
    }

    function applyComboInc() {
      S.combo++;
      if (S.combo > S.maxCombo) S.maxCombo = S.combo;
    }

    function onAnySuccess(kind, noteType) {
      targetHitFlash();

      // 8コンボごとにDiCoカード
      if (S.combo > 0 && S.combo % 8 === 0) spawnCard("DiCo", 1);

      // TRIAD中は儀式へ
      if (S.triadVisible) triadAdvanceOnSuccess();

      // 中央バナーを“瞬き”程度に（邪魔しない）
      if (centerBanner) {
        centerBanner.classList.add("show");
        setTimeout(() => centerBanner.classList.remove("show"), 220);
      }

      if (VIBRATE_OK) navigator.vibrate(kind === "PERFECT" ? 10 : 6);
    }

    function miss(type = "MISS", sub = "NO SYNC") {
      S.combo = 0;
      setFever(S.fever - 8);
      showJudge(type, sub);
      if (CFG.RESET_TRIAD_CHAIN_ON_MISS && S.triadVisible) triadResetChainOnly();
    }

    // =========================
    // Note Search (fast)
    // =========================
    function findClosestNote(t, allowHoldStart = true) {
      let best = null;
      let closest = 999;

      const win = judgeWindow();
      const scan = win.good + 0.20;

      while (S.noteIndex < S.notes.length) {
        const n = S.notes[S.noteIndex];
        const endTime = (n.type === NT.HOLD) ? (n.time + n.duration) : n.time;
        if (endTime < t - scan) {
          S.noteIndex++;
          continue;
        }
        break;
      }

      const start = Math.max(0, S.noteIndex - 10);
      const end   = Math.min(S.notes.length, S.noteIndex + 18);

      for (let i = start; i < end; i++) {
        const note = S.notes[i];

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
    // Rendering
    // =========================
    function noteColor(noteType) {
      if (S.feverOn) return "rgba(230,201,107,0.92)";
      if (noteType === NT.RAPID) return "rgba(156,60,255,0.88)";
      if (noteType === NT.BURST) return "rgba(255,120,60,0.88)";
      if (noteType === NT.HOLD)  return "rgba(0,240,255,0.88)";
      return "rgba(0,240,255,0.88)";
    }

    function drawHoldLane(cx, yStart, yEnd) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.strokeStyle = S.feverOn ? "rgba(230,201,107,0.22)" : "rgba(0,240,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(cx, yStart);
      ctx.lineTo(cx, yEnd);
      ctx.stroke();
      ctx.restore();
    }

    function drawTargetCanvasHint() {
      const cx = S.w / 2;
      const hitY = S.h * CFG.HIT_Y_RATIO;

      ctx.save();
      ctx.globalAlpha = 0.16;

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

    function render() {
      if (!S.running) return;

      ctx.clearRect(0, 0, S.w, S.h);

      const t = music.currentTime + (S.offsetMs / 1000);
      const hitY = S.h * CFG.HIT_Y_RATIO;
      const cx = S.w / 2;

      // HUD time
      const remain = Math.max(0, S.duration - music.currentTime);
      if (timeEl) timeEl.textContent = remain.toFixed(1);

      // Fever end
      if (S.feverOn && music.currentTime >= S.feverUntil) exitFever();

      // TRIAD auto show
      if (!S.triadVisible && S.score >= CFG.TRIAD_SCORE_THRESHOLD) triadShow();

      // Hold tick
      if (S.holdTarget && S.holdTarget.holding) {
        const ct = music.currentTime;

        if (ct - S.lastHoldTickAt >= CFG.HOLD_TICK_INTERVAL) {
          S.lastHoldTickAt = ct;
          S.score += Math.round(CFG.HOLD_TICK_SCORE * (S.feverOn ? 1.3 : 1.0));
          setFever(S.fever + CFG.HOLD_TICK_FEVER);
        }

        // 離し忘れ救済：good窓を越えたらMISS
        const endTime = S.holdTarget.time + S.holdTarget.duration;
        const win = judgeWindow();
        if (t > endTime + win.good) {
          targetRoot?.classList.remove("holding");
          S.holdTarget.holding = false;
          S.holdTarget.hit = true;
          S.holdTarget = null;
          miss("LATE", "RELEASE");
          if (VIBRATE_OK) navigator.vibrate(10);
        }
      }

      drawTargetCanvasHint();

      // Draw notes
      const win = judgeWindow();
      const missWin = win.good;

      for (const note of S.notes) {
        if (note.type !== NT.HOLD && note.hit) continue;

        const diff = note.time - t;
        const y = hitY - diff * CFG.NOTE_SPEED;

        if (y < -CFG.DRAW_PAD || y > S.h + CFG.DRAW_PAD) continue;

        // auto MISS
        if (note.type === NT.HOLD) {
          if (!note.holding && !note.hit && diff < -missWin) {
            note.hit = true;
            miss("MISS", "HOLD LOST");
            continue;
          }
        } else {
          if (!note.hit && diff < -missWin) {
            note.hit = true;
            miss("MISS", "SYNC LOST");
            continue;
          }
        }

        if (note.type === NT.HOLD) {
          const endTime = note.time + note.duration;
          const diffEnd = endTime - t;
          const yEnd = hitY - diffEnd * CFG.NOTE_SPEED;

          drawHoldLane(cx, y, yEnd);

          // head
          ctx.beginPath();
          ctx.arc(cx, y, CFG.NOTE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = noteColor(NT.HOLD);
          ctx.fill();

          // end cap
          ctx.beginPath();
          ctx.arc(cx, yEnd, CFG.NOTE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.fill();

          // holding ring hint
          if (note.holding) {
            ctx.beginPath();
            ctx.arc(cx, hitY, CFG.NOTE_RADIUS + 10, 0, Math.PI * 2);
            ctx.strokeStyle = S.feverOn ? "rgba(230,201,107,0.22)" : "rgba(0,240,255,0.20)";
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.arc(cx, y, CFG.NOTE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = noteColor(note.type);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(cx, y, CFG.NOTE_RADIUS + 8, 0, Math.PI * 2);
          ctx.strokeStyle = S.feverOn ? "rgba(230,201,107,0.18)" : "rgba(0,240,255,0.18)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // HUD
      if (scoreEl) scoreEl.textContent = String(S.score);
      if (comboEl) comboEl.textContent = String(S.combo);

      // End
      if (music.currentTime >= S.duration - 0.02) {
        endGame();
        return;
      }

      S.raf = requestAnimationFrame(render);
    }

    // =========================
    // Judge: Press / Release
    // =========================
    function judgePress() {
      if (!S.running) return;

      const t = music.currentTime + (S.offsetMs / 1000);
      const win = judgeWindow();
      const { best, closest } = findClosestNote(t, true);
      if (!best) return;

      // PERFECT
      if (closest <= win.perfect) {
        if (best.type === NT.HOLD) {
          best.holding = true;
          S.holdTarget = best;
          S.lastHoldTickAt = music.currentTime;

          applyComboInc();
          addScore("PERFECT", NT.HOLD);
          addFever("PERFECT", NT.HOLD);

          showJudge("HOLD", "KEEP PRESSING");
          targetRoot?.classList.add("holding");
          onAnySuccess("PERFECT", NT.HOLD);
          announce("Hold started.");
          return;
        }

        best.hit = true;
        applyComboInc();
        addScore("PERFECT", best.type);
        addFever("PERFECT", best.type);

        showJudge("PERFECT", best.type === NT.RAPID ? "RAPID" : best.type === NT.BURST ? "BURST" : "SYNC");
        onAnySuccess("PERFECT", best.type);
        return;
      }

      // GOOD
      if (closest <= win.good) {
        if (best.type === NT.HOLD) {
          best.holding = true;
          S.holdTarget = best;
          S.lastHoldTickAt = music.currentTime;

          applyComboInc();
          addScore("GOOD", NT.HOLD);
          addFever("GOOD", NT.HOLD);

          showJudge("HOLD", "KEEP PRESSING");
          targetRoot?.classList.add("holding");
          onAnySuccess("GOOD", NT.HOLD);
          announce("Hold started.");
          return;
        }

        best.hit = true;
        applyComboInc();
        addScore("GOOD", best.type);
        addFever("GOOD", best.type);

        showJudge("GOOD", best.type === NT.RAPID ? "RAPID" : best.type === NT.BURST ? "BURST" : "SYNC");
        onAnySuccess("GOOD", best.type);
        return;
      }

      miss("MISS", "EMPTY TAP");
    }

    function judgeRelease() {
      if (!S.running) return;
      if (!S.holdTarget) return;

      const t = music.currentTime + (S.offsetMs / 1000);
      const win = judgeWindow();

      const end = S.holdTarget.time + S.holdTarget.duration;
      const diff = Math.abs(end - t);

      if (diff <= win.perfect) {
        applyComboInc();
        addScore("PERFECT", NT.HOLD);
        addFever("PERFECT", NT.HOLD);
        showJudge("PERFECT", "RELEASE");
        onAnySuccess("PERFECT", NT.HOLD);
      } else if (diff <= win.good) {
        applyComboInc();
        addScore("GOOD", NT.HOLD);
        addFever("GOOD", NT.HOLD);
        showJudge("GOOD", "RELEASE");
        onAnySuccess("GOOD", NT.HOLD);
      } else {
        S.combo = 0;
        setFever(S.fever - 10);
        showJudge(t < end ? "EARLY" : "LATE", "RELEASE");
        if (CFG.RESET_TRIAD_CHAIN_ON_MISS && S.triadVisible) triadResetChainOnly();
      }

      S.holdTarget.holding = false;
      S.holdTarget.hit = true;
      S.holdTarget = null;

      targetRoot?.classList.remove("holding");
      announce("Hold released.");
    }

    // =========================
    // Game Start/Stop/Restart
    // =========================
    function resetRunState() {
      S.score = 0;
      S.combo = 0;
      S.maxCombo = 0;

      S.fever = 0;
      S.feverOn = false;
      S.feverUntil = 0;
      document.body.classList.remove("feverOn");

      S.pointerDown = false;
      S.holdTarget = null;
      S.lastHoldTickAt = 0;

      S.triadVisible = false;
      S.triadSuccess = 0;

      setProtocolUI(0);
      if (arcanaTriad) arcanaTriad.dataset.visible = "0";
      setFever(0);

      if (timeEl)  timeEl.textContent  = "--";
      if (scoreEl) scoreEl.textContent = "0";
      if (comboEl) comboEl.textContent = "0";
    }

    async function startGame() {
      if (S.starting) return;
      S.starting = true;

      await primeMedia();

      // duration確定（metadata未確定の時は60）
      S.duration = (Number.isFinite(music.duration) && music.duration > 5) ? music.duration : 60;

      resetRunState();
      createNotes();

      try { music.currentTime = 0; } catch {}
      try { video.currentTime = 0; } catch {}

      const videoOk = await safePlay(video);
      const musicOk = await safePlay(music);

      if (!videoOk || !musicOk) {
        // ブロック時：ここに来るのは基本「ユーザー操作外」の時だけ
        showBanner("READY", "TAP START", "Playback blocked until user gesture", "", 1400);
        announce("Ready. Tap START.");
        setUIState("idle");
        S.running = false;
        S.starting = false;
        return;
      }

      S.running = true;
      setUIState("running");
      showBanner("DiCo", "ARU SYNC", "TAP / HOLD / RELEASE", "145 BPM", 900);
      announce("Game started.");

      safeRAF(render);
      S.starting = false;
    }

    function stopGameToIdle() {
      S.running = false;
      cancelAnimationFrame(S.raf);

      try { music.pause(); } catch {}
      try { video.pause(); } catch {}

      targetRoot?.classList.remove("holding");

      // iOSで「次回スタート時に頭がズレる」問題回避
      try { music.currentTime = 0; } catch {}
      try { video.currentTime = 0; } catch {}

      resetRunState();
      setUIState("idle");
      showBanner("READY", "TAP START", "", "", 1200);
      announce("Ready. Tap START.");
    }

    async function restartGame() {
      stopGameToIdle();
      await startGame();
    }

    function endGame() {
      const resultScore = S.score;
      const resultMaxCombo = S.maxCombo;
      stopGameToIdle();
      showBanner("RESULT", `Score ${resultScore}`, `Max Combo ${resultMaxCombo}`, "", 1600);
      announce("Run complete.");
    }

    // =========================
    // Input (pointer unified)
    // =========================
    function onPointerDown(e) {
      if (!S.primed) primeMedia();
      if (S.running) e.preventDefault();
      S.pointerDown = true;
      judgePress();
    }

    function onPointerUp(e) {
      if (S.running) e.preventDefault();
      S.pointerDown = false;
      judgeRelease();
    }

    function onPointerCancel() {
      S.pointerDown = false;
      judgeRelease();
    }

    // canvasが主入力面（UI完成形：余計なDOMタップ衝突を避ける）
    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointerup", onPointerUp, { passive: false });
    canvas.addEventListener("pointercancel", onPointerCancel, { passive: true });
    canvas.addEventListener("pointerleave", onPointerCancel, { passive: true });

    // iOS: double-tap zoom抑止（保険）
    canvas.addEventListener("touchstart", (e) => {
      if (S.running) e.preventDefault();
    }, { passive: false });

    // =========================
    // Buttons (状態UI完成形)
    // =========================
    startBtn.addEventListener("click", startGame);
    stopBtn.addEventListener("click", stopGameToIdle);
    restartBtn.addEventListener("click", restartGame);

    // =========================
    // Metadata
    // =========================
    music.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(music.duration) && music.duration > 5) S.duration = music.duration;
    });

    // =========================
    // Init UI
    // =========================
    resetRunState();
    setUIState("idle");
    announce("Ready. Tap START.");
    showBanner("READY", "TAP START", "", "", 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDiGame, { once: true });
  } else {
    initDiGame();
  }
})();
