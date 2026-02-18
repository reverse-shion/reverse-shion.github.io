(() => {
  'use strict';

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
  const bannerBig = document.getElementById("bannerBig");
  const bannerSmall = document.getElementById("bannerSmall");

  // ===== ゲーム設定 =====
  const HIT_Y_RATIO = 0.82;        // 6時固定（画面下寄り）
  const NOTE_SPEED  = 520;         // px/sec（体感を作る）
  const NOTE_RADIUS = 12;

  const FEVER_DURATION = 6.0;      // ✅確定
  const FEVER_MAX = 100;

  // 判定（秒）
  const JUDGE_NORMAL = { perfect: 0.075, good: 0.140 };
  const JUDGE_FEVER  = { perfect: 0.065, good: 0.120 };

  // ===== 状態 =====
  let notes = [];
  let score = 0;
  let combo = 0;
  let running = false;

  let duration = 60;               // mp3が読めたら自動で上書き
  let startAtPerf = 0;

  // fever
  let fever = 0;
  let feverOn = false;
  let feverUntil = 0;

  // iPhoneの「押したのに動かない」対策：最初のユーザー操作で再生許可
  let primed = false;

  // timing offset（微調整用：CALIBで変えられる）
  let offsetMs = 0;

  // ====== Utility ======
  const now = () => performance.now();
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function setVh() {
    // iOS Safari 100vh崩れ対策
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

  // ====== オーディオ・ビデオ再生（iOS対策） ======
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

    // iOSは video は muted + playsinline が最強
    video.muted = true;
    video.playsInline = true;

    // ここで一瞬だけ play → pause して “許可” を取る（端末によって効く）
    await safePlay(video);
    video.pause();
    video.currentTime = 0;

    await safePlay(music);
    music.pause();
    music.currentTime = 0;

    return true;
  }

  // ====== ノーツ生成（audio duration 기반） ======
  function createNotes() {
    notes = [];

    // BPM知らない前提：程よく密度で中毒化（0.5〜0.7秒）
    // セッションで体感が気持ちいい密度にする
    const step = 0.58;

    // 最初の数秒は優しめ（導入）
    const intro = 1.0;

    for (let t = intro; t < duration; t += step) {
      notes.push({ time: t, hit: false });
    }
  }

  // ====== 中央から広がるカード ======
  function spawnCard(title, power = 1) {
    // power: 1=通常, 2=派手
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

    // reflow -> animation
    void el.offsetWidth;
    el.classList.add('play');

    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function tarotBurst(kind = "NORMAL") {
    // 「画面中央から広がる」確定演出
    if (kind === "FEVER") {
      spawnCard("COMPASS", 2);
      spawnCard("TRIGGER", 2);
      spawnCard("ROUTE", 2);
      spawnCard("DiCo", 2);
    } else {
      spawnCard("COMPASS", 1);
    }
  }

  // ====== バナー ======
  let bannerTimer = 0;
  function showBanner(big, small, ms = 900) {
    bannerBig.textContent = big;
    bannerSmall.textContent = small;
    centerBanner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => centerBanner.classList.remove('show'), ms);
  }

  // ====== Fever ======
  function setFever(v) {
    fever = clamp(v, 0, FEVER_MAX);
    feverFill.style.width = `${fever.toFixed(0)}%`;
    feverText.textContent = `${fever.toFixed(0)}%`;
  }

  function enterFever() {
    feverOn = true;
    feverUntil = music.currentTime + FEVER_DURATION;
    document.body.classList.add('feverOn');

    showBanner("タロット展開", "COMPASS / TRIGGER / ROUTE", 1100);
    tarotBurst("FEVER");
  }

  function exitFever() {
    feverOn = false;
    document.body.classList.remove('feverOn');
  }

  // ====== Start / Stop ======
  async function startGame() {
    await primeMedia();

    // duration を audio metadata から取る（取れない時は60）
    duration = Number.isFinite(music.duration) && music.duration > 5 ? music.duration : 60;

    score = 0;
    combo = 0;
    setFever(0);
    exitFever();
    createNotes();

    running = true;

    // 同期（できる限り合わせる）
    music.currentTime = 0;
    video.currentTime = 0;

    // iOSでのズレ軽減：videoはループでOK（ダンス背景）
    await safePlay(video);
    await safePlay(music);

    startAtPerf = now();

    loop();
  }

  function endGame() {
    running = false;
    music.pause();
    // video は流し続けてもいいが、ここでは止める
    video.pause();
    alert(`RESULT\nScore: ${score}`);
  }

  // ====== 描画 ======
  function drawTarget() {
    const cx = canvas.clientWidth / 2;
    const hitY = canvas.clientHeight * HIT_Y_RATIO;

    // 6時のターゲットを派手に（円＋グロー）
    ctx.save();
    ctx.globalAlpha = 0.9;

    // outer glow
    ctx.beginPath();
    ctx.arc(cx, hitY, 26, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,240,255,0.08)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, hitY, 18, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,240,255,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, hitY, 6, 0, Math.PI * 2);
    ctx.fillStyle = feverOn ? "rgba(230,201,107,0.9)" : "rgba(0,240,255,0.9)";
    ctx.fill();

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

    drawTarget();

    // notes
    for (const note of notes) {
      if (note.hit) continue;

      const diff = note.time - t;              // +:まだ / -:過ぎた
      const y = hitY - diff * NOTE_SPEED;      // 時間差を距離に変換（下へ流れる）

      // 画面外は描かない
      if (y < -40 || y > canvas.clientHeight + 40) continue;

      // 通過MISS
      if (diff < -JUDGE_NORMAL.good) {
        note.hit = true;
        combo = 0;
        // ミスはペナルティ軽めに（またやりたくなる）
        setFever(fever - 10);
        continue;
      }

      // 描画（フィーバー中は金）
      ctx.beginPath();
      ctx.arc(cx, y, NOTE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = feverOn ? "rgba(230,201,107,0.92)" : "rgba(0,240,255,0.88)";
      ctx.fill();

      // halo
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

  // ====== 判定 ======
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

    if (closest <= win.perfect) {
      best.hit = true;
      combo++;

      // スコア（フィーバーは×1.5）
      const base = 100 + combo * 5;
      score += Math.round(base * (feverOn ? 1.5 : 1.0));

      // FEVERゲージ
      setFever(fever + 8);

      // 演出（小さく気持ちいい）
      if (combo % 8 === 0) spawnCard("DiCo", 1);

    } else if (closest <= win.good) {
      best.hit = true;
      combo++;

      const base = 50 + combo * 3;
      score += Math.round(base * (feverOn ? 1.5 : 1.0));

      setFever(fever + 5);

    } else {
      // 空振りは軽め
      combo = 0;
      setFever(fever - 6);
    }

    // FEVER突入
    if (!feverOn && fever >= 100) {
      setFever(100);
      enterFever();
      // フィーバー開始時に少し消費して、連発しすぎないように
      setFever(70);
    }
  }

  // ====== 入力（iOS向け：pointerで統一） ======
  function onPointerDown(e) {
    // 初回タップでメディア許可を取る
    if (!primed) primeMedia();

    // スクロール抑止
    e.preventDefault();
    judge();
  }

  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });

  // ====== ボタン ======
  startBtn.addEventListener("click", startGame);

  muteBtn.addEventListener("click", () => {
    music.muted = !music.muted;
    muteBtn.textContent = music.muted ? "UNMUTE" : "MUTE";
  });

  // CALIB：判定がズレる端末向けに“手動微調整”できる保険
  // 押すたびに +10ms → +20ms … → -30ms までループ
  calibBtn.addEventListener("click", () => {
    const seq = [-30, -20, -10, 0, 10, 20, 30];
    const idx = seq.indexOf(offsetMs);
    offsetMs = seq[(idx + 1) % seq.length];
    showBanner(`CALIB ${offsetMs}ms`, "体感が合う所に合わせてOK", 700);
  });

  // ====== メタデータ読み込みでduration更新 ======
  music.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(music.duration) && music.duration > 5) duration = music.duration;
  });

  // 初期表示
  timeEl.textContent = "--";
  scoreEl.textContent = "0";
  comboEl.textContent = "0";
  setFever(0);
})();
