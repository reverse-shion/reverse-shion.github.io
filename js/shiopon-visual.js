// ============================================================
//  Shiopon Companion System v2.1
//  --- VISUAL MODULE（見た目・アニメーション制御）---
//  ・DOM未準備でも安全に動作
//  ・まばたき / 耳ぴょこは setTimeout でランダム間隔
//  ・しおぽんの「表情」と Core の lastMood を連動
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

  // アイドル用タイマー（setTimeout）
  let blinkBustTimer   = null;
  let blinkToggleTimer = null;
  let earBustTimer     = null;
  let earToggleTimer   = null;

  // ------------------------------------------------------------
  // 初期化：DOM & 画像セット & アイドル開始
  // ------------------------------------------------------------
  function init() {
    const panel  = document.getElementById("shiopon-panel");
    const toggle = document.getElementById("shiopon-toggle");

    // どちらもなければ何もしない（エラー防止）
    if (!panel && !toggle) return;

    if (panel) {
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
    }

    if (toggle) {
      toggleLayers = {
        shadow: toggle.querySelector(".sp-toggle-layer.sp-toggle-shadow"),
        ear:    toggle.querySelector(".sp-toggle-layer.sp-toggle-ear"),
        base:   toggle.querySelector(".sp-toggle-layer.sp-toggle-base"),
        eyes:   toggle.querySelector(".sp-toggle-layer.sp-toggle-eyes"),
        mouth:  toggle.querySelector(".sp-toggle-layer.sp-toggle-mouth")
      };
    }

    setupImages();
    preloadImages();
    setupIdleAnimations();
  }

  // ------------------------------------------------------------
  // 画像セット（初期状態）
  // ------------------------------------------------------------
  function setupImages() {
    // バストアップ
    if (bustLayers) {
      const { shadow, body, ear, eyes, mouth, faceExtra } = bustLayers;

      if (shadow)
        shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
      if (body)
        body.style.backgroundImage   = `url(${BUST}body_base.png)`;
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
    }

    // ミニしおぽん
    if (miniShadow)
      miniShadow.style.backgroundImage = `url(${MINI}mini_shadow.png)`;
    if (miniBody)
      miniBody.style.backgroundImage   = `url(${TOGGLE}toggle_base.png)`; // ミニ本体はトグルと共通

    // トグル（フローティングボタン）
    if (toggleLayers) {
      const { shadow, base, ear, eyes, mouth } = toggleLayers;

      if (shadow)
        shadow.style.backgroundImage = `url(${TOGGLE}toggle_shadow1.png)`;
      if (base)
        base.style.backgroundImage   = `url(${TOGGLE}toggle_base.png)`;
      if (ear)
        ear.style.backgroundImage    = `url(${TOGGLE}toggle_ear_neutral.png)`;
      if (eyes)
        eyes.style.backgroundImage   = `url(${TOGGLE}toggle_eyes_open.png)`;
      if (mouth)
        mouth.style.backgroundImage  = `url(${TOGGLE}toggle_mouth_close.png)`;
    }
  }

  // ------------------------------------------------------------
  // プリロード（描画カクつき防止）
  // ------------------------------------------------------------
  function preloadImages() {
    const list = [
      // バストアップ
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
      // トグル
      `${TOGGLE}toggle_ear_neutral.png`,
      `${TOGGLE}toggle_ear_up.png`,
      `${TOGGLE}toggle_eyes_open.png`,
      `${TOGGLE}toggle_eyes_half.png`,
      `${TOGGLE}toggle_eyes_closed.png`,
      `${TOGGLE}toggle_mouth_close.png`,
      `${TOGGLE}toggle_mouth_open.png`,
      `${TOGGLE}toggle_shadow1.png`,
      `${TOGGLE}toggle_shadow2.png`,
      // ミニ
      `${MINI}mini_shadow.png`
    ];

    list.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  // ------------------------------------------------------------
  // 表情制御（Core から mood を受け取る）
  // ------------------------------------------------------------
  function setExpression(mood) {
    if (!bustLayers) return;

    const { shadow, ear, eyes, mouth, faceExtra, avatar } = bustLayers;

    // 全体リセット
    if (avatar)
      avatar.classList.remove("sp-mood-happy", "sp-mood-worry");

    if (shadow)
      shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
    if (ear)
      ear.style.backgroundImage    = `url(${BUST}ear_neutral.png)`;
    if (eyes) {
      eyes.style.backgroundImage   = `url(${BUST}eyes_open.png)`;
      eyes.style.opacity = "1";
    }
    if (mouth)
      mouth.style.backgroundImage  = `url(${BUST}mouth_close.png)`;
    if (faceExtra) {
      faceExtra.style.backgroundImage = "none";
      faceExtra.style.opacity = "0";
    }

    // mood ごとの上書き
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
        // neutral のまま
        break;
    }
  }

  // ------------------------------------------------------------
  // 口パク制御（Core から呼ばれる）
  //  animateMouth(mouthLayer, mood, phase)
