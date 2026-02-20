/* /di/js/result.js
   TAROT BREAKER – RESULT (ARU Eye)
   - Integrates getUserName() from /js/common.js
   - Iris expansion triggers ONLY when calling the name
   - 100% => double expansion
   - Lightweight & safe (no crash if common.js missing)
*/
(function(){
  "use strict";

  const resultEl = document.getElementById("result");
  if (!resultEl) return;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const isNum = (n) => Number.isFinite(n);

  function safeUserName(){
    try{
      if (typeof getUserName === "function"){
        const n = getUserName();
        if (typeof n === "string" && n.trim()) return n.trim();
      }
    }catch{}
    return null;
  }

  function shouldCallName(percent){
    // 0-49: no, 50-79: yes, 80-99: yes, 100: yes
    return percent >= 50;
  }

  function lineByPercent(percent, name){
    // tone: DiCo calm / TAROT BREAKER
    if (percent >= 100){
      return name
        ? `……完全共鳴。\n${name}、ちゃんと届いてる。`
        : `……完全共鳴。\nちゃんと届いてる。`;
    }
    if (percent >= 80){
      return name
        ? `${name}。\nいい波形。もう少し伸ばせるよ。`
        : `いい波形。\nもう少し伸ばせるよ。`;
    }
    if (percent >= 50){
      return name
        ? `${name}。\nまだ揺らいでるね。`
        : `まだ揺らいでるね。`;
    }
    return "共鳴は消えてない。\n試してみよ？";
  }

  function buildDOM(){
    // Shell keeps future expansion easy
    resultEl.innerHTML = `
      <div class="resultShell" role="dialog" aria-label="Result">
        <div class="resultTitle">OBSERVATION LOG</div>

        <div class="aruEyeWrap" aria-label="ARU Eye">
          <div class="aruEye" id="aruEye" aria-hidden="true">
            <div class="aruIrisGlow"></div>
            <div class="aruStars"></div>
            <div class="aruIris"></div>
            <div class="aruCode"></div>
            <div class="aruPupil"></div>
          </div>
          <div class="aruSealText">ARU / IRIS RESONANCE</div>
        </div>

        <div class="resonanceValue" id="resValue">0%</div>
        <div class="resonanceLabel">RESONANCE</div>

        <div class="dicoLine" id="dicoLine"></div>

        <button class="replayBtn" id="replayBtn" type="button">RESONATE AGAIN</button>
      </div>
    `;

    const replayBtn = document.getElementById("replayBtn");
    if (replayBtn){
      replayBtn.addEventListener("click", () => {
        // hide only (actual restart is handled by main.js restartBtn / startBtn)
        resultEl.classList.remove("active");
      }, { passive: true });
    }
  }

  function triggerIris(eye, percent){
    if (!eye) return;

    // retrigger animation reliably
    eye.classList.remove("expand");
    // force reflow
    void eye.offsetWidth;
    eye.classList.add("expand");

    // 100% => double expansion (short delay)
    if (percent >= 100){
      setTimeout(() => {
        eye.classList.remove("expand");
        void eye.offsetWidth;
        eye.classList.add("expand");
      }, 320);
    }
  }

  function animateValue(targetPercent){
    const valueEl = document.getElementById("resValue");
    const lineEl  = document.getElementById("dicoLine");
    const eye     = document.getElementById("aruEye");

    if (!valueEl || !lineEl) return;

    const target = clamp(Math.round(targetPercent), 0, 100);
    const name = safeUserName();

    // state flags
    if (eye){
      eye.classList.remove("full");
      if (target >= 100) eye.classList.add("full");
    }

    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 55)); // ~1s-ish

    const tick = () => {
      cur = clamp(cur + step, 0, target);
      valueEl.textContent = `${cur}%`;

      if (cur < target){
        requestAnimationFrame(tick);
        return;
      }

      // decide line and whether name is called
      const call = !!name && shouldCallName(target);
      lineEl.innerText = lineByPercent(target, call ? name : null);

      // iris expansion ONLY when name is called
      if (call) triggerIris(eye, target);
    };

    requestAnimationFrame(tick);
  }

  // Public API
  window.TB_RESULT = {
    show(percent){
      const p = isNum(percent) ? percent : 0;
      buildDOM();
      resultEl.classList.add("active");
      animateValue(p);
    },
    hide(){
      resultEl.classList.remove("active");
    }
  };

  // Backward compatibility (if you already call showResult())
  window.showResult = (p) => window.TB_RESULT.show(p);

})();
