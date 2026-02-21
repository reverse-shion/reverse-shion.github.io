// /di/js/result/config.js
export const CFG = Object.freeze({
  VERSION: "1.4.1",

  // DOM
  ROOT_ACTIVE_CLASS: "tb-active",
  APP_CUT_CLASS: "tb-result-active",
  SHELL_CLASS: "tbResultOverlayShell",

  // Overlay root (body直下に作る)
   OVERLAY_ID: "result",

  // Assets
  EYE_IMAGE_URL: "/di/dico_eye_result.png",

  // Behavior
  NAME_CALL_THRESHOLD: 50,
  COUNTUP_FRAMES: 56,

  // Eye image tuning
  EYE_BG_SIZE: 190,
  EYE_BG_POS_X: 37,
  EYE_BG_POS_Y: 33,

  // ARU visibility controls
  ARU: Object.freeze({
    TINT_MIN: 0.24,
    TINT_MAX: 0.72,
    TINT_GLOW_WEIGHT: 0.46,

    GAUGE_INSET_PCT: 12.5,
    GAUGE_THICKNESS_PCT: 3.6,
    GAUGE_BG_ALPHA: 0.34,

    GAUGE_ALPHA_BASE: 0.98,
    GAUGE_INNER_GLOW_PX: 8,
    GAUGE_GLOW_BASE_PX: 14,
    GAUGE_GLOW_MAX_PX: 36,

    BLOOM_ALPHA_BASE: 0.14,
    BLOOM_ALPHA_WEIGHT: 0.72,

    PULSE_MIN: 0.94,
    PULSE_MAX: 1.10,
  }),
});
