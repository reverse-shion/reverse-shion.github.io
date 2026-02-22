/* /di/js/engine/ui.js
   TAROT BREAKER – DiCo Resonance Core
   ------------------------------------------------------------
   UI = Resonance Brain
   - Combo → Color tier (cyan → violet → pink-gold)
   - Judge → Face overlay reaction
   - Resonance amp (0..1) → CSS --avatar-amp
   - High amp → Heartbeat sync
   - Addictive micro-rewards
   ------------------------------------------------------------
*/

(() => {
  const NS = (window.DI_ENGINE ||= {});

  class UI {
    constructor(refs) {
      this.r = refs;

      // Resonance system
      this.combo = 0;
      this.maxCombo = 0;

      this.amp = 0;        // smoothed
      this.ampTarget = 0;  // target
      this.resTier = 0;    // 0 cyan,1 violet,2 pinkgold

      this._lastUpdate = performance.now();

      // Face
      this._face = 1;
      this._overlay = 0;
      this._overlayUntil = 0;

      // Streak
      this._perfectStreak = 0;

      this.hideResult();
    }

    // =====================================================
    // MAIN UPDATE
    // =====================================================
    update({ t, score, combo, maxCombo, resonance, state }) {
      this.combo = combo;
      this.maxCombo = maxCombo;

      // --- resonance amp smoothing ---
      this.amp += (this.ampTarget - this.amp) * 0.12;
      this.ampTarget *= 0.996;

      this._updateColorTier();
      this._applyCssState();

      this._updateFace(resonance, state);

      this._updateTime(t);
      this._updateScore(score, combo, maxCombo, resonance);
    }

    // =====================================================
    // JUDGE HOOK
    // =====================================================
    onJudge(res) {
      if (!res) return;

      const name = res.name;

      if (name === "PERFECT") {
        this.combo++;
        this._perfectStreak++;
        this.ampTarget = Math.min(1, this.ampTarget + 0.09);
        this._overlayFace(3, 260);

        if (this._perfectStreak === 5) {
          this._overlayFace(4, 420);
          this._boost();
        }

      } else if (name === "GREAT") {
        this.combo++;
        this._perfectStreak = 0;
        this.ampTarget = Math.min(1, this.ampTarget + 0.05);
        this._overlayFace(2, 220);

      } else if (name === "MISS") {
        this.combo = 0;
        this._perfectStreak = 0;
        this.ampTarget *= 0.5;
        this._overlayFace(5, 380);
      }

      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this._updateColorTier();
    }

    // =====================================================
    // COLOR TIER (共鳴の進化)
    // =====================================================
    _updateColorTier() {
      if (this.combo >= 50) {
        this.resTier = 2;
      } else if (this.combo >= 30) {
        this.resTier = 1;
      } else {
        this.resTier = 0;
      }
    }

    _applyCssState() {
      const app = this.r.app;
      if (!app) return;

      // color tier
      app.dataset.resTier = this.resTier;

      // amp
      app.style.setProperty("--avatar-amp", this.amp.toFixed(3));

      // heartbeat (only high resonance)
      if (this.amp > 0.65) {
        app.classList.add("isHeartbeat");
      } else {
        app.classList.remove("isHeartbeat");
      }
    }

    // =====================================================
    // FACE SYSTEM
    // =====================================================
    _overlayFace(face, ms) {
      this._overlay = face;
      this._overlayUntil = performance.now() + ms;
    }

    _updateFace(resonance, state) {
      const img = this.r.dicoFace;
      if (!img) return;

      const now = performance.now();

      if (this._overlay && now > this._overlayUntil) {
        this._overlay = 0;
      }

      let baseFace = 1;

      if (resonance >= 70) baseFace = 3;
      else if (resonance >= 30) baseFace = 2;

      const finalFace = this._overlay || baseFace;

      if (finalFace !== this._face) {
        this._face = finalFace;
        img.src = `./faces/dico_face_${finalFace}.png`;
        img.classList.add("isSwap");
        setTimeout(() => img.classList.remove("isSwap"), 120);
      }
    }

    // =====================================================
    // UI TEXT
    // =====================================================
    _updateTime(t) {
      if (!this.r.time) return;
      const s = Math.floor(t);
      const mm = String(Math.floor(s / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      this.r.time.textContent = `${mm}:${ss}`;
    }

    _updateScore(score, combo, maxCombo, resonance) {
      if (this.r.sideScore)
        this.r.sideScore.textContent = String(Math.floor(score)).padStart(6, "0");

      if (this.r.sideCombo)
        this.r.sideCombo.textContent = combo;

      if (this.r.sideMaxCombo)
        this.r.sideMaxCombo.textContent = maxCombo;

      if (this.r.resFill)
        this.r.resFill.style.width = `${Math.max(0, Math.min(100, resonance))}%`;
    }

    // =====================================================
    // BOOST (rare reward)
    // =====================================================
    _boost() {
      if (!this.r.avatarRing) return;
      this.r.avatarRing.classList.add("ringBoost");
      setTimeout(() => {
        this.r.avatarRing.classList.remove("ringBoost");
      }, 800);
    }

    // =====================================================
    // RESULT
    // =====================================================
    showResult() {
      if (this.r.result)
        this.r.result.setAttribute("aria-hidden", "false");
    }

    hideResult() {
      if (this.r.result)
        this.r.result.setAttribute("aria-hidden", "true");
    }
  }

  NS.UI = UI;
})();
