const LOVE_PAGE_CONFIG = {
  consultationUrl: "https://lin.ee/LYnlU0f",
  returnUrl: "../tarot369.html",
  cardBackImage: "./tarot/card-back.webp",
  musicIndexUrl: "../music/index.json",
  fallbackBridgeType: "ambiguous",

  defaultCtaTitle: "相手の本音や、この恋をどう扱えばいいかまで丁寧に知りたいときは",
  defaultCardName: "カードはまだ静かに伏せられています",
  defaultCardKeyword: "恋愛の星詠を始めてください",
  startButtonLabel: "この恋に届いている言葉を受け取る",
  redrawButtonLabel: "もう一度、この恋の言葉を受け取る",
  defaultCtaButtonLabel: "この恋を、個人鑑定で丁寧に見てもらう",
  defaultSafeNote:
    "LINEからご相談いただけます。まだ相談するか迷っている段階でも大丈夫です。気持ちがまとまっていなくても、そのまま話せます。",

  concernIntro: {
    default:
      "あの人の顔や名前、最後のやり取り、いちばん引っかかっている言葉、そして今いちばん不安になっていることを静かに思い浮かべてください。準備ができたら、下のボタンからこの恋に届いているメッセージを開けます。",
    既読無視:
      "最後に送った言葉、返事を待っている時間、既読がついたまま動かない画面。その中でいちばん苦しくなっている気持ちを、静かにここへ置いてください。",
    相手の気持ち:
      "あの人が今どんな気持ちでいるのか、あなたをどう見ているのか。知りたい本音をひとつだけ心に置いて、カードを開いてください。",
    復縁:
      "もう一度つながれる可能性、相手の中に残っている気持ち、今動くべきか待つべきか。その不安をひとつ、静かにカードへ預けてください。",
    曖昧な関係:
      "はっきりしない関係、言葉にされない距離感、期待していいのか分からない不安。その曖昧さの中にある本音を、カードで整理していきます。"
  },

  concernHint: {
    default:
      "※このページでは、今の恋に流れている大きな気配を一枚で映します。相手の本音、流れの変わり目、待つべきか進むべきかまで状況に合わせて整理したいときは、個人鑑定でさらに深く読み解けます。",
    既読無視:
      "※既読無視の背景には、相手の状況・気持ち・距離の取り方が重なっていることがあります。無料版では今いちばん強い気配を一枚で映し、個人鑑定では連絡の意味や次の動き方まで丁寧に整理します。",
    相手の気持ち:
      "※相手の気持ちは、言葉だけでは見えにくいことがあります。無料版では今の気持ちの傾きを一枚で映し、個人鑑定では関係の流れや今後の可能性まで深く読み解きます。",
    復縁:
      "※復縁は、可能性だけでなくタイミングと心の整え方が大切です。無料版では今の流れを一枚で映し、個人鑑定では相手の未練や再接近のきっかけまで整理します。",
    曖昧な関係:
      "※曖昧な関係ほど、一部分だけでは判断しきれないことがあります。無料版では今の関係の空気を一枚で映し、個人鑑定では相手の本音とあなたの守るべき境界線まで見ていきます。"
  },

  concernBridgePrefix: {
    既読無視:
      "既読無視が続くと、どうしても自分だけが置いていかれたように感じやすくなります。",
    相手の気持ち:
      "相手の気持ちを知りたいときほど、自分の心も揺れやすくなります。",
    復縁:
      "復縁を望む気持ちは、過去を戻したいだけでなく、まだ大切にしたい想いがある証です。",
    曖昧な関係:
      "曖昧な関係は、期待と不安が同時に育ちやすい場所です。"
  },

  musicLabels: {
    default: "今夜の気持ちに、そっとこの曲を聴く",
    playing: "静かに再生しています",
    paused: "もう一度聴く"
  },

  musicStatusText: {
    default: "まだ再生していません",
    playing: "再生中です",
    paused: "一時停止しています",
    error: "再生できませんでした。時間をおいてもう一度お試しください。"
  },

  fallbackMusicTrack: {
    slug: "love-theme",
    title: "心が少し重たい夜に、そっと置いておきたい曲",
    description:
      "言葉にならない気持ちを抱えたままでも聴けるように。少し切ないけれど、静かに心へ沈んでいく一曲です。",
    src: "../music/tracks/love-theme.mp3",
    buttonLabel: "今夜の気持ちに、そっとこの曲を聴く",
    mood: "quiet-night"
  }
};

