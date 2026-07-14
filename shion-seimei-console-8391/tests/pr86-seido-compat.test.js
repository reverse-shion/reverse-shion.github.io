const assert = require('assert');
const childProcess = require('child_process');
const vm = require('vm');
const fixtures = require('./fixtures/seido-date-regression.json');

function loadSeidoAt(ref) {
  const source = childProcess.execFileSync('git', ['show', `${ref}:shion-seimei-console-8391/assets/js/seido-date.js`], { encoding: 'utf8' });
  const sandbox = { module: { exports: {} }, exports: {}, globalThis: {} };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: `seido-date.js@${ref}` });
  return sandbox.module.exports;
}

const before = loadSeidoAt('9608da2');
const after = loadSeidoAt('c4ab414');
let assertions = 0;

for (const fixture of fixtures) {
  const beforeResult = JSON.parse(JSON.stringify(before.calculateSeidoTiming(fixture.input)));
  const afterResult = JSON.parse(JSON.stringify(after.calculateSeidoTiming(fixture.input)));
  assert.deepStrictEqual(afterResult, beforeResult, `${fixture.name}: PR #86 changed calculateSeidoTiming result`);
  assertions += 1;
  assert.deepStrictEqual(afterResult.internal, beforeResult.internal, `${fixture.name}: PR #86 changed internal JSON`);
  assertions += 1;
  assert.strictEqual(afterResult.primary_date, beforeResult.primary_date, `${fixture.name}: PR #86 changed primary_date`);
  assertions += 1;
  assert.strictEqual(afterResult.preparation_date, beforeResult.preparation_date, `${fixture.name}: PR #86 changed preparation_date`);
  assertions += 1;
  assert.strictEqual(afterResult.caution_date, beforeResult.caution_date, `${fixture.name}: PR #86 changed caution_date`);
  assertions += 1;
}

console.log(`PR #86 seido compatibility tests passed (${assertions} assertions)`);
