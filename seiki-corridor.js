// 文字数カウント
const textarea = document.getElementById("prayerText");
const charHint = document.getElementById("charHint");
const prayerForm = document.getElementById("prayerForm");
const prayerError = document.getElementById("prayerError");

const lanternList = document.getElementById("lanternList");
const shareBlock = document.getElementById("shareBlock");
const sharePreview = document.getElementById("sharePreview");
const shareStatus = document.getElementById("shareStatus");
const copyAllBtn = document.getElementById("copyAll");
const copyBodyBtn = document.getElementById("copyBody");
const sparklesRoot = document.getElementById("sparkles");

textarea.addEventListener("input", () => {
  const len = textarea.value.trim().length;
  charHint.textContent = `${len} / 220文字（20文字以上で灯籠を灯せます）`;
});

// フォーム送信
prayerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = textarea.value.trim();
  const len = text.length;

  if (len < 20) {
    prayerError.textContent = "20文字以上で灯籠を灯すことができます。";
    return;
  }
  if (len > 220) {
    prayerError.textContent = "220文字までに収めてください。";
    return;
  }

  prayerError.textContent = "";

  // 最初の「まだ灯籠はありません」を消す
  const emptyItem = lanternList.querySelector(".lantern-item--empty");
  if (emptyItem) {
    emptyItem.remove();
  }

  // 灯籠アイテム追加
  const item = document.createElement("div");
  item.className = "lantern-item";
  const textDiv = document.createElement("div");
  textDiv.className = "lantern-text";
  textDiv.textContent = text;

  const metaDiv = document.createElement("div");
  metaDiv.className = "lantern-meta";

  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  metaDiv.textContent = `星祈ログ／${yyyy}-${mm}-${dd} ${hh}:${mi}`;

  item.appendChild(textDiv);
  item.appendChild(metaDiv);
  lanternList.prepend(item);

  // シェアプレビュー更新
  const template = [
    "【星祈の回廊 − 詩韻思想】",
    "",
    "いま、この回廊に灯した灯籠：",
    `「${text}」`,
    "",
    "#星祈の回廊 #詩韻思想"
  ].join("\n");

  sharePreview.textContent = template;
  shareBlock.classList.add("is-active");
  shareStatus.textContent = "";

  // テキストエリアリセット
  textarea.value = "";
  textarea.dispatchEvent(new Event("input"));

  // 光エフェクト
  spawnSparkles();
});

// クリップボードコピー（共通関数）
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    shareStatus.textContent = "クリップボードにコピーしました。";
  } catch (e) {
    shareStatus.textContent = "コピーに失敗しました。お使いの環境で手動コピーをお試しください。";
  }
}

// 「テキストをコピー」
copyAllBtn.addEventListener("click", () => {
  const text = sharePreview.textContent;
  if (!text.trim()) return;
  copyToClipboard(text);
});

// 「灯籠の部分だけコピー」
copyBodyBtn.addEventListener("click", () => {
  const text = sharePreview.textContent;
  const match = text.match(/「([\s\S]+)」/);
  const body = match ? match[1] : "";
  if (!body.trim()) return;
  copyToClipboard(body);
});

// 灯籠点灯エフェクト
function spawnSparkles() {
  const count = 14;
  const rect = prayerForm.getBoundingClientRect();
  const baseX = rect.left + rect.width / 2;
  const baseY = rect.top + window.scrollY;

  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.className = "sparkle";

    const offsetX = (Math.random() - 0.5) * 160;
    const offsetY = (Math.random() - 0.3) * 40;

    s.style.left = `${baseX + offsetX}px`;
    s.style.top = `${baseY + offsetY}px`;

    sparklesRoot.appendChild(s);

    s.addEventListener("animationend", () => {
      s.remove();
    });
  }
}
// =============================
// セレフィアスの詩 ＆ SRGゲート
// =============================
const gatePrayButton = document.getElementById("gatePrayButton");
const serephiasPoem = document.getElementById("serephiasPoem");
const serephiasPoemBody = document.getElementById("serephiasPoemBody");
const srgWrapper = document.getElementById("srgWrapper");
const starRingGateButton = document.getElementById("starRingGateButton");

if (gatePrayButton && serephiasPoem && serephiasPoemBody && srgWrapper && starRingGateButton) {
  // メインの詩（毎回これが基本で出る）
  const mainPoem =
    "あなたの光が、静かに星の脈を震わせた。\nここに届いた祈りは、もう二度と見捨てられない。";

  // レア詩（1/9の確率で、この中からランダム）
  const rarePoems = [
    "今、ひとつの痛みが、そっと星に預けられた。\nあなたの心は、ほんの少しだけ軽くなっている。",
    "まだ名前を持たない祈りが、\n静かな環となって、あなたを包みはじめている。",
    "あなたが隠してきた孤独は、\nいま、星々のあいだで静かな光へと組み替えられている。"
  ];

  gatePrayButton.addEventListener("click", () => {
    // 一度押したら儀式完了扱い
    if (gatePrayButton.classList.contains("is-disabled")) return;

    gatePrayButton.classList.add("is-disabled");
    gatePrayButton.disabled = true;

    // レア判定：1/9で rarePoems から選ぶ
    let selected = mainPoem;
    if (Math.random() < 1 / 9 && rarePoems.length > 0) {
      const idx = Math.floor(Math.random() * rarePoems.length);
      selected = rarePoems[idx];
    }

    // 詩をセットして表示
    serephiasPoemBody.textContent = selected;
    serephiasPoem.classList.add("is-open");

    // 少し間をおいてゲート出現＆中心にスクロール
    setTimeout(() => {
      srgWrapper.classList.add("is-open");
      srgWrapper.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 600);
  });

  // SRGゲートを押したら コアへ（別タブ）
  starRingGateButton.addEventListener("click", () => {
    window.open("https://reverse-shion.github.io/shion2.html", "_blank", "noopener");
  });
}
