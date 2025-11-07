/* =======================================================
   詩韻 — 光の神殿 導入体験
   Last update: 2025-11-08
======================================================= */

/* ---------- 星紋（Ripple） ---------- */
(function attachRipple(){
  const root = document.querySelector('.ripple-root');
  document.addEventListener('pointerdown', (e)=>{
    const r = document.createElement('span');
    r.className = 'ripple';
    r.style.left = e.clientX + 'px';
    r.style.top  = e.clientY + 'px';
    root.appendChild(r);
    setTimeout(()=> r.remove(), 650);
  }, {passive:true});
})();

/* ---------- 0) 青いコード雨（Matrix風） ---------- */
(function codeRain(){
  const cvs = document.getElementById('codeRain');
  const ctx = cvs.getContext('2d');
  const chars = '01AI∴∵⌘◇◆＊＋≡☆★◯●◎∑ΣΛΩΞΨϕπ∞≒≡→←↑↓';
  let fontSize = 18;
  let columns, drops, W, H;
  function resize(){
    W = cvs.width  = window.innerWidth * devicePixelRatio;
    H = cvs.height = window.innerHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    fontSize = Math.max(14, Math.min(22, Math.floor(window.innerWidth/48)));
    columns = Math.ceil(window.innerWidth / fontSize);
    drops = new Array(columns).fill(0).map(()=> Math.floor(Math.random()*H));
  }
  function draw(){
    ctx.fillStyle = 'rgba(2,3,22,0.16)';
    ctx.fillRect(0,0,window.innerWidth,window.innerHeight);
    ctx.fillStyle = '#7fd0ff';
    ctx.font = `${fontSize}px monospace`;
    for(let i=0;i<columns;i++){
      const ch = chars[Math.floor(Math.random()*chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize * .9;
      ctx.fillText(ch, x, y);
      if(y > window.innerHeight && Math.random() > 0.975){ drops[i] = 0; }
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize(); draw();
})();

/* ---------- 1) intro → temple 遷移 & BGM ---------- */
const enterTemple = document.getElementById('enterTemple');
enterTemple.addEventListener('click', ()=>{
  // Audio：ユーザー操作後のみ再生
  const bgm = document.getElementById('bgm');
  if(bgm && bgm.paused){
    bgm.volume = 0.0;
    bgm.play().catch(()=>{ /* iOS対策：失敗しても無視 */ });
    // フェードイン
    const fade = setInterval(()=>{
      bgm.volume = Math.min(1.0, bgm.volume + 0.05);
      if(bgm.volume >= 0.8) clearInterval(fade);
    }, 80);
  }
  // 画面遷移
  document.getElementById('intro').style.display = 'none';
  const temple = document.getElementById('temple');
  temple.style.display = 'grid';
  requestAnimationFrame(()=> { temple.querySelector('.veil').style.opacity = 1; });
});

/* ---------- 2) temple → reading 遷移（タロット展開） ---------- */
const startReading = document.getElementById('startReading');
startReading.addEventListener('click', ()=>{
  document.getElementById('temple').style.display = 'none';
  const reading = document.getElementById('reading');
  reading.style.display = 'block';
  drawThree(); // 初回オート展開
});

/* ---------- 3) TAROT：22大アルカナ定義（詩・韻・祈・解説） ---------- */
const TAROT = [
  { id:'00', name:'愚者', img:'/assets/tarot/majors/00_the_fool.jpg',
    poem:'境界を越える最初の一歩', res:'恐れより好奇心を選ぶ呼吸', pray:'白紙の地図に今の足跡を',
    deep:`無垢は無鉄砲ではなく、<em>余白</em>です。あなたが踏み出した瞬間、
    世界はあなたに合わせて書き換わる。迷いは恥ではない——<strong>選ぶ</strong>ことこそが詩です。`},
  { id:'01', name:'魔術師', img:'/assets/tarot/majors/01_magician.jpg',
    poem:'意図は杖、言葉は術式', res:'手の届く範囲から始める力', pray:'一行で願いを書き起こす',
    deep:`可能性は抽象ではない。机に置かれた四元素（棒・杯・剣・盤）を、
    いまのあなたがどう並べるか。<em>言葉は起動キー</em>。声に出せば世界は動く。`},
  { id:'02', name:'女教皇', img:'/assets/tarot/majors/02_priestess.jpg',
    poem:'静寂は最高密度の叡智', res:'内なる頷きが答え', pray:'情報を閉じて直感を開く',
    deep:`急がない意志は強い。二柱の間に座す白は、<em>判断保留の勇気</em>。
    心が深呼吸を取り戻せば、正解は表層ではなく底から浮かぶ。`},
  { id:'03', name:'女帝', img:'/assets/tarot/majors/03_empress.jpg',
    poem:'満ちる、育つ、分かち合う', res:'豊かさは温度で伝播する', pray:'自分を労れば、世界が実る',
    deep:`甘やかすことと大切にすることは違う。<em>滋養</em>は拡張の条件。
    まず自分にパンと花を。満たされた器は自然に溢れて、他者を満たす。`},
  { id:'04', name:'皇帝', img:'/assets/tarot/majors/04_emperor.jpg',
    poem:'責任は自由の別名', res:'秩序は優しさの骨格', pray:'今日の約束を一点だけ守る',
    deep:`守るから攻められる。<em>枠</em>は圧ではなく守り。
    ひとつの原則で十分だ。ぶれない線は、周囲に安心の地図を与える。`},
  { id:'05', name:'法王', img:'/assets/tarot/majors/05_hierophant.jpg',
    poem:'祈りは伝承、言葉は梯子', res:'正統は過去の叡智の折り畳み', pray:'背中で示す一例を',
    deep:`形式は魂の容器。<em>型</em>は自由の敵ではない。先人の階段を一段借りて、
    その上であなたの声を重ねよう。`},
  { id:'06', name:'恋人', img:'/assets/tarot/majors/06_lovers.jpg',
    poem:'選ぶとは結ぶこと', res:'迷いは愛の準備運動', pray:'心の偏りを正直に告白する',
    deep:`二者択一の物語ではない。<em>合意</em>は共鳴でできている。選択は相互に変形し、
    あなたをも作り替える。`},
  { id:'07', name:'戦車', img:'/assets/tarot/majors/07_chariot.jpg',
    poem:'推進力は意志の直列', res:'迷いごと前進させる技術', pray:'小さな勝利条件を決める',
    deep:`全部整ってから出ると、永遠に出られない。<em>動きながら整える</em>が勝利の作法。`},
  { id:'08', name:'力', img:'/assets/tarot/majors/08_strength.jpg',
    poem:'牙を折らずに馴らす', res:'優しさは最強の拘束', pray:'自分の衝動に名前をつける',
    deep:`抑圧ではなく調律。<em>撫でる力</em>は、吠える力より持続する。`},
  { id:'09', name:'隠者', img:'/assets/tarot/majors/09_hermit.jpg',
    poem:'孤独は灯、孤立は影', res:'遠回りこそ近道の地図', pray:'一晩だけ情報断食',
    deep:`静かな部屋は、世界で一番うるさい。<em>本心</em>は小声で話すから。`},
  { id:'10', name:'運命の輪', img:'/assets/tarot/majors/10_wheel.jpg',
    poem:'回るから、巡り合う', res:'波に乗る姿勢が機会を呼ぶ', pray:'来た話に一度はYES',
    deep:`偶然は準備の別名。<em>一拍子遅れの勇気</em>がリズムを掴む。`},
  { id:'11', name:'正義', img:'/assets/tarot/majors/11_justice.jpg',
    poem:'針の位置を戻す作業', res:'公平は冷たさではない', pray:'事実と言い分を分けて書く',
    deep:`偏りは悪ではない。<em>自覚</em>があれば調整できる。`},
  { id:'12', name:'吊るされた男', img:'/assets/tarot/majors/12_hanged.jpg',
    poem:'逆さの視界に突破口', res:'足を止めた者だけが見る地図', pray:'あえて待つを選ぶ',
    deep:`停止は敗北ではなく、<em>熟成</em>だ。角度が変われば意味も変わる。`},
  { id:'13', name:'死神', img:'/assets/tarot/majors/13_death.jpg',
    poem:'終わりは片側の名前', res:'切断が新陳代謝を招く', pray:'役目を終えたものに感謝',
    deep:`さよならの中に、次の呼吸がある。<em>空席</em>が未来を招く椅子になる。`},
  { id:'14', name:'節制', img:'/assets/tarot/majors/14_temperance.jpg',
    poem:'過剰と欠乏の間で混ぜる', res:'配合比率が才能', pray:'今日は「少しだけ」を選ぶ',
    deep:`極を往復するより、<em>渡し守</em>になろう。混ぜ合わせは創造だ。`},
  { id:'15', name:'悪魔', img:'/assets/tarot/majors/15_devil.jpg',
    poem:'鎖の多くは幻', res:'快と恐れの取引をやめる', pray:'小さな依存を一個だけ外す',
    deep:`禁欲ではなく<em>選択の回復</em>。選べる自分に戻る儀式。`},
  { id:'16', name:'塔', img:'/assets/tarot/majors/16_tower.jpg',
    poem:'崩壊は、解放の音', res:'嘘が落ちて本音が残る', pray:'壊れた基礎の撤去から',
    deep:`痛みは編集点。<em>建て直し</em>の方が結局は速い。`},
  { id:'17', name:'星', img:'/assets/tarot/majors/17_star.jpg',
    poem:'希望は静かに降る', res:'約束は夜に光る標', pray:'願いを現在形で言う',
    deep:`希望は根拠ではなく<em>方向</em>。向きが決まれば足取りが決まる。`},
  { id:'18', name:'月', img:'/assets/tarot/majors/18_moon.jpg',
    poem:'揺らぎは嘘ではない', res:'不安は守りたいものの影', pray:'怖さを言語化する',
    deep:`曖昧さは敵ではない。<em>名づけ</em>れば輪郭が出る。`},
  { id:'19', name:'太陽', img:'/assets/tarot/majors/19_sun.jpg',
    poem:'露わにする力', res:'祝福は共有で増幅', pray:'成果を声に出して喜ぶ',
    deep:`幸福は独りでは完結しない。<em>「見せる」勇気</em>で世界に接続する。`},
  { id:'20', name:'審判', img:'/assets/tarot/majors/20_judgement.jpg',
    poem:'呼びかけに応える朝', res:'過去は赦しで資産化', pray:'旧バージョンの私に感謝',
    deep:`やり直しは敗北ではない。<em>再演</em>は成熟の証明。`},
  { id:'21', name:'世界', img:'/assets/tarot/majors/21_world.jpg',
    poem:'円環は扉であり鏡', res:'完成は次の序章', pray:'「おわり」を宣言して始める',
    deep:`完全は静止ではない。<em>一区切り</em>が新しいテンポを呼ぶ。`}
];

/* ---------- シャッフル & 3枚引き ---------- */
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function drawThree(){
  const picks = shuffle(TAROT).slice(0,3);
  renderCards(picks);
  renderSummary(picks);
  renderDeep(picks);
  // CTAを開く（下部セクションを表示）
  document.getElementById('cta').hidden = false;
}
document.getElementById('drawBtn').addEventListener('click', drawThree);

/* ---------- カード描画（常に裏面→タップで反転） ---------- */
function createCardEl(card){
  const wrap = document.createElement('div');
  wrap.className = 'card';
  const inner = document.createElement('div');
  inner.className = 'card__inner';
  const back = document.createElement('div');
  back.className = 'card__face card__back';
  const front = document.createElement('div');
  front.className = 'card__face card__front';
  const img = document.createElement('img');
  img.alt = card.name;
  img.src = card.img; // 画像パスを差し替え可
  front.appendChild(img);
  inner.appendChild(back); inner.appendChild(front);
  wrap.appendChild(inner);
  wrap.addEventListener('click', ()=> wrap.classList.toggle('is-flipped'));
  return wrap;
}

function renderCards(picks){
  const area = document.getElementById('cards');
  area.innerHTML = '';
  picks.forEach(c=> area.appendChild(createCardEl(c)));
}

function renderSummary(picks){
  const sum = document.getElementById('summary');
  const poem = picks[0]?.poem || '';
  const res  = picks[1]?.res  || '';
  const pray = picks[2]?.pray || '';
  document.getElementById('sumPoem').textContent = '【' + picks[0].name + '】 ' + poem;
  document.getElementById('sumRes').textContent  = '【' + picks[1].name + '】 ' + res;
  document.getElementById('sumPray').textContent = '【' + picks[2].name + '】 ' + pray;
  sum.hidden = false;
}

function renderDeep(picks){
  const deep = document.getElementById('deep');
  deep.hidden = false;
  const t = picks.map(p=> {
    return `<h5>《${p.name}》</h5><p>${p.deep}</p>`;
  }).join('');
  document.getElementById('deepText').innerHTML = t;
}
