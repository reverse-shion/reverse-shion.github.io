(() => {
  'use strict';

  const layer = document.getElementById('map-layer');
  const parts = Array.isArray(window.__TB_MAP_FIXED_PARTS) ? window.__TB_MAP_FIXED_PARTS : [];
  if (!layer || parts.length !== 4 || !parts.every(Boolean)) return;

  const data = parts.join('');
  if (data.length < 10000) return;

  const test = new Image();
  test.onload = () => {
    if (test.naturalWidth === 1448 && test.naturalHeight === 1086) {
      layer.src = test.src;
      layer.dataset.hdOverride = 'ok';
    }
  };
  test.onerror = () => {
    layer.dataset.hdOverride = 'failed';
  };
  test.src = `data:image/avif;base64,${data}`;
})();
