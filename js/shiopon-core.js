// ============================================================
//  Shiopon Companion System v2.0
//  --- CORE MODULE（状態管理・セリフ・学習・会話制御）---
// ============================================================

(() => {
  "use strict";

  const STORAGE_KEY = "shiopon_state_v2";
  const LINES_TXT = "assets/shiopon/shiopon_lines.txt";

  // ------------------------------------------------------------
  // プロフィール / 状態のファクトリ
  //   ※ 参照共有バグを防ぐため、毎回新しいオブジェクトを生成
  // ------------------------------------------------------------
  function createDefaultProfile() {
    return {
      visitsByHour: Array(24).fill(0), // 各時間帯の訪問回数
      totalVisits: 0,
      totalTalkClicks: 0,     // 「もっと話す」
      totalGuideClicks: 0,    // 「案内して」
      totalSilentOn: 0,       // サイレントON
      totalSilentOff: 0,      // サイレントOFF
      lastVisitTs: 0,
      lastCategory: null,     // 直近に喋ったカテゴリ
      lastSilentChangeTs: 0
    };
  }

  function createDefaultState() {
    return {
      visits: 0,
      silent: false,
      lastMood: "neutral",
      lastActionTime: 0,
      profile: createDefaultProfile()
    };
  }

  // ------------------------------------------------------------
  // 状態管理
  // ------------------------------------------------------------
  let state = loadState();
  let lineDict = {};        // { category: [ { mood, expression, text } ] }
  let speakingTimer = null;
  let linesLoaded = false;

  function loadState() {
    const base = createDefaultState();

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;

      const parsed = JSON.parse(raw) || {};
      const loadedProfile = parsed.profile || {};

      // visitsByHour を含めてマージしつつ、必ず length 24 に揃える
      let visitsByHour = Array.isArray(loadedProfile.visitsByHour)
        ? loadedProfile.visitsByHour.slice(0, 24)
        : [];

      if (visitsByHour.length < 24) {
        visitsByHour = visitsByHour.concat(
          Array(24 - visitsByHour.length).fill(0)
        );
      }

      const profile = {
        ...createDefaultProfile(),
        ...loadedProfile,
        visitsByHour
      };

      return {
        ...base,
        ...parsed,
        profile
      };
    } catch {
      return base;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  // ------------------------------------------------------------
  // ユーザー名
  //  ※ shiopon_lines.txt 側は {name} さん まで書いてある前提なので
  //    ここでは「さん」を付け足さない。
  // ------------------------------------------------------------
  function getUserName() {
    try {
      const n = localStorage.getItem("lumiereVisitorName");
      return n && n.trim() ? n.trim() : "きみ";
    } catch {
      return "きみ";
    }
  }

  function applyUserName(text) {
    return (text || "").replace(/\{name\}/g, getUserName());
  }

  // ------------------------------------------------------------
  // TXT 読み込み & パース
  // 形式：category|mood|expression|text
  // ------------------------------------------------------------
  async function loadLinesTxt() {
    try {
      const res = await fetch(LINES_TXT, { cache: "no-cache" });
      if (!res.ok) throw new Error("response not ok");
      const txt = await res.text();
      lineDict = parseLines(txt);
      linesLoaded = Object.keys(lineDict).length > 0;
    } catch (e) {
      console.warn("shiopon_lines.txt が読めませんでした:", e);
      lineDict = {};
      linesLoaded = false;
    }
  }

  // ------------------------------------------------------------
// TXT 読み込み & パース
// 形式：category|expression|text  （v1互換）
//   category … greetingFirst / idle / night など
//   expression … smile / worry / neutral など（= mood）
//   text … セリフ本文
// ------------------------------------------------------------
function parseLines(raw) {
  const dict = {};
  const rows = raw.split(/\r?\n/);

  rows.forEach((row) => {
    const line = row.trim();
    if (!line || line.startsWith("#")) return;

    const parts = line.split("|").map((v) => v.trim());
    if (parts.length < 3) return;

    const [category, expression, text] = parts;
    if (!category || !text) return;

    if (!dict[category]) dict[category] = [];
    dict[category].push({
      mood: expression || "neutral",
      expression: expression || "neutral",
      text
    });
  });

  return dict;
}
  
  // ------------------------------------------------------------
  // ユーティリティ
  // ------------------------------------------------------------
  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
  }

  // 指定カテゴリから 1 つ抽選（mood 指定も可）
  function pickLine(category, mood = null) {
    const pool = lineDict[category];
    if (!pool || !pool.length) return null;

    let filtered = pool;
    if (mood) {
      filtered = pool.filter((item) => item.mood === mood);
      if (!filtered.length) filtered = pool;
    }

    const base = pickRandom(filtered);
    if (!base) return null;

    return {
      category,
      mood: base.mood || "neutral",
      expression: base.expression || base.mood || "neutral",
      text: base.text || ""
    };
  }

  // ------------------------------------------------------------
  // プロフィール更新ヘルパー
  // ------------------------------------------------------------
  function ensureVisitsByHour(profile) {
    if (!profile) return;
    if (!Array.isArray(profile.visitsByHour)) {
      profile.visitsByHour = Array(24).fill(0);
      return;
    }
    if (profile.visitsByHour.length < 24) {
      profile.visitsByHour = profile.visitsByHour.concat(
        Array(24 - profile.visitsByHour.length).fill(0)
      );
    } else if (profile.visitsByHour.length > 24) {
      profile.visitsByHour = profile.visitsByHour.slice(0, 24);
    }
  }

  function updateProfileOnVisit() {
    const hour = new Date().getHours();
    const p = state.profile || (state.profile = createDefaultProfile());

    ensureVisitsByHour(p);

    p.visitsByHour[hour] = (p.visitsByHour[hour] || 0) + 1;
    p.totalVisits += 1;
    p.lastVisitTs = Date.now();

    state.profile = p;
    saveState();
  }

  function updateProfileOnAction(action) {
    const p = state.profile || (state.profile = createDefaultProfile());

    if (action === "more") {
      p.totalTalkClicks += 1;
    } else if (action === "guide") {
      p.totalGuideClicks += 1;
    } else if (action === "silent-on") {
      p.totalSilentOn += 1;
      p.lastSilentChangeTs = Date.now();
    } else if (action === "silent-off") {
      p.totalSilentOff += 1;
      p.lastSilentChangeTs = Date.now();
    }

    state.profile = p;
    state.lastActionTime = Date.now();
    saveState();
  }

  function updateProfileOnCategory(category) {
    const p = state.profile || (state.profile = createDefaultProfile());
    p.lastCategory = category;
    state.profile = p;
    state.lastActionTime = Date.now();
    saveState();
  }

  // ------------------------------------------------------------
  // ユーザーの「クセ」推定
  // ------------------------------------------------------------
  function getUserTraits() {
    const p = state.profile || createDefaultProfile();
    ensureVisitsByHour(p);

    const traits = {
      isNightOwl: false,
      isTalkative: false,
      likesGuide: false,
      prefersSilent: false
    };

    // 夜型：23〜4時の訪問割合が 35% 以上なら true
    const nightIndexes = [23, 0, 1, 2, 3, 4];
    let nightCount = 0;
    let total = 0;

    for (let i = 0; i < 24; i++) {
      const v = p.visitsByHour[i] || 0;
      total += v;
      if (nightIndexes.includes(i)) nightCount += v;
    }

    if (total > 0 && nightCount / total >= 0.35) {
      traits.isNightOwl = true;
    }

    // おしゃべりさん
    if (p.totalTalkClicks >= 5 && p.totalTalkClicks >= p.totalGuideClicks * 1.3) {
      traits.isTalkative = true;
    }

    // 案内好き
    if (p.totalGuideClicks >= 5 && p.totalGuideClicks >= p.totalTalkClicks * 1.3) {
      traits.likesGuide = true;
    }

    // サイレント多用
    const silentTotal = p.totalSilentOn + p.totalSilentOff;
    if (silentTotal >= 4 && p.totalSilentOn >= p.totalSilentOff) {
      traits.prefersSilent = true;
    }

    return traits;
  }

  // ------------------------------------------------------------
  // 状況＋性格 からカテゴリ自動決定
  // ------------------------------------------------------------
  function getSituationCategory() {
    const hour = new Date().getHours();
    const visit = state.visits || 0;
    const isSilent = state.silent || false;
    const now = Date.now();
    const idleSec = (now - (state.lastActionTime || now)) / 1000;
    const traits = getUserTraits();

    // 1️⃣ 初回
    if (visit <= 1) return "greetingFirst";

    // 2️⃣ 2回目の訪問
    if (visit === 2) return "greetingAgain";

    // 3️⃣ サイレントモード中
    if (isSilent) return "silentOn";

    // 4️⃣ 放置（30秒以上）
    if (idleSec > 30) {
      if ((hour >= 23 || hour < 4) && (traits.isNightOwl || traits.prefersSilent)) {
        return "night";
      }
      return "idle";
    }

    // 5️⃣ 深夜帯
    if (hour >= 23 || hour < 4) {
      if (traits.prefersSilent) return "night";
      return "comfort";
    }

    // 6️⃣ おしゃべりさん
    if (traits.isTalkative) {
      const lastCat = state.profile?.lastCategory;
      if (lastCat === "excited") return "idle";
      return "excited";
    }

    // 7️⃣ 案内好き
    if (traits.likesGuide) {
      return "guideIntro";
    }

    // 8️⃣ それ以外は通常 idle
    return "idle";
  }

    // ------------------------------------------------------------
  // セリフ発話（しおぽんの声）
  // window.ShioponVisual と連携
  // ------------------------------------------------------------
  function speakLineObject(line, onDone) {
    if (!line) return;

    const textEl = document.getElementById("shiopon-text");
    if (!textEl) return;

    const mood = line.mood || line.expression || "neutral";
    const expression = line.expression || line.mood || "neutral";
    const finalText = applyUserName(line.text || "");

    state.lastMood = mood;
    state.lastActionTime = Date.now();
    saveState();

    // 🟣 ここでパネルの mood クラスを更新
    const panel = document.getElementById("shiopon-panel");
    if (panel) {
      panel.classList.remove(
        "mood-neutral",
        "mood-smile",
        "mood-excited",
        "mood-worry"
      );

      const mode = expression || mood || "neutral";
      panel.classList.add(`mood-${mode}`);
    }

    // 表情セット（外部モジュールに委譲）
    if (window.ShioponVisual && typeof window.ShioponVisual.setExpression === "function") {
      window.ShioponVisual.setExpression(expression);
    }

    // テキスト反映
    textEl.textContent = finalText;

    // 口パクアニメ
    if (speakingTimer) {
      clearInterval(speakingTimer);
      speakingTimer = null;
    }

    const mouthLayer = document.querySelector(".sp-layer.sp-mouth");
    const start = performance.now();
    const duration = Math.max(1500, finalText.length * 70);
    let phase = 0;

    speakingTimer = setInterval(() => {
      const now = performance.now();
      if (now - start >= duration) {
        clearInterval(speakingTimer);
        speakingTimer = null;

        if (window.ShioponVisual && typeof window.ShioponVisual.resetMouth === "function") {
          window.ShioponVisual.resetMouth(expression);
        }
        if (typeof onDone === "function") onDone();
        return;
      }

      if (
        window.ShioponVisual &&
        typeof window.ShioponVisual.animateMouth === "function" &&
        mouthLayer
      ) {
        window.ShioponVisual.animateMouth(mouthLayer, expression, phase);
      }
      phase = (phase + 1) % 3;
    }, 120);
  }

  // 状況に応じて自動でカテゴリ → セリフ選択
  function autoSpeak() {
    // テキスト未ロードなら何もしない or 簡易フォールバック
    if (!linesLoaded || !lineDict || Object.keys(lineDict).length === 0) {
      // 最低限のフォールバック
      const fallback = {
        category: "idle",
        mood: "neutral",
        expression: "neutral",
        text: "えっとね…今、星の声を準備してるところなの。ちょっとだけ待っててね。"
      };
      speakLineObject(fallback);
      return;
    }

    const category = getSituationCategory();
    const line = pickLine(category);
    if (!line) return;

    updateProfileOnCategory(category);
    speakLineObject(line);
  }

  // ------------------------------------------------------------
  // パネル開閉
  //  ※ bootstrap 側から呼び出す前提
  // ------------------------------------------------------------
  function showPanel() {
    const panel = document.getElementById("shiopon-panel");
    if (!panel) return;

    panel.classList.remove("sp-hidden");
    panel.classList.add("sp-visible");

    state.visits += 1;
    state.lastActionTime = Date.now();
    saveState();
    updateProfileOnVisit();

    autoSpeak();
  }

  function hidePanel() {
    const panel = document.getElementById("shiopon-panel");
    if (!panel) return;

    panel.classList.remove("sp-visible");
    panel.classList.add("sp-hidden");
  }

  // ------------------------------------------------------------
  // ゲートジャンプ演出（必要なら使用）
  // ------------------------------------------------------------
  function starJumpTo(url) {
    if (!url) return;

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background =
      "radial-gradient(circle at 50% 70%, rgba(255,255,255,0.9), rgba(12,10,22,1))";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.35s ease-out";
    overlay.style.pointerEvents = "auto"; // ★ 二重クリック防止のためブロック
    overlay.style.zIndex = "99999";
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

    setTimeout(() => {
      window.location.href = url;
    }, 350);
  }

  // ------------------------------------------------------------
  // ボタンアクション
  //  ※ bootstrap 側：data-sp-action="more|guide|silent"
  // ------------------------------------------------------------
  function handleAction(action) {
    const panel = document.getElementById("shiopon-panel");
    const textEl = document.getElementById("shiopon-text");
    if (!panel || !textEl) return;

    if (action === "more") {
      updateProfileOnAction("more");

      // idle / excited をゆるく行き来
      const traits = getUserTraits();
      const baseCat = traits.isTalkative ? "excited" : "idle";
      const candidates =
        baseCat === "excited" ? ["excited", "idle"] : ["idle", "excited"];
      const chosenCat = pickRandom(candidates);
      const line = pickLine(chosenCat) || pickLine("idle");
      if (!line) return;
      updateProfileOnCategory(chosenCat);
      speakLineObject(line);
      return;
    }

    if (action === "guide") {
      updateProfileOnAction("guide");

      const gates = window.ShioponGates || [];
      if (!gates.length) {
        const fallback = {
          category: "guideIntro",
          mood: "worry",
          expression: "worry",
          text: "あれれ…このページには\n案内できるゲートが見当たらないの…。"
        };
        speakLineObject(fallback);
        return;
      }

      const intro = pickLine("guideIntro") || {
        category: "guideIntro",
        mood: "smile",
        expression: "smile",
        text: "どのゲートに行こっか？しおぽん、{name}のあとをついていくの！"
      };

      speakLineObject(intro, () => {
        const target = pickRandom(gates);
        if (!target || !target.url) return;
        starJumpTo(target.url);
      });
      return;
    }

    if (action === "silent") {
      state.silent = !state.silent;
      saveState();

      const root = document.getElementById("shiopon-root");
      if (root) {
        if (state.silent) root.classList.add("sp-silent");
        else root.classList.remove("sp-silent");
      }

      if (state.silent) {
        updateProfileOnAction("silent-on");
        const line = pickLine("silentOn");
        if (line) {
          updateProfileOnCategory("silentOn");
          speakLineObject(line);
        }
      } else {
        updateProfileOnAction("silent-off");
        const line = pickLine("silentOff");
        if (line) {
          updateProfileOnCategory("silentOff");
          speakLineObject(line);
        }
      }
    }
  }

  // ------------------------------------------------------------
  // 初期化（bootstrap 側から呼ぶ）
  // ------------------------------------------------------------
  async function init() {
    await loadLinesTxt();
    // ここでは喋らない。パネルが開いたら autoSpeak で挨拶。
  }

  // ------------------------------------------------------------
  // 公開 API
  // ------------------------------------------------------------
  window.ShioponCore = {
    init,               // 非同期：テキスト読み込み
    showPanel,          // トグルで開くときに呼ぶ
    hidePanel,
    handleAction,
    speakLineObject,
    getState: () => state,
    getUserTraits
  };
})();


