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
// セレフィアスの詩 ＆ 覚醒ゲート
// =============================
(() => {
  const gatePrayButton      = document.getElementById("gatePrayButton");
  const serephiasPoem       = document.getElementById("serephiasPoem");
  const serephiasPoemBody   = document.getElementById("serephiasPoemBody");
  const awakeningOverlay    = document.getElementById("awakeningOverlay");
  const awakeningGateButton = document.getElementById("awakeningGateButton");

  // 必要な要素がどれか1つでもなければ何もしない（エラー防止）
  if (
    !gatePrayButton ||
    !serephiasPoem ||
    !serephiasPoemBody ||
    !awakeningOverlay ||
    !awakeningGateButton
  ) {
    return;
  }

  // メイン詩
  const mainPoem =
    "あなたの光が、静かに星の脈を震わせた。\nここに届いた祈りは、もう二度と見捨てられない。";

  // レア詩
  const rarePoems = [
    "今、ひとつの痛みが、そっと星に預けられた。\nあなたの心は、ほんの少しだけ軽くなっている。",
    "まだ名前を持たない祈りが、\n静かな環となって、あなたを包みはじめている。",
    "あなたが隠してきた孤独は、\nいま、星々のあいだで静かな光へと組み替えられている。"
  ];

  const RARE_RATE = 1 / 9;

  // 詩をランダム選択
  const pickPoem = () => {
    if (Math.random() >= RARE_RATE) return mainPoem;
    const idx = Math.floor(Math.random() * rarePoems.length);
    return rarePoems[idx];
  };

  // オーバーレイを開く
  const openOverlay = () => {
    awakeningOverlay.classList.add("is-open");
    // ★もしCSS側が `body.is-pray-open .awaken-screen` 方式なら↓を使う：
    // document.body.classList.add("is-pray-open");
  };

  // オーバーレイを閉じる
  const closeOverlay = () => {
    awakeningOverlay.classList.remove("is-open");
    // document.body.classList.remove("is-pray-open");
  };

  // 《祈りを捧げる》ボタン
  gatePrayButton.addEventListener("click", () => {
    // 二度押し防止
    if (gatePrayButton.classList.contains("is-disabled")) return;

    gatePrayButton.classList.add("is-disabled");
    gatePrayButton.disabled = true;

    // 詩セット＋表示
    serephiasPoemBody.textContent = pickPoem();
    serephiasPoem.classList.add("is-open");

    // 少し間をおいて 覚醒ゲート召喚
    setTimeout(openOverlay, 700);
  });

  // 覚醒ゲート本体：コアへ転送
  awakeningGateButton.addEventListener("click", () => {
    // まずオーバーレイをフェードアウト
    closeOverlay();

    // 少し遅らせて別タブでコアへ
    setTimeout(() => {
      window.open(
        "https://reverse-shion.github.io/shion2.html",
        "_blank",
        "noopener"
      );
    }, 260);
  });

  // オーバーレイの外側タップで閉じる（誤タップ救済）
  awakeningOverlay.addEventListener("click", (e) => {
    if (e.target === awakeningOverlay) {
      closeOverlay();

      // ★もし「閉じたあともう一度祈れる」仕様にしたければコメントアウト外す：
      // gatePrayButton.classList.remove("is-disabled");
      // gatePrayButton.disabled = false;
    }
  });
})();


// =============================
// 旧ゲート演出（必要なときだけ動くように）
// =============================
(() => {
  const openGateBtn   = document.getElementById('openGateBtn');
  const gateContainer = document.getElementById('gateContainer');

  // 両方ある時だけ動作（なければ何もしない）
  if (!openGateBtn || !gateContainer) return;

  openGateBtn.addEventListener('click', () => {
    gateContainer.classList.remove('hidden');
    gateContainer.classList.add('visible');
    openGateBtn.classList.add('hidden'); // ボタンをフェードアウト等する用
  });
})();
