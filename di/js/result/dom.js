// /di/js/result/dom.js
import { CFG } from "./config.js";

export function ensureOverlayRoot() {
  const root = document.getElementById(CFG.OVERLAY_ID);
  if (!root) throw new Error("#result not found");
  return root;
}

export function ensureShell(root) {
  let shell = root.querySelector("." + CFG.SHELL_CLASS);
  if (shell) return shell;

  shell = document.createElement("div");
  shell.className = CFG.SHELL_CLASS;

  shell.innerHTML = `
    <div class="tbResultOverlayBlack"></div>

    <div class="tbEyeStage">
      <div class="tbEye">
        <div class="tbResGauge">
          <div class="tbResGaugeBase"></div>
          <div class="tbResGaugeFill"></div>
        </div>
        <div class="tbCore"></div>
      </div>
    </div>

    <div class="tbResultReadout">
      <div class="tbResPercent" id="tbResPercent">0%</div>
      <div class="tbResLabel">RESONANCE</div>
    </div>

    <div class="tbActions">
      <button class="tbBtn" id="tbReplayBtn">もう一回</button>
    </div>
  `;

  root.appendChild(shell);
  return shell;
}
