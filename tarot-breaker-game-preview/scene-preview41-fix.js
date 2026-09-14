(function (root) {
  "use strict";
  const layout = root.TarotSceneLayout;
  if (!layout) return;

  // Preview 41: keep the gate painted into the authored map visible. The
  // standalone high-detail gate remains hidden/mask-only; do not erase the
  // authored gate from the split background/foreground canvases.
  layout.paintBackground = function paintBackground(ctx, background) {
    ctx.clearRect(0, 0, layout.referenceSize.width, layout.referenceSize.height);
    ctx.drawImage(background, 0, 0, layout.referenceSize.width, layout.referenceSize.height);
  };

  layout.paintForeground = function paintForeground(ctx, foreground) {
    ctx.clearRect(0, 0, layout.referenceSize.width, layout.referenceSize.height);
    ctx.drawImage(
      foreground,
      layout.foregroundOffset.x,
      layout.foregroundOffset.y,
      layout.referenceSize.width,
      layout.referenceSize.height
    );
  };

  // Pin the latest user-uploaded transparent island plate instead of the older
  // white-backed copy that Preview 40 referenced through its feature commit.
  const transparentIslands =
    "https://raw.githubusercontent.com/reverse-shion/tarot-breaker-game/2d8b4cec9b6dbb96f5dc0c4d8412f8a44acae59f/assets/maps/star-country-world-islands.webp";
  const mapLayer = document.getElementById("map-layer");
  if (mapLayer && mapLayer.src !== transparentIslands) mapLayer.src = transparentIslands;
})(window);
