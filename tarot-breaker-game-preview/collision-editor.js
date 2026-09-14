(() => {
  'use strict';

  const REF = { width: 1448, height: 1086 };
  const STORAGE_KEY = 'tarot-breaker-star-gate-collision-v3';
  const LEGACY_STORAGE_KEY = 'tarot-breaker-star-gate-collision-v2';
  const COLLISION_URL = './star-country-gate-garden-collision.json';
  const MIN_ZOOM = 0.35;
  const MAX_ZOOM = 3.4;
  const TAP_MOVE_LIMIT = 12;

  const $ = (id) => document.getElementById(id);
  const viewport = $('viewport');
  const world = $('world');
  const map = $('map');
  const overlay = $('overlay');
  const status = $('status');
  const modePan = $('mode-pan');
  const modeEdit = $('mode-edit');
  const modeDraw = $('mode-draw');
  const kindWalk = $('kind-walk');
  const kindBlocked = $('kind-blocked');
  const resetViewButton = $('reset-view');
  const undoPointButton = $('undo-point');
  const finishPolyButton = $('finish-poly');
  const reloadOfficialButton = $('reload-official');
  const clearAllButton = $('clear-all');
  const copyJsonButton = $('copy-json');
  const addVertexButton = $('add-vertex');
  const deleteVertexButton = $('delete-vertex');
  const deleteSelectedPolyButton = $('delete-selected-poly');
  const selectionLabel = $('selection-label');
  const help = $('help');
  const closeHelp = $('close-help');
  const output = $('json-output');

  if (!viewport || !world || !map || !overlay || !status) return;

  let mode = 'pan';
  let activeKind = 'walk';
  let draftKind = 'walk';
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let areas = { walk: [], blocked: [] };
  let draft = [];
  let ready = false;
  let selectedKind = null;
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
  const kindName = (kind) => kind === 'blocked' ? '侵入禁止' : '歩行可能';

  function setStatus(message) { status.textContent = message; }
  function currentPolygons() { return selectedKind ? areas[selectedKind] : null; }
  function currentPoly() {
    const list = currentPolygons();
    return list && selectedPoly >= 0 ? list[selectedPoly] : null;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        walkAreas: areas.walk,
        blockedAreas: areas.blocked,
        draft,
        draftKind,
        activeKind,
      }));
    } catch (error) {
      console.warn('編集内容を保存できませんでした', error);
    }
  }

  function restoreLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.walkAreas) || !Array.isArray(parsed.blockedAreas)) return false;
        areas.walk = parsed.walkAreas;
        areas.blocked = parsed.blockedAreas;
        draft = Array.isArray(parsed.draft) ? parsed.draft : [];
        draftKind = parsed.draftKind === 'blocked' ? 'blocked' : 'walk';
        activeKind = parsed.activeKind === 'blocked' ? 'blocked' : 'walk';
        return true;
      }
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!legacyRaw) return false;
      const legacy = JSON.parse(legacyRaw);
      if (!Array.isArray(legacy.polygons)) return false;
      areas.walk = legacy.polygons;
      areas.blocked = [];
      draft = Array.isArray(legacy.draft) ? legacy.draft : [];
      draftKind = 'walk';
      activeKind = 'walk';
      save();
      return true;
    } catch (error) {
      console.warn('保存データを読み込めませんでした', error);
      return false;
    }
  }

  function normalizeAreas(list) {
    return (list || [])
      .filter((area) => area?.type === 'poly' && Array.isArray(area.points) && area.points.length >= 3)
      .map((area) => area.points.map(([x, y]) => [Number(x), Number(y)]));
  }

  async function loadOfficial({ confirmReplace = false } = {}) {
    if (confirmReplace && !window.confirm('現在の編集内容を破棄してGitHub版を読み込みますか？')) return;
    setStatus('GitHub版を読み込み中…');
    const response = await fetch(`${COLLISION_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('GitHub版の当たり判定を読み込めません');
    const data = await response.json();
    if (data.referenceSize?.width !== REF.width || data.referenceSize?.height !== REF.height) {
      throw new Error('基準サイズが一致しません');
    }
    areas.walk = normalizeAreas(data.walkAreas);
    areas.blocked = normalizeAreas(data.blockedAreas);
    draft = [];
    draftKind = activeKind;
    selectedKind = null;
    selectedPoly = -1;
    selectedVertex = -1;
    addVertexArmed = false;
    save();
    renderOverlay();
    updateSelectionUI();
    updateKindUI();
    setStatus(`GitHub版：歩行 ${areas.walk.length} / 禁止 ${areas.blocked.length} 範囲`);
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
    const vw = Math.max(1, viewport.clientWidth);
    const vh = Math.max(1, viewport.clientHeight);
    zoom = clamp(Math.max(vw / REF.width, vh / REF.height), MIN_ZOOM, MAX_ZOOM);
    panX = (vw - REF.width * zoom) / 2;
    panY = (vh - REF.height * zoom) / 2;
    applyTransform();
    setStatus('全体表示に戻しました');
  }

  function clientToWorld(clientX, clientY) {
    const rect = viewport.getBoundingClientRect();
    return {
      x: clamp((clientX - rect.left - panX) / zoom, 0, REF.width),
      y: clamp((clientY - rect.top - panY) / zoom, 0, REF.height),
    };
  }

  function createSvg(tag, attrs = {}) {
    const node = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    return node;
  }

  function pointString(points) { return points.map(([x, y]) => `${x},${y}`).join(' '); }

  function centroid(points) {
    let x = 0;
    let y = 0;
    for (const p of points) { x += p[0]; y += p[1]; }
    return points.length ? [x / points.length, y / points.length] : [0, 0];
  }

  function pointInPoly(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      const intersects = ((yi > y) !== (yj > y)) &&
        x < ((xj - xi) * (y - yi)) / ((yj - yi) || 0.000001) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function distancePointToSegment(point, a, b) {
    const vx = b[0] - a[0];
    const vy = b[1] - a[1];
    const wx = point.x - a[0];
    const wy = point.y - a[1];
    const len2 = vx * vx + vy * vy || 1;
    const t = clamp((wx * vx + wy * vy) / len2, 0, 1);
    const x = a[0] + vx * t;
    const y = a[1] + vy * t;
    return { distance: Math.hypot(point.x - x, point.y - y), x, y, t };
  }

  function nearestVertex(point) {
    const poly = currentPoly();
    if (!poly) return null;
    const threshold = 24 / zoom;
    let best = null;
    poly.forEach(([x, y], index) => {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance <= threshold && (!best || distance < best.distance)) best = { index, distance };
    });
    return best;
  }

  function nearestEdge(point, poly) {
    if (!poly) return null;
    const threshold = 28 / zoom;
    let best = null;
    for (let i = 0; i < poly.length; i++) {
      const hit = distancePointToSegment(point, poly[i], poly[(i + 1) % poly.length]);
      if (hit.distance <= threshold && (!best || hit.distance < best.distance)) best = { ...hit, index: i };
    }
    return best;
  }

  function findInKind(point, kind) {
    const list = areas[kind];
    for (let i = list.length - 1; i >= 0; i--) {
      if (pointInPoly(point.x, point.y, list[i])) return { kind, index: i };
    }
    let best = null;
    list.forEach((poly, polyIndex) => {
      const edge = nearestEdge(point, poly);
      if (edge && (!best || edge.distance < best.distance)) best = { kind, index: polyIndex, distance: edge.distance };
    });
    return best;
  }

  function findPolygonAt(point) {
    return findInKind(point, activeKind) || findInKind(point, activeKind === 'walk' ? 'blocked' : 'walk');
  }

  function updateSelectionUI() {
    const poly = currentPoly();
    if (!poly) {
      selectionLabel.textContent = '範囲未選択';
      deleteSelectedPolyButton.disabled = true;
      addVertexButton.disabled = true;
      deleteVertexButton.disabled = true;
      return;
    }
    const suffix = selectedVertex >= 0 ? ` / 点 ${selectedVertex + 1}` : '';
    selectionLabel.textContent = `${kindName(selectedKind)} ${selectedPoly + 1} / ${poly.length}点${suffix}`;
    deleteSelectedPolyButton.disabled = false;
    addVertexButton.disabled = false;
    deleteVertexButton.disabled = selectedVertex < 0 || poly.length <= 3;
  }

  function updateKindUI() {
    kindWalk.classList.toggle('active', activeKind === 'walk');
    kindBlocked.classList.toggle('active', activeKind === 'blocked');
    document.body.dataset.areaKind = activeKind;
  }

  function renderArea(points, index, kind) {
    const selected = selectedKind === kind && selectedPoly === index;
    overlay.appendChild(createSvg('polygon', {
      points: pointString(points),
      class: `poly-fill ${kind}${selected ? ' selected' : ''}`,
    }));
    const [cx, cy] = centroid(points);
    const label = createSvg('text', {
      x: cx,
      y: cy,
      class: `index-text ${kind}${selected ? ' selected' : ''}`,
    });
    label.textContent = `${kind === 'blocked' ? 'B' : 'W'}${index + 1}`;
    overlay.appendChild(label);
    if (selected && mode === 'edit') {
      const radius = clamp(8 / zoom, 5, 18);
      points.forEach(([x, y], vertexIndex) => {
        overlay.appendChild(createSvg('circle', {
          cx: x,
          cy: y,
          r: radius,
          class: `vertex ${kind}${vertexIndex === selectedVertex ? ' selected' : ''}`,
        }));
      });
    }
  }

  function renderOverlay() {
    overlay.replaceChildren();
    areas.walk.forEach((points, index) => renderArea(points, index, 'walk'));
    areas.blocked.forEach((points, index) => renderArea(points, index, 'blocked'));
    if (draft.length) {
      overlay.appendChild(createSvg(draft.length >= 3 ? 'polygon' : 'polyline', {
        points: pointString(draft),
        class: `draft-line ${draftKind}`,
      }));
      const radius = clamp(7 / zoom, 4, 18);
      draft.forEach(([x, y]) => overlay.appendChild(createSvg('circle', {
        cx: x,
        cy: y,
        r: radius,
        class: `vertex draft ${draftKind}`,
      })));
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
    if (mode === 'pan') setStatus('移動モード：ドラッグ／ピンチで位置調整');
    else if (mode === 'edit') setStatus('点を修正：範囲を選び、点をドラッグ');
    else setStatus(`${kindName(activeKind)}を新規作成：地図をタップして点を追加`);
  }

  function setKind(kind) {
    if (draft.length) {
      setStatus(`作成途中の${kindName(draftKind)}があります。確定するか「1点戻す」で消してください`);
      return;
    }
    activeKind = kind;
    draftKind = kind;
    updateKindUI();
    renderOverlay();
    setStatus(`${kindName(kind)}を選択しました`);
  }

  function finishPolygon() {
    if (draft.length < 3) return setStatus('3点以上置いてから確定してください');
    areas[draftKind].push(draft.map(([x, y]) => [Math.round(x), Math.round(y)]));
    selectedKind = draftKind;
    selectedPoly = areas[draftKind].length - 1;
    selectedVertex = -1;
    draft = [];
    save();
    renderOverlay();
    updateSelectionUI();
    setStatus(`${kindName(selectedKind)}を追加しました`);
  }

  function addDraftPoint(point) {
    if (draft.length >= 3) {
      const [fx, fy] = draft[0];
      if (Math.hypot(point.x - fx, point.y - fy) <= 28 / zoom) return finishPolygon();
    }
    draft.push([Math.round(point.x), Math.round(point.y)]);
    draftKind = activeKind;
    save();
    renderOverlay();
    setStatus(`${kindName(draftKind)}：${draft.length}点`);
  }

  function selectAt(point) {
    const found = findPolygonAt(point);
    if (!found) {
      selectedKind = null;
      selectedPoly = -1;
      selectedVertex = -1;
      renderOverlay();
      updateSelectionUI();
      setStatus('範囲未選択');
      return false;
    }
    selectedKind = found.kind;
    selectedPoly = found.index;
    selectedVertex = -1;
    activeKind = found.kind;
    updateKindUI();
    renderOverlay();
    updateSelectionUI();
    setStatus(`${kindName(found.kind)} ${found.index + 1} を選択`);
    return true;
  }

  function insertVertexAt(point) {
    const poly = currentPoly();
    if (!poly) return false;
    const edge = nearestEdge(point, poly);
    if (!edge) {
      setStatus('追加したい辺の近くをタップしてください');
      return false;
    }
    poly.splice(edge.index + 1, 0, [Math.round(edge.x), Math.round(edge.y)]);
    selectedVertex = edge.index + 1;
    addVertexArmed = false;
    save();
    renderOverlay();
    updateSelectionUI();
    setStatus('点を追加しました');
    return true;
  }

  function beginPinch() {
    if (pointers.size < 2) return;
    const [a, b] = [...pointers.values()].slice(0, 2);
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    pinchGesture = {
      startDistance: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      startZoom: zoom,
      worldPoint: clientToWorld(midX, midY),
    };
    panGesture = null;
    tapGesture = null;
    vertexDrag = null;
  }

  function updatePinch() {
    if (!pinchGesture || pointers.size < 2) return;
    const [a, b] = [...pointers.values()].slice(0, 2);
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const distance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    zoom = clamp(pinchGesture.startZoom * distance / pinchGesture.startDistance, MIN_ZOOM, MAX_ZOOM);
    const rect = viewport.getBoundingClientRect();
    panX = midX - rect.left - pinchGesture.worldPoint.x * zoom;
    panY = midY - rect.top - pinchGesture.worldPoint.y * zoom;
    applyTransform();
  }

  function pointerDown(event) {
    if (!ready) return;
    event.preventDefault();
    viewport.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) return beginPinch();
    const point = clientToWorld(event.clientX, event.clientY);
    tapGesture = { id: event.pointerId, x: event.clientX, y: event.clientY, point };
    if (mode === 'pan') {
      panGesture = { id: event.pointerId, startX: event.clientX, startY: event.clientY, panX, panY };
      return;
    }
    if (mode === 'edit') {
      if (addVertexArmed && currentPoly()) return void insertVertexAt(point);
      if (currentPoly()) {
        const hit = nearestVertex(point);
        if (hit) {
          selectedVertex = hit.index;
          vertexDrag = { id: event.pointerId };
          renderOverlay();
          updateSelectionUI();
          return;
        }
      }
      selectAt(point);
      const hit = nearestVertex(point);
      if (hit) {
        selectedVertex = hit.index;
        vertexDrag = { id: event.pointerId };
        renderOverlay();
        updateSelectionUI();
      }
    }
  }

  function pointerMove(event) {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      if (!pinchGesture) beginPinch();
      return updatePinch();
    }
    if (panGesture?.id === event.pointerId) {
      panX = panGesture.panX + (event.clientX - panGesture.startX);
      panY = panGesture.panY + (event.clientY - panGesture.startY);
      return applyTransform();
    }
    if (vertexDrag?.id === event.pointerId && currentPoly() && selectedVertex >= 0) {
      const point = clientToWorld(event.clientX, event.clientY);
      currentPoly()[selectedVertex] = [Math.round(point.x), Math.round(point.y)];
      save();
      renderOverlay();
      updateSelectionUI();
    }
  }

  function pointerUp(event) {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    const wasPinching = Boolean(pinchGesture);
    pointers.delete(event.pointerId);
    if (wasPinching) {
      pinchGesture = null;
      if (pointers.size === 1) {
        const [id, point] = [...pointers.entries()][0];
        panGesture = mode === 'pan' ? { id, startX: point.x, startY: point.y, panX, panY } : null;
      }
      return;
    }
    if (vertexDrag?.id === event.pointerId) {
      vertexDrag = null;
      tapGesture = null;
      setStatus('点を移動しました');
      return;
    }
    if (mode === 'draw' && tapGesture?.id === event.pointerId) {
      const moved = Math.hypot(event.clientX - tapGesture.x, event.clientY - tapGesture.y);
      if (moved <= TAP_MOVE_LIMIT) addDraftPoint(clientToWorld(event.clientX, event.clientY));
    }
    panGesture = null;
    tapGesture = null;
  }

  function pointerCancel(event) {
    pointers.delete(event.pointerId);
    if (panGesture?.id === event.pointerId) panGesture = null;
    if (tapGesture?.id === event.pointerId) tapGesture = null;
    if (vertexDrag?.id === event.pointerId) vertexDrag = null;
    if (pointers.size < 2) pinchGesture = null;
  }

  function collisionJson() {
    return JSON.stringify({
      version: 3,
      map: 'star-country-gate-garden',
      referenceSize: { ...REF },
      walkAreas: areas.walk.map((points) => ({ type: 'poly', points })),
      blockedAreas: areas.blocked.map((points) => ({ type: 'poly', points })),
    }, null, 2);
  }

  async function copyJson() {
    const text = collisionJson();
    output.value = text;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        output.hidden = false;
        output.focus();
        output.select();
        document.execCommand('copy');
        output.hidden = true;
      }
      setStatus('JSONをコピーしました');
      copyJsonButton.textContent = 'コピー済み';
      window.setTimeout(() => { copyJsonButton.textContent = 'JSONをコピー'; }, 1400);
    } catch (error) {
      output.hidden = false;
      output.focus();
      output.select();
      setStatus('自動コピーできません。表示したJSONを長押ししてコピーしてください');
    }
  }

  modePan.addEventListener('click', () => setMode('pan'));
  modeEdit.addEventListener('click', () => setMode('edit'));
  modeDraw.addEventListener('click', () => setMode('draw'));
  kindWalk.addEventListener('click', () => setKind('walk'));
  kindBlocked.addEventListener('click', () => setKind('blocked'));
  resetViewButton.addEventListener('click', fitView);
  undoPointButton.addEventListener('click', () => {
    if (!draft.length) return setStatus('戻す点がありません');
    draft.pop();
    save();
    renderOverlay();
    setStatus(`作成中：${draft.length}点`);
  });
  finishPolyButton.addEventListener('click', finishPolygon);
  reloadOfficialButton.addEventListener('click', () => {
    loadOfficial({ confirmReplace: true }).catch((error) => setStatus(error.message));
  });
  clearAllButton.addEventListener('click', () => {
    if (!window.confirm('歩行可能・侵入禁止の全範囲を消去しますか？')) return;
    areas = { walk: [], blocked: [] };
    draft = [];
    selectedKind = null;
    selectedPoly = -1;
    selectedVertex = -1;
    addVertexArmed = false;
    save();
    renderOverlay();
    updateSelectionUI();
    setStatus('全範囲を消去しました');
  });
  copyJsonButton.addEventListener('click', copyJson);
  addVertexButton.addEventListener('click', () => {
    if (!currentPoly()) return;
    setMode('edit');
    addVertexArmed = true;
    setStatus('点を追加したい辺をタップしてください');
  });
  deleteVertexButton.addEventListener('click', () => {
    const poly = currentPoly();
    if (!poly || selectedVertex < 0 || poly.length <= 3) return;
    poly.splice(selectedVertex, 1);
    selectedVertex = -1;
    save();
    renderOverlay();
    updateSelectionUI();
    setStatus('選択点を削除しました');
  });
  deleteSelectedPolyButton.addEventListener('click', () => {
    const list = currentPolygons();
    if (!list || selectedPoly < 0) return;
    if (!window.confirm(`${kindName(selectedKind)} ${selectedPoly + 1} を削除しますか？`)) return;
    list.splice(selectedPoly, 1);
    selectedKind = null;
    selectedPoly = -1;
    selectedVertex = -1;
    addVertexArmed = false;
    save();
    renderOverlay();
    updateSelectionUI();
    setStatus('範囲を削除しました');
  });
  closeHelp.addEventListener('click', () => { help.hidden = true; });

  viewport.addEventListener('pointerdown', pointerDown, { passive: false });
  viewport.addEventListener('pointermove', pointerMove, { passive: false });
  viewport.addEventListener('pointerup', pointerUp, { passive: false });
  viewport.addEventListener('pointercancel', pointerCancel, { passive: false });
  window.addEventListener('resize', () => { if (ready) fitView(); });

  function waitForMap() {
    if (map.complete && map.naturalWidth) return Promise.resolve();
    return new Promise((resolve, reject) => {
      map.addEventListener('load', resolve, { once: true });
      map.addEventListener('error', () => reject(new Error('地図画像を読み込めません')), { once: true });
    });
  }

  async function init() {
    try {
      setStatus('読み込み中…');
      await waitForMap();
      const restored = restoreLocal();
      if (!restored) await loadOfficial();
      updateKindUI();
      updateSelectionUI();
      renderOverlay();
      ready = true;
      fitView();
      setStatus(restored
        ? `保存データ：歩行 ${areas.walk.length} / 禁止 ${areas.blocked.length} 範囲`
        : `GitHub版：歩行 ${areas.walk.length} / 禁止 ${areas.blocked.length} 範囲`);
    } catch (error) {
      console.error(error);
      ready = true;
      fitView();
      setStatus(`読み込みエラー：${error.message}`);
    }
  }

  init();
})();