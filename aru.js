(() => {
  'use strict';

  /* =========================
     CONFIG
  ========================= */
  const SESSION_SECONDS = 25;
  const STORAGE_KEY = 'aru_collective_v1';

  const TAU = Math.PI * 2;
  const circleRadius = 170;
  const circleLen = TAU * circleRadius;

  // SVG viewBox is 0 0 500 500
  const RING_VIEW = 500;
  const RING_CX = RING_VIEW / 2;
  const RING_CY = RING_VIEW / 2;

  /* =========================
     DOM
  ========================= */
  const $ = (id) => document.getElementById(id);

  const hud = {
    collective: $('hudCollective'),
    play: $('hudPlay'),
    time: $('hudTime'),
    combo: $('hudCombo'),
    aru: $('hudAru')
  };

  const ui = {
    dico: $('dicoLine'),
    dicoWrap: document.querySelector('.dico'),
    core: $('coreLabel'),
    coreVoid: $('coreVoid'),
    flash: $('fxFlash'),
    ringWrap: $('ringWrap'),
    gameArea: $('gameArea'),
    progress: $('progressRing'),
    zone: $('zoneRing'),
    indicator: $('indicator'),
    constellation: $('constellation'),
    rippleLayer: $('rippleLayer'),
    tapLayer: $('tapLayer'),
    missBadge: $('missBadge'),
    ringSvg: $('ringSvg')
  };

  const overlays = {
    how: $('overlayHow'),
    result: $('overlayResult'),
    unfold: $('unfold')
  };

  /* =========================
     STATE
  ========================= */
  let state;
  let stars = [];
  let rafId = 0;
  let lastTs = 0;
  let audioCtx = null;
  let collective = loadCollective();

  // input de-dup (iOS ghost click / multi-fire)
  let lastInputTs = 0;
  const INPUT_COOLDOWN_MS = 90;

  // dico toast timer
  let dicoTimer = 0;

  // first-time guide (center line hint)
  let guidedOnce = false;

  /* =========================
     STORAGE
  ========================= */
  function loadCollective() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    const seed = Math.floor(1200 + Math.random() * 2800);
    const init = { seed, contribution: 0, plays: 0 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }

  function saveCollective() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collective));
  }

  function collectivePercent() {
    const v = Math.min(100, ((collective.seed + collective.contribution * 0.9) / 6200) * 100);
    return Math.max(8, v);
  }

  /* =========================
     HELPERS
  ========================= */
  function normalizeAngle(a) {
    return (a % TAU + TAU) % TAU;
  }

  function signedDelta(a, b) {
    return ((a - b + Math.PI * 3) % TAU) - Math.PI;
  }

  function deltaAngle(a, b) {
    return Math.abs(signedDelta(a, b));
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function nowMs() {
    return performance.now();
  }

  function localPointFromEvent(e, el) {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0) - rect.left;
    const y = (e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0) - rect.top;
    return { x, y, rect };
  }

  /* =========================
     UI: DiCo (event-only)
     - requirement: show only on MISS / special events
  ========================= */
  function showDico(text, ms = 1500) {
    if (!ui.dico) return;
    ui.dico.textContent = text;

    // if .dico.show CSS exists, use it; otherwise just fade by inline
    if (ui.dicoWrap) {
      ui.dicoWrap.classList.add('show');
      clearTimeout(dicoTimer);
      dicoTimer = setTimeout(() => ui.dicoWrap.classList.remove('show'), ms);
    } else {
      ui.dico.style.opacity = '1';
      clearTimeout(dicoTimer);
      dicoTimer = setTimeout(() => (ui.dico.style.opacity = '0'), ms);
    }
  }

  // keep API name, but behavior becomes event-only
  function setDico(text, ms = 1500) {
    showDico(text, ms);
  }

  function setZoneState(kind) {
    if (!ui.ringWrap) return;
    ui.ringWrap.classList.remove('zonePerfect', 'zoneGood', 'zoneMiss');
    if (kind === 'perfect') ui.ringWrap.classList.add('zonePerfect');
    else if (kind === 'good') ui.ringWrap.classList.add('zoneGood');
    else if (kind === 'miss') ui.ringWrap.classList.add('zoneMiss');
  }

  function maybeGuide() {
    if (guidedOnce) return;
    guidedOnce = true;
    ui.ringWrap?.classList.add('ringGuideHint');
    setTimeout(() => ui.ringWrap?.classList.remove('ringGuideHint'), 2800);
  }

  /* =========================
     SVG VISUALS INJECTION
     - zone gradient, halo ring, center line
     (no HTML edits required)
  ========================= */
  function injectZoneVisuals() {
    const svg = ui.ringSvg;
    if (!svg || !ui.zone) return;

    // defs
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    // gradient for ZONE
    if (!svg.querySelector('#gradZONE')) {
      const lg = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      lg.setAttribute('id', 'gradZONE');
      lg.setAttribute('x1', '0');
      lg.setAttribute('y1', '0');
      lg.setAttribute('x2', '1');
      lg.setAttribute('y2', '1');

      const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s1.setAttribute('offset', '0%');
      s1.setAttribute('stop-color', 'rgba(156,60,255,.95)');

      const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s2.setAttribute('offset', '55%');
      s2.setAttribute('stop-color', 'rgba(0,240,255,.55)');

      const s3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s3.setAttribute('offset', '100%');
      s3.setAttribute('stop-color', 'rgba(230,201,107,.92)');

      lg.appendChild(s1);
      lg.appendChild(s2);
      lg.appendChild(s3);
      defs.appendChild(lg);
    }

    // ensure zone uses gradient stroke (CSS can override too)
    ui.zone.style.stroke = 'url(#gradZONE)';

    // halo clone (thicker, softer)
    if (!ui.zone._haloMade) {
      const halo = ui.zone.cloneNode(true);
      halo.classList.add('is-halo');
      halo.removeAttribute('id');
      ui.zone.parentNode.insertBefore(halo, ui.zone);
      ui.zone._haloMade = true;
      ui.zone._haloEl = halo;
    }

    // center line arc (short circle segment)
    if (!svg.querySelector('#zoneCenterLine')) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      line.setAttribute('id', 'zoneCenterLine');
      line.setAttribute('cx', String(RING_CX));
      line.setAttribute('cy', String(RING_CY));
      line.setAttribute('r', String(circleRadius));
      line.setAttribute('fill', 'none');
      // align with zone stroke convention
      line.setAttribute('transform', `rotate(-90 ${RING_CX} ${RING_CY})`);
      svg.appendChild(line);
    }
  }

  /* =========================
     GAME CORE
  ========================= */
  function resetState() {
    cancelAnimationFrame(rafId);
    rafId = 0;

    state = {
      running: false,
      ended: false,
      unfolding: false,

      timeLeft: SESSION_SECONDS,
      aru: 0,
      combo: 0,
      score: 0,

      perfect: 0,
      good: 0,
      miss: 0,

      playCount: (state?.playCount || 0),

      baseSpeed: 1.55,
      angle: Math.random() * TAU,

      zoneCenter: Math.random() * TAU,
      zoneWidth: Math.PI / 7,

      freezeUntil: 0
    };

    // visuals injection once (safe to call repeatedly)
    injectZoneVisuals();

    updateZone();
    updateProgress();
    updateIndicator(0);

    hud.time.textContent = `${SESSION_SECONDS.toFixed(1)}s`;
    hud.combo.textContent = '0';
    hud.aru.textContent = '0%';

    ui.core.innerHTML = 'AWAITING<br>INPUT';
    // requirement: do NOT show dico always
    // (no setDico here)
    drawConstellation(0.08);

    ui.coreVoid.classList.remove('coreGlowGood', 'coreGlowPerfect');
    ui.ringWrap.classList.remove('freeze', 'shake');
    setZoneState(null);
  }

  function startGame() {
    closeOverlays();
    resetState();

    state.running = true;
    state.playCount += 1;

    hud.play.textContent = String(collective.plays + 1);

    enableAudio();
    ui.gameArea?.focus?.();

    const t = performance.now();
    lastTs = t;
    loop(t);
  }

  function loop(ts) {
    if (!state.running) return;

    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    if (ts < state.freezeUntil) {
      rafId = requestAnimationFrame(loop);
      return;
    }

    state.timeLeft -= dt;

    updateIndicator(dt);
    hud.time.textContent = `${Math.max(0, state.timeLeft).toFixed(1)}s`;

    animateStars(dt);

    if (state.timeLeft <= 0) {
      finishSession(false);
      return;
    }

    rafId = requestAnimationFrame(loop);
  }

  /* =========================
     RING / ZONE / INDICATOR
  ========================= */
  function updateZone() {
    // zone start angle (0..2π)
    const start = normalizeAngle(state.zoneCenter - state.zoneWidth / 2);

    // length of arc
    const zoneLen = circleLen * (state.zoneWidth / TAU);

    // dash offset (12 o'clock aligned)
    const offset = (circleLen * 0.25) - (circleLen * (start / TAU));

    ui.zone.style.strokeDasharray = `${zoneLen} ${circleLen - zoneLen}`;
    ui.zone.style.strokeDashoffset = `${offset}`;

    // halo mirrors dash
    if (ui.zone._haloEl) {
      ui.zone._haloEl.style.strokeDasharray = ui.zone.style.strokeDasharray;
      ui.zone._haloEl.style.strokeDashoffset = ui.zone.style.strokeDashoffset;
    }

    // center line: tiny arc at exact center (shows "aim here")
    const line = ui.ringSvg?.querySelector('#zoneCenterLine');
    if (line) {
      const centerWidth = Math.PI / 45; // short arc
      const centerStart = normalizeAngle(state.zoneCenter - centerWidth / 2);
      const centerLen = circleLen * (centerWidth / TAU);
      const centerOffset = (circleLen * 0.25) - (circleLen * (centerStart / TAU));
      line.style.strokeDasharray = `${centerLen} ${circleLen - centerLen}`;
      line.style.strokeDashoffset = `${centerOffset}`;
    }
  }

  function updateProgress() {
    const pct = clamp(state.aru, 0, 100);
    const fill = circleLen * (pct / 100);

    ui.progress.style.strokeDasharray = `${fill} ${circleLen - fill}`;
    ui.progress.style.strokeDashoffset = `${circleLen * 0.25}`;
    hud.aru.textContent = `${pct.toFixed(0)}%`;

    const t = pct / 100;
    const glow = t < 0.4 ? 'rgba(0,240,255,.42)' : 'rgba(230,201,107,.52)';
    ui.ringWrap.style.filter = `drop-shadow(0 0 ${16 + t * 24}px ${glow})`;

    drawConstellation(0.08 + t * 0.45);
  }

  function updateIndicator(dt) {
    const speedBoost = Math.min(1.25, state.combo * 0.05);
    const speed = state.baseSpeed + speedBoost;

    state.angle = (state.angle + speed * dt) % TAU;

    // Our 0 angle = 12 o'clock, clockwise
    const x = RING_CX + Math.cos(state.angle - Math.PI / 2) * circleRadius;
    const y = RING_CY + Math.sin(state.angle - Math.PI / 2) * circleRadius;

    ui.indicator.setAttribute('cx', x.toFixed(2));
    ui.indicator.setAttribute('cy', y.toFixed(2));
  }

  function moveZone() {
    let next;
    do {
      next = Math.random() * TAU;
    } while (deltaAngle(next, state.zoneCenter) < Math.PI / 5);

    state.zoneCenter = next;

    // zone narrows slightly with combo (good stays wide, perfect is center line)
    state.zoneWidth = Math.max(Math.PI / 9.2, Math.PI / 7.2 - Math.min(0.2, state.combo * 0.006));

    updateZone();
  }

  /* =========================
     FX: RIPPLE / SPARK / IGNITE / CORE GLOW
  ========================= */
  function spawnRipple(x, y, type = 'good') {
    const el = document.createElement('div');
    el.className = `ripple ${type}`;
    el.style.setProperty('--x', `${x}px`);
    el.style.setProperty('--y', `${y}px`);
    ui.rippleLayer.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function spawnSparks(x, y) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      s.style.setProperty('--x', `${x}px`);
      s.style.setProperty('--y', `${y}px`);
      const ang = Math.random() * TAU;
      const dist = 30 + Math.random() * 55;
      s.style.setProperty('--dx', `${(Math.cos(ang) * dist).toFixed(1)}px`);
      s.style.setProperty('--dy', `${(Math.sin(ang) * dist).toFixed(1)}px`);
      ui.rippleLayer.appendChild(s);
      s.addEventListener('animationend', () => s.remove(), { once: true });
    }
  }

  function spawnMissNoise() {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const line = document.createElement('div');
      line.className = 'ringNoiseLine';
      line.style.setProperty('--rot', `${Math.random() * 360}deg`);
      ui.rippleLayer.appendChild(line);
      line.addEventListener('animationend', () => line.remove(), { once: true });
    }
  }

  function showMissBadge() {
    if (!ui.missBadge) return;
    ui.missBadge.classList.remove('show');
    void ui.missBadge.offsetWidth;
    ui.missBadge.classList.add('show');
    setTimeout(() => ui.missBadge.classList.remove('show'), 360);
  }

  // NOTE: zone visual is now CSS/gradient-driven. We only add state classes.
  function coreGlow(kind = 'good') {
    ui.coreVoid.classList.remove('coreGlowGood', 'coreGlowPerfect');

    if (kind === 'perfect') {
      ui.coreVoid.classList.add('coreGlowPerfect');
      setTimeout(() => ui.coreVoid.classList.remove('coreGlowPerfect'), 220);
      return;
    }

    ui.coreVoid.classList.add('coreGlowGood');
    setTimeout(() => ui.coreVoid.classList.remove('coreGlowGood'), 170);
  }

  /* =========================
     JUDGE
  ========================= */
  function judgeTap(localX, localY) {
    if (!state.running || state.ended || state.unfolding) return;

    enableAudio();

    const isCompact = window.matchMedia('(max-width: 760px)').matches;
    const halfZone = state.zoneWidth / 2;

    // state.angle and zoneCenter share same convention (0=12 o'clock clockwise)
    const d = deltaAngle(normalizeAngle(state.angle), normalizeAngle(state.zoneCenter));

    // PERFECT is center-biased (narrow), GOOD is band (wider)
    const perfectWin = halfZone * (isCompact ? 0.62 : 0.52);
    const goodWin = halfZone * (isCompact ? 1.2 : 1.05);

    if (d <= perfectWin) {
      const gain = 15 + Math.min(10, state.combo * 0.4);
      state.aru = Math.min(100, state.aru + gain);
      state.score += 180 + state.combo * 18;
      state.perfect++;
      state.combo++;

      setZoneState('perfect');
      perfectFx();
      spawnRipple(localX, localY, 'perfect');
      spawnSparks(localX, localY);
      coreGlow('perfect');

      // requirement: no constant speech; success speech optional -> keep OFF
      ui.core.innerHTML = 'PERFECT<br>RESONANCE';
      moveZone();
      maybeGuide();
    } else if (d <= goodWin) {
      state.aru = Math.min(100, state.aru + 10);
      state.score += 100 + state.combo * 8;
      state.good++;
      state.combo++;

      setZoneState('good');
      goodFx();
      spawnRipple(localX, localY, 'good');
      coreGlow('good');

      // requirement: no constant speech; success speech optional -> keep OFF
      ui.core.innerHTML = 'GOOD<br>SYNC';
      moveZone();
      maybeGuide();
    } else {
      state.aru = Math.max(0, state.aru - 2);
      state.score = Math.max(0, state.score - 10);
      state.miss++;
      state.combo = 0;

      setZoneState('miss');
      missFx();
      spawnRipple(localX, localY, 'miss');
      spawnMissNoise();
      showMissBadge();

      ui.ringWrap.classList.remove('shake');
      void ui.ringWrap.offsetWidth;
      ui.ringWrap.classList.add('shake');

      ui.coreVoid.classList.remove('coreGlowGood', 'coreGlowPerfect');

      // requirement: MISS only + auto hide
      setDico('ノイズ混入。中心線を狙って。', 1600);
      ui.core.innerHTML = 'NOISE<br>DETECTED';
    }

    hud.combo.textContent = String(state.combo);
    updateProgress();

    if (state.aru >= 100) triggerUnfold();
  }

  /* =========================
     RESULT / UNFOLD
  ========================= */
  function weightedCard(acc) {
    const pools = [
      { name: 'THE STAR',  m: '希望は静かに強い。観測はもう味方だ。', step: '今日の一歩：3分だけ、未来が叶った後の呼吸を想像する。', w: acc * 1.4 },
      { name: 'THE SUN',   m: '迷いは光で輪郭を持つ。進行は正しい。', step: '今日の一歩：ひとつだけ即行動。完璧より着手。', w: acc * 1.1 },
      { name: 'THE WORLD', m: '断片が繋がる予兆。完成へ座標が揃う。', step: '今日の一歩：終わらせたい事を1行で宣言する。', w: acc },
      { name: 'THE MOON',  m: '揺らぎは悪ではない。深層のサインだ。', step: '今日の一歩：不安の名前を書き、1つだけ分解する。', w: (1 - acc) * 0.9 + 0.15 },
      { name: 'THE TOWER', m: '崩壊は再配置。今は更新の痛み。',       step: '今日の一歩：不要なタスクを1つ捨てる。', w: (1 - acc) * 1.1 + 0.1 },
      { name: 'THE DEVIL', m: '執着が視界を狭める。鎖はもう見えている。', step: '今日の一歩：惰性ループを1回だけ中断する。', w: (1 - acc) * 1.25 + 0.08 }
    ];
    let total = pools.reduce((s, c) => s + c.w, 0);
    let roll = Math.random() * total;
    for (const c of pools) {
      roll -= c.w;
      if (roll <= 0) return c;
    }
    return pools[0];
  }

  function finishSession(unfolded = false) {
    if (state.ended) return;

    state.running = false;
    state.ended = true;
    cancelAnimationFrame(rafId);

    const totalHit = state.perfect + state.good + state.miss;
    const acc = totalHit ? (state.perfect * 1 + state.good * 0.65) / totalHit : 0;
    const contribution = Math.max(1, Math.round(state.score / 120 + state.perfect * 2 + state.good));

    collective.contribution += contribution;
    collective.plays += 1;
    saveCollective();

    const card = weightedCard(acc);

    $('rScore').textContent = Math.round(state.score).toLocaleString();
    $('rAcc').textContent = `${(acc * 100).toFixed(1)}%`;
    $('rPGM').textContent = `${state.perfect} / ${state.good} / ${state.miss}`;
    $('rContrib').textContent = `+${contribution} (Collective ARU)`;
    $('rCollective').textContent = `${collectivePercent().toFixed(1)}%`;

    $('rCard').textContent = card.name;
    $('rCardInner').textContent = card.name.replace('THE ', '');
    $('rMsg').textContent = card.m;
    $('rStep').textContent = card.step;

    $('rDico').textContent = unfolded
      ? 'DiCo:《ARU、記録。…セレフィーズ、繋がってる。》'
      : 'DiCo:《上げ方、分かったでしょ。もう一回、いこう。》';

    hud.collective.textContent = `${collectivePercent().toFixed(1)}%`;
    hud.play.textContent = String(collective.plays);

    overlays.result.classList.add('show');
  }

  function triggerUnfold() {
    if (state.unfolding) return;

    state.unfolding = true;
    // requirement: event-only is OK (unfold is an event)
    setDico('観測値を超えた。開くよ、しーちゃん', 1400);

    setZoneState('perfect');
    ui.core.innerHTML = 'UNFOLD<br>READY';

    unfoldFx();
    overlays.unfold.classList.add('show');

    setTimeout(() => {
      overlays.unfold.classList.remove('show');
      finishSession(true);
    }, 1000);
  }

  /* =========================
     UI Helpers
  ========================= */
  function closeOverlays() {
    overlays.how.classList.remove('show');
    overlays.result.classList.remove('show');
  }

  /* =========================
     INPUT (single source)
  ========================= */
  function handlePointerDown(e) {
    const t = nowMs();
    if (t - lastInputTs < INPUT_COOLDOWN_MS) return;
    lastInputTs = t;

    const target = e.target;
    if (target && (target.closest('button') || target.closest('a') || target.closest('.panel'))) return;

    e.preventDefault();
    e.stopPropagation();

    const { x, y } = localPointFromEvent(e, ui.tapLayer);

    if (!state.running && !state.ended && !state.unfolding) {
      startGame();
      spawnRipple(x, y, 'good');
      maybeGuide(); // first-time: visually emphasize center line, no text spam
      return;
    }

    judgeTap(x, y);
  }

  /* =========================
     STARS (Canvas)
  ========================= */
  const canvas = $('starfield');
  const c2d = canvas.getContext('2d', { alpha: true });

  function resizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
  }

  function initStars() {
    const n = Math.floor((innerWidth * innerHeight) / 18000);
    stars = Array.from({ length: Math.max(40, Math.min(120, n)) }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.7 + 0.3,
      a: Math.random() * 0.8 + 0.2,
      v: (Math.random() * 0.15 + 0.02)
    }));
    drawStars();
  }

  function drawStars(boost = 0) {
    c2d.clearRect(0, 0, innerWidth, innerHeight);

    const grad = c2d.createRadialGradient(innerWidth * 0.5, innerHeight * 0.45, 10, innerWidth * 0.5, innerHeight * 0.45, innerWidth * 0.7);
    grad.addColorStop(0, 'rgba(24,30,52,.18)');
    grad.addColorStop(1, 'rgba(0,0,0,.0)');
    c2d.fillStyle = grad;
    c2d.fillRect(0, 0, innerWidth, innerHeight);

    for (const s of stars) {
      c2d.fillStyle = `rgba(210,240,255,${Math.min(1, s.a + boost * 0.35)})`;
      c2d.beginPath();
      c2d.arc(s.x, s.y, s.r + boost * 0.9, 0, TAU);
      c2d.fill();
    }
  }

  function animateStars(dt) {
    const boost = state ? state.aru / 100 : 0;
    for (const s of stars) {
      s.y -= s.v * (1 + boost * 1.2);
      if (s.y < -4) {
        s.y = innerHeight + 4;
        s.x = Math.random() * innerWidth;
      }
    }
    drawStars(boost * 0.35);
  }

  function drawConstellation(intensity = 0.1) {
    const svg = ui.constellation;
    svg.innerHTML = '';

    const points = 8 + Math.floor(intensity * 12);
    const pts = Array.from({ length: points }, () => ({ x: 90 + Math.random() * 320, y: 90 + Math.random() * 320 }));

    for (let i = 0; i < pts.length - 1; i++) {
      if (Math.random() > intensity * 0.9) continue;

      const p1 = pts[i];
      const p2 = pts[(i + 1 + Math.floor(Math.random() * 2)) % pts.length];

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
      line.setAttribute('stroke', `rgba(0,240,255,${0.07 + intensity * 0.35})`);
      line.setAttribute('stroke-width', 1);
      svg.appendChild(line);
    }

    pts.forEach(p => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
      c.setAttribute('r', 1.2 + intensity * 1.4);
      c.setAttribute('fill', `rgba(230,201,107,${0.15 + intensity * 0.4})`);
      svg.appendChild(c);
    });
  }

  /* =========================
     AUDIO
  ========================= */
  function enableAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function envGain(g, now, a = 0.005, d = 0.18, peak = 0.25) {
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + a);
    g.gain.exponentialRampToValueAtTime(0.0001, now + d);
  }

  function tone(freq, dur = 0.2, type = 'sine', vol = 0.2, when = 0) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime + when;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    o.connect(g);
    g.connect(audioCtx.destination);
    envGain(g, now, 0.004, dur, vol);
    o.start(now);
    o.stop(now + dur + 0.05);
  }

  function noise(dur = 0.1, vol = 0.08) {
    if (!audioCtx) return;

    const len = Math.floor(audioCtx.sampleRate * dur);
    const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / len * 6);
    }

    const src = audioCtx.createBufferSource();
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1200;

    const g = audioCtx.createGain();
    g.gain.value = vol;

    src.buffer = buffer;
    src.connect(hp);
    hp.connect(g);
    g.connect(audioCtx.destination);
    src.start();
  }

  function goodFx() {
    tone(660, 0.13, 'triangle', 0.12);
    tone(990, 0.11, 'sine', 0.08, 0.04);
  }

  function perfectFx() {
    const t = performance.now();
    state.freezeUntil = t + 170;

    ui.ringWrap.classList.remove('freeze', 'shake');
    void ui.ringWrap.offsetWidth;
    ui.ringWrap.classList.add('freeze', 'shake');

    ui.flash.style.opacity = '.95';
    setTimeout(() => ui.flash.style.opacity = '0', 120);

    tone(120, 0.26, 'sine', 0.24, 0.07);
    tone(920, 0.18, 'triangle', 0.12, 0.14);
    tone(1320, 0.2, 'sine', 0.1, 0.21);
  }

  function missFx() {
    noise(0.11, 0.1);
    tone(165, 0.11, 'sawtooth', 0.07);
    tone(96, 0.16, 'triangle', 0.055, 0.03);
  }

  function unfoldFx() {
    tone(70, 0.48, 'sine', 0.34, 0.08);
  }

  /* =========================
     SHARE / TOAST
  ========================= */
  function showToast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1400);
  }

  async function shareResult() {
    const txt = `ARU ${hud.aru.textContent} / Score ${$('rScore').textContent} / ${$('rCard').textContent}\n星界干渉システム ARU をプレイ中`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ARU Result', text: txt, url: location.href });
      } else {
        await navigator.clipboard.writeText(`${txt}\n${location.href}`);
        alert('結果テキストをコピーしました');
      }
    } catch {
      showToast('Share cancelled');
    }
  }

  /* =========================
     EVENTS
  ========================= */
  $('btnStart')?.addEventListener('click', startGame);
  $('btnHow')?.addEventListener('click', () => overlays.how.classList.add('show'));
  $('btnReset')?.addEventListener('click', () => { resetState(); closeOverlays(); });
  $('btnRetry')?.addEventListener('click', startGame);
  $('btnShare')?.addEventListener('click', shareResult);

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => $(btn.dataset.close)?.classList.remove('show'));
  });

  ui.tapLayer.addEventListener('pointerdown', handlePointerDown, { passive: false });

  ui.gameArea?.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!state.running && !state.ended && !state.unfolding) startGame();
      else judgeTap(ui.tapLayer.clientWidth * 0.5, ui.tapLayer.clientHeight * 0.6);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement !== ui.gameArea) {
      e.preventDefault();
      if (!state.running && !state.ended && !state.unfolding) startGame();
      else judgeTap(ui.tapLayer.clientWidth * 0.5, ui.tapLayer.clientHeight * 0.6);
    }
    if (e.key === 'Escape') {
      closeOverlays();
      overlays.unfold.classList.remove('show');
    }
  });

  window.addEventListener('resize', resizeCanvas);

  /* =========================
     INIT
  ========================= */
  resizeCanvas();
  resetState();

  hud.collective.textContent = `${collectivePercent().toFixed(1)}%`;
  hud.play.textContent = String(collective.plays);

  // idle animation
  (function idle(ts) {
    if (state.running) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    updateIndicator(dt * 0.6);
    animateStars(dt * 0.4);
    requestAnimationFrame(idle);
  })(performance.now());

})();
