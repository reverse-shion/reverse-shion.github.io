(function (root) {
  const api = {
    build(input) {
      const chart = (root.ShionSanmeiEngine && root.ShionSanmeiEngine.buildChart)
        ? root.ShionSanmeiEngine.buildChart(input)
        : {};
      const zodiacDecan = (root.ShionZodiacDecan && root.ShionZodiacDecan.getZodiacDecan)
        ? root.ShionZodiacDecan.getZodiacDecan(input.birthDate)
        : null;

      const centerType = chart.seimei && chart.seimei.baseType ? chart.seimei.baseType : {};
      const subType = chart.seimei && chart.seimei.subType ? chart.seimei.subType : {};
      const center = centerType.name || '調和の星命';
      const sub = subType.name || '希望の星命';
      const centerKey = centerType.id || centerType.key || center;
      const subKey = subType.id || subType.key || sub;

      const tarotEntries = input.tarot ? [{ name: input.tarot }] : [];
      const scores = (root.ShionFutureScore && root.ShionFutureScore.buildFutureScores)
        ? root.ShionFutureScore.buildFutureScores(input, chart, tarotEntries, root.ShionTarot78)
        : [];

      const months = scores.map((score) => ({
        month: score.month,
        title: `${score.month}月のテーマ：${score.themeKeywords && score.themeKeywords[0] ? score.themeKeywords[0] : '整え'}`,
        theme: score.monthType,
        message: score.message,
        action: score.action,
        phrase: score.phrase,
        caution: score.caution
      }));

      const year = {
        year: Number(input.targetYear),
        title: `${input.targetYear}年の流れ`,
        luckyMonths: months.filter((m) => m.theme === '追い風月').map((m) => m.month),
        cautionMonths: months.filter((m) => m.theme === '慎重月').map((m) => m.month),
        turningMonths: months.filter((m) => m.theme === '転換期').map((m) => m.month)
      };

      return { center, sub, centerKey, subKey, chart, zodiacDecan, year, months };
    }
  };

  root.ShionReadingEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
