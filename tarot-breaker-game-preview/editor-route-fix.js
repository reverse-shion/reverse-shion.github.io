(() => {
  "use strict";

  function wireGameDocument(doc, win) {
    if (!doc || !win) return;

    const editorLink = doc.querySelector(".editor-link");
    if (editorLink) editorLink.target = "_top";

    const startButton = doc.getElementById("start");
    if (!startButton) return;

    let timer = 0;
    let observer = null;

    const startPreview = () => {
      if (startButton.disabled) return false;
      startButton.click();
      if (observer) observer.disconnect();
      if (timer) win.clearInterval(timer);
      return true;
    };

    if (startPreview()) return;

    observer = new win.MutationObserver(startPreview);
    observer.observe(startButton, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    timer = win.setInterval(startPreview, 100);
    win.setTimeout(() => {
      if (observer) observer.disconnect();
      if (timer) win.clearInterval(timer);
    }, 20000);
  }

  const frame = document.getElementById("game-frame");
  if (frame) {
    const wireFrame = () => {
      try {
        wireGameDocument(frame.contentDocument, frame.contentWindow);
      } catch (error) {
        console.warn("editor preview routing setup failed", error);
      }
    };
    frame.addEventListener("load", wireFrame);
    if (frame.contentDocument?.readyState === "complete") wireFrame();
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("mapEditor") === "1") wireGameDocument(document, window);
})();