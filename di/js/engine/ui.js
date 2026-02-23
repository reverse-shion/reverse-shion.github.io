/* /di/js/engine/ui.js
   UI — PRO FINAL (Addictive Face Reactions) v2.0
   ------------------------------------------------------------
   ✅ Fix: dicoFace transform overwrite removed (no more translate break)
   ✅ Pulse via CSS variable --pulseScale (keeps base translate(-50%,-50%))
   ✅ iOS-safe: minimal DOM churn, short timers only, no interval spam
   ✅ Soft-fail: missing refs won't crash
   ✅ Face system: Base + Overlay + Reward (rare)
*/
(() => {
  "use strict";
  const NS = (window.DI_ENGINE ||= {});

  class UI {
    constructor(refs) {
      this.r = refs || {};

      // judge fade cache
      this._lastJudgeAt = 0;

      // ring spin (deg)
      this._ringSpin = 0;

      // -----------------------
      // FACE SYSTEM STATE
      // -----------------------
      this._face = 1;                 // applied face (1..5)
      this._baseFace = 1;             // stable base face
      this._overlayFace = 0;          // reaction overlay (0=none)
      this._overlayUntil = 0;         // overlay expiry (ms)
      this._faceLockUntil = 0;        // prevent flicker (ms)
      this._swapTimer = 0;            // cleanup for swap class

      // streaks / rolling stats
      this._perfectStreak = 0;
      this._greatStreak = 0;
      this._missStreak = 0;

      this._lastCombo = 0;
      this._lastScore = 0;

      // “addictive gates” (one-shot milestones)
      this._milestone10 = false;
      this._milestone30 = false;
      this._milestone50 = false;
      this._milestone100 = false;

      // time-based throttles (avoid spam)
      this._lineUntil = 0;
      this._lastMilestoneAt = 0;
      this._lastJudgeOverlayAt = 0;

      // micro pulses (cheap)
      this._pulseUntil = 0;

      // initial hide
      this.hideResult();

      // preload pool (optional)
      this._preloadFaces();

      // safety: ensure judge nodes exist if judge exists
      if (this.r.judge && !this.r.judgeMain) this.r.judgeMain = this.r.judge.querySelector?.(".judgeMain") || this.r.judgeMain;
      if (this.r.judge && !this.r.judgeSub)  this.r.judgeSub  = this.r.judge.querySelector?.(".judgeSub")  || this.r.judgeSub;
    }

    // ============================================================
    // Main loop update
    // ============================================================
    update({ t, score, combo, maxCombo, resonance, state }) {
      const r = this.r;

      // --- time ---
      const mmss = this._formatTime(t);
      if (r.time) r.time.textContent = mmss;
      if (r.timeDup) r.timeDup.textContent = mmss;

      // --- score (legacy + side) ---
      const sInt = Math.floor(score || 0);
      const s6 = String(sInt).padStart(6, "0");
      if (r.sideScore) r.sideScore.textContent = s6;
      if (r.score) r.score.textContent = String(sInt);

      // --- combo ---
      if (r.sideCombo) r.sideCombo.textContent = String(combo || 0);
      if (r.combo) r.combo.textContent = String(combo || 0);

      // --- max combo ---
      if (r.sideMaxCombo) r.sideMaxCombo.textContent = String(maxCombo || 0);
      if (r.maxCombo) r.maxCombo.textContent = String(maxCombo || 0);

      // --- resonance ---
      const res = Math.max(0, Math.min(100, Number(resonance) || 0));
      if (r.resValue) r.resValue.textContent = String(Math.round(res));
      if (r.resFill) r.resFill.style.width = `${res}%`;

      // --- ring rotation ---
      if (r.avatarRing) {
        const s = String(state || "idle");
        const spinSpeed = s === "playing" ? (0.65 + res * 0.018) : 0.0;
        this._ringSpin = (this._ringSpin + spinSpeed) % 360;
        // IMPORTANT: ring rotation is safe (ring is separate element)
        r.avatarRing.style.transform = `rotate(${this._ringSpin}deg)`;
      }

      // --- addictive event detectors (combo/score/res milestones) ---
      this._handleComboEvents(Number(combo) || 0, String(state || "idle"));
      this._handleScoreEvents(sInt, String(state || "idle"));
      this._handleResonanceEvents(res, String(state || "idle"));

      // --- face compose (base + overlay) ---
      this._updateFaceSystem({ resonance: res, state: String(state || "idle") });

      // remember
      this._lastScore = sInt;
      this._lastCombo = Number(combo) || 0;
    }

    // ============================================================
    // Judge hook (tap result)
    // ============================================================
    onJudge(res) {
      const r = this.r;
      if (!res || res.name === "EMPTY") return;

      // ---------- judge label ----------
      if (r.judge && r.judgeMain && r.judgeSub) {
        r.judge.setAttribute("aria-hidden", "false");

        const name = res.name;
        r.judgeMain.textContent =
          (name === "PERFECT") ? "PERFECT"
        : (name === "GREAT")   ? "GREAT"
        : (name === "GOOD")    ? "GOOD"
        : "MISS";

        r.judgeSub.textContent = (name === "MISS") ? "DESYNC" : "SYNC";

        const now = performance.now();
        this._lastJudgeAt = now;
        setTimeout(() => {
          if (performance.now() - this._lastJudgeAt >= 220) {
            try { r.judge.setAttribute("aria-hidden", "true"); } catch {}
          }
        }, 240);
      }

      // aria live
      if (r.ariaLive) {
        const diffMs = res.diff != null ? Math.round(res.diff * 1000) : "";
        r.ariaLive.textContent = res.name + (diffMs ? ` ${diffMs}ms` : "");
      }

      // ---------- addictive face reaction ----------
      const now = performance.now();
      const name = res.name;

      // throttle overlay spam (so faces feel “meaningful”)
      if (now - this._lastJudgeOverlayAt < 70) return;
      this._lastJudgeOverlayAt = now;

      if (name === "PERFECT") {
        this._perfectStreak++;
        this._greatStreak = 0;
        this._missStreak = 0;

        this._faceOverlay(3, 260);
        this._pulse(120);

        if (this._perfectStreak === 5) {
          this._faceOverlay(4, 360);
          this._ringBoost(520);
          this._linePush("キミの波形、いま…跳ねた。", 820);
        } else if (this._perfectStreak === 10) {
          this._faceOverlay(4, 480);
          this._ringBoost(920);
          this._linePush("DiDiDi…！そのまま、いける。", 980);
        } else {
          this._linePush("いまの、キラってした。", 520);
        }

      } else if (name === "GREAT") {
        this._greatStreak++;
        this._perfectStreak = 0;
        this._missStreak = 0;

        this._faceOverlay(2, 220);
        this._pulse(90);

        if (this._greatStreak === 8) {
          this._faceOverlay(3, 300);
          this._ringBoost(420);
          this._linePush("揃ってきた。今のライン、好き。", 860);
        } else {
          this._linePush("いい感じ、しーちゃん。", 520);
        }

      } else if (name === "GOOD") {
        this._perfectStreak = 0;
        this._greatStreak = 0;
        this._missStreak = 0;

        this._faceOverlay(1, 180);
        this._pulse(70);
        this._linePush("うん、合わせてこ。", 520);

      } else if (name === "MISS") {
        this._perfectStreak = 0;
        this._greatStreak = 0;
        this._missStreak++;

        if (this._missStreak >= 2) {
          this._faceOverlay(5, 560);
          this._ringDampen(520);
          this._linePush("だいじょうぶ。呼吸、戻そ。", 980);
        } else {
          this._faceOverlay(5, 380);
          this._ringDampen(260);
          this._linePush("だいじょうぶ、次で取り戻そ。", 780);
        }
      }
    }

    // ============================================================
    // Existing hit flash
    // ============================================================
    flashHit() {
      const r = this.r;
      if (!r.hitFlash) return;
      r.hitFlash.style.opacity = "1";
      r.hitFlash.style.transform = "scale(1.03)";
      setTimeout(() => {
        r.hitFlash.style.opacity = "0";
        r.hitFlash.style.transform = "scale(.98)";
      }, 110);
    }

    // ============================================================
    // Result overlay
    // ============================================================
    showResult({ score, maxCombo, resonance }) {
      const r = this.r;
      if (r.result) r.result.setAttribute("aria-hidden", "false");

      if (r.resultScore) r.resultScore.textContent = String(Math.floor(score || 0));
      if (r.resultMaxCombo) r.resultMaxCombo.textContent = String(maxCombo || 0);

      const res = Math.max(0, Math.min(100, Number(resonance) || 0));
      if (r.aruValue) r.aruValue.textContent = `${Math.round(res)}%`;

      if (r.aruProg) {
        const C = 276.46; // ring circumference
        const off = C * (1 - res / 100);
        r.aruProg.style.strokeDashoffset = String(off);
      }

      // result “reward face”
      if (res >= 90) this._faceOverlay(4, 620);
      else if (res >= 60) this._faceOverlay(3, 520);
      else if (res >= 25) this._faceOverlay(2, 420);
      else this._faceOverlay(1, 320);
    }

    hideResult() {
      const r = this.r;
      if (r.result) r.result.setAttribute("aria-hidden", "true");
    }

    toast(text) {
      if (this.r.ariaLive) this.r.ariaLive.textContent = text;
    }

    // ============================================================
    // Addictive event detectors
    // ============================================================
    _handleComboEvents(combo, state) {
      if (state !== "playing") return;

      const now = performance.now();
      const last = this._lastCombo;

      if (combo === 0 && last >= 12) {
        this._faceOverlay(5, 520);
        this._ringDampen(420);
        this._linePush("まだ終わってない。次、合わせよ。", 980);

        this._milestone10 = false;
        this._milestone30 = false;
        this._milestone50 = false;
        this._milestone100 = false;
        return;
      }

      if (now - this._lastMilestoneAt < 220) return;

      if (!this._milestone10 && combo >= 10) {
        this._milestone10 = true;
        this._lastMilestoneAt = now;
        this._faceOverlay(2, 340);
        this._ringBoost(420);
        this._linePush("その調子。波、揃ってきた。", 900);
        return;
      }

      if (!this._milestone30 && combo >= 30) {
        this._milestone30 = true;
        this._lastMilestoneAt = now;
        this._faceOverlay(4, 460);
        this._ringBoost(720);
        this._linePush("DiDiDi…！いま、乗った。", 980);
        return;
      }

      if (!this._milestone50 && combo >= 50) {
        this._milestone50 = true;
        this._lastMilestoneAt = now;
        this._faceOverlay(4, 540);
        this._ringBoost(920);
        this._linePush("そのまま。キミの共鳴、刺さってる。", 1100);
        return;
      }

      if (!this._milestone100 && combo >= 100) {
        this._milestone100 = true;
        this._lastMilestoneAt = now;
        this._faceOverlay(4, 720);
        this._ringBoost(1400);
        this._linePush("……見えた。星のライン。", 1300);
        return;
      }
    }

    _handleScoreEvents(score, state) {
      if (state !== "playing") return;

      const last = this._lastScore;
      if (score <= last) return;

      const step = 5000;
      const a = Math.floor(last / step);
      const b = Math.floor(score / step);
      if (b <= a) return;

      this._faceOverlay(2, 240);
      this._ringBoost(300);
      this._linePush("積み上がってる。いい。", 780);
    }

    _handleResonanceEvents(res, state) {
      if (state !== "playing") return;

      const now = performance.now();
      if (this._overlayFace && now < this._overlayUntil) return;

      if (res >= 90) this._faceOverlay(3, 220);
      else if (res >= 60) this._faceOverlay(2, 180);
    }

    // ============================================================
    // FACE SYSTEM (Base + Overlay)
    // ============================================================
    _facesrc(n) {
      return `./faces/dico_face_${n}.png`;
    }

    _preloadFaces() {
      const r = this.r;
      const set = (img, n) => {
        try {
          if (img && !img.getAttribute("src")) img.src = this._facesrc(n);
        } catch {}
      };
      set(r.face1, 1); set(r.face2, 2); set(r.face3, 3); set(r.face4, 4); set(r.face5, 5);
    }

    _updateFaceSystem({ resonance, state }) {
      const r = this.r;
      const img = r.dicoFace;
      if (!img) return;

      const now = performance.now();

      // expire overlay
      if (this._overlayFace && now >= this._overlayUntil) {
        this._overlayFace = 0;
      }

      // base face (stable)
      this._baseFace = this._computeBaseFace({ resonance, state });

      // compose
      const target = this._overlayFace || this._baseFace;

      // lock (no flicker)
      if (now < this._faceLockUntil) {
        this._applyPulse(img, now);
        return;
      }

      if (target !== this._face) {
        this._applyFace(target);
        this._faceLockUntil = now + 120;
      }

      this._applyPulse(img, now);
    }

    _computeBaseFace({ resonance, state }) {
      if (state === "idle") return 1;
      if (state === "result") return 1;

      if (resonance >= 70) return 3;
      if (resonance >= 30) return 2;
      return 1;
    }

    _applyFace(face) {
      const r = this.r;
      const img = r.dicoFace;
      if (!img) return;

      this._face = face;
      img.dataset.face = String(face);

      const next = this._facesrc(face);
      try {
        if (img.src && img.src.endsWith(next)) return;
      } catch {}

      img.src = next;

      // micro swap class
      try { img.classList.add("isSwap"); } catch {}
      clearTimeout(this._swapTimer);
      this._swapTimer = setTimeout(() => {
        try { img.classList.remove("isSwap"); } catch {}
      }, 120);
    }

    _faceOverlay(face, ms) {
      const now = performance.now();
      this._overlayFace = face;
      this._overlayUntil = now + Math.max(60, ms | 0);

      // allow immediate overlay swap
      this._faceLockUntil = now;
    }

    // ============================================================
    // Micro feel: pulse + ring helpers
    // ============================================================
    _pulse(ms) {
      const now = performance.now();
      this._pulseUntil = Math.max(this._pulseUntil, now + (ms | 0));
    }

    // ✅ FIXED: DO NOT overwrite transform (keeps translate(-50%,-50%) in CSS)
    _applyPulse(img, now) {
      const active = now < this._pulseUntil;

      if (active) {
        // Use CSS variable for scale; CSS composes translate + scale.
        img.style.setProperty("--pulseScale", "1.02");
        img.style.filter = "brightness(1.05) saturate(1.03)";
      } else {
        img.style.removeProperty("--pulseScale");
        if (img.style.filter) img.style.filter = "";
      }
    }

    _ringBoost(ms) {
      const r = this.r;
      if (!r.avatarRing) return;
      try { r.avatarRing.classList.add("ringBoost"); } catch {}
      setTimeout(() => {
        try { r.avatarRing.classList.remove("ringBoost"); } catch {}
      }, Math.max(120, ms | 0));
    }

    _ringDampen(ms) {
      const r = this.r;
      if (!r.avatarRing) return;
      try { r.avatarRing.classList.add("ringDampen"); } catch {}
      setTimeout(() => {
        try { r.avatarRing.classList.remove("ringDampen"); } catch {}
      }, Math.max(120, ms | 0));
    }

    _linePush(text, holdMs = 600) {
      const now = performance.now();
      const el = this.r.dicoLine;
      if (!el) return;

      if (now < this._lineUntil) return;

      el.textContent = text;
      this._lineUntil = now + Math.max(200, holdMs | 0);
    }

    // ============================================================
    // Utils
    // ============================================================
    _formatTime(t) {
      const s = Math.max(0, Math.floor(Number(t) || 0));
      const mm = String(Math.floor(s / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      return `${mm}:${ss}`;
    }
  }

  NS.UI = UI;
})();
