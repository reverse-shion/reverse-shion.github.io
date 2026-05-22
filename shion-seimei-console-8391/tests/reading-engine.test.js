const assert = require('assert');
const sanmeiData = require('../js/sanmei-data.js');
globalThis.ShionSanmeiData = sanmeiData;
globalThis.ShionSanmeiEngine = require('../js/sanmei-engine.js');
globalThis.ShionTarot78 = require('../js/tarot-78.js');
globalThis.ShionFutureScore = require('../js/future-score.js');
globalThis.ShionZodiacDecan = require('../js/zodiac-decan.js');
const readingEngine = require('../js/reading-engine.js');

function build(input) {
  return globalThis.ShionReadingEngine.build(input);
}

const a = { birthDate: '1984-01-03', topic: '仕事', targetYear: 2026 };
const b = { birthDate: '1992-07-15', topic: '仕事', targetYear: 2026 };
const c = { birthDate: '2001-11-26', topic: '仕事', targetYear: 2026 };

const ra = build(a);
const rb = build(b);
const rc = build(c);

assert.ok(
  ra.center !== rb.center ||
  ra.chart.sanmeiReference.dayStem !== rb.chart.sanmeiReference.dayStem ||
  ra.zodiacDecan.decanTitle !== rb.zodiacDecan.decanTitle
);

assert.ok(
  rb.center !== rc.center ||
  rb.chart.sanmeiReference.dayStem !== rc.chart.sanmeiReference.dayStem ||
  rb.zodiacDecan.decanTitle !== rc.zodiacDecan.decanTitle
);

assert.deepStrictEqual(build(a), build(a));
console.log('reading-engine tests passed');
