/* /di/js/engine/timing.js
   Timing — PRO (Hybrid Clock for iOS / buffering safe)
   ------------------------------------------------------------
   Problem solved:
   - After restart, music may play but audio.currentTime can stay 0 (or stall)
     for a short while (iOS / buffering / autoplay quirks).
   - If timing relies ONLY on currentTime, t stays 0 -> notes appear frozen.
   Fix:
   - Use AUDIO clock when it moves
   - Fallback to PERF clock while audio clock is stalled right after start/resume
*/

(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Timing {
    constructor({ chart }) {
      this.chart = chart;

      this._running = false;
      this._paused = false;

      // chart offset (seconds)
      this._songOffset = Number(chart?.offset || 0);
      this._durationGuess = this._guessDuration(chart);

      this._audio = null;

      // last known song time (seconds)
      this._lastSongTime = 0;

      // --- hybrid clock state ---
      this._perfStartMs = 0;     // performance.now at start/resume
      this._baseSongTime = 0;    // songTime at perfStartMs (seconds)
      this._lastAudioRaw = -1;   // last raw audio time (seconds)
      this._stallFrames = 0;     // how long audio clock is stalled
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

    _getAudioRaw() {
      const a = this._audio;
      if (a && a.music) {
        const raw = a.getMusicTime(); // seconds
        return Number.isFinite(raw) ? raw : 0;
      }
      return 0;
    }

    _toSongTimeFromRaw(raw) {
      const t = raw - this._songOffset;
      return Math.max(0, t);
    }

    _markPerfBase(songTime) {
      this._perfStartMs = performance.now();
      this._baseSongTime = songTime;
      this._stallFrames = 0;
    }

    // --- API ---
    start(audio, opt = {}) {
      const a = this._ensureAudio(audio);
      const reset = !!opt.reset;

      this._paused = false;
      this._running = true;

      // reset request: seek to start (best effort)
      if (a && a.music && reset) {
        try {
          a.music.pause();
          a.music.currentTime = 0;
        } catch {}
      }

      // start music (best effort, may still stall currentTime briefly)
      a?.playMusic?.({ reset });

      // establish base times
      const raw = this._getAudioRaw();
      this._lastAudioRaw = raw;

      const songT = this._toSongTimeFromRaw(raw);
      this._lastSongTime = songT;
      this._markPerfBase(songT);
    }

    pause(audio) {
      const a = this._ensureAudio(audio);
      this._paused = true;
      this._running = false;

      // snapshot current time
      const raw = this._getAudioRaw();
      this._lastAudioRaw = raw;
      this._lastSongTime = this._toSongTimeFromRaw(raw);

      a?.stopMusic?.({ reset: false }); // pause music (keep pos)
    }

    resume(audio) {
      const a = this._ensureAudio(audio);
      this._paused = false;
      this._running = true;

      a?.playMusic?.({ reset: false });

      const raw = this._getAudioRaw();
      this._lastAudioRaw = raw;

      const songT = this._toSongTimeFromRaw(raw);
      this._lastSongTime = songT;
      this._markPerfBase(songT);
    }

    stop(audio) {
      const a = this._ensureAudio(audio);
      this._running = false;
      this._paused = false;

      const raw = this._getAudioRaw();
      this._lastAudioRaw = raw;
      this._lastSongTime = this._toSongTimeFromRaw(raw);

      a?.stopMusic?.({ reset: true }); // stop + reset to 0
    }

    restart(audio) {
      this.start(audio, { reset: true });
    }

    isRunning() { return this._running; }
    isPaused() { return this._paused; }

    getSongTime() {
      if (!this._running) return this._lastSongTime || 0;

      const raw = this._getAudioRaw();
      const songFromAudio = this._toSongTimeFromRaw(raw);

      // Detect "audio clock stalled" right after (re)start:
      // - raw doesn't change (or changes extremely little)
      // - songFromAudio stays at same value
      const EPS = 1e-4;
      const moved = Math.abs(raw - this._lastAudioRaw) > EPS;

      if (moved) {
        // Audio clock is alive -> trust it
        this._stallFrames = 0;
        this._lastAudioRaw = raw;
        this._lastSongTime = songFromAudio;
        // re-anchor perf base so fallback stays seamless if it stalls again
        this._markPerfBase(songFromAudio);
        return songFromAudio;
      }

      // Audio clock not moving: use performance clock fallback
      this._stallFrames++;

      const dt = (performance.now() - this._perfStartMs) / 1000;
      // Limit drift during long stalls (should not happen; safety cap)
      const perfSong = this._baseSongTime + Math.max(0, Math.min(dt, 3.0));

      // Keep lastSongTime monotonic
      this._lastSongTime = Math.max(this._lastSongTime, perfSong);
      return this._lastSongTime;
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
