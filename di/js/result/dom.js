// /di/js/result/dom.js
import { CFG } from "./config.js";

export function ensureOverlayRoot() {
  let root = document.getElementById(CFG.OVERLAY_ID);
  if (root) return root;

  root = document.createElement("div");
  root.id = CFG.OVERLAY_ID;
  root.setAttribute("aria-hidden", "true"); // show時に外す
  document.body.appendChild(root);
  return root;
}

export function ensureShell(overlayRoot) {
  let shell = overlayRoot.querySelector("." + CFG.SHELL_CLASS);
  if (shell) return shell;

  shell = document.createElement("div");
  shell.className = CFG.SHELL_CLASS;
  shell.setAttribute("role", "dialog");
  shell.setAttribute("aria-label", "Result");

  shell.innerHTML = `
    <div class="tbResultOverlayBlack" aria-hidden="true"></div>

    <div class="tbEyeStage" aria-label="ARU Eye">
      <div class="tbEye" id="tbEye" aria-hidden="true">
        <div class="tbEyeNoise"></div>

        <div class="tbAruTint" aria-hidden="true"></div>

        <div class="tbResGauge" aria-hidden="true">
          <div class="tbResGaugeBase"></div>
          <div class="tbResGaugeFill"></div>
        </div>

        <div class="tbCore" id="tbCore" aria-hidden="true"></div>
        <div class="tbSpecular" id="tbSpecular"></div>
      </div>
    </div>

    <div class="tbResultReadout" aria-label="Readout">
      <div class="tbResPercent" id="tbResPercent">0%</div>
      <div class="tbResLabel">RESONANCE</div>
    </div>

    <div class="tbLine" id="tbLine"></div>

    <div class="tbActions">
      <button class="tbBtn" id="tbReplayBtn" type="button">RESONATE AGAIN</button>
    </div>
  `;

  overlayRoot.appendChild(shell);
  return shell;
}
