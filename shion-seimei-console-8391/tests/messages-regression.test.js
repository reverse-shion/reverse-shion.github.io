const assert = require('assert');
const fixtures = require('./fixtures/messages-regression.json');
const S = require('../assets/js/seido-date.js');
const M = require('../assets/js/messages.js');

let assertions = 0;
for (const fixture of fixtures) {
  const result = S.calculateSeidoTiming(fixture.input);
  const internal = result.internal;
  const themeContext = M.getThemeContext(internal.theme);
  const actual = {
    buildReason: M.buildReason(internal, themeContext),
    buildRecommended: M.buildRecommended(internal, themeContext),
    buildAvoid: M.buildAvoid(internal, themeContext),
    buildTone: M.buildTone(internal, themeContext),
    buildClosing: M.buildClosing(internal),
    generateCustomerMessage: M.generateCustomerMessage(result),
  };

  assert.strictEqual(actual.buildReason, fixture.outputs.buildReason, `${fixture.name}: buildReason changed`);
  assertions += 1;
  assert.strictEqual(actual.buildRecommended, fixture.outputs.buildRecommended, `${fixture.name}: buildRecommended changed`);
  assertions += 1;
  assert.strictEqual(actual.buildAvoid, fixture.outputs.buildAvoid, `${fixture.name}: buildAvoid changed`);
  assertions += 1;
  assert.strictEqual(actual.buildTone, fixture.outputs.buildTone, `${fixture.name}: buildTone changed`);
  assertions += 1;
  assert.strictEqual(actual.buildClosing, fixture.outputs.buildClosing, `${fixture.name}: buildClosing changed`);
  assertions += 1;
  assert.deepStrictEqual(actual.generateCustomerMessage, fixture.outputs.generateCustomerMessage, `${fixture.name}: generateCustomerMessage changed`);
  assertions += 1;
}

console.log(`messages regression tests passed (${assertions} assertions)`);