// ------------------------------------------------------------
  function animateMouth(mouthLayer, mood, phase) {
    if (!mouthLayer) return;

    // ニコニコ声・うきうき声
    if (mood === "smile" || mood === "excited") {
      if (phase === 0) {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_close.png)`;
      } else if (phase === 1) {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_smile2.png)`;
      } else {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_smile.png)`;
      }
    } else {
      // 通常ボイス
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
  //  ※ setTimeout で毎回ランダム間隔にする
  // ------------------------------------------------------------
  function setupIdleAnimations() {
    // 既存タイマー停止
    clearTimeout(blinkBustTimer);
    clearTimeout(blinkToggleTimer);
    clearTimeout(earBustTimer);
    clearTimeout(earToggleTimer);

    scheduleBlinkBust();
    scheduleBlinkToggle();
    scheduleEarBust();
    scheduleEarToggle();
  }

  // ★ バストアップのまばたき
  function scheduleBlinkBust() {
    blinkBustTimer = setTimeout(() => {
      blinkBust();
      scheduleBlinkBust();
    }, randomRange(4000, 7000));
  }

  function blinkBust() {
    if (!bustLayers?.eyes) return;
    const eyes = bustLayers.eyes;

    let mood = "neutral";
    if (window.ShioponCore && typeof window.ShioponCore.getState === "function") {
      const st = window.ShioponCore.getState();
      mood = (st && st.lastMood) || "neutral";
    }

    let texOpen, texHalf, texClosed;

    if (mood === "smile" || mood === "excited") {
      texOpen   = `${BUST}eyes_smile.png`;
      texHalf   = `${BUST}eyes_half.png`;
      texClosed = `${BUST}eyes_closed.png`;
    } else if (mood === "worry") {
      texOpen   = `${BUST}eyes_half.png`;
      texHalf   = `${BUST}eyes_half.png`;
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

  // ★ トグル（ボタン）のまばたき
  function scheduleBlinkToggle() {
    blinkToggleTimer = setTimeout(() => {
      blinkToggle();
      scheduleBlinkToggle();
    }, randomRange(4500, 8000));
  }

  function blinkToggle() {
    if (!toggleLayers?.eyes) return;
    const eyes = toggleLayers.eyes;

    eyes.style.backgroundImage = `url(${TOGGLE}toggle_eyes_closed.png)`;
    setTimeout(() => {
      eyes.style.backgroundImage = `url(${TOGGLE}toggle_eyes_open.png)`;
    }, 110);
  }

  // ★ バストアップの耳ぴょこ
  function scheduleEarBust() {
    earBustTimer = setTimeout(() => {
      earPyonBust();
      scheduleEarBust();
    }, randomRange(5000, 9000));
  }

  function earPyonBust() {
    if (!bustLayers?.ear || !bustLayers?.shadow) return;
    const ear    = bustLayers.ear;
    const shadow = bustLayers.shadow;

    let mood = "neutral";
    if (window.ShioponCore && typeof window.ShioponCore.getState === "function") {
      const st = window.ShioponCore.getState();
      mood = (st && st.lastMood) || "neutral";
    }

    const isHappy = mood === "smile" || mood === "excited";

    // 基本はニュートラル、ぴょこ時に耳が上がる
    const baseEar    = `${BUST}ear_neutral.png`;
    const baseShadow = `${BUST}shadow_base.png`;

    const pyonEar    = isHappy ? `${BUST}ear_up.png`    : `${BUST}ear_up.png`;
    const pyonShadow = isHappy ? `${BUST}shadow_up.png` : `${BUST}shadow_up.png`;

    ear.style.backgroundImage    = `url(${pyonEar})`;
    shadow.style.backgroundImage = `url(${pyonShadow})`;

    const backDelay = isHappy ? 120 : 150;
    setTimeout(() => {
      ear.style.backgroundImage    = `url(${baseEar})`;
      shadow.style.backgroundImage = `url(${baseShadow})`;
    }, backDelay);
  }

  // ★ トグル側の耳ぴょこ
  function scheduleEarToggle() {
    earToggleTimer = setTimeout(() => {
      earPyonToggle();
      scheduleEarToggle();
    }, randomRange(5200, 9500));
  }

  function earPyonToggle() {
    if (!toggleLayers?.ear || !toggleLayers?.shadow) return;
    const ear    = toggleLayers.ear;
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
  // 公開 API
  // ------------------------------------------------------------
  window.ShioponVisual = {
    init,
    setExpression,
    animateMouth,
    resetMouth
  };
})();
