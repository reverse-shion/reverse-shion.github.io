(() => {
  'use strict';

  const REF = { width: 1448, height: 1086 };
  const STORAGE_KEY = 'tarot-breaker-star-gate-collision-v2';
  const COLLISION_URL = './star-country-gate-garden-collision.json';
  const MIN_ZOOM = 0.35;
  const MAX_ZOOM = 3.4;

  const viewport = document.getElementById('viewport');
  const world = document.getElementById('world');
  const map = document.getElementById('map');
  const overlay = document.getElementById('overlay');
  const status = document.getElementById('status');
  const modePan = document.getElementById('mode-pan');
  const modeEdit = document.getElementById('mode-edit');
  const modeDraw = document.getElementById('mode-draw');
  const resetViewButton = document.getElementById('reset-view');
  const undoPointButton = document.getElementById('undo-point');
  const finishPolyButton = document.getElementById('finish-poly');
  const reloadOfficialButton = document.getElementById('reload-official');
  const clearAllButton = document.getElementById('clear-all');
  const copyJsonButton = document.getElementById('copy-json');
  const addVertexButton = document.getElementById('add-vertex');
  const deleteVertexButton = document.getElementById('delete-vertex');
  const deleteSelectedPolyButton = document.getElementById('delete-selected-poly');
  const selectionLabel = document.getElementById('selection-label');
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
  let selectedPoly = -1;
  let selectedVertex = -1;
  let addVertexArmed = false;

  const pointers = new Map();
  let panGesture = null;
  let tapGesture = null;
  let pinchGesture = null;
  let vertexDrag = null;

  const svgNS = 'http://www.w3.org/2000/svg';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function setStatus(message) { status.textContent = message; }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ polygons, draft }));
    } catch (error) {
      console.warn('保存できませんでした', error);
    }
  }

  function restoreLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.polygons)) return false;
      polygons = parsed.polygons;
      draft = Array.isArray(parsed.draft) ? parsed.draft : [];
      return true;
    } catch (error) {
      console.warn('保存データを読み込めませんでした', error);
      return false;
    }
  }

  async function loadOfficial({ confirmReplace = false } = {}) {
    if (confirmReplace && !confirm('現在の編集内容を破棄してGitHub版を読み込みますか？')) return;
    const response = await fetch(COLLISION_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('GitHub版の当たり判定を読み込めません');
    const data = await response.json();
    if (data.referenceSize?.width !== REF.width || data.referenceSize?.height !== REF.height) throw new Error('基準サイズが一致しません');
    polygons = (data.walkAreas || [])
      .filter(area => area.type === 'poly' && Array.isArray(area.points) && area.points.length >= 3)
      .map(area => area.points.map(([x, y]) => [Number(x), Number(y)]));
    draft = [];
    selectedPoly = -1;
    selectedVertex = -1;
    addVertexArmed = false;
    save();
    renderOverlay();
    updateSelectionUI();
    setStatus(`GitHub版 ${polygons.length}範囲を読み込みました`);
  }

  function clampPan() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const scaledW = REF.width * zoom;
    const scaledH = REF.height * zoom;
    panX = scaledW <= vw ? (vw - scaledW) / 2 : clamp(panX, vw - scaledW, 0);
    panY = scaledH <= vh ? (vh - scaledH) / 2 : clamp(panY, vh - scaledH, 0);
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
    const rect = viewport.getBoundingClientRect();
    return {
      x: clamp((clientX - rect.left - panX) / zoom, 0, REF.width),
      y: clamp((clientY - rect.top - panY) / zoom, 0, REF.height)
    };
  }

  function createSvg(tag, attrs = {}) {
    const node = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }

  function pointString(points) { return points.map(([x, y]) => `${x},${y}`).join(' '); }

  function centroid(points) {
    let x = 0, y = 0;
    for (const p of points) { x += p[0]; y += p[1]; }
    return points.length ? [x / points.length, y / points.length] : [0, 0];
  }

  function pointInPoly(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      const hit = ((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / ((yj - yi) || 0.000001) + xi;
      if (hit) inside = !inside;
    }
    return inside;
  }

  function distancePointToSegment(p, a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1];
    const wx = p.x - a[0], wy = p.y - a[1];
    const len2 = vx * vx + vy * vy || 1;
    const t = clamp((wx * vx + wy * vy) / len2, 0, 1);
    const x = a[0] + vx * t, y = a[1] + vy * t;
    return { distance: Math.hypot(p.x - x, p.y - y), x, y, t };
  }

  function nearestVertex(point, polyIndex = selectedPoly) {
    if (polyIndex < 0 || !polygons[polyIndex]) return null;
    const threshold = 22 / zoom;
    let best = null;
    polygons[polyIndex].forEach(([x, y], index) => {
      const d = Math.hypot(point.x - x, point.y - y);
      if (d <= threshold && (!best || d < best.distance)) best = { index, distance: d };
    });
    return best;
  }

  function findPolygonAt(point) {
    for (let i = polygons.length - 1; i >= 0; i--) if (pointInPoly(point.x, point.y, polygons[i])) return i;
    let best = null;
    polygons.forEach((poly, polyIndex) => {
      for (let i = 0; i < poly.length; i++) {
        const hit = distancePointToSegment(point, poly[i], poly[(i + 1) % poly.length]);
        if (hit.distance <= 18 / zoom && (!best || hit.distance < best.distance)) best = { polyIndex, distance: hit.distance };
      }
    });
    return best ? best.polyIndex : -1;
  }

  function updateSelectionUI() {
    if (selectedPoly < 0 || !polygons[selectedPoly]) {
      selectionLabel.textContent = '範囲未選択';
      deleteSelectedPolyButton.disabled = true;
      addVertexButton.disabled = true;
      deleteVertexButton.disabled = true;
      return;
    }
    const suffix = selectedVertex >= 0 ? ` / 点${selectedVertex + 1}` : '';
    selectionLabel.textContent = `範囲 ${selectedPoly + 1} / ${polygons[selectedPoly].length}点${suffix}`;
    deleteSelectedPolyButton.disabled = false;
    addVertexButton.disabled = false;
    deleteVertexButton.disabled = selectedVertex < 0 || polygons[selectedPoly].length <= 3;
  }

  function renderOverlay() {
    overlay.replaceChildren();
    polygons.forEach((points, index) => {
      const selected = index === selectedPoly;
      overlay.appendChild(createSvg('polygon', {
        points: pointString(points),
        class: selected ? 'poly-fill selected' : 'poly-fill'
      }));
      const [cx, cy] = centroid(points);
      const label = createSvg('text', { x: cx, y: cy, class: selected ? 'index-text selected' : 'index-text' });
      label.textContent = String(index + 1);
      overlay.appendChild(label);

      if (selected && mode === 'edit') {
        const radius = clamp(8 / zoom, 5, 18);
        points.forEach(([x, y], vertexIndex) => {
          overlay.appendChild(createSvg('circle', {
            cx: x, cy: y, r: radius,
            class: vertexIndex === selectedVertex ? 'vertex selected' : 'vertex'
          }));
        });
      }
    });

    if (draft.length) {
      overlay.appendChild(createSvg(draft.length >= 3 ? 'polygon' : 'polyline', {
        points: pointString(draft), class: 'draft-line'
      }));
      const radius = clamp(7 / zoom, 4, 18);
      draft.forEach(([x, y]) => overlay.appendChild(createSvg('circle', { cx: x, cy: y, r: radius, class: 'vertex draft' })));
    }
  }

  function setMode(nextMode) {
    mode = nextMode;
    modePan.classList.toggle('active', mode === 'pan');
    modeEdit.classList.toggle('active', mode === 'edit');
    modeDraw.classList.toggle('active', mode === 'draw');
    viewport.style.cursor = mode === 'pan' ? 'grab' : 'crosshair';
    addVertexArmed = false;
    if (mode !== 'edit') selectedVertex = -1;
    renderOverlay();
    updateSelectionUI();
    setStatus(mode === 'pan' ? '移動モード：ドラッグ／ピンチで位置調整' : mode === 'edit' ? '修正モード：範囲を選択し、黄色い点をドラッグ' : `新規範囲：${draft.length}点 / タップで追加`);
  }

  function finishPolygon() {
    if (draft.length < 3) return setStatus('3点以上置いてから範囲を確定してください');
    polygons.push(draft.map(([x, y]) => [Math.round(x), Math.round(y)]));
    draft = [];
    selectedPoly = polygons.length - 1;
    selectedVertex = -1;
    save(); renderOverlay(); updateSelectionUI();
    setStatus(`新しい歩行エリア ${selectedPoly + 1} を追加しました`);
  }

  function addDraftPoint(clientX, clientY) {
    const point = clientToWorld(clientX, clientY);
    if (draft.length >= 3) {
      const [fx, fy] = draft[0];
      if (Math.hypot(point.x - fx, point.y - fy) * zoom <= 24) return finishPolygon();
    }
    draft.push([Math.round(point.x), Math.round(point.y)]);
    save(); renderOverlay();
    setStatus(`新規範囲：${draft.length}点`);
  }

  function insertVertexAt(point) {
    if (selectedPoly < 0) return setStatus('先に修正する範囲を選択してください');
    const poly = polygons[selectedPoly];
    let best = null;
    for (let i = 0; i < poly.length; i++) {
      const hit = distancePointToSegment(point, poly[i], poly[(i + 1) % poly.length]);
      if (!best || hit.distance < best.distance) best = { ...hit, edgeIndex: i };
    }
    if (!best || best.distance > 45 / zoom) return setStatus('選択した範囲の辺の近くをタップしてください');
    poly.splice(best.edgeIndex + 1, 0, [Math.round(point.x), Math.round(point.y)]);
    selectedVertex = best.edgeIndex + 1;
    addVertexArmed = false;
    save(); renderOverlay(); updateSelectionUI();
    setStatus(`点を追加しました / 範囲${selectedPoly + 1}`);
  }

  function distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function midpoint(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

  function beginPinch() {
    if (pointers.size < 2) return;
    const [a, b] = [...pointers.values()].slice(0, 2);
    const mid = midpoint(a, b);
    pinchGesture = { startDistance: Math.max(1, distance(a, b)), startZoom: zoom, anchor: clientToWorld(mid.x, mid.y) };
    panGesture = null; tapGesture = null; vertexDrag = null;
  }

  viewport.addEventListener('pointerdown', event => {
    if (!ready) return;
    viewport.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) { beginPinch(); event.preventDefault(); return; }

    if (mode === 'pan') {
      panGesture = { x: event.clientX, y: event.clientY, panX, panY };
      viewport.style.cursor = 'grabbing';
    } else if (mode === 'edit') {
      const point = clientToWorld(event.clientX, event.clientY);
      if (addVertexArmed) {
        tapGesture = { x: event.clientX, y: event.clientY, action: 'add-vertex' };
      } else {
        const vertex = nearestVertex(point);
        if (vertex) {
          selectedVertex = vertex.index;
          vertexDrag = { pointerId: event.pointerId };
          renderOverlay(); updateSelectionUI();
        } else {
          tapGesture = { x: event.clientX, y: event.clientY, action: 'select' };
        }
      }
    } else {
      tapGesture = { x: event.clientX, y: event.clientY, action: 'draw' };
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
      applyTransform(); event.preventDefault(); return;
    }
    if (mode === 'pan' && panGesture) {
      panX = panGesture.panX + (event.clientX - panGesture.x);
      panY = panGesture.panY + (event.clientY - panGesture.y);
      applyTransform();
    } else if (mode === 'edit' && vertexDrag && vertexDrag.pointerId === event.pointerId && selectedPoly >= 0 && selectedVertex >= 0) {
      const point = clientToWorld(event.clientX, event.clientY);
      polygons[selectedPoly][selectedVertex] = [Math.round(point.x), Math.round(point.y)];
      renderOverlay();
    }
    event.preventDefault();
  }, { passive: false });

  function endPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    if (vertexDrag && vertexDrag.pointerId === event.pointerId) {
      vertexDrag = null; save(); setStatus(`点を移動しました / 範囲${selectedPoly + 1}`);
    } else if (tapGesture && pointers.size === 1) {
      const moved = Math.hypot(event.clientX - tapGesture.x, event.clientY - tapGesture.y);
      if (moved < 12) {
        const point = clientToWorld(event.clientX, event.clientY);
        if (tapGesture.action === 'draw') addDraftPoint(event.clientX, event.clientY);
        if (tapGesture.action === 'add-vertex') insertVertexAt(point);
        if (tapGesture.action === 'select') {
          const found = findPolygonAt(point);
          selectedPoly = found;
          selectedVertex = -1;
          renderOverlay(); updateSelectionUI();
          setStatus(found >= 0 ? `範囲 ${found + 1} を選択` : '範囲外です');
        }
      }
    }
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchGesture = null;
    if (pointers.size === 0) { panGesture = null; tapGesture = null; viewport.style.cursor = mode === 'pan' ? 'grab' : 'crosshair'; }
    event.preventDefault();
  }

  viewport.addEventListener('pointerup', endPointer, { passive: false });
  viewport.addEventListener('pointercancel', endPointer, { passive: false });
  viewport.addEventListener('wheel', event => {
    if (!ready) return;
    const anchor = clientToWorld(event.clientX, event.clientY);
    zoom = clamp(zoom * (event.deltaY < 0 ? 1.12 : 0.89), MIN_ZOOM, MAX_ZOOM);
    const rect = viewport.getBoundingClientRect();
    panX = event.clientX - rect.left - anchor.x * zoom;
    panY = event.clientY - rect.top - anchor.y * zoom;
    applyTransform(); event.preventDefault();
  }, { passive: false });

  modePan.addEventListener('click', () => setMode('pan'));
  modeEdit.addEventListener('click', () => setMode('edit'));
  modeDraw.addEventListener('click', () => setMode('draw'));
  resetViewButton.addEventListener('click', fitView);

  undoPointButton.addEventListener('click', () => {
    if (!draft.length) return setStatus('新規作成中の点がありません');
    draft.pop(); save(); renderOverlay(); setStatus(`1点戻しました / 残り${draft.length}点`);
  });
  finishPolyButton.addEventListener('click', finishPolygon);

  addVertexButton.addEventListener('click', () => {
    if (selectedPoly < 0) return setStatus('先に修正する範囲を選択してください');
    addVertexArmed = true;
    selectedVertex = -1;
    renderOverlay(); updateSelectionUI();
    setStatus('点を追加したい辺の位置をタップしてください');
  });

  deleteVertexButton.addEventListener('click', () => {
    if (selectedPoly < 0 || selectedVertex < 0) return setStatus('削除する点を選択してください');
    const poly = polygons[selectedPoly];
    if (poly.length <= 3) return setStatus('3点以下にはできません。範囲ごと削除してください');
    poly.splice(selectedVertex, 1);
    selectedVertex = -1; save(); renderOverlay(); updateSelectionUI();
    setStatus(`点を削除しました / 範囲${selectedPoly + 1}`);
  });

  deleteSelectedPolyButton.addEventListener('click', () => {
    if (selectedPoly < 0) return;
    if (!confirm(`範囲 ${selectedPoly + 1} を削除しますか？`)) return;
    polygons.splice(selectedPoly, 1);
    selectedPoly = -1; selectedVertex = -1; save(); renderOverlay(); updateSelectionUI();
    setStatus(`範囲を削除しました / 残り${polygons.length}個`);
  });

  reloadOfficialButton.addEventListener('click', () => loadOfficial({ confirmReplace: true }).catch(error => setStatus(error.message)));

  clearAllButton.addEventListener('click', () => {
    if (!confirm('すべての当たり判定を消しますか？')) return;
    polygons = []; draft = []; selectedPoly = -1; selectedVertex = -1; save(); renderOverlay(); updateSelectionUI(); setStatus('すべて消去しました');
  });

  function exportPayload() {
    return {
      version: 1,
      map: 'star-country-gate-garden',
      referenceSize: { width: REF.width, height: REF.height },
      walkAreas: polygons.map(points => ({ type: 'poly', points: points.map(([x, y]) => [Math.round(x), Math.round(y)]) }))
    };
  }

  copyJsonButton.addEventListener('click', async () => {
    if (draft.length) return setStatus('作成途中の新規範囲があります。確定してからコピーしてください');
    if (!polygons.length) return setStatus('歩行エリアがありません');
    const text = JSON.stringify(exportPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`JSONをコピーしました / ${polygons.length}範囲`);
    } catch (error) {
      output.hidden = false; output.value = text; output.focus(); output.select();
      setStatus('表示したJSONを長押しでコピーしてください');
    }
  });

  output.addEventListener('blur', () => { output.hidden = true; });
  closeHelp.addEventListener('click', () => { help.hidden = true; });
  window.addEventListener('resize', () => { if (ready) fitView(); });

  async function init() {
    try {
      const restored = restoreLocal();
      if (!restored) await loadOfficial();
      renderOverlay(); updateSelectionUI();
      const onReady = () => {
        ready = true; fitView(); setMode('pan');
        setStatus(restored ? `編集中データ ${polygons.length}範囲を復元` : `GitHub版 ${polygons.length}範囲を読み込み`);
      };
      if (map.complete && map.naturalWidth) onReady();
      else {
        map.addEventListener('load', onReady, { once: true });
        map.addEventListener('error', () => setStatus('マップ画像を読み込めません'), { once: true });
      }
    } catch (error) {
      console.error(error); setStatus(error.message);
    }
  }

  init();
})();
