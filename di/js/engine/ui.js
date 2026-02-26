/* /di/js/engine/ui.js
   UI — PRO FINAL (Addictive Face Reactions) v2.1-LIGHT
   ------------------------------------------------------------
   目的（今回の修正点を“確実に”満たす）
   ✅ Fix1: リングの状態(ゲージ段階)が「タップ1回」で戻る問題を根絶
        - className 置き換え禁止（状態クラスを消さない）
        - “状態(持続)” と “瞬間FX(短時間)” を完全分離
   ✅ Fix2: 共鳴ゲージ(Resonance)段階はヒステリシスで“維持”できる
        - しきい値を「上がる/下がる」で分ける（フリッカ防止）
   ✅ Fix3: dicoFace の transform 上書き禁止（translate 崩れない）
        - パルスは CSS変数 --pulseScale のみ
   ✅ Fix4: 軽量（DOM書き込み最小）
        - 値が変わった時だけ textContent / style を更新
        - 短い timer は「1箇所につき1本」だけ保持して再利用
        - interval無し / 無駄なクラス付け替え無し
*/
(() => {
  "use strict";
  const NS = (window.DI_ENGINE ||= {});

  class UI {
    constructor(refs) {
      this.r = refs || {};

      // -----------------------
      // caches (avoid DOM churn)
      // -----------------------
      this._last = {
        time: "",
        score6: "",
        score: -1,
        combo: -1,
        maxCombo: -1,
        res: -1,
        resFill: "",
        state: "",
      };

      // judge fade
      this._lastJudgeAt = 0;
      this._judgeHideT = 0;

      // ring
      this._ringSpin = 0;
      this._ringFxT = 0;
      this._ringFxType = ""; // "boost" | "dampen" | "tap"

      // ring state hysteresis
      this._ringState = "low"; // low|mid|high|max

      // face system
      this._face = 1;
      this._baseFace = 1;
      this._overlayFace = 0;
      this._overlayUntil = 0;
      this._faceLockUntil = 0;
      this._swapT = 0;

      // streaks
      this._perfectStreak = 0;
      this._greatStreak = 0;
      this._missStreak = 0;

      // milestones
      this._milestone10 = false;
      this._milestone30 = false;
      this._milestone50 = false;
      this._milestone100 = false;
      this._lastMilestoneAt = 0;

      // throttles
      this._lineUntil = 0;
      this._lastJudgeOverlayAt = 0;

      // pulse
      this._pulseUntil = 0;

      // initial
      this.hideResult();
      this._preloadFaces();

      // safety: locate judge nodes if container exists
      if (this.r.judge && !this.r.judgeMain) this.r.judgeMain = this.r.judge.querySelector?.("#judgeMain,.judgeMain") || this.r.judgeMain;
      if (this.r.judge && !this.r.judgeSub)  this.r.judgeSub  = this.r.judge.querySelector?.("#judgeSub,.judgeSub")  || this.r.judgeSub;
    }

    // ============================================================
    // Main loop update (called every frame by engine)
    // ============================================================
    update({ t, score, combo, maxCombo, resonance, state }) {
      const r = this.r;

      const st = String(state || "idle");
      const isPlaying = st === "playing";

      // --- time ---
      const mmss = this._formatTime(t);
      if (mmss !== this._last.time) {
        this._last.time = mmss;
        if (r.time) r.time.textContent = mmss;
        if (r.timeDup) r.timeDup.textContent = mmss;
      }

      // --- score ---
      const sInt = Math.floor(score || 0);
      if (sInt !== this._last.score) {
        this._last.score = sInt;
        const s6 = String(sInt).padStart(6, "0");
        if (s6 !== this._last.score6) {
          this._last.score6 = s6;
          if (r.sideScore) r.sideScore.textContent = s6;
        }
        if (r.score) r.score.textContent = String(sInt);
      }

      // --- combo ---
      const cInt = Number(combo) || 0;
      if (cInt !== this._last.combo) {
        this._last.combo = cInt;
        if (r.sideCombo) r.sideCombo.textContent = String(cInt);
        if (r.combo) r.combo.textContent = String(cInt);
      }

      // --- max combo ---
      const mcInt = Number(maxCombo) || 0;
      if (mcInt !== this._last.maxCombo) {
        this._last.maxCombo = mcInt;
        if (r.sideMaxCombo) r.sideMaxCombo.textContent = String(mcInt);
        if (r.maxCombo) r.maxCombo.textContent = String(mcInt);
      }

      // --- resonance (0..100) ---
      const res = this._clamp100(resonance);
      if (res !== this._last.res) {
        this._last.res = res;
        if (r.resValue) r.resValue.textContent = String(res);
        const w = `${res}%`;
        if (w !== this._last.resFill) {
          this._last.resFill = w;
          if (r.resFill) r.resFill.style.width = w;
        }
      }

      // --- ring: state classes (persistent) ---
      // IMPORTANT: state class must NOT be removed by tap FX.
      this._applyRingState(res, st);

      // --- ring: rotation (visual only) ---
      // NOTE: rotate is safe because ring is separate element; does not affect face translate.
      if (r.avatarRing) {
        // spinSpeed: 0 when idle/result, increase with resonance while playing
        const spinSpeed = isPlaying ? (0.55 + res * 0.016) : 0;
        if (spinSpeed > 0) {
          this._ringSpin = (this._ringSpin + spinSpeed) % 360;
          // write only if changed meaningfully (avoid string churn)
          r.avatarRing.style.setProperty("--ui-rot", `${this._ringSpin}deg`);
        } else if (this._ringSpin !== 0) {
          // keep last angle (no need to reset); but if you want freeze at 0, uncomment:
          // this._ringSpin = 0; r.avatarRing.style.transform = "rotate(0deg)";
        }
      }

      // --- detectors (combo/score/res milestones) ---
      this._handleComboEvents(cInt, st);
      this._handleScoreEvents(sInt, st);
      this._handleResonanceEvents(res, st);

      // --- face system ---
      this._updateFaceSystem({ resonance: res, state: st });
    }

    // ============================================================
    // Judge hook (tap result)
    // ============================================================
    onJudge(res) {
      const r = this.r;
      if (!res || res.name === "EMPTY") return;

      // ---------- judge label ----------
      if (r.judge && r.judgeMain && r.judgeSub) {
        try { r.judge.setAttribute("aria-hidden", "false"); } catch {}

        const name = res.name;
        r.judgeMain.textContent =
          name === "PERFECT" ? "PERFECT" :
          name === "GREAT"   ? "GREAT"   :
          name === "GOOD"    ? "GOOD"    : "MISS";

        r.judgeSub.textContent = (name === "MISS") ? "DESYNC" : "SYNC";

        const now = performance.now();
        this._lastJudgeAt = now;
        clearTimeout(this._judgeHideT);
        this._judgeHideT = setTimeout(() => {
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

      // ---------- tap FX (DO NOT TOUCH ring state classes) ----------
      this._ringTapFX(120);

      // ---------- face reaction (throttle) ----------
      const now = performance.now();
      if (now - this._lastJudgeOverlayAt < 70) return;
      this._lastJudgeOverlayAt = now;

      const name = res.name;

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

        this._faceOverlay(5, this._missStreak >= 2 ? 560 : 380);
        this._ringDampen(this._missStreak >= 2 ? 520 : 260);
        this._linePush(
          this._missStreak >= 2 ? "だいじょうぶ。呼吸、戻そ。" : "だいじょうぶ、次で取り戻そ。",
          this._missStreak >= 2 ? 980 : 780
        );
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

      const res = this._clamp100(resonance);
      if (r.aruValue) r.aruValue.textContent = `${res}%`;

      if (r.aruProg) {
        const C = 276.46; // circumference
        const off = C * (1 - res / 100);
        r.aruProg.style.strokeDashoffset = String(off);
      }

      // reward face
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
    // Combo/Score/Res detectors
    // ============================================================
    _handleComboEvents(combo, state) {
      if (state !== "playing") return;

      const now = performance.now();

      // combo break (soft reset)
      if (combo === 0 && this._last.combo >= 12) {
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

      const last = this._last.score;
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
    // Face system (Base + Overlay)
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
      if (this._overlayFace && now >= this._overlayUntil) this._overlayFace = 0;

      // base face
      this._baseFace = this._computeBaseFace({ resonance, state });

      // compose
      const target = this._overlayFace || this._baseFace;

      // lock (avoid flicker)
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

      // base is stable expression tied to resonance
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

      // avoid redundant set
      try {
        if (img.src && img.src.endsWith(next)) return;
      } catch {}

      img.src = next;

      // micro swap class
      try { img.classList.add("isSwap"); } catch {}
      clearTimeout(this._swapT);
      this._swapT = setTimeout(() => {
        try { img.classList.remove("isSwap"); } catch {}
      }, 120);
    }

    _faceOverlay(face, ms) {
      const now = performance.now();
      this._overlayFace = face;
      this._overlayUntil = now + Math.max(60, ms | 0);
      // allow immediate swap
      this._faceLockUntil = now;
    }

    // ============================================================
    // Pulse (NO transform overwrite)
    // ============================================================
    _pulse(ms) {
      const now = performance.now();
      this._pulseUntil = Math.max(this._pulseUntil, now + (ms | 0));
    }

    _applyPulse(img, now) {
      const active = now < this._pulseUntil;
      if (active) {
        img.style.setProperty("--pulseScale", "1.02");
        img.style.filter = "brightness(1.05) saturate(1.03)";
      } else {
        // remove only if present
        if (img.style.getPropertyValue("--pulseScale")) img.style.removeProperty("--pulseScale");
        if (img.style.filter) img.style.filter = "";
      }
    }

    // ============================================================
    // Ring: persistent state + transient FX (critical fix)
    // ============================================================
    _applyRingState(res, state) {
      const ring = this.r.avatarRing;
      if (!ring) return;

      // We only drive ring state while playing.
      // (Idle/resultは見た目固定でも良いが、ここでは最後の状態を保持する)
      if (state !== "playing") return;

      const prev = this._ringState;

      // hysteresis thresholds (UP / DOWN)
      // - 入る時は高め、出る時は少し低め → “一定以上なら維持”
      let next = prev;

      // UP rules
      if (res >= 90) next = "max";
      else if (res >= 60) next = "high";
      else if (res >= 30) next = "mid";
      else next = "low";

      // DOWN keep rules
      if (prev === "max"  && res >= 82) next = "max";
      if (prev === "high" && res >= 52) next = "high";
      if (prev === "mid"  && res >= 22) next = "mid";

      if (next === prev) return;

      // Update only "state classes" (never touch fx classes)
      // IMPORTANT: NO className overwrite.
      ring.classList.remove("is-low", "is-mid", "is-high", "is-max");
      ring.classList.add(`is-${next}`);
      this._ringState = next;
    }

    _ringTapFX(ms) {
      const ring = this.r.avatarRing;
      if (!ring) return;

      // transient class only
      ring.classList.add("fx-hit");

      clearTimeout(this._ringFxT);
      this._ringFxType = "tap";
      this._ringFxT = setTimeout(() => {
        // remove only transient class (keep is-*)
        ring.classList.remove("fx-hit");
        this._ringFxType = "";
      }, Math.max(60, ms | 0));
    }

    _ringBoost(ms) {
      const ring = this.r.avatarRing;
      if (!ring) return;

      ring.classList.add("ringBoost");
      clearTimeout(this._ringFxT);
      this._ringFxType = "boost";
      this._ringFxT = setTimeout(() => {
        ring.classList.remove("ringBoost");
        this._ringFxType = "";
      }, Math.max(120, ms | 0));
    }

    _ringDampen(ms) {
      const ring = this.r.avatarRing;
      if (!ring) return;

      ring.classList.add("ringDampen");
      clearTimeout(this._ringFxT);
      this._ringFxType = "dampen";
      this._ringFxT = setTimeout(() => {
        ring.classList.remove("ringDampen");
        this._ringFxType = "";
      }, Math.max(120, ms | 0));
    }

    // ============================================================
    // Line push
    // ============================================================
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
    _clamp100(v) {
      const n = Number(v) || 0;
      return Math.max(0, Math.min(100, Math.round(n)));
    }

    _formatTime(t) {
      const s = Math.max(0, Math.floor(Number(t) || 0));
      const mm = String(Math.floor(s / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      return `${mm}:${ss}`;
    }
  }

  NS.UI = UI;
})();
