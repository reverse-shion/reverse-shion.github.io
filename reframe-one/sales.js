// PAY.JP本番審査・決済導入完了後は、この2行を更新します。
const SALES_STATUS = "preparing"; // "preparing" | "open" | "closed"
const PAYMENT_URL = "";

const salesViews = {
  preparing: "現在、カード決済の導入準備中です",
  closed: "Re:Frame ONE βの募集は終了しました。ご参加ありがとうございました。"
};

document.querySelectorAll("[data-sales-cta]").forEach((container) => {
  const canPurchase = SALES_STATUS === "open" && PAYMENT_URL;
  if (canPurchase) {
    const link = document.createElement("a");
    link.className = "purchase-button";
    link.href = PAYMENT_URL;
    link.textContent = "Re:Frame ONE βを購入する　¥980";
    link.setAttribute("aria-label", "Re:Frame ONE βを980円で購入する");
    container.appendChild(link);
    return;
  }

  const message = document.createElement("div");
  message.className = "sales-message";
  message.setAttribute("role", "status");
  message.textContent = salesViews[SALES_STATUS] || salesViews.preparing;
  container.appendChild(message);
});
