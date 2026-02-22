/* /di/js/engine/audio.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class AudioManager {
    constructor({ music, seTap, seGreat, bgVideo }) {
      this.music = music;
      this.seTap = seTap;
      this.seGreat = seGreat;
      this.bgVideo = bgVideo;

      this._unlocked = false;
      this._startAt = 0;

      // iOS: keep volume moderate
      if (this.music) this.music.volume = 0.9;
      if (this.seTap) this.seTap.volume = 0.6;
      if (this.seGreat) this.seGreat.volume = 0.7;
    }

    async unlock() {
      if (this._unlocked) return true;

      // play/pause tiny to unlock audio
      const tryEl = async (el) => {
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

      await tryEl(this.seTap);
      await tryEl(this.seGreat);

      // music unlock
      if (this.music) {
        try {
          this.music.currentTime = 0;
          await this.music.play();
          this.music.pause();
          this.music.currentTime = 0;
        } catch {}
      }

      // bg video is muted; can autoplay
      try { this.bgVideo?.play?.().catch(() => {}); } catch {}

      this._unlocked = true;
      return true;
    }

    playMusic() {
      if (!this.music) return;
      this.music.currentTime = 0;
      this.music.play().catch(() => {});
    }

    stopMusic() {
      if (!this.music) return;
      try { this.music.pause(); } catch {}
      try { this.music.currentTime = 0; } catch {}
    }

    getMusicTime() {
      return this.music ? (this.music.currentTime || 0) : 0;
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
