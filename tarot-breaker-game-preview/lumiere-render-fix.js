(() => {
  "use strict";

  // PUBLIC PREVIEW 48 hotfix.
  // The game renderer normalizes Lumiere's hover frames onto an offscreen
  // canvas. The original body-core replacement was calibrated for the down
  // sheet only. Reusing that replacement while she faces up/left/right draws a
  // second cropped head/torso fragment that bobs together with the sprite.
  // Keep the directional frame intact for those three directions while leaving
  // the established down-facing correction untouched.
  const proto = window.CanvasRenderingContext2D?.prototype;
  if (!proto || proto.__tarotLumiereSingleFrameFix) return;

  const nativeDrawImage = proto.drawImage;
  const nativeClearRect = proto.clearRect;
  const compositeState = new WeakMap();
  const near = (value, expected) => Math.abs(Number(value) - expected) < 0.01;

  function lumiereDirection(image) {
    const src = String(image?.currentSrc || image?.src || "");
    const match = src.match(/lumiere_hover_(down|up|left|right)\.png(?:\?|$)/);
    return match?.[1] || null;
  }

  proto.drawImage = function (...args) {
    const direction = lumiereDirection(args[0]);

    if (direction && args.length === 9) {
      const sourceW = args[3];
      const sourceH = args[4];
      const destX = args[5];
      const destY = args[6];
      const destW = args[7];
      const destH = args[8];

      if (direction !== "down") {
        // First pass: remember that this offscreen canvas is composing a
        // non-down Lumiere frame. The pass itself must still draw normally.
        if (
          near(destX, 0) &&
          near(destY, 0) &&
          near(destW, 493) &&
          near(destH, 596)
        ) {
          compositeState.set(this, { direction });
        }

        // Old second pass: do not paste frame-0 body/head material over a
        // directional frame. Removing this is what eliminates the duplicate
        // cropped head seen during hover bobbing.
        if (near(sourceW, 243) && near(sourceH, 564)) {
          const state = compositeState.get(this);
          if (state?.direction === direction) {
            compositeState.delete(this);
            return;
          }
        }
      } else {
        compositeState.delete(this);
      }
    }

    return nativeDrawImage.apply(this, args);
  };

  proto.clearRect = function (...args) {
    const state = compositeState.get(this);
    if (
      state?.direction !== "down" &&
      args.length === 4 &&
      near(args[0], 129) &&
      near(args[1], 32) &&
      near(args[2], 243) &&
      near(args[3], 564)
    ) {
      // Preserve the complete single directional frame; the matching legacy
      // body-core draw is suppressed by the drawImage hook above.
      return;
    }
    return nativeClearRect.apply(this, args);
  };

  Object.defineProperty(proto, "__tarotLumiereSingleFrameFix", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });

  window.__tarotLumiereRenderFix = "preview-48";
})();
