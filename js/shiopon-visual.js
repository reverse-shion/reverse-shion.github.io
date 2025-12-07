// ============================================================
//  Shiopon Companion System v2.0
//  --- VISUAL MODULE（見た目・アニメーション制御）---
// ============================================================

(() => {
  const ASSET_BASE = "/assets/shiopon/";
  const BUST   = ASSET_BASE + "bust/";
  const TOGGLE = ASSET_BASE + "toggle/";
  const MINI   = ASSET_BASE + "mini/";

  // DOMキャッシュ
  let bustLayers = null;
  let toggleLayers = null;
  let miniShadow = null;
  let miniBody = null;

  // アイドルタイマー
  let blinkBustTimer = null;
  let blinkToggleTimer = null;
  let earBustTimer = null;
  let earToggleTimer = null;

  // ------------------------------------------------------------
  // 初期化：DOM & 画像セット & アイドル開始
  // ------------------------------------------------------------
  function init() {
    const panel = document.getElementById("shiopon-panel");
    const toggle = document.getElementById("shiopon-toggle");
    if (!panel || !toggle) return;

    bustLayers = {
      shadow:    panel.querySelector(".sp-layer.sp-shadow"),
      ear:       panel.querySelector(".sp-layer.sp-ear"),
      body:      panel.querySelector(".sp-layer.sp-body"),
      faceExtra: panel.querySelector(".sp-layer.sp-face-extra"),
      eyes:      panel.querySelector(".sp-layer.sp-eyes"),
      mouth:     panel.querySelector(".sp-layer.sp-mouth"),
      avatar:    panel.querySelector(".sp-avatar")
    };

    miniShadow = panel.querySelector(".sp-mini-shadow");
    miniBody   = panel.querySelector(".sp-mini-body");

    toggleLayers = {
      shadow: toggle.querySelector(".sp-toggle-layer.sp-toggle-shadow"),
      ear:    toggle.querySelector(".sp-toggle-layer.sp-toggle-ear"),
      base:   toggle.querySelector(".sp-toggle-layer.sp-toggle-base"),
      eyes:   toggle.querySelector(".sp-toggle-layer.sp-toggle-eyes"),
      mouth:  toggle.querySelector(".sp-toggle-layer.sp-toggle-mouth")
    };

    setupImages();
    preloadImages();
    setupIdleAnimations();
  }

  // ------------------------------------------------------------
  // 画像セット
  // ------------------------------------------------------------
  function setupImages() {
    if (bustLayers?.shadow)
      bustLayers.shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
    if (bustLayers?.body)
      bustLayers.body.style.backgroundImage   = `url(${BUST}body_base.png)`;
    if (bustLayers?.ear)
      bustLayers.ear.style.backgroundImage    = `url(${BUST}ear_neutral.png)`;
    if (bustLayers?.eyes)
      bustLayers.eyes.style.backgroundImage   = `url(${BUST}eyes_open.png)`;
    if (bustLayers?.mouth)
      bustLayers.mouth.style.backgroundImage  = `url(${BUST}mouth_close.png)`;
    if (bustLayers?.faceExtra) {
      bustLayers.faceExtra.style.backgroundImage = "none";
      bustLayers.faceExtra.style.opacity = "0";
    }

    if (miniShadow)
      miniShadow.style.backgroundImage = `url(${MINI}mini_shadow.png)`;
    if (miniBody)
      miniBody.style.backgroundImage   = `url(${TOGGLE}toggle_base.png)`;

    if (toggleLayers?.shadow)
      toggleLayers.shadow.style.backgroundImage = `url(${TOGGLE}toggle_shadow1.png)`;
    if (toggleLayers?.base)
      toggleLayers.base.style.backgroundImage   = `url(${TOGGLE}toggle_base.png)`;
    if (toggleLayers?.ear)
      toggleLayers.ear.style.backgroundImage    = `url(${TOGGLE}toggle_ear_neutral.png)`;
    if (toggleLayers?.eyes)
      toggleLayers.eyes.style.backgroundImage   = `url(${TOGGLE}toggle_eyes_open.png)`;
    if (toggleLayers?.mouth)
      toggleLayers.mouth.style.backgroundImage  = `url(${TOGGLE}toggle_mouth_close.png)`;
  }

  function preloadImages() {
    const list = [
      `${BUST}eyes_open.png`,
      `${BUST}eyes_half.png`,
      `${BUST}eyes_closed.png`,
      `${BUST}eyes_smile.png`,
      `${BUST}mouth_close.png`,
      `${BUST}mouth_open1.png`,
      `${BUST}mouth_open2.png`,
      `${BUST}mouth_smile.png`,
      `${BUST}mouth_smile2.png`,
      `${BUST}ear_neutral.png`,
      `${BUST}ear_up.png`,
      `${BUST}shadow_base.png`,
      `${BUST}shadow_up.png`,
      `${BUST}face_blush.png`,
      `${BUST}face_sweat.png`,
      `${TOGGLE}toggle_ear_neutral.png`,
      `${TOGGLE}toggle_ear_up.png`,
      `${TOGGLE}toggle_eyes_open.png`,
      `${TOGGLE}toggle_eyes_half.png`,
      `${TOGGLE}toggle_eyes_closed.png`,
      `${TOGGLE}toggle_mouth_close.png`,
      `${TOGGLE}toggle_mouth_open.png`,
      `${TOGGLE}toggle_shadow1.png`,
      `${TOGGLE}toggle_shadow2.png`
    ];
    list.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  // ------------------------------------------------------------
  // 表情制御
  // ------------------------------------------------------------
  function setExpression(mood) {
    if (!bustLayers) return;

    const { shadow, ear, eyes, mouth, faceExtra, avatar } = bustLayers;

    if (avatar)
      avatar.classList.remove("sp-mood-happy", "sp-mood-worry");

    if (shadow)
      shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
    if (ear)
      ear.style.backgroundImage    = `url(${BUST}ear_neutral.png)`;
    if (eyes)
      eyes.style.backgroundImage   = `url(${BUST}eyes_open.png)`;
    if (mouth)
      mouth.style.backgroundImage  = `url(${BUST}mouth_close.png)`;
    if (faceExtra) {
      faceExtra.style.backgroundImage = "none";
      faceExtra.style.opacity = "0";
    }

    switch (mood) {
      case "smile":
      case "excited":
        if (eyes)
          eyes.style.backgroundImage = `url(${BUST}eyes_smile.png)`;
        if (mouth)
          mouth.style.backgroundImage = `url(${BUST}mouth_smile.png)`;
        if (faceExtra) {
          faceExtra.style.backgroundImage = `url(${BUST}face_blush.png)`;
          faceExtra.style.opacity = "1";
        }
        if (avatar) avatar.classList.add("sp-mood-happy");
        break;

      case "worry":
        if (eyes)
          eyes.style.backgroundImage = `url(${BUST}eyes_half.png)`;
        if (faceExtra) {
          faceExtra.style.backgroundImage = `url(${BUST}face_sweat.png)`;
          faceExtra.style.opacity = "1";
        }
        if (avatar) avatar.classList.add("sp-mood-worry");
        break;

      default:
        // neutral
        break;
    }
  }

  // ------------------------------------------------------------
  // 口パク制御（Core から呼ばれる）
  // ------------------------------------------------------------
  function animateMouth(mouthLayer, mood, phase) {
    if (!mouthLayer) return;

    if (mood === "smile" || mood === "excited") {
      // 笑顔ボイス：close → smile2 → smile
      if (phase === 0) {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_close.png)`;
      } else if (phase === 1) {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_smile2.png)`;
      } else {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_smile.png)`;
      }
    } else {
      // 通常ボイス：open1 → open2 → close
      if (phase === 0) {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_open1.png)`;
      } else if (phase === 1) {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_open2.png)`;
      } else {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_close.png)`;
      }
    }
  }

  function resetMouth(mood) {
    if (!bustLayers?.mouth) return;
    if (mood === "smile" || mood === "excited") {
      bustLayers.mouth.style.backgroundImage = `url(${BUST}mouth_smile.png)`;
    } else {
      bustLayers.mouth.style.backgroundImage = `url(${BUST}mouth_close.png)`;
    }
  }

  // ------------------------------------------------------------
  // アイドルアニメ（まばたき & 耳ぴょこ）
  // ------------------------------------------------------------
  function setupIdleAnimations() {
    clearInterval(blinkBustTimer);
    clearInterval(blinkToggleTimer);
    clearInterval(earBustTimer);
    clearInterval(earToggleTimer);

    blinkBustTimer = setInterval(() => {
      blinkBust();
    }, randomRange(4000, 7000));

    blinkToggleTimer = setInterval(() => {
      blinkToggle();
    }, randomRange(4500, 8000));

    earBustTimer = setInterval(() => {
      earPyonBust();
    }, randomRange(5000, 9000));

    earToggleTimer = setInterval(() => {
      earPyonToggle();
    }, randomRange(5200, 9500));
  }

  // 3段階まばたき（バストアップ）
  function blinkBust() {
    if (!bustLayers?.eyes) return;
    const eyes = bustLayers.eyes;

    const core = window.ShioponCore;
    const mood = core ? (core.getState().lastMood || "neutral") : "neutral";

    let texOpen, texHalf, texClosed;

    if (mood === "smile" || mood === "excited") {
      texOpen   = `${BUST}eyes_smile.png`;
      texHalf   = `${BUST}eyes_closed.png`;
      texClosed = `${BUST}eyes_closed.png`;
    } else if (mood === "worry") {
      texOpen   = `${BUST}eyes_half.png`;
      texHalf   = `${BUST}eyes_closed.png`;
      texClosed = `${BUST}eyes_closed.png`;
    } else {
      texOpen   = `${BUST}eyes_open.png`;
      texHalf   = `${BUST}eyes_half.png`;
      texClosed = `${BUST}eyes_closed.png`;
    }

    eyes.style.backgroundImage = `url(${texHalf})`;
    setTimeout(() => {
      eyes.style.backgroundImage = `url(${texClosed})`;
      setTimeout(() => {
        eyes.style.backgroundImage = `url(${texHalf})`;
        setTimeout(() => {
          eyes.style.backgroundImage = `url(${texOpen})`;
        }, 40);
      }, 40);
    }, 40);
  }

  // トグル（ボタン）のまばたき
  function blinkToggle() {
    if (!toggleLayers?.eyes) return;
    const eyes = toggleLayers.eyes;
    eyes.style.backgroundImage = `url(${TOGGLE}toggle_eyes_closed.png)`;
    setTimeout(() => {
      eyes.style.backgroundImage = `url(${TOGGLE}toggle_eyes_open.png)`;
    }, 120);
  }

  // 耳ぴょこ：バストアップ
  function earPyonBust() {
    if (!bustLayers?.ear || !bustLayers?.shadow) return;
    const ear = bustLayers.ear;
    const shadow = bustLayers.shadow;

    const core = window.ShioponCore;
    const mood = core ? (core.getState().lastMood || "neutral") : "neutral";

    const isSmile = mood === "smile" || mood === "excited";

    const baseEar    = isSmile ? `${BUST}ear_up.png`         : `${BUST}ear_neutral.png`;
    const baseShadow = isSmile ? `${BUST}shadow_up.png`      : `${BUST}shadow_base.png`;

    const pyonEar    = isSmile ? `${BUST}ear_neutral.png`    : `${BUST}ear_up.png`;
    const pyonShadow = isSmile ? `${BUST}shadow_base.png`    : `${BUST}shadow_up.png`;

    ear.style.backgroundImage    = `url(${pyonEar})`;
    shadow.style.backgroundImage = `url(${pyonShadow})`;

    setTimeout(() => {
      ear.style.backgroundImage    = `url(${baseEar})`;
      shadow.style.backgroundImage = `url(${baseShadow})`;
    }, 120);
  }

  // 耳ぴょこ：トグル側
  function earPyonToggle() {
    if (!toggleLayers?.ear || !toggleLayers?.shadow) return;
    const ear = toggleLayers.ear;
    const shadow = toggleLayers.shadow;

    ear.style.backgroundImage    = `url(${TOGGLE}toggle_ear_up.png)`;
    shadow.style.backgroundImage = `url(${TOGGLE}toggle_shadow2.png)`;

    setTimeout(() => {
      ear.style.backgroundImage    = `url(${TOGGLE}toggle_ear_neutral.png)`;
      shadow.style.backgroundImage = `url(${TOGGLE}toggle_shadow1.png)`;
    }, 120);
  }

  // ------------------------------------------------------------
  // ユーティリティ
  // ------------------------------------------------------------
  function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // ------------------------------------------------------------
  // 公開API
  // ------------------------------------------------------------
  window.ShioponVisual = {
    init,
    setExpression,
    animateMouth,
    resetMouth
  };
})();
