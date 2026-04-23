const LOVE_PAGE_CONFIG = {
  consultationUrl: "https://lin.ee/LYnlU0f",
  returnUrl: "../tarot369.html",
  cardBackImage: "../tarot/card-back.webp",
  musicIndexUrl: "../music/index.json",
  fallbackBridgeType: "ambiguous",

  defaultCtaTitle: "相手の本音や、この恋をどう扱えばいいかまで丁寧に知りたいときは",
  defaultCardName: "カードはまだ静かに伏せられています",
  defaultCardKeyword: "恋愛の星詠を始めてください",
  startButtonLabel: "この恋に届いている言葉を受け取る",
  redrawButtonLabel: "もう一度、この恋の言葉を受け取る",
  defaultCtaButtonLabel: "この恋を、個人鑑定で丁寧に見てもらう",
  defaultSafeNote: "LINEからご相談いただけます。まだ相談するか迷っている段階でも大丈夫です。",

  fallbackMusicTrack: {
    slug: "love-theme",
    title: "心が少し重たい夜に、そっと置いておきたい曲",
    description:
      "言葉にならない気持ちを抱えたままでも聴けるように。少し切ないけれど、静かに心へ沈んでいく一曲です。",
    href: "../music/tracks/love-theme.mp3",
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

const state = {
  flipTimerId: null,
  scrollTimerId: null,
  lastCardSlug: null,
  hasDrawn: false,
  musicTracks: []
};

const elements = {
  year: byId("year"),
  returnLink: byId("returnLink"),
  startBtn: byId("startBtn"),
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
  musicBtn: byId("musicBtn"),
  readingPanel: byId("readingPanel")
};

function assertRequiredElements() {
  const missing = Object.entries(elements)
    .filter(([, value]) => !value)
    .map(([key]) => key);

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

  return `../tarot/${card.slug}.webp`;
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
}

function scrollToReadingPanel() {
  if (!elements.readingPanel) return;

  elements.readingPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
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
}

function showReadingResult() {
  elements.resultCard.hidden = false;
  elements.resultCard.classList.remove("is-visible");

  requestAnimationFrame(() => {
    elements.resultCard.classList.add("is-visible");
  });

  if (elements.musicTitle.textContent.trim()) {
    elements.musicSection.hidden = false;
  }
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

  const href =
    typeof rawTrack.href === "string" && rawTrack.href.trim()
      ? rawTrack.href.trim()
      : LOVE_PAGE_CONFIG.fallbackMusicTrack.href;

  return {
    slug: rawTrack.slug || LOVE_PAGE_CONFIG.fallbackMusicTrack.slug,
    title: rawTrack.title || LOVE_PAGE_CONFIG.fallbackMusicTrack.title,
    description: rawTrack.description || LOVE_PAGE_CONFIG.fallbackMusicTrack.description,
    href,
    buttonLabel: rawTrack.buttonLabel || LOVE_PAGE_CONFIG.fallbackMusicTrack.buttonLabel,
    mood: rawTrack.mood || LOVE_PAGE_CONFIG.fallbackMusicTrack.mood
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

    if (!isNonEmptyArray(data)) {
      throw new Error("music/index.json の形式が不正です。");
    }

    state.musicTracks = data
      .map(normalizeTrack)
      .filter(Boolean);
  } catch (error) {
    console.warn("音楽データの読み込みに失敗したため、フォールバック設定を使用します。", error);
    state.musicTracks = [LOVE_PAGE_CONFIG.fallbackMusicTrack];
  }
}

function getTrack() {
  if (isNonEmptyArray(state.musicTracks)) {
    return state.musicTracks[0];
  }

  return LOVE_PAGE_CONFIG.fallbackMusicTrack;
}

function renderTrack() {
  const track = getTrack();

  if (!track) {
    elements.musicSection.hidden = true;
    return;
  }

  elements.musicTitle.textContent = track.title || "";
  elements.musicText.textContent = track.description || "";
  elements.musicBtn.textContent = track.buttonLabel || "この曲を聴く";
  elements.musicBtn.href = track.href || LOVE_PAGE_CONFIG.fallbackMusicTrack.href;
  elements.musicBtn.setAttribute("aria-label", `${track.title || "楽曲"} を開く`);
}

function renderReadingContent(card) {
  const imagePath = resolveCardImage(card);
  const bridgePatterns = getBridgePatternSet(card.bridgeType);

  elements.cardImage.src = imagePath;
  elements.cardImage.alt = `${card.nameJa}のカード画像`;
  elements.cardName.textContent = card.nameJa || "";
  elements.cardKeyword.textContent = card.keyword || "";

  elements.mainText.textContent = pickRandom(card.mainPatterns);
  elements.subText.textContent = pickRandom(card.subPatterns);
  elements.bridgeText.textContent = pickRandom(bridgePatterns);
  elements.ctaBtn.textContent = pickRandom(card.ctaPatterns);
  elements.safeNote.textContent = pickRandom(card.safePatterns);
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
    window.alert("カードデータの読み込みに失敗しました。cards.js と app.js の設定を確認してください。");
  }
}

function initStaticContent() {
  elements.year.textContent = new Date().getFullYear();
  elements.returnLink.href = LOVE_PAGE_CONFIG.returnUrl;
  elements.ctaBtn.href = LOVE_PAGE_CONFIG.consultationUrl;

  setDefaultCardState();
  setDefaultResultTextState();
  hideReadingResult();
  updateActionLabel(false);
  renderTrack();
}

function bindEvents() {
  elements.startBtn.addEventListener("click", drawReading);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    assertRequiredElements();
    await loadMusicTracks();
    initStaticContent();
    bindEvents();
  } catch (error) {
    console.error(error);
  }
});
