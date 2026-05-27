(() => {
  const $ = (id) => document.getElementById(id);

  const COPY = {
    heroTitle: "なぜ惹かれるのに、不安になるのか。",
    heroSubtitle: "2人の星命から、この恋の現在地を読み解きます。"
  };

  const PRODUCTS = {
    paidReport: {
      name: "この恋の現在地レポート",
      regularPrice: 4980,
      launchPrice: 2980,
      url: "#paid-report"
    },
    premiumReading: {
      name: "相手の本音と今後の流れ タロット鑑定",
      price: 6800,
      url: "#premium-reading"
    },
    deepReading: {
      name: "深掘り恋愛タロット鑑定書",
      price: 12800,
      url: "#deep-reading"
    }
  };

  const form = $("readingForm");
  const msg = $("msg");
  const result = $("result");
  const modeInputs = Array.from(document.querySelectorAll('input[name="diagnosisType"]'));
  const pairFields = $("pairFields");
  const singleFields = $("singleFields");
  const readingDate = $("readingDate");

  if (!form || !msg || !result || !pairFields || !singleFields || !readingDate) {
    console.error("診断フォームの初期化に必要な要素が見つかりません。");
    return;
  }

  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const today = getLocalDateString();

  if (!readingDate.value) {
    readingDate.value = today;
  }

  function getMode() {
    return modeInputs.find((input) => input.checked)?.value || "pair";
  }

  function setMessage(text, type = "") {
    msg.textContent = text;
    msg.className = type ? `msg is-${type}` : "msg";
  }

  function setBusy(isBusy) {
    const submitButton = form.querySelector('button[type="submit"]');

    if (!submitButton) return;

    submitButton.disabled = isBusy;
    submitButton.setAttribute("aria-busy", isBusy ? "true" : "false");

    if (isBusy) {
      submitButton.dataset.originalText = submitButton.textContent;
      submitButton.textContent = "星命を読み解いています…";
    } else {
      submitButton.textContent =
        submitButton.dataset.originalText || "無料でこの恋の現在地を見る";
      submitButton.removeAttribute("aria-busy");
    }
  }

  function clearInvalidStates() {
    form.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
    });
  }

  function markInvalidField(input) {
    clearInvalidStates();

    const map = {
      readingDate: "readingDate",
      userName: "userName",
      userBirthDate: "userBirthDate",
      partnerName: "partnerName",
      partnerBirthDate: "partnerBirthDate",
      singleName: "singleName",
      singleBirthDate: "singleBirthDate"
    };

    const mode = input.diagnosisType;

    let targetId = "";

    if (!input.readingDate) {
      targetId = map.readingDate;
    } else if (mode === "pair") {
      if (!input.userName) targetId = map.userName;
      else if (!input.userBirthDate) targetId = map.userBirthDate;
      else if (!input.partnerName) targetId = map.partnerName;
      else if (!input.partnerBirthDate) targetId = map.partnerBirthDate;
    } else {
      if (!input.singleName) targetId = map.singleName;
      else if (!input.singleBirthDate) targetId = map.singleBirthDate;
    }

    if (!targetId) return;

    const target = $(targetId);
    if (!target) return;

    target.setAttribute("aria-invalid", "true");
    target.focus({ preventScroll: false });
  }

  function syncMode() {
    const isPair = getMode() === "pair";

    pairFields.hidden = !isPair;
    singleFields.hidden = isPair;

    pairFields.querySelectorAll("input, select, textarea").forEach((el) => {
      el.disabled = !isPair;
    });

    singleFields.querySelectorAll("input, select, textarea").forEach((el) => {
      el.disabled = isPair;
    });

    modeInputs.forEach((input) => {
      const label = input.closest("label");
      if (!label) return;

      label.classList.toggle("is-active", input.checked);
      label.setAttribute("aria-pressed", input.checked ? "true" : "false");
    });

    clearInvalidStates();
    setMessage("");
    result.innerHTML = "";
  }

  function getInputValues() {
    const mode = getMode();

    return {
      diagnosisType: mode,
      readingDate: readingDate.value,
      userName: $("userName")?.value.trim() || "",
      userBirthDate: $("userBirthDate")?.value || "",
      partnerName: $("partnerName")?.value.trim() || "",
      partnerBirthDate: $("partnerBirthDate")?.value || "",
      singleName: $("singleName")?.value.trim() || "",
      singleBirthDate: $("singleBirthDate")?.value || ""
    };
  }

  function scrollToResult() {
    const firstResultCard = result.querySelector(".result-card") || result;

    firstResultCard.setAttribute("tabindex", "-1");

    requestAnimationFrame(() => {
      firstResultCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      setTimeout(() => {
        firstResultCard.focus({ preventScroll: true });
      }, 450);
    });
  }

  modeInputs.forEach((input) => {
    input.addEventListener("change", syncMode);
  });

  syncMode();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!window.ShionValidation || !window.ShionReportRenderer) {
      setMessage("診断システムの読み込みに失敗しました。ページを再読み込みしてください。", "error");
      return;
    }

    const input = getInputValues();
    const validation = window.ShionValidation.validate(input);

    if (!validation.ok) {
      setMessage(validation.message, "error");
      result.innerHTML = "";
      markInvalidField(input);
      return;
    }

    clearInvalidStates();
    setBusy(true);
    setMessage("星命を読み解いています…", "success");
    result.innerHTML = "";

    setTimeout(() => {
      try {
        const reading = window.ShionReportRenderer.render(result, input, {
          COPY,
          PRODUCTS
        });

        window.__shionState = {
          input,
          reading,
          renderedAt: new Date().toISOString()
        };

        setMessage("診断結果を表示しました。", "success");
        scrollToResult();
      } catch (error) {
        console.error(error);
        setMessage("診断結果の表示中にエラーが発生しました。ページを再読み込みして再度お試しください。", "error");
      } finally {
        setBusy(false);
      }
    }, 120);
  });
})();
