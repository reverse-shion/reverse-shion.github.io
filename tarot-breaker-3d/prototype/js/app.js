import { asset, loadJSON } from './config.js?v=p2-1.5.0';
import { createState, movePlayer, lookPlayer, assistView, nearbyEvent, enterSkit, leaveSkit } from './state.js?v=p2-1.5.0';
import { createWorld } from './world.js?v=p2-1.5.0';
import { InputController } from './input.js?v=p2-1.5.0';
import { AudioController } from './audio.js?v=p2-1.5.0';
import { SkitBridge } from './skit-bridge.js?v=p2-1.5.0';

let running = false;
export async function startGame({ initialAudio = null, initialSoundEnabled = false } = {}) {
  if (running) return;
  const startup = new AbortController();
  const startupTimer = setTimeout(() => startup.abort(), 15000);
  let map, eventData, characters;
  try {
    [map, eventData, characters] = await Promise.all([
      loadJSON(asset('tarot-breaker-3d/prototype/data/world.json'), startup.signal),
      loadJSON(asset('tarot-breaker-3d/prototype/data/events.json'), startup.signal),
      loadJSON(asset('tarot-breaker-3d/prototype/data/characters.json'), startup.signal)
    ]);
  } finally {
    clearTimeout(startupTimer);
  }

  const events = eventData.events;
  if (map.era !== 'past_1000' || !map.spawn || !Array.isArray(events) || !events.length) {
    throw new Error('Invalid world data');
  }

  const $ = id => document.getElementById(id);
  const world = createWorld($('scene'), map, events);
  running = true;
  const state = createState(map);
  state.mode = 'explore';

  let suspended = false;
  let contextLost = false;
  let disposed = false;
  let raf = 0;
  let previous = 0;
  let lastPrompt = undefined;
  let noticeTimer;
  let autoFollow = true;
  const cleanups = [];

  function on(el, type, fn) {
    el.addEventListener(type, fn);
    cleanups.push(() => el.removeEventListener(type, fn));
  }

  function notice(message) {
    $('notice').textContent = message;
    $('notice').hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { $('notice').hidden = true; }, 6500);
  }

  function syncFollowButton() {
    const button = $('view-follow');
    button.textContent = autoFollow ? '視点追尾 ON' : '視点追尾 OFF';
    button.setAttribute('aria-pressed', String(autoFollow));
  }

  const audio = new AudioController(
    asset('audio/seifu-raguna.mp3'),
    (enabled, message) => {
      for (const id of ['sound', 'skit-sound']) {
        $(id).textContent = enabled ? '音楽 ON' : '音楽 OFF';
        $(id).setAttribute('aria-pressed', String(enabled));
      }
      if (message) notice(message);
    },
    () => new Audio(),
    initialAudio,
    initialSoundEnabled
  );

  const input = new InputController({
    stick: $('stick'),
    thumb: $('thumb'),
    look: $('look'),
    onLook: (dx, dy) => lookPlayer(state, dx, dy),
    onInteract: interact
  });

  const skit = new SkitBridge({
    host: $('sv-skit'),
    mount: $('skit-mount'),
    closeButton: $('close-skit'),
    characters,
    onClose: completed => {
      leaveSkit(state, completed);
      $('world').inert = false;
      $('world').removeAttribute('aria-hidden');
      sync();
      if (!suspended && !disposed) {
        $('world').focus({ preventScroll: true });
        startLoop();
      }
    },
    onError: notice
  });

  function sync() {
    const active = !suspended && !contextLost && !disposed;
    input.setEnabled(active && state.mode === 'explore');
    $('controls').hidden = !active || state.mode !== 'explore';
    audio.setScene(state.mode, active);
    syncFollowButton();
    updatePrompt();
  }

  function updatePrompt() {
    if (state.mode !== 'explore') {
      $('interact').hidden = true;
      return;
    }

    const event = nearbyEvent(state, events, map);
    const id = event?.id || null;
    if (id === lastPrompt) return;

    const entering = Boolean(event) && lastPrompt !== undefined && lastPrompt !== id;
    $('interact').hidden = !event;
    $('guide').textContent = event
      ? 'シオンの記憶が反応している——会話を始めます'
      : '↑↓←→ スワイプで移動 ／ タップで停止';
    if (event) $('interact').textContent = event.label;
    lastPrompt = id;

    if (entering) {
      input.stopMovement();
      queueMicrotask(() => {
        const current = nearbyEvent(state, events, map);
        if (!suspended && !disposed && state.mode === 'explore' && current?.id === id) interact();
      });
    }
  }

  function interact() {
    if (suspended || disposed || state.mode !== 'explore') return;
    const event = nearbyEvent(state, events, map);
    if (!enterSkit(state, event)) return;
    input.stopMovement();
    stopLoop();
    sync();
    $('world').inert = true;
    $('world').setAttribute('aria-hidden', 'true');
    void skit.open(event);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    previous = 0;
  }

  function frame(now) {
    raf = 0;
    if (suspended || disposed || contextLost || state.mode !== 'explore') return;
    const dt = previous ? (now - previous) / 1000 : 0;
    previous = now;
    const movement = input.sample();
    movePlayer(state, movement, dt, map);
    if (autoFollow && input.isMoving()) assistView(state, dt);
    world.render(state.player);
    updatePrompt();
    raf = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (!raf && !suspended && !disposed && !contextLost && state.mode === 'explore') {
      raf = requestAnimationFrame(frame);
    }
  }

  function pause(message = '記憶の追体験を一時停止しました。') {
    if (disposed || suspended) return;
    suspended = true;
    input.stopMovement();
    stopLoop();
    skit.close(false);
    sync();
    $('pause-message').textContent = message;
    $('pause-screen').hidden = false;
    $('world').inert = true;
    $('resume').disabled = contextLost;
  }

  function resume() {
    if (contextLost || disposed || document.hidden) return;
    suspended = false;
    $('pause-screen').hidden = true;
    $('world').inert = false;
    world.resize();
    sync();
    $('world').focus({ preventScroll: true });
    startLoop();
  }

  on($('interact'), 'click', interact);
  on($('sound'), 'click', () => audio.toggle());
  on($('skit-sound'), 'click', () => audio.toggle());
  on($('view-follow'), 'click', () => {
    autoFollow = !autoFollow;
    syncFollowButton();
    notice(autoFollow ? '視点追尾をONにしました。移動中は視線が自然に正面へ戻ります。' : '視点追尾をOFFにしました。現在の視線角度を保ちます。');
  });
  on($('resume'), 'click', resume);

  on(document, 'visibilitychange', () => {
    if (document.hidden) pause();
  });

  on(window, 'resize', () => {
    input.reset();
    if (!contextLost) {
      world.resize();
      world.render(state.player);
    }
  });

  on($('scene'), 'webglcontextlost', e => {
    e.preventDefault();
    contextLost = true;
    pause('描画を復旧しています。戻らない場合は、このページを再読み込みしてください。');
  });

  on($('scene'), 'webglcontextrestored', () => {
    contextLost = false;
    world.resize();
    $('resume').disabled = false;
    $('pause-message').textContent = '描画が戻りました。記憶へ戻れます。';
  });

  on(window, 'pagehide', e => {
    if (e.persisted) pause();
    else dispose();
  });

  on(window, 'pageshow', e => {
    if (e.persisted && !disposed) pause();
  });

  function dispose() {
    disposed = true;
    stopLoop();
    skit.dispose();
    input.dispose();
    audio.dispose();
    world.dispose();
    clearTimeout(noticeTimer);
    cleanups.forEach(fn => fn());
    running = false;
  }

  $('start-screen').hidden = true;
  $('world').focus({ preventScroll: true });
  if (navigator.serviceWorker?.controller) {
    notice('以前のサイトデータが残る場合があります。表示が古い場合は再読み込みしてください。');
  }
  sync();
  world.render(state.player);
  startLoop();
}
