// ==============================
//  Shiopon Companion v1.1
//  Shionverse 全域常駐 相棒システム
//  TXT( category|expression|text ) フル対応
// ==============================
(function () {

  // -----------------------------
  //  PATHS
  // -----------------------------
  const ASSET_BASE = "/assets/shiopon/";
  const BUST   = ASSET_BASE + "bust/";
  const TOGGLE = ASSET_BASE + "toggle/";
  const MINI   = ASSET_BASE + "mini/";
  const TXT_PATH = ASSET_BASE + "shiopon_lines.txt";

  // -----------------------------
  //  STORAGE
  // -----------------------------
  const STORAGE_KEY = "shiopon_state_v1";

  const defaultState = {
    visits: 0,
    lastMood: "neutral",
    silent: false
  };

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultState };
      return { ...defaultState, ...JSON.parse(raw) };
    } catch {
      return { ...defaultState };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  // -----------------------------
  //  セリフ辞書（TXT 読込後に拡張）
  // -----------------------------
  let lineSets = {};

  // -----------------------------
  //  TXT 読み込み
  //  format: category|expression|text
  // -----------------------------
  async function loadLinesFromTxt() {
    let raw = "";
    try {
      const res = await fetch(TXT_PATH);
      if (!res.ok) throw new Error("txt load failed");
      raw = await res.text();
    } catch (e) {
      console.warn("shiopon_lines.txt 読み込み失敗", e);
      return;
    }

    raw.split(/\r?\n/).forEach((row) => {
      const line = row.trim();
      if (!line || line.startsWith("#")) return;

      // 🌟 ★★★ このフォーマットが今回の重要ポイント ★★★
      const [category, expression, text] = line.split("|");

      if (!category || !expression || !text) return;

      if (!lineSets[category]) lineSets[category] = [];
      lineSets[category].push({
        mood: expression.trim(),
        text: text.trim()
      });
    });
  }

  // -----------------------------
  //  初期化
  // -----------------------------
  document.addEventListener("DOMContentLoaded", init);
  let initialized = false;

  async function init() {
    if (initialized) return;
    initialized = true;

    await loadLinesFromTxt();  // ← TXT 完全ロード

    setupMarkup();
    setupImages();
    setupEvents();
    saveState();
  }

  // -----------------------------
  //  マークアップ注入
  // -----------------------------
  function setupMarkup() {
    let root = document.getElementById("shiopon-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "shiopon-root";
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <button id="shiopon-toggle">
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

          <button class="sp-close">×</button>
        </div>
      </div>
    `;
  }

  // -----------------------------
  //  画像セット
  // -----------------------------
  function setupImages() {
    const panel = document.getElementById("shiopon-panel");
    const toggle = document.getElementById("shiopon-toggle");

    const bust = {
      shadow: panel.querySelector(".sp-layer.sp-shadow"),
      ear: panel.querySelector(".sp-layer.sp-ear"),
      body: panel.querySelector(".sp-layer.sp-body"),
      extra: panel.querySelector(".sp-layer.sp-face-extra"),
      eyes: panel.querySelector(".sp-layer.sp-eyes"),
      mouth: panel.querySelector(".sp-layer.sp-mouth"),
      avatar: panel.querySelector(".sp-avatar")
    };

    const miniShadow = panel.querySelector(".sp-mini-shadow");
    const miniBody   = panel.querySelector(".sp-mini-body");

    const tog = {
      shadow: toggle.querySelector(".sp-toggle-layer.sp-toggle-shadow"),
      ear: toggle.querySelector(".sp-toggle-layer.sp-toggle-ear"),
      base: toggle.querySelector(".sp-toggle-layer.sp-toggle-base"),
      eyes: toggle.querySelector(".sp-toggle-layer.sp-toggle-eyes"),
      mouth: toggle.querySelector(".sp-toggle-layer.sp-toggle-mouth")
    };

    // 基本画像
    bust.shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
    bust.body.style.backgroundImage   = `url(${BUST}body_base.png)`;
    bust.ear.style.backgroundImage    = `url(${BUST}ear_neutral.png)`;
    bust.eyes.style.backgroundImage   = `url(${BUST}eyes_open.png)`;
    bust.mouth.style.backgroundImage  = `url(${BUST}mouth_close.png)`;
    bust.extra.style.backgroundImage  = "none";

    miniShadow.style.backgroundImage  = `url(${MINI}mini_shadow.png)`;
    miniBody.style.backgroundImage    = `url(${TOGGLE}toggle_base.png)`;

    tog.shadow.style.backgroundImage  = `url(${TOGGLE}toggle_shadow1.png)`;
    tog.base.style.backgroundImage    = `url(${TOGGLE}toggle_base.png)`;
    tog.ear.style.backgroundImage     = `url(${TOGGLE}toggle_ear_neutral.png)`;
    tog.eyes.style.backgroundImage    = `url(${TOGGLE}toggle_eyes_open.png)`;
    tog.mouth.style.backgroundImage   = `url(${TOGGLE}toggle_mouth_close.png)`;
  }

  // -----------------------------
  //  イベント
  // -----------------------------
  function setupEvents() {
    const panel = document.getElementById("shiopon-panel");
    const toggle = document.getElementById("shiopon-toggle");
    const closeBtn = panel.querySelector(".sp-close");
    const textEl = document.getElementById("shiopon-text");

    toggle.addEventListener("click", () => {
      if (panel.classList.contains("sp-visible")) hidePanel();
      else showPanel("greeting");
    });

    closeBtn.addEventListener("click", hidePanel);

    panel.querySelectorAll(".sp-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        handleAction(btn.dataset.spAction, textEl);
      });
    });

    // アイドルアニメ
    setupIdleAnimations();
  }

  // -----------------------------
  //  パネル
  // -----------------------------
  function showPanel(type) {
    const panel = document.getElementById("shiopon-panel");
    panel.classList.remove("sp-hidden");
    panel.classList.add("sp-visible");

    state.visits++;
    saveState();

    if (type === "greeting") {
      const first = state.visits <= 1;
      const lines = lineSets[first ? "greetingFirst" : "greetingAgain"];
      speak(pickRandom(lines));
    }
  }

  function hidePanel() {
    const panel = document.getElementById("shiopon-panel");
    panel.classList.remove("sp-visible");
    panel.classList.add("sp-hidden");
  }

  // -----------------------------
  //  アクション
  // -----------------------------
  function handleAction(action, textEl) {
    if (action === "more") {
      const arr = (lineSets.idle || []).concat(lineSets.excited || []);
      speak(pickRandom(arr));
      return;
    }

    if (action === "guide") {
      const intro = pickRandom(lineSets.guideIntro || []);
      speak(intro, () => {
        const gates = window.ShioponGates || [];
        if (!gates.length) return;
        starJumpTo(pickRandom(gates).url);
      });
      return;
    }

    if (action === "silent") {
      state.silent = !state.silent;
      saveState();
      if (state.silent) speak(pickRandom(lineSets.silentOn));
      else speak(pickRandom(lineSets.silentOff));

      const root = document.getElementById("shiopon-root");
      state.silent ? root.classList.add("sp-silent") : root.classList.remove("sp-silent");
    }
  }

  // -----------------------------
  //  セリフ発話
  // -----------------------------
  function speak(line, onDone) {
    if (!line) return;

    const panel = document.getElementById("shiopon-panel");
    const textEl = document.getElementById("shiopon-text");

    state.lastMood = line.mood;
    saveState();

    setExpression(line.mood);

    textEl.textContent = applyUserName(line.text);

    simulateMouth(line, onDone);
  }

  // -----------------------------
  //  名前置換
  // -----------------------------
  function getUserName() {
    const name = localStorage.getItem("lumiereVisitorName");
    return name && name.trim() ? `${name}さん` : "きみ";
  }

  function applyUserName(text) {
    return text.replace(/\{name\}/g, getUserName());
  }

  // -----------------------------
  //  口パク
  // -----------------------------
  function simulateMouth(line, onDone) {
    const panel = document.getElementById("shiopon-panel");
    const mouth = panel.querySelector(".sp-layer.sp-mouth");
    let phase = 0;

    const frames = (line.mood === "smile" || line.mood === "excited")
      ? [`${BUST}mouth_close.png`, `${BUST}mouth_smile2.png`, `${BUST}mouth_smile.png`]
      : [`${BUST}mouth_open1.png`, `${BUST}mouth_open2.png`, `${BUST}mouth_close.png`];

    const duration = Math.max(1500, line.text.length * 60);
    const start = performance.now();

    const timer = setInterval(() => {
      const t = performance.now() - start;
      mouth.style.backgroundImage = `url(${frames[phase]})`;
      phase = (phase + 1) % 3;

      if (t >= duration) {
        clearInterval(timer);
        mouth.style.backgroundImage =
          `url(${(line.mood === "smile" || line.mood === "excited")
            ? `${BUST}mouth_smile.png`
            : `${BUST}mouth_close.png`})`;

        if (onDone) onDone();
      }
    }, 120);
  }

  // -----------------------------
  //  表情セット
  // -----------------------------
  function setExpression(mood) {
    const panel = document.getElementById("shiopon-panel");
    const ear = panel.querySelector(".sp-layer.sp-ear");
    const eyes = panel.querySelector(".sp-layer.sp-eyes");
    const extra = panel.querySelector(".sp-layer.sp-face-extra");

    extra.style.opacity = 0;

    if (mood === "smile" || mood === "excited") {
      ear.style.backgroundImage = `url(${BUST}ear_up.png)`;
      eyes.style.backgroundImage = `url(${BUST}eyes_smile.png)`;
      extra.style.backgroundImage = `url(${BUST}face_blush.png)`;
      extra.style.opacity = 1;
    } else if (mood === "worry") {
      ear.style.backgroundImage = `url(${BUST}ear_neutral.png)`;
      eyes.style.backgroundImage = `url(${BUST}eyes_half.png)`;
      extra.style.backgroundImage = `url(${BUST}face_sweat.png)`;
      extra.style.opacity = 1;
    } else {
      ear.style.backgroundImage  = `url(${BUST}ear_neutral.png)`;
      eyes.style.backgroundImage = `url(${BUST}eyes_open.png)`;
    }
  }

  // -----------------------------
  //  アイドルアニメ（まばたき＋耳ぴょこ）
  // -----------------------------
  function setupIdleAnimations() {
    setInterval(() => blinkBust(), randomRange(4000, 7000));
    setInterval(() => earPyon(),  randomRange(5000, 9000));
  }

  function blinkBust() {
    const panel = document.getElementById("shiopon-panel");
    const eyes = panel.querySelector(".sp-layer.sp-eyes");

    const mood = state.lastMood || "neutral";

    let open, half, closed;

    if (mood === "smile" || mood === "excited") {
      open   = `${BUST}eyes_smile.png`;
      half   = `${BUST}eyes_closed.png`;
      closed = `${BUST}eyes_closed.png`;
    } else if (mood === "worry") {
      open   = `${BUST}eyes_half.png`;
      half   = `${BUST}eyes_closed.png`;
      closed = `${BUST}eyes_closed.png`;
    } else {
      open   = `${BUST}eyes_open.png`;
      half   = `${BUST}eyes_half.png`;
      closed = `${BUST}eyes_closed.png`;
    }

    eyes.style.backgroundImage = `url(${half})`;
    setTimeout(() => {
      eyes.style.backgroundImage = `url(${closed})`;
      setTimeout(() => {
        eyes.style.backgroundImage = `url(${half})`;
        setTimeout(() => {
          eyes.style.backgroundImage = `url(${open})`;
        }, 40);
      }, 40);
    }, 40);
  }

  function earPyon() {
    const panel = document.getElementById("shiopon-panel");
    const ear = panel.querySelector(".sp-layer.sp-ear");

    ear.style.backgroundImage = `url(${BUST}ear_up.png)`;
    setTimeout(() => {
      ear.style.backgroundImage = `url(${BUST}ear_neutral.png)`;
    }, 120);
  }

  // -----------------------------
  //  ゲート遷移
  // -----------------------------
  function starJumpTo(url) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background =
      "radial-gradient(circle at 50% 70%, rgba(255,255,255,0.9), rgba(12,10,22,1))";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.35s ease-out";
    overlay.style.zIndex = "99999";
    document.body.appendChild(overlay);

    requestAnimationFrame(() => (overlay.style.opacity = "1"));

    setTimeout(() => {
      window.location.href = url;
    }, 350);
  }

  // -----------------------------
  //  Utils
  // -----------------------------
  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

})();
