const assert = require('assert');
const data = require('../js/sanmei-data.js');
globalThis.ShionSanmeiData = data;
const engine = require('../js/sanmei-engine.js');
const tarot78 = require('../js/tarot-78.js');
globalThis.ShionTarot78 = tarot78;
const future = require('../js/future-score.js');

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); } catch (error) { console.error(`✗ ${name}`); throw error; }
}

const input = { name: 'デモ太郎', birthDate: '1984-01-03', topic: '仕事', memo: '今後の働き方と金運が不安', targetYear: 2026 };
const chart = engine.buildChart(input);
const entries = [{ name: '魔術師' }, { name: 'ペンタクルのエース' }];
const scores = future.buildFutureScores(input, chart, entries, tarot78);

test('buildFutureScores が12か月分を返す', () => assert.strictEqual(scores.length, 12));
test('同じ入力なら同じ結果になる', () => assert.deepStrictEqual(future.buildFutureScores(input, chart, entries, tarot78), scores));
test('tarotEntries が空でもクラッシュしない', () => assert.strictEqual(future.buildFutureScores(input, chart, [], tarot78).length, 12));
test('各スコアが 0〜100 の範囲に収まる整数', () => scores.forEach((month) => {
  ['loveScore', 'workScore', 'moneyScore', 'relationshipScore', 'cautionScore', 'turningPointScore'].forEach((key) => {
    assert.ok(Number.isInteger(month[key]), `${key} is integer`);
    assert.ok(month[key] >= 0 && month[key] <= 100, `${key} in range`);
  });
}));
test('getTurningPointMonths が指定件数を返す', () => assert.strictEqual(future.getTurningPointMonths(scores, 2).length, 2));
test('getCautionMonths が指定件数を返す', () => assert.strictEqual(future.getCautionMonths(scores, 2).length, 2));
test('getLoveOpportunityMonths が指定件数を返す', () => assert.strictEqual(future.getLoveOpportunityMonths(scores, 2).length, 2));
test('getWorkMoneyMonths が指定件数を返す', () => assert.strictEqual(future.getWorkMoneyMonths(scores, 2).length, 2));
test('scores が空でもヘルパー関数がクラッシュしない', () => {
  assert.deepStrictEqual(future.getTurningPointMonths([], 3), []);
  assert.deepStrictEqual(future.getCautionMonths([], 3), []);
  assert.deepStrictEqual(future.getLoveOpportunityMonths([], 3), []);
  assert.deepStrictEqual(future.getWorkMoneyMonths([], 3), []);
});

console.log('All future-score tests passed.');
