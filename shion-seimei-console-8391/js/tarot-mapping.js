(function (root, factory) {
  const data = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  root.ShionTarotMapping = data;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const names = [
    ['fool',0,'愚者','The Fool','木'],['magician',1,'魔術師','The Magician','木'],['high-priestess',2,'女教皇','The High Priestess','水'],['empress',3,'女帝','The Empress','木'],['emperor',4,'皇帝','The Emperor','土'],['hierophant',5,'教皇','The Hierophant','土'],['lovers',6,'恋人','The Lovers','木'],['chariot',7,'戦車','The Chariot','火'],['strength',8,'力','Strength','火'],['hermit',9,'隠者','The Hermit','水'],['wheel',10,'運命の輪','Wheel of Fortune','水'],['justice',11,'正義','Justice','金'],['hanged-man',12,'吊るされた男','The Hanged Man','水'],['death',13,'死神','Death','金'],['temperance',14,'節制','Temperance','水'],['devil',15,'悪魔','The Devil','土'],['tower',16,'塔','The Tower','金'],['star',17,'星','The Star','木'],['moon',18,'月','The Moon','水'],['sun',19,'太陽','The Sun','火'],['judgement',20,'審判','Judgement','火'],['world',21,'世界','The World','土']
  ];
  const elementText = { 木:'成長、始まり、理想、発展', 火:'表現、情熱、直感、輝き', 土:'現実、安定、責任、蓄積', 金:'決断、整理、美意識、改革', 水:'感情、直感、癒し、深層心理' };
  const TAROT_CARDS = names.map(([id, number, nameJa, nameEn, element]) => ({
    id, number, nameJa, nameEn,
    uprightKeywords:['前進','気づき','整える'], reversedKeywords:['停滞','見直し','急がない'],
    uprightMeaning:`${nameJa}の正位置は、今見えている流れを現実的に活かすサインです。`,
    reversedMeaning:`${nameJa}の逆位置は、急いで決めず、内側と状況を整えるサインです。`,
    actionAdvice:'今日できる小さな確認と、次の一歩を一つだけ決めてください。',
    caution:'断定や焦りを避け、事実と言葉を丁寧に見てください。',
    elementResonance:{ element, text:elementText[element] },
    seimeiResonanceText:`${nameJa}は星命タイプの力を決めるものではなく、今の課題や行動指針と共鳴するカードです。`
  }));
  const SPREAD_POSITIONS = {
    1:['今のメッセージ'],
    3:['現在','課題','進む道'],
    5:['現在','宿命的テーマ','心のブレーキ','外側の状況','今取るべき行動']
  };
  const ELEMENT_TAROT_RESONANCE = { 木:['愚者','魔術師','女帝','星'], 火:['太陽','力','戦車','審判'], 土:['皇帝','教皇','世界','正義'], 金:['正義','塔','皇帝','死神'], 水:['女教皇','月','節制','吊るされた男'] };
  function findTarotByName(name) { return TAROT_CARDS.find(c => c.nameJa === name); }
  return { TAROT_CARDS, SPREAD_POSITIONS, ELEMENT_TAROT_RESONANCE, findTarotByName };
});
