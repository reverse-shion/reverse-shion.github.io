(() => {
  'use strict';

  const REF = { width: 1448, height: 1086 };
  const STORAGE_KEY = 'tarot-breaker-star-gate-depth-v1';
  const DEPTH_URL = './star-country-gate-garden-depth.json';
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
  const kindBehind = $('kind-behind');
  const kindBackground = $('kind-background');
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
  const toolsToggle = $('editor-tools-toggle');
  const labelToggle = $('label-toggle');

  if (!viewport || !world || !map || !overlay || !status) return;

  let mode = 'pan';
  let activeKind = 'behind';
  let draftKind = 'behind';
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let areas = { behind: [], background: [] };
  let draft = [];
  let selectedKind = null;
  let selectedPoly = -1;
  let selectedVertex = -1;
  let addVertexArmed = false;
  let toolsOpen = false;
  let labelsAll = false;

  const pointers = new Map();
  let panGesture = null;
  let tapGesture = null;
  let pinchGesture = null;
  let vertexDrag = null;

  const svgNS = 'http://www.w3.org/2000/svg';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const kindName = (kind) => kind === 'background' ? '背景扱い' : '前景の裏を通る';
  const setStatus = (message) => { status.textContent = message; };

  function currentPolygons() { return selectedKind ? areas[selectedKind] : null; }
  function currentPoly() {
    const list = currentPolygons();
    return list && selectedPoly >= 0 ? list[selectedPoly] : null;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        behindForegroundAreas: areas.behind,
        backgroundAreas: areas.background,
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
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.behindForegroundAreas) || !Array.isArray(parsed.backgroundAreas)) return false;
      areas.behind = parsed.behindForegroundAreas;
      areas.background = parsed.backgroundAreas;
      draft = Array.isArray(parsed.draft) ? parsed.draft : [];
      draftKind = parsed.draftKind === 'background' ? 'background' : 'behind';
      activeKind = parsed.activeKind === 'background' ? 'background' : 'behind';
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
    const response = await fetch(`${DEPTH_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('GitHub版の前後関係データを読み込めません');
    const data = await response.json();
    if (data.referenceSize?.width !== REF.width || data.referenceSize?.height !== REF.height) {
      throw new Error('基準サイズが一致しません');
    }
    areas.behind = normalizeAreas(data.behindForegroundAreas);
    areas.background = normalizeAreas(data.backgroundAreas);
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
    setStatus(`GitHub版：裏通過 ${areas.behind.length} / 背景 ${areas.background.length} 範囲`);
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

  const pointString = (points) => points.map(([x, y]) => `${x},${y}`).join(' ');

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
    return findInKind(point, activeKind) || findInKind(point, activeKind === 'behind' ? 'background' : 'behind');
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
    kindBehind.classList.toggle('active', activeKind === 'behind');
    kindBackground.classList.toggle('active', activeKind === 'background');
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
    label.textContent = `${kind === 'background' ? 'BG' : 'F'}${index + 1}`;
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
    areas.behind.forEach((points, index) => renderArea(points, index, 'behind'));
    areas.background.forEach((points, index) => renderArea(points, index, 'background'));
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
        class: `vertex ${draftKind}`,
      })));
    }
  }

  function setMode(nextMode) {
    mode = nextMode;
    document.body.dataset.editorMode = mode;
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
      if (Math.hypot(point.x - fx, point.y - fy) <= 26 / zoom) return finishPolygon();
    }
    draft.push([Math.round(point.x), Math.round(point.y)]);
    draftKind = activeKind;
    save();
    renderOverlay();
    setStatus(`${kindName(draftKind)}：${draft.length}点`);
  }

  function selectAt(point) {
    const hit = findPolygonAt(point);
    if (!hit) {
      selectedKind = null; selectedPoly = -1; selectedVertex = -1;
      renderOverlay(); updateSelectionUI();
      setStatus('範囲未選択');
      return;
    }
    selectedKind = hit.kind;
    selectedPoly = hit.index;
    activeKind = hit.kind;
    selectedVertex = -1;
    updateKindUI();
    renderOverlay();
    updateSelectionUI();
    setStatus(`${kindName(hit.kind)} ${hit.index + 1} を選択`);
  }

  function buildJson() {
    return JSON.stringify({
      version: 1,
      map: 'star-country-gate-garden',
      referenceSize: { width: REF.width, height: REF.height },
      behindForegroundAreas: areas.behind.map((points) => ({ type: 'poly', points })),
      backgroundAreas: areas.background.map((points) => ({ type: 'poly', points })),
    }, null, 2);
  }

  async function copyJson() {
    const text = buildJson();
    output.value = text;
    try {
      await navigator.clipboard.writeText(text);
      setStatus('JSONをコピーしました。このチャットへ貼ってください');
    } catch {
      output.hidden = false;
      output.select();
      document.execCommand('copy');
      output.hidden = true;
      setStatus('JSONをコピーしました。このチャットへ貼ってください');
    }
  }

  function setTools(open) {
    toolsOpen = open;
    document.body.classList.toggle('tools-collapsed', !open);
    toolsToggle.setAttribute('aria-expanded', String(open));
    toolsToggle.textContent = open ? '閉じる' : '編集';
  }

  function toggleLabels() {
    labelsAll = !labelsAll;
    document.body.classList.toggle('labels-all', labelsAll);
    labelToggle.setAttribute('aria-pressed', String(labelsAll));
    labelToggle.textContent = labelsAll ? '番号：すべて' : '番号：選択のみ';
  }

  function pointerDistance(a, b) { return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
  function pointerMid(a, b) { return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }; }

  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    viewport.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const mid = pointerMid(a, b);
      pinchGesture = {
        distance: pointerDistance(a, b), zoom,
        world: clientToWorld(mid.x, mid.y),
      };
      panGesture = null; tapGesture = null; vertexDrag = null;
      return;
    }

    const point = clientToWorld(event.clientX, event.clientY);
    if (mode === 'edit' && currentPoly()) {
      const vertex = nearestVertex(point);
      if (vertex) {
        selectedVertex = vertex.index;
        vertexDrag = { pointerId: event.pointerId };
        updateSelectionUI(); renderOverlay();
        return;
      }
    }

    tapGesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, point };
    if (mode === 'pan') panGesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX, panY };
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (pinchGesture && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const mid = pointerMid(a, b);
      const nextZoom = clamp(pinchGesture.zoom * pointerDistance(a, b) / Math.max(1, pinchGesture.distance), MIN_ZOOM, MAX_ZOOM);
      const rect = viewport.getBoundingClientRect();
      zoom = nextZoom;
      panX = mid.x - rect.left - pinchGesture.world.x * zoom;
      panY = mid.y - rect.top - pinchGesture.world.y * zoom;
      applyTransform();
      return;
    }

    if (vertexDrag?.pointerId === event.pointerId && mode === 'edit') {
      const poly = currentPoly();
      if (!poly || selectedVertex < 0) return;
      const point = clientToWorld(event.clientX, event.clientY);
      poly[selectedVertex] = [Math.round(point.x), Math.round(point.y)];
      save(); renderOverlay(); updateSelectionUI();
      return;
    }

    if (panGesture?.pointerId === event.pointerId && mode === 'pan') {
      panX = panGesture.panX + event.clientX - panGesture.x;
      panY = panGesture.panY + event.clientY - panGesture.y;
      applyTransform();
    }
  });

  function endPointer(event) {
    const wasTap = tapGesture?.pointerId === event.pointerId &&
      Math.hypot(event.clientX - tapGesture.x, event.clientY - tapGesture.y) <= TAP_MOVE_LIMIT;
    const point = clientToWorld(event.clientX, event.clientY);

    if (wasTap && !pinchGesture) {
      if (mode === 'draw') addDraftPoint(point);
      else if (mode === 'edit') {
        if (addVertexArmed && currentPoly()) {
          const edge = nearestEdge(point, currentPoly());
          if (edge) {
            currentPoly().splice(edge.index + 1, 0, [Math.round(edge.x), Math.round(edge.y)]);
            selectedVertex = edge.index + 1;
            addVertexArmed = false;
            save(); renderOverlay(); updateSelectionUI();
            setStatus('辺に点を追加しました');
          } else setStatus('選択中の範囲の辺をタップしてください');
        } else selectAt(point);
      }
    }

    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchGesture = null;
    if (panGesture?.pointerId === event.pointerId) panGesture = null;
    if (tapGesture?.pointerId === event.pointerId) tapGesture = null;
    if (vertexDrag?.pointerId === event.pointerId) vertexDrag = null;
  }

  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', endPointer);
  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    const before = clientToWorld(event.clientX, event.clientY);
    const rect = viewport.getBoundingClientRect();
    zoom = clamp(zoom * Math.exp(-event.deltaY * 0.001), MIN_ZOOM, MAX_ZOOM);
    panX = event.clientX - rect.left - before.x * zoom;
    panY = event.clientY - rect.top - before.y * zoom;
    applyTransform();
  }, { passive: false });

  modePan.addEventListener('click', () => setMode('pan'));
  modeEdit.addEventListener('click', () => setMode('edit'));
  modeDraw.addEventListener('click', () => setMode('draw'));
  kindBehind.addEventListener('click', () => setKind('behind'));
  kindBackground.addEventListener('click', () => setKind('background'));
  resetViewButton.addEventListener('click', fitView);
  toolsToggle.addEventListener('click', () => setTools(!toolsOpen));
  labelToggle.addEventListener('click', toggleLabels);
  closeHelp.addEventListener('click', () => { help.hidden = true; });
  undoPointButton.addEventListener('click', () => {
    if (!draft.length) return setStatus('作成途中の点はありません');
    draft.pop(); save(); renderOverlay(); setStatus('1点戻しました');
  });
  finishPolyButton.addEventListener('click', finishPolygon);
  reloadOfficialButton.addEventListener('click', () => loadOfficial({ confirmReplace: true }).catch((error) => setStatus(error.message)));
  clearAllButton.addEventListener('click', () => {
    if (!window.confirm('前後関係の指定をすべて消去しますか？')) return;
    areas = { behind: [], background: [] };
    draft = [];
    selectedKind = null; selectedPoly = -1; selectedVertex = -1;
    save(); renderOverlay(); updateSelectionUI();
    setStatus('すべて消去しました');
  });
  copyJsonButton.addEventListener('click', copyJson);
  addVertexButton.addEventListener('click', () => {
    if (!currentPoly()) return;
    addVertexArmed = true;
    setMode('edit');
    setStatus('選択中の範囲の辺をタップすると点を追加します');
  });
  deleteVertexButton.addEventListener('click', () => {
    const poly = currentPoly();
    if (!poly || selectedVertex < 0 || poly.length <= 3) return;
    poly.splice(selectedVertex, 1);
    selectedVertex = -1;
    save(); renderOverlay(); updateSelectionUI();
    setStatus('選択点を削除しました');
  });
  deleteSelectedPolyButton.addEventListener('click', () => {
    const list = currentPolygons();
    if (!list || selectedPoly < 0) return;
    list.splice(selectedPoly, 1);
    selectedKind = null; selectedPoly = -1; selectedVertex = -1;
    save(); renderOverlay(); updateSelectionUI();
    setStatus('範囲を削除しました');
  });

  window.addEventListener('resize', fitView);

  Promise.resolve(map.complete ? map : new Promise((resolve, reject) => {
    map.addEventListener('load', resolve, { once: true });
    map.addEventListener('error', () => reject(new Error('地図を読み込めません')), { once: true });
  })).then(async () => {
    const restored = restoreLocal();
    if (!restored) await loadOfficial();
    else {
      updateKindUI(); renderOverlay();
      setStatus(`端末保存：裏通過 ${areas.behind.length} / 背景 ${areas.background.length} 範囲`);
    }
    fitView();
    setMode('pan');
    setTools(false);
    updateSelectionUI();
  }).catch((error) => setStatus(error.message));
})();
