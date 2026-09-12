(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const startScreen = document.getElementById('start-screen');
  const startButton = document.getElementById('start');
  const loadNote = document.getElementById('load-note');
  const guide = document.getElementById('guide');
  const joystick = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  const resetButton = document.getElementById('reset');

  const WORLD = { width: 512, height: 384 };
  const SPAWN = { x: 256, y: 349 };
  const FRAME = { w: 32, h: 50, count: 8 };
  const PLAYER_DRAW = { w: 35, h: 55 };
  const SPEED = 74;
  const directionRows = { down: 0, up: 1, left: 2, right: 3 };

  let loaded = false;
  let running = false;
  let cssWidth = 1;
  let cssHeight = 1;
  let dpr = 1;
  let last = 0;
  let elapsed = 0;
  let frameTime = 0;

  const player = { x: SPAWN.x, y: SPAWN.y, dir: 'up', moving: false, frame: 0 };
  const camera = { x: SPAWN.x, y: SPAWN.y, zoom: 1 };
  const keys = new Set();
  const stick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };

  const map = new Image();
  const sprite = new Image();

  function failBoot(message) {
    loaded = false;
    startButton.disabled = true;
    startButton.textContent = '起動できません';
    loadNote.textContent = message;
  }

  function loadEmbeddedImage(image, mime, base64, label) {
    return new Promise((resolve, reject) => {
      if (typeof base64 !== 'string' || base64.length < 100) {
        reject(new Error(`${label}データがありません`));
        return;
      }
      let settled = false;
      image.onload = () => {
        if (settled) return;
        settled = true;
        resolve(image);
      };
      image.onerror = () => {
        if (settled) return;
        settled = true;
        reject(new Error(`${label}の復元に失敗`));
      };
      image.src = `data:${mime};base64,${base64}`;
      if (image.complete && image.naturalWidth > 0) {
        settled = true;
        resolve(image);
      }
    });
  }

  const scale = 512 / 1448;
  const Z = pts => pts.map(([x, y]) => [x * scale, y * scale]);
  const walkZones = [
    { type: 'poly', points: Z([[555,1086],[902,1086],[950,920],[980,790],[965,675],[925,590],[925,480],[530,480],[500,585],[500,700],[520,845]]) },
    { type: 'ellipse', cx: 730 * scale, cy: 515 * scale, rx: 286 * scale, ry: 155 * scale },
    { type: 'poly', points: Z([[550,470],[914,470],[902,370],[870,280],[865,165],[590,165],[580,280],[550,370]]) },
    { type: 'poly', points: Z([[430,390],[580,390],[565,515],[390,555],[145,545],[0,515],[0,385],[180,365]]) },
    { type: 'poly', points: Z([[900,390],[1040,355],[1230,350],[1448,370],[1448,565],[1265,590],[1080,570],[940,525]]) },
    { type: 'poly', points: Z([[1020,555],[1448,540],[1448,840],[1280,845],[1120,790],[1000,680]]) }
  ];

  function pointInPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / ((yj - yi) || 0.000001) + xi) inside = !inside;
    }
    return inside;
  }

  function walkable(x, y) {
    if (x < 5 || y < 45 || x > WORLD.width - 5 || y > WORLD.height - 3) return false;
    return walkZones.some(z => z.type === 'ellipse'
      ? (((x - z.cx) / z.rx) ** 2 + ((y - z.cy) / z.ry) ** 2 <= 1)
      : pointInPoly(x, y, z.points));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(1, rect.width);
    cssHeight = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    camera.zoom = Math.max(Math.max(cssWidth / WORLD.width, cssHeight / WORLD.height), 1.06);
  }

  function inputVector() {
    let x = 0, y = 0;
    if (keys.has('ArrowLeft') || keys.has('a')) x--;
    if (keys.has('ArrowRight') || keys.has('d')) x++;
    if (keys.has('ArrowUp') || keys.has('w')) y--;
    if (keys.has('ArrowDown') || keys.has('s')) y++;
    if (stick.active) { x += stick.x; y += stick.y; }
    const len = Math.hypot(x, y);
    return len > 1 ? { x: x / len, y: y / len } : { x, y };
  }

  function updatePlayer(dt) {
    const v = inputVector();
    player.moving = Math.hypot(v.x, v.y) > 0.08;
    if (!player.moving) { player.frame = 0; return; }

    player.dir = Math.abs(v.x) > Math.abs(v.y)
      ? (v.x < 0 ? 'left' : 'right')
      : (v.y < 0 ? 'up' : 'down');

    const nx = player.x + v.x * SPEED * dt;
    const ny = player.y + v.y * SPEED * dt;
    if (walkable(nx, ny)) { player.x = nx; player.y = ny; }
    else {
      if (walkable(nx, player.y)) player.x = nx;
      if (walkable(player.x, ny)) player.y = ny;
    }

    frameTime += dt;
    if (frameTime >= 0.095) {
      frameTime = 0;
      player.frame = (player.frame + 1) % FRAME.count;
    }
  }

  function updateCamera(dt) {
    const vw = cssWidth / camera.zoom;
    const vh = cssHeight / camera.zoom;
    const tx = Math.max(vw / 2, Math.min(WORLD.width - vw / 2, player.x));
    const ty = Math.max(vh / 2, Math.min(WORLD.height - vh / 2, player.y - 14));
    const e = 1 - Math.exp(-8 * dt);
    camera.x += (tx - camera.x) * e;
    camera.y += (ty - camera.y) * e;
  }

  function draw() {
    const vw = cssWidth / camera.zoom;
    const vh = cssHeight / camera.zoom;
    const sx = Math.max(0, Math.min(Math.max(0, WORLD.width - vw), camera.x - vw / 2));
    const sy = Math.max(0, Math.min(Math.max(0, WORLD.height - vh), camera.y - vh / 2));

    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-sx, -sy);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(map, 0, 0, WORLD.width, WORLD.height);

    ctx.globalAlpha = 0.12 + (Math.sin(elapsed * 1.2) + 1) * 0.08;
    ctx.fillStyle = '#fff5d7';
    for (let i = 0; i < 22; i++) {
      const x = 30 + ((i * 83) % 455);
      const y = 45 + ((i * 57) % 250);
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(12,10,30,.28)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y - 1, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const row = directionRows[player.dir];
    const frame = player.moving ? player.frame : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sprite,
      frame * FRAME.w, row * FRAME.h, FRAME.w, FRAME.h,
      player.x - PLAYER_DRAW.w / 2, player.y - PLAYER_DRAW.h + 4,
      PLAYER_DRAW.w, PLAYER_DRAW.h
    );
    ctx.restore();
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(last ? (now - last) / 1000 : 0, 0.05);
    last = now;
    elapsed += dt;
    updatePlayer(dt);
    updateCamera(dt);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    draw();
    requestAnimationFrame(loop);
  }

  function reset() {
    player.x = SPAWN.x;
    player.y = SPAWN.y;
    player.dir = 'up';
    player.frame = 0;
    camera.x = SPAWN.x;
    camera.y = SPAWN.y;
  }

  function startGame() {
    if (!loaded || running) return;
    running = true;
    startScreen.hidden = true;
    guide.hidden = false;
    resetButton.hidden = false;
    resize();
    reset();
    last = performance.now();
    requestAnimationFrame(loop);
    setTimeout(() => guide.classList.add('is-gone'), 7000);
  }

  function pointerDown(e) {
    if (!running || (e.pointerType === 'mouse' && e.button !== 0) || e.clientX > cssWidth * 0.66) return;
    stick.active = true;
    stick.id = e.pointerId;
    stick.ox = e.clientX;
    stick.oy = e.clientY;
    stick.x = 0;
    stick.y = 0;
    joystick.hidden = false;
    joystick.style.left = `${e.clientX}px`;
    joystick.style.top = `${e.clientY}px`;
    canvas.setPointerCapture?.(e.pointerId);
    guide.classList.add('is-gone');
    e.preventDefault();
  }

  function pointerMove(e) {
    if (!stick.active || e.pointerId !== stick.id) return;
    const max = 38;
    let dx = e.clientX - stick.ox;
    let dy = e.clientY - stick.oy;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    stick.x = dx / max;
    stick.y = dy / max;
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    e.preventDefault();
  }

  function pointerEnd(e) {
    if (!stick.active || e.pointerId !== stick.id) return;
    stick.active = false;
    stick.id = null;
    stick.x = 0;
    stick.y = 0;
    knob.style.transform = 'translate(0,0)';
    joystick.hidden = true;
  }

  startButton.addEventListener('click', startGame);
  resetButton.addEventListener('click', reset);
  canvas.addEventListener('pointerdown', pointerDown, { passive: false });
  canvas.addEventListener('pointermove', pointerMove, { passive: false });
  canvas.addEventListener('pointerup', pointerEnd);
  canvas.addEventListener('pointercancel', pointerEnd);
  window.addEventListener('resize', () => { resize(); if (loaded) draw(); });
  window.addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d'].includes(k)) {
      keys.add(k);
      guide.classList.add('is-gone');
      e.preventDefault();
    }
  }, { passive: false });
  window.addEventListener('keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));

  const mapData = window.__TB_MAP_B64;
  const spriteData = window.__TB_SPRITE_B64;
  const mapLen = typeof mapData === 'string' ? mapData.length : 0;
  const spriteLen = typeof spriteData === 'string' ? spriteData.length : 0;

  loadNote.textContent = `内蔵データを復元中… map:${mapLen} sprite:${spriteLen}`;

  if (!mapLen || !spriteLen) {
    failBoot(`内蔵データ不足 map:${mapLen} sprite:${spriteLen}`);
    return;
  }

  Promise.all([
    loadEmbeddedImage(map, 'image/jpeg', mapData, 'マップ'),
    loadEmbeddedImage(sprite, 'image/png', spriteData, 'シオン')
  ]).then(() => {
    loaded = true;
    resize();
    reset();
    draw();
    startButton.disabled = false;
    startButton.textContent = '星の国へ';
    loadNote.textContent = 'タップして探索を始める';
  }).catch(err => {
    console.error(err);
    failBoot(`${err.message} map:${mapLen} sprite:${spriteLen}`);
  });
})();
