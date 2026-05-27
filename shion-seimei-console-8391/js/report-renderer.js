window.ShionReportRenderer={
  render(el,input,r){
    const msg=window.ShionMessages.build(input.topic,r),formatJapaneseDistance=window.ShionMessages.formatJapaneseDistance;
    const theme=window.ShionMessages.themeKey(input.topic);const tarotState=r.tarotState||{spreadMode:'none',cards:[],spread:{positions:[]}};
    const cards=tarotState.cards||[]; const positions=(tarotState.spread&&tarotState.spread.positions)||[];
    const tarotCardsHtml=cards.map((c,i)=>`<article class='tarot-card'><p class='tarot-position'>${i+1}枚目｜${positions[i]||'メッセージ'}</p><h4>${c.nameJa} / ${c.nameEn}</h4><p>${window.ShionMessages.getCardThemeMeaning(c,theme)}</p></article>`).join('');
    const tarotReadings=cards.map((c,i)=>`<section class='reading-block'><h4>${positions[i]||'メッセージ'}：${c.nameJa}</h4><p>${window.ShionMessages.buildTarotCardReading(c,positions[i]||'この位置',theme).replace(/\n\n/g,'<br><br>')}</p></section>`).join('');
    const cta=window.ShionMessages.themeCTA(input.topic);
    const tarotSection=tarotState.spreadMode==='none'?`<section class='reading-block'><h3>今回あなたのために出たタロット</h3><p>今回は星命中心の診断です。必要に応じてタロット枚数を増やして深掘りできます。</p></section>`:`<section class='tarot-result-section'><h3>今回あなたのために出たタロット</h3><p>今の流れを映すカードを、${cards.length}枚引きました。</p><div class='tarot-card-list'>${tarotCardsHtml}</div></section><section><h3>カードから見た今の悩み</h3>${tarotReadings}</section>`;
    el.innerHTML=`<section class='card result-card'><h2>${input.name}さんへの鑑定メッセージ</h2><h3>今のあなたの星命</h3><p class='current-message'>${msg.conclusion}<br>${msg.current}</p><h3>今の人生章</h3><p>${r.lifeArcana.nameJa}（${r.lifeRange[0]}〜${r.lifeRange[1]}歳）</p><h3>今年の流れ</h3><p>${r.yearArcana.nameJa}</p><h3>今後3年の流れ</h3><p>${r.timeline.slice(0,3).map(v=>`${v.year}年(${v.age}歳)`).join(' / ')}</p>${tarotSection}<section class='reading-block'><h3>未来を変えるための一歩</h3><p>${msg.action}</p><p>${msg.starMessage}</p></section><section class='reading-block'><h3>ここから先、個人鑑定で見られること</h3><p>${cta.body}</p><a href='#' class='primary-cta'>${cta.btn}</a><!-- TODO: 個人鑑定ページのURLに差し替える --></section><div id='readingText' class='reading-sections'><section class='reading-block'><h3>注意点</h3><p>${msg.caution}</p></section></div></section>`;
    return msg;
  },
  buildCopy(input,r,msg,short=false){
    const tarot=(r.tarotState?.cards||[]).map(c=>c.nameJa).join('・')||'なし';
    let t=`名前:${input.name}\n生年月日:${input.birthDate}\n出生星命:${r.map.seimeiType}\n宇宙移動距離:${window.ShionMessages.formatJapaneseDistance(r.cosmicDistanceKm)}\n人生章:${r.lifeArcana.nameJa}\n今年の年運:${r.yearArcana.nameJa}\nタロット:${tarot}\n【結論】${msg.conclusion}\n【今の状態】${msg.current}\n【注意点】${msg.caution}\n【今やるべき一歩】${msg.action}`;
    if(short)t=t.slice(0,300);return t;
  }
};
