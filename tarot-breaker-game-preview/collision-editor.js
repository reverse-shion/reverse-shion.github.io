(() => {
  'use strict';

  const REF = { width: 1448, height: 1086 };
  const STORAGE_KEY = 'tarot-breaker-star-gate-collision-v3';
  const LEGACY_STORAGE_KEY = 'tarot-breaker-star-gate-collision-v2';
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
  const kindWalk = document.getElementById('kind-walk');
  const kindBlocked = document.getElementById('kind-blocked');
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
  const kindName = kind => kind === 'blocked' ? 'ä¾µå…¥ç¦æ­¢' : 'æ­©è¡Œå¯èƒ½';

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
      console.warn('ä¿å­˜ã§ãã¾ã›ã‚“ã§ã—ãŸ', error);
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
      console.warn('ä¿å­˜ãƒ‡ãƒ¼ã‚¿ã‚’èª­ã¿è¾¼ã‚ã¾ã›ã‚“ã§ã—ãŸ', error);
      return false;
    }
  }

  function normalizeAreas(list) {
    return (list || [])
      .filter(area => area.type === 'poly' && Array.isArray(area.points) && area.points.length >= 3)
      .map(area => area.points.map(([x, y]) => [Number(x), Number(y)]));
  }

  async function loadOfficial({ confirmReplace = false } = {}) {
    if (confirmReplace && !confirm('ç¾åœ¨ã®ç·¨é›†å†…å®¹ã‚’ç ´æ£„ã—ã¦GitHubç‰ˆã‚’èª­ã¿è¾¼ã¿ã¾ã™ã‹ï¼Ÿ')) return;
    const response = await fetch(COLLISION_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('GitHubç‰ˆã®å½“ãŸã‚Šåˆ¤å®šã‚’èª­ã¿è¾¼ã‚ã¾ã›ã‚“');
    const data = await response.json();
    if (data.referenceSize?.width !== REF.width || data.referenceSize?.height !== REF.height)
      throw new Error('åŸºæº–ã‚µã‚¤ã‚ºãŒä¸€è‡´ã—ã¾ã›ã‚“');

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
    setStatus(`GitHubç‰ˆï¼šæ­©è¡Œ${areas.walk.length} / ç¦æ­¢${areas.blocked.length} ç¯„å›²`);
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
    setStatus('å…¨ä½“ã‚’è¡¨ç¤ºã—ã¾ã—ãŸ');
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

  function nearestVertex(point) {
    const poly = currentPoly();
    if (!poly) return null;
    const threshold = 22 / zoom;
    let best = null;
    poly.forEach(([x, y], index) => {
      const d = Math.hypot(point.x - x, point.y - y);
      if (d <= threshold && (!best || d < best.distance)) best = { index, distance: d };
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
      for (let i = 0; i < poly.length; i++) {
        const hit = distancePointToSegment(point, poly[i], poly[(i + 1) % poly.length]);
        if (hit.distance <= 18 / zoom && (!best || hit.distance < best.distance))
          best = { kind, index: polyIndex, distance: hit.distance };
      }
    });
    return best;
  }

  function findPolygonAt(point) {
    return findInKind(point, activeKind) || findInKind(point, activeKind === 'walk' ? 'blocked' : 'walk');
  }

  function updateSelectionUI() {
    const poly = currentPoly();
    if (!poly) {
      selectionLabel.textContent = 'ç¯„å›³æœªé¸æŠ';
      deleteSelectedPolyButton.disabled = true;
      addVertexButton.disabled = true;
      deleteVertexButton.disabled = true;
      return;
    }
    const suffix = selectedVertex >= 0 ? ` / ç‚¹${selectedVertex + 1}` : '';
    selectionLabel.textContent = `${kindName(selectedKind)} ${selectedPoly + 1} / ${poly.length}ç‚¹$ {suffix}`;
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
    const kind = kindName(activeKind);
    setStatus(mode === 'pan'
      ? 'ç§»å‹•ãƒ¢ãƒ¼ãƒ‰ï¼šãƒ‰ãƒ©ãƒƒã‚³ï¼ãƒ”ãƒ³ãƒã§ä½ç½®èª¾æ•´'
      : mode === 'edit'
        ? 'ä¿®æ­£ãƒ¢ãƒ¼ãƒ‰ã€šç¶²ã¾ãŸã¯é™«,â€§ç¯„å›²ã‚’é¸æŠã—ã¦ç‚¹ã‚’ãƒ‰ãƒ©ãƒƒã‚°'
        : `${kind}ã‚’æ–°è¤ä½œæˆï¼š${draft.length}ç‚¹ï¼ ã‚¿ãƒƒãƒ—ã§è¿½åŠ `);
  }

  function setKind(kind) {
    if (draft.length) {
      setStatus(bä½œæˆé€”ä¸­ã®${kindName(draftKind)}ãŒã‚ã‚Šã¾ã™ã€‚ç¢ºå®šã¾ãŸã¯ã€Œ1è§æ›³ã‚‹æˆ»ã™ã€ã§æ¶‹ã—ã¦ã‹ã‚‰åˆ‡ã‚‹æ‰¸ã‹ã¦ãã ã•ã„`);
      return;
    }
    activeKind = kind;
    draftKind = kind;
    updateKindUI();
    renderOverlay();
    setStatus(`${kindName(kind)}ï¼Š${kind === 'walk' ? 'ç¶²' : 'èµ§'}ã‚’é¸æŠã—ã¾ã—ãŸ`);
  }

  function finishPolygon() {
    if (draft.length < 3) return setStatus('3ç‚¹å†…ä¸Šç½®ã„ã¦è®‚»ÿ³óÏšÂG–Ò¿_›?ƒWŸdœ¤ì(€€€½¹ÍĞ±¥ÍĞ€ô…É•…Ím‘É…™Ñ-¥¹‘tì(€€€±¥ÍĞ¹ÁÕÍ ¡‘É…™Ğ¹µ…À ¡mà°åt¤€ôøm5…Ñ ¹É½Õ¹¡à¤°5…Ñ ¹É½Õ¹¡ä¥t¤¤ì(€€€Í•±•Ñ•‘-¥¹€ô‘É…™Ñ-¥¹ì(€€€Í•±•Ñ•‘A½±ä€ô±¥ÍĞ¹±•¹Ñ €´€Äì(€€€Í•±•Ñ•‘Y•ÉÑ•à€ô€´Äì(€€€½¹ÍĞ½µÁ±•Ñ•‘-¥¹€ô‘É…™Ñ-¥¹ì(€€€‘É…™Ğ€ômtì(€€€‘É…™Ñ-¥¹€ô…Ñ¥Ù•-¥¹ì(€€€Í…Ù” ¤ì(€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€ÕÁ‘…Ñ•M•±•Ñ¥½¹U$ ¤ì(€€€Í•ÑMÑ…ÑÕÌ¡‹šZÃ_‘í­¥¹‘9…µ”¡½µÁ±•Ñ•‘-¥¹¥ôƒ
£«
ˆ€‘íÍ•±•Ñ•‘A½±ä€¬€Åôƒ
K¢ş÷–*ƒ_û_}€¤ì(€ô((€™Õ¹Ñ¥½¸…‘‘É…™ÑA½¥¹Ğ¡±¥•¹Ñ`°±¥•¹Ñd¤ì(€€€½¹ÍĞÁ½¥¹Ğ€ô±¥•¹ÑQ½]½É±¡±¥•¹Ñ`°±¥•¹Ñd¤ì(€€€¥˜€ …‘É…™Ğ¹±•¹Ñ ¤‘É…™Ñ-¥¹€ô…Ñ¥Ù•-¥¹ì(€€€¥˜€¡‘É…™Ğ¹±•¹Ñ €øô€Ì¤ì(€€€€€½¹ÍĞm™à°™åt€ô‘É…™ÑlÁtì(€€€€€¥˜€¡5…Ñ ¹¡åÁ½Ğ¡Á½¥¹Ğ¹à€´™à°Á½¥¹Ğ¹ä€´™ä¤€¨é½½´€ğô€ÈĞ¤É•ÑÕÉ¸™¥¹¥Í¡A½±å½¸ ¤ì(€€€ô(€€€‘É…™Ğ¹ÁÕÍ ¡m5…Ñ ¹É½Õ¹¡Á½¥¹Ğ¹à¤°5…Ñ ¹É½Õ¹¡Á½¥¹Ğ¹ä¥t¤ì(€€€Í…Ù” ¤ì(€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€Í•ÑMÑ…ÑÕÌ¡€‘í­¥¹‘9…µ”¡‘É…™Ñ-¥¹¥ôè‘í‘É…™Ğ¹±•¹Ñ¡÷
ç€¤ì(€ô((€™Õ¹Ñ¥½¸¥¹Í•ÉÑY•ÉÑ•áĞ¡Á½¥¹Ğ¤ì(€€€½¹ÍĞÁ½±ä€ôÕÉÉ•¹ÑA½±ä ¤ì(€€€¥˜€ …Á½±ä¤É•ÑÕÉ¸Í•ÑMÑ…ÑÕÌ Ÿ–#¯’ş»š¶g
/¾–nË
K¦ãš*{_›?ƒWœ¤ì(€€€±•Ğ‰•ÍĞ€ô¹Õ±°ì(€€€™½È€¡±•Ğ¤€ô€Àì¤€ğÁ½±ä¹±•¹Ñ ì¤¬¬¤ì(€€€€€½¹ÍĞ¡¥Ğ€ô‘¥ÍÑ…¹•A½¥¹ÑQ½M•µ•¹Ğ¡Á½¥¹Ğ°Á½±åm¥t°Á½±ål¡¤€¬€Ä¤€”Á½±ä¹±•¹Ñ¡t¤ì(€€€€€¥˜€ …‰•ÍĞñğ¡¥Ğ¹‘¥ÍÑ…¹”€ğ‰•ÍĞ¹‘¥ÍÑ…¹”¤‰•ÍĞ€ôì€¸¸¹¡¥Ğ°•‘•%¹‘•àè¤ôì(€€€ô(€€€¥˜€ …‰•ÍĞñğ‰•ÍĞ¹‘¥ÍÑ…¹”€ø€ĞÔ€¼é½½´¤É•ÑÕÉ¸Í•ÑMÑ…ÑÕÌ Ÿ¦ãš*{_¾–nË»¢úë»¢şG?
K
ÿ__›?ƒWœ¤ì(€€€Á½±ä¹ÍÁ±¥”¡‰•ÍĞ¹•‘•%¹‘•à€¬€Ä°€À°m5…Ñ ¹É½Õ¹¡Á½¥¹Ğ¹à¤°5…Ñ ¹É½Õ¹¡Á½¥¹Ğ¹ä¥t¤ì(€€€Í•±•Ñ•‘Y•ÉÑ•à€ô‰•ÍĞ¹•‘•%¹‘•à€¬€Äì(€€€…‘‘Y•ÉÑ•áÉµ•€ô™…±Í”ì(€€€Í…Ù” ¤ì(€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€ÕÁ‘…Ñ•M•±•Ñ¥½¹U$ ¤ì(€€€Í•ÑMÑ…ÑÕÌ¡‹
ç
K¢ş÷–*ƒ_û_|€¼€‘í­¥¹‘9…µ”¡Í•±•Ñ•‘-¥¹¥ô‘íÍ•±•Ñ•‘A½±ä€¬€Åõ€¤ì(€ô((€™Õ¹Ñ¥½¸‘¥ÍÑ…¹”¡„°ˆ¤ìÉ•ÑÕÉ¸5…Ñ ¹¡åÁ½Ğ¡ˆ¹à€´„¹à°ˆ¹ä€´„¹ä¤ìô(€™Õ¹Ñ¥½¸µ¥‘Á½¥¹Ğ¡„°ˆ¤ìÉ•ÑÕÉ¸ìàè€¡„¹à€¬ˆ¹à¤€¼€È°äè€¡„¹ä€¬ˆ¹ä¤€¼€Èôìô((€™Õ¹Ñ¥½¸‰•¥¹A¥¹  ¤ì(€€€¥˜€¡Á½¥¹Ñ•ÉÌ¹Í¥é”€ğ€È¤É•ÑÕÉ¸ì(€€€½¹ÍĞm„°‰t€ôl¸¸¹Á½¥¹Ñ•ÉÌ¹Ù…±Õ•Ì ¥t¹Í±¥” À°€È¤ì(€€€½¹ÍĞµ¥€ôµ¥‘Á½¥¹Ğ¡„°ˆ¤ì(€€€Á¥¹¡•ÍÑÕÉ”€ôì(€€€€€ÍÑ…ÉÑ¥ÍÑ…¹”è5…Ñ ¹µ…à Ä°‘¥ÍÑ…¹”¡„°ˆ¤¤°(€€€€€ÍÑ…ÉÑi½½´èé½½´°(€€€€€…¹¡½Èè±¥•¹ÑQ½]½É±¡µ¥¹à°µ¥¹ä¤°(€€€ôì(€€€Á…¹•ÍÑÕÉ”€ô¹Õ±°ì(€€€Ñ…Á•ÍÑÕÉ”€ô¹Õ±°ì(€€€Ù•ÉÑ•áÉ…œ€ô¹Õ±°ì(€ô((€Ù¥•İÁ½ÉĞ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È Á½¥¹Ñ•É‘½İ¸œ°•Ù•¹Ğ€ôøì(€€€¥˜€ …É•…‘ä¤É•ÑÕÉ¸ì(€€€Ù¥•İÁ½ÉĞ¹Í•ÑA½¥¹Ñ•É…ÁÑÕÉ”ü¸¡•Ù•¹Ğ¹Á½¥¹Ñ•É%¤ì(€€€Á½¥¹Ñ•ÉÌ¹Í•Ğ¡•Ù•¹Ğ¹Á½¥¹Ñ•É%°ìàè•Ù•¹Ğ¹±¥•¹Ñ`°äè•Ù•¹Ğ¹±¥•¹Ñdô¤ì(€€€¥˜€¡Á½¥¹Ñ•ÉÌ¹Í¥é”€øô€È¤ì‰•¥¹A¥¹  ¤ì•Ù•¹Ğ¹ÁÉ•Ù•¹Ñ•™…Õ±Ğ ¤ìÉ•ÑÕÉ¸ìô((€€€¥˜€¡µ½‘”€ôôô€Á…¸œ¤ì(€€€€€Á…¹•ÍÑÕÉ”€ôìàè•Ù•¹Ğ¹±¥•¹Ñ`°äè•Ù•¹Ğ¹±¥•¹Ñd°Á…¹`°Á…¹dôì(€€€€€Ù¥•İÁ½ÉĞ¹ÍÑå±”¹ÕÉÍ½È€ô€É…‰‰¥¹œœì(€€€ô•±Í”¥˜€¡µ½‘”€ôôô€•‘¥Ğœ¤ì(€€€€€½¹ÍĞÁ½¥¹Ğ€ô±¥•¹ÑQ½]½É±¡•Ù•¹Ğ¹±¥•¹Ñ`°•Ù•¹Ğ¹±¥•¹Ñd¤ì(€€€€€¥˜€¡…‘‘Y•ÉÑ•áÉµ•¤ì(€€€€€€€Ñ…Á•ÍÑÕÉ”€ôìàè•Ù•¹Ğ¹±¥•¹Ñ`°äè•Ù•¹Ğ¹±¥•¹Ñd°…Ñ¥½¸è€…‘µÙ•ÉÑ•àœôì(€€€€€ô•±Í”ì(€€€€€€€½¹ÍĞÙ•ÉÑ•à€ô¹•…É•ÍÑY•ÉÑ•à¡Á½¥¹Ğ¤ì(€€€€€€€¥˜€¡Ù•ÉÑ•à¤ì(€€€€€€€€€Í•±•Ñ•‘Y•ÉÑ•à€ôÙ•ÉÑ•à¹¥¹‘•àì(€€€€€€€€€Ù•ÉÑ•áÉ…œ€ôìÁ½¥¹Ñ•É%è•Ù•¹Ğ¹Á½¥¹Ñ•É%ôì(€€€€€€€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€€€€€€€ÕÁ‘…Ñ•M•±•Ñ¥½¹U$ ¤ì(€€€€€€€ô•±Í”ì(€€€€€€€€€Ñ…Á•ÍÑÕÉ”€ôìàè•Ù•¹Ğ¹±¥•¹Ñ`°äè•Ù•¹Ğ¹±¥•¹Ñd°…Ñ¥½¸è€Í•±•Ğœôì(€€€€€€€ô(€€€€€ô(€€€ô•±Í”ì(€€€€€Ñ…Á•ÍÑÕÉ”€ôìàè•Ù•¹Ğ¹±¥•¹Ñ`°äè•Ù•¹Ğ¹±¥•¹Ñd°…Ñ¥½¸è€‘É…Üœôì(€€€ô(€€€•Ù•¹Ğ¹ÁÉ•Ù•¹Ñ•™…Õ±Ğ ¤ì(€ô°ìÁ…ÍÍ¥Ù”è™…±Í”ô¤ì((€Ù¥•İÁ½ÉĞ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È Á½¥¹Ñ•Éµ½Ù”œ°•Ù•¹Ğ€ôøì(€€€¥˜€ …Á½¥¹Ñ•ÉÌ¹¡…Ì¡•Ù•¹Ğ¹Á½¥¹Ñ•É%¤¤É•ÑÕÉ¸ì(€€€Á½¥¹Ñ•ÉÌ¹Í•Ğ¡•Ù•¹Ğ¹Á½¥¹Ñ•É%°ìàè•Ù•¹Ğ¹±¥•¹Ñ`°äè•Ù•¹Ğ¹±¥•¹Ñdô¤ì(€€€¥˜€¡Á½¥¹Ñ•ÉÌ¹Í¥é”€øô€È¤ì(€€€€€¥˜€ …Á¥¹¡•ÍÑÕÉ”¤‰•¥¹A¥¹  ¤ì(€€€€€½¹ÍĞm„°‰t€ôl¸¸¹Á½¥¹Ñ•ÉÌ¹Ù…±Õ•Ì ¥t¹Í±¥” À°€È¤ì(€€€€€½¹ÍĞµ¥€ôµ¥‘Á½¥¹Ğ¡„°ˆ¤ì(€€€€€½¹ÍĞÉ…Ñ¥¼€ô‘¥ÍÑ…¹”¡„°ˆ¤€¼Á¥¹¡•ÍÑÕÉ”¹ÍÑ…ÉÑ¥ÍÑ…¹”ì(€€€€€é½½´€ô±…µÀ¡Á¥¹¡•ÍÑÕÉ”¹ÍÑ…ÉÑi½½´€¨É…Ñ¥¼°5%9}i==4°5a}i==4¤ì(€€€€€Á…¹`€ôµ¥¹à€´Á¥¹¡•ÍÑÕÉ”¹…¹¡½È¹à€¨é½½´ì(€€€€€Á…¹d€ôµ¥¹ä€´Á¥¹¡•ÍÑÕÉ”¹…¹¡½È¹ä€¨é½½´ì(€€€€€…ÁÁ±åQÉ…¹Í™½É´ ¤ì(€€€€€•Ù•¹Ğ¹ÁÉ•Ù•¹Ñ•™…Õ±Ğ ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€¥˜€¡µ½‘”€ôôô€Á…¸œ€˜˜Á…¹•ÍÑÕÉ”¤ì(€€€€€Á…¹`€ôÁ…¹•ÍÑÕÉ”¹Á…¹`€¬€¡•Ù•¹Ğ¹±¥•¹Ñ`€´Á…¹•ÍÑÕÉ”¹à¤ì(€€€€€Á…¹d€ôÁ…¹•ÍÑÕÉ”¹Á…¹d€¬€¡•Ù•¹Ğ¹±¥•¹Ñd€´Á…¹•ÍÑÕÉ”¹ä¤ì(€€€€€…ÁÁ±åQÉ…¹Í™½É´ ¤ì(€€€ô•±Í”¥˜€¡µ½‘”€ôôô€•‘¥Ğœ€˜˜Ù•ÉÑ•áÉ…œ€˜˜Ù•ÉÑ•áÉ…œ¹Á½¥¹Ñ•É%€ôôô•Ù•¹Ğ¹Á½¥¹Ñ•É%€˜˜Í•±•Ñ•‘Y•ÉÑ•à€øô€À¤ì(€€€€€½¹ÍĞÁ½±ä€ôÕÉÉ•¹ÑA½±ä ¤ì(€€€€€¥˜€¡Á½±ä¤ì(€€€€€€€½¹ÍĞÁ½¥¹Ğ€ô±¥•¹ÑQ½]½É±¡•Ù•¹Ğ¹±¥•¹Ñ`°•Ù•¹Ğ¹±¥•¹Ñd¤ì(€€€€€€€Á½±åmÍ•±•Ñ•‘Y•ÉÑ•át€ôm5…Ñ ¹É½Õ¹¡Á½¥¹Ğ¹à¤°5…Ñ ¹É½Õ¹¡Á½¥¹Ğ¹ä¥tì(€€€€€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€€€ô(€€€ô(€€€•Ù•¹Ğ¹ÁÉ•Ù•¹Ñ•™…Õ±Ğ ¤ì(€ô°ìÁ…ÍÍ¥Ù”è™…±Í”ô¤ì((€™Õ¹Ñ¥½¸•¹‘A½¥¹Ñ•È¡•Ù•¹Ğ¤ì(€€€¥˜€ …Á½¥¹Ñ•ÉÌ¹¡…Ì¡•Ù•¹Ğ¹Á½¥¹Ñ•É%¤¤É•ÑÕÉ¸ì(€€€¥˜€¡Ù•ÉÑ•áÉ…œ€˜˜Ù•ÉÑ•áÉ…œ¹Á½¥¹Ñ•É%€ôôô•Ù•¹Ğ¹Á½¥¹Ñ•É%¤ì(€€€€€Ù•ÉÑ•áÉ…œ€ô¹Õ±°ì(€€€€€Í…Ù” ¤ì(€€€€€Í•ÑMÑ…ÑÕÌ¡ƒ’â·šZ’îÛ¢ö³š*”€¼€‘í­¥¹‘9…µ”¡Í•±•Ñ•‘-¥¹¥ô‘íÍ•±•Ñ•‘A½±ä€¬€Åõ€¤ì(€€€ô•±Í”¥˜€¡Ñ…Á•ÍÑÕÉ”€˜˜Á½¥¹Ñ•ÉÌ¹Í¥é”€ôôô€Ä¤ì(€€€€€½¹ÍĞµ½Ù•€ô5…Ñ ¹¡åÁ½Ğ¡•Ù•¹Ğ¹±¥•¹Ñ`€´Ñ…Á•ÍÑÕÉ”¹à°•Ù•¹Ğ¹±¥•¹Ñd€´Ñ…Á•ÍÑÕÉ”¹ä¤ì(€€€€€¥˜€¡µ½Ù•€ğ€ÄÈ¤ì(€€€€€€€½¹ÍĞÁ½¥¹Ğ€ô±¥•¹ÑQ½]½É±¡•Ù•¹Ğ¹±¥•¹Ñ`°•Ù•¹Ğ¹±¥•¹Ñd¤ì(€€€€€€€¥˜€¡Ñ…Á•ÍÑÕÉ”¹…Ñ¥½¸€ôôô€‘É…Üœ¤…‘‘É…™ÑA½¥¹Ğ¡•Ù•¹Ğ¹±¥•¹Ñ`°•Ù•¹Ğ¹±¥•¹Ñd¤ì(€€€€€€€¥˜€¡Ñ…Á•ÍÑÕÉ”¹…Ñ¥½¸€ôôô€…‘µÙ•ÉÑ•àœ¤¥¹Í•ÉÑY•ÉÑ•áĞ¡Á½¥¹Ğ¤ì(€€€€€€€¥˜€¡Ñ…Á•ÍÑÕÉ”¹…Ñ¥½¸€ôôô€Í•±•Ğœ¤ì(€€€€€€€€€½¹ÍĞ™½Õ¹€ô™¥¹‘A½±å½¹Ğ¡Á½¥¹Ğ¤ì(€€€€€€€€€¥˜€¡™½Õ¹¤ì(€€€€€€€€€€€Í•±•Ñ•‘-¥¹€ô™½Õ¹¹­¥¹ì(€€€€€€€€€€€Í•±•Ñ•‘A½±ä€ô™½Õ¹¹¥¹‘•àì(€€€€€€€€€€€Í•±•Ñ•‘Y•ÉÑ•à€ô€´Äì(€€€€€€€€€€€…Ñ¥Ù•-¥¹€ô™½Õ¹¹­¥¹ì(€€€€€€€€€€€ÕÁ‘…Ñ•-¥¹‘U$ ¤ì(€€€€€€€€€€€Í•ÑMÑ…ÑÕÌ¡€‘í­¥¹‘9…µ”¡™½Õ¹¹­¥¹¥ô€‘í™½Õ¹¹¥¹‘•à€¬€Åôƒ
K¦ãš.y€¤ì(€€€€€€€€€ô•±Í”ì(€€€€€€€€€€€Í•±•Ñ•‘-¥¹€ô¹Õ±°ì(€€€€€€€€€€€Í•±•Ñ•‘A½±ä€ô€´Äì(€€€€€€€€€€€Í•±•Ñ•‘Y•ÉÑ•à€ô€´Äì(€€€€€€€€€€€Í•ÑMÑ…ÑÕÌ Ÿ¾–nÏ–’[¦R3Ÿdœ¤ì(€€€€€€€€€ô(€€€€€€€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€€€€€€€ÕÁ‘…Ñ•M•±•Ñ¥½¹U$ ¤ì(€€€€€€€ô(€€€€€ô(€€€ô((€€€Á½¥¹Ñ•ÉÌ¹‘•±•Ñ”¡•Ù•¹Ğ¹Á½¥¹Ñ•É%¤ì(€€€¥˜€¡Á½¥¹Ñ•ÉÌ¹Í¥é”€ğ€È¤Á¥¹¡•ÍÑÕÉ”€ô¹Õ±°ì(€€€¥˜€¡Á½¥¹Ñ•ÉÌ¹Í¥é”€ôôô€À¤ì(€€€€€Á…¹•ÍÑÕÉ”€ô¹Õ±°ì(€€€€€Ñ…Á•ÍÑÕÉ”€ô¹Õ±°ì(€€€€€Ù¥•İÁ½ÉĞ¹ÍÑå±”¹ÕÉÍ½È€ôµ½‘”€ôôô€Á…¸œ€ü€É…ˆœ€è€É½ÍÍ¡…¥Èœì(€€€ô(€€€•Ù•¹Ğ¹ÁÉ•Ù•¹Ñ•™…Õ±Ğ ¤ì(€ô((€Ù¥•İÁ½ÉĞ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È Á½¥¹Ñ•ÉÕÀœ°•¹‘A½¥¹Ñ•È°ìÁ…ÍÍ¥Ù”è™…±Í”ô¤ì(€Ù¥•İÁ½ÉĞ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È Á½¥¹Ñ•É…¹•°œ°•¹‘A½¥¹Ñ•È°ìÁ…ÍÍ¥Ù”è™…±Í”ô¤ì(€Ù¥•İÁ½ÉĞ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È İ¡••°œ°•Ù•¹Ğ€ôøì(€€€¥˜€ …É•…‘ä¤É•ÑÕÉ¸ì(€€€½¹ÍĞ…¹¡½È€ô±¥•¹ÑQ½]½É±¡•Ù•¹Ğ¹±¥•¹Ñ`°•Ù•¹Ğ¹±¥•¹Ñd¤ì(€€€é½½´€ô±…µÀ¡é½½´€¨€¡•Ù•¹Ğ¹‘•±Ñ…d€ğ€À€ü€Ä¸ÄÈ€è€À¸àä¤°5%9}i==4°5a}i==4¤ì(€€€½¹ÍĞÉ•Ğ€ôÙ¥•İÁ½ÉĞ¹•Ñ	½Õ¹‘¥¹±¥•¹ÑI•Ğ ¤ì(€€€Á…¹`€ô•Ù•¹Ğ¹±¥•¹Ñ`€´É•Ğ¹±•™Ğ€´…¹¡½È¹à€¨é½½´ì(€€€Á…¹d€ô•Ù•¹Ğ¹±¥•¹Ñd€´É•Ğ¹Ñ½À€´…¹¡½È¹ä€¨é½½´ì(€€€…ÁÁ±åQÉ…¹Í™½É´ ¤ì(€€€•Ù•¹Ğ¹ÁÉ•Ù•¹Ñ•™…Õ±Ğ ¤ì(€ô°ìÁ…ÍÍ¥Ù”è™…±Í”ô¤ì((€µ½‘•A…¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøÍ•Ñ5½‘” Á…¸œ¤¤ì(€µ½‘•‘¥Ğ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøÍ•Ñ5½‘” •‘¥Ğœ¤¤ì(€µ½‘•É…Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøÍ•Ñ5½‘” ‘É…Üœ¤¤ì(€­¥¹‘]…±¬¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøÍ•Ñ-¥¹ İ…±¬œ¤¤ì(€­¥¹‘	±½­•¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøÍ•Ñ-¥¹ ‰±½­•œ¤¤ì(€É•Í•ÑY¥•İ	ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°™¥ÑY¥•Ü¤ì((€Õ¹‘½A½¥¹Ñ	ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøì(€€€¥˜€ …‘É…™Ğ¹±•¹Ñ ¤É•ÑÕÉ¸Í•ÑMÑ…ÑÕÌ Ÿš’³–’7’ösš"C’â·»
ç3
+ûo
OŸdœ¤ì(€€€‘É…™Ğ¹Á½À ¤ì(€€€¥˜€ …‘É…™Ğ¹±•¹Ñ ¤‘É…™Ñ-¥¹€ô…Ñ¥Ù•-¥¹ì(€€€Í…Ù” ¤ì(€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€Í•ÑMÑ…ÑÕÌ¡€Ç¢šnÏ
/š"ï_û_|€¼ƒšº×
(‘í‘É…™Ğ¹±•¹Ñ¡û
ç€¤ì(€ô¤ì(€™¥¹¥Í¡A½±å	ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°™¥¹¥Í¡A½±å½¸¤ì((€…‘‘Y•ÉÑ•á	ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøì(€€€¥˜€ …ÕÉÉ•¹ÑA½±ä ¤¤É•ÑÕÉ¸Í•ÑMÑ…ÑÕÌ Ÿ–#¯’ş»š¶g
/¾–nË
K¦ãš.c_›?ƒWúœ¤ì(€€€…‘‘Y•ÉÑ•áÉµ•€ôÑÉÕ”ì(€€€Í•±•Ñ•‘Y•ÉÑ•à€ô€´Äì(€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€ÕÁ‘…Ñ•M•±•Ñ¥½¹U$ ¤ì(€€€Í•ÑMÑ…ÑÕÌ Ÿ
ç
K¢ş÷–*ƒ_¢úç»’ö7ö»
K
ÿ__›?ƒWŸdœ¤ì(€ô¤ì((€‘•±•Ñ•Y•ÉÑ•á	ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøì(€€€½¹ÍĞÁ½±ä€ôÕÉÉ•¹ÑA½±ä ¤ì(€€€¥˜€ …Á½±äñğÍ•±•Ñ•‘Y•ÉÑ•à€ğ€À¤É•ÑÕÉ¸Í•ÑMÑ…ÑÕÌ Ÿ–&+¦f“g
/
ç
K¦ãš.c_›?ƒWúœ¤ì(€€€¥˜€¡Á½±ä¹±•¹Ñ €ğô€Ì¤É•ÑÕÉ¸Í•ÑMÑ…ÑÕÌ œÏ
ç’î—’â/¯¿Ÿ7ûo
O¾–nËS£–&+¦f“_›?ƒWœ¤ì(€€€Á½±ä¹ÍÁ±¥”¡Í•±•Ñ•‘Y•ÉÑ•à°€Ä¤ì(€€€Í•±•Ñ•‘Y•ÉÑ•à€ô€´Äì(€€€Í…Ù” ¤ì(€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€ÕÁ‘…Ñ•M•±•Ñ¥½¹U$ ¤ì(€€€Í•ÑMÑ…ÑÕÌ¡ƒ
ç
K–&+¦f“_û_|€¼€‘í­¥¹‘9…µ”¡Í•±•Ñ•‘-¥¹¥ô‘íÍ•±•Ñ•‘A½±ä€¬€Åõ€¤ì(€ô¤ì((€‘•±•Ñ•M•±•Ñ•‘A½±å	ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøì(€€€½¹ÍĞÁ½±ä€ôÕÉÉ•¹ÑA½±ä ¤ì(€€€¥˜€ …Á½±ä¤É•ÑÕÉ¸ì(€€€¥˜€ …½¹™¥É´¡€‘í­¥¹‘9…µ”¡Í•±•Ñ•‘-¥¹¥ô€‘íÍ•±•Ñ•‘A½±ä€¬€Åôƒ
K–&+¦f“_ûg/¾ò}€¤¤É•ÑÕÉ¸ì(€€€…É•…ÍmÍ•±•Ñ•‘-¥¹‘t¹ÍÁ±¥”¡Í•±•Ñ•‘A½±ä°€Ä¤ì(€€€½¹ÍĞÉ•µ½Ù•‘-¥¹€ôÍ•±•Ñ•‘-¥¹ì(€€€Í•±•Ñ•‘-¥¹€ô¹Õ±°ì(€€€Í•±•Ñ•‘A½±ä€ô€´Äì(€€€Í•±•Ñ•‘Y•ÉÑ•à€ô€´Äì(€€€Í…Ù” ¤ì(€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€ÕÁ‘…Ñ•M•±•Ñ¥½¹U$ ¤ì(€€€Í•ÑMÑ…ÑÕÌ¡€‘í­¥¹‘9…µ”¡É•µ½Ù•‘-¥¹¥÷
K–&+¦f“_û_}€¤ì(€ô¤ì((€É•±½…‘=™™¥¥…±	ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøì(€€€±½…‘=™™¥¥…°¡ì½¹™¥ÉµI•Á±…”èÑÉÕ”ô¤¹…Ñ ¡•ÉÉ½È€ôøÍ•ÑMÑ…ÑÕÌ¡•ÉÉ½È¹µ•ÍÍ…”¤¤ì(€ô¤ì((€±•…É±±	ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøì(€€€¥˜€ …½¹™¥É´ Ÿš¶§¢†3–>¿¢÷
£«
‹£’ú×–—ššº×
£«
‹
Kgç›šÚ/_ûg/¾ò|œ¤¤É•ÑÕÉ¸ì(€€€…É•…Ì€ôìİ…±¬èmt°‰±½­•èmtôì(€€€‘É…™Ğ€ômtì(€€€Í•±•Ñ•‘-¥¹€ô¹Õ±°ì(€€€Í•±•Ñ•‘A½±ä€ô€´Äì(€€€Í•±•Ñ•‘Y•ÉÑ•à€ô€´Äì(€€€Í…Ù” ¤ì(€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€ÕÁ‘…Ñ•M•±•Ñ¥½¹U$ ¤ì(€€€Í•ÑMÑ…ÑÕÌ Ÿgç›šÚ/–:ï_û_|œ¤ì(€ô¤ì((€™Õ¹Ñ¥½¸•áÁ½ÉÑA…å±½… ¤ì(€€€½¹ÍĞÍ•É¥…±¥é”€ô±¥ÍĞ€ôø±¥ÍĞ¹µ…À¡Á½¥¹ÑÌ€ôø€¡ì(€€€€€ÑåÁ”è€Á½±äœ°(€€€€€Á½¥¹ÑÌèÁ½¥¹ÑÌ¹µ…À ¡mà°åt¤€ôøm5…Ñ ¹É½Õ¹¡à¤°5…Ñ ¹É½Õ¹¡ä¥t¤°(€€€ô¤¤ì(€€€É•ÑÕÉ¸ì(€€€€€Ù•ÉÍ¥½¸è€È°(€€€€€µ…Àè€ÍÑ…Èµ½Õ¹ÑÉäµ…Ñ”µ…É‘•¸œ°(€€€€€É•™•É•¹•M¥é”èìİ¥‘Ñ èI¹İ¥‘Ñ °¡•¥¡ĞèI¹¡•¥¡Ğô°(€€€€€İ…±­É•…ÌèÍ•É¥…±¥é”¡…É•…Ì¹İ…±¬¤°(€€€€€‰±½­•‘É•…ÌèÍ•É¥…±¥é”¡…É•…Ì¹‰±½­•¤°(€€€ôì(€ô((€½Áå)Í½¹	ÕÑÑ½¸¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°…Íå¹Œ€ ¤€ôøì(€€€¥˜€¡‘É…™Ğ¹±•¹Ñ ¤É•ÑÕÉ¸Í•ÑMÑ…ÑÕÌ¡ƒ’ösš"C¦S’â·»‘í­¥¹‘9…µ”¡‘É…™Ñ-¥¹¥÷3
+ûg‚ë–ºk_›/
'
ÏSó_›?ƒW€¤ì(€€€¥˜€ ……É•…Ì¹İ…±¬¹±•¹Ñ ¤É•ÑÕÉ¸Í•ÑMÑ…ÑÕÌ Ÿš¶§¢†3–>¿¢÷
£«
‹3
+ûo
OŸdœ¤ì(€€€½¹ÍĞÑ•áĞ€ô)M=8¹ÍÑÉ¥¹¥™ä¡•áÁ½ÉÑA…å±½… ¤°¹Õ±°°€È¤ì(€€€ÑÉäì(€€€€€…İ…¥Ğ¹…Ù¥…Ñ½È¹±¥Á‰½…É¹İÉ¥Ñ•Q•áĞ¡Ñ•áĞ¤ì(€€€€€Í•ÑMÑ…ÑÕÌ¡)M=;
K
ÏSó_û_|€¼ƒš¶§¢†0‘í…É•…Ì¹İ…±¬¹±•¹Ñ¡÷ïšš¶ˆ‘í…É•…Ì¹‰±½­•¹±•¹Ñ¡õ€¤ì(€€€ô…Ñ €¡•ÉÉ½È¤ì(€€€€€½ÕÑÁÕĞ¹¡¥‘‘•¸€ô™…±Í”ì(€€€€€½ÕÑÁÕĞ¹Ù…±Õ”€ôÑ•áĞì(€€€€€½ÕÑÁÕĞ¹™½ÕÌ ¤ì(€€€€€½ÕÑÁÕĞ¹Í•±•Ğ ¤ì(€€€€€Í•ÑMÑ…ÑÕÌ Ÿ¢†£’ë_})M=;
K¦Vßš.ó_Ÿ
ÏSó_›?ƒWúœ¤ì(€€€ô(€ô¤ì((€½ÕÑÁÕĞ¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰±ÕÈœ°€ ¤€ôøì½ÕÑÁÕĞ¹¡¥‘‘•¸€ôÑÉÕ”ìô¤ì(€±½Í•!•±À¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±¥¬œ°€ ¤€ôøì¡•±À¹¡¥‘‘•¸€ôÑÉÕ”ìô¤ì(€İ¥¹‘½Ü¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È É•Í¥é”œ°€ ¤€ôøì¥˜€¡É•…‘ä¤™¥ÑY¥•Ü ¤ìô¤ì((€…Íå¹Œ™Õ¹Ñ¥½¸¥¹¥Ğ ¤ì(€€€ÑÉäì(€€€€€½¹ÍĞÉ•ÍÑ½É•€ôÉ•ÍÑ½É•1½…° ¤ì(€€€€€¥˜€ …É•ÍÑ½É•¤…İ…¥Ğ±½…‘=™™¥¥…° ¤ì(€€€€€É•¹‘•É=Ù•É±…ä ¤ì(€€€€€ÕÁ‘…Ñ•M•±•Ñ¥½¹U$ ¤ì(€€€€€ÕÁ‘…Ñ•-¥¹‘U$ ¤ì(€€€€€½¹ÍĞ½¹I•…‘ä€ô€ ¤€ôøì(€€€€€€€É•…‘ä€ôÑÉÕ”ì(€€€€€€€™¥ÑY¥•Ü ¤ì(€€€€€€€Í•Ñ5½‘” Á…¸œ¤ì(€€€€€€€Í•ÑMÑ…ÑÕÌ¡É•ÍÑ½É•(€€€€€€€€€€üƒŞ£¦nS’â·ó
ÿ¾òkš¶§¢†0‘í…É•…Ì¹İ…±¬¹±•¹Ñ¡ô€¼ƒšš¶ˆ‘í…É•…Ì¹‰±½­•¹±•¹Ñ¡õ€(€€€€€€€€€€è¥Ñ!Õ‹&#¾òkš¶§¢†0‘í…É•…Ì¹İ…±¬¹±•¹Ñ¡ô€¼ƒšš¶ˆ‘í…É•…Ì¹‰±½­•¹±•¹Ñ¡õ€¤ì(€€€€€ôì(€€€€€¥˜€¡µ…À¹½µÁ±•Ñ”€˜˜µ…À¹¹…ÑÕÉ…±]¥‘Ñ ¤½¹I•…‘ä ¤ì(€€€€€•±Í”ì(€€€€€€€µ…À¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ±½…œ°½¹I•…‘ä°ì½¹”èÑÉÕ”ô¤ì(€€€€€€€µ…À¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È •ÉÉ½Èœ°€ ¤€ôøÍ•ÑMÑ…ÑÕÌ Ÿ{SRï–?
K¢ª·ÿ¢úó
ûo
OŸ_|œ¤°ì½¹”èÑÉÕ”ô¤ì(€€€€€ô(€€€ô…Ñ €¡•ÉÉ½È¤ì(€€€€€½¹Í½±”¹•ÉÉ½È¡•ÉÉ½È¤ì(€€€€€Í•ÑMÑ…ÑÕÌ¡•ÉÉ½È¹µ•ÍÍ…”¤ì(€€€ô(€ô((€¥¹¥Ğ ¤ì)ô¤ ¤ì(