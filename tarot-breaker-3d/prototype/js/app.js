import { asset, loadJSON } from './config.js?v=star-country-v1.0';
import { createState, movePlayer, lookPlayer, assistView, nearbyEvent, enterSkit, leaveSkit } from './state.js?v=star-country-v1.0';
import { createWorld } from './world.js?v=star-country-v1.0';
import { InputController } from './input.js?v=star-country-v1.0';
import { AudioController } from './audio.js?v=star-country-v1.0';
import { SkitBridge } from './skit-bridge.js?v=star-country-v1.0';

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
  const completedEvents = new Set();

  let suspended = false;
  let contextLost = false;
  let disposed = false;
  let raf = 0;
  let previous = 0;
  let lastPrompt = null;
  let noticeTimer;
  const cleanups = [];

  function on(el, type, fn, options) {
    el.addEventListener(type, fn, options);
    cleanups.push(() => el.removeEventListener(type, fn, options));
  }

  function notice(message) {
    $('notice').textContent = message;
    $('notice').hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { $('notice').hidden = true; }, 2600);
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
    skipButton: $('skip-memory'),
    characters,
    onClose: completed => {
      const finishedEventId = state.eventId;
      leaveSkit(state, completed);
      if (completed && finishedEventId) {
        completedEvents.add(finishedEventId);
        notice('記憶の光が、星の国へ静かにほどけていく。');
      }
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
    updatePrompt();
  }

  function updatePrompt() {
    if (state.mode !== 'explore') {
      $('interact').hidden = true;
      $('guide').hidden = true;
      return;
    }

    const event = nearbyEvent(state, events, map);
    const id = event?.id || null;
    const entering = Boolean(event) && id !== lastPrompt;
    const completed = Boolean(id && completedEvents.has(id));

    $('interact').hidden = !event;
    $('guide').hidden = !event;
    if (event) {
      $('guide').textContent = completed ? '懐かしい共鳴が、まだここに残っている。' : '星の光が、かすかに揺れている。';
      $('interact').textContent = completed ? 'もう一度、記憶に触れる' : 'ふたりに声をかける';
    }

    if (entering) input.stopMovement();
    lastPrompt = id;
  }

  function interact() {
    if (suspended || disposed || state.mode !== 'explore') return;
    const event = nearbyEvent(state, events, map);
    if (!event) return;
    const replay = completedEvents.has(event.id);
    if (!enterSkit(state, event)) return;
    input.stopMovement();
    stopLoop();
    sync();
    $('world').inert = true;
    $('world').setAttribute('aria-hidden', 'true');
    void skit.open(event, { replay });
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
    const moving = Math.hypot(movement.x, movement.z) > 0.03;
    movePlayer(state, movement, dt, map);

    if (moving && !input.isFreeLooking() && !input.recentlyLooked(now, 1200)) {
      assistView(state, dt);
    }

    world.render(state.player, { moving, delta: dt });
    updatePrompt();
    raf = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (!raf && !suspended && !disposed && !contextLost && state.mode === 'explore') {
      raf = requestAnimationFrame(frame);
    }
  }

  function pause(message = '星の国は、ここで待っています。') {
    if (disposed || suspended) return;
    suspended = true;
    input.stopMovement();
    stopLoop();
    sync();
    $('pause-message').textContent = message;
    $('pause-screen').hidden = false;
    $('resume').disabled = contextLost;
  }

  function resume() {
    if (contextLost || disposed || document.hidden) return;
    suspended = false;
    $('pause-screen').hidden = true;
    world.resize();
    sync();

    if (state.mode === 'skit') {
      $('world').inert = true;
      document.querySelector('#sv-skit .sv-dialogue')?.focus({ preventScroll: true });
      return;
    }

    $('world').inert = false;
    $('world').focus({ preventScroll: true });
    startLoop();
  }

  on($('interact'), 'pointerdown', e => {
    e.stopPropagation();
    input.stopMovement();
  });
  on($('interact'), 'click', e => {
    e.stopPropagation();
    interact();
  });
  on($('sound'), 'click', e => {
    e.stopPropagation();
    audio.toggle();
  });
  on($('skit-sound'), 'click', e => {
    e.stopPropagation();
    audio.toggle();
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
    pause('星の国の光を復旧しています。戻らない場合はページを再読み込みしてください。');
  });

  on($('scene'), 'webglcontextrestored', () => {
    contextLost = false;
    world.resize();
    $('resume').disabled = false;
    $('pause-message').textContent = '星の国の光が戻りました。';
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
  sync();
  world.render(state.player);
  startLoop();
}
