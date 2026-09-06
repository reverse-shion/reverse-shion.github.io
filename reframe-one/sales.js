// Stripe審査完了後は、この2行だけを更新してください。
const SALES_STATUS = "preparing"; // "preparing" | "open" | "closed"
const STRIPE_PAYMENT_URL = "";

const salesViews = {
  preparing: "現在、販売開始準備中です",
  closed: "Re:Frame ONE βの募集は終了しました。ご参加ありがとうございました。"
};

document.querySelectorAll("[data-sales-cta]").forEach((container) => {
  const canPurchase = SALES_STATUS === "open" && STRIPE_PAYMENT_URL;
  if (canPurchase) {
    const link = document.createElement("a");
    link.className = "purchase-button";
    link.href = STRIPE_PAYMENT_URL;
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
