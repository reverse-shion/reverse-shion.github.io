/* /di/js/engine/audio.js
   AudioManager — PRO FIX (iOS-safe + truthful clock)
   ✅ perf fallback runs ONLY when music is truly playing
   ✅ if play() fails, clock does NOT advance (prevents silent-run)
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

      // clock base
      this._clockBasePerf = 0;
      this._clockBaseMusic = 0;
      this._lastMusicTime = 0;
      this._stallCount = 0;

      // ✅ NEW: truth flags
      this._musicPlaying = false;   // “play() resolved and not paused”
      this._musicPlayFailed = false;

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

    // call inside gesture, no await
    primeUnlock() {
      const prime = (el) => {
        if (!el || typeof el.play !== "function") return false;
        try {
          const p = el.play();
          if (p && typeof p.then === "function") {
            p.then(() => { try { el.pause(); } catch {} }).catch(() => {});
          } else {
            try { el.pause(); } catch {}
          }
          return true;
        } catch {
          return false;
        }
      };
      return (
        prime(this.seTap) ||
        prime(this.seGreat) ||
        prime(this.music) ||
        prime(this.bgVideo)
      );
    }

    async unlock() {
      if (this._unlocked) return true;

      const tryEl = async (el, { resetTo0 = false } = {}) => {
        if (!el || typeof el.play !== "function") return false;
        const prev = Number(el.currentTime || 0);
        try {
          if (resetTo0) { try { el.currentTime = 0; } catch {} }
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

      // bg video best-effort
      try { this.bgVideo?.play?.().catch(() => {}); } catch {}

      this._unlocked = ok;
      return ok;
    }

    // ✅ returns a promise-like result (but can be ignored by caller)
    playMusic(opt = {}) {
      const m = this.music;
      if (!m) return;

      const reset = !!opt.reset;

      this._musicPlayFailed = false;
      this._musicPlaying = false;
      this._stallCount = 0;

      try { if (reset) m.currentTime = 0; } catch {}

      let p;
      try {
        p = m.play();
      } catch (e) {
        this._musicPlayFailed = true;
        this._musicPlaying = false;
        console.warn("[Audio] music.play threw", e);
        return;
      }

      if (p && typeof p.then === "function") {
        p.then(() => {
          // play promise resolved
          this._musicPlaying = !m.paused;
          this._syncClockBase();
        }).catch((e) => {
          this._musicPlayFailed = true;
          this._musicPlaying = false;
          console.warn("[Audio] music.play rejected", e);
        });
      } else {
        // older behavior
        this._musicPlaying = !m.paused;
        this._syncClockBase();
      }
    }

    stopMusic(opt = {}) {
      const m = this.music;
      if (!m) return;

      const reset = opt.reset !== false; // default true
      try { m.pause(); } catch {}
      if (reset) { try { m.currentTime = 0; } catch {} }

      this._musicPlaying = false;
      this._musicPlayFailed = false;
      this._stallCount = 0;
      this._syncClockBase();
    }

    // ✅ key fix: NO perf-advance unless music truly playing
    getMusicTime() {
      const m = this.music;
      if (!m) return 0;

      // If not playing, do not advance.
      if (!this._musicPlaying || m.paused) {
        const ct0 = Number(m.currentTime || 0);
        if (Number.isFinite(ct0)) this._lastMusicTime = ct0;
        return this._lastMusicTime || 0;
      }

      const ct = Number(m.currentTime || 0);
      if (!Number.isFinite(ct)) return this._lastMusicTime || 0;

      if (ct <= this._lastMusicTime + 1e-6) this._stallCount++;
      else this._stallCount = 0;

      // Allow small stalls
      if (this._stallCount < 6) {
        this._lastMusicTime = ct;
        this._syncClockBase(ct);
        return ct;
      }

      // Perf fallback ONLY while playing
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
    isMusicPlaying() { return !!this._musicPlaying && !this.music?.paused; }
    didMusicFail() { return !!this._musicPlayFailed; }
  }

  NS.AudioManager = AudioManager;
})();
