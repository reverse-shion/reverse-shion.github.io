(function (root) {
  "use strict";
  const layout = root.TarotSceneLayout;
  if (!layout) return;

  // Preview 41+: keep the gate painted into the authored map visible. The
  // standalone high-detail gate remains hidden/mask-only.
  layout.paintBackground = function paintBackground(ctx, background) {
    ctx.clearRect(0, 0, layout.referenceSize.width, layout.referenceSize.height);
    ctx.drawImage(background, 0, 0, layout.referenceSize.width, layout.referenceSize.height);
  };

  // Preview 45: keep the -15px foreground correction around the central route,
  // but close the 15px gap at the far-right world edge.
  layout.paintForeground = function paintForeground(ctx, foreground) {
    const w = layout.referenceSize.width;
    const h = layout.referenceSize.height;
    const dx = layout.foregroundOffset.x;
    const dy = layout.foregroundOffset.y;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(foreground, dx, dy, w, h);

    const gap = Math.max(0, -dx);
    if (!gap) return;

    const blendWidth = Math.max(84, gap * 6);
    const edge = document.createElement("canvas");
    edge.width = w;
    edge.height = h;
    const paint = edge.getContext("2d");

    paint.save();
    paint.beginPath();
    paint.rect(w - blendWidth, 0, blendWidth, h);
    paint.clip();
    paint.drawImage(foreground, 0, dy, w, h);
    paint.globalCompositeOperation = "destination-in";
    const fade = paint.createLinearGradient(w - blendWidth, 0, w, 0);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(0.72, "rgba(0,0,0,0.55)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    paint.fillStyle = fade;
    paint.fillRect(w - blendWidth, 0, blendWidth, h);
    paint.restore();

    ctx.drawImage(edge, 0, 0);
  };

  // Preview 49 depth/collision fix.
  // The foreground is one authored plate, but only a small subset of its
  // pillars and flower fronts used to participate in actor occlusion. That let
  // actors appear on top of banners/crystal pedestals in some places, while
  // disappearing too early beside a blocked area in others.
  const dx = layout.foregroundOffset?.x || 0;
  const dy = layout.foregroundOffset?.y || 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function hasNearbySolid(shape) {
    if (shape.type !== "ellipse") return false;
    return layout.solidBases.some((item) =>
      item.type === "ellipse" &&
      Math.abs(item.cx - shape.cx) < 3 &&
      Math.abs(item.cy - shape.cy) < 3,
    );
  }

  // Make every foreground post/pillar with a crystal or cap physically solid.
  // Previously only four had bases, so several pedestals could be walked on.
  for (const area of layout.occluders) {
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

  // Narrow rear strips derived from the current blocked geometry. Only an actor
  // genuinely behind these structures is masked by foreground alpha. Touching a
  // forbidden edge from the front no longer makes the actor vanish.
  const depthZones = [
    ["east-upper-structure", 867, 217, 1215, 470],
    ["east-mid-structure", 873, 508, 1214, 697],
    ["west-upper-structure", 502, 401, 727, 460],
    ["west-mid-structure", 471, 461, 729, 698],
    ["west-gate-side", 568, 388, 614, 461],
    ["west-gate-approach", 605, 214, 775, 451],
    ["east-gate-approach", 866, 211, 932, 412],
    ["east-gate-side", 988, 367, 1082, 461],
  ];

  const existingIds = new Set(layout.occluders.map((area) => area.id));
  for (const [id, minX, minY, maxX, maxY] of depthZones) {
    const fullId = `depth-${id}`;
    if (existingIds.has(fullId)) continue;

    const visualLeft = Math.max(0, minX + dx - 18);
    const visualTop = Math.max(0, minY + dy - 190);
    const visualRight = Math.min(layout.referenceSize.width, maxX + dx + 18);
    const visualBottom = Math.min(layout.referenceSize.height, maxY + dy + 12);
    const rearTop = Math.max(0, minY + dy - 48);
    const rearBottom = Math.min(layout.referenceSize.height, minY + dy + 12);
    const rearLeft = Math.max(0, minX + dx - 12);
    const rearRight = Math.min(layout.referenceSize.width, maxX + dx + 12);

    const bounds = [
      visualLeft,
      visualTop,
      Math.max(1, visualRight - visualLeft),
      Math.max(1, visualBottom - visualTop),
    ];
    const footArea = layout.rect(
      rearLeft,
      rearTop,
      Math.max(1, rearRight - rearLeft),
      Math.max(1, rearBottom - rearTop),
    );

    layout.occluders.push({
      id: fullId,
      bounds,
      baseline: minY + dy + 10,
      footArea,
      source: "foreground",
      points: layout.rect(...bounds).points,
      rearInset: 6,
      depthFix: true,
    });
  }

  layout.activeOccluders = function activeOccluders(foot, areas = layout.occluders) {
    if (!foot || !Number.isFinite(foot.x) || !Number.isFinite(foot.y)) return [];

    // During collision projection or scripted motion a foot can briefly sit on
    // an exact physical boundary. Keep that ambiguous frame visible.
    if (layout.solidBases.some((shape) => layout.contains(foot, shape))) return [];

    return areas.filter((area) =>
      foot.y < area.baseline - (area.rearInset ?? 4) &&
      layout.contains(foot, area.footArea),
    );
  };

  layout.depthModelVersion = "preview-49";

  // Pin the latest transparent island plate.
  const transparentIslands =
    "https://raw.githubusercontent.com/reverse-shion/tarot-breaker-game/2d8b4cec9b6dbb96f5dc0c4d8412f8a44acae59f/assets/maps/star-country-world-islands.webp";
  const mapLayer = document.getElementById("map-layer");
  if (mapLayer && mapLayer.src !== transparentIslands) mapLayer.src = transparentIslands;
})(window);
