window.ShionMessages = (function () {
  const arcana = () => window.ShionTarotData.majorArcana;

  const lifeChapterProfiles = Object.fromEntries(Array.from({ length: 22 }, (_, i) => [i, {
    core: `${arcana()?.[i]?.nameJa || 'この章'}の章では、人生全体の主題が表面だけでなく土台から問われます。`,
    shadow: '役割を守るほど、本音と現実のズレを見ないまま走りやすくなります。',
    question: 'いま守るものと、手放すものを言葉にできますか。'
  }]));

  const yearArcanaProfiles = {
    0:{yearTheme:'新章を軽やかに始める年',caution:'勢い任せで飛び出すと足場が浅くなりやすい',action:'小さな挑戦を一つ実験し、反応を見て調整する',summary:'始まりの風を受け取り、進路を確かめる年です。',tone:'始動'},
    1:{yearTheme:'意志と集中で可能性を具体化する年',caution:'同時進行を増やすほど焦点が散りやすい',action:'主軸を一点に決め、必要な道具と順番を揃える',summary:'力を一点に集めるほど手応えが増える年です。',tone:'集中'},
    2:{yearTheme:'知識・言葉・設計を深める年',caution:'答えを急ぐほど違和感を見落としやすい',action:'見えない準備、文章化、学び直しを進める',summary:'派手に動くより核を育てる年です。',tone:'内省'},
    3:{yearTheme:'育ててきた種に形と温度を与える年',caution:'広げすぎると育つ前に消耗しやすい',action:'作品・関係・商品を丁寧に育て、見える形へ出す',summary:'受け取る力と育てる力が高まる年です。',tone:'育成'},
    4:{yearTheme:'責任と現実の土台を固める年',caution:'曖昧な約束が後で負担になりやすい',action:'価格・契約・ルールを明確化する',summary:'感覚を現実の形へ落とし込む年です。',tone:'構築'},
    5:{yearTheme:'価値観を更新し学び直す年',caution:'正しさだけで押すと摩擦が増えやすい',action:'理念を言語化し、共有できる型にする',summary:'判断基準を磨き直す年です。',tone:'再定義'},
    6:{yearTheme:'選択と関係性の調律が進む年',caution:'迷いを保留すると機会が散る',action:'大事な約束を具体化し、動かす順番を決める',summary:'縁を育て直す年です。',tone:'選択'},
    7:{yearTheme:'推進力で停滞を突破する年',caution:'速さ偏重だと心身の余白が消える',action:'移動・発信・提案を計画的に加速する',summary:'前進が現実になる年です。',tone:'前進'},
    8:{yearTheme:'粘り強さで成果を作る年',caution:'我慢のしすぎは後半の失速を招く',action:'休息と鍛錬の周期を作り継続する',summary:'持久力が結果に変わる年です。',tone:'忍耐'},
    9:{yearTheme:'手放しと視点転換で再配置する年',caution:'損得だけで急ぐと学びを取りこぼす',action:'不要な予定と役割を減らして余地を作る',summary:'止まる勇気が進路を開く年です。',tone:'転換'},
    10:{yearTheme:'区切りと再生準備の年',caution:'古い形への執着が更新を遅らせる',action:'終えるものを決めて新基盤を組み直す',summary:'更新へ向かう節目の年です。',tone:'刷新'},
    11:{yearTheme:'均衡と調律で安定を育てる年',caution:'完璧主義で決断が遅れやすい',action:'時間・体力・資源配分を見える化する',summary:'ちょうどよさが力になる年です。',tone:'調和'},
    12:{yearTheme:'影の課題と向き合う年',caution:'恐れに呑まれると選択肢が狭くなる',action:'依存や惰性を一つずつ断ち切る',summary:'向き合うほど自由度が戻る年です。',tone:'解放'},
    13:{yearTheme:'突発的見直しで軌道修正する年',caution:'変化への抵抗が消耗を増やす',action:'崩れた前提を点検し順番を引き直す',summary:'壊れる出来事が再構築の合図になる年です。',tone:'再編'},
    14:{yearTheme:'希望と再接続し理想を描き直す年',caution:'夢先行だと実装が追いつかない',action:'理想を月単位の計画へ落とし込む',summary:'未来への信頼を取り戻す年です。',tone:'希望'},
    15:{yearTheme:'感受性が高まり内面の声が強まる年',caution:'想像と事実を混同しやすい',action:'情報を整え、安心できる習慣を継続する',summary:'曖昧さを丁寧に扱う年です。',tone:'感受'},
    16:{yearTheme:'達成と共有が広がる年',caution:'達成後の緩みが失速を招く',action:'成果を分かち合い次の循環へ橋を架ける',summary:'努力が実り、喜びが広がる年です。',tone:'成功'},
    17:{yearTheme:'目覚めの合図を受け取る年',caution:'過去への後悔に留まると機会を逃す',action:'呼ばれている役割を言語化して動く',summary:'転機への決断が冴える年です。',tone:'覚醒'},
    18:{yearTheme:'完成と統合で節目を迎える年',caution:'終わった流れを引き延ばすと次が遅れる',action:'達成を整理し新章への準備を終える',summary:'一巡の実りを受け取る年です。',tone:'統合'},
    19:{yearTheme:'公平性と整合性を重視する年',caution:'感情決定だけだと後で負担が残る',action:'条件・責任・分担を明文化する',summary:'線引きが信頼を生む年です。',tone:'均衡'},
    20:{yearTheme:'転換点を捉える年',caution:'好機でも準備不足では乗り切れない',action:'変化前提で計画を柔軟に組み直す',summary:'巡り合わせを活かせる年です。',tone:'転機'},
    21:{yearTheme:'大局判断で全体を束ねる年',caution:'抱え込みすぎると判断が鈍る',action:'境界線を守りながら全体最適で選ぶ',summary:'成熟した視点で統合する年です。',tone:'成熟'}
  };

  const genreLenses = {
    '総合': { focus: '抱えすぎた課題の再配置', avoid: '判断基準を増やし続ける動き', actionStyle: '生活全体の動かす順番を決める' },
    '恋愛': { focus: '相手だけでなく自分の不安の扱い', avoid: '不安埋めの確認連絡', actionStyle: '事実を見て短く誠実に伝える' },
    '復縁': { focus: '過去基準ではなく現在の距離感', avoid: '昔の温度を即座に求める姿勢', actionStyle: '安心して返せる接点を作る' },
    '片想い': { focus: '深読みより現実の接点づくり', avoid: '想像だけで結論を出すこと', actionStyle: '返信不要の軽い会話から始める' },
    '仕事': { focus: '成果に直結する行動の選別', avoid: '忙しさで前進した気になる行動', actionStyle: '成果に近い一件へ集中する' },
    '金運': { focus: '節約だけでなく収益導線の点検', avoid: '安心目的の準備ばかり増やすこと', actionStyle: '最も回収が近い導線を磨く' },
    '人間関係': { focus: '境界線の設計と自己消耗の回避', avoid: '違和感を飲み込む習慣', actionStyle: '会う頻度や返答速度に線を引く' },
    '人生の節目': { focus: '古い役割からの更新', avoid: '過去の成功基準への固着', actionStyle: '残す役割と終える役割を分ける' }
  };

  const formatJapaneseDistance = (km) => {
    const oku = Math.floor(km / 100000000);
    const man = Math.floor((km % 100000000) / 10000);
    if (oku > 0 && man > 0) return `${oku}億${man}万km`;
    if (oku > 0) return `${oku}億km`;
    if (man > 0) return `${man}万km`;
    return `${Math.round(km).toLocaleString('ja-JP')}km`;
  };

  function safeGenre(genre) { return genreLenses[genre] ? genre : '総合'; }

  function cardList(cards) { return (Array.isArray(cards) ? cards : []).filter(Boolean).slice(0, 3).join('・') || '未選択'; }

  function generateReadingMessage(params) {
    const genre = safeGenre(params.genre);
    const lens = genreLenses[genre];
    const life = lifeChapterProfiles[params.lifeChapterIndex] || lifeChapterProfiles[0];
    const year = yearArcanaProfiles[params.yearArcanaIndex] || yearArcanaProfiles[0];
    const distanceMain = formatJapaneseDistance(Number(params.cosmicDistance || 0));
    const distanceSub = `${Math.round(Number(params.cosmicDistance || 0)).toLocaleString('ja-JP')}km`;
    const tarot = cardList(params.tarotCards);

    return {
      conclusion: `結論から言います。今年は「${year.yearTheme}」が中心です。${genre}の悩みは、${lens.focus}に手をつけた瞬間に景色が変わります。`,
      current: `本当は、もう気づいているはずです。${life.core}${year.summary}${lens.avoid}を続けると、頑張っているのに空回りしやすい局面です。`,
      caution: `少し辛口で伝えます。いま苦しい理由は根性不足ではありません。ただ、${genre}では“やった気になる行動”に逃げやすい配置です。${year.caution}。${life.shadow}`,
      action: `今やるべき一歩は明確です。${lens.actionStyle}。さらに${year.action}。星命軌道は人生の大きな流線を示し、タロットは今この瞬間の選択を映します。共鳴カード（${tarot}）は、迷いを減らすために判断の軸を先に決めるよう促しています。`,
      starMessage: `あなたは生まれた日から今日まで、太陽系とともに約${distanceMain}を旅してきました（${distanceSub}）。過去の場所には戻れないからこそ、今いる地点に意味があります。星命軌道はあなたを決めつけるものではなく、今の章を照らす地図です。${life.question} 最後は大丈夫。選び直しは、いつでもここから始められます。`
    };
  }

  function buildYearCardMessage({ year, age, lifeIndex, yearIndex, genre }) {
    const lifeName = arcana()[lifeIndex].nameJa;
    const yearName = arcana()[yearIndex].nameJa;
    const life = lifeChapterProfiles[lifeIndex];
    const yp = yearArcanaProfiles[yearIndex];
    const lens = genreLenses[safeGenre(genre)];
    return {
      year, age, lifeName, yearName,
      conclusion: `${yp.tone}が主題となり、${lens.focus}に現実的な答えを出す年。`,
      theme: `${year}年は、人生章「${lifeName}」が示す長期課題を背景に、年運「${yearName}」の${yp.yearTheme}が表面化します。勢い任せより、どこに力を注ぐかを先に決めるほど結果が見えます。`,
      caution: `${yp.caution}。${life.shadow} 「${lens.avoid}」へ傾くと、動いているのに手応えが薄くなりやすいので要注意です。`,
      action: `${yp.action}。${lens.actionStyle}を今月の実践項目にし、ひとつ終えたら次へ進んでください。`
    };
  }

  return { generateReadingMessage, buildYearCardMessage, formatJapaneseDistance,
    build(topic, ctx) {
      return generateReadingMessage({ genre: topic || '総合', lifeChapterIndex: ctx.lifeChapterIndex, yearArcanaIndex: ctx.yearArcanaIndex, cosmicDistance: ctx.cosmicDistanceKm, tarotCards: [ctx.lifeArcana.nameJa, ctx.yearArcana.nameJa, window.ShionTarotData.majorArcana[ctx.map.arcanaId].nameJa] });
    }
  };
})();


