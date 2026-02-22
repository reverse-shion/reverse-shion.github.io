/* /di/js/engine/audio.js
   AudioManager — PRO FINAL (iOS gesture-safe + truthful unlock + stable clock)
   ✅ primeUnlock(): sync, call inside user gesture (NO await)
   ✅ unlock(): async, returns true only if MUSIC is actually unlocked (clock truth)
   ✅ bgVideo is unlocked properly (no silent best-effort play spam)
   ✅ getMusicTime(): stable clock with perf fallback on stall
*/
(() => {
  "use strict";
  const NS = (window.DI_ENGINE ||= {});

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const nowSec = () => performance.now() / 1000;

  class AudioManager {
    constructor({ music, seTap, seGreat, bgVideo }) {
      this.music = music || null;
      this.seTap = seTap || null;
      this.seGreat = seGreat || null;
      this.bgVideo = bgVideo || null;

      // NOTE: gameplay clock depends on MUSIC; so "unlocked" means music is playable.
      this._unlocked = false;

      // perf clock fallback
      this._clockBasePerf = 0;
      this._clockBaseMusic = 0;
      this._lastMusicTime = 0;
      this._stallCount = 0;

      // iOS safe defaults
      if (this.music) {
        try { this.music.preload = this.music.preload || "auto"; } catch {}
        try { this.music.playsInline = true; } catch {}
        try { this.music.volume = 0.9; } catch {}
      }
      if (this.seTap) {
        try { this.seTap.volume = 0.6; } catch {}
        try { this.seTap.preload = this.seTap.preload || "auto"; } catch {}
      }
      if (this.seGreat) {
        try { this.seGreat.volume = 0.7; } catch {}
        try { this.seGreat.preload = this.seGreat.preload || "auto"; } catch {}
      }

      if (this.bgVideo) {
        try {
          this.bgVideo.muted = true;        // iOS autoplay prerequisite
          this.bgVideo.playsInline = true;
          this.bgVideo.loop = true;
          // do not force preload here; HTML decides
        } catch {}
      }

      this._installVideoDebug();
    }

    /* ------------------------------------------------------------
       Debug hooks (lightweight)
    ------------------------------------------------------------ */
    _installVideoDebug() {
      const v = this.bgVideo;
      if (!v) return;

      // Keep it minimal; these logs solve "silent stop" instantly.
      const log = (e) => {
        // NOTE: iOS sometimes blocks console, but this helps on desktop too.
        console.debug(
          "[DiCo][bgVideo]",
          e,
          "readyState=",
          v.readyState,
          "paused=",
          v.paused,
          "ct=",
          Number(v.currentTime || 0).toFixed(2)
        );
      };

      try {
        v.addEventListener("error", () => console.warn("[DiCo][bgVideo] error", v.error));
        v.addEventListener("stalled", () => log("stalled"));
        v.addEventListener("waiting", () => log("waiting"));
        v.addEventListener("playing", () => log("playing"));
        v.addEventListener("pause", () => log("pause"));
      } catch {}
    }

    /* ------------------------------------------------------------
       1) SYNC PRIME (call inside user gesture)
       - do NOT await
       - attempts play() and immediately pauses in then()
       - important: do NOT swallow reason completely; warn once
    ------------------------------------------------------------ */
    primeUnlock() {
      const prime = (el, tag) => {
        if (!el || typeof el.play !== "function") return false;
        try {
          const p = el.play();
          if (p && typeof p.then === "function") {
            p.then(() => {
              try { el.pause(); } catch {}
            }).catch((e) => {
              // NotAllowedError is common on iOS when not in gesture
              console.warn(`[DiCo][Audio] prime denied (${tag})`, e?.name || e);
            });
          } else {
            try { el.pause(); } catch {}
          }
          return true;
        } catch (e) {
          console.warn(`[DiCo][Audio] prime exception (${tag})`, e?.name || e);
          return false;
        }
      };

      // Keep this order: SFX -> MUSIC -> VIDEO
      const ok1 = prime(this.seTap, "seTap");
      const ok2 = prime(this.seGreat, "seGreat");
      const ok3 = prime(this.music, "music");
      const ok4 = prime(this.bgVideo, "bgVideo");
      return ok1 || ok2 || ok3 || ok4;
    }

    /* ------------------------------------------------------------
       2) ASYNC UNLOCK (truthful)
       - returns true only if MUSIC actually unlocked (game clock truth)
       - bgVideo is also unlocked properly, but does not define _unlocked
    ------------------------------------------------------------ */
    async unlock() {
      if (this._unlocked) return true;

      const tryEl = async (el, tag, { resetTo0 = false } = {}) => {
        if (!el || typeof el.play !== "function") return false;

        const prev = Number(el.currentTime || 0);
        try {
          if (resetTo0) {
            try { el.currentTime = 0; } catch {}
          }

          const p = el.play();
          if (p && typeof p.then === "function") await p;

          // Immediately pause + restore time (unlock pattern)
          try { el.pause(); } catch {}
          try { el.currentTime = prev; } catch {}
          return true;
        } catch (e) {
          console.warn(`[DiCo][Audio] unlock denied (${tag})`, e?.name || e);
          try { el.currentTime = prev; } catch {}
          return false;
        }
      };

      // 1) Unlock MUSIC first (clock source)
      const musicOK = await tryEl(this.music, "music", { resetTo0: true });

      // 2) SFX can be best-effort; does not affect clock truth
      const se1 = await tryEl(this.seTap, "seTap");
      const se2 = await tryEl(this.seGreat, "seGreat");

      // 3) Unlock bgVideo properly (no silent play spam)
      //    IMPORTANT: keep it muted=true
      let videoOK = false;
      if (this.bgVideo) {
        try { this.bgVideo.muted = true; } catch {}
        try { this.bgVideo.playsInline = true; } catch {}
        videoOK = await tryEl(this.bgVideo, "bgVideo", { resetTo0: true });
      }

      // "unlocked" means we can drive gameplay clock reliably.
      this._unlocked = !!musicOK;

      console.debug("[DiCo][Audio] unlock result", {
        musicOK,
        seTapOK: se1,
        seGreatOK: se2,
        videoOK,
        unlocked: this._unlocked,
      });

      return this._unlocked;
    }

    /* ------------------------------------------------------------
       music controls (API compatible)
    ------------------------------------------------------------ */
    playMusic(opt = {}) {
      const m = this.music;
      if (!m) return;

      const reset = !!opt.reset;
      try { if (reset) m.currentTime = 0; } catch {}

      try {
        const p = m.play();
        if (p && typeof p.catch === "function") {
          p.catch((e) => console.warn("[DiCo][Audio] music play denied", e?.name || e));
        }
      } catch (e) {
        console.warn("[DiCo][Audio] music play exception", e?.name || e);
      }

      // reset clock bases immediately (even if play is pending)
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
       stable time read (clock truth)
    ------------------------------------------------------------ */
    getMusicTime() {
      const m = this.music;
      if (!m) return 0;

      const ct = Number(m.currentTime || 0);
      if (!Number.isFinite(ct)) return this._lastMusicTime || 0;

      // Detect stall: same currentTime repeatedly
      if (ct <= this._lastMusicTime + 1e-6) this._stallCount++;
      else this._stallCount = 0;

      // If not stalled, use audio currentTime
      if (this._stallCount < 6) {
        this._lastMusicTime = ct;
        this._syncClockBase(ct);
        return ct;
      }

      // Stall fallback: perf-based extrapolation
      const t = this._clockBaseMusic + (performance.now() - this._clockBasePerf) / 1000;
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
       SFX (API compatible)
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
