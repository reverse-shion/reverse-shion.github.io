/* /di/js/engine/audio-webaudio.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});
  const DEV =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.search.includes("dev=1") ||
    location.search.includes("nocache=1");

  class AudioManager {
    constructor({ music, seTap, seGreat, bgVideo }) {
      this.music = music || { webaudio: true };
      this.seTap = seTap;
      this.seGreat = seGreat;
      this.bgVideo = bgVideo;

      this._ctx = null;
      this._gain = null;
      this._musicBuf = null;
      this._musicDuration = 0;
      this._source = null;
      this._startAt = 0;
      this._startOffset = 0;
      this._pausedAt = 0;
      this._playing = false;
      this._unlocked = false;
      this._loadingPromise = null;

      if (this.seTap) this.seTap.volume = 0.6;
      if (this.seGreat) this.seGreat.volume = 0.7;
    }

    _debug(...args) {
      if (DEV) console.debug("[DiCo][audio]", ...args);
    }

    _ensureCtx() {
      if (this._ctx) return this._ctx;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error("WebAudio unavailable");
      this._ctx = new Ctx();
      this._gain = this._ctx.createGain();
      this._gain.gain.value = 0.95;
      this._gain.connect(this._ctx.destination);
      return this._ctx;
    }

    async primeUnlock() {
      return this.unlock();
    }

    async unlock() {
      const ctx = this._ensureCtx();
      try {
        if (ctx.state !== "running") await ctx.resume();
      } catch {}
      this._unlocked = ctx.state === "running";
      this._unlockSfx();
      if (this._unlocked) this._debug("audio unlocked");
      return this._unlocked;
    }

    _unlockSfx() {
      const unlockEl = async (el) => {
        if (!el) return;
        const prev = el.currentTime || 0;
        try {
          el.muted = false;
          el.currentTime = 0;
          await el.play();
          el.pause();
          el.currentTime = prev;
        } catch {}
      };
      unlockEl(this.seTap);
      unlockEl(this.seGreat);
      try { this.bgVideo?.play?.().catch(() => {}); } catch {}
    }

    async loadMusicFromUrl(url) {
      const u = String(url || "");
      if (!u) throw new Error("music url missing");
      if (this._loadingPromise) await this._loadingPromise;
      this._loadingPromise = (async () => {
        const res = await fetch(u);
        if (!res.ok) throw new Error(`music fetch failed: ${res.status}`);
        const buf = await res.arrayBuffer();
        await this.loadMusicFromArrayBuffer(buf);
      })();
      try {
        await this._loadingPromise;
      } finally {
        this._loadingPromise = null;
      }
    }

    async loadMusicFromArrayBuffer(arrayBuf) {
      const ctx = this._ensureCtx();
      const copy = arrayBuf.slice(0);
      this._musicBuf = await ctx.decodeAudioData(copy);
      this._musicDuration = Number(this._musicBuf?.duration || 0);
      this.stopMusic({ reset: true });
      this._debug("audio buffer duration", this._musicDuration.toFixed(3));
      this._debug("current song time source", "WebAudio");
    }

    async _ensureMusicBuffer() {
      if (this._musicBuf) return;
      const src = this.music?.src || this.music?.currentSrc;
      if (!src) throw new Error("music src not found");
      await this.loadMusicFromUrl(src);
    }

    _newSource(offsetSec) {
      if (!this._musicBuf) return null;
      const src = this._ctx.createBufferSource();
      src.buffer = this._musicBuf;
      src.connect(this._gain);
      src.onended = () => {
        if (!this._playing) return;
        const t = this.getMusicTime();
        if (t + 0.01 >= this._musicDuration) {
          this._playing = false;
          this._pausedAt = this._musicDuration;
        }
      };
      src.start(0, Math.max(0, offsetSec || 0));
      return src;
    }

    async playMusic(opt) {
      const ctx = this._ensureCtx();
      await this.unlock();
      await this._ensureMusicBuffer();
      if (this._playing && !opt?.reset) return;

      const reset = typeof opt === "object" && !!opt.reset;
      const hasOffset = typeof opt === "object" && Number.isFinite(opt.offset);
      const startOffset = hasOffset ? Number(opt.offset) : (reset ? 0 : this._pausedAt);

      this.stopMusic();
      this._source = this._newSource(startOffset);
      this._startOffset = Math.max(0, startOffset);
      this._startAt = ctx.currentTime;
      this._pausedAt = this._startOffset;
      this._playing = true;
    }

    stopMusic(opt = {}) {
      const reset = !!opt.reset;
      if (this._playing) this._pausedAt = this.getMusicTime();
      this._playing = false;
      if (this._source) {
        try { this._source.stop(0); } catch {}
        try { this._source.disconnect(); } catch {}
        this._source = null;
      }
      if (reset) {
        this._pausedAt = 0;
        this._startOffset = 0;
      }
    }

    getMusicTime() {
      if (!this._ctx) return this._pausedAt || 0;
      if (!this._playing) return this._pausedAt || 0;
      const t = this._ctx.currentTime - this._startAt + this._startOffset;
      if (!Number.isFinite(t)) return this._pausedAt || 0;
      return Math.max(0, Math.min(t, this._musicDuration || t));
    }

    getDuration() {
      return this._musicDuration || 0;
    }

    playTap() {
      if (!this.seTap) return;
      try {
        this.seTap.currentTime = 0;
        this.seTap.play().catch(() => {});
      } catch {}
    }

    playGreat() {
      if (!this.seGreat) return;
      try {
        this.seGreat.currentTime = 0;
        this.seGreat.play().catch(() => {});
      } catch {}
    }
  }

  NS.AudioManager = AudioManager;
})();
