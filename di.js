(() => {
  'use strict';

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
  const hieroRing    = document.getElementById("hieroRing");
  const maatScale    = document.getElementById("maatScale");
  const solarDisc    = document.getElementById("solarDisc");
  const particleField= document.getElementById("particleField");

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
  // Game Settings
  // =========================
  const HIT_Y_RATIO = 0.82;        // 6時固定
  const NOTE_SPEED  = 520;         // px/sec
  const NOTE_RADIUS = 12;

  const FEVER_DURATION = 6.0;
  const FEVER_MAX = 100;

  // 判定（秒）
  const JUDGE_NORMAL = { perfect: 0.075, good: 0.140 };
  const JUDGE_FEVER  = { perfect: 0.065, good: 0.120 };

  // ====== Myth/Protocol (成功3回で神演出)
  // success判定は Perfect/Good を「成功」としてカウント
  // 失敗（空振り or MISS通過）でコンボは切れるが、プロトコル成功は「リセット/維持」を選べる
  // 今は中毒性優先：空振りで successChain を 0 に戻す
  const CHAIN_RESET_ON_MISS = true;

  // ターゲット形状の進化
  const FORMS = ["eye", "ankh", "pyramid", "solar"]; // tier 0..3

  // =========================
  // State
  // =========================
  let notes = [];
  let score = 0;
  let combo = 0;
  let running = false;

  let duration = 60;
  let startAtPerf = 0;

  // fever
  let fever = 0;
  let feverOn = false;
  let feverUntil = 0;

  // iOS対策
  let primed = false;

  // timing offset
  let offsetMs = 0;

  // Myth protocol chain
  // 0=未開始, 1=RECORD, 2=BALANCE, 3=SOLAR(神演出)
  let protocolStep = 0;         // 0..3
  let successChain = 0;         // 0..3（このゲームでは 3で神演出）
  let triadVisible = false;

  // =========================
  // Utility
  // =========================
  const now = () => performance.now();
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function setVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
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
    } catch (e) {
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
  // Notes
  // =========================
  function createNotes() {
    notes = [];
    const step = 0.58;
    const intro = 1.0;

    for (let t = intro; t < duration; t += step) {
      notes.push({ time: t, hit: false });
    }
  }

  // =========================
  // FX helpers
  // =========================
  function spawnCard(title, power = 1) {
    const el = document.createElement('div');
    el.className = 'card';

    const rot = (Math.random() * 40 - 20) + (power >= 2 ? (Math.random() * 30 - 15) : 0);
    const ang = Math.random() * Math.PI * 2;
    const dist = (power >= 2 ? 220 : 160) + Math.random() * 70;

    el.style.setProperty('--rot', `${rot}deg`);
    el.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    el.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    el.dataset.title = title;

    fxLayer.appendChild(el);
    void el.offsetWidth;
    el.classList.add('play');
    el.addEventListener('animationend', () => el.remove(), { once: true });
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

  let bannerTimer = 0;
  function showBanner(big, sub, small, tiny = "", ms = 950) {
    bannerBig.textContent = big;
    if (bannerSub) bannerSub.textContent = sub ?? "";
    bannerSmall.textContent = small ?? "";
    if (bannerTiny) bannerTiny.textContent = tiny ?? "";

    centerBanner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => centerBanner.classList.remove('show'), ms);
  }

  function showJudge(main, sub) {
    if (!judgeText) return;
    judgeMain.textContent = main;
    judgeSub.textContent = sub;
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
    feverFill.style.width = `${fever.toFixed(0)}%`;
    feverText.textContent = `${fever.toFixed(0)}%`;
  }

  function enterFever() {
    feverOn = true;
    feverUntil = music.currentTime + FEVER_DURATION;
    document.body.classList.add('feverOn');

    // Fever演出は“神話”よりも「勢い」を優先してカード乱舞
    showBanner("⚡ TAROT EXPANSION ⚡", "ARCANA ALIGNMENT START", "COMPASS / TRIGGER / ROUTE", "THOTH → MAAT → RA", 1100);
    tarotBurst("FEVER");
  }

  function exitFever() {
    feverOn = false;
    document.body.classList.remove('feverOn');
  }

  // =========================
  // Myth Protocol Orchestration
  // =========================
  function setProtocolUI(step) {
    // step: 0..3
    if (protocolStack) {
      if (step === 0) protocolStack.classList.remove("on");
      else protocolStack.classList.add("on");
    }

    // state mapping
    const s1 = step >= 1 ? "on" : "idle";
    const s2 = step >= 2 ? "on" : "idle";
    const s3 = step >= 3 ? "on" : "idle";

    if (p1) p1.dataset.state = step >= 1 ? (step >= 2 ? "done" : s1) : "idle";
    if (p2) p2.dataset.state = step >= 2 ? (step >= 3 ? "done" : s2) : "idle";
    if (p3) p3.dataset.state = step >= 3 ? "on" : "idle";

    // Myth objects
    if (hieroRing) hieroRing.classList.toggle("on", step >= 1);
    if (maatScale) maatScale.classList.toggle("on", step >= 2);
    if (solarDisc) solarDisc.classList.toggle("on", step >= 3);
    if (particleField) particleField.classList.toggle("on", step >= 1);

    // Target evolution
    if (targetRoot) {
      const tier = clamp(step, 0, 3);
      targetRoot.dataset.tier = String(tier);
      targetRoot.dataset.form = FORMS[tier] || "eye";
    }

    // God mode
    if (godMode) godMode.dataset.on = step >= 3 ? "1" : "0";
  }

  function showTriad() {
    triadVisible = true;
    if (arcanaTriad) arcanaTriad.dataset.visible = "1";
    // “儀式開始”のバナー
    showBanner("⚡ TAROT EXPANSION ⚡", "ARCANA RECORD INITIALIZED", "COMPASS / TRIGGER / ROUTE", "THOTH → MAAT → RA", 1000);
  }

  function resetTriadCards() {
    // 見た目を初期化（吸収解除）
    for (const slot of [slotCompass, slotTrigger, slotRoute]) {
      if (!slot) continue;
      slot.classList.remove("absorb");
      slot.style.opacity = "";
      slot.style.transform = "";
    }
    // 表示状態
    if (arcanaTriad) arcanaTriad.dataset.visible = "0";
    triadVisible = false;
  }

  function absorbNextCard(chainValue) {
    // chainValue: 1..3
    const map = { 1: slotCompass, 2: slotTrigger, 3: slotRoute };
    const slot = map[chainValue];
    if (!slot) return;

    slot.classList.remove("absorb");
    void slot.offsetWidth;
    slot.classList.add("absorb");
  }

  function advanceProtocolOnSuccess() {
    // successChain: 1..3
    // 1: RECORD(THOTH)  2: BALANCE(MAAT)  3: SOLAR(RA)
    if (successChain === 1) {
      protocolStep = Math.max(protocolStep, 1);
      setProtocolUI(protocolStep);

      showJudge("PERFECT", "ARCANA RECORD");
      if (ariaLive) ariaLive.textContent = "Arcana record initialized.";

    } else if (successChain === 2) {
      protocolStep = Math.max(protocolStep, 2);
      setProtocolUI(protocolStep);

      showJudge("SYNC", "BALANCE DETECTED");
      if (ariaLive) ariaLive.textContent = "Balance detected.";

    } else if (successChain >= 3) {
      protocolStep = 3;
      setProtocolUI(protocolStep);

      showJudge("GOD MODE", "SOLAR PROTOCOL");
      if (ariaLive) ariaLive.textContent = "Solar protocol activated.";

      // 神演出：追加で派手カード
      tarotBurst("FEVER");
      spawnCard("D•code", 2);
    }
  }

  function resetProtocolChain(soft = false) {
    // soft=false: 完全リセット（見た目も）
    // soft=true : successChainだけ0（儀式UIは維持）
    successChain = 0;

    // ターゲットを“戻す”かは好み：今回は儀式感を残すため tier は protocolStep に合わせたまま
    if (!soft) {
      protocolStep = 0;
      setProtocolUI(0);
      resetTriadCards();
    }
  }

  // =========================
  // Start / Stop
  // =========================
  async function startGame() {
    await primeMedia();

    duration = Number.isFinite(music.duration) && music.duration > 5 ? music.duration : 60;

    score = 0;
    combo = 0;
    setFever(0);
    exitFever();

    createNotes();
    running = true;

    // Myth reset
    protocolStep = 0;
    successChain = 0;
    setProtocolUI(0);
    resetTriadCards();

    // sync
    music.currentTime = 0;
    video.currentTime = 0;

    await safePlay(video);
    await safePlay(music);

    startAtPerf = now();

    // 開始演出：儀式バナー → triad表示
    showBanner("DiCo", "—", "TAP TO SYNC", "THOTH → MAAT → RA", 700);
    setTimeout(() => {
      showTriad();
      // triad表示後に儀式UI開始（0→1にはまだしない、成功で点火）
      if (protocolStack) protocolStack.classList.add("on");
    }, 380);

    loop();
  }

  function endGame() {
    running = false;
    music.pause();
    video.pause();
    alert(`RESULT\nScore: ${score}`);
  }

  // =========================
  // Draw
  // =========================
  function drawTargetCanvasFallback() {
    // DOMターゲットがあるので、Canvasターゲットは薄めに残す（消したければここを空にしてOK）
    const cx = canvas.clientWidth / 2;
    const hitY = canvas.clientHeight * HIT_Y_RATIO;

    ctx.save();
    ctx.globalAlpha = 0.25;

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

  function loop() {
    if (!running) return;

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const t = music.currentTime + (offsetMs / 1000);
    const hitY = canvas.clientHeight * HIT_Y_RATIO;
    const cx = canvas.clientWidth / 2;

    // time HUD
    const remain = Math.max(0, duration - music.currentTime);
    timeEl.textContent = remain.toFixed(1);

    // Fever check
    if (feverOn && music.currentTime >= feverUntil) exitFever();

    drawTargetCanvasFallback();

    // notes
    for (const note of notes) {
      if (note.hit) continue;

      const diff = note.time - t;
      const y = hitY - diff * NOTE_SPEED;

      if (y < -40 || y > canvas.clientHeight + 40) continue;

      // 通過MISS
      if (diff < -(feverOn ? JUDGE_FEVER.good : JUDGE_NORMAL.good)) {
        note.hit = true;
        combo = 0;
        setFever(fever - 10);

        if (CHAIN_RESET_ON_MISS) {
          // 儀式チェインだけ戻す（UIは維持）
          resetProtocolChain(true);
          showJudge("MISS", "SYNC LOST");
        }
        continue;
      }

      ctx.beginPath();
      ctx.arc(cx, y, NOTE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = feverOn ? "rgba(230,201,107,0.92)" : "rgba(0,240,255,0.88)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, y, NOTE_RADIUS + 8, 0, Math.PI * 2);
      ctx.strokeStyle = feverOn ? "rgba(230,201,107,0.18)" : "rgba(0,240,255,0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // HUD
    scoreEl.textContent = score.toString();
    comboEl.textContent = combo.toString();

    if (music.currentTime >= duration - 0.02) {
      endGame();
      return;
    }

    requestAnimationFrame(loop);
  }

  // =========================
  // Judge (Tap)
  // =========================
  function judge() {
    if (!running) return;

    const t = music.currentTime + (offsetMs / 1000);
    const win = feverOn ? JUDGE_FEVER : JUDGE_NORMAL;

    let best = null;
    let closest = 999;

    for (const note of notes) {
      if (note.hit) continue;
      const d = Math.abs(note.time - t);
      if (d < closest) {
        closest = d;
        best = note;
      }
    }
    if (!best) return;

    // helper: 成功時の共通処理（神話チェイン・カード吸収）
    function onSuccess(kind /* "PERFECT"|"GOOD" */) {
      // チェイン + 1
      successChain = clamp(successChain + 1, 0, 3);

      // 成功回数に応じてプロトコル UI 更新
      if (successChain >= 1) {
        // successChain=1 の瞬間に儀式点火（RECORD）
        if (protocolStep < 1) protocolStep = 1;
      }
      if (successChain >= 2) {
        if (protocolStep < 2) protocolStep = 2;
      }
      if (successChain >= 3) {
        protocolStep = 3;
      }
      setProtocolUI(protocolStep);

      // ターゲットのヒットフラッシュ
      targetHitFlash();

      // 3枚カード：成功で1枚ずつ吸収
      if (triadVisible) absorbNextCard(successChain);

      // 判定テキスト
      if (successChain === 1) {
        showJudge(kind, "ARCANA RECORD");
        if (bannerSub) bannerSub.textContent = "ARCANA RECORD INITIALIZED";
      } else if (successChain === 2) {
        showJudge(kind, "BALANCE DETECTED");
        if (bannerSub) bannerSub.textContent = "BALANCE DETECTED";
      } else if (successChain >= 3) {
        showJudge("GOD MODE", "SOLAR PROTOCOL");
        if (bannerSub) bannerSub.textContent = "SOLAR PROTOCOL : D•code";
      }

      // バナーは出しっぱにしない：小さく点滅させる
      // （centerBanner.show を短時間だけ）
      centerBanner.classList.add("show");
      setTimeout(() => centerBanner.classList.remove("show"), 260);

      // 神演出発動（3回目成功）
      if (successChain >= 3) {
        // 神モードを見せたあと、次のチェインに移れるよう successChain を0へ（儀式レイヤは残す）
        // → “神演出を何度も狙える”設計
        setTimeout(() => {
          // カードは全部吸収済みなので、少し待って戻す（次の儀式サイクル用）
          for (const slot of [slotCompass, slotTrigger, slotRoute]) {
            if (!slot) continue;
            // まだDOMに残ってるが透明なので、復帰させる
            slot.classList.remove("absorb");
          }
          if (arcanaTriad) {
            // いったん非表示→再表示で「儀式が再度始まる」感じ
            arcanaTriad.dataset.visible = "0";
            setTimeout(() => arcanaTriad.dataset.visible = "1", 220);
          }
          successChain = 0;
          // protocolStep は 3のまま（神気が残る）…好みで 1へ戻すならここを変更
        }, 520);
      }
    }

    if (closest <= win.perfect) {
      best.hit = true;
      combo++;

      const base = 100 + combo * 5;
      score += Math.round(base * (feverOn ? 1.5 : 1.0));

      setFever(fever + 8);

      // 演出
      if (combo % 8 === 0) spawnCard("DiCo", 1);

      onSuccess("PERFECT");

    } else if (closest <= win.good) {
      best.hit = true;
      combo++;

      const base = 50 + combo * 3;
      score += Math.round(base * (feverOn ? 1.5 : 1.0));

      setFever(fever + 5);

      onSuccess("GOOD");

    } else {
      // 空振り
      combo = 0;
      setFever(fever - 6);

      showJudge("MISS", "NO SYNC");
      if (CHAIN_RESET_ON_MISS) resetProtocolChain(true);
    }

    // FEVER突入
    if (!feverOn && fever >= 100) {
      setFever(100);
      enterFever();
      setFever(70);
    }
  }

  // =========================
  // Input
  // =========================
  function onPointerDown(e) {
    if (!primed) primeMedia();
    e.preventDefault();
    judge();
  }
  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });

  // =========================
  // Buttons
  // =========================
  startBtn.addEventListener("click", startGame);

  muteBtn.addEventListener("click", () => {
    music.muted = !music.muted;
    muteBtn.textContent = music.muted ? "UNMUTE" : "MUTE";
  });

  calibBtn.addEventListener("click", () => {
    const seq = [-30, -20, -10, 0, 10, 20, 30];
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
  // Init UI
  // =========================
  timeEl.textContent = "--";
  scoreEl.textContent = "0";
  comboEl.textContent = "0";
  setFever(0);

  // 初期：儀式UIは消しておく
  setProtocolUI(0);
  resetTriadCards();
})();
