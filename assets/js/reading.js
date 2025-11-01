/* Re:verse Shion — 3-card Reading (flip + star + sound + poetic result) */
(() => {

  /* ✨ 星紋の光エフェクト */
  function createStarSymbol(target){
    const star = document.createElement('div');
    star.className = 'star-symbol';
    target.appendChild(star);
    star.animate(
      [{ transform:'scale(0)', opacity:1 }, { transform:'scale(1.5)', opacity:0 }],
      { duration:800, easing:'ease-out' }
    );
    setTimeout(()=> star.remove(), 800);
  }

  /* 🎵 効果音 */
  const tapSE  = new Audio('/assets/sfx/tap.mp3');
  const flipSE = new Audio('/assets/sfx/flip.mp3');
  document.addEventListener('pointerdown', ()=>{
    tapSE.muted=false; flipSE.muted=false;
  }, {once:true});
  
  /* --- Rider-Waite データ（表面画像＆詩鍵）--- */
  const CARDS = [
    { id:'00_fool',       name:'愚者',       key:['枠を超える','はじめの一歩','風を信じる'] },
    { id:'01_magician',   name:'魔術師',     key:['手の内にある','いま始める','言葉が現実になる'] },
    { id:'02_priestess',  name:'女教皇',     key:['沈黙が教える','見極める','澄んだ目で受け取る'] },
    { id:'03_empress',    name:'女帝',       key:['育てる喜び','受け取りの器','豊かさに気づく'] },
    { id:'04_emperor',    name:'皇帝',       key:['決める力','責任を引き受ける','土台を固める'] },
    { id:'05_hierophant', name:'教皇',       key:['信頼に寄る','正道を知る','助言を活かす'] },
    { id:'06_lovers',     name:'恋人',       key:['選ぶ勇気','結ぶ意思','心の声に従う'] },
    { id:'07_chariot',    name:'戦車',       key:['突破する','主導権を握る','進み続ける'] },
    { id:'08_strength',   name:'力',         key:['優しく制す','衝動を抱きしめる','微笑で進む'] },
    { id:'09_hermit',     name:'隠者',       key:['灯を内に','一人で整える','静かな答え'] },
    { id:'10_wheel',      name:'運命の輪',   key:['流れに乗る','タイミングを掴む','巡り合わせ'] },
    { id:'11_justice',    name:'正義',       key:['整える','均衡へ戻す','誠実に裁つ'] },
    { id:'12_hanged',     name:'吊るされた男', key:['視点反転','意味を変える','手放して軽く'] },
    { id:'13_death',      name:'死神',       key:['区切る','終わらせる','再生のはじまり'] },
    { id:'14_temperance', name:'節制',       key:['混ぜる','調和をつくる','ちょうど良さ'] },
    { id:'15_devil',      name:'悪魔',       key:['執着を識る','鎖を外す','快と恐れの統合'] },
    { id:'16_tower',      name:'塔',         key:['壊して更新','目を覚ます','偽りを抜ける'] },
    { id:'17_star',       name:'星',         key:['希望を見る','澄む','未来の光と接続'] },
    { id:'18_moon',       name:'月',         key:['不安を識る','影と向き合う','夜を渡る'] },
    { id:'19_sun',        name:'太陽',       key:['喜びへ','明るく進む','子どものように'] },
    { id:'20_judgement',  name:'審判',       key:['呼び覚ます','赦す','名を呼び立ち上がる'] },
    { id:'21_world',      name:'世界',       key:['完成','輪が満ちる','次の円環へ'] },
  ];

  /* 🔀 シャッフル関数 */
  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  /* 💫 クエリ補助 */
  const $  = (sel,el=document)=>el.querySelector(sel);
  const $$ = (sel,el=document)=>Array.from(el.querySelectorAll(sel));

  /* 🎴 要素取得 */
  const startBtn  = $('#readingStart');
  const resetBtn  = $('#readingReset');
  const deck      = $('#miniDeck');
  const slots     = $$('.card-slot', deck);
  const resultBox = $('#readingResult');

  if(!startBtn || !resetBtn || !deck || !slots.length || !resultBox) return;

  /* 状態管理 */
  let stack = [];
  let picked = {};

  /* 初期化 */
  function init(){
    picked = {};
    resultBox.hidden = true;
    slots.forEach((slot,i)=>{
      slot.innerHTML = `
        <button type="button" class="tarot-card" data-slot="${i+1}">
          <div class="card-inner">
            <div class="card-front"></div>
            <div class="card-back"></div>
          </div>
          <div class="card-caption"></div>
        </button>`;
    });
    resetBtn.disabled = true;
    startBtn.disabled = false;
  }

  /* シャッフル開始 */
  function startReading(){
    stack = shuffle(CARDS);
    startBtn.disabled = true;
    resetBtn.disabled = false;
    deck.classList.add('is-shuffling');
    setTimeout(()=> deck.classList.remove('is-shuffling'), 1000);

    slots.forEach(slot=>{
      const btn = slot.querySelector('.tarot-card');
      btn.disabled = false;
    });
  }

  /* カードをめくる */
  function reveal(btn){
    const slotIndex = Number(btn.getAttribute('data-slot'));
    if(picked[slotIndex]) return;
    const card = stack.pop();
    picked[slotIndex] = card;

    const face = btn.querySelector('.card-front');
    face.style.backgroundImage = `url('/assets/tarot/rws/${card.id}.jpg')`;

    btn.classList.add('flip');
    try{ tapSE.currentTime=0; tapSE.play(); }catch(_){}
    try{ flipSE.currentTime=0; flipSE.play(); }catch(_){}
    createStarSymbol(btn);

    btn.parentElement.querySelector('.card-caption').textContent = card.name;
    btn.disabled = true;

    if(picked[1] && picked[2] && picked[3]) showResult();
  }

  /* 結果表示 */
  function showResult(){
    resultBox.hidden = false;
    const lines = [
      { title:picked[1].name, text:`${picked[1].poem}` },
      { title:picked[2].name, text:`${picked[2].poem}` },
      { title:picked[3].name, text:`${picked[3].poem}` }
    ];
    const boxes = $$('.r-block', resultBox);
    boxes.forEach((b,i)=>{
      const t = b.querySelector('.r-title');
      const tx = b.querySelector('.r-text');
      if(t&&tx){
        t.textContent = lines[i].title;
        tx.innerHTML = lines[i].text.replace(/\n/g,'<br>');
      }
    });
  }

  /* イベント */
  init();
  startBtn.addEventListener('click', startReading);
  resetBtn.addEventListener('click', init);
  deck.addEventListener('click', e=>{
    const btn = e.target.closest('.tarot-card');
    if(!btn || btn.disabled) return;
    reveal(btn);
  });

})();
