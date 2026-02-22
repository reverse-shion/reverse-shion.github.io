/* /di/js/engine/timing.js
   Timing — PRO (single clock = AudioManager.getMusicTime)
   - NEVER reads a.music.currentTime directly
   - start/restart/stop only call AudioManager methods
*/
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Timing {
    constructor({ chart }) {
      this.chart = chart;
      this._running = false;
      this._paused = false;

      this._songOffset = Number(chart?.offset || 0);
      this._durationGuess = this._guessDuration(chart);

      /** @type {any} AudioManager */
      this._audio = null;

      this._lastSongTime = 0;
    }

    _guessDuration(chart) {
      const notes = chart?.notes || [];
      if (!notes.length) return 60;
      const last = notes.reduce((m, n) => Math.max(m, Number(n.t || 0)), 0);
      return Math.max(20, last + 4.0);
    }

    _ensureAudio(audio) {
      this._audio = audio || this._audio;
      return this._audio;
    }

    _calcSongTimeFromAudio() {
      const a = this._audio;
      if (a && typeof a.getMusicTime === "function") {
        const raw = Number(a.getMusicTime() || 0); // seconds
        const t = raw - this._songOffset;
        return Math.max(0, t);
      }
      return this._lastSongTime || 0;
    }

    start(audio, opt = {}) {
      const a = this._ensureAudio(audio);
      const reset = !!opt.reset;

      this._paused = false;
      this._running = true;

      // ✅ audio is the only controller
      a?.playMusic?.({ reset });

      this._lastSongTime = this._calcSongTimeFromAudio();
    }

    pause(audio) {
      const a = this._ensureAudio(audio);
      this._paused = true;
      this._running = false;

      this._lastSongTime = this._calcSongTimeFromAudio();
      // pause but keep position (reset=false)
      a?.stopMusic?.({ reset: false });
    }

    resume(audio) {
      const a = this._ensureAudio(audio);
      this._paused = false;
      this._running = true;

      // resume without reset
      a?.playMusic?.({ reset: false });
      this._lastSongTime = this._calcSongTimeFromAudio();
    }

    stop(audio) {
      const a = this._ensureAudio(audio);
      this._running = false;
      this._paused = false;

      this._lastSongTime = this._calcSongTimeFromAudio();
      // default reset=true (AudioManager side)
      a?.stopMusic?.({ reset: true });
    }

    restart(audio) {
      this.start(audio, { reset: true });
    }

    isRunning() { return this._running; }
    isPaused() { return this._paused; }

    getSongTime() {
      if (this._running) {
        const t = this._calcSongTimeFromAudio();
        this._lastSongTime = t;
        return t;
      }
      return this._lastSongTime || 0;
    }

    isEnded(songTime) {
      return songTime >= this._durationGuess;
    }
  }

  NS.Timing = Timing;
})();
