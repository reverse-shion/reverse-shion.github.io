const assert = require('assert');
const tarot = require('../js/tarot-78.js');

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); } catch (error) { console.error(`✗ ${name}`); throw error; }
}

const cards = tarot.TAROT_78_CARDS;
const allowedCategories = ['major', 'numbered', 'ace', 'court'];
const allowedSuits = ['wands', 'cups', 'swords', 'pentacles'];

test('カード総数が78枚', () => assert.strictEqual(cards.length, 78));
test('major が22枚', () => assert.strictEqual(tarot.getTarot78ByCategory('major').length, 22));
test('numbered が36枚', () => assert.strictEqual(tarot.getTarot78ByCategory('numbered').length, 36));
test('ace が4枚', () => assert.strictEqual(tarot.getTarot78ByCategory('ace').length, 4));
test('court が16枚', () => assert.strictEqual(tarot.getTarot78ByCategory('court').length, 16));
test('id が重複していない', () => assert.strictEqual(new Set(cards.map((card) => card.id)).size, 78));
test('必須テキストとキーワードが入っている', () => cards.forEach((card) => {
  assert.ok(card.nameJa);
  assert.ok(card.nameEn);
  assert.ok(Array.isArray(card.keywords));
  assert.ok(card.keywords.length > 0);
}));
test('category が許可値のみ', () => cards.forEach((card) => assert.ok(allowedCategories.includes(card.category))));
test('major の suit は null', () => tarot.getTarot78ByCategory('major').forEach((card) => assert.strictEqual(card.suit, null)));
test('major 以外の suit は許可値', () => cards.filter((card) => card.category !== 'major').forEach((card) => assert.ok(allowedSuits.includes(card.suit))));
test('getTarot78ById が機能する', () => assert.strictEqual(tarot.getTarot78ById('major_01').nameJa, '魔術師'));
test('getTarot78ByName が機能する', () => assert.strictEqual(tarot.getTarot78ByName('The Magician').nameJa, '魔術師'));
test('getTarot78ByCategory が機能する', () => assert.strictEqual(tarot.getTarot78ByCategory('ace').length, 4));
test('getTarot78BySuit が機能する', () => assert.strictEqual(tarot.getTarot78BySuit('cups').length, 14));

console.log('All tarot-78 tests passed.');
