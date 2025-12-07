// ==============================
//  Shiopon Companion v1.0
//  Shionverse 全域常駐 相棒システム
// ==============================
(function () {
  const ASSET_BASE = "/assets/shiopon/";
  const BUST = ASSET_BASE + "bust/";
  const TOGGLE = ASSET_BASE + "toggle/";
  const MINI = ASSET_BASE + "mini/";
  const TXT_PATH = ASSET_BASE + "shiopon_lines.txt";

  const STORAGE_KEY = "shiopon_state_v1";

  const defaultState = {
    visits: 0,
    lastMood: "neutral",
    silent: false
  };

  let state = loadState();
  let speakingTimer = null;
  let initialized = false;

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
    } catch {
      /* ignore */
    }
  }

  // セリフセット（後で txt から拡張）
  let lineSets = {
    greetingFirst: [
      { mood: "smile", text: "はじめましてなの！\nしおぽん、シオンさんの相棒だよ〜" },
      { mood: "smile", text: "わぁ…ここまで来てくれてありがとなの！\nいっしょに星を見に行こ？" }
    ],
    greetingAgain: [
      { mood: "smile", text: "{name}さんおかえりなの〜！\n今日もいっしょに旅、続けよ？" },
      { mood: "neutral", text: "{name}さん、また来てくれたの？\nふふ、星たちが喜んでるよ〜" }
    ],
    idle: [
      { mood: "neutral", text: "星の声、ちょっとだけざわざわしてるの。\n…あとで、いっしょに聞いてみる？" },
      { mood: "neutral", text: "ここ、落ち着く場所だね〜。\nしおぽん、ちょっとだけここに住みたいかも…" },
      { mood: "smile", text: "{name}さんと一緒なら、\nどのゲートもこわくないの〜！" },
      { mood: "neutral", text: "今日の{name}さんの心、\nどんな星座の形してるかなぁ…" }
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

  // txt の形式： keyName|mood|text
  // 例： idle|neutral|今日はどんな一日だったの？
  function loadLinesFromTxt() {
    fetch(TXT_PATH)
      .then((res) => {
        if (!res.ok) throw new Error("no txt");
        return res.text();
      })
      .then((text) => {
        const lines = text.split(/\r?\n/);
        lines.forEach((row) => {
          const line = row.trim();
          if (!line || line.startsWith("#")) return;
          const [key, mood, body] = line.split("|");
          if (!key || !body) return;
          const moodVal = (mood || "neutral").trim();
          const entry = { mood: moodVal, text: body.trim() };
          if (!lineSets[key]) lineSets[key] = [];
          lineSets[key].push(entry);
        });
      })
      .catch(() => {
        /* 無くても問題なし */
      });
  }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (initialized) return;
    initialized = true;

    // ルート取得 or 自動生成
    let root = document.getElementById("shiopon-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "shiopon-root";
      document.body.appendChild(root);
    }

    // マークアップを注入
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

    const panel = document.getElementById("shiopon-panel");
    const toggleBtn = document.getElementById("shiopon-toggle");
    const textEl = document.getElementById("shiopon-text");
    if (!panel || !toggleBtn || !textEl) return;

    // ページ設定
    const cfg = window.ShioponConfig || {};
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

    const bustLayers = {
      shadow: panel.querySelector(".sp-layer.sp-shadow"),
      ear: panel.querySelector(".sp-layer.sp-ear"),
      body: panel.querySelector(".sp-layer.sp-body"),
      faceExtra: panel.querySelector(".sp-layer.sp-face-extra"),
      eyes: panel.querySelector(".sp-layer.sp-eyes"),
      mouth: panel.querySelector(".sp-layer.sp-mouth"),
      avatar: panel.querySelector(".sp-avatar")
    };

    const miniShadow = panel.querySelector(".sp-mini-shadow");
    const miniBody = panel.querySelector(".sp-mini-body");

    const toggleLayers = {
      shadow: toggleBtn.querySelector(".sp-toggle-layer.sp-toggle-shadow"),
      ear: toggleBtn.querySelector(".sp-toggle-layer.sp-toggle-ear"),
      base: toggleBtn.querySelector(".sp-toggle-layer.sp-toggle-base"),
      eyes: toggleBtn.querySelector(".sp-toggle-layer.sp-toggle-eyes"),
      mouth: toggleBtn.querySelector(".sp-toggle-layer.sp-toggle-mouth")
    };

    setupImages(bustLayers, miniShadow, miniBody, toggleLayers);
    setupIdleAnimations(bustLayers, toggleLayers);

    const closeBtn = panel.querySelector(".sp-close");
    const actionButtons = panel.querySelectorAll(".sp-btn");

    toggleBtn.addEventListener("click", () => {
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

    closeBtn.addEventListener("click", () => {
      hidePanel(panel);
    });

    actionButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-sp-action");
        handleAction(action, panel, textEl);
      });
    });

    saveState();
    loadLinesFromTxt();
  }

  // 画像セット・プリロード
  function setupImages(bustLayers, miniShadow, miniBody, toggleLayers) {
    if (bustLayers.shadow)
      bustLayers.shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
    if (bustLayers.body)
      bustLayers.body.style.backgroundImage = `url(${BUST}body_base.png)`;
    if (bustLayers.ear)
      bustLayers.ear.style.backgroundImage = `url(${BUST}ear_neutral.png)`;
    if (bustLayers.eyes)
      bustLayers.eyes.style.backgroundImage = `url(${BUST}eyes_open.png)`;
    if (bustLayers.mouth)
      bustLayers.mouth.style.backgroundImage = `url(${BUST}mouth_close.png)`;
    if (bustLayers.faceExtra)
      bustLayers.faceExtra.style.backgroundImage = "none";

    if (miniShadow)
      miniShadow.style.backgroundImage = `url(${MINI}mini_shadow.png)`;
    if (miniBody)
      miniBody.style.backgroundImage = `url(${TOGGLE}toggle_base.png)`;

    if (toggleLayers.shadow)
      toggleLayers.shadow.style.backgroundImage = `url(${TOGGLE}toggle_shadow1.png)`;
    if (toggleLayers.base)
      toggleLayers.base.style.backgroundImage = `url(${TOGGLE}toggle_base.png)`;
    if (toggleLayers.ear)
      toggleLayers.ear.style.backgroundImage = `url(${TOGGLE}toggle_ear_neutral.png)`;
    if (toggleLayers.eyes)
      toggleLayers.eyes.style.backgroundImage = `url(${TOGGLE}toggle_eyes_open.png)`;
    if (toggleLayers.mouth)
      toggleLayers.mouth.style.backgroundImage = `url(${TOGGLE}toggle_mouth_close.png)`;

    const preloadList = [
      `${BUST}eyes_half.png`,
      `${BUST}eyes_closed.png`,
      `${BUST}eyes_smile.png`,
      `${BUST}mouth_open1.png`,
      `${BUST}mouth_open2.png`,
      `${BUST}mouth_smile.png`,
      `${BUST}mouth_smile2.png`,
      `${BUST}face_blush.png`,
      `${BUST}face_sweat.png`,
      `${TOGGLE}toggle_ear_up.png`,
      `${TOGGLE}toggle_eyes_half.png`,
      `${TOGGLE}toggle_eyes_closed.png`,
      `${TOGGLE}toggle_mouth_open.png`,
      `${TOGGLE}toggle_shadow2.png`
    ];

    preloadList.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

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

  // ボタンアクション
  function handleAction(action, panel, textEl) {
    if (action === "more") {
      const pool = lineSets.idle.concat(lineSets.excited || []);
      const line = pickRandom(pool);
      speak(line, textEl);
      return;
    }

    if (action === "guide") {
      const gates = window.ShioponGates || [];
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
    }
  }

  // セリフ＋口パク
  function speak(line, textEl, onDone) {
    if (!line || !textEl) return;

    state.lastMood = line.mood || "neutral";
    saveState();

    setExpression(line.mood || "neutral");
    textEl.textContent = line.text;

    if (speakingTimer) {
      clearInterval(speakingTimer);
      speakingTimer = null;
    }

    const duration = Math.max(1500, line.text.length * 60);
    const start = performance.now();
    const panel = document.getElementById("shiopon-panel");
    const mouthLayer = panel && panel.querySelector(".sp-layer.sp-mouth");

    let phase = 0;

    speakingTimer = setInterval(() => {
      const now = performance.now();
      const t = now - start;
      if (!mouthLayer) return;

      if (line.mood === "smile" || line.mood === "excited") {
        // 笑顔用：閉じる → smile2 → smile
        if (phase === 0) {
          mouthLayer.style.backgroundImage = `url(${BUST}mouth_close.png)`;
        } else if (phase === 1) {
          mouthLayer.style.backgroundImage = `url(${BUST}mouth_smile2.png)`;
        } else {
          mouthLayer.style.backgroundImage = `url(${BUST}mouth_smile.png)`;
        }
      } else {
        // 通常：open1 → open2 → close
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

        if (line.mood === "smile" || line.mood === "excited") {
          mouthLayer.style.backgroundImage = `url(${BUST}mouth_smile.png)`;
        } else {
          mouthLayer.style.backgroundImage = `url(${BUST}mouth_close.png)`;
        }

        if (typeof onDone === "function") onDone();
      }
    }, 120);
  }

  // 表情セット
  function setExpression(mood) {
    const panel = document.getElementById("shiopon-panel");
    if (!panel) return;

    const shadow = panel.querySelector(".sp-layer.sp-shadow");
    const ear = panel.querySelector(".sp-layer.sp-ear");
    const eyes = panel.querySelector(".sp-layer.sp-eyes");
    const mouth = panel.querySelector(".sp-layer.sp-mouth");
    const extra = panel.querySelector(".sp-layer.sp-face-extra");
    const avatar = panel.querySelector(".sp-avatar");

    if (avatar) {
      avatar.classList.remove("sp-mood-happy", "sp-mood-worry");
    }

    if (shadow)
      shadow.style.backgroundImage = `url(${BUST}shadow_base.png)`;
    if (ear) ear.style.backgroundImage = `url(${BUST}ear_neutral.png)`;
    if (eyes) eyes.style.backgroundImage = `url(${BUST}eyes_open.png)`;
    if (mouth) mouth.style.backgroundImage = `url(${BUST}mouth_close.png)`;
    if (extra) {
      extra.style.backgroundImage = "none";
      extra.style.opacity = "0";
    }

    switch (mood) {
      case "smile":
      case "excited":
        if (eyes)
          eyes.style.backgroundImage = `url(${BUST}eyes_smile.png)`;
        if (mouth)
          mouth.style.backgroundImage = `url(${BUST}mouth_smile.png)`;
        if (extra) {
          extra.style.backgroundImage = `url(${BUST}face_blush.png)`;
          extra.style.opacity = "1";
        }
        if (avatar) avatar.classList.add("sp-mood-happy");
        break;

      case "worry":
        if (eyes)
          eyes.style.backgroundImage = `url(${BUST}eyes_half.png)`;
        if (extra) {
          extra.style.backgroundImage = `url(${BUST}face_sweat.png)`;
          extra.style.opacity = "1";
        }
        if (avatar) avatar.classList.add("sp-mood-worry");
        break;

      default:
        break;
    }
  }

  // アイドルアニメ
  function setupIdleAnimations(bustLayers, toggleLayers) {
    setInterval(() => {
      blinkBust();
    }, randomRange(4000, 7000));

    setInterval(() => {
      blinkToggle(toggleLayers);
    }, randomRange(4500, 8000));

    setInterval(() => {
      earPyonBust(bustLayers);
    }, randomRange(5000, 9000));

    setInterval(() => {
      earPyonToggle(toggleLayers);
    }, randomRange(5200, 9500));
  }

 // まばたき（バストアップ）
// まばたき（バストアップ）全部3段階版
function blinkBust() {
  const panel = document.getElementById("shiopon-panel");
  if (!panel) return;
  const eyes = panel.querySelector(".sp-layer.sp-eyes");
  if (!eyes) return;

  const mood = state.lastMood || "neutral";

  // 気分ごとに「open / half / closed」を決める
  let texOpen, texHalf, texClosed;

  if (mood === "smile" || mood === "excited") {
    // 😊 ニコニコ中：open=笑顔、half/closed=ぎゅっと目つぶり
    texOpen   = `${BUST}eyes_smile.png`;
    texHalf   = `${BUST}eyes_closed.png`; // ちょっと細めに見えるイメージ
    texClosed = `${BUST}eyes_closed.png`;
  } else if (mood === "worry") {
    // 😟 心配顔：open=half、half=closed、closed=closed
    texOpen   = `${BUST}eyes_half.png`;
    texHalf   = `${BUST}eyes_closed.png`;
    texClosed = `${BUST}eyes_closed.png`;
  } else {
    // 😐 通常：open→half→closed→half→open のフル3段階
    texOpen   = `${BUST}eyes_open.png`;
    texHalf   = `${BUST}eyes_half.png`;
    texClosed = `${BUST}eyes_closed.png`;
  }

  // open → half → closed → half → open
  // ※時間は一瞬なので全部 40ms ずつくらい
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
  
  function blinkToggle(toggleLayers) {
    const eyes = toggleLayers.eyes;
    if (!eyes) return;
    eyes.style.backgroundImage = `url(${TOGGLE}toggle_eyes_closed.png)`;
    setTimeout(() => {
      eyes.style.backgroundImage = `url(${TOGGLE}toggle_eyes_open.png)`;
    }, 120);
  }

  // 耳ぴょこ（バストアップ）
  function earPyonBust(bustLayers) {
  const ear = bustLayers.ear;
  const shadow = bustLayers.shadow;
  if (!ear || !shadow) return;

  // 今の気分に応じた“基準の耳/影”
  const isSmile = state.lastMood === "smile" || state.lastMood === "excited";
  const baseEar = isSmile
    ? `${BUST}ear_up.png`
    : `${BUST}ear_neutral.png`;
  const baseShadow = isSmile
    ? `${BUST}shadow_up.png`
    : `${BUST}shadow_base.png`;

  // ぴょこっと「反転」させる：
  //  笑顔中 → (一瞬だけ neutral) → もとに戻る(up)
  //  通常   → (一瞬だけ up)       → もとに戻る(neutral)
  const pyonEar = isSmile
    ? `${BUST}ear_neutral.png`
    : `${BUST}ear_up.png`;
  const pyonShadow = isSmile
    ? `${BUST}shadow_base.png`
    : `${BUST}shadow_up.png`;

  // 一瞬だけ“ぴょこ”
  ear.style.backgroundImage = `url(${pyonEar})`;
  shadow.style.backgroundImage = `url(${pyonShadow})`;

  setTimeout(() => {
    // 基準状態に戻す
    ear.style.backgroundImage = `url(${baseEar})`;
    shadow.style.backgroundImage = `url(${baseShadow})`;
  }, 120); // ← 耳ぴょこは一瞬で
}
  // 耳ぴょこ（トグル）
  function earPyonToggle(toggleLayers) {
    const ear = toggleLayers.ear;
    const shadow = toggleLayers.shadow;
    if (!ear || !shadow) return;

    ear.style.backgroundImage = `url(${TOGGLE}toggle_ear_up.png)`;
    shadow.style.backgroundImage = `url(${TOGGLE}toggle_shadow2.png)`;

    setTimeout(() => {
      ear.style.backgroundImage = `url(${TOGGLE}toggle_ear_neutral.png)`;
      shadow.style.backgroundImage = `url(${TOGGLE}toggle_shadow1.png)`;
    }, 120);
  }

  function getUserName() {
  const name = localStorage.getItem("lumiereVisitorName");
  return name && name.trim() ? name : "きみ";
}

 function applyUserName(text) {
  const userName = getUserName();
  return text.replace(/\{name\}/g, userName);
} 
  textEl.textContent = applyUserName(line.text);

  // ゲートジャンプ演出
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

  // ユーティリティ
  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
  }

  function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
})();
