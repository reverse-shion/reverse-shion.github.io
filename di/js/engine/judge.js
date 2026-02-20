/* /di/js/engine/judge.js */
(() => {
  const NS = (window.DI_ENGINE ||= {});

  class Judge {
    constructor({ chart, timing }) {
      this.chart = chart;
      this.timing = timing;

      // windows (seconds)
      this.W = {
        PERFECT: 0.055,
        GREAT:   0.095,
        GOOD:    0.140,
        MISS:    0.190
      };

      this.state = {
        score: 0,
        combo: 0,
        maxCombo: 0,
        resonance: 0, // 0..100
        idx: 0,       // next note index
        hitCount: 0,
        missCount: 0,
      };

      // prepare notes sorted
      this.notes = (chart?.notes || []).slice().sort((a,b) => (a.t||0)-(b.t||0));
    }

    reset() {
      this.state.score = 0;
      this.state.combo = 0;
      this.state.maxCombo = 0;
      this.state.resonance = 0;
      this.state.idx = 0;
      this.state.hitCount = 0;
      this.state.missCount = 0;
    }

    _addRes(amount) {
      this.state.resonance = Math.max(0, Math.min(100, this.state.resonance + amount));
    }

    _scoreFor(name) {
      if (name === "PERFECT") return 120;
      if (name === "GREAT") return 90;
      if (name === "GOOD") return 40;
      return 0;
    }

    // called on tap
    hit(songTime) {
      const i = this._findNearestIndex(songTime);
      if (i < 0) {
        // no note to hit: tiny penalty? keep neutral
        return { name: "EMPTY", delta: 0, diff: null };
      }

      const n = this.notes[i];
      const diff = Math.abs(songTime - n.t);

      let name = "MISS";
      if (diff <= this.W.PERFECT) name = "PERFECT";
      else if (diff <= this.W.GREAT) name = "GREAT";
      else if (diff <= this.W.GOOD) name = "GOOD";
      else name = "MISS";

      if (name === "MISS") {
        this.state.combo = 0;
        this.state.missCount++;
        this._addRes(-2);
      } else {
        // consume this note
        this._consumeIndex(i);
        this.state.hitCount++;
        this.state.combo++;
        this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
        const add = this._scoreFor(name);
        this.state.score += add;

        // resonance growth: perfect > great > good
        if (name === "PERFECT") this._addRes(1.8);
        else if (name === "GREAT") this._addRes(1.2);
        else this._addRes(0.6);
      }

      return { name, diff, noteTime: n.t };
    }

    // auto-miss notes that passed too far (call from renderer maybe, or UI update)
    sweepMiss(songTime) {
      const missWindow = this.W.MISS;
      while (this.state.idx < this.notes.length) {
        const n = this.notes[this.state.idx];
        if ((songTime - n.t) > missWindow) {
          // missed
          this.state.idx++;
          this.state.combo = 0;
          this.state.missCount++;
          this._addRes(-2);
        } else {
          break;
        }
      }
    }

    _findNearestIndex(songTime) {
      // look at next note and maybe one ahead; choose nearest within MISS window
      const idx = this.state.idx;
      if (idx >= this.notes.length) return -1;

      const candidates = [idx, idx+1].filter(i => i < this.notes.length);
      let best = -1, bestDiff = Infinity;
      for (const i of candidates) {
        const d = Math.abs(songTime - this.notes[i].t);
        if (d < bestDiff) { bestDiff = d; best = i; }
      }
      // if too far, no hit
      if (bestDiff > this.W.MISS) return -1;
      return best;
    }

    _consumeIndex(i) {
      // If i is idx: advance idx; if i is idx+1: mark idx as "late miss"? we’ll just set idx=i+1
      if (i === this.state.idx) {
        this.state.idx++;
      } else if (i > this.state.idx) {
        // skip earlier note as miss (rare)
        this.state.idx = i + 1;
      }
    }
  }

  NS.Judge = Judge;
})();
