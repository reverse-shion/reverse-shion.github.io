(function (root, factory) {
  let tarot78 = root.ShionTarot78;
  if (typeof require === 'function' && (!tarot78 || typeof module !== 'undefined')) {
    try { tarot78 = require('./tarot-78.js'); } catch (error) { tarot78 = null; }
  }
  const api = factory(tarot78 || {});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionFutureScore = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (DefaultTarot78) {
  'use strict';

  const ELEMENT_MONTHS = { 木: [2, 3], 火: [5, 6], 土: [1, 4, 7, 10], 金: [8, 9], 水: [11, 12] };
  const TOPIC_BONUS = { 恋愛: 'loveScore', 仕事: 'workScore', 金運: 'moneyScore', 人間関係: 'relationshipScore', 総合: 'turningPointScore', 今月の運勢: 'turningPointScore' };
  const THEMES = ['整理', '準備', '発信', '対話', '見直し', '育成', '学び', '選択', '回復', '挑戦', '信頼', '収穫'];

  function text(value, fallback = '') { return value === null || value === undefined ? fallback : String(value).trim(); }
  function clamp(value) { return Math.max(0, Math.min(100, Math.round(value))); }
  function hash(value) {
    const str = text(value);
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return Math.abs(h >>> 0);
  }
  function monthAffinity(element, month) { return (ELEMENT_MONTHS[element] || []).includes(month) ? 10 : 0; }
  function getBirthSeed(input) { return hash([input.birthDate, input.name, input.topic, input.targetYear].join('|')); }
  function normalizeYear(input) {
    const currentYear = new Date().getFullYear();
    const year = Number(input && input.targetYear);
    return Number.isInteger(year) && year >= 1900 && year <= 2200 ? year : currentYear;
  }
  function resolveTarotCard(entry, tarot78) {
    const source = tarot78 || DefaultTarot78 || {};
    if (!entry) return null;
    if (entry.category && entry.nameJa) return entry;
    if (source.getTarot78ById && entry.id) return source.getTarot78ById(entry.id);
    if (source.getTarot78ByName && entry.name) return source.getTarot78ByName(entry.name);
    if (source.getTarot78ByName && entry.nameJa) return source.getTarot78ByName(entry.nameJa);
    return null;
  }
  function tarotInfluence(tarotEntries, tarot78, month) {
    const entries = Array.isArray(tarotEntries) ? tarotEntries : [];
    return entries.reduce((acc, entry, index) => {
      const card = resolveTarotCard(entry, tarot78);
      if (!card) return acc;
      const pulse = ((hash(`${card.id}:${month}:${index}`) % 17) - 8);
      if (card.category === 'major') { acc.turning += 9 + Math.max(0, pulse); acc.caution += card.number === 15 || card.number === 16 || card.number === 18 ? 8 : 0; }
      if (card.category === 'ace') { acc.love += 4; acc.work += 4; acc.money += card.suit === 'pentacles' ? 8 : 3; }
      if (card.category === 'court') { acc.love += 5; acc.relationship += 8; }
      if (card.category === 'numbered') { acc.work += 3; acc.money += card.suit === 'pentacles' ? 5 : 1; }
      if (card.suit === 'cups') acc.love += 6;
      if (card.suit === 'wands') acc.work += 5;
      if (card.suit === 'swords') acc.caution += 5;
      if (card.suit === 'pentacles') acc.money += 6;
      acc.cards.push(card.nameJa);
      return acc;
    }, { love: 0, work: 0, money: 0, relationship: 0, caution: 0, turning: 0, cards: [] });
  }
  function pickThemes(month, seed, chart) {
    const weakest = chart && chart.fiveElements && Array.isArray(chart.fiveElements.weakest) ? chart.fiveElements.weakest[0] : '';
    const first = THEMES[(month + seed) % THEMES.length];
    const second = THEMES[(month * 3 + seed) % THEMES.length];
    const elementTheme = weakest ? `${weakest}を補う` : THEMES[(month * 5 + seed) % THEMES.length];
    return Array.from(new Set([first, second, elementTheme])).slice(0, 3);
  }

  function buildFutureScores(input = {}, chart = {}, tarotEntries = [], tarot78) {
    const safeInput = input || {};
    const year = normalizeYear(safeInput);
    const seed = getBirthSeed({ ...safeInput, targetYear: year });
    const dayElement = chart && chart.sanmeiReference ? chart.sanmeiReference.element : '';
    const strongest = chart && chart.fiveElements && Array.isArray(chart.fiveElements.strongest) ? chart.fiveElements.strongest[0] : dayElement;
    const topic = text(safeInput.topic, '総合');
    const topicKey = TOPIC_BONUS[topic] || TOPIC_BONUS['総合'];

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const wave = (seed + year * (month + 7) + month * 31) % 29;
      const affinity = monthAffinity(dayElement, month) + Math.floor(monthAffinity(strongest, month) / 2);
      const tarot = tarotInfluence(tarotEntries, tarot78, month);
      const base = 42 + wave + affinity;
      const score = {
        month,
        label: `${month}月`,
        loveScore: clamp(base + (month % 3) * 4 + tarot.love),
        workScore: clamp(base + ((month + 1) % 4) * 3 + tarot.work),
        moneyScore: clamp(base + ((month + 2) % 5) * 2 + tarot.money),
        relationshipScore: clamp(base + ((month + 3) % 4) * 3 + tarot.relationship),
        cautionScore: clamp(34 + ((seed >> (month % 8)) % 31) + (month % 4 === 0 ? 12 : 0) + tarot.caution - Math.floor(affinity / 2)),
        turningPointScore: clamp(38 + wave + affinity + (month === ((seed % 12) + 1) ? 18 : 0) + tarot.turning),
        themes: pickThemes(month, seed, chart),
        cards: Array.from(new Set(tarot.cards)).slice(0, 2),
        note: ''
      };
      if (topicKey && score[topicKey] !== undefined) score[topicKey] = clamp(score[topicKey] + 7);
      score.note = score.cautionScore >= 65
        ? '広げるより、確認と調整を優先したい月'
        : score.turningPointScore >= 68
          ? '準備してきた流れが動きやすい月'
          : '焦って広げるより、整える月';
      return score;
    });
  }

  function getTopMonths(scores = [], key, count = 3) {
    if (!Array.isArray(scores) || !scores.length) return [];
    const limit = Number.isInteger(Number(count)) && Number(count) > 0 ? Number(count) : 3;
    return scores
      .filter((item) => item && Number.isFinite(Number(item[key])))
      .slice()
      .sort((a, b) => (Number(b[key]) - Number(a[key])) || (Number(a.month) - Number(b.month)))
      .slice(0, limit);
  }
  function getTurningPointMonths(scores, count = 3) { return getTopMonths(scores, 'turningPointScore', count); }
  function getCautionMonths(scores, count = 3) { return getTopMonths(scores, 'cautionScore', count); }
  function getLoveOpportunityMonths(scores, count = 3) { return getTopMonths(scores, 'loveScore', count); }
  function getWorkMoneyMonths(scores, count = 3) {
    const merged = Array.isArray(scores) ? scores.map((item) => ({ ...item, workMoneyScore: Math.round(((item.workScore || 0) + (item.moneyScore || 0)) / 2) })) : [];
    return getTopMonths(merged, 'workMoneyScore', count);
  }

  return { buildFutureScores, getTopMonths, getTurningPointMonths, getCautionMonths, getLoveOpportunityMonths, getWorkMoneyMonths };
});
