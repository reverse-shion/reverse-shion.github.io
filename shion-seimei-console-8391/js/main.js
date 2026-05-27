(() => {
  const $ = (id) => document.getElementById(id);

  const COPY = {
    heroTitle: "なぜ惹かれるのに、不安になるのか。",
    heroSubtitle: "2人の星命から、この恋の現在地を読み解きます。"
  };

  const PRODUCTS = {
    paidReport: { name: "この恋の現在地レポート", regularPrice: 4980, launchPrice: 2980, url: "#paid-report" },
    premiumReading: { name: "相手の本音と今後の流れ タロット鑑定", price: 6800, url: "#premium-reading" },
    deepReading: { name: "深掘り恋愛タロット鑑定書", price: 12800, url: "#deep-reading" }
  };

  const form = $("readingForm");
  const msg = $("msg");
  const result = $("result");
  const modeInputs = Array.from(document.querySelectorAll('input[name="diagnosisType"]'));
  const pairFields = $("pairFields");
  const singleFields = $("singleFields");
  const readingDate = $("readingDate");

  const today = new Date().toISOString().slice(0, 10);
  readingDate.value = today;

  function getMode() {
    return modeInputs.find((input) => input.checked)?.value || "pair";
  }

  function syncMode() {
    const pair = getMode() === "pair";
    pairFields.hidden = !pair;
    singleFields.hidden = pair;
  }

  modeInputs.forEach((input) => input.addEventListener("change", syncMode));
  syncMode();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const mode = getMode();
    const input = {
      diagnosisType: mode,
      readingDate: readingDate.value,
      userName: $("userName").value.trim(),
      userBirthDate: $("userBirthDate").value,
      partnerName: $("partnerName").value.trim(),
      partnerBirthDate: $("partnerBirthDate").value,
      singleName: $("singleName").value.trim(),
      singleBirthDate: $("singleBirthDate").value
    };

    const validation = window.ShionValidation.validate(input);
    if (!validation.ok) {
      msg.textContent = validation.message;
      result.innerHTML = "";
      return;
    }

    const reading = window.ShionReportRenderer.render(result, input, { COPY, PRODUCTS });
    window.__shionState = { input, reading };
    msg.textContent = "診断結果を表示しました。";
  });
})();
