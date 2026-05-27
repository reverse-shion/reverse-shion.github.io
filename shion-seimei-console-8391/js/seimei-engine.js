window.ShionSeimeiEngine=(function(){const AU=149597870.7,LY=9460730472580.8,SPEED=828000;const tarot=()=>window.ShionTarotData.majorArcana;const d=(s)=>{const [y,m,da]=s.split('-').map(Number);return new Date(y,m-1,da,12)};const age=(b,r)=>{let a=r.getFullYear()-b.getFullYear();const before=(r.getMonth()<b.getMonth()||(r.getMonth()===b.getMonth()&&r.getDate()<b.getDate()));if(before)a--;return a;};const digitSum=(b)=>b.replace(/-/g,'').split('').reduce((p,c)=>p+Number(c),0);
const yearArcanaGuide=[
{yearTheme:'新しい循環を軽やかに始める年',yearCaution:'勢いだけで飛び出すと足場が薄くなりやすい',yearAction:'小さな挑戦を一つ決めて試しながら進む',yearSummary:'始まりの風を受け取り、身軽に方向を確かめる年です。'},
{yearTheme:'意志と集中で可能性を形にする年',yearCaution:'同時進行を増やしすぎると焦点がぼやける',yearAction:'主軸を一つ定め、道具と手順を揃える',yearSummary:'持っている力を一点に集めるほど成果が育つ年です。'},
{yearTheme:'内側を整え、見えない準備を深める年',yearCaution:'答えを急ぎすぎると本音を見落としやすい',yearAction:'言葉・知識・設計・下準備を整える',yearSummary:'表に出るより、次の流れを作るための核を育てる年です。'},
{yearTheme:'育ててきたものに形と温度を与える年',yearCaution:'広げすぎると育つ前に消耗しやすい',yearAction:'作品・関係・商品を小さく育てて見える形にする',yearSummary:'受け取る力と育てる力が強まる年です。'},
{yearTheme:'仕組み・責任・現実的な土台を固める年',yearCaution:'勢いだけで進めると後から修正が増えやすい',yearAction:'価格・契約・ルール・運用方法を明確にする',yearSummary:'曖昧だったものを現実の形に整える年です。'},
{yearTheme:'学び直しと価値観の再定義が進む年',yearCaution:'正しさだけで人を動かそうとすると摩擦が増える',yearAction:'原点の理念を言語化し共有しやすくする',yearSummary:'基準を整え直すことで判断に深みが出る年です。'},
{yearTheme:'選択と調和で関係性を育てる年',yearCaution:'迷いを先送りすると機会が散らばる',yearAction:'優先順位を決めて約束を具体化する',yearSummary:'大切な人や案件との絆を丁寧に結び直す年です。'},
{yearTheme:'推進力で停滞を突破しやすい年',yearCaution:'速さ優先になり心身の余白を失いやすい',yearAction:'移動・発信・提案を計画的に加速する',yearSummary:'流れを動かす力が高まり、前進が現実になる年です。'},
{yearTheme:'静かな強さで粘り勝ちを作る年',yearCaution:'無理な我慢は後半で反動が出やすい',yearAction:'休息と鍛錬のリズムを作って継続する',yearSummary:'派手さより持久力が成果へつながる年です。'},
{yearTheme:'手放しと視点転換で再配置する年',yearCaution:'損得だけで急ぐと本来の学びを逃しやすい',yearAction:'不要な予定や役割を削り余白を作る',yearSummary:'止まることで見える道が次の進路を開く年です。'},
{yearTheme:'区切りと再生の準備を進める年',yearCaution:'古い形に執着すると刷新が遅れやすい',yearAction:'終えることを決めて新しい基盤を組む',yearSummary:'痛みを最小化しながら更新へ向かう年です。'},
{yearTheme:'均衡と調律で流れを整える年',yearCaution:'完璧を求めすぎると決断が遅れやすい',yearAction:'配分・時間・体力のバランスを可視化する',yearSummary:'ちょうどよさを掴むほど全体が安定する年です。'},
{yearTheme:'影の課題を見つめ直し解放へ進む年',yearCaution:'恐れに飲まれると選択肢が狭くなりやすい',yearAction:'依存や惰性を一つずつ断ち切る',yearSummary:'向き合う勇気が自由度を回復させる年です。'},
{yearTheme:'突発的な見直しで軌道修正が起こる年',yearCaution:'変化への抵抗が強いほど消耗が増えやすい',yearAction:'崩れた前提を点検し優先順位を再設定する',yearSummary:'壊れることは、より良い土台を作る合図になる年です。'},
{yearTheme:'希望と再接続し理想を描き直す年',yearCaution:'夢だけ語ると実装が追いつかなくなりやすい',yearAction:'理想を月単位の計画へ落とし込む',yearSummary:'未来への信頼を取り戻し、歩幅を整える年です。'},
{yearTheme:'感受性が高まり内面の声が強まる年',yearCaution:'不安の想像を事実と混同しやすい',yearAction:'情報を整理し、安心できる習慣を続ける',yearSummary:'曖昧さを丁寧に扱うほど直感が冴える年です。'},
{yearTheme:'明るさと達成感を分かち合う年',yearCaution:'目標達成後に緩みすぎると失速しやすい',yearAction:'成果を共有し次の循環へ橋をかける',yearSummary:'努力が実を結び、周囲との喜びが広がる年です。'},
{yearTheme:'目覚めの合図を受け取り判断が明確になる年',yearCaution:'過去の後悔にとどまると機会を逃しやすい',yearAction:'呼ばれている役割を言葉にして動き始める',yearSummary:'転機への決断力が高まり、再始動しやすい年です。'},
{yearTheme:'完成と統合で節目を迎える年',yearCaution:'終わった流れを引き延ばすと次が遅れやすい',yearAction:'達成を整理し新章へ渡る準備をする',yearSummary:'一巡の実りを受け取り、次の世界へ踏み出す年です。'},
{yearTheme:'公平性と整合性を重視して選ぶ年',yearCaution:'感情だけで決めると後から負担が残りやすい',yearAction:'条件・責任・分担を明文化して判断する',yearSummary:'現実的な線引きが信頼と安定を生む年です。'},
{yearTheme:'流れの転換点を捉えやすい年',yearCaution:'好機でも準備不足だと波に乗り切れない',yearAction:'変化を前提に柔軟な計画を立て直す',yearSummary:'巡り合わせを活かすほど成長速度が上がる年です。'},
{yearTheme:'静かな統合と大局判断が進む年',yearCaution:'自己犠牲で抱え込みすぎると判断が鈍る',yearAction:'境界線を守りながら全体最適で選択する',yearSummary:'成熟した視点で物事を束ね直す年です。'}
];
function buildYearReading(lifeName,guide){return{summary:`${lifeName}の章にいる今年は、${guide.yearSummary.replace('年です。','')}` ,theme:`${guide.yearTheme}。人生章「${lifeName}」の流れが土台にあるため、短期成果よりも中長期の整合性を意識すると噛み合いやすくなります。進み方は一気に拡大するより、優先順位を絞って確実に積み上げる形が向いています。`,caution:`${guide.yearCaution}。とくに「${lifeName}」の章では、役割や期待に応えようとして無理を重ねやすい傾向が出ることがあります。違和感を感じたら予定を微調整し、負荷を早めに下げてください。`,action:`${guide.yearAction}。今週は成果に直結する要素を一つだけ選び、着手→確認→修正の小さな循環を回してください。小さな前進を可視化するほど、年後半の手応えが強まります。`};}
function build(input){const birth=d(input.birthDate),read=d(input.readingDate);const elapsed=Math.floor((read-birth)/86400000);const years=age(birth,read);const cosmic=elapsed*24*SPEED;const map=window.ShionDecanMap.get(input.birthDate);const birthBaseArcana=digitSum(input.birthDate)%22;const lifeChapterIndex=Math.floor(years/4)%22;const yearArcanaIndex=(birthBaseArcana+years)%22;const table=[];for(let i=0;i<10;i++){const dt=new Date(read.getFullYear()+i,read.getMonth(),read.getDate(),12);const a=age(birth,dt);const lifeIndex=Math.floor(a/4)%22;const yearIndex=(birthBaseArcana+a)%22;const lifeName=tarot()[lifeIndex].nameJa;const guide=yearArcanaGuide[yearIndex];const reading=buildYearReading(lifeName,guide);table.push({year:dt.getFullYear(),age:a,lifeIndex,yearIndex,theme:reading.theme,caution:reading.caution,action:reading.action,summary:reading.summary,yearTheme:guide.yearTheme,yearCaution:guide.yearCaution,yearAction:guide.yearAction,yearSummary:guide.yearSummary});}return{elapsedDays:elapsed,age:years,cosmicDistanceKm:cosmic,au:cosmic/AU,lightYears:cosmic/LY,map,birthBaseArcana,lifeChapterIndex,yearArcanaIndex,lifeRange:[Math.floor(years/4)*4,Math.floor(years/4)*4+3],timeline:table,birthArcana:tarot()[birthBaseArcana],lifeArcana:tarot()[lifeChapterIndex],yearArcana:tarot()[yearArcanaIndex]};}
return{build};})();
