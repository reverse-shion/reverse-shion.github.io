/* /di/js/engine/timing.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Timing {
    constructor({ chart }) {
      this.chart = chart;

      this._running = false;

      // chart offset (seconds)
      this._songOffset = Number(chart?.offset || 0);

      this._durationGuess = this._guessDuration(chart);

      this._audio = null;

      // pause/resume support
      this._paused = false;
      this._lastSongTime = 0; // keep last computed time for UI
    }

    _guessDuration(chart) {
      const notes = chart?.notes || [];
      if (!notes.length) return 60;
      const last = notes.reduce((m, n) => Math.max(m, Number(n.t || 0)), 0);
      return Math.max(20, last + 4.0);
    }

    // --- Core helpers ---
    _ensureAudio(audio) {
      this._audio = audio || this._audio;
      return this._audio;
    }

    _calcSongTimeFromAudio() {
      const a = this._audio;
      if (a && a.music) {
        const raw = a.getMusicTime(); // seconds
        const t = raw - this._songOffset;
        return Math.max(0, t);
      }
      return this._lastSongTime || 0;
    }

    // --- API ---
    /**
     * Start gameplay timing.
     * @param {AudioManager} audio
     * @param {{ reset?: boolean }} opt
     */
    start(audio, opt = {}) {
      const a = this._ensureAudio(audio);
      const reset = !!opt.reset;

      this._paused = false;
      this._running = true;

      // ✅ reset=true の時は必ず曲を先頭へ
      if (a && a.music && reset) {
        const isMedia = typeof HTMLMediaElement !== "undefined" && a.music instanceof HTMLMediaElement;
        if (isMedia) {
          try {
            a.music.pause();
            a.music.currentTime = 0;
          } catch {}
        } else {
          try {
            a.stopMusic?.({ reset: true });
          } catch {}
        }
      }

      // start/resume music
      a?.playMusic?.();

      // refresh cached time
      this._lastSongTime = this._calcSongTimeFromAudio();
    }

    /**
     * Pause (STOP) gameplay timing (keeps position).
     */
    pause(audio) {
      const a = this._ensureAudio(audio);
      this._paused = true;
      this._running = false;

      // keep last time snapshot
      this._lastSongTime = this._calcSongTimeFromAudio();

      a?.stopMusic?.(); // pause music
    }

    /**
     * Resume from pause without resetting.
     */
    resume(audio) {
      const a = this._ensureAudio(audio);
      this._paused = false;
      this._running = true;

      a?.playMusic?.();
      this._lastSongTime = this._calcSongTimeFromAudio();
    }

    /**
     * Stop completely (used at result/end). Keeps last time.
     */
    stop(audio) {
      const a = this._ensureAudio(audio);
      this._running = false;
      this._paused = false;

      this._lastSongTime = this._calcSongTimeFromAudio();

      a?.stopMusic?.();
    }

    /**
     * Convenience for restart.
     */
    restart(audio) {
      this.start(audio, { reset: true });
    }

    isRunning() { return this._running; }
    isPaused() { return this._paused; }

    getSongTime() {
      // If running, follow audio clock.
      if (this._running) {
        const t = this._calcSongTimeFromAudio();
        this._lastSongTime = t;
        return t;
      }

      // If paused/stopped, return last known time (not 0)
      return this._lastSongTime || 0;
    }

    isEnded(songTime) {
      return songTime >= this._durationGuess;
    }

    formatTime(songTime) {
      const s = Math.max(0, Math.floor(songTime));
      const mm = String(Math.floor(s / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      return `${mm}:${ss}`;
    }
  }

  NS.Timing = Timing;
})();
