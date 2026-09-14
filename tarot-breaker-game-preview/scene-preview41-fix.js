(function (root) {
  "use strict";
  const layout = root.TarotSceneLayout;
  if (!layout) return;

  // Preview 41+: keep the gate painted into the authored map visible. The
  // standalone high-detail gate remains hidden/mask-only; do not erase the
  // authored gate from the split background/foreground canvases.
  layout.paintBackground = function paintBackground(ctx, background) {
    ctx.clearRect(0, 0, layout.referenceSize.width, layout.referenceSize.height);
    ctx.drawImage(background, 0, 0, layout.referenceSize.width, layout.referenceSize.height);
  };

  // Preview 45: keep the -15px foreground correction around the central route,
  // but close the 15px gap it creates at the far-right world edge. The old gap
  // exposed the unshifted lower plate and looked like a second map strip was
  // pasted on top. Crossfade only the far-right edge back to the authored
  // foreground position so the boundary closes without a hard vertical seam.
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

  // Pin the latest user-uploaded transparent island plate instead of the older
  // white-backed copy that Preview 40 referenced through its feature commit.
  const transparentIslands =
    "https://raw.githubusercontent.com/reverse-shion/tarot-breaker-game/2d8b4cec9b6dbb96f5dc0c4d8412f8a44acae59f/assets/maps/star-country-world-islands.webp";
  const mapLayer = document.getElementById("map-layer");
  if (mapLayer && mapLayer.src !== transparentIslands) mapLayer.src = transparentIslands;
})(window);
