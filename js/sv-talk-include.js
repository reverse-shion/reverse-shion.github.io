(() => {
  "use strict";

  // ---- Settings ----
  const PARTIAL_URL = "/partials/sv-talk.html";
  const MOUNT_ID = "sv-talk-mount";

  // ---- Helpers ----
  const qs = (sel, root = document) => root.querySelector(sel);

  function shouldDisableOnThisPage() {
    // <html data-sv-talk="off"> で無効化できる
    return document.documentElement.dataset.svTalk === "off";
  }

  function markReady(mount) {
    mount.classList.remove("sv-talk-mount--loading");
    mount.classList.add("sv-talk-mount--ready");
    mount.removeAttribute("aria-hidden");
  }

  function fallbackInject(mount) {
    // ネットワーク失敗時の「最小入口」（画像なし、ボタンだけ）
    // ※ CSSは既存の .sv-talk__btn を使えるよう、同クラスを維持
    mount.innerHTML = `
      <div class="sv-talk" data-sv-talk="fallback">
        <button class="sv-talk__btn" type="button" id="svTalkBtn">
          <span class="sv-talk__icon" aria-hidden="true">✦</span>
          <span class="sv-talk__label">みんなと話す</span>
        </button>
      </div>
    `;
  }

  function wireButton() {
    const btn = document.getElementById("svTalkBtn");
    if (!btn) return;

    // 二重バインド防止
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", () => {
      // ローダーが提供する想定の公開API
      if (window.ShioponSkit?.open) {
        window.ShioponSkit.open();
        return;
      }

      // まだローダーがロードされていない場合、少し待って再試行（1回だけ）
      // ※ “遅延ゼロ体感”のため、無限待ちしない
      setTimeout(() => {
        window.ShioponSkit?.open?.();
      }, 0);
    });
  }

  // ---- Main ----
  const mount = document.getElementById(MOUNT_ID);
  if (!mount) return;
  if (shouldDisableOnThisPage()) return;

  // 既に注入済みなら何もしない（SPA的な遷移対策）
  if (mount.dataset.injected === "1") {
    wireButton();
    markReady(mount);
    return;
  }
  mount.dataset.injected = "1";

  // チラつき防止：まずは透明のまま
  mount.classList.add("sv-talk-mount--loading");

  fetch(PARTIAL_URL, { cache: "force-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch ${PARTIAL_URL}: ${r.status}`);
      return r.text();
    })
    .then((html) => {
      mount.innerHTML = html;
      wireButton();
      // 次フレームで表示（体感なめらか）
      requestAnimationFrame(() => markReady(mount));
    })
    .catch((err) => {
      console.warn("[sv-talk] partial load failed, using fallback.", err);
      fallbackInject(mount);
      wireButton();
      requestAnimationFrame(() => markReady(mount));
    });
})();
