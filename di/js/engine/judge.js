/* /di/js/engine/judge.js
   Judge — deterministic, skip-safe, adjustable input latency support
*/
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Judge {
    constructor({ chart, timing }) {
      this.chart = chart;
      this.timing = timing;
      this.inputLatency = 0;

      this.W = {
        PERFECT: 0.055,
        GREAT: 0.095,
        GOOD: 0.140,
        MISS: 0.190,
      };

      this.state = {
        score: 0,
        combo: 0,
        maxCombo: 0,
        resonance: 0,
        idx: 0,
        hitCount: 0,
        missCount: 0,
      };

      this.notes = (chart?.notes || [])
        .map((n) => ({ ...n, t: Number(n.t || 0) }))
        .filter((n) => Number.isFinite(n.t))
        .sort((a, b) => a.t - b.t);
    }

    setInputLatency(sec) {
      const v = Number(sec);
      this.inputLatency = Number.isFinite(v) ? v : 0;
    }

    reset() {
      const s = this.state;
      s.score = 0;
      s.combo = 0;
      s.maxCombo = 0;
      s.resonance = 0;
      s.idx = 0;
      s.hitCount = 0;
      s.missCount = 0;
    }

    _clampRes(v) { return Math.max(0, Math.min(100, v)); }
    _addRes(amount) { this.state.resonance = this._clampRes(this.state.resonance + amount); }

    _scoreFor(name) {
      switch (name) {
        case "PERFECT": return 120;
        case "GREAT": return 90;
        case "GOOD": return 40;
        default: return 0;
      }
    }

    _applyMiss() {
      const s = this.state;
      s.combo = 0;
      s.missCount++;
      this._addRes(-2);
    }

    sweepMiss(songTime) {
      const missWindow = this.W.MISS;
      const s = this.state;
      while (s.idx < this.notes.length) {
        const nt = this.notes[s.idx].t;
        if ((songTime - nt) > missWindow) {
          s.idx++;
          this._applyMiss();
        } else {
          break;
        }
      }
    }

    _findNearestIndex(songTime) {
      const s = this.state;
      if (s.idx >= this.notes.length) return -1;
      const a = s.idx;
      const b = s.idx + 1;

      let best = a;
      let bestDiff = Math.abs(songTime - this.notes[a].t);
      if (b < this.notes.length) {
        const d2 = Math.abs(songTime - this.notes[b].t);
        if (d2 < bestDiff) { best = b; bestDiff = d2; }
      }
      return bestDiff <= this.W.MISS ? best : -1;
    }

    _consumeTo(targetIndexExclusive) {
      const s = this.state;
      while (s.idx < targetIndexExclusive) {
        s.idx++;
        this._applyMiss();
      }
    }

    hit(songTime) {
      const now = Number(songTime) + this.inputLatency;
      this.sweepMiss(now);

      const i = this._findNearestIndex(now);
      if (i < 0) return { name: "EMPTY", delta: 0, diff: null };

      const n = this.notes[i];
      const diff = Math.abs(now - n.t);
      let name = "MISS";
      if (diff <= this.W.PERFECT) name = "PERFECT";
      else if (diff <= this.W.GREAT) name = "GREAT";
      else if (diff <= this.W.GOOD) name = "GOOD";

      if (name === "MISS") {
        this._applyMiss();
        return { name, diff, noteTime: n.t };
      }

      this._consumeTo(i);
      this.state.idx++;

      const s = this.state;
      s.hitCount++;
      s.combo++;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      s.score += this._scoreFor(name);

      if (name === "PERFECT") this._addRes(1.8);
      else if (name === "GREAT") this._addRes(1.2);
      else this._addRes(0.6);

      return { name, diff, noteTime: n.t };
    }
  }

  NS.Judge = Judge;
})();
