(() => {
  'use strict';

  const REF = { width: 1448, height: 1086 };
  const STORAGE_KEY = 'tarot-breaker-star-gate-collision-v1';
  const MIN_ZOOM = 0.35;
  const MAX_ZOOM = 2.8;

  const viewport = document.getElementById('viewport');
  const world = document.getElementById('world');
  const map = document.getElementById('map');
  const overlay = document.getElementById('overlay');
  const status = document.getElementById('status');
  const modePan = document.getElementById('mode-pan');
  const modeDraw = document.getElementById('mode-draw');
  const resetViewButton = document.getElementById('reset-view');
  const undoPointButton = document.getElementById('undo-point');
  const finishPolyButton = document.getElementById('finish-poly');
  const deletePolyButton = document.getElementById('delete-poly');
  const clearAllButton = document.getElementById('clear-all');
  const copyJsonButton = document.getElementById('copy-json');
  const help = document.getElementById('help');
  const closeHelp = document.getElementById('close-help');
  const output = document.getElementById('json-output');

  let mode = 'pan';
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let polygons = [];
  let draft = [];
  let ready = false;

  const pointers = new Map();
  let panGesture = null;
  let tapGesture = null;
  let pinchGesture = null;

  const svgNS = 'http://www.w3.org/2000/svg';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function setStatus(message) {
    status.textContent = message;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ polygons, draft }));
    } catch (error) {
      console.warn('保存できませんでした', error);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.polygons)) polygons = parsed.polygons;
      if (Array.isArray(parsed.draft)) draft = parsed.draft;
    } catch (error) {
      console.warn('保存データを読み込めませんでした', error);
    }
  }

  function clampPan() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const scaledW = REF.width * zoom;
    const scaledH = REF.height * zoom;

    if (scaledW <= vw) panX = (vw - scaledW) / 2;
    else panX = clamp(panX, vw - scaledW, 0);

    if (scaledH <= vh) panY = (vh - scaledH) / 2;
    else panY = clamp(panY, vh - scaledH, 0);
  }

  function applyTransform() {
    clampPan();
    world.style.transform = `translate3d(${panX}px,${panY}px,0) scale(${zoom})`;
    renderOverlay();
  }

  function fitView() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    zoom = clamp(Math.max(vw / REF.width, vh / REF.height), MIN_ZOOM, MAX_ZOOM);
    panX = (vw - REF.width * zoom) / 2;
    panY = (vh - REF.height * zoom) / 2;
    applyTransform();
    setStatus('全体を表示しました');
  }

  function clientToWorld(clientX, clientY) {
    return {
      x: clamp((clientX - panX) / zoom, 0, REF.width),
      y: clamp((clientY - panY) / zoom, 0, REF.height)
    };
  }

  function createSvg(tag, attrs = {}) {
    const node = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }

  function pointString(points) {
    return points.map(([x, y]) => `${x},${y}`).join(' ');
  }

  function centroid(points) {
    if (!points.length) return [0, 0];
    let x = 0;
    let y = 0;
    for (const p of points) { x += p[0]; y += p[1]; }
    return [x / points.length, y / points.length];
  }

  function renderOverlay() {
    overlay.replaceChildren();

    polygons.forEach((points, index) => {
      const poly = createSvg('polygon', {
        points: pointString(points),
        class: 'poly-fill'
      });
      overlay.appendChild(poly);

      const [cx, cy] = centroid(points);
      const label = createSvg('text', {
        x: cx,
        y: cy,
        class: 'index-text'
      });
      label.textContent = String(index + 1);
      overlay.appendChild(label);
    });

    if (draft.length) {
      const draftNode = createSvg(draft.length >= 3 ? 'polygon' : 'polyline', {
        points: pointString(draft),
        class: 'draft-line'
      });
      overlay.appendChild(draftNode);

      const radius = clamp(7 / zoom, 4, 18);
      draft.forEach(([x, y], index) => {
        const point = createSvg('circle', {
          cx: x,
          cy: y,
          r: radius,
          class: 'vertex'
        });
        overlay.appendChild(point);

        if (index === 0 && draft.length >= 3) {
          const ring = createSvg('circle', {
            cx: x,
            cy: y,
            r: radius * 2.2,
            fill: 'none',
            stroke: '#7fdcff',
            'stroke-width': 2,
            'vector-effect': 'non-scaling-stroke'
          });
          overlay.appendChild(ring);
        }
      });
    }
  }

  function setMode(nextMode) {
    mode = nextMode;
    modePan.classList.toggle('active', mode === 'pan');
    modeDraw.classList.toggle('active', mode === 'draw');
    viewport.style.cursor = mode === 'pan' ? 'grab' : 'crosshair';
    setStatus(mode === 'pan' ? '移動モード：ドラッグ／ピンチで位置調整' : `描画モード：${draft.length}点 / タップで追加`);
  }

  function finishPolygon() {
    if (draft.length < 3) {
      setStatus('3点以上置いてから範囲を確定してください');
      return;
    }
    polygons.push(draft.map(([x, y]) => [Math.round(x), Math.round(y)]));
    draft = [];
    save();
    renderOverlay();
    setStatus(`歩行エリア ${polygons.length}個を保存中`);
  }

  function addPoint(clientX, clientY) {
    const point = clientToWorld(clientX, clientY);

    if (draft.length >= 3) {
      const [firstX, firstY] = draft[0];
      const distance = Math.hypot(point.x - firstX, point.y - firstY) * zoom;
      if (distance <= 24) {
        finishPolygon();
        return;
      }
    }

    draft.push([Math.round(point.x), Math.round(point.y)]);
    save();
    renderOverlay();
    setStatus(`描画モード：${draft.length}点 / 最初の点を再タップでも確定`);
  }

  function distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function beginPinch() {
    if (pointers.size < 2) return;
    const [a, b] = [...pointers.values()].slice(0, 2);
    const mid = midpoint(a, b);
    pinchGesture = {
      startDistance: Math.max(1, distance(a, b)),
      startZoom: zoom,
      anchor: clientToWorld(mid.x, mid.y)
    };
    panGesture = null;
    tapGesture = null;
  }

  viewport.addEventListener('pointerdown', event => {
    if (!ready) return;
    viewport.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      beginPinch();
      event.preventDefault();
      return;
    }

    if (mode === 'pan') {
      panGesture = { x: event.clientX, y: event.clientY, panX, panY };
      viewport.style.cursor = 'grabbing';
    } else {
      tapGesture = { x: event.clientX, y: event.clientY };
    }
    event.preventDefault();
  }, { passive: false });

  viewport.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      if (!pinchGesture) beginPinch();
      const [a, b] = [...pointers.values()].slice(0, 2);
      const mid = midpoint(a, b);
      const ratio = distance(a, b) / pinchGesture.startDistance;
      zoom = clamp(pinchGesture.startZoom * ratio, MIN_ZOOM, MAX_ZOOM);
      panX = mid.x - pinchGesture.anchor.x * zoom;
      panY = mid.y - pinchGesture.anchor.y * zoom;
      applyTransform();
      event.preventDefault();
      return;
    }

    if (mode === 'pan' && panGesture) {
      panX = panGesture.panX + (event.clientX - panGesture.x);
      panY = panGesture.panY + (event.clientY - panGesture.y);
      applyTransform();
    }
    event.preventDefault();
  }, { passive: false });

  function endPointer(event) {
    const hadPointer = pointers.has(event.pointerId);
    if (!hadPointer) return;

    if (mode === 'draw' && tapGesture && pointers.size === 1) {
      const moved = Math.hypot(event.clientX - tapGesture.x, event.clientY - tapGesture.y);
      if (moved < 12) addPoint(event.clientX, event.clientY);
    }

    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchGesture = null;
    if (pointers.size === 0) {
      panGesture = null;
      tapGesture = null;
      viewport.style.cursor = mode === 'pan' ? 'grab' : 'crosshair';
    }
    event.preventDefault();
  }

  viewport.addEventListener('pointerup', endPointer, { passive: false });
  viewport.addEventListener('pointercancel', endPointer, { passive: false });

  viewport.addEventListener('wheel', event => {
    if (!ready) return;
    const anchor = clientToWorld(event.clientX, event.clientY);
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    zoom = clamp(zoom * factor, MIN_ZOOM, MAX_ZOOM);
    panX = event.clientX - anchor.x * zoom;
    panY = event.clientY - anchor.y * zoom;
    applyTransform();
    event.preventDefault();
  }, { passive: false });

  modePan.addEventListener('click', () => setMode('pan'));
  modeDraw.addEventListener('click', () => setMode('draw'));
  resetViewButton.addEventListener('click', fitView);

  undoPointButton.addEventListener('click', () => {
    if (!draft.length) {
      setStatus('戻せる点がありません');
      return;
    }
    draft.pop();
    save();
    renderOverlay();
    setStatus(`1点戻しました / 残り${draft.length}点`);
  });

  finishPolyButton.addEventListener('click', finishPolygon);

  deletePolyButton.addEventListener('click', () => {
    if (!polygons.length) {
      setStatus('削除できる確定範囲がありません');
      return;
    }
    polygons.pop();
    save();
    renderOverlay();
    setStatus(`最後の範囲を削除 / 残り${polygons.length}個`);
  });

  clearAllButton.addEventListener('click', () => {
    if (!polygons.length && !draft.length) return;
    if (!confirm('描いた当たり判定をすべて消しますか？')) return;
    polygons = [];
    draft = [];
    save();
    renderOverlay();
    setStatus('すべて消去しました');
  });

  function exportPayload() {
    return {
      version: 1,
      map: 'star-country-gate-garden',
      referenceSize: { width: REF.width, height: REF.height },
      walkAreas: polygons.map(points => ({ type: 'poly', points }))
    };
  }

  copyJsonButton.addEventListener('click', async () => {
    if (draft.length) {
      setStatus('作成途中の範囲があります。確定してからコピーしてください');
      return;
    }
    if (!polygons.length) {
      setStatus('歩行エリアを1つ以上作ってください');
      return;
    }

    const text = JSON.stringify(exportPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`JSONをコピーしました / ${polygons.length}範囲`);
    } catch (error) {
      output.hidden = false;
      output.value = text;
      output.focus();
      output.select();
      setStatus('自動コピーできないため、表示したJSONを長押しでコピーしてください');
    }
  });

  output.addEventListener('blur', () => { output.hidden = true; });
  closeHelp.addEventListener('click', () => { help.hidden = true; });

  window.addEventListener('resize', () => {
    if (!ready) return;
    const centerWorld = clientToWorld(viewport.clientWidth / 2, viewport.clientHeight / 2);
    panX = viewport.clientWidth / 2 - centerWorld.x * zoom;
    panY = viewport.clientHeight / 2 - centerWorld.y * zoom;
    applyTransform();
  });

  load();
  renderOverlay();

  const onReady = () => {
    ready = true;
    fitView();
    setMode('pan');
    setStatus(polygons.length ? `保存済みの歩行エリア ${polygons.length}個を復元` : '準備完了：まず「移動」で通路を確認');
  };

  if (map.complete && map.naturalWidth) onReady();
  else {
    map.addEventListener('load', onReady, { once: true });
    map.addEventListener('error', () => setStatus('マップ画像を読み込めません'), { once: true });
  }
})();