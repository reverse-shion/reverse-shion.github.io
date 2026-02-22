/* /di/js/engine/audio.js
   AudioManager — PRO (iOS gesture-safe + truthful unlock + stable clock)
   - primeUnlock(): sync, call inside click handler (NO await)
   - unlock(): async, but returns true only if actually unlocked
   - playMusic({reset}): optional reset
   - stopMusic({reset}): default reset=true
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
       - attempts play() and immediately pauses in then()
    ------------------------------------------------------------ */
    primeUnlock() {
      const prime = (el) => {
        if (!el || typeof el.play !== "function") return false;
        try {
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

      const ok1 = prime(this.seTap);
      const ok2 = prime(this.seGreat);
      const ok3 = prime(this.music);
      const ok4 = prime(this.bgVideo);

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

          try { el.pause(); } catch {}
          try { el.currentTime = prev; } catch {}
          return true;
        } catch {
          try { el.currentTime = prev; } catch {}
          return false;
        }
      };

      let ok = false;
      ok = (await tryEl(this.seTap)) || ok;
      ok = (await tryEl(this.seGreat)) || ok;
      ok = (await tryEl(this.music, { resetTo0: true })) || ok;

      // bg video (muted) best-effort
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

      const reset = opt.reset !== false; // ✅ default true
      try { m.pause(); } catch {}
      if (reset) {
        try { m.currentTime = 0; } catch {}
      }
      this._syncClockBase();
    }

    /* ------------------------------------------------------------
       stable time read
    ------------------------------------------------------------ */
    getMusicTime() {
      const m = this.music;
      if (!m) return 0;

      const ct = Number(m.currentTime || 0);
      if (!Number.isFinite(ct)) return this._lastMusicTime || 0;

      if (ct <= this._lastMusicTime + 1e-6) this._stallCount++;
      else this._stallCount = 0;

      if (this._stallCount < 6) {
        this._lastMusicTime = ct;
        this._syncClockBase(ct);
        return ct;
      }

      const now = performance.now();
      const t = this._clockBaseMusic + (now - this._clockBasePerf) / 1000;

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

    isUnlocked() { return !!this._unlocked; }
  }

  NS.AudioManager = AudioManager;
})();
