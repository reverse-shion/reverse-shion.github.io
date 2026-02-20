/* /di/js/engine/timing.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Timing {
    constructor({ chart }) {
      this.chart = chart;
      this._running = false;
      this._startWall = 0;
      this._songOffset = chart?.offset || 0;
      this._durationGuess = this._guessDuration(chart);
      this._audio = null;
    }

    _guessDuration(chart) {
      const notes = chart?.notes || [];
      if (!notes.length) return 60;
      const last = notes.reduce((m, n) => Math.max(m, n.t || 0), 0);
      return Math.max(20, last + 4.0);
    }

    start(audio) {
      this._audio = audio;
      this._running = true;

      // start music (audio.currentTime drives)
      audio.playMusic();

      // if you want a chart offset, you can pre-seek:
      // audio.music.currentTime = this._songOffset; (optional)
      // Here we keep chart offset in calculations.
      this._startWall = performance.now();
    }

    stop(audio) {
      this._running = false;
      (audio || this._audio)?.stopMusic();
    }

    isRunning() { return this._running; }

    getSongTime() {
      // Prefer audio element time (most stable for sync)
      const a = this._audio;
      if (a && a.music) {
        const t = a.getMusicTime() - this._songOffset;
        return Math.max(0, t);
      }
      // fallback to wall clock
      if (!this._running) return 0;
      return (performance.now() - this._startWall) / 1000;
    }

    isEnded(songTime) {
      return songTime >= (this._durationGuess);
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
