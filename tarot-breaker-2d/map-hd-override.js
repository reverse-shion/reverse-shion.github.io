(() => {
  'use strict';

  const layer = document.getElementById('map-layer');
  const parts = Array.isArray(window.__TB_MAP_FIXED_PARTS) ? window.__TB_MAP_FIXED_PARTS : [];
  const debug = new URLSearchParams(location.search).get('debug') === '1';

  function badge(text, ok) {
    if (!debug) return;
    let el = document.getElementById('hd-map-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'hd-map-status';
      el.style.cssText = 'position:absolute;left:10px;top:118px;z-index:35;padding:5px 8px;border-radius:7px;background:rgba(5,8,24,.78);color:#fff;font:11px/1.4 ui-monospace,monospace;pointer-events:none;';
      document.getElementById('game-shell')?.appendChild(el);
    }
    el.textContent = text;
    el.style.border = `1px solid ${ok ? '#65e5a4' : '#ff7d8b'}`;
  }

  if (!layer || parts.length !== 4 || !parts.every(Boolean)) {
    badge('HD override: DATA MISSING', false);
    return;
  }

  const data = parts.join('');
  if (data.length < 10000) {
    badge(`HD override: DATA SHORT ${data.length}`, false);
    return;
  }

  badge(`HD override: loading ${data.length}`, true);
  const test = new Image();
  test.onload = () => {
    if (test.naturalWidth === 1448 && test.naturalHeight === 1086) {
      layer.src = test.src;
      layer.dataset.hdOverride = 'ok';
      badge('HD override: OK 1448x1086', true);
    } else {
      badge(`HD override: SIZE ${test.naturalWidth}x${test.naturalHeight}`, false);
    }
  };
  test.onerror = () => {
    layer.dataset.hdOverride = 'failed';
    badge('HD override: DECODE FAILED', false);
  };
  test.src = `data:image/avif;base64,${data}`;
})();