function byId(id) {
  return document.getElementById(id);
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function pickRandom(list) {
  if (!isNonEmptyArray(list)) return "";
  return list[Math.floor(Math.random() * list.length)];
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

const state = {
  flipTimerId: null,
  scrollTimerId: null,
  stickyTimerIds: [],
  lastCardSlug: null,
  hasDrawn: false,
  selectedConcern: "default",
  musicTracks: [],
  manualMusicStop: false
};

const elements = {
  year: byId("year"),
  returnLink: byId("returnLink"),

  startBtn: byId("startBtn"),
  concernLinks: Array.from(document.querySelectorAll(".concern-chips a")),

  cardWrap: byId("cardWrap"),
  cardImage: byId("cardImage"),
  cardName: byId("cardName"),
  cardKeyword: byId("cardKeyword"),

  resultCard: byId("resultCard"),
  mainText: byId("mainText"),
  subText: byId("subText"),
  bridgeText: byId("bridgeText"),

  ctaTitle: byId("ctaTitle"),
  ctaBtn: byId("ctaBtn"),
  safeNote: byId("safeNote"),

  musicSection: byId("musicSection"),
  musicTitle: byId("musicTitle"),
  musicText: byId("musicText"),
  musicStatus: byId("musicStatus"),
  musicPlayBtn: byId("musicPlayBtn"),
  musicStopBtn: byId("musicStopBtn"),
  loveThemeAudio: byId("loveThemeAudio"),

  readingPanel: byId("readingPanel"),
  startTitle: byId("startTitle"),
  panelText: document.querySelector('[aria-labelledby="startTitle"] .panel-text'),
  hint: document.querySelector('[aria-labelledby="startTitle"] .hint'),

  stickyConsult: byId("stickyConsult")
};

function assertRequiredElements() {
  const requiredKeys = [
    "year",
    "returnLink",
    "startBtn",
    "cardWrap",
    "cardImage",
    "cardName",
    "cardKeyword",
    "resultCard",
    "mainText",
    "subText",
    "bridgeText",
    "ctaTitle",
    "ctaBtn",
    "safeNote",
    "musicSection",
    "musicTitle",
    "musicText",
    "musicStatus",
    "musicPlayBtn",
    "musicStopBtn",
    "loveThemeAudio",
    "readingPanel",
    "startTitle",
    "panelText",
    "hint"
  ];

  const missing = requiredKeys.filter((key) => !elements[key]);

  if (missing.length > 0) {
    throw new Error(`必要なHTML要素が見つかりません: ${missing.join(", ")}`);
  }
}

function getCards() {
  if (!Array.isArray(window.LOVE_CARDS) || window.LOVE_CARDS.length === 0) {
    throw new Error("cards.js が正しく読み込まれていません。");
  }

  return window.LOVE_CARDS;
}

function getBridgePatternSet(type) {
  if (!window.BRIDGE_PATTERNS || typeof window.BRIDGE_PATTERNS !== "object") {
    throw new Error("cards.js 内の BRIDGE_PATTERNS が読み込まれていません。");
  }

  const bridgeType = type || LOVE_PAGE_CONFIG.fallbackBridgeType;
  const patterns = window.BRIDGE_PATTERNS[bridgeType];

  if (isNonEmptyArray(patterns)) {
    return patterns;
  }

  const fallbackPatterns = window.BRIDGE_PATTERNS[LOVE_PAGE_CONFIG.fallbackBridgeType];

  if (isNonEmptyArray(fallbackPatterns)) {
    return fallbackPatterns;
  }

  throw new Error("BRIDGE_PATTERNS の設定が不足しています。");
}

function resolveCardImage(card) {
  if (!card || !card.slug) {
    throw new Error("カード画像パスを解決できません。slug が不足しています。");
  }

  return `./tarot/${card.slug}.webp`;
}

function clearTimers() {
  if (state.flipTimerId) {
    window.clearTimeout(state.flipTimerId);
    state.flipTimerId = null;
  }

  if (state.scrollTimerId) {
    window.clearTimeout(state.scrollTimerId);
    state.scrollTimerId = null;
  }

  state.stickyTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  state.stickyTimerIds = [];
}

function queueStickyCheck(delay) {
  const timerId = window.setTimeout(updateStickyConsult, delay);
  state.stickyTimerIds.push(timerId);
}

function scrollToReadingPanel() {
  elements.readingPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function scrollToStartPanel() {
  elements.startTitle.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function setSelectedConcern(concern) {
  const nextConcern = LOVE_PAGE_CONFIG.concernIntro[concern] ? concern : "default";
  state.selectedConcern = nextConcern;

  elements.concernLinks.forEach((link) => {
    const isSelected = link.dataset.concern === nextConcern;
    link.classList.toggle("is-selected", isSelected);
    link.setAttribute("aria-current", isSelected ? "true" : "false");
  });

  elements.panelText.textContent =
    LOVE_PAGE_CONFIG.concernIntro[nextConcern] || LOVE_PAGE_CONFIG.concernIntro.default;

  elements.hint.textContent =
    LOVE_PAGE_CONFIG.concernHint[nextConcern] || LOVE_PAGE_CONFIG.concernHint.default;
}

function setDefaultCardState() {
  elements.cardWrap.classList.remove("is-flipped");
  elements.cardImage.src = LOVE_PAGE_CONFIG.cardBackImage;
  elements.cardImage.alt = "カード裏面";
  elements.cardName.textContent = LOVE_PAGE_CONFIG.defaultCardName;
  elements.cardKeyword.textContent = LOVE_PAGE_CONFIG.defaultCardKeyword;
}

function setDefaultResultTextState() {
  elements.mainText.textContent = "";
  elements.subText.textContent = "";
  elements.bridgeText.textContent = "";
  elements.ctaTitle.textContent = LOVE_PAGE_CONFIG.defaultCtaTitle;
  elements.ctaBtn.textContent = LOVE_PAGE_CONFIG.defaultCtaButtonLabel;
  elements.safeNote.textContent = LOVE_PAGE_CONFIG.defaultSafeNote;
}

function hideReadingResult() {
  elements.resultCard.classList.remove("is-visible");
  elements.resultCard.hidden = true;
  elements.musicSection.hidden = true;
  updateStickyConsult();
}

function showReadingResult() {
  elements.resultCard.hidden = false;
  elements.resultCard.classList.remove("is-visible");

  requestAnimationFrame(() => {
    elements.resultCard.classList.add("is-visible");
    updateStickyConsult();
  });

  if (elements.musicTitle.textContent.trim()) {
    elements.musicSection.hidden = false;
  }

  queueStickyCheck(400);
  queueStickyCheck(900);
  queueStickyCheck(1400);
}

function updateActionLabel(isAfterDraw) {
  elements.startBtn.textContent = isAfterDraw
    ? LOVE_PAGE_CONFIG.redrawButtonLabel
    : LOVE_PAGE_CONFIG.startButtonLabel;
}

function chooseNextCard(cards) {
  if (cards.length === 1) {
    state.lastCardSlug = cards[0].slug;
    return cards[0];
  }

  let nextCard = pickRandom(cards);

  while (nextCard.slug === state.lastCardSlug) {
    nextCard = pickRandom(cards);
  }

  state.lastCardSlug = nextCard.slug;
  return nextCard;
}

function normalizeTrack(rawTrack) {
  if (!rawTrack || typeof rawTrack !== "object") {
    return null;
  }

  const src =
    normalizeText(rawTrack.src) ||
    normalizeText(rawTrack.href) ||
    LOVE_PAGE_CONFIG.fallbackMusicTrack.src;

  return {
    slug: normalizeText(rawTrack.slug) || LOVE_PAGE_CONFIG.fallbackMusicTrack.slug,
    title: normalizeText(rawTrack.title) || LOVE_PAGE_CONFIG.fallbackMusicTrack.title,
    description:
      normalizeText(rawTrack.description) ||
      LOVE_PAGE_CONFIG.fallbackMusicTrack.description,
    src,
    buttonLabel:
      normalizeText(rawTrack.buttonLabel) ||
      LOVE_PAGE_CONFIG.fallbackMusicTrack.buttonLabel,
    mood: normalizeText(rawTrack.mood) || LOVE_PAGE_CONFIG.fallbackMusicTrack.mood
  };
}

async function loadMusicTracks() {
  try {
    const response = await fetch(LOVE_PAGE_CONFIG.musicIndexUrl, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`music/index.json の取得に失敗しました: ${response.status}`);
    }

    const data = await response.json();

    const trackList = Array.isArray(data)
      ? data
      : Array.isArray(data?.tracks)
      ? data.tracks
      : null;

    if (!isNonEmptyArray(trackList)) {
      throw new Error("music/index.json の形式が不正です。");
    }

    const normalizedTracks = trackList.map(normalizeTrack).filter(Boolean);

    state.musicTracks = isNonEmptyArray(normalizedTracks)
      ? normalizedTracks
      : [LOVE_PAGE_CONFIG.fallbackMusicTrack];
  } catch (error) {
    console.warn(
      "音楽データの読み込みに失敗したため、フォールバック設定を使用します。",
      error
    );
    state.musicTracks = [LOVE_PAGE_CONFIG.fallbackMusicTrack];
  }
}

function getTrack() {
  if (isNonEmptyArray(state.musicTracks)) {
    return state.musicTracks[0];
  }

  return LOVE_PAGE_CONFIG.fallbackMusicTrack;
}

function updateMusicUiState(mode) {
  elements.musicPlayBtn.classList.toggle("is-playing", mode === "playing");
  elements.musicPlayBtn.setAttribute("aria-pressed", mode === "playing" ? "true" : "false");

  if (mode === "playing") {
    elements.musicPlayBtn.textContent = LOVE_PAGE_CONFIG.musicLabels.playing;
    elements.musicStatus.textContent = LOVE_PAGE_CONFIG.musicStatusText.playing;
    return;
  }

  if (mode === "paused") {
    elements.musicPlayBtn.textContent = LOVE_PAGE_CONFIG.musicLabels.paused;
    elements.musicStatus.textContent = LOVE_PAGE_CONFIG.musicStatusText.paused;
    return;
  }

  if (mode === "error") {
    elements.musicPlayBtn.textContent = LOVE_PAGE_CONFIG.musicLabels.default;
    elements.musicStatus.textContent = LOVE_PAGE_CONFIG.musicStatusText.error;
    return;
  }

  elements.musicPlayBtn.textContent = LOVE_PAGE_CONFIG.musicLabels.default;
  elements.musicStatus.textContent = LOVE_PAGE_CONFIG.musicStatusText.default;
}

function stopAndResetAudio() {
  state.manualMusicStop = true;

  if (!elements.loveThemeAudio.paused) {
    elements.loveThemeAudio.pause();
  }

  elements.loveThemeAudio.currentTime = 0;
  updateMusicUiState("default");
}

function renderTrack() {
  const track = getTrack();

  if (!track) {
    elements.musicSection.hidden = true;
    return;
  }

  elements.musicTitle.textContent = track.title || "";
  elements.musicText.textContent = track.description || "";
  elements.musicPlayBtn.textContent =
    track.buttonLabel || LOVE_PAGE_CONFIG.musicLabels.default;
  elements.musicPlayBtn.setAttribute("aria-label", `${track.title || "楽曲"} を再生`);

  const sourceEl = elements.loveThemeAudio.querySelector("source");

  if (sourceEl) {
    sourceEl.src = track.src || LOVE_PAGE_CONFIG.fallbackMusicTrack.src;
    elements.loveThemeAudio.load();
  } else {
    elements.loveThemeAudio.src = track.src || LOVE_PAGE_CONFIG.fallbackMusicTrack.src;
  }

  updateMusicUiState("default");
}

function buildBridgeText(cardBridgeText) {
  const prefix = LOVE_PAGE_CONFIG.concernBridgePrefix[state.selectedConcern];

  if (!prefix) {
    return cardBridgeText;
  }

  return `${prefix} ${cardBridgeText}`;
}

function renderReadingContent(card) {
  const imagePath = resolveCardImage(card);
  const bridgePatterns = getBridgePatternSet(card.bridgeType);
  const pickedBridge = pickRandom(bridgePatterns);

  elements.cardImage.src = imagePath;
  elements.cardImage.alt = `${card.nameJa || "引かれたカード"}のカード画像`;
  elements.cardName.textContent = card.nameJa || "";
  elements.cardKeyword.textContent = card.keyword || "";
  elements.mainText.textContent = pickRandom(card.mainPatterns);
  elements.subText.textContent = pickRandom(card.subPatterns);
  elements.bridgeText.textContent = buildBridgeText(pickedBridge);

  elements.ctaBtn.textContent =
    pickRandom(card.ctaPatterns) || LOVE_PAGE_CONFIG.defaultCtaButtonLabel;

  elements.safeNote.textContent =
    pickRandom(card.safePatterns) || LOVE_PAGE_CONFIG.defaultSafeNote;

  elements.ctaTitle.textContent = LOVE_PAGE_CONFIG.defaultCtaTitle;
}

function animateCardFlip() {
  elements.cardWrap.classList.remove("is-flipped");

  state.flipTimerId = window.setTimeout(() => {
    elements.cardWrap.classList.add("is-flipped");
  }, 90);
}

function drawReading() {
  try {
    clearTimers();
    stopAndResetAudio();

    const cards = getCards();
    const card = chooseNextCard(cards);

    renderReadingContent(card);
    showReadingResult();
    animateCardFlip();

    state.hasDrawn = true;
    updateActionLabel(true);

    state.scrollTimerId = window.setTimeout(() => {
      scrollToReadingPanel();
    }, 220);
  } catch (error) {
    console.error(error);
    window.alert(
      "カードデータの読み込みに失敗しました。cards.js と app.js の設定を確認してください。"
    );
  }
}

function updateStickyConsult() {
  if (!elements.stickyConsult || !elements.resultCard) return;

  const isResultVisible =
    !elements.resultCard.hidden &&
    (elements.resultCard.classList.contains("is-visible") ||
      elements.resultCard.offsetHeight > 0);

  elements.stickyConsult.hidden = !isResultVisible;
  elements.stickyConsult.setAttribute("aria-hidden", isResultVisible ? "false" : "true");
}

function observeResultForSticky() {
  if (!elements.stickyConsult || !elements.resultCard) return;

  if ("MutationObserver" in window) {
    const observer = new MutationObserver(updateStickyConsult);

    observer.observe(elements.resultCard, {
      attributes: true,
      attributeFilter: ["hidden", "class", "style"]
    });
  }

  updateStickyConsult();
}

function initStaticContent() {
  elements.year.textContent = new Date().getFullYear();
  elements.returnLink.href = LOVE_PAGE_CONFIG.returnUrl;
  elements.ctaBtn.href = LOVE_PAGE_CONFIG.consultationUrl;

  setSelectedConcern("default");
  setDefaultCardState();
  setDefaultResultTextState();
  renderTrack();
  hideReadingResult();
  updateActionLabel(false);
}

function bindConcernEvents() {
  elements.concernLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const concern = link.dataset.concern || "default";
      setSelectedConcern(concern);
      window.setTimeout(scrollToStartPanel, 80);
    });
  });
}

