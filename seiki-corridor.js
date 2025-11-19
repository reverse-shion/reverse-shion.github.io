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
document.addEventListener('DOMContentLoaded', () => {
  // 必要な要素を全て取得
  const gatePrayButton = document.getElementById("gatePrayButton");
  const serephiasPoem = document.getElementById("serephiasPoem");
  const serephiasPoemBody = document.getElementById("serephiasPoemBody");
  const awakeningOverlay = document.getElementById("awakeningOverlay");
  const awakeningGateButton = document.getElementById("awakeningGateButton"); // IDを修正

  const particlesContainer = document.getElementById('awakenParticles');

  // =============================
  // 1. 星粒子の生成 (一箇所にまとめる)
  // =============================
  if (particlesContainer) {
    const numberOfParticles = 40; // 統一された数
    for (let i = 0; i < numberOfParticles; i++) {
      const p = document.createElement('div');
      p.className = 'awaken-particle';
      // CSS変数を設定
      p.style.setProperty('--i', i); 
      particlesContainer.appendChild(p);
    }
  }

  // =============================
  // 2. メインロジック（要素が全て存在する場合のみ実行）
  // =============================
  if (
    gatePrayButton && serephiasPoem && serephiasPoemBody && 
    awakeningOverlay && awakeningGateButton
  ) {
    const mainPoem = "あなたの光が、静かに星の脈を震わせた。\nここに届いた祈りは、もう二度と見捨てられない。";
    const rarePoems = [ /* ... レア詩の定義 ... */ ];

    // ★ 詩の処理とオーバーレイの起動
    gatePrayButton.addEventListener("click", () => {
      // ... (詩の選択と表示のロジックはそのまま) ...
      // 覚醒ゲート召喚
      setTimeout(() => {
        // クラス名を統一（例：'active'）
        awakeningOverlay.classList.add("active"); 
      }, 700);
    });

    // ★ 覚醒ゲート本体：コアへ転送
    awakeningGateButton.addEventListener("click", () => {
      // オーバーレイをフェードアウト
      awakeningOverlay.classList.remove("active");

      setTimeout(() => {
        window.open(
          "https://reverse-shion.github.io/shion2.html",
          "_blank",
          "noopener"
        );
      }, 260);
    });

    // ★ クリスタルの外側（暗い部分）をタップで閉じる
    awakeningOverlay.addEventListener('click', (e) => {
      if (e.target === awakeningOverlay) {
        awakeningOverlay.classList.remove('active');
      }
    });

    // ★ data-awaken-open を使ったオーバーレイ開閉 (上記 gatePrayButton と機能が重複)
    // document.querySelectorAll('[data-awaken-open]').forEach((btn) => {
    //   btn.addEventListener('click', () => {
    //     awakeningOverlay.classList.add('active'); 
    //   });
    // });
  }
});



