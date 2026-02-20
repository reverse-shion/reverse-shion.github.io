/* /di/js/engine/ui.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class UI {
    constructor(refs) {
      this.r = refs;

      // cache for small animations
      this._lastJudgeAt = 0;
      this._ringSpin = 0; // deg

      // initial hide
      this.hideResult();
    }

    update({ t, score, combo, maxCombo, resonance, state }) {
      const { r } = this;

      // time
      const mmss = this._formatTime(t);
      if (r.time) r.time.textContent = mmss;
      if (r.timeDup) r.timeDup.textContent = mmss;

      // score (sync legacy + side)
      const s6 = String(Math.floor(score)).padStart(6, "0");
      if (r.sideScore) r.sideScore.textContent = s6;
      if (r.score) r.score.textContent = String(Math.floor(score));

      // combo
      if (r.sideCombo) r.sideCombo.textContent = String(combo);
      if (r.combo) r.combo.textContent = String(combo);

      // max combo
      if (r.sideMaxCombo) r.sideMaxCombo.textContent = String(maxCombo);
      if (r.maxCombo) r.maxCombo.textContent = String(maxCombo);

      // resonance
      const res = Math.max(0, Math.min(100, resonance));
      if (r.resValue) r.resValue.textContent = String(Math.round(res));
      if (r.resFill) r.resFill.style.width = `${res}%`;

      // ring rotation (driven by resonance + state)
      if (r.avatarRing) {
        const spinSpeed = state === "playing" ? (0.6 + res * 0.02) : 0.0;
        this._ringSpin = (this._ringSpin + spinSpeed) % 360;
        r.avatarRing.style.transform = `rotate(${this._ringSpin}deg)`;
      }
    }

    onJudge(res) {
      const { r } = this;
      if (!res) return;

      if (res.name === "EMPTY") return;

      // show judge text
      if (r.judge) {
        r.judge.setAttribute("aria-hidden", "false");
        r.judgeMain.textContent = (res.name === "PERFECT") ? "PERFECT"
                        : (res.name === "GREAT") ? "GREAT"
                        : (res.name === "GOOD") ? "GOOD"
                        : "MISS";
        r.judgeSub.textContent = (res.name === "MISS") ? "DESYNC" : "SYNC";

        // fade out after short delay
        const now = performance.now();
        this._lastJudgeAt = now;
        setTimeout(() => {
          if (performance.now() - this._lastJudgeAt >= 220) {
            r.judge.setAttribute("aria-hidden", "true");
          }
        }, 240);
      }

      // aria live
      if (r.ariaLive) {
        const diffMs = res.diff != null ? Math.round(res.diff * 1000) : "";
        r.ariaLive.textContent = res.name + (diffMs ? ` ${diffMs}ms` : "");
      }

      // DiCo line (micro)
      if (r.dicoLine && (res.name === "PERFECT" || res.name === "GREAT")) {
        // keep it subtle; can be replaced with story lines later
        r.dicoLine.textContent = (res.name === "PERFECT")
          ? "いまの、キラってした。"
          : "いい感じ、しーちゃん。";
      } else if (r.dicoLine && res.name === "MISS") {
        r.dicoLine.textContent = "だいじょうぶ、次で取り戻そ。";
      }
    }

    flashHit() {
      const { r } = this;
      if (!r.hitFlash) return;
      r.hitFlash.style.opacity = "1";
      r.hitFlash.style.transform = "scale(1.03)";
      setTimeout(() => {
        r.hitFlash.style.opacity = "0";
        r.hitFlash.style.transform = "scale(.98)";
      }, 110);
    }

    showResult({ score, maxCombo, resonance }) {
      const { r } = this;
      if (r.result) r.result.setAttribute("aria-hidden", "false");

      if (r.resultScore) r.resultScore.textContent = String(Math.floor(score));
      if (r.resultMaxCombo) r.resultMaxCombo.textContent = String(maxCombo);

      const res = Math.max(0, Math.min(100, resonance));
      if (r.aruValue) r.aruValue.textContent = `${Math.round(res)}%`;

      // progress circle (dashoffset)
      if (r.aruProg) {
        const C = 276.46; // matches CSS
        const off = C * (1 - res / 100);
        r.aruProg.style.strokeDashoffset = String(off);
      }
    }

    hideResult() {
      const { r } = this;
      if (r.result) r.result.setAttribute("aria-hidden", "true");
    }

    toast(text) {
      // small, non-intrusive aria notify
      if (this.r.ariaLive) this.r.ariaLive.textContent = text;
    }

    _formatTime(t) {
      const s = Math.max(0, Math.floor(t));
      const mm = String(Math.floor(s / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      return `${mm}:${ss}`;
    }
  }

  NS.UI = UI;
})();
