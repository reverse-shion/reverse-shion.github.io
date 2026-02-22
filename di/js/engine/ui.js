/* /di/js/engine/ui.js
   UI — PRO FINAL (addictive face reactions + combo streak + resonance base)
   - Face system:
     Base (resonance/state) + Reaction overlay (judge/threshold) with lock & decay
     Faces: /di/faces/dico_face_1.png .. dico_face_5.png
       1 = 通常
       2 = 流れ良い（安定上振れ）
       3 = PERFECT（上振れ）
       4 = 爆発祝福（到達/連続ご褒美）
       5 = ぷく顔（悔し）
   - Mobile safe: no heavy DOM churn, minimal timers, rAF for micro FX
   - Works even if some refs are missing (soft-fail)
*/
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class UI {
    constructor(refs) {
      this.r = refs;

      // judge fade cache
      this._lastJudgeAt = 0;

      // ring spin (deg)
      this._ringSpin = 0;

      // ----- FACE SYSTEM -----
      this._face = 1;                 // currently applied face id (1..5)
      this._baseFace = 1;             // computed base face
      this._overlayFace = 0;          // 0 = none
      this._overlayUntil = 0;         // ms (performance.now)
      this._faceLockUntil = 0;        // ms (prevents flicker)
      this._faceSwapTimer = 0;        // timeout id (cleanup)

      // streak / thresholds
      this._perfectStreak = 0;
      this._missStreak = 0;

      this._lastCombo = 0;
      this._lastResBucket = -1;

      // cheap micro-animations
      this._hitPulseUntil = 0;
      this._comboPulseUntil = 0;

      // initial hide
      this.hideResult();

      // preload face pool if exists (optional)
      this._preloadFaces();
    }

    // ---------------------------
    // Main loop UI update
    // ---------------------------
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

      // resonance clamp
      const res = Math.max(0, Math.min(100, resonance));
      if (r.resValue) r.resValue.textContent = String(Math.round(res));
      if (r.resFill) r.resFill.style.width = `${res}%`;

      // ring rotation (driven by resonance + state)
      if (r.avatarRing) {
        const spinSpeed = state === "playing" ? (0.6 + res * 0.02) : 0.0;
        this._ringSpin = (this._ringSpin + spinSpeed) % 360;
        r.avatarRing.style.transform = `rotate(${this._ringSpin}deg)`;
      }

      // ----- Addictive “events” derived from continuous values -----
      this._handleComboThresholds(combo, state);
      this._handleResonanceMilestones(res, state);

      // ----- Face base + overlay compose -----
      this._updateFaceSystem({ score, combo, resonance: res, state });
    }

    // ---------------------------
    // Judge reaction hook
    // ---------------------------
    onJudge(res) {
      const { r } = this;
      if (!res) return;
      if (res.name === "EMPTY") return;

      // show judge text
      if (r.judge) {
        r.judge.setAttribute("aria-hidden", "false");
        r.judgeMain.textContent =
          (res.name === "PERFECT") ? "PERFECT"
        : (res.name === "GREAT")   ? "GREAT"
        : (res.name === "GOOD")    ? "GOOD"
        : "MISS";

        r.judgeSub.textContent = (res.name === "MISS") ? "DESYNC" : "SYNC";

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

      // streak bookkeeping + addictive overlays
      const name = res.name;

      if (name === "PERFECT") {
        this._perfectStreak++;
        this._missStreak = 0;

        // PERFECT = face 3 (short), streak bonuses = face 4 (rarer)
        if (this._perfectStreak === 5) {
          this._faceOverlay(4, 320);       // “ご褒美”
          this._ringBoost(520);            // ring excitement
          this._linePush("キミの波形、いま…跳ねた。");
        } else if (this._perfectStreak === 10) {
          this._faceOverlay(4, 420);       // stronger
          this._ringBoost(880);            // longer boost
          this._linePush("DiDiDi…！そのまま、いける。");
        } else {
          this._faceOverlay(3, 260);
          this._linePush("いまの、キラってした。");
        }

        // micro pulse to make hit feel “alive”
        this._pulseHit(120);

      } else if (name === "GREAT") {
        this._perfectStreak = 0;
        this._missStreak = 0;

        this._faceOverlay(2, 220);
        this._linePush("いい感じ、しーちゃん。");
        this._pulseHit(90);

      } else if (name === "GOOD") {
        this._perfectStreak = 0;
        this._missStreak = 0;

        // keep it grounded (don’t overreact)
        this._faceOverlay(1, 180);
        this._linePush("うん、合わせてこ。");
        this._pulseHit(70);

      } else if (name === "MISS") {
        this._perfectStreak = 0;
        this._missStreak++;

        // MISS = face 5 (cute frustration)
        // MISS streak: 2連で少し長め + “落ち着かせ”の一言
        if (this._missStreak >= 2) {
          this._faceOverlay(5, 520);
          this._linePush("だいじょうぶ。呼吸、戻そ。");
          this._ringDampen(520);
        } else {
          this._faceOverlay(5, 360);
          this._linePush("だいじょうぶ、次で取り戻そ。");
          this._ringDampen(260);
        }
      }
    }

    // ---------------------------
    // Hit flash (existing)
    // ---------------------------
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

    // ---------------------------
    // Result overlay
    // ---------------------------
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

      // result face = resonance based (calm reward)
      if (res >= 90) this._faceOverlay(4, 520);
      else if (res >= 60) this._faceOverlay(3, 420);
      else if (res >= 25) this._faceOverlay(2, 360);
      else this._faceOverlay(1, 280);
    }

    hideResult() {
      const { r } = this;
      if (r.result) r.result.setAttribute("aria-hidden", "true");
    }

    toast(text) {
      if (this.r.ariaLive) this.r.ariaLive.textContent = text;
    }

    // ============================================================
    // FACE SYSTEM (Base + Overlay)
    // ============================================================

    _facesrc(n) {
      // user said: di/faces/dico_face_1.png and numbers change
      return `./faces/dico_face_${n}.png`;
    }

    _preloadFaces() {
      const { r } = this;
      // If facePool exists in DOM, browser will preload. This is extra-safety.
      // Keep it cheap: just ensure images have correct src if present.
      if (!r.face1 && !r.face2 && !r.face3 && !r.face4 && !r.face5) return;
      const set = (img, n) => { if (img && !img.src) img.src = this._facesrc(n); };
      set(r.face1, 1); set(r.face2, 2); set(r.face3, 3); set(r.face4, 4); set(r.face5, 5);
    }

    _updateFaceSystem({ score, combo, resonance, state }) {
      const { r } = this;
      const img = r.dicoFace;
      if (!img) return;

      const now = performance.now();

      // expire overlay
      if (this._overlayFace && now >= this._overlayUntil) {
        this._overlayFace = 0;
      }

      // base face (slow / “story”)
      this._baseFace = this._computeBaseFace({ score, combo, resonance, state });

      // composed face
      const target = this._overlayFace || this._baseFace;

      // lock to prevent rapid swaps
      if (now < this._faceLockUntil) return;

      if (target !== this._face) {
        this._applyFace(target);
        // lock just enough to feel snappy but not flickery
        this._faceLockUntil = now + 120;
      }

      // optional: tiny “alive” modulation based on recent pulses (no CSS required)
      // Use transform only when we have to, keep cheap.
      const needsPulse = (now < this._hitPulseUntil) || (now < this._comboPulseUntil);
      if (needsPulse) {
        // subtle, non-janky
        img.style.transform = "scale(1.02)";
        img.style.filter = "brightness(1.05) saturate(1.03)";
      } else {
        // avoid forcing style every frame; only reset if previously set
        if (img.style.transform) img.style.transform = "";
        if (img.style.filter) img.style.filter = "";
      }
    }

    _computeBaseFace({ resonance, state }) {
      // Base is “resonance story”. Keep it stable.
      // 1=通常, 2=流れ良い, 3=上振れ, 4=祝福(ベースには基本使わない), 5=悔し(ベースは使わない)
      if (state === "idle") return 1;

      // In result, let overlay handle it — base stays calm.
      if (state === "result") return 1;

      if (resonance >= 60) return 3;
      if (resonance >= 25) return 2;
      return 1;
    }

    _applyFace(face) {
      const { r } = this;
      const img = r.dicoFace;
      if (!img) return;

      this._face = face;
      img.dataset.face = String(face);
      img.src = this._facesrc(face);

      // micro “swap pop” class if CSS supports it
      img.classList.add("isSwap");
      clearTimeout(this._faceSwapTimer);
      this._faceSwapTimer = setTimeout(() => img.classList.remove("isSwap"), 120);
    }

    _faceOverlay(face, ms) {
      const now = performance.now();
      this._overlayFace = face;
      this._overlayUntil = now + Math.max(60, ms | 0);
      // reduce flicker: keep lock short so overlay feels instant
      this._faceLockUntil = now; // allow immediate swap
    }

    // ============================================================
    // Addictive Triggers (Combo / Resonance)
    // ============================================================

    _handleComboThresholds(combo, state) {
      if (state !== "playing") {
        this._lastCombo = combo;
        return;
      }

      // combo break (drop)
      if (combo === 0 && this._lastCombo >= 10) {
        this._faceOverlay(5, 520);
        this._linePush("まだ終わってない。次、合わせよ。");
        this._ringDampen(420);
      }

      // milestones (rise)
      // These are addictive “pings” — don’t overuse.
      if (combo >= 10 && this._lastCombo < 10) {
        this._faceOverlay(2, 320);
        this._comboPing();
        this._linePush("その調子。波、揃ってきた。");
      }
      if (combo >= 30 && this._lastCombo < 30) {
        this._faceOverlay(4, 420);
        this._comboPing(1);
        this._ringBoost(620);
        this._linePush("DiDiDi…！いま、乗った。");
      }
      if (combo >= 50 && this._lastCombo < 50) {
        this._faceOverlay(4, 520);
        this._comboPing(2);
        this._ringBoost(920);
        this._linePush("そのまま。キミの共鳴、刺さってる。");
      }

      this._lastCombo = combo;
    }

    _handleResonanceMilestones(res, state) {
      if (state !== "playing") {
        this._lastResBucket = this._resBucket(res);
        return;
      }

      const b = this._resBucket(res);
      if (this._lastResBucket < 0) this._lastResBucket = b;

      // bucket up = satisfying “level up”
      if (b > this._lastResBucket) {
        if (b === 1) {
          this._faceOverlay(2, 320);
          this._ringBoost(420);
          this._linePush("共鳴、上がった。");
        } else if (b === 2) {
          this._faceOverlay(3, 360);
          this._ringBoost(620);
          this._linePush("ね、見えた。光の線。");
        } else if (b === 3) {
          this._faceOverlay(4, 480);
          this._ringBoost(920);
          this._linePush("……来た。いま、繋がった。");
        }
      }

      this._lastResBucket = b;
    }

    _resBucket(res) {
      // 0: <25, 1:25-59, 2:60-89, 3:>=90
      if (res >= 90) return 3;
      if (res >= 60) return 2;
      if (res >= 25) return 1;
      return 0;
    }

    // ============================================================
    // Micro FX helpers (cheap)
    // ============================================================

    _pulseHit(ms) {
      const now = performance.now();
      this._hitPulseUntil = Math.max(this._hitPulseUntil, now + (ms | 0));
    }

    _comboPing(level = 0) {
      // level 0..2 -> longer pulse
      const base = 140 + level * 70;
      const now = performance.now();
      this._comboPulseUntil = Math.max(this._comboPulseUntil, now + base);
    }

    _ringBoost(ms) {
      const { r } = this;
      if (!r.avatarRing) return;
      // boost via CSS custom props if available; fallback by adding class
      r.avatarRing.classList.add("ringBoost");
      setTimeout(() => r.avatarRing && r.avatarRing.classList.remove("ringBoost"), Math.max(120, ms | 0));
    }

    _ringDampen(ms) {
      const { r } = this;
      if (!r.avatarRing) return;
      r.avatarRing.classList.add("ringDampen");
      setTimeout(() => r.avatarRing && r.avatarRing.classList.remove("ringDampen"), Math.max(120, ms | 0));
    }

    _linePush(text) {
      // keep it subtle & not spammy: overwrite only if element exists
      if (this.r.dicoLine) this.r.dicoLine.textContent = text;
    }

    // ============================================================
    // Utils
    // ============================================================
    _formatTime(t) {
      const s = Math.max(0, Math.floor(t));
      const mm = String(Math.floor(s / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      return `${mm}:${ss}`;
    }
  }

  NS.UI = UI;
})();