window.ShionMessages.getCardThemeMeaning=function(card,theme){const m={love:"loveMeaning",relationship:"relationshipMeaning",work:"workMeaning",money:"moneyMeaning",general:"uprightMeaning"};const k=m[theme]||"uprightMeaning";return card?.[k]||card?.uprightMeaning||card?.humanMessage||"";};
window.ShionMessages.buildTarotCardReading=function(card,position,theme){const t=window.ShionMessages.getCardThemeMeaning(card,theme);return [`${position}に出た《${card.nameJa}》は、今のあなたに必要な視点を映しています。`,t,card.shadow?`ただ、${card.shadow}`:"",card.adjustment?`だから今は、${card.adjustment}`:"",card.actionAdvice?`今日できる一歩は、${card.actionAdvice}`:"","この小さな一歩が、未来の流れを少しずつ変えるきっかけになります。"].filter(Boolean).join("\n\n");};
window.ShionMessages.themeKey=function(topic){if(["恋愛","復縁","片想い"].includes(topic))return "love";if(topic==="人間関係")return "relationship";if(topic==="仕事")return "work";if(topic==="金運")return "money";return "general";};
window.ShionMessages.themeCTA=function(topic){const t=window.ShionMessages.themeKey(topic);const map={love:{body:"ここまでが、無料診断で見える大きな流れです。恋愛では相手の本音や連絡の可能性、動くべき時期など具体条件で答えが変わります。個人鑑定では、あなたの状況に合わせて丁寧に見ていきます。",btn:"相手の本音と今後の流れを詳しく見る"},relationship:{body:"ここまでが、無料診断で見える大きな流れです。人間関係の改善では、相手との距離感や言葉選びを個別に調整することが鍵になります。個人鑑定で具体的に整理できます。",btn:"相手との関係を詳しく見る"},work:{body:"ここまでが、無料診断で見える大きな流れです。仕事は現実条件で判断が変わるため、動く時期や優先順位まで具体化するには個人鑑定が向いています。",btn:"今後の方向性を個人鑑定で見る"},money:{body:"ここまでが、無料診断で見える大きな流れです。お金の不安は収入・支出・働き方の条件で答えが変わるため、個人鑑定で現実に合わせて詳しく見ていきます。",btn:"お金と今後の流れを詳しく見る"},general:{body:"ここまでが、無料診断で見える大きな流れです。あなたが引っかかった言葉を起点に、個人鑑定では時期や選択をさらに具体的に読み解けます。",btn:"個人鑑定でさらに深く見る"}};return map[t];};
