/* /di/js/engine/timing.js
   Timing — single gameplay clock sourced from AudioManager.getMusicTime()
*/
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Timing {
    constructor({ chart }) {
      this.chart = chart || {};
      this._audio = null;
      this._running = false;
      this._paused = false;
      this._songOffset = Number(this.chart.offset || 0);
      this._lastSongTime = 0;
      this._tailPadding = 1.5;
      this._endTime = this._computeEndTime();
    }

    _computeEndTime() {
      const notes = this.chart?.notes || [];
      let last = 0;
      for (const n of notes) {
        const t = Number(n?.t || 0);
        if (Number.isFinite(t) && t > last) last = t;
      }
      return last + this._tailPadding;
    }

    _ensureAudio(audio) {
      if (audio) this._audio = audio;
      return this._audio;
    }

    _readSongTimeFromAudio() {
      const a = this._audio;
      if (!a || typeof a.getMusicTime !== "function") {
        return this._lastSongTime || 0;
      }

      const musicTime = Number(a.getMusicTime() || 0);
      const t = musicTime - this._songOffset;
      if (!Number.isFinite(t)) return this._lastSongTime || 0;
      return Math.max(0, t);
    }

    start(audio, { reset = false } = {}) {
      const a = this._ensureAudio(audio);
      this._running = true;
      this._paused = false;

      if (reset) this._lastSongTime = 0;
      a?.playMusic?.({ reset: !!reset });

      this._lastSongTime = this._readSongTimeFromAudio();
      return this._lastSongTime;
    }

    restart(audio) {
      const a = this._ensureAudio(audio);
      this._running = false;
      this._paused = false;
      this._lastSongTime = 0;

      // hard reset both audio and internal state
      a?.stopMusic?.({ reset: true });
      return this.start(a, { reset: true });
    }

    stop(audio) {
      const a = this._ensureAudio(audio);
      this._lastSongTime = this._readSongTimeFromAudio();
      this._running = false;
      this._paused = false;
      a?.stopMusic?.({ reset: true });
      return this._lastSongTime;
    }

    isRunning() {
      return this._running;
    }

    isPaused() {
      return this._paused;
    }

    getSongTime() {
      if (!this._running) return this._lastSongTime || 0;
      this._lastSongTime = this._readSongTimeFromAudio();
      return this._lastSongTime;
    }

    isEnded(songTime) {
      return Number(songTime) >= this._endTime;
    }
  }

  NS.Timing = Timing;
})();
