const assert = require('assert');
const fixtures = require('./fixtures/seido-date-regression.json');
const S = require('../assets/js/seido-date.js');

let assertions = 0;
for (const fixture of fixtures) {
  const actual = S.calculateSeidoTiming(fixture.input);
  assert.deepStrictEqual(actual, fixture.result, `${fixture.name}: calculateSeidoTiming result changed`);
  assertions += 1;
  assert.deepStrictEqual(actual.internal, fixture.result.internal, `${fixture.name}: internal JSON changed`);
  assertions += 1;
  assert.strictEqual(actual.primary_date, fixture.result.primary_date, `${fixture.name}: primary_date changed`);
  assertions += 1;
  assert.strictEqual(actual.preparation_date, fixture.result.preparation_date, `${fixture.name}: preparation_date changed`);
  assertions += 1;
  assert.strictEqual(actual.caution_date, fixture.result.caution_date, `${fixture.name}: caution_date changed`);
  assertions += 1;
  assert.strictEqual(actual.internal.suit_shift, 0, `${fixture.name}: SuitShift must stay fixed at 0`);
  assertions += 1;
}

console.log(`seido-date regression tests passed (${assertions} assertions)`);
