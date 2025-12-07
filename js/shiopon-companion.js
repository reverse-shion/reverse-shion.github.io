// ==============================
//  Shiopon Companion v1.0
//  Shionverse 全域常駐 相棒システム
// ==============================
(function () {
  const ASSET_BASE = "/assets/shiopon/";
  const BUST   = ASSET_BASE + "bust/";
  const TOGGLE = ASSET_BASE + "toggle/";
  const MINI   = ASSET_BASE + "mini/";
  const TXT_PATH = ASSET_BASE + "shiopon_lines.txt";

  const STORAGE_KEY = "shiopon_state_v1";

  const defaultState = {
    visits: 0,
    lastMood: "neutral",
    silent: false
  };

  let state = loadState();
  let bustLayers = {};
  let toggleLayers = {};

  // ------------------------------
  // ルート生成 & 初期化
  // ------------------------------
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    ensureRoot();

    const root     = document.getElementById("shiopon-root");
    const panel    = document.getElementById("shiopon-panel");
    const toggle   = document.getElementById("shiopon-toggle");
    const textEl   = document.getElementById("shiopon-text");
    const closeBtn = panel ? panel.querySelector(".sp-close") : null;
    const actionButtons = panel ? panel.querySelectorAll(".sp-btn") : [];

    if (!root || !panel || !toggle || !textEl) return;

    // ページ設定反映
    const cfg  = (window.ShioponConfig || {});
    const mode = cfg.mode || "normal";
    const size = cfg.size || "normal";

    if (mode === "silent") {
      root.classList.add("sp-silent");
      state.silent = true;
    }
    if (size === "small") {
      root.classList.add("sp-small");
    }
    if (mode === "mini-only") {
      root.classList.add("sp-mini-only");
    }

    // レイヤー取得
    bustLayers = {
      shadow:    panel.querySelector(".sp-layer.sp-shadow"),
      ear:       panel.querySelector(".sp-layer.sp-ear"),
      body:      panel.querySelector(".sp-layer.sp-body"),
      faceExtra: panel.querySelector(".sp-layer.sp-face-extra"),
      eyes:      panel.querySelector(".sp-layer.sp-eyes"),
      mouth:     panel.querySelector(".sp-layer.sp-mouth")
    };

    const miniShadow = panel.querySelector(".sp-mini-shadow");
    const miniBody   = panel.querySelector(".sp-mini-body");

    toggleLayers = {
      shadow: toggle.querySelector(".sp-toggle-shadow"),
      ear:    toggle.querySelector(".sp-toggle-ear"),
      base:   toggle.querySelector(".sp-toggle-base"),
      eyes:   toggle.querySelector(".sp-toggle-eyes"),
      mouth:  toggle.querySelector(".sp-toggle-mouth")
    };

    setupImages(bustLayers, miniShadow, miniBody, toggleLayers);
    setupIdleAnimations();

    // イベント
    toggle.addEventListener("click", () => {
      if (root.classList.contains("sp-mini-only")) {
        root.classList.remove("sp-mini-only");
        root.classList.add("sp-small");
      }
      if (panel.classList.contains("sp-visible")) {
        hidePanel(panel);
      } else {
        showPanel(panel, textEl, "greeting");
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => hidePanel(panel));
    }

    actionButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-sp-action");
        handleAction(action, panel, textEl);
      });
    });

    saveState();
    loadLinesFromTxt();
  }

  // テンプレート HTML を生成
  function ensureRoot() {
    let root = document.getElementById("shiopon-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "shiopon-root";
      document.body.appendChild(root);
    }
    if (!root.innerHTML.trim()) {
      root.innerHTML = `
        <button id="shiopon-toggle" aria-label="しおぽんを呼ぶ">
          <div class="sp-toggle-layer sp-toggle-shadow"></div>
          <div class="sp-toggle-layer sp-toggle-ear"></div>
          <div class="sp-toggle-layer sp-toggle-base"></div>
          <div class="sp-toggle-layer sp-toggle-eyes"></div>
          <div class="sp-toggle-layer sp-toggle-mouth"></div>
        </button>

        <div id="shiopon-panel" class="sp-hidden">
          <div class="sp-panel-inner">
            <div class="sp-avatar-area">
              <div class="sp-avatar">
                <div class="sp-layer sp-shadow"></div>
                <div class="sp-layer sp-ear"></div>
                <div class="sp-layer sp-body"></div>
                <div class="sp-layer sp-face-extra"></div>
                <div class="sp-layer sp-eyes"></div>
                <div class="sp-layer sp-mouth"></div>
              </div>
              <div class="sp-mini">
                <div class="sp-mini-shadow"></div>
                <div class="sp-mini-body"></div>
              </div>
            </div>

            <div class="sp-dialog-area">
              <div class="sp-dialog-bubble">
                <div class="sp-dialog-text" id="shiopon-text"></div>
              </div>
              <div class="sp-dialog-actions">
                <button class="sp-btn" data-sp-action="more">もっと話す</button>
                <button class="sp-btn" data-sp-action="guide">案内して</button>
                <button class="sp-btn ghost" data-sp-action="silent">今日は静かに</button>
              </div>
            </div>

            <button class="sp-close" aria-label="しおぽんをしまう">×</button>
          </div>
        </div>
      `;
    }
  }

  // ------------------------------
  // 状態管理
  // ------------------------------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultState };
      return { ...defaultState, ...JSON.parse(raw) };
    } catch (e) {
      return { ...defaultState };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }

  // ------------------------------
  // セリフ定義（＋ txt 追加）
  // ------------------------------
  let lineSets = {
    greetingFirst: [
      { mood: "smile", text: "はじめましてなの！\nしおぽん、シオンさんの相棒だよ〜" },
      { mood: "smile", text: "わぁ…ここまで来てくれてありがとなの！\nいっしょに星を見に行こ？" }
    ],
    greetingAgain: [
      { mood: "smile", text: "おかえりなの〜！\n今日もいっしょに旅、続けよ？" },
      { mood: "neutral", text: "シオンさん、また来てくれたの？\nふふ、星たちが喜んでるよ〜" }
    ],
    idle: [
      { mood: "neutral", text: "星の声、ちょっとだけざわざわしてるの。\n…あとで、いっしょに聞いてみる？" },
      { mood: "neutral", text: "ここ、落ち着く場所だね〜。\nしおぽん、ちょっとだけここに住みたいかも…" },
      { mood: "smile", text: "シオンさんと一緒なら、\nどのゲートもこわくないの〜！" },
      { mood: "neutral", text: "今日のシオンさんの心、\nどんな星座の形してるかなぁ…" }
    ],
    excited: [
      { mood: "smile", text: "キラキラ〜☆\n新しいゲート、開けちゃう？" },
      { mood: "smile", text: "うらなっちゃうの〜って言ったら、\n星たち本気だすかも…ぴょん！" }
    ],
    guideIntro: [
      { mood: "smile", text: "どこ行きたい？\nしおぽん、道しるべになるの〜" },
      { mood: "neutral", text: "ゲート、いろいろあるからね。\n迷ったら、しおぽんに任せてなの。" }
    ],
    silentOn: [
      { mood: "neutral", text: "うん…今日は静かに寄りそってるね。\nなにかあったら、そっとトグル押してなの。" }
    ],
    silentOff: [
      { mood: "smile", text: "ふふっ、声出してもいい？\nまた一緒におしゃべりするの〜" }
    ]
  };

  function loadLinesFromTxt() {
    fetch(TXT_PATH)
      .then(res => {
        if (!res.ok) throw new Error("no txt");
        return res.text();
      })
      .then(text => {
        const lines = text.split(/\r?\n/);
        lines.forEach(line => {
          line = line.trim();
          if (!line || line.startsWith("#")) return;
          const [moodKey, textBody] = line.split("|");
          if (!moodKey || !textBody) return;
          const mood = moodKey.trim();
          const entry = { mood, text: textBody.trim() };
          if (!lineSets[mood]) lineSets[mood] = [];
          lineSets[mood].push(entry);
        });
      })
      .catch(() => {
        // 無くてもOK
      });
  }

  // ------------------------------
  // 画像セット & プリロード
  // ------------------------------
  function setupImages(bLayers, miniShadow, miniBody, tLayers) {
    if (bLayers.shadow) bLayers.shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
    if (bLayers.body)   bLayers.body.style.backgroundImage   = `url(${BUST}body_base.png)`;
    if (bLayers.ear)    bLayers.ear.style.backgroundImage    = `url(${BUST}ear_neutral.png)`;
    if (bLayers.eyes)   bLayers.eyes.style.backgroundImage   = `url(${BUST}eyes_open.png)`;
    if (bLayers.mouth)  bLayers.mouth.style.backgroundImage  = `url(${BUST}mouth_close.png)`;
    if (bLayers.faceExtra) {
      bLayers.faceExtra.style.backgroundImage = "none";
      bLayers.faceExtra.style.opacity = "0";
    }

    if (miniShadow) miniShadow.style.backgroundImage = `url(${MINI}mini_shadow.png)`;
    if (miniBody)   miniBody.style.backgroundImage   = `url(${TOGGLE}toggle_base.png)`;

    if (tLayers.shadow) tLayers.shadow.style.backgroundImage = `url(${TOGGLE}toggle_shadow1.png)`;
    if (tLayers.base)   tLayers.base.style.backgroundImage   = `url(${TOGGLE}toggle_base.png)`;
    if (tLayers.ear)    tLayers.ear.style.backgroundImage    = `url(${TOGGLE}toggle_ear_neutral.png)`;
    if (tLayers.eyes)   tLayers.eyes.style.backgroundImage   = `url(${TOGGLE}toggle_eyes_open.png)`;
    if (tLayers.mouth)  tLayers.mouth.style.backgroundImage  = `url(${TOGGLE}toggle_mouth_close.png)`;

    const preloadList = [
      `${BUST}ear_up.png`,
      `${BUST}eyes_half.png`,
      `${BUST}eyes_closed.png`,
      `${BUST}eyes_smile.png`,
      `${BUST}mouth_open1.png`,
      `${BUST}mouth_open2.png`,
      `${BUST}mouth_smile.png`,
      `${BUST}mouth_smile2.png`,
      `${BUST}face_blush.png`,
      `${BUST}face_sweat.png`,
      `${BUST}shadow_up.png`,
      `${TOGGLE}toggle_ear_up.png`,
      `${TOGGLE}toggle_eyes_half.png`,
      `${TOGGLE}toggle_eyes_closed.png`,
      `${TOGGLE}toggle_mouth_open.png`,
      `${TOGGLE}toggle_shadow2.png`
    ];

    preloadList.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  // ------------------------------
  // パネル表示/非表示
  // ------------------------------
  function showPanel(panel, textEl, type) {
    panel.classList.remove("sp-hidden");
    panel.classList.add("sp-visible");

    state.visits += 1;
    saveState();

    if (type === "greeting") {
      const isFirst = state.visits <= 1;
      const pool = isFirst ? lineSets.greetingFirst : lineSets.greetingAgain;
      const line = pickRandom(pool);
      speak(line, textEl);
    }
  }

  function hidePanel(panel) {
    panel.classList.remove("sp-visible");
    panel.classList.add("sp-hidden");
  }

  // ------------------------------
  // ボタンアクション
  // ------------------------------
  function handleAction(action, panel, textEl) {
    if (action === "more") {
      const pool = lineSets.idle.concat(lineSets.excited || []);
      const line = pickRandom(pool);
      speak(line, textEl);
      return;
    }

    if (action === "guide") {
      const gates = (window.ShioponGates || []);
      if (!gates.length) {
        const fallback = {
          mood: "worry",
          text: "あれれ…このページには\n案内できるゲートが見当たらないの…。"
        };
        speak(fallback, textEl);
        return;
      }

      const intro = pickRandom(lineSets.guideIntro);
      speak(intro, textEl, () => {
        const target = pickRandom(gates);
        if (!target || !target.url) return;
        starJumpTo(target.url);
      });
      return;
    }

    if (action === "silent") {
      state.silent = !state.silent;
      saveState();

      const line = pickRandom(state.silent ? lineSets.silentOn : lineSets.silentOff);
      speak(line, textEl);

      const root = document.getElementById("shiopon-root");
      if (root) {
        if (state.silent) root.classList.add("sp-silent");
        else root.classList.remove("sp-silent");
      }
      return;
    }
  }

  // ------------------------------
  // セリフ再生（口パク＋表情）
  // ------------------------------
  let speakingTimer = null;

  function speak(line, textEl, onDone) {
    if (!line || !textEl) return;

    state.lastMood = line.mood || "neutral";
    saveState();

    setExpression(state.lastMood);

    textEl.textContent = line.text;

    if (speakingTimer) {
      clearInterval(speakingTimer);
      speakingTimer = null;
    }

    const duration = Math.max(1500, line.text.length * 60);
    const start = performance.now();

    const panel = document.getElementById("shiopon-panel");
    const mouthLayer = panel && panel.querySelector(".sp-layer.sp-mouth");
    if (!mouthLayer) return;

    let phase = 0;
    speakingTimer = setInterval(() => {
      const now = performance.now();
      const t = now - start;

      if (state.lastMood === "smile" || state.lastMood === "excited") {
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
      phase = (phase + 1) % 3;

      if (t >= duration) {
        clearInterval(speakingTimer);
        speakingTimer = null;
        if (state.lastMood === "smile" || state.lastMood === "excited") {
          mouthLayer.style.backgroundImage = `url(${BUST}mouth_smile.png)`;
        } else {
          mouthLayer.style.backgroundImage = `url(${BUST}mouth_close.png)`;
        }
        if (typeof onDone === "function") onDone();
      }
    }, 120);
  }

// ------------------------------
// 表情セット（レイヤー切り替え）
// ------------------------------
function setExpression(mood) {
  const panel = document.getElementById("shiopon-panel");
  if (!panel) return;

  const shadow = panel.querySelector(".sp-layer.sp-shadow");
  const ear    = panel.querySelector(".sp-layer.sp-ear");
  const eyes   = panel.querySelector(".sp-layer.sp-eyes");
  const mouth  = panel.querySelector(".sp-layer.sp-mouth");
  const extra  = panel.querySelector(".sp-layer.sp-face-extra");
  const avatar = panel.querySelector(".sp-avatar");

  // いったん全部デフォルトに戻す
  if (shadow) shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
  if (ear)    ear.style.backgroundImage    = `url(${BUST}ear_neutral.png)`;
  if (eyes)   eyes.style.backgroundImage   = `url(${BUST}eyes_open.png)`;
  if (mouth)  mouth.style.backgroundImage  = `url(${BUST}mouth_close.png)`;
  if (extra) {
    extra.style.backgroundImage = "none";
    extra.style.opacity = "0";
  }
  if (avatar) {
    avatar.classList.remove("sp-mood-smile", "sp-mood-worry");
  }

  switch (mood) {
    case "smile":
    case "excited":
      // 耳と影はそのまま（耳アップ無し）
      if (eyes)  eyes.style.backgroundImage  = `url(${BUST}eyes_smile.png)`;
      if (mouth) mouth.style.backgroundImage = `url(${BUST}mouth_smile.png)`;
      if (extra) {
        extra.style.backgroundImage = `url(${BUST}face_blush.png)`;
        extra.style.opacity = "1";
      }
      if (avatar) avatar.classList.add("sp-mood-smile");
      break;

    case "worry":
      if (eyes)  eyes.style.backgroundImage  = `url(${BUST}eyes_half.png)`;
      if (mouth) mouth.style.backgroundImage = `url(${BUST}mouth_close.png)`;
      if (extra) {
        extra.style.backgroundImage = `url(${BUST}face_sweat.png)`;
        extra.style.opacity = "1";
      }
      if (avatar) avatar.classList.add("sp-mood-worry");
      break;

    default:
      // neutral はデフォルトのまま
      break;
  }
}
  // ------------------------------
  // アイドルアニメ（まばたき・耳ぴょこ）
  // ------------------------------
  function setupIdleAnimations() {
    setInterval(() => blinkBust(),   randomRange(4000, 7000));
    setInterval(() => blinkToggle(), randomRange(4500, 8000));
    setInterval(() => earPyonBust(), randomRange(6000, 11000));
    setInterval(() => earPyonToggle(), randomRange(6500, 12000));
  }

  function blinkBust() {
    const eyes = bustLayers.eyes;
    if (!eyes) return;

    const mood = state.lastMood || "neutral";

    eyes.style.backgroundImage = `url(${BUST}eyes_closed.png)`;
    setTimeout(() => {
      if (mood === "smile" || mood === "excited") {
        eyes.style.backgroundImage = `url(${BUST}eyes_smile.png)`;
      } else if (mood === "worry") {
        eyes.style.backgroundImage = `url(${BUST}eyes_half.png)`;
      } else {
        eyes.style.backgroundImage = `url(${BUST}eyes_open.png)`;
      }
    }, 120);
  }

  function blinkToggle() {
    const eyes = toggleLayers.eyes;
    if (!eyes) return;
    eyes.style.backgroundImage = `url(${TOGGLE}toggle_eyes_closed.png)`;
    setTimeout(() => {
      eyes.style.backgroundImage = `url(${TOGGLE}toggle_eyes_open.png)`;
    }, 120);
  }

  function earPyonBust() {
    const ear    = bustLayers.ear;
    const shadow = bustLayers.shadow;
    if (!ear || !shadow) return;

    const mood = state.lastMood || "neutral";

    if (mood === "smile" || mood === "excited") {
      // 笑顔時は画像はそのまま、物理的にぴょこ
      ear.style.transform    = "translateY(-6px)";
      shadow.style.transform = "translateY(4px)";
    } else {
      ear.style.backgroundImage    = `url(${BUST}ear_up.png)`;
      shadow.style.backgroundImage = `url(${BUST}shadow_up.png)`;
    }

    setTimeout(() => {
      if (mood === "smile" || mood === "excited") {
        ear.style.transform    = "translateY(0)";
        shadow.style.transform = "translateY(0)";
        ear.style.backgroundImage    = `url(${BUST}ear_up.png)`;
        shadow.style.backgroundImage = `url(${BUST}shadow_up.png)`;
      } else {
        ear.style.backgroundImage    = `url(${BUST}ear_neutral.png)`;
        shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
      }
    }, 260);
  }

  function earPyonToggle() {
    const ear    = toggleLayers.ear;
    const shadow = toggleLayers.shadow;
    if (!ear || !shadow) return;

    ear.style.backgroundImage    = `url(${TOGGLE}toggle_ear_up.png)`;
    shadow.style.backgroundImage = `url(${TOGGLE}toggle_shadow2.png)`;

    setTimeout(() => {
      ear.style.backgroundImage    = `url(${TOGGLE}toggle_ear_neutral.png)`;
      shadow.style.backgroundImage = `url(${TOGGLE}toggle_shadow1.png)`;
    }, 260);
  }

  // ------------------------------
  // ゲートジャンプ演出
  // ------------------------------
  function starJumpTo(url) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background =
      "radial-gradient(circle at 50% 70%, rgba(255,255,255,0.9), rgba(12,10,22,1))";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.35s ease-out";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "99999";
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

    setTimeout(() => {
      window.location.href = url;
    }, 350);
  }

  // ------------------------------
  // ユーティリティ
  // ------------------------------
  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
  }

  function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
})();
