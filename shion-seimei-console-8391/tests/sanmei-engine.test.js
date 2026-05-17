const assert = require('assert');
const data = require('../js/sanmei-data.js');
globalThis.ShionSanmeiData = data;
const tarot = require('../js/tarot-mapping.js');
globalThis.ShionTarotMapping = tarot;
const engine = require('../js/sanmei-engine.js');
const validation = require('../js/validation.js');
const reading = require('../js/reading-template.js');

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); } catch (error) { console.error(`✗ ${name}`); throw error; }
}

const input = { name:'デモ太郎', birthDate:'1984-01-03', topic:'仕事', memo:'今後の働き方と金運が不安' };
const chart = engine.buildChart(input);

test('十干から五行が返る', () => assert.strictEqual(engine.getStem('甲').element, '木'));
test('十干から陰陽が返る', () => assert.strictEqual(engine.getStem('甲').yinYang, '陽'));
test('十二支から五行が返る', () => assert.strictEqual(engine.getBranch('子').element, '水'));
test('五行バランスが集計される', () => assert.strictEqual(Object.values(chart.fiveElements.counts).reduce((a,b)=>a+b,0), 6));
test('日干から基本性質が返る', () => assert.ok(chart.sanmeiReference.essence.length > 0));
test('星命タイプ判定が空にならない', () => assert.ok(chart.seimei.baseType.name.length > 0));
test('大アルカナ22枚が存在する', () => assert.strictEqual(tarot.TAROT_CARDS.length, 22));
test('正位置・逆位置が存在する', () => { const c = tarot.TAROT_CARDS[0]; assert.ok(c.uprightMeaning); assert.ok(c.reversedMeaning); });
test('1枚引きポジションが返る', () => assert.deepStrictEqual(tarot.SPREAD_POSITIONS[1], ['今のメッセージ']));
test('3枚引きポジションが返る', () => assert.deepStrictEqual(tarot.SPREAD_POSITIONS[3], ['現在','課題','進む道']));
test('5枚引きポジションが返る', () => assert.deepStrictEqual(tarot.SPREAD_POSITIONS[5], ['現在','宿命的テーマ','心のブレーキ','外側の状況','今取るべき行動']));
test('空の生年月日にエラー', () => assert.ok(validation.validateBirthDate('').length > 0));
test('不正な日付にエラー', () => assert.ok(validation.validateBirthDate('2024-02-31').length > 0));
test('未来の日付にエラー', () => assert.ok(validation.validateBirthDate('2999-01-01').length > 0));
test('生成鑑定文が空にならない', () => assert.ok(reading.generateReading(input, chart, [{ name:'塔', orientation:'upright' }]).length > 0));
test('禁止表現が鑑定文に含まれない', () => {
  const filtered = reading.filterForbidden('絶対に破産します。病気になります。相手は必ず戻ってきます。');
  ['絶対に破産します','病気になります','相手は必ず戻ってきます'].forEach(ng => assert.ok(!filtered.includes(ng)));
});

console.log('All tests passed.');
