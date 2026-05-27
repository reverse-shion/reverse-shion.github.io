(()=>{
const $=id=>document.getElementById(id),form=$('readingForm'),msg=$('msg'),result=$('result');
$('readingDate').value=new Date().toISOString().slice(0,10);
const TAROT_SESSION_KEY="shion_seimei_tarot_session";
const TAROT_SPREADS={none:{label:"星命中心",count:0,positions:[]},one:{label:"1枚メッセージ",count:1,positions:["今、あなたに必要なメッセージ"]},three:{label:"おすすめ3枚鑑定",count:3,positions:["今の状態","変化の鍵","これからの流れ"]},five:{label:"深掘り5枚鑑定",count:5,positions:["現状","本音","障害","流れ","次の一歩"]},ten:{label:"本格10枚鑑定",count:10,positions:["現在","過去からの影響","近未来","深層心理","相手・環境","障害","助言","可能性","最終傾向","今すぐの行動"]}};
const tarotState={tabOpened:false,spreadMode:"three",drawMode:"random",drawnAt:null,cards:[]};
let state=null;
const spreadMap={"0":"none","1":"one","3":"three","5":"five","10":"ten"};
const spreadSel=$("spread"); spreadSel.value="3";
function shuffleCards(cards){const r=cards.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
function drawRandomTarotCards(count){if(!window.ShionTarot78?.getAllTarot78Cards)return[];return shuffleCards(window.ShionTarot78.getAllTarot78Cards()).slice(0,count);}
function saveTarot(){sessionStorage.setItem(TAROT_SESSION_KEY,JSON.stringify(tarotState));}
function loadTarot(){try{Object.assign(tarotState,JSON.parse(sessionStorage.getItem(TAROT_SESSION_KEY)||"{}"));}catch{}}
function renderTarotPreview(){const box=$("tarotCards"),intro=$("tarotIntro");const sp=TAROT_SPREADS[tarotState.spreadMode]||TAROT_SPREADS.three;
 if(sp.count===0){intro.textContent="今回は星命中心の診断です。必要に応じてタロット枚数を選べます。";box.innerHTML="";return;}
 if(!tarotState.cards.length) initDraw();
 intro.textContent=`あなたの今の流れを映すカードを、${sp.count}枚引きました。このカードは、結果の鑑定書にも反映されます。`;
 box.innerHTML=tarotState.cards.map((c,i)=>`<article class='tarot-card'><p class='tarot-position'>${i+1}枚目｜${sp.positions[i]||"メッセージ"}</p><h4>《${c.nameJa} / ${c.nameEn}》</h4><p>${c.humanMessage||c.uprightMeaning||""}</p></article>`).join('');}
 function initDraw(force=false){const sp=TAROT_SPREADS[tarotState.spreadMode]||TAROT_SPREADS.three;if(sp.count===0){tarotState.cards=[];saveTarot();renderTarotPreview();return;}if(!force&&tarotState.cards.length===sp.count){renderTarotPreview();return;}tarotState.cards=drawRandomTarotCards(sp.count);tarotState.drawnAt=Date.now();saveTarot();renderTarotPreview();}
 loadTarot();tarotState.spreadMode=spreadMap[spreadSel.value]||"three";tarotState.tabOpened=true;initDraw(false);
 spreadSel.addEventListener('change',()=>{tarotState.spreadMode=spreadMap[spreadSel.value]||"three";initDraw(true);});
 $('redrawTarot').onclick=()=>initDraw(true);
 form.addEventListener('submit',e=>{e.preventDefault();const input={name:$('name').value.trim(),birthDate:$('birthDate').value,readingDate:$('readingDate').value,topic:$('topic').value};const v=window.ShionValidation.validate(input);if(!v.ok){msg.textContent=v.message;return;}if(!tarotState.cards.length&&tarotState.spreadMode!=="none")initDraw(true);const r=window.ShionSeimeiEngine.build(input);r.tarotState={...tarotState,spread:TAROT_SPREADS[tarotState.spreadMode]};const reading=window.ShionReportRenderer.render(result,input,r);state={input,r,reading};msg.textContent='診断を表示しました。';});
 const copy=async(type)=>{if(!state){msg.textContent='先に診断してください。';return;}const txt=window.ShionReportRenderer.buildCopy(state.input,state.r,state.reading,type==='short');await window.ShionUtils.copyText(txt);msg.textContent='コピーしました。';};$('copyFull').onclick=()=>copy('full');$('copyShort').onclick=()=>copy('short');$('copyMsg').onclick=async()=>{const t=document.getElementById('readingText');if(!t)return;await window.ShionUtils.copyText(t.textContent);msg.textContent='鑑定文をコピーしました。';};
})();
