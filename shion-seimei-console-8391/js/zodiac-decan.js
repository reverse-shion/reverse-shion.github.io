(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionZodiacDecan = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const SIGNS = [
    { key: 'aries', name: '牡羊座', start: [3, 21], end: [4, 19], element: '火', modality: '活動宮' },
    { key: 'taurus', name: '牡牛座', start: [4, 20], end: [5, 20], element: '土', modality: '不動宮' },
    { key: 'gemini', name: '双子座', start: [5, 21], end: [6, 21], element: '風', modality: '柔軟宮' },
    { key: 'cancer', name: '蟹座', start: [6, 22], end: [7, 22], element: '水', modality: '活動宮' },
    { key: 'leo', name: '獅子座', start: [7, 23], end: [8, 22], element: '火', modality: '不動宮' },
    { key: 'virgo', name: '乙女座', start: [8, 23], end: [9, 22], element: '土', modality: '柔軟宮' },
    { key: 'libra', name: '天秤座', start: [9, 23], end: [10, 23], element: '風', modality: '活動宮' },
    { key: 'scorpio', name: '蠍座', start: [10, 24], end: [11, 22], element: '水', modality: '不動宮' },
    { key: 'sagittarius', name: '射手座', start: [11, 23], end: [12, 21], element: '火', modality: '柔軟宮' },
    { key: 'capricorn', name: '山羊座', start: [12, 22], end: [1, 19], element: '土', modality: '活動宮' },
    { key: 'aquarius', name: '水瓶座', start: [1, 20], end: [2, 18], element: '風', modality: '不動宮' },
    { key: 'pisces', name: '魚座', start: [2, 19], end: [3, 20], element: '水', modality: '柔軟宮' }
  ];

  function simpleMessage(sign, decan) {
    return `「${sign.name}・第${decan}デカン」は、詩韻式では自分らしい進み方を調整する補助線です。`;
  }

  function buildDecanProfile(sign, decan) {
    return {
      zodiacSign: sign.key,
      zodiacNameJa: sign.name,
      decanNumber: decan,
      decanTitle: `${sign.name} 第${decan}デカン`,
      element: sign.element,
      modality: sign.modality,
      seimeiMessage: simpleMessage(sign, decan),
      tarotMinorHint: `${sign.element}の気質を意識した小アルカナの学びが共鳴しやすい時期です。`,
      readingFocus: '気持ちと現実のバランスを整え、次の一歩を言葉にすること。',
      shadow: '勢い・慎重さの偏りが出ると、選択が苦しくなることがあります。',
      action: '今週できる小さな行動を1つ決め、無理のない形で試してみましょう。'
    };
  }

  function isBoundary(month, day, sign) {
    const points = [sign.start, sign.end];
    return points.some(([m, d]) => m === month && Math.abs(d - day) <= 1);
  }

  function getZodiacDecan(birthDate) {
    const [y, m, d] = String(birthDate || '').split('-').map(Number);
    if (!y || !m || !d) return null;

    const sign = SIGNS.find((s) => {
      const [sm, sd] = s.start;
      const [em, ed] = s.end;
      if (sm <= em) {
        return (m > sm || (m === sm && d >= sd)) && (m < em || (m === em && d <= ed));
      }
      return (m > sm || (m === sm && d >= sd)) || (m < em || (m === em && d <= ed));
    }) || SIGNS[0];

    const [, day] = [m, d];
    const decan = day <= 10 ? 1 : day <= 20 ? 2 : 3;
    return {
      ...buildDecanProfile(sign, decan),
      boundaryWarning: isBoundary(m, d, sign)
        ? '境界日付付近のため、星座・デカンは簡易判定（要確認）です。'
        : ''
    };
  }

  return { getZodiacDecan };
});
