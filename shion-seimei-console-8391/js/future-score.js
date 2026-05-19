(function (root, factory) {
  let tarot78 = root.ShionTarot78;

  if (typeof require === 'function' && (!tarot78 || typeof module !== 'undefined')) {
    try {
      tarot78 = require('./tarot-78.js');
    } catch (error) {
      tarot78 = null;
    }
  }

  const api = factory(tarot78 || {});

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionFutureScore = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (DefaultTarot78) {
  'use strict';

  const ELEMENT_MONTHS = {
    木: [2, 3],
    火: [5, 6],
    土: [1, 4, 7, 10],
    金: [8, 9],
    水: [11, 12]
  };

  const TOPIC_BONUS = {
    恋愛: { key: 'loveScore', amount: 8 },
    仕事: { key: 'workScore', amount: 8 },
    金運: { key: 'moneyScore', amount: 8 },
    人間関係: { key: 'relationshipScore', amount: 8 },
    総合: { key: 'turningPointScore', amount: 4 },
    今月の運勢: { key: 'turningPointScore', amount: 4 }
  };

  const MAIN_THEMES = [
    '始動',
    '確認',
    '手放し',
    '再構築',
    '種まき',
    '土台作り',
    '関係修復',
    '方向転換',
    '決断',
    '習慣化',
    '収入整理',
    '魅力発信',
    '自己表現',
    '距離感調整',
    '休息',
    '再挑戦',
    '対話の再開',
    '本音の整理',
    '未来設計',
    '現実化',
    '優先順位',
    '役割の見直し',
    '安心の確認',
    '言葉の整理',
    '選び直し',
    '生活の立て直し',
    '約束の確認',
    '気持ちの置き直し'
  ];

  const SUB_THEMES = [
    '今できる一歩',
    '信頼の確認',
    '感情の整理',
    '余白作り',
    '準備の完了',
    'リズムの調整',
    '言葉にする',
    '形にする',
    '対話',
    '回復',
    '見直し',
    '育成',
    '学び',
    '境界線',
    '本音の確認',
    '現実的な判断',
    '反応を見る',
    '手応えを残す',
    '無理を減らす',
    '続け方を変える',
    '優先順位を決める',
    '一度立ち止まる',
    '選ぶ理由を持つ'
  ];

  const ELEMENT_ACTIONS = {
    木: [
      'まず一つ始める',
      '言葉にして外へ出す',
      '未来の種をまく',
      '考えを形にする',
      '新しい入口を作る'
    ],
    火: [
      '表現する',
      '喜びを戻す',
      '熱量を育てる',
      '気持ちを見せる',
      '自分の魅力を隠さない'
    ],
    土: [
      '足場を作る',
      '現実を見直す',
      '続けられる形にする',
      '生活のリズムを戻す',
      '守るものを決める'
    ],
    金: [
      '選び直す',
      '不要なものを手放す',
      '判断をはっきりさせる',
      '優先順位を決める',
      '曖昧なものを分ける'
    ],
    水: [
      '気持ちを流す',
      '本音を受け取る',
      '不安を言葉にする',
      '心の声を聞く',
      '一人で抱えすぎない'
    ]
  };

  function text(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    const trimmed = String(value).trim();
    return trimmed === '' ? fallback : trimmed;
  }

  function clamp(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function hash(value) {
    const str = text(value);
    let h = 2166136261;

    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }

    return Math.abs(h >>> 0);
  }

  function pick(list, seed, salt = '') {
    if (!Array.isArray(list) || !list.length) return '';
    return list[hash(`${seed}:${salt}`) % list.length];
  }

  function unique(values) {
    return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
  }

  function monthAffinity(element, month) {
    return (ELEMENT_MONTHS[element] || []).includes(month) ? 10 : 0;
  }

  function getBirthSeed(input) {
    return hash([
      input && input.birthDate,
      input && input.name,
      input && input.topic,
      input && input.targetYear
    ].join('|'));
  }

  function normalizeYear(input) {
    const currentYear = new Date().getFullYear();
    const year = Number(input && input.targetYear);

    return Number.isInteger(year) && year >= 1900 && year <= 2200
      ? year
      : currentYear;
  }

  function getWeakestElement(chart) {
    if (
      chart &&
      chart.fiveElements &&
      Array.isArray(chart.fiveElements.weakest) &&
      chart.fiveElements.weakest.length
    ) {
      return chart.fiveElements.weakest[0];
    }

    return '';
  }

  function getStrongestElement(chart, fallback = '') {
    if (
      chart &&
      chart.fiveElements &&
      Array.isArray(chart.fiveElements.strongest) &&
      chart.fiveElements.strongest.length
    ) {
      return chart.fiveElements.strongest[0];
    }

    return fallback;
  }

  function getDayElement(chart) {
    return chart && chart.sanmeiReference
      ? text(chart.sanmeiReference.element, '')
      : '';
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

      const pulse = (hash(`${card.id}:${month}:${index}`) % 17) - 8;

      if (card.category === 'major') {
        acc.turning += 9 + Math.max(0, pulse);

        if ([15, 16, 18].includes(card.number)) {
          acc.caution += 8;
        }
      }

      if (card.category === 'ace') {
        acc.love += 4;
        acc.work += 4;
        acc.money += card.suit === 'pentacles' ? 8 : 3;
      }

      if (card.category === 'court') {
        acc.love += 5;
        acc.relationship += 8;
      }

      if (card.category === 'numbered') {
        acc.work += 3;
        acc.money += card.suit === 'pentacles' ? 5 : 1;
      }

      if (card.suit === 'cups') acc.love += 6;
      if (card.suit === 'wands') acc.work += 5;
      if (card.suit === 'swords') acc.caution += 5;
      if (card.suit === 'pentacles') acc.money += 6;

      acc.cards.push(card.nameJa);
      return acc;
    }, {
      love: 0,
      work: 0,
      money: 0,
      relationship: 0,
      caution: 0,
      turning: 0,
      cards: []
    });
  }

  function pickThemes(month, seed, chart) {
    const weakest = getWeakestElement(chart);
    const main = pick(MAIN_THEMES, seed, `main:${month}`) || '見直し';
    const sub = pick(SUB_THEMES, seed, `sub:${month}`) || '今できる一歩';
    const elementActions = ELEMENT_ACTIONS[weakest] || [];

    const elementTheme = elementActions.length
      ? pick(elementActions, seed, `element:${month}`)
      : pick(MAIN_THEMES, seed, `fallback:${month}`) || '準備';

    return unique([main, sub, elementTheme]).slice(0, 3);
  }

  function getMonthType(score) {
    if (!score) return '整える月';

    const love = Number(score.loveScore || 0);
    const work = Number(score.workScore || 0);
    const money = Number(score.moneyScore || 0);
    const relationship = Number(score.relationshipScore || 0);
    const caution = Number(score.cautionScore || 0);
    const turning = Number(score.turningPointScore || 0);

    const activityPeak = Math.max(love, work, money, relationship);
    const activityAverage = (love + work + money + relationship) / 4;

    if (turning >= 76) return '転換期';
    if (caution >= 68) return '慎重月';
    if (activityPeak >= 74 || activityAverage >= 70) return '追い風月';

    return '整える月';
  }

  function topicHint(topic) {
    if (topic === '恋愛') {
      return '相手の気持ちを追いかけるより、自分の心が安心できるかを見てほしい時期です';
    }

    if (topic === '仕事') {
      return '頑張る量より、力を注ぐ場所を選ぶことが大事になります';
    }

    if (topic === '金運') {
      return '不安を溜め込まず、お金の入口と出口を分けて見たい時期です';
    }

    if (topic === '人間関係') {
      return '無理に合わせるより、続けられる距離感を見つけたい時期です';
    }

    return '今の自分に合った進み方を選びやすい時期です';
  }

  function buildThemeText(score) {
    if (!score) return '今月は、無理に急がず自分のペースを大切にしたい月です。';

    const themes = Array.isArray(score.themes) ? score.themes : [];
    const main = themes[0] || '見直し';
    const sub = themes[1] || '今できる一歩';
    const support = themes[2] || '';
    const label = score.label || `${score.month}月`;
    const type = score.monthType || getMonthType(score);
    const hint = topicHint(score.topic || '総合');

    if (type === '追い風月') {
      return `${label}は「${main}」が表に出やすい月です。${hint}。${sub}を意識すると、待っていた反応が返ってきやすくなります。`;
    }

    if (type === '慎重月') {
      return `${label}は「${main}」を急がず扱いたい月です。${hint}。すぐに決めず、${sub}を挟むことで気持ちが落ち着きます。`;
    }

    if (type === '転換期') {
      return `${label}は「${main}」をきっかけに、気持ちの向きが変わりやすい月です。${hint}。${sub}を通して、次に選びたいものが見えてきます。`;
    }

    if (support) {
      return `${label}は「${main}」と「${support}」を見直す月です。${hint}。派手に動くより、続けられる形へ直す方が後の力になります。`;
    }

    return `${label}は「${main}」を丁寧に扱いたい月です。${hint}。焦らず、今できることから順番に見てください。`;
  }

  function buildMonthlyAction(score) {
    if (!score) return '今月できることを一つ選び、無理のない範囲で続けてみる。';

    const topic = score.topic || '総合';
    const themes = Array.isArray(score.themes) ? score.themes : [];
    const main = themes[0] || '見直し';
    const type = score.monthType || getMonthType(score);

    if (topic === '恋愛') {
      if (type === '追い風月') return '伝えたい気持ちを短い言葉にして、勇気を出して送ってみる。';
      if (type === '慎重月') return '相手の反応だけで決めず、自分が安心できているかを確かめる。';
      if (type === '転換期') return 'この関係で本当に望んでいることを、紙に書き出してみる。';
      return '待つ時間が苦しいときは、自分の気持ちを一度言葉にする。';
    }

    if (topic === '仕事') {
      if (type === '追い風月') return '今見せたい成果やアイデアを、一つだけ外に出してみる。';
      if (type === '慎重月') return '抱えている仕事を、続けるものと手放すものに分けてみる。';
      if (type === '転換期') return '今の働き方で変えたいところを一つ明確にする。';
      return '役割や優先順位を見直し、力を使う場所を絞ってみる。';
    }

    if (topic === '金運') {
      if (type === '追い風月') return '収入につながりそうな行動を、一つだけ試してみる。';
      if (type === '慎重月') return '大きな支出や契約は、一度時間を置いてから決める。';
      if (type === '転換期') return 'お金の使い方で変えたい習慣を一つ見つける。';
      return '固定費か毎日の支出を一つ見直してみる。';
    }

    if (topic === '人間関係') {
      if (type === '追い風月') return '気になっている相手に、短い言葉で近況を伝えてみる。';
      if (type === '慎重月') return '返事を急がず、自分の本音を一度確認してから返す。';
      if (type === '転換期') return '無理を感じている関係を一つ見直してみる。';
      return '心が疲れる距離感を、少しだけ調整してみる。';
    }

    if (type === '追い風月') return `「${main}」につながることを一つ、外に出してみる。`;
    if (type === '慎重月') return '大事な返事や約束は、すぐ決めず一度確認する。';
    if (type === '転換期') return '今の違和感や「変えたい」と思うことを書き出してみる。';

    return '予定や気持ちを一つ見直し、心に余白を作る。';
  }

  function buildMonthlyKeyword(score) {
    if (!score) return '焦らず、今できることから';

    const type = score.monthType || getMonthType(score);
    const topic = score.topic || '総合';
    const themes = Array.isArray(score.themes) ? score.themes : [];
    const main = themes[0] || '';

    const phrases = {
      追い風月: [
        '動けば、道は応えてくれる',
        '一歩が出せば、手応えもついてくる',
        '今出す勇気が、次の扉を開く',
        main ? `${main}を出すことで、景色が変わる` : '出すことから始まる'
      ],
      慎重月: [
        '急がない勇気も、前に進む力になる',
        '確認するほど、心は軽くなる',
        '立ち止まることも、大切な一歩',
        '一呼吸置くことで、選び方が変わる'
      ],
      転換期: [
        '選び直すことで、世界が変わり始める',
        '違和感は、次の道を示してくれる',
        '迷いの奥に、本当の気持ちがある',
        '変えたい気持ちを、大切に受け止める'
      ],
      整える月: [
        '余白が、次の力を生む',
        '足元を見直すと、心も戻ってくる',
        '続けられる形が、未来を作る',
        '今できることだけで、十分に前へ'
      ]
    };

    const list = phrases[type] || phrases['整える月'];
    return pick(list, hash(`${score.month}:${topic}:${main}`), 'keyword') || list[0];
  }

  function buildCautionText(score) {
    if (!score) return '';

    const caution = Number(score.cautionScore || 0);
    const type = score.monthType || getMonthType(score);

    if (caution >= 75) {
      return 'この月は勢い任せを控えたい時期です。大事な約束・支出・強い言葉は、一呼吸置いてから決めることをおすすめします。';
    }

    if (caution >= 65 || type === '慎重月') {
      return '無理に前へ進めるより、予定や言葉を一度見直すと安心できる月です。焦りは禁物です。';
    }

    if ((type === '追い風月' || type === '転換期') && caution >= 58) {
      return '動きやすい時期ですが、勢いだけで決めると後で直したくなるかもしれません。大事なことほど一度確認してください。';
    }

    return '';
  }

  function buildMonthLead(score) {
    if (!score) return '今月は、自分のペースを大切にしながら進みたい月です。';

    const label = score.label || `${score.month}月`;
    const type = score.monthType || getMonthType(score);
    const hint = topicHint(score.topic);

    if (type === '追い風月') {
      return `${label}は追い風の吹く月です。${hint}。行動したことに反応が返ってきやすくなります。`;
    }

    if (type === '慎重月') {
      return `${label}は慎重に進みたい月です。急がず確認を入れることで、余計な不安を減らせます。`;
    }

    if (type === '転換期') {
      return `${label}は転換期です。気持ちや状況の向きが変わりやすい時期です。違和感に素直になることが大切です。`;
    }

    return `${label}は足元を見直す月です。${hint}。焦らず準備することで、後半の動きが楽になります。`;
  }

  function buildNote(score) {
    if (!score) return '今できることから順番に';

    const type = score.monthType || getMonthType(score);

    if (type === '追い風月') return '行動が反応につながりやすい月';
    if (type === '慎重月') return '確認と休息を優先したい月';
    if (type === '転換期') return '選び直しが起こりやすい月';

    return '準備や見直しに向く月';
  }

  function buildFutureScores(input = {}, chart = {}, tarotEntries = [], tarot78) {
    const safeInput = input || {};
    const year = normalizeYear(safeInput);
    const seed = getBirthSeed({ ...safeInput, targetYear: year });
    const dayElement = getDayElement(chart);
    const strongest = getStrongestElement(chart, dayElement);
    const topic = text(safeInput.topic, '総合');
    const bonus = TOPIC_BONUS[topic] || TOPIC_BONUS['総合'];

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const wave = (seed + year * (month + 7) + month * 31) % 29;
      const affinity = monthAffinity(dayElement, month) + Math.floor(monthAffinity(strongest, month) / 2);
      const tarot = tarotInfluence(tarotEntries, tarot78, month);
      const base = 42 + wave + affinity;

      const score = {
        month,
        label: `${month}月`,
        topic,
        loveScore: clamp(base + (month % 3) * 4 + tarot.love),
        workScore: clamp(base + ((month + 1) % 4) * 3 + tarot.work),
        moneyScore: clamp(base + ((month + 2) % 5) * 2 + tarot.money),
        relationshipScore: clamp(base + ((month + 3) % 4) * 3 + tarot.relationship),
        cautionScore: clamp(
          34 +
          ((seed >>> (month % 8)) % 31) +
          (month % 4 === 0 ? 12 : 0) +
          tarot.caution -
          Math.floor(affinity / 2)
        ),
        turningPointScore: clamp(
          38 +
          wave +
          affinity +
          (month === ((seed % 12) + 1) ? 18 : 0) +
          tarot.turning
        ),
        themes: pickThemes(month, seed, chart),
        cards: unique(tarot.cards).slice(0, 2),
        note: ''
      };

      if (bonus && bonus.key && score[bonus.key] !== undefined) {
        score[bonus.key] = clamp(score[bonus.key] + bonus.amount);
      }

      score.monthType = getMonthType(score);
      score.monthLead = buildMonthLead(score);
      score.themeText = buildThemeText(score);
      score.monthlyAction = buildMonthlyAction(score);
      score.monthlyKeyword = buildMonthlyKeyword(score);
      score.cautionText = buildCautionText(score);
      score.note = buildNote(score);

      return score;
    });
  }

  function getTopMonths(scores = [], key, count = 3) {
    if (!Array.isArray(scores) || !scores.length) return [];

    const limit = Number.isInteger(Number(count)) && Number(count) > 0
      ? Number(count)
      : 3;

    return scores
      .filter((item) => item && Number.isFinite(Number(item[key])))
      .slice()
      .sort((a, b) => (Number(b[key]) - Number(a[key])) || (Number(a.month) - Number(b.month)))
      .slice(0, limit);
  }

  function getTurningPointMonths(scores, count = 3) {
    return getTopMonths(scores, 'turningPointScore', count);
  }

  function getCautionMonths(scores, count = 3) {
    return getTopMonths(scores, 'cautionScore', count);
  }

  function getLoveOpportunityMonths(scores, count = 3) {
    return getTopMonths(scores, 'loveScore', count);
  }

  function getWorkMoneyMonths(scores, count = 3) {
    const merged = Array.isArray(scores)
      ? scores.map((item) => ({
          ...item,
          workMoneyScore: Math.round(((item.workScore || 0) + (item.moneyScore || 0)) / 2)
        }))
      : [];

    return getTopMonths(merged, 'workMoneyScore', count);
  }

  return {
    buildFutureScores,
    getTopMonths,
    getTurningPointMonths,
    getCautionMonths,
    getLoveOpportunityMonths,
    getWorkMoneyMonths
  };
});
