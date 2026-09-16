(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const isMapEditorFrame = params.get("mapEditor") === "1";
  const editorLink = document.querySelector(".editor-link");

  // Always open the collision editor at the top level. This prevents the
  // editor from being loaded recursively inside its own preview iframe.
  if (editorLink) editorLink.target = "_top";

  // A game page embedded by collision-editor.html is only the live map
  // backdrop. Start it automatically so the normal launch card is never
  // mistaken for navigation inside the editor.
  if (!isMapEditorFrame) return;

  const startButton = document.getElementById("start");
  if (!startButton) return;

  let timer = 0;
  let observer = null;

  const startEditorPreview = () => {
    if (startButton.disabled) return false;
    startButton.click();
    if (observer) observer.disconnect();
    if (timer) window.clearInterval(timer);
    return true;
  };

  if (startEditorPreview()) return;

  observer = new MutationObserver(startEditorPreview);
  observer.observe(startButton, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  timer = window.setInterval(startEditorPreview, 100);
  window.setTimeout(() => {
    if (observer) observer.disconnect();
    if (timer) window.clearInterval(timer);
  }, 20000);
})();