/* /di/js/engine/audio.js
   AudioManager — PRO (iOS gesture-safe + truthful unlock + stable clock)
   - primeUnlock(): sync, call inside click handler (NO await)
   - unlock(): async, but returns "true only if actually unlocked"
   - playMusic({reset}): does not always force currentTime=0
   - getMusicTime(): currentTime + perf fallback if stalled
*/
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class AudioManager {
    constructor({ music, seTap, seGreat, bgVideo }) {
      this.music = music;
      this.seTap = seTap;
      this.seGreat = seGreat;
      this.bgVideo = bgVideo;

      this._unlocked = false;

      // perf clock fallback
      this._clockBasePerf = 0;
      this._clockBaseMusic = 0;
      this._lastMusicTime = 0;
      this._stallCount = 0;

      // iOS: safe defaults
      if (this.music) {
        this.music.volume = 0.9;
        this.music.preload = this.music.preload || "auto";
        // playsInline は video用だが、環境によっては audioタグでも持つ
        try { this.music.playsInline = true; } catch {}
      }
      if (this.seTap) this.seTap.volume = 0.6;
      if (this.seGreat) this.seGreat.volume = 0.7;

      if (this.bgVideo) {
        try {
          this.bgVideo.muted = true;
          this.bgVideo.playsInline = true;
        } catch {}
      }
    }

    /* ------------------------------------------------------------
       1) SYNC PRIME (call inside user gesture)
       - do NOT await
       - just attempts play() and immediately pauses in then()
    ------------------------------------------------------------ */
    primeUnlock() {
      const prime = (el) => {
        if (!el || typeof el.play !== "function") return false;
        try {
          // Some browsers need muted to allow play; for SFX keep as-is.
          const p = el.play();
          if (p && typeof p.then === "function") {
            p.then(() => {
              try { el.pause(); } catch {}
            }).catch(() => {});
          } else {
            try { el.pause(); } catch {}
          }
          return true;
        } catch {
          return false;
        }
      };

      // prime SFX first (fast), then music, then bg video (muted)
      const ok1 = prime(this.seTap);
      const ok2 = prime(this.seGreat);
      const ok3 = prime(this.music);
      const ok4 = prime(this.bgVideo);

      // don't mark unlocked here (because we didn't verify)
      return ok1 || ok2 || ok3 || ok4;
    }

    /* ------------------------------------------------------------
       2) ASYNC UNLOCK (truthful)
       - returns true only if at least one play actually succeeded
    ------------------------------------------------------------ */
    async unlock() {
      if (this._unlocked) return true;

      const tryEl = async (el, { resetTo0 = false } = {}) => {
        if (!el || typeof el.play !== "function") return false;
        const prev = Number(el.currentTime || 0);

        try {
          if (resetTo0) {
            try { el.currentTime = 0; } catch {}
          }
          const p = el.play();
          if (p && typeof p.then === "function") await p;
          // If play succeeded, pause immediately (we only want "permission")
          try { el.pause(); } catch {}
          // restore time
          try { el.currentTime = prev; } catch {}
          return true;
        } catch {
          // restore time
          try { el.currentTime = prev; } catch {}
          return false;
        }
      };

      // Attempt unlock; count successes
      let ok = false;
      ok = (await tryEl(this.seTap)) || ok;
      ok = (await tryEl(this.seGreat)) || ok;

      // music: reset to start when unlocking
      ok = (await tryEl(this.music, { resetTo0: true })) || ok;

      // bg video is muted; try but don't require
      try { this.bgVideo?.play?.().catch(() => {}); } catch {}

      this._unlocked = ok;
      return ok;
    }

    /* ------------------------------------------------------------
       music controls
    ------------------------------------------------------------ */
    playMusic(opt = {}) {
      const m = this.music;
      if (!m) return;

      const reset = !!opt.reset;
      try {
        if (reset) m.currentTime = 0;
      } catch {}

      const p = m.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      this._syncClockBase();
    }

    stopMusic(opt = {}) {
      const m = this.music;
      if (!m) return;

      try { m.pause(); } catch {}
      if (opt.reset) {
        try { m.currentTime = 0; } catch {}
      }
      // keep clock base for UI (Timing stops anyway)
      this._syncClockBase();
    }

    /* ------------------------------------------------------------
       stable time read
       - prefer currentTime
       - if it stalls repeatedly (iOS), use perf fallback
    ------------------------------------------------------------ */
    getMusicTime() {
      const m = this.music;
      if (!m) return 0;

      const ct = Number(m.currentTime || 0);
      if (!Number.isFinite(ct)) return this._lastMusicTime || 0;

      // detect stall (ct not increasing while should be playing)
      if (ct <= this._lastMusicTime + 1e-6) {
        this._stallCount++;
      } else {
        this._stallCount = 0;
      }

      // if not stalled, accept currentTime and resync base
      if (this._stallCount < 6) {
        this._lastMusicTime = ct;
        this._syncClockBase(ct);
        return ct;
      }

      // fallback: perf-based clock
      const now = performance.now();
      const t = this._clockBaseMusic + (now - this._clockBasePerf) / 1000;

      // keep monotonic
      const out = Math.max(this._lastMusicTime || 0, t);
      this._lastMusicTime = out;
      return out;
    }

    _syncClockBase(forceMusicTime) {
      const m = this.music;
      if (!m) return;
      const ct = Number(forceMusicTime != null ? forceMusicTime : (m.currentTime || 0));
      if (!Number.isFinite(ct)) return;
      this._clockBasePerf = performance.now();
      this._clockBaseMusic = ct;
    }

    /* ------------------------------------------------------------
       SFX
    ------------------------------------------------------------ */
    playTap() {
      const s = this.seTap;
      if (!s) return;
      try {
        s.currentTime = 0;
        const p = s.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch {}
    }

    playGreat() {
      const s = this.seGreat;
      if (!s) return;
      try {
        s.currentTime = 0;
        const p = s.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch {}
    }

    isUnlocked() {
      return !!this._unlocked;
    }
  }

  NS.AudioManager = AudioManager;
})();
