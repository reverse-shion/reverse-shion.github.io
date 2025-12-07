// ============================================================
//  Shiopon Companion System v2.2
//  --- VISUAL MODULE（見た目・アニメーション制御）---
// ============================================================

(() => {
  "use strict";

  const ASSET_BASE = "/assets/shiopon/";
  const BUST   = ASSET_BASE + "bust/";
  const TOGGLE = ASSET_BASE + "toggle/";
  const MINI   = ASSET_BASE + "mini/";

  // DOMキャッシュ
  let bustLayers   = null;
  let toggleLayers = null;
  let miniShadow   = null;
  let miniBody     = null;

  // アイドル用タイマー
  let blinkBustTimer   = null;
  let blinkToggleTimer = null;
  let earBustTimer     = null;
  let earToggleTimer   = null;

  // パネル監視用（トグル表示/非表示の自動切り替え）
  let panelObserver = null;

  // ------------------------------------------------------------
  // 初期化：DOM & 画像セット & アイドル開始
  // ------------------------------------------------------------
  function init() {
    const panel  = document.getElementById("shiopon-panel");
    const toggle = document.getElementById("shiopon-toggle");

    // どちらも無ければ何もしない
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

    // ★ 追加：パネルの状態に合わせてトグル表示を自動制御
    setupPanelToggleSync(panel, toggle);
  }

  // ------------------------------------------------------------
  // パネル表示状態とトグル表示の同期
  // ------------------------------------------------------------
  function setupPanelToggleSync(panel, toggle) {
    if (!panel || !toggle) return;

    // いったん現在の状態で同期
    syncToggleVisibility(panel, toggle);

    // すでにオブザーバーがあれば解除
    if (panelObserver) {
      panelObserver.disconnect();
      panelObserver = null;
    }

    // class属性の変化を監視して、sp-hidden の有無で切り替え
    panelObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class") {
          syncToggleVisibility(panel, toggle);
          break;
        }
      }
    });

    panelObserver.observe(panel, { attributes: true });
  }

  function syncToggleVisibility(panel, toggle) {
    if (!panel || !toggle) return;
    const isHidden = panel.classList.contains("sp-hidden");

    // バストアップ表示中（sp-hidden が付いていない）→ トグル非表示
    // バストアップ非表示中（sp-hidden あり）→ トグル表示
    toggle.style.display = isHidden ? "block" : "none";
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
    }

    // ミニしおぽん
    if (miniShadow)
      miniShadow.style.backgroundImage = `url(${MINI}mini_shadow.png)`;
    if (miniBody)
      miniBody.style.backgroundImage   = `url(${TOGGLE}toggle_base.png)`; // 共通

    // トグル（ボタン）
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
  // プリロード
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

    // リセット
    if (avatar)
      avatar.classList.remove("sp-mood-happy", "sp-mood-worry");

    if (shadow)
      shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
    if (ear)
      ear.style.backgroundImage    = `url(${BUST}ear_neutral.png)`;
    if (eyes) {
      eyes.style.backgroundImage = `url(${BUST}eyes_open.png)`;
      eyes.style.opacity = "1";
    }
    if (mouth)
      mouth.style.backgroundImage  = `url(${BUST}mouth_close.png)`;
    if (faceExtra) {
      faceExtra.style.backgroundImage = "none";
      faceExtra.style.opacity = "0";
    }

    // mood 毎の上書き
    switch (mood) {
      case "smile":
      case "excited":
        if (ear)
          ear.style.backgroundImage = `url(${BUST}ear_up.png)`;
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
  // 口パク制御
  // ------------------------------------------------------------
  function animateMouth(mouthLayer, mood, phase) {
    if (!mouthLayer) return;

    if (mood === "smile" || mood === "excited") {
      if (phase === 0) {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_close.png)`;
      } else if (phase === 1) {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_smile2.png)`;
      } else {
        mouthLayer.style.backgroundImage = `url(${BUST}mouth_smile.png)`;
      }
    } else {
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
    bustLayers.mouth.style.backgroundImage =
      (mood === "smile" || mood === "excited")
        ? `url(${BUST}mouth_smile.png)`
        : `url(${BUST}mouth_close.png)`;
  }

  // ------------------------------------------------------------
  // アイドルアニメ（まばたき & 耳ぴょこ）
  // ------------------------------------------------------------
  function setupIdleAnimations() {
    clearTimeout(blinkBustTimer);
    clearTimeout(blinkToggleTimer);
    clearTimeout(earBustTimer);
    clearTimeout(earToggleTimer);

    if (bustLayers?.eyes)  scheduleBlinkBust();
    if (toggleLayers?.eyes) scheduleBlinkToggle();
    if (bustLayers?.ear && bustLayers?.shadow) scheduleEarBust();
    if (toggleLayers?.ear && toggleLayers?.shadow) scheduleEarToggle();
  }

  // バストまばたき
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

  // トグルまばたき
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

  // バスト耳ぴょこ
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

    const baseEar    = `${BUST}ear_neutral.png`;
    const baseShadow = `${BUST}shadow_base.png`;
    const pyonEar    = `${BUST}ear_up.png`;
    const pyonShadow = `${BUST}shadow_up.png`;

    ear.style.backgroundImage    = `url(${pyonEar})`;
    shadow.style.backgroundImage = `url(${pyonShadow})`;

    setTimeout(() => {
      ear.style.backgroundImage    = `url(${baseEar})`;
      shadow.style.backgroundImage = `url(${baseShadow})`;
    }, 140);
  }

  // トグル耳ぴょこ
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

  // 念のため：Bootstrap から呼ばれなくても自分で初期化を試みる
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(init, 0);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
