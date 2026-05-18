(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionTarot78 = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const SUITS = {
    wands: { ja: 'ワンド', theme: '情熱・行動・発信', element: '火' },
    cups: { ja: 'カップ', theme: '感情・愛情・受容', element: '水' },
    swords: { ja: 'ソード', theme: '思考・判断・言葉', element: '風' },
    pentacles: { ja: 'ペンタクル', theme: '現実・仕事・お金', element: '土' }
  };

  const MAJORS = [
    [0, '愚者', 'The Fool', ['自由', '始まり', '可能性']],
    [1, '魔術師', 'The Magician', ['創造', '技能', '意志']],
    [2, '女教皇', 'The High Priestess', ['直感', '静けさ', '洞察']],
    [3, '女帝', 'The Empress', ['育成', '愛情', '豊かさ']],
    [4, '皇帝', 'The Emperor', ['土台', '責任', '決断']],
    [5, '教皇', 'The Hierophant', ['信頼', '学び', '導き']],
    [6, '恋人', 'The Lovers', ['選択', '関係', '調和']],
    [7, '戦車', 'The Chariot', ['前進', '集中', '突破']],
    [8, '力', 'Strength', ['勇気', '忍耐', '優しさ']],
    [9, '隠者', 'The Hermit', ['内省', '探求', '準備']],
    [10, '運命の輪', 'Wheel of Fortune', ['転機', '循環', '流れ']],
    [11, '正義', 'Justice', ['均衡', '判断', '整理']],
    [12, '吊るされた男', 'The Hanged Man', ['視点転換', '待つ力', '受容']],
    [13, '死神', 'Death', ['区切り', '再生', '手放し']],
    [14, '節制', 'Temperance', ['調整', '回復', '統合']],
    [15, '悪魔', 'The Devil', ['執着', '欲求', '見直し']],
    [16, '塔', 'The Tower', ['気づき', '再構築', '解放']],
    [17, '星', 'The Star', ['希望', '癒し', '未来']],
    [18, '月', 'The Moon', ['不安', '直感', '確認']],
    [19, '太陽', 'The Sun', ['喜び', '明るさ', '成果']],
    [20, '審判', 'Judgement', ['再出発', '目覚め', '選び直し']],
    [21, '世界', 'The World', ['完成', '統合', '一区切り']]
  ];

  const NUMBER_KEYWORDS = {
    1: ['始まり', '種', 'きっかけ'],
    2: ['選択', '関係', '調整'],
    3: ['成長', '表現', '協力'],
    4: ['安定', '土台', '維持'],
    5: ['揺れ', '変化', '学び'],
    6: ['調和', '回復', '分かち合い'],
    7: ['探求', '見極め', '集中'],
    8: ['継続', '力', '整備'],
    9: ['成熟', '成果', '内省'],
    10: ['完成', '次の段階', '循環']
  };

  const COURTS = [
    ['page', 'ペイジ', 'Page', ['知らせ', '学び', '純粋さ']],
    ['knight', 'ナイト', 'Knight', ['行動', '接近', '勢い']],
    ['queen', 'クイーン', 'Queen', ['受容', '成熟', '育成']],
    ['king', 'キング', 'King', ['責任', '判断', '統率']]
  ];

  function pad(value) { return String(value).padStart(2, '0'); }
  function sentence(nameJa, theme, focus) { return `${nameJa}は、${theme}を通して${focus}を整えやすい象徴です。`; }
  function baseCard(id, category, number, rank, suit, nameJa, nameEn, keywords, role) {
    const theme = suit && SUITS[suit] ? SUITS[suit].theme : role;
    return {
      id, category, number, rank, suit, nameJa, nameEn, keywords,
      loveMeaning: sentence(nameJa, theme, '気持ちの伝え方や距離感'),
      workMeaning: sentence(nameJa, theme, '役割、発信、評価の受け取り方'),
      moneyMeaning: sentence(nameJa, theme, '支出と収入の入口'),
      relationshipMeaning: sentence(nameJa, theme, '信頼と対話'),
      timingMeaning: `${nameJa}は、${role}が表に出やすい時期を示します。焦らず現実の小さな変化を見てください。`,
      personImage: `${theme}をまとい、${keywords[0]}を周囲に運ぶ人物像です。`,
      light: `${keywords[0]}が自然に働き、次の一歩を選びやすくなります。`,
      shadow: `${keywords[1] || keywords[0]}に偏ると、状況を急いで決めたくなることがあります。`,
      actionAdvice: `${keywords[2] || keywords[0]}を意識して、今日できる確認を一つ選んでください。`,
      caution: '断定や焦りを避け、事実・気持ち・次の行動を分けて扱ってください。'
    };
  }

  const majorCards = MAJORS.map(([number, nameJa, nameEn, keywords]) =>
    baseCard(`major_${pad(number)}`, 'major', number, null, null, nameJa, nameEn, keywords, '人生テーマや大きな転換期')
  );

  const aceCards = Object.keys(SUITS).map((suit) => {
    const suitData = SUITS[suit];
    return baseCard(`ace_${suit}`, 'ace', 1, 'ace', suit, `${suitData.ja}のエース`, `Ace of ${suitData.ja === 'ペンタクル' ? 'Pentacles' : suitData.ja === 'ソード' ? 'Swords' : suitData.ja === 'カップ' ? 'Cups' : 'Wands'}`, NUMBER_KEYWORDS[1].concat([suitData.theme]), '新しいチャンスや始まり');
  });

  const numberedCards = Object.keys(SUITS).flatMap((suit) => {
    const suitData = SUITS[suit];
    const enSuit = suit === 'wands' ? 'Wands' : suit === 'cups' ? 'Cups' : suit === 'swords' ? 'Swords' : 'Pentacles';
    return Array.from({ length: 9 }, (_, index) => {
      const number = index + 2;
      return baseCard(`${suit}_${pad(number)}`, 'numbered', number, null, suit, `${suitData.ja}の${number}`, `${number} of ${enSuit}`, NUMBER_KEYWORDS[number].concat([suitData.theme]), '月別運勢や日常の流れ');
    });
  });

  const courtCards = Object.keys(SUITS).flatMap((suit) => {
    const suitData = SUITS[suit];
    const enSuit = suit === 'wands' ? 'Wands' : suit === 'cups' ? 'Cups' : suit === 'swords' ? 'Swords' : 'Pentacles';
    return COURTS.map(([rank, rankJa, rankEn, keywords]) =>
      baseCard(`${suit}_${rank}`, 'court', null, rank, suit, `${suitData.ja}の${rankJa}`, `${rankEn} of ${enSuit}`, keywords.concat([suitData.theme]), '人物像、出会い、関係性')
    );
  });

  const TAROT_78_CARDS = majorCards.concat(numberedCards, aceCards, courtCards);
  const byNormalizedName = (name) => String(name || '').trim().toLowerCase().replace(/[\s　]/g, '');

  function getTarot78ById(id) { return TAROT_78_CARDS.find((card) => card.id === id) || null; }
  function getTarot78ByName(name) {
    const key = byNormalizedName(name);
    return TAROT_78_CARDS.find((card) => byNormalizedName(card.nameJa) === key || byNormalizedName(card.nameEn) === key) || null;
  }
  function getTarot78ByCategory(category) { return TAROT_78_CARDS.filter((card) => card.category === category); }
  function getTarot78BySuit(suit) { return TAROT_78_CARDS.filter((card) => card.suit === suit); }

  return { TAROT_78_CARDS, getTarot78ById, getTarot78ByName, getTarot78ByCategory, getTarot78BySuit };
});
