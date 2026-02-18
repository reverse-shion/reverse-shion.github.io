(() => {
  'use strict';

  const music = document.getElementById('music');
  const video = document.getElementById('bgVideo');
  const canvas = document.getElementById('noteCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  const scoreEl = document.getElementById('score');
  const comboEl = document.getElementById('combo');
  const timeEl  = document.getElementById('time');
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const muteBtn  = document.getElementById('muteBtn');

  const centerLabel = document.getElementById('centerLabel');
  const ringFlash = document.getElementById('ringFlash');

  const tarotOverlay = document.getElementById('tarotOverlay');
  const toast = document.getElementById('toast');

  // ===== iOS Safari: 100vh対策 =====
  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', setVH, { passive: true });
  setVH();

  // ===== ゲーム設定（ここだけ触れば調整できる） =====
  const SESSION_SECONDS = 30;        // セッション長（おすすめ：25〜35）
  const BPM = 128;                  // ざっくり（後で譜面に合わせてOK）
  const BEAT = 60 / BPM;

  const NOTE_RADIUS = 10;
  const RING_R = 170;               // 500 viewBox の170に揃える
  const VIEW = 500;
  const CX = VIEW / 2;
  const CY = VIEW / 2;

  // 判定ラインは「6時」固定（ゲーム角：π）
  // GAME角：0=12時、時計回り
  const JUDGE_ANGLE = Math.PI;

  // ノーツはリング上を回る（判定ラインで叩く）
  // ノーツが判定ラインに到達するまでの時間（見えてから叩ける余裕）
  const LEAD_TIME = 1.4; // 秒（1.2〜1.8で気持ちよさ調整）

  // 判定幅（秒）
  const WIN_PERFECT = 0.075;
  const WIN_GOOD    = 0.140;
  const WIN_MISS    = 0.220;

  // 演出ゲージ（タロット展開用）
  let fever = 0; // 0..100

  // ===== 状態 =====
  let running = false;
  let startAt = 0;
  let score = 0;
  let combo = 0;
  let notes = [];
  let rafId = 0;
  let muted = false;

  function showToast(msg, ms=1200){
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), ms);
  }

  function mmss(t){
    const s = Math.max(0, Math.floor(t));
    const m = Math.floor(s/60);
    const r = s%60;
    return `${m}:${String(r).padStart(2,'0')}`;
  }

  // ===== 譜面：まずは均等配置（後で手打ち譜面に置き換え可） =====
  function createNotes() {
    notes = [];
    // 4分音符中心 + たまに8分
    for (let t = 0.8; t < SESSION_SECONDS; t += BEAT) {
      const density = (t > 10 && t < 20) ? 0.55 : 0.35;
      if (Math.random() < density) notes.push({ time: t, hit: false });

      // たまに追い打ち（8分）
      if (Math.random() < 0.18) notes.push({ time: t + BEAT/2, hit: false });
    }
    notes.sort((a,b)=>a.time-b.time);
  }

  // ===== iOS対策：ユーザー操作の中で play を確実に通す =====
  async function safePlay(el){
    try { await el.play(); } catch {}
  }

  function reset() {
    cancelAnimationFrame(rafId);
    rafId = 0;
    running = false;

    score = 0;
    combo = 0;
    fever = 0;

    scoreEl.textContent = '0';
    comboEl.textContent = '0';
    timeEl.textContent = mmss(SESSION_SECONDS);

    centerLabel.innerHTML = 'TAP<br><span class="sub">DiCo is dancing…</span>';
  }

  function startGame() {
    reset();
    createNotes();

    running = true;
    startAt = performance.now();

    // 重要：iOSは「ボタン操作内」で再生を起動する
    music.currentTime = 0;
    video.currentTime = 0;

    music.muted = muted;
    video.muted = true; // 背景は常にミュートでOK（音はmusic側）
    video.playsInline = true;

    safePlay(video);
    safePlay(music);

    centerLabel.innerHTML = 'READY<br><span class="sub">Hit on the golden bar</span>';

    loop();
  }

  // ===== リング座標変換（GAME角→画面座標） =====
  function ringPoint(gameAngle, ringCenterPx, ringRadiusPx){
    // gameAngle: 0=12時, cw
    const x = ringCenterPx.x + Math.cos(gameAngle - Math.PI/2) * ringRadiusPx;
    const y = ringCenterPx.y + Math.sin(gameAngle - Math.PI/2) * ringRadiusPx;
    return {x,y};
  }

  function getRingPx() {
    // 画面中央にリングがある前提（CSSのstage配置）
    // より安全にしたければ ringWrap のgetBoundingClientRectから中心を出す
    const ringWrap = document.querySelector('.ringWrap');
    const rect = ringWrap.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const r  = Math.min(rect.width, rect.height) * 0.5 * (170/250); // viewBox比率ざっくり
    return { center:{x:cx,y:cy}, r };
  }

  // ===== 描画 =====
  function flash(kind){
    // SVG側のリングフラッシュを軽く光らせる
    ringFlash.style.stroke = kind === 'perfect'
      ? 'rgba(230,201,107,.75)'
      : 'rgba(0,240,255,.55)';
    ringFlash.style.strokeDasharray = '40 20';
    ringFlash.style.animation = 'none';
    // reflow
    void ringFlash.getBoundingClientRect();
    ringFlash.style.animation = 'rf 240ms ease-out';
  }

  // inject keyframes once
  (function injectRF(){
    const s = document.createElement('style');
    s.textContent = `
      @keyframes rf{
        from{ stroke-opacity: .0; }
        40%{ stroke-opacity: 1; }
        to{ stroke-opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  })();

  function draw(time) {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const { center, r } = getRingPx();

    // 判定ライン位置（6時）に軽くグロー
    const jp = ringPoint(JUDGE_ANGLE, center, r);
    const g = ctx.createRadialGradient(jp.x, jp.y, 2, jp.x, jp.y, 26);
    g.addColorStop(0, 'rgba(230,201,107,.35)');
    g.addColorStop(1, 'rgba(230,201,107,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(jp.x, jp.y, 24, 0, Math.PI*2);
    ctx.fill();

    // ノーツ描画（リング上を回る）
    for (const n of notes) {
      if (n.hit) continue;

      const diff = n.time - time;

      // 既に通過 → 自動MISS
      if (diff < -WIN_MISS) {
        n.hit = true;
        combo = 0;
        continue;
      }

      // 表示タイミング外は描かない
      if (diff > LEAD_TIME) continue;

      // diff=LEAD_TIME のとき 反対側、diff=0 で判定ライン
      // 角度を補間
      const t = 1 - (diff / LEAD_TIME); // 0..1
      const angle = JUDGE_ANGLE + (1 - t) * Math.PI * 2; // 1周して近づく
      const p = ringPoint(angle, center, r);

      // 視認性（近づくほど明るい）
      const a = Math.min(1, 0.25 + t*0.9);
      ctx.fillStyle = `rgba(0,240,255,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, NOTE_RADIUS + t*3, 0, Math.PI*2);
      ctx.fill();

      // コア（白）
      ctx.fillStyle = `rgba(255,255,255,${0.25 + t*0.7})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2 + t*1.6, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // ===== 判定 =====
  function judge() {
    if (!running) return;

    const time = music.currentTime;

    // 一番近い未ヒットノーツを探す（時間ベース判定）
    let best = null;
    let bestDiff = 999;

    for (const n of notes) {
      if (n.hit) continue;
      const d = Math.abs(n.time - time);
      if (d < bestDiff) { bestDiff = d; best = n; }
    }
    if (!best) return;

    if (bestDiff <= WIN_PERFECT) {
      best.hit = true;
      combo++;
      score += 120 + combo*6;
      fever = Math.min(100, fever + 10);
      flash('perfect');
      centerLabel.innerHTML = 'PERFECT<br><span class="sub">sync</span>';
    } else if (bestDiff <= WIN_GOOD) {
      best.hit = true;
      combo++;
      score += 70 + combo*4;
      fever = Math.min(100, fever + 6);
      flash('good');
      centerLabel.innerHTML = 'GOOD<br><span class="sub">keep going</span>';
    } else if (bestDiff <= WIN_MISS) {
      // 近いけど外した（軽めのペナルティ）
      combo = 0;
      fever = Math.max(0, fever - 8);
      centerLabel.innerHTML = 'MISS<br><span class="sub">noise</span>';
    } else {
      // 完全に外し
      combo = 0;
      fever = Math.max(0, fever - 10);
      centerLabel.innerHTML = 'MISS<br><span class="sub">noise</span>';
    }

    scoreEl.textContent = String(score);
    comboEl.textContent = String(combo);

    // フィーバー満タン → タロット展開（中央から広がる）
    if (fever >= 100) {
      fever = 0;
      tarotBurst();
    }
  }

  function tarotBurst(){
    tarotOverlay.classList.add('show');
    showToast('DiCo:「タロット展開」', 1100);
    setTimeout(()=>tarotOverlay.classList.remove('show'), 900);
  }

  // ===== ループ =====
  function loop() {
    if (!running) return;

    const time = music.currentTime;
    const left = Math.max(0, SESSION_SECONDS - time);
    timeEl.textContent = mmss(left);

    draw(time);

    if (time >= SESSION_SECONDS || music.ended) {
      finish();
      return;
    }

    rafId = requestAnimationFrame(loop);
  }

  function finish(){
    running = false;
    cancelAnimationFrame(rafId);

    // 再生停止
    try { music.pause(); } catch {}
    // videoは回してもOKだが止めたいなら pause
    // try { video.pause(); } catch {}

    centerLabel.innerHTML = 'RESULT<br><span class="sub">Score saved</span>';
    showToast(`RESULT Score: ${score}`, 1600);
  }

  // ===== 入力 =====
  function onTap(e){
    e.preventDefault();
    judge();
  }
  canvas.addEventListener('pointerdown', onTap, { passive:false });

  // ===== ボタン =====
  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);

  muteBtn.addEventListener('click', () => {
    muted = !muted;
    music.muted = muted;
    muteBtn.textContent = muted ? 'UNMUTE' : 'MUTE';
    showToast(muted ? 'Muted' : 'Unmuted');
  });

  // 初期
  reset();
})();
