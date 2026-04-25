const elements = {
  year: document.getElementById("year"),
  stardust: document.querySelector(".stardust"),
  stickyCta: document.getElementById("stickyCta"),
  finalCta: document.querySelector(".final-cta"),
  copyTemplateBtn: document.getElementById("copyTemplateBtn"),
  templateText: document.getElementById("templateText"),
  copyStatus: document.getElementById("copyStatus")
};

function spawnStardust() {
  if (!elements.stardust) return;

  const count = 24;

  for (let i = 0; i < count; i += 1) {
    const star = document.createElement("span");
    const delay = Math.random() * 12;
    const duration = 10 + Math.random() * 12;
    const left = Math.random() * 100;
    const top = 60 + Math.random() * 40;

    star.style.left = `${left}vw`;
    star.style.top = `${top}vh`;
    star.style.animationDuration = `${duration}s`;
    star.style.animationDelay = `${delay}s`;

    elements.stardust.appendChild(star);
  }
}

function setupStickyCta() {
  if (!elements.stickyCta || !elements.finalCta) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      const shouldHide = entry.isIntersecting;

      elements.stickyCta.hidden = shouldHide;
      elements.stickyCta.setAttribute("aria-hidden", shouldHide ? "true" : "false");
    },
    {
      threshold: 0.18
    }
  );

  observer.observe(elements.finalCta);

  window.setTimeout(() => {
    elements.stickyCta.hidden = false;
    elements.stickyCta.setAttribute("aria-hidden", "false");
  }, 900);
}

async function copyTemplate() {
  if (!elements.templateText || !elements.copyStatus) return;

  const text = elements.templateText.textContent.trim();

  try {
    await navigator.clipboard.writeText(text);
    elements.copyStatus.textContent = "コピーしました。LINEに貼り付けてご利用ください。";
  } catch (error) {
    elements.copyStatus.textContent = "コピーできませんでした。本文を長押ししてコピーしてください。";
  }

  window.setTimeout(() => {
    elements.copyStatus.textContent = "";
  }, 3200);
}

function setupFaq() {
  const detailsList = Array.from(document.querySelectorAll("details"));

  detailsList.forEach((target) => {
    target.addEventListener("toggle", () => {
      if (!target.open) return;

      detailsList.forEach((detail) => {
        if (detail !== target) {
          detail.open = false;
        }
      });
    });
  });
}

function init() {
  if (elements.year) {
    elements.year.textContent = new Date().getFullYear();
  }

  spawnStardust();
  setupStickyCta();
  setupFaq();

  elements.copyTemplateBtn?.addEventListener("click", copyTemplate);
}

document.addEventListener("DOMContentLoaded", init);
