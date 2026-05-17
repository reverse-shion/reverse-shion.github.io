(function (root, factory) {
  const data = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  root.ShionSanmeiData = data;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const STEMS = [
    { id:'kou', name:'甲', element:'木', yinYang:'陽', symbol:'大樹', essence:'理想、成長、信念、まっすぐさ', caution:'頑固さ、理想先行' },
    { id:'otsu', name:'乙', element:'木', yinYang:'陰', symbol:'草花', essence:'柔軟性、調和、しなやかな生命力', caution:'合わせすぎ、迷いやすさ' },
    { id:'hei', name:'丙', element:'火', yinYang:'陽', symbol:'太陽', essence:'明るさ、表現、中心性、発信力', caution:'焦り、目立ちすぎ、燃え尽き' },
    { id:'tei', name:'丁', element:'火', yinYang:'陰', symbol:'灯火', essence:'感性、集中、内なる情熱、繊細な光', caution:'気分の揺れ、抱え込み' },
    { id:'bo', name:'戊', element:'土', yinYang:'陽', symbol:'山', essence:'安定、信頼、包容、現実の土台', caution:'動き出しの重さ、変化への抵抗' },
    { id:'ki', name:'己', element:'土', yinYang:'陰', symbol:'田畑', essence:'育成、調整、現実感覚、積み上げ', caution:'抱え込み、心配性、自己犠牲' },
    { id:'koukin', name:'庚', element:'金', yinYang:'陽', symbol:'鋼', essence:'決断、改革、実行、突破力', caution:'厳しさ、衝突、白黒思考' },
    { id:'shin', name:'辛', element:'金', yinYang:'陰', symbol:'宝石', essence:'美意識、繊細さ、完成度、品格', caution:'傷つきやすさ、完璧主義' },
    { id:'jin', name:'壬', element:'水', yinYang:'陽', symbol:'大海', essence:'自由、知性、スケール、流動性', caution:'散漫、定まらなさ' },
    { id:'kiwater', name:'癸', element:'水', yinYang:'陰', symbol:'雨露', essence:'直感、観察、浸透力、静かな優しさ', caution:'不安、迷い、感情の溜め込み' }
  ];
  const BRANCHES = [
    { name:'子', element:'水', yinYang:'陽', season:'冬' }, { name:'丑', element:'土', yinYang:'陰', season:'冬土用' },
    { name:'寅', element:'木', yinYang:'陽', season:'春' }, { name:'卯', element:'木', yinYang:'陰', season:'春' },
    { name:'辰', element:'土', yinYang:'陽', season:'春土用' }, { name:'巳', element:'火', yinYang:'陰', season:'夏' },
    { name:'午', element:'火', yinYang:'陽', season:'夏' }, { name:'未', element:'土', yinYang:'陰', season:'夏土用' },
    { name:'申', element:'金', yinYang:'陽', season:'秋' }, { name:'酉', element:'金', yinYang:'陰', season:'秋' },
    { name:'戌', element:'土', yinYang:'陽', season:'秋土用' }, { name:'亥', element:'水', yinYang:'陰', season:'冬' }
  ];
  const ELEMENTS = ['木','火','土','金','水'];
  const STEM_TO_SEIMEI = {
    '甲': { base:'pioneer', sub:'hope', cards:['皇帝','魔術師','戦車'] },
    '乙': { base:'choice', sub:'harmony', cards:['女帝','節制','恋人'] },
    '丙': { base:'radiance', sub:'hope', cards:['太陽','力','審判'] },
    '丁': { base:'quest', sub:'hope', cards:['女教皇','星','隠者'] },
    '戊': { base:'reality', sub:'trust', cards:['皇帝','世界','教皇'] },
    '己': { base:'guardian', sub:'trust', cards:['女帝','教皇','節制'] },
    '庚': { base:'rebirth', sub:'pioneer', cards:['正義','戦車','塔'] },
    '辛': { base:'harmony', sub:'quest', cards:['正義','女教皇','死神'] },
    '壬': { base:'journey', sub:'dream', cards:['運命の輪','愚者','月'] },
    '癸': { base:'dream', sub:'quest', cards:['月','女教皇','吊るされた男'] }
  };
  const ELEMENT_NUANCE = {
    '木':'開拓、希望、選択のニュアンスが強まりやすいです。',
    '火':'輝命、希望、行動のニュアンスが強まりやすいです。',
    '土':'現実、信頼、守護のニュアンスが強まりやすいです。',
    '金':'調律、再生、決断のニュアンスが強まりやすいです。',
    '水':'夢幻、旅路、探究のニュアンスが強まりやすいです。'
  };
  const topicTemplates = { '総合':'全体の流れを整える', '恋愛':'気持ちと言葉の一致を見る', '仕事':'役割と条件を整理する', '金運':'お金の流れを整える', '人間関係':'距離感と伝え方を見直す', '今月の運勢':'今月の優先順位を絞る' };
  const typeSeed = {
    pioneer:['開拓の星命','新しい道を切り開く人','理想を現実に近づける推進力','恋では誠実さと未来への約束を大切にします','未整備の場所で力を発揮します','投機的な断定より、計画と継続が安心を作ります','率直さが魅力ですが、相手の速度も尊重すると整います','急ぎすぎ、正しさを押し出しすぎること','小さな一歩を具体化してください','道は、最初の一歩で星の形を変えます。'],
    harmony:['調律の星命','場を整え美しく調和させる人','違いをつなぐ繊細な調整力','恋では安心できる対話が鍵です','品質管理や仲介で光ります','収支の見える化が心の余白になります','相手に合わせすぎず、自分の基準を持つと安定します','完璧主義、遠慮しすぎ','優先順位を三つに絞りましょう','整った音は、静かな自信になります。'],
    quest:['探究の星命','深く見つめ本質を拾う人','観察力と洞察の深さ','恋では急がず信頼を積み上げます','研究、企画、専門性で強みが出ます','学びへの投資は目的を決めると実りやすいです','一人時間と共有時間のバランスが大切です','考え込み、孤立','言葉にして外へ出しましょう','静かな問いが、次の光を連れてきます。'],
    guardian:['守護の星命','大切なものを育て守る人','包容力と継続する力','恋では生活の安心感を重んじます','育成、支援、運営で信頼されます','固定費の見直しで土台が整います','面倒を見すぎず境界線を置きましょう','抱え込み、自己犠牲','頼る先を一つ決めてください','守る手は、自分自身にも向けて大丈夫です。'],
    rebirth:['再生の星命','終わりを力に変え立て直す人','決断力と切り替えの強さ','恋では曖昧さより誠実な確認が合います','改革、改善、再設計で能力が出ます','不要な支出の整理が再生の入口です','言葉が鋭くなりすぎない工夫が助けになります','白黒思考、急な断絶','残すものと手放すものを書き出しましょう','壊すためでなく、整えて生まれ変わるための星です。'],
    hope:['希望の星命','人に光を思い出させる人','明るさと未来を描く力','恋では笑顔と励ましが魅力です','発信、表現、教育で輝きます','勢いの出費は一晩置くと整います','期待を背負いすぎず休む時間も大切です','燃え尽き、楽観しすぎ','今日できる明るい行動を一つ選びましょう','希望は、現実に置いた小さな灯りです。'],
    reality:['現実の星命','形にして積み上げる人','安定感と責任ある実行力','恋では信頼と約束を大切にします','管理、経営、仕組み作りで強いです','長期計画で安心が育ちます','頑固になりすぎず相談を入れると進みます','変化への抵抗','期限と手順を決めてください','現実を整えるほど、星は近く見えます。'],
    choice:['選択の星命','可能性を見比べ最善を選ぶ人','柔軟性と対話力','恋では選ぶ理由を言葉にすると安定します','接客、編集、調整役に向きます','選択肢を増やしすぎない管理が必要です','迷った時ほど基準を紙に書くと整います','迷い、優柔不断','判断基準を一つ決めましょう','選ぶことは、未来に名前をつけることです。'],
    radiance:['輝命の星命','存在そのもので周囲を照らす人','表現力と場を明るくする力','恋では素直な好意表現が魅力です','舞台、広報、リーダー役で輝きます','見栄の支出より価値ある投資を選びましょう','注目されるほど聞く姿勢が信頼になります','焦り、目立ちすぎ','発信前に目的を一文で整えましょう','あなたの光は、誰かの道しるべになります。'],
    journey:['旅路の星命','流れを読み広い世界へ進む人','自由さと知性の広がり','恋では束縛より理解が必要です','移動、情報、企画横断で活きます','複数の収入導線は管理表があると安心です','距離を置く前に説明を添えると誤解が減ります','散漫、定まらなさ','今週の目的地を一つ決めましょう','旅の途中にも、帰れる星があります。'],
    dream:['夢幻の星命','見えない気配を受け取る人','直感と癒しの感性','恋では感情を決めつけず確認が鍵です','創作、相談、感性領域で深みが出ます','不安買いを避け、安心の仕組みを作りましょう','察しすぎず言葉で確かめると整います','不安、溜め込み','眠る前に心配を紙へ預けましょう','夢は逃げ場ではなく、心の羅針盤です。'],
    trust:['信頼の星命','時間をかけて信頼を築く人','誠実さと安定した支え','恋では約束の積み重ねが愛情表現です','組織運営、相談役、長期案件で頼られます','堅実な管理で安心を増やせます','我慢を当然にしないことが関係を守ります','保守的、言い出せない','小さな希望を一つ伝えましょう','信頼は、静かに積もる星の光です。']
  };
  const SEIMEI_TYPES = Object.fromEntries(Object.entries(typeSeed).map(([id, a]) => [id, {
    id, name:a[0], shortTitle:a[1], essence:a[2], strength:a[2], love:a[3], work:a[4], money:a[5], relationship:a[6], shadow:a[7], advice:a[8], message:a[9],
    resonantTarotCards: [], templateByTopic: Object.fromEntries(Object.keys(topicTemplates).map(t => [t, `${topicTemplates[t]}ことが、${a[0]}の力を穏やかに活かす道しるべになります。`]))
  }]));
  Object.values(STEM_TO_SEIMEI).forEach(m => { if (SEIMEI_TYPES[m.base]) SEIMEI_TYPES[m.base].resonantTarotCards = m.cards; });
  return { STEMS, BRANCHES, ELEMENTS, STEM_TO_SEIMEI, SEIMEI_TYPES, ELEMENT_NUANCE };
});
