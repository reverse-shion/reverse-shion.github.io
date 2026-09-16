(function (root) {
  "use strict";
  const layout = root.TarotSceneLayout;
  if (!layout) return;

  if (!document.querySelector('link[data-gate-polish="v2"]')) {
    const gatePolish = document.createElement("link");
    gatePolish.rel = "stylesheet";
    gatePolish.href = "./gate-polish.css?v=20260916-gate-polish-v2";
    gatePolish.dataset.gatePolish = "v2";
    document.head.appendChild(gatePolish);
  }

  const REFERENCE = layout.referenceSize;
  const STAIR_TOP_Y = layout.gate?.baseline ?? 242;
  const GATE_CENTER_X = layout.gate?.openingX ?? 800;
  const GATE_LIFT = 32;

  // Normalize old foreground-derived helpers to the native 1448x1086 map axis.
  // Asset selection itself is owned by single-map-occlusion.js; this file must
  // never pin an old ground/foreground WebP again.
  const previousForegroundOffset = {
    x: layout.foregroundOffset?.x || 0,
    y: layout.foregroundOffset?.y || 0,
  };
  const correctionX = -previousForegroundOffset.x;
  const correctionY = -previousForegroundOffset.y;

  function shiftPoints(points, dx, dy) {
    return (points || []).map(([x, y]) => [x + dx, y + dy]);
  }
  function shiftShape(shape, dx, dy) {
    if (!shape) return shape;
    if (shape.type === "ellipse") {
      return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
    }
    return { ...shape, points: shiftPoints(shape.points, dx, dy) };
  }

  for (const area of layout.occluders || []) {
    if (area.source !== "foreground") continue;
    if (Array.isArray(area.bounds)) area.bounds[0] += correctionX;
    area.baseline += correctionY;
    area.footArea = shiftShape(area.footArea, correctionX, correctionY);
    area.points = shiftPoints(area.points, correctionX, correctionY);
  }

  const oldForegroundSolidCenters = new Set(["569,452", "1010,452", "227,438", "1223,528"]);
  for (const shape of layout.solidBases || []) {
    if (shape.type !== "ellipse") continue;
    if (oldForegroundSolidCenters.has(`${shape.cx},${shape.cy}`)) {
      shape.cx += correctionX;
      shape.cy += correctionY;
    }
  }

  layout.foregroundOffset = Object.freeze({ x: 0, y: 0 });

  // Gate and inner light share one centre axis. single-map-occlusion.js repeats
  // these coordinates after it creates a missing public-preview gate node.
  const STAR_GATE_W = 560;
  const STAR_GATE_H = STAR_GATE_W * (1024 / 1536);
  const STAR_GATE_X = GATE_CENTER_X - STAR_GATE_W / 2;
  const STAR_GATE_Y = STAIR_TOP_Y - STAR_GATE_H - GATE_LIFT;

  const INNER_LIGHT_W = 190;
  const INNER_LIGHT_H = INNER_LIGHT_W * (1535 / 1024);
  const INNER_LIGHT_X = GATE_CENTER_X - INNER_LIGHT_W / 2;
  const INNER_LIGHT_Y = STAIR_TOP_Y - INNER_LIGHT_H - GATE_LIFT;

  function placeObject(selector, x, y, width, height) {
    const node = document.querySelector(selector);
    if (!node) return;
    node.dataset.worldX = String(x);
    node.dataset.worldY = String(y);
    node.dataset.worldW = String(width);
    node.dataset.worldH = String(height);
  }

  placeObject(".scene-star-gate", STAR_GATE_X, STAR_GATE_Y, STAR_GATE_W, STAR_GATE_H);
  placeObject(".scene-gate-inner-light", INNER_LIGHT_X, INNER_LIGHT_Y, INNER_LIGHT_W, INNER_LIGHT_H);
  placeObject(".scene-gate-particle", GATE_CENTER_X - 210, STAIR_TOP_Y - 320 - GATE_LIFT, 420, 320);
  placeObject(".scene-gate-event", GATE_CENTER_X - 240, STAIR_TOP_Y - 350 - GATE_LIFT, 480, 350);

  const gateBase = document.querySelector(".scene-gate-base");
  if (gateBase) gateBase.hidden = true;

  layout.gateAssembly = Object.freeze({
    centerX: GATE_CENTER_X,
    baseline: STAIR_TOP_Y,
    lift: GATE_LIFT,
    starGate: Object.freeze({ x: STAR_GATE_X, y: STAR_GATE_Y, w: STAR_GATE_W, h: STAR_GATE_H }),
    innerLight: Object.freeze({ x: INNER_LIGHT_X, y: INNER_LIGHT_Y, w: INNER_LIGHT_W, h: INNER_LIGHT_H }),
    version: "single-map-gate-prep-v3",
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function hasNearbySolid(shape) {
    if (shape.type !== "ellipse") return false;
    return (layout.solidBases || []).some((item) =>
      item.type === "ellipse" &&
      Math.abs(item.cx - shape.cx) < 3 &&
      Math.abs(item.cy - shape.cy) < 3,
    );
  }

  for (const area of layout.occluders || []) {
    if (!/(post|pillar)$/.test(area.id)) continue;
    const [x, , w] = area.bounds;
    const solid = {
      type: "ellipse",
      cx: x + w / 2,
      cy: area.baseline - 4,
      rx: clamp(w * 0.24, 12, 20),
      ry: 10,
      depthFix: area.id,
    };
    if (!hasNearbySolid(solid)) layout.solidBases.push(solid);
  }

  layout.depthModelVersion = "single-map-prep-v3";
  layout.artworkPlacement = Object.freeze({
    ...(layout.artworkPlacement || {}),
    foreground: Object.freeze({ mode: "native-reference-1to1", x: 0, y: 0, w: REFERENCE.width, h: REFERENCE.height }),
    gate: layout.gateAssembly,
  });
  layout.artworkModelVersion = "single-map-prep-v3";
})(window);
