// PAY.JP本番審査・決済テスト完了後は、この2行を更新します。
const SALES_STATUS = "preparing"; // "preparing" | "open" | "closed"
const CHECKOUT_URL = ""; // 公開アプリの https://.../payjp/checkout
const LINE_URL = "https://lin.ee/LYnlU0f";

const salesViews = {
  closed: "Re:Frame ONE βの募集は終了しました。ご参加ありがとうございました。"
};

document.querySelectorAll("[data-sales-cta]").forEach((container) => {
  container.replaceChildren();

  if (SALES_STATUS === "open" && CHECKOUT_URL) {
    const form = document.createElement("form");
    form.className = "checkout-form";
    form.method = "post";
    form.action = CHECKOUT_URL;

    const button = document.createElement("button");
    button.type = "submit";
    button.className = "purchase-button";
    button.textContent = "Re:Frame ONE βを購入する｜¥980";
    button.setAttribute("aria-label", "Re:Frame ONE βを980円で購入する");

    form.appendChild(button);
    container.appendChild(form);
    return;
  }

  if (SALES_STATUS === "preparing") {
    const link = document.createElement("a");
    link.className = "preparing-link";
    link.href = LINE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "販売開始をLINEで受け取る";

    const note = document.createElement("small");
    note.className = "sales-status-note";
    note.textContent = "カード決済（PAY.JP）は現在、審査・導入準備中です。";

    container.append(link, note);
    return;
  }

  const message = document.createElement("div");
  message.className = "sales-message";
  message.setAttribute("role", "status");
  message.textContent = salesViews.closed;
  container.appendChild(message);
});
