/* Re:verse Shion — 3-card Reading (flip + ripple + sound + shuffle) */
(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const startBtn = $('#wishStart');
  const resetBtn = $('#wishReset');
  const deck = $('.wish-deck');
  const cards = $$('.tarot-card', deck);
  const ripple = $('#rippleCanvas');
  const resultBox = $('#wishResult');

  if (!startBtn || !resetBtn || !deck || !cards.length || !ripple) return;

  /* --- Rider-Waite データ（表面画像＆詩鍵）--- */
  const CARD_SET = [
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

  /* 画像の場所（必要に合わせて調整） */
  const IMG_BASE = '/assets/images/riderwaite/majors/'; // 例: 00_fool.jpg …
  const IMG_EXT  = '.jpg';

  /* サウンド（iOSは最初のユーザー操作でunlock） */
  const sfx = {
    tap: new Audio('/assets/sfx/tap.mp3'),
    shuffle: new Audio('/assets/sfx/shuffle.mp3'),
    flip: new Audio('/assets/sfx/flip.mp3')
  };
  [sfx.tap, sfx.shuffle, sfx.flip].forEach(a => { a.preload = 'auto'; a.volume = 0.28; });

  /* 状態 */
  let stack = [];
  const picked = {};        // slot -> card
  let ctx, W, H;            // ripple

  /* ユーティリティ */
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function fitCanvas() {
    const rect = deck.getBoundingClientRect();
    W = Math.ceil(rect.width);
    H = Math.ceil(rect.height);
    ripple.width = W; ripple.height = H;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ripple.width = W * dpr; ripple.height = H * dpr;
    ripple.style.width = W + 'px'; ripple.style.height = H + 'px';
    ctx = ripple.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  /* 星紋バースト（クリック位置に光の輪） */
  function starRipple(clientX, clientY){
    if (!ctx) return;
    const rRect = deck.getBoundingClientRect();
    const x = clientX - rRect.left;
    const y = clientY - rRect.top;
    const start = performance.now();
    const D = 720; // ms

    (function loop(t){
      const k = Math.min(1, (t - start) / D);
      ctx.clearRect(0,0,W,H);
      // 多重リング
      for (let i=0;i<3;i++){
        const p = k * (1 - i*0.18);
        if (p <= 0) continue;
        const R = 20 + p * 160 + i*18;
        const a = (1 - p) * (0.85 - i*0.18);
        const grad = ctx.createRadialGradient(x,y, R*0.6, x,y, R);
        grad.addColorStop(0, `rgba(255,255,255,${0.28*a})`);
        grad.addColorStop(1, `rgba(174,138,255,0)`);
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(x,y,R,0,Math.PI*2);
        ctx.fill();
      }
      // 星粒
      ctx.fillStyle = `rgba(255,215,111,${0.9*(1-k)})`;
      for (let s=0;s<8;s++){
        const ang = (s/8)*Math.PI*2 + k*4;
        const rx = x + Math.cos(ang) * (30 + 90*k);
        const ry = y + Math.sin(ang) * (30 + 90*k);
        ctx.beginPath(); ctx.arc(rx,ry, 1.6*(1-k)+0.6, 0, Math.PI*2); ctx.fill();
      }
      if (k < 1) requestAnimationFrame(loop);
      else setTimeout(()=> ctx.clearRect(0,0,W,H), 32);
    })(start);
  }

  /* 詩的3行（役割ごとに少しだけ表現を変える） */
  function poeticLines(card, role){
    // role: 1=現在 / 2=鍵 / 3=進む道
    const [a,b,c] = card.key;
    if (role === 1) return `${a}。\nいまの呼吸に名を与えよう。\n静かな合図は、もう鳴っている。`;
    if (role === 2) return `${b}。\n一歩だけ、今日の約束に変える。\n小さく確かに、世界が動く。`;
    return `${c}。\n迷いは光の前兆。\n言葉は祈りへ、君は前へ。`;
  }

  /* UI 初期化 */
  function init(){
    resultBox.hidden = true;
    Object.keys(picked).forEach(k => delete picked[k]);
    cards.forEach((btn, i) => {
      btn.disabled = true;
      btn.setAttribute('aria-disabled','true');
      btn.classList.remove('is-flipped','is-ready','is-burst','is-shuffling');
      btn.style.removeProperty('--delay'); btn.style.removeProperty('--rot');
      const img = $('.face-front img', btn); if (img) img.removeAttribute('src');
      const cap = $(`.card-caption[data-cap="${i+1}"]`);
      if (cap){ cap.textContent = ''; cap.classList.remove('is-show'); }
    });
    fitCanvas();
  }

  /* シャッフル演出＋有効化 */
  async function start(){
    stack = shuffle(CARD_SET);
    cards.forEach((btn, i) => {
      const d = i * 90;
      btn.style.setProperty('--delay', `${d}ms`);
      btn.style.setProperty('--rot', `${(i===1? -1:1)*2}deg`);
      btn.classList.add('is-shuffling');
    });
    try{ await sfx.shuffle.play().catch(()=>{}); }catch{}
    await new Promise(r => setTimeout(r, 900));
    cards.forEach(btn => {
      btn.classList.remove('is-shuffling');
      btn.classList.add('is-ready');
      btn.disabled = false;
      btn.removeAttribute('aria-disabled');
    });
    startBtn.disabled = true;
    resetBtn.disabled = false;
  }

  /* フリップ（表面に絵柄のみ／名前は下キャプション） */
  function flipCard(btn, slot, clientX, clientY){
    if (picked[slot]) return;           // 二度押し防止
    const card = stack.pop();           // 山札から1枚
    if (!card) return;
    picked[slot] = card;

    // 表の画像をセット
    const img = $('.face-front img', btn);
    if (img) img.src = `${IMG_BASE}${card.id}${IMG_EXT}`;

    // 音＆星紋＆バースト
    try{ sfx.tap.currentTime = 0; sfx.tap.play().catch(()=>{}); }catch{}
    try{ sfx.flip.currentTime = 0; sfx.flip.play().catch(()=>{}); }catch{}
    btn.classList.add('is-burst');
    starRipple(clientX, clientY);

    // フリップ
    requestAnimationFrame(() => btn.classList.add('is-flipped'));

    // キャプション（名前のみ／カード下）
    const cap = $(`.card-caption[data-cap="${slot}"]`);
    if (cap){
      cap.textContent = card.name;
      cap.classList.add('is-show');
    }

    // 3枚揃ったら結果へ
    if (picked[1] && picked[2] && picked[3]){
      const t1 = $('[data-title="1"]'), t2 = $('[data-title="2"]'), t3 = $('[data-title="3"]');
      const x1 = $('[data-text="1"]'),  x2 = $('[data-text="2"]'),  x3 = $('[data-text="3"]');
      t1.textContent = picked[1].name; x1.textContent = poeticLines(picked[1],1);
      t2.textContent = picked[2].name; x2.textContent = poeticLines(picked[2],2);
      t3.textContent = picked[3].name; x3.textContent = poeticLines(picked[3],3);
      resultBox.hidden = false;
    }
  }

  /* 事件簿 */
  startBtn.addEventListener('click', () => {
    // iOSオーディオ解錠
    [sfx.tap, sfx.shuffle, sfx.flip].forEach(a => { try{ a.play().then(()=>a.pause()).catch(()=>{});}catch{} });
    start();
  });

  resetBtn.addEventListener('click', () => {
    startBtn.disabled = false;
    resetBtn.disabled = true;
    init();
  });

  cards.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.disabled || !btn.classList.contains('is-ready')) return;
      const slot = Number(btn.getAttribute('data-slot'));
      const { clientX, clientY } = (e.touches?.[0] || e);
      flipCard(btn, slot, clientX, clientY);
    }, { passive:true });
  });

  window.addEventListener('resize', fitCanvas, { passive:true });
  init();
})();
