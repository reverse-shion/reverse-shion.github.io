window.ShionReportRenderer={
  render(el,input,r){
    const msg=window.ShionMessages.build(input.topic,r);
    const formatJapaneseDistance=(km)=>{const oku=Math.floor(km/100000000);const man=Math.floor((km%100000000)/10000);if(oku>0&&man>0)return `${oku}億${man}万km`;if(oku>0)return `${oku}億km`;if(man>0)return `${man}万km`;return `${Math.round(km).toLocaleString('ja-JP')}km`;};
    const yearCards=r.timeline.slice(0,3).map(v=>`<article class="year-card"><header class="year-card-header"><div class="year-main">${v.year}年</div><div class="year-age">${v.age}歳</div></header><div class="arcana-pair"><div class="arcana-badge"><strong>人生章：</strong>${window.ShionTarotData.majorArcana[v.lifeIndex].nameJa}</div><div class="arcana-badge"><strong>年運：</strong>${window.ShionTarotData.majorArcana[v.yearIndex].nameJa}</div></div><section class="reading-section"><h4>その年の結論</h4><p>${v.summary}</p></section><section class="reading-section"><h4>どんな年か</h4><p>${v.theme}</p></section><section class="reading-section"><h4>注意点</h4><p>${v.caution}</p></section><section class="reading-section"><h4>行動指針</h4><p>${v.action}</p></section></article>`).join('');
    const readingHtml=`
      <section class="reading-block"><h3>結論</h3><p>${msg.conclusion}</p></section>
      <section class="reading-block"><h3>今の状態</h3><p>${msg.current}</p></section>
      <section class="reading-block"><h3>注意点</h3><p>${msg.caution}</p></section>
      <section class="reading-block"><h3>今やるべき一歩</h3><p>${msg.action}</p></section>
      <section class="reading-block"><h3>星命メッセージ</h3><p>${msg.starMessage}</p></section>
    `;
    el.innerHTML=`<section class='card result-card'><h2>診断結果</h2><h3>星命軌道サマリー</h3><div class='grid'><div class='kpi'>出生星命：${r.map.seimeiType}</div><div class='kpi'>共鳴カード：${window.ShionTarotData.majorArcana[r.map.arcanaId].nameJa}</div><div class='kpi'>デカン：${r.map.decanTitle}（${r.map.decanTheme}）</div><div class='kpi'>年齢：${r.age}歳 / 経過日数：約${r.elapsedDays.toLocaleString()}日</div><div class='kpi'><strong>宇宙移動距離</strong><br>約${formatJapaneseDistance(r.cosmicDistanceKm)}<br><small>${Math.round(r.cosmicDistanceKm).toLocaleString('ja-JP')}km</small><br><small>地球と太陽の距離の約${Math.round(r.au).toLocaleString('ja-JP')}倍</small><br><small>約${r.lightYears.toFixed(4)}光年</small></div><div class='kpi'>人生章：${r.lifeArcana.nameJa} ${r.lifeRange[0]}〜${r.lifeRange[1]}歳<br>今年の年運：${r.yearArcana.nameJa}</div></div>${r.map.boundaryWarning?`<p class='msg'>${r.map.boundaryWarning}</p>`:''}<h3>今のあなたへの一言</h3><p class="current-message">${msg.current}\n${msg.conclusion}</p><h3>今後3年の年表カード</h3><div class="year-cards">${yearCards}</div><h3>4年目以降の星命軌道</h3><div class='card lock'><p>ここから先は、まだ閉じられた星図です。</p><p>4年目以降の星命軌道には、恋愛・仕事・金運の分岐点や、人生の章が切り替わるタイミングが含まれます。</p><p>完全鑑定書では、今後10年の流れを一つずつ丁寧に読み解きます。</p><p><a class='cta' href='#'>今後10年の星命軌道を詳しく見る</a></p></div><h3>相談ジャンル別メッセージ</h3><div id='readingText' class='reading-sections'>${readingHtml}</div><h3>有料鑑定プラン</h3><ul><li>星命軌道ミニ鑑定：3,300円</li><li>星命軌道 深掘り鑑定：6,800円</li><li>星命軌道 完全鑑定書：12,000円〜15,000円</li></ul></section>`;
    return msg;
  },
  buildCopy(input,r,msg,short=false){
    const y=r.timeline.slice(0,3).map(v=>`${v.year}/${v.age}歳/${window.ShionTarotData.majorArcana[v.yearIndex].nameJa}`).join(' | ');
    const text=[`【結論】${msg.conclusion}`,`【今の状態】${msg.current}`,`【注意点】${msg.caution}`,`【今やるべき一歩】${msg.action}`,`【星命メッセージ】${msg.starMessage}`].join('\n');
    let t=`名前:${input.name}\n生年月日:${input.birthDate}\n出生星命:${r.map.seimeiType}\n宇宙移動距離:${Math.round(r.cosmicDistanceKm).toLocaleString()}km\n人生章:${r.lifeArcana.nameJa}\n今年の年運:${r.yearArcana.nameJa}\n${text}\n3年表:${y}\n4年目以降は完全鑑定書へ。`;
    if(short)t=t.slice(0,300);
    return t;
  }
};
