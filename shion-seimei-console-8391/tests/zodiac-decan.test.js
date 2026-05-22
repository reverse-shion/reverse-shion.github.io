const assert = require('assert');
const zodiac = require('../js/zodiac-decan.js');

const a = zodiac.getZodiacDecan('1990-03-25');
const b = zodiac.getZodiacDecan('1990-04-18');
assert.strictEqual(a.zodiacNameJa, '牡羊座');
assert.ok([1,2,3].includes(a.decanNumber));
assert.notStrictEqual(a.decanNumber, b.decanNumber);
assert.deepStrictEqual(zodiac.getZodiacDecan('1990-03-25'), a);
console.log('zodiac-decan tests passed');
