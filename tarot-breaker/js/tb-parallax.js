window.TB?.ready(() => {
  const layers = Array.from(document.querySelectorAll("[data-parallax]"));
  if (!layers.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  if (prefersReducedMotion) {
    layers.forEach((layer) => {
      layer.style.transform = "";
    });
    return;
  }

  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = null;

  const MAX_SHIFT = isCoarsePointer ? 10 : 18;
  const LERP = isCoarsePointer ? 0.08 : 0.12;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const scheduleUpdate = () => {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(update);
  };

  const update = () => {
    rafId = null;

    currentX += (targetX - currentX) * LERP;
    currentY += (targetY - currentY) * LERP;

    layers.forEach((layer) => {
      const depth = Number(layer.dataset.parallax || 0.1);
      const moveX = currentX * depth * MAX_SHIFT;
      const moveY = currentY * depth * MAX_SHIFT;

      layer.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
    });

    const stillMoving =
      Math.abs(targetX - currentX) > 0.001 ||
      Math.abs(targetY - currentY) > 0.001;

    if (stillMoving) {
      scheduleUpdate();
    }
  };

  const setTargetFromClientPoint = (clientX, clientY) => {
    const x = (clientX / window.innerWidth - 0.5) * 2;
    const y = (clientY / window.innerHeight - 0.5) * 2;

    targetX = clamp(x, -1, 1);
    targetY = clamp(y, -1, 1);
    scheduleUpdate();
  };

  const resetToCenter = () => {
    targetX = 0;
    targetY = 0;
    scheduleUpdate();
  };

  const handleMouseMove = (event) => {
    setTargetFromClientPoint(event.clientX, event.clientY);
  };

  const handleTouchMove = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    setTargetFromClientPoint(touch.clientX, touch.clientY);
  };

  const handleOrientation = (event) => {
    if (typeof event.gamma !== "number" || typeof event.beta !== "number") return;

    const x = clamp(event.gamma / 18, -1, 1);
    const y = clamp(event.beta / 24, -1, 1);

    targetX = x;
    targetY = y;
    scheduleUpdate();
  };

  window.addEventListener("mousemove", handleMouseMove, { passive: true });
  window.addEventListener("mouseleave", resetToCenter, { passive: true });
  window.addEventListener("touchmove", handleTouchMove, { passive: true });
  window.addEventListener("touchend", resetToCenter, { passive: true });

  if (isCoarsePointer && "DeviceOrientationEvent" in window) {
    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
  }

  window.addEventListener(
    "pagehide",
    () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    },
    { once: true }
  );
});