function bindReadingEvents() {
  elements.startBtn.addEventListener("click", drawReading);
}

function bindMusicEvents() {
  const audio = elements.loveThemeAudio;

  elements.musicPlayBtn.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        state.manualMusicStop = false;
        await audio.play();
        updateMusicUiState("playing");
      } else {
        audio.pause();
        updateMusicUiState("paused");
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
      updateMusicUiState("error");
    }
  });

  elements.musicStopBtn.addEventListener("click", stopAndResetAudio);

  audio.addEventListener("play", () => {
    updateMusicUiState("playing");
  });

  audio.addEventListener("pause", () => {
    if (state.manualMusicStop || audio.currentTime === 0) {
      updateMusicUiState("default");
      state.manualMusicStop = false;
      return;
    }

    if (!audio.ended) {
      updateMusicUiState("paused");
    }
  });

  audio.addEventListener("ended", () => {
    state.manualMusicStop = false;
    audio.currentTime = 0;
    updateMusicUiState("default");
  });

  audio.addEventListener("error", () => {
    updateMusicUiState("error");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) {
      audio.pause();
      updateMusicUiState("paused");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    assertRequiredElements();
    await loadMusicTracks();

    initStaticContent();
    bindConcernEvents();
    bindReadingEvents();
    bindMusicEvents();
    observeResultForSticky();
  } catch (error) {
    console.error(error);
  }
});
