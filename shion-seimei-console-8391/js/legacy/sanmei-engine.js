(function (root, factory) {
  let data = root.ShionSanmeiData;

  if (typeof require === 'function' && (!data || typeof module !== 'undefined')) {
    data = require('../sanmei-data.js');
  }

  const api = factory(data || {});

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.ShionSanmeiEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (DATA) {
  'use strict';

  const {
    STEMS = [],
    BRANCHES = [],
    ELEMENTS = ['木', '火', '土', '金', '水'],
    STEM_TO_SEIMEI = {},
    SEIMEI_TYPES = {},
    ELEMENT_NUANCE = {},
    topicTemplates = {}
  } = DATA;

  const STATUS = {
    verified: '検証済み',
    simplified: '簡易判定',
    needsReview: '要確認',
    notImplemented: '未実装'
  };

  const stemNames = STEMS.map((stem) => stem.name);
  const branchNames = BRANCHES.map((branch) => branch.name);

  function text(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    const trimmed = String(value).trim();
    return trimmed === '' ? fallback : trimmed;
  }

  function getStem(name) {
    return STEMS.find((stem) => stem.name === name) || null;
  }

  function getBranch(name) {
    return BRANCHES.find((branch) => branch.name === name) || null;
  }

  function normalizeTopic(topic) {
    const value = text(topic, '総合');
    return topicTemplates[value] ? value : '総合';
  }

  function sexagenary(index) {
    const i = ((index % 60) + 60) % 60;
    const stem = stemNames[i % 10] || '';
    const branch = branchNames[i % 12] || '';

    return {
      stem,
      branch,
      name: `${stem}${branch}`
    };
  }

  function parseDate(dateString) {
    const [year, month, day] = text(dateString).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  function getYearPillar(dateString) {
    const [year, month, day] = text(dateString).split('-').map(Number);

    const adjustedYear =
      month < 2 || (month === 2 && day < 4)
        ? year - 1
        : year;

    const pillar = sexagenary(adjustedYear - 4);

    return {
      ...pillar,
      status: 'simplified',
      label: '簡易年柱・要確認',
      basis:
        `${dateString}は、MVP版では立春を2月4日固定として扱っています。` +
        `そのため、${adjustedYear === year ? '立春以後' : '立春前'}の年柱として簡易判定しています。` +
        '厳密な節入り時刻は未対応です。'
    };
  }

  function getMonthBranchIndex(month, day) {
    const boundaries = [
      [1, 6, 1],
      [2, 4, 2],
      [3, 6, 3],
      [4, 5, 4],
      [5, 6, 5],
      [6, 6, 6],
      [7, 7, 7],
      [8, 8, 8],
      [9, 8, 9],
      [10, 8, 10],
      [11, 7, 11],
      [12, 7, 0]
    ];

    let branchIndex = 1;

    boundaries.forEach(([boundaryMonth, boundaryDay, index]) => {
      if (
        month > boundaryMonth ||
        (month === boundaryMonth && day >= boundaryDay)
      ) {
        branchIndex = index;
      }
    });

    return branchIndex;
  }

  function getTigerMonthStemIndex(yearStem) {
    const groups = {
      '甲': 2,
      '己': 2,
      '乙': 4,
      '庚': 4,
      '丙': 6,
      '辛': 6,
      '丁': 8,
      '壬': 8,
      '戊': 0,
      '癸': 0
    };

    return Number.isInteger(groups[yearStem]) ? groups[yearStem] : 2;
  }

  function getMonthPillar(dateString, yearStem) {
    const [, month, day] = text(dateString).split('-').map(Number);
    const branchIndex = getMonthBranchIndex(month, day);
    const offsetFromTiger = (branchIndex - 2 + 12) % 12;
    const stemIndex = (getTigerMonthStemIndex(yearStem) + offsetFromTiger) % 10;

    const stem = stemNames[stemIndex] || '';
    const branch = branchNames[branchIndex] || '';

    return {
      stem,
      branch,
      name: `${stem}${branch}`,
      status: 'simplified',
      label: '簡易月柱',
      basis:
        '二十四節気の厳密な節入り時刻は未計算です。' +
        'MVP版では近似境界テーブルを使い、月柱を簡易判定しています。'
    };
  }

  function julianDayNumber(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;

    return (
      day +
      Math.floor((153 * m + 2) / 5) +
      365 * y +
      Math.floor(y / 4) -
      Math.floor(y / 100) +
      Math.floor(y / 400) -
      32045
    );
  }

  function getDayPillar(dateString) {
    const date = parseDate(dateString);
    const jdn = julianDayNumber(date);

    /*
     * 1984-02-02を甲子日として扱う簡易基準。
     * 日柱は鑑定の印象に関わるため、正式運用では暦データとの照合が必要。
     */
    const baseJdn = 2445703;
    const pillar = sexagenary(jdn - baseJdn);

    return {
      ...pillar,
      status: 'needsReview',
      label: '簡易日柱・要確認',
      basis:
        `Julian Day Number（${jdn}）と、未検証基準日JDN ${baseJdn} から60干支を算出しています。` +
        '現段階では簡易判定として扱い、正式鑑定では確認が必要です。'
    };
  }

  function aggregateFiveElements(pillars) {
    const counts = Object.fromEntries(ELEMENTS.map((element) => [element, 0]));

    (Array.isArray(pillars) ? pillars : []).forEach((pillar) => {
      const stem = getStem(pillar && pillar.stem);
      const branch = getBranch(pillar && pillar.branch);

      if (stem && counts[stem.element] !== undefined) {
        counts[stem.element] += 1;
      }

      if (branch && counts[branch.element] !== undefined) {
        counts[branch.element] += 1;
      }
    });

    const entries = Object.entries(counts);
    const values = entries.map(([, value]) => value);
    const max = Math.max(...values);
    const min = Math.min(...values);

    const strongest = entries
      .filter(([, value]) => value === max)
      .map(([element]) => element);

    const weakest = entries
      .filter(([, value]) => value === min)
      .map(([element]) => element);

    return {
      counts,
      strongest,
      weakest,
      supplement: weakest,
      note:
        '年柱・月柱・日柱に含まれる干支の五行を集計した簡易バランスです。' +
        '多い五行は出やすい力、少ない五行は意識すると助けになる力として見ます。' +
        '良い・悪いではなく、心と行動の使い方を知るための目安です。'
    };
  }

  function getElementReading(element) {
    return ELEMENT_NUANCE[element] ||
      '今のあなたに出やすい力を見ながら、無理なく使える形にしていくことが大切です。';
  }

  function determineSeimeiType(dayStem, balance = {}, topic = '総合') {
    const safeTopic = normalizeTopic(topic);
    const map = STEM_TO_SEIMEI[dayStem] || STEM_TO_SEIMEI['甲'] || {};

    const baseType =
      SEIMEI_TYPES[map.base] ||
      SEIMEI_TYPES.pioneer ||
      {};

    const subType =
      SEIMEI_TYPES[map.sub] ||
      SEIMEI_TYPES.hope ||
      baseType;

    const strongestElement =
      Array.isArray(balance.strongest) && balance.strongest.length
        ? balance.strongest[0]
        : '';

    const topicFocus =
      baseType.templateByTopic && baseType.templateByTopic[safeTopic]
        ? baseType.templateByTopic[safeTopic]
        : baseType.templateByTopic && baseType.templateByTopic['総合']
          ? baseType.templateByTopic['総合']
          : topicTemplates[safeTopic] || topicTemplates['総合'] || '';

    return {
      status: 'simplified',
      baseType,
      subType,
      resonantCards: Array.isArray(map.cards) ? map.cards : [],
      strongestElement,
      nuance: getElementReading(strongestElement),
      topicFocus,
      basis:
        `日干「${dayStem}」から基本タイプを簡易判定し、` +
        `五行で出やすい力「${strongestElement || '参考'}」と相談ジャンル「${safeTopic}」を重ねて焦点を合わせています。`
    };
  }

  function buildSanmeiReference(dayPillar) {
    const dayStemData = getStem(dayPillar && dayPillar.stem) || {};

    return {
      dayStem: text(dayPillar && dayPillar.stem, '未算出'),
      element: text(dayStemData.element, '参考'),
      yinYang: text(dayStemData.yinYang, '参考'),
      symbol: text(dayStemData.symbol, '象徴'),
      essence: text(dayStemData.essence, '本質を見直す力'),
      caution: text(dayStemData.caution, '無理をしすぎないこと'),
      deep: text(
        dayStemData.deep,
        'この日干は、あなたが無意識に大切にしている生き方の癖を映します。良い・悪いではなく、自分らしく戻るための手がかりとして見てください。'
      )
    };
  }

  function buildChart(input = {}) {
    const birthDate = text(input.birthDate);
    const topic = normalizeTopic(input.topic);

    const yearPillar = getYearPillar(birthDate);
    const monthPillar = getMonthPillar(birthDate, yearPillar.stem);
    const dayPillar = getDayPillar(birthDate);

    const fiveElements = aggregateFiveElements([
      yearPillar,
      monthPillar,
      dayPillar
    ]);

    const seimei = determineSeimeiType(
      dayPillar.stem,
      fiveElements,
      topic
    );

    return {
      statuses: STATUS,

      pillars: {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar
      },

      sanmeiReference: buildSanmeiReference(dayPillar),

      fiveElements,

      seimei,

      readingMeta: {
        topic,
        method: '詩韻式 星命鑑定・簡易判定',
        caution:
          'この鑑定は、簡易日柱・簡易月柱を含むMVP版です。' +
          '断定ではなく、今の自分を見つめ直し、現実の行動へつなげるための参考として扱ってください。'
      }
    };
  }

  return {
    STATUS,
    getStem,
    getBranch,
    getYearPillar,
    getMonthPillar,
    getDayPillar,
    julianDayNumber,
    aggregateFiveElements,
    determineSeimeiType,
    buildChart
  };
});
