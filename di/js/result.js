/* /di/js/result.js
   TAROT BREAKER – RESULT PRESENTATION (ARU Eye: COMPLETE) [PROD SAFE]
   - Works with /di/js/main.js (expects window.DI_RESULT.init)
   - Integrates getUserName() from /js/common.js (optional; safe)
   - Does NOT destroy #result inner DOM (coexists with engine UI)
   - Iris expansion triggers ONLY at the moment the name is called
   - 100% => double expansion + "ARU COMPLETE" seal
*/
(function () {
  "use strict";

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  // ---------- Safe name getter ----------
  function safeUserName() {
    try {
      if (typeof window.getUserName === "function") {
        const n = window.getUserName();
        if (typeof n === "string" && n.trim()) return n.trim();
      }
    } catch {}
    return null;
  }

  // ---------- Name call policy ----------
  function shouldCallName(percent) {
    return percent >= 50;
  }

  // ---------- Normalize resonance (0..1 or 0..100) ----------
  function normalizePercent(resonance) {
    let r = Number(resonance);
    if (!Number.isFinite(r)) r = 0;
    // if it's likely 0..1, scale to 0..100
    if (r <= 1.0001) r = r * 100;
    return clamp(Math.round(r), 0, 100);
  }

  // ---------- Copy lines ----------
  function lineByPercent(percent, nameOrNull) {
    const name = nameOrNull;

    if (percent >= 100) {
      return name
        ? `……ARU、完成。\n封印解除。\n${name}──君の想いは、眼に宿った。`
        : `……ARU、完成。\n封印解除。\n君の想いは、眼に宿った。`;
    }
    if (percent >= 80) {
      return name
        ? `${name}。\n波形、かなり綺麗。あと少しで“完成域”。`
        : `波形、かなり綺麗。\nあと少しで“完成域”。`;
    }
    if (percent >= 50) {
      return name
        ? `${name}。\n揺らぎはある。だから、伸びる。`
        : `揺らぎはある。\nだから、伸びる。`;
    }
    return `共鳴は消えてない。\nDiDiDi…もう一回、試そ？`;
  }

  // ---------- DOM builder (NON-DESTRUCTIVE) ----------
  // Build inside #result without wiping existing children.
  function ensureShell(root) {
    let shell = root.querySelector(".tbResultShell");
    if (shell) return shell;

    shell = document.createElement("div");
    shell.className = "tbResultShell";
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-label", "Result");

    shell.innerHTML = `
      <div class="tbResultTop">
        <div class="tbResultTitle">OBSERVATION LOG</div>
        <div class="tbResultSub">TAROT BREAKER / ARU</div>
      </div>

      <div class="tbAruEyeWrap" aria-label="ARU Eye">
        <div class="tbAruEye" id="tbAruEye" aria-hidden="true">
          <div class="tbAruHalo"></div>
          <div class="tbAruStars"></div>
          <div class="tbAruIrisGlow"></div>
          <div class="tbAruIris"></div>
          <div class="tbAruCode"></div>
          <div class="tbAruPupil"></div>
          <div class="tbAruSeal" id="tbAruSeal">ARU / IRIS RESONANCE</div>
          <div class="tbAruComplete" id="tbAruComplete" aria-hidden="true">ARU EYE : COMPLETE</div>
        </div>
      </div>

      <div class="tbResRow" aria-label="Resonance">
        <div class="tbResValue" id="tbResValue">0%</div>
        <div class="tbResLabel">RESONANCE</div>
      </div>

      <div class="tbDicoLine" id="tbDicoLine"></div>

      <div class="tbResultActions">
        <button class="tbReplayBtn" id="tbReplayBtn" type="button">RESONATE AGAIN</button>
      </div>
    `;

    root.appendChild(shell);
    return shell;
  }

  // ---------- Animation helpers ----------
  function retriggerClass(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; // force reflow
    el.classList.add(cls);
  }

  function triggerIrisExpansion(eyeEl, percent) {
    if (!eyeEl) return;
    retriggerClass(eyeEl, "tbExpand");
    if (percent >= 100) {
      setTimeout(() => retriggerClass(eyeEl, "tbExpand"), 320);
    }
  }

  function setCompleteState(root, on) {
    const eye = root.querySelector("#tbAruEye");
    const complete = root.querySelector("#tbAruComplete");
    if (!eye || !complete) return;

    eye.classList.toggle("tbFull", !!on);
    complete.style.display = on ? "block" : "none";
    if (on) retriggerClass(complete, "tbPop");
  }

  // Smooth count-up with final “name call moment”
  function animateResult(root, targetPercent) {
    const valueEl = root.querySelector("#tbResValue");
    const lineEl = root.querySelector("#tbDicoLine");
    const eyeEl = root.querySelector("#tbAruEye");

    if (!valueEl || !lineEl) return;

    const target = clamp(Math.round(targetPercent), 0, 100);
    const name = safeUserName();
    const willCall = !!name && shouldCallName(target);

    // reset states
    setCompleteState(root, false);
    if (eyeEl) {
      eyeEl.classList.remove("tbExpand", "tbFull");
      // show() 時の覚醒演出
      retriggerClass(eyeEl, "tbAwake");
    }
    lineEl.textContent = "";
    valueEl.textContent = "0%";

    let cur = 0;
    const totalFrames = 58; // ~1s on 60fps
    const step = Math.max(1, Math.ceil(target / totalFrames));

    function tick() {
      cur = clamp(cur + step, 0, target);
      valueEl.textContent = `${cur}%`;

      if (cur < target) {
        requestAnimationFrame(tick);
        return;
      }

      // final copy
      lineEl.innerText = lineByPercent(target, willCall ? name : null);

      // Name call moment => iris expansion ONLY here
      if (willCall) triggerIrisExpansion(eyeEl, target);

      // 100% => complete seal
      if (target >= 100) setCompleteState(root, true);
    }

    requestAnimationFrame(tick);
  }

  // ---------- Styling injection ----------
  function injectStylesOnce() {
    if (document.getElementById("tbResultStyles")) return;

    const s = document.createElement("style");
    s.id = "tbResultStyles";
    s.textContent = `
/* ===== TAROT BREAKER RESULT (ARU Eye) ===== */
#result.active { pointer-events:auto; }
#result { position:absolute; inset:0; display:block; pointer-events:none; }
#result .tbResultShell{
  position:absolute; inset:0;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap:14px;
  padding:16px;
}

/* top */
#result .tbResultTop{ text-align:center; letter-spacing:.12em; }
#result .tbResultTitle{ font-weight:800; font-size:14px; opacity:.92; }
#result .tbResultSub{ font-weight:700; font-size:11px; opacity:.62; }

/* Eye wrap */
#result .tbAruEyeWrap{ width:min(320px, 86vw); display:flex; justify-content:center; }
#result .tbAruEye{
  width:260px; height:260px; border-radius:999px;
  position:relative; transform:translateZ(0);
  overflow:hidden;
  background:
    radial-gradient(circle at 50% 50%, rgba(0,0,0,0.92) 0%, rgba(6,7,14,0.96) 55%, rgba(2,3,6,0.98) 100%);
  box-shadow:
    0 24px 64px rgba(0,0,0,.45),
    0 0 0 1px rgba(255,255,255,.10) inset;
}

/* halo */
#result .tbAruHalo{
  position:absolute; inset:-20%;
  background:
    radial-gradient(circle at 50% 50%,
      rgba(230,201,107,0.10) 0%,
      rgba(0,240,255,0.10) 38%,
      rgba(156,60,255,0.10) 62%,
      rgba(0,0,0,0) 72%);
  filter: blur(10px);
  opacity:.9;
  animation: tbHalo 3.6s ease-in-out infinite;
}

/* stars */
#result .tbAruStars{
  position:absolute; inset:0;
  background:
    radial-gradient(circle at 20% 30%, rgba(255,255,255,.24), rgba(0,0,0,0) 46%),
    radial-gradient(circle at 70% 55%, rgba(255,255,255,.18), rgba(0,0,0,0) 50%),
    radial-gradient(circle at 40% 80%, rgba(255,255,255,.14), rgba(0,0,0,0) 52%);
  opacity:.5;
  mix-blend-mode:screen;
  animation: tbStars 6.8s linear infinite;
}

/* iris glow */
#result .tbAruIrisGlow{
  position:absolute; inset:10%;
  border-radius:999px;
  background:
    radial-gradient(circle at 50% 50%,
      rgba(0,240,255,0.20) 0%,
      rgba(156,60,255,0.18) 34%,
      rgba(230,201,107,0.16) 62%,
      rgba(0,0,0,0) 70%);
  filter: blur(10px);
  opacity:.85;
}

/* iris */
#result .tbAruIris{
  position:absolute; inset:16%;
  border-radius:999px;
  background:
    conic-gradient(from 120deg,
      rgba(156,60,255,0.86),
      rgba(0,240,255,0.86),
      rgba(230,201,107,0.86),
      rgba(156,60,255,0.86));
  opacity:.92;
  filter: saturate(1.1);
  animation: tbIris 4.0s linear infinite;
}

/* code ring */
#result .tbAruCode{
  position:absolute; inset:0;
  background:
    repeating-linear-gradient(90deg,
      rgba(255,255,255,0.00) 0px,
      rgba(255,255,255,0.00) 10px,
      rgba(255,255,255,0.10) 12px,
      rgba(255,255,255,0.00) 14px);
  opacity:.22;
  mix-blend-mode:overlay;
  transform: translateX(-30%);
  animation: tbCode 2.8s linear infinite;
}

/* pupil */
#result .tbAruPupil{
  position:absolute; inset:37%;
  border-radius:999px;
  background:
    radial-gradient(circle at 50% 50%,
      rgba(0,0,0,0.92) 0%,
      rgba(0,0,0,0.98) 60%,
      rgba(0,0,0,1.00) 100%);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.10) inset;
}

/* seals */
#result .tbAruSeal{
  position:absolute; left:50%; bottom:14px;
  transform:translateX(-50%);
  font-size:10px;
  font-weight:800;
  letter-spacing:.16em;
  opacity:.72;
  text-transform:uppercase;
  text-shadow:0 2px 8px rgba(0,0,0,.55);
}
#result .tbAruComplete{
  position:absolute; left:50%; top:18px;
  transform:translateX(-50%);
  font-size:11px;
  font-weight:900;
  letter-spacing:.18em;
  opacity:.92;
  text-shadow:0 2px 10px rgba(0,0,0,.6);
  display:none;
}

/* resonance text */
#result .tbResRow{ text-align:center; }
#result .tbResValue{
  font-size:44px;
  font-weight:900;
  letter-spacing:.02em;
  line-height:1;
  text-shadow:0 8px 24px rgba(0,0,0,.6);
}
#result .tbResLabel{
  font-size:11px;
  font-weight:800;
  letter-spacing:.18em;
  opacity:.68;
  margin-top:6px;
}

/* line */
#result .tbDicoLine{
  width:min(560px, 92vw);
  text-align:center;
  white-space:pre-line;
  font-size:14px;
  font-weight:800;
  letter-spacing:.04em;
  opacity:.92;
  text-shadow:0 6px 22px rgba(0,0,0,.55);
}

/* actions */
#result .tbResultActions{ margin-top:6px; }
#result .tbReplayBtn{
  border:0;
  padding:12px 16px;
  border-radius:14px;
  font-weight:900;
  letter-spacing:.14em;
  background: rgba(255,255,255,0.12);
  color: rgba(245,245,242,0.92);
  box-shadow: 0 16px 44px rgba(0,0,0,.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
#result .tbReplayBtn:active{ transform: translateY(1px); }

/* iris expansion: ONLY when name is called */
#result .tbAruEye.tbExpand .tbAruIris{
  animation: none;
  transform: scale(1.10);
  transition: transform 360ms cubic-bezier(.2,.9,.2,1);
}
#result .tbAruEye.tbExpand .tbAruPupil{
  transform: scale(0.92);
  transition: transform 360ms cubic-bezier(.2,.9,.2,1);
}
#result .tbAruEye.tbExpand .tbAruIrisGlow{
  opacity: 1;
  filter: blur(12px);
  transition: opacity 360ms ease, filter 360ms ease;
}

/* awaken pulse (0 -> eye awaken) */
#result .tbAruEye.tbAwake{
  animation: tbAwake .55s ease-out both;
}

/* complete mode */
#result .tbAruEye.tbFull{
  box-shadow:
    0 30px 72px rgba(0,0,0,.52),
    0 0 0 1px rgba(255,255,255,.14) inset,
    0 0 48px rgba(0,240,255,.16);
}
#result .tbAruComplete.tbPop{
  animation: tbPop .55s ease-out both;
}

/* keyframes */
@keyframes tbHalo{
  0%,100%{ transform: scale(1.00); opacity:.78; }
  50%{ transform: scale(1.06); opacity:.96; }
}
@keyframes tbStars{
  0%{ transform: translate3d(0,0,0); }
  100%{ transform: translate3d(8px,-10px,0); }
}
@keyframes tbIris{
  0%{ transform: rotate(0deg) scale(1.00); }
  100%{ transform: rotate(360deg) scale(1.00); }
}
@keyframes tbCode{
  0%{ transform: translateX(-30%); opacity:.18; }
  50%{ opacity:.26; }
  100%{ transform: translateX(30%); opacity:.18; }
}
@keyframes tbPop{
  0%{ transform: translateX(-50%) scale(.92); opacity:0; }
  60%{ transform: translateX(-50%) scale(1.06); opacity:1; }
  100%{ transform: translateX(-50%) scale(1.00); opacity:.92; }
}
@keyframes tbAwake{
  0%{ transform: scale(.985); filter: brightness(.9); }
  60%{ transform: scale(1.02); filter: brightness(1.08); }
  100%{ transform: scale(1.00); filter: brightness(1.00); }
}
`;
    document.head.appendChild(s);
  }

  // ---------- Public presenter ----------
  window.DI_RESULT = {
    init(opts) {
      const root = opts?.root || document.getElementById("result");
      if (!root) return { show() {}, hide() {} };

      injectStylesOnce();
      ensureShell(root);

      // Wire replay to start button (reliable)
      const replayBtn = root.querySelector("#tbReplayBtn");
      if (replayBtn && !replayBtn.__tbBound) {
        replayBtn.__tbBound = true;
        replayBtn.addEventListener("click", () => {
          // Hide overlay first
          root.classList.remove("active");

          const startBtn = document.getElementById("startBtn");
          if (startBtn) {
            startBtn.click();
            return;
          }
          const restartBtn = document.getElementById("restartBtn");
          restartBtn?.click?.();
        });
      }

      return {
        show(payload) {
          // payload: {score, maxCombo, resonance, reason}
          const percent = normalizePercent(payload?.resonance ?? 0);

          // ensure shell exists even if something replaced DOM
          ensureShell(root);

          // Activate overlay
          root.classList.add("active");

          // Animate ARU Eye result
          animateResult(root, percent);
        },
        hide() {
          root.classList.remove("active");
        },
      };
    },
  };

  // Backward compat (optional)
  window.TB_RESULT = window.TB_RESULT || {};
})();
