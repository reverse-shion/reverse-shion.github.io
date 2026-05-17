(function (root, factory) {
  let data = root.ShionSanmeiData;
  if (typeof require === 'function' && (!data || typeof module !== 'undefined')) data = require('./sanmei-data.js');
  const api = factory(data);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionSanmeiEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (DATA) {
  const { STEMS, BRANCHES, ELEMENTS, STEM_TO_SEIMEI, SEIMEI_TYPES, ELEMENT_NUANCE } = DATA;
  const STATUS = { verified:'検証済み', simplified:'簡易判定', needsReview:'要確認', notImplemented:'未実装' };
  const stemNames = STEMS.map(s => s.name), branchNames = BRANCHES.map(b => b.name);
  function getStem(name) { return STEMS.find(s => s.name === name); }
  function getBranch(name) { return BRANCHES.find(b => b.name === name); }
  function sexagenary(index) { const i = ((index % 60) + 60) % 60; return { stem: stemNames[i % 10], branch: branchNames[i % 12], name: `${stemNames[i % 10]}${branchNames[i % 12]}` }; }
  function parseDate(dateString) { const [y,m,d] = dateString.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); }
  function getYearPillar(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const adjustedYear = (month < 2 || (month === 2 && day < 4)) ? year - 1 : year;
    const pillar = sexagenary(adjustedYear - 4);
    return { ...pillar, status:'simplified', label:'簡易年柱・要確認', basis:`${dateString}はMVP固定の立春（2月4日）${adjustedYear === year ? '以後' : '前'}として扱う簡易判定です。厳密な節入り時刻は未対応です。` };
  }
  function getMonthBranchIndex(month, day) {
    const boundaries = [[1,6,1],[2,4,2],[3,6,3],[4,5,4],[5,6,5],[6,6,6],[7,7,7],[8,8,8],[9,8,9],[10,8,10],[11,7,11],[12,7,0]];
    let branchIndex = 1;
    for (const [m,d,b] of boundaries) if (month > m || (month === m && day >= d)) branchIndex = b;
    return branchIndex;
  }
  function getTigerMonthStemIndex(yearStem) {
    const groups = { '甲':2, '己':2, '乙':4, '庚':4, '丙':6, '辛':6, '丁':8, '壬':8, '戊':0, '癸':0 };
    return groups[yearStem];
  }
  function getMonthPillar(dateString, yearStem) {
    const [, month, day] = dateString.split('-').map(Number);
    const branchIndex = getMonthBranchIndex(month, day);
    const offsetFromTiger = (branchIndex - 2 + 12) % 12;
    const stemIndex = (getTigerMonthStemIndex(yearStem) + offsetFromTiger) % 10;
    return { stem: stemNames[stemIndex], branch: branchNames[branchIndex], name:`${stemNames[stemIndex]}${branchNames[branchIndex]}`, status:'simplified', label:'簡易月柱', basis:'二十四節気の厳密な節入り時刻は未計算です。近似境界テーブルによる簡易月柱です。' };
  }
  function julianDayNumber(date) { const y = date.getUTCFullYear(), m = date.getUTCMonth()+1, d = date.getUTCDate(); const a = Math.floor((14-m)/12); const yy = y + 4800 - a; const mm = m + 12*a - 3; return d + Math.floor((153*mm+2)/5) + 365*yy + Math.floor(yy/4) - Math.floor(yy/100) + Math.floor(yy/400) - 32045; }
  function getDayPillar(dateString) {
    const date = parseDate(dateString); const jdn = julianDayNumber(date);
    const baseJdn = 2445703; // 1984-02-02を甲子日として扱う簡易基準（要検証）
    const pillar = sexagenary(jdn - baseJdn);
    return { ...pillar, status:'needsReview', label:'簡易日柱・要確認', basis:`Julian Day Number（${jdn}）と未検証基準日JDN ${baseJdn} から60干支を算出しています。README参照。` };
  }
  function aggregateFiveElements(pillars) {
    const balance = Object.fromEntries(ELEMENTS.map(e => [e, 0]));
    pillars.forEach(p => { const stem = getStem(p.stem); const branch = getBranch(p.branch); if (stem) balance[stem.element] += 1; if (branch) balance[branch.element] += 1; });
    const entries = Object.entries(balance); const max = Math.max(...entries.map(([,v]) => v)); const min = Math.min(...entries.map(([,v]) => v));
    return { counts:balance, strongest:entries.filter(([,v]) => v === max).map(([e]) => e), weakest:entries.filter(([,v]) => v === min).map(([e]) => e), supplement:entries.filter(([,v]) => v === min).map(([e]) => e), note:'年柱・月柱・日柱の干支五行を集計した簡易バランスです。偏りは断定ではなく傾向として扱います。' };
  }
  function determineSeimeiType(dayStem, balance, topic) {
    const map = STEM_TO_SEIMEI[dayStem] || STEM_TO_SEIMEI['甲']; const baseType = SEIMEI_TYPES[map.base]; const subType = SEIMEI_TYPES[map.sub]; const strongest = balance.strongest[0];
    return { status:'simplified', baseType, subType, resonantCards:map.cards, strongestElement:strongest, nuance:ELEMENT_NUANCE[strongest], topicFocus:baseType.templateByTopic[topic] || baseType.templateByTopic['総合'], basis:`日干「${dayStem}」から基本タイプを簡易判定し、五行最強要素「${strongest}」と相談ジャンルで焦点を補正しています。` };
  }
  function buildChart(input) {
    const yearPillar = getYearPillar(input.birthDate); const monthPillar = getMonthPillar(input.birthDate, yearPillar.stem); const dayPillar = getDayPillar(input.birthDate);
    const dayStemData = getStem(dayPillar.stem); const balance = aggregateFiveElements([yearPillar, monthPillar, dayPillar]); const seimei = determineSeimeiType(dayPillar.stem, balance, input.topic || '総合');
    return { statuses:STATUS, pillars:{ year:yearPillar, month:monthPillar, day:dayPillar }, sanmeiReference:{ dayStem:dayPillar.stem, element:dayStemData.element, yinYang:dayStemData.yinYang, symbol:dayStemData.symbol, essence:dayStemData.essence, caution:dayStemData.caution }, fiveElements:balance, seimei };
  }
  return { STATUS, getStem, getBranch, getYearPillar, getMonthPillar, getDayPillar, julianDayNumber, aggregateFiveElements, determineSeimeiType, buildChart };
});
