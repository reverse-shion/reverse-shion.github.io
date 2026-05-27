window.ShionReportRenderer={
  render(el,input,r){
    const msg=window.ShionMessages.build(input.topic,r);
    const rows=r.timeline.slice(0,3).map(v=>`<tr><td>${v.year}</td><td>${v.age}歳</td><td>${window.ShionTarotData.majorArcana[v.lifeIndex].nameJa}</td><td>${window.ShionTarotData.majorArcana[v.yearIndex].nameJa}</td><td>${v.theme}</td><td>${v.caution}</td><td>${v.action}</td></tr>`).join('');
    const readingHtml=`
      <section class="reading-block"><h3>結論</h3><p>${msg.conclusion}</p></section>
      <section class="reading-block"><h3>今の状態</h3><p>${msg.current}</p></section>
      <section class="reading-block"><h3>注意点</h3><p>${msg.caution}</p></section>
      <section class="reading-block"><h3>今やるべき一歩</h3><p>${msg.action}</p></section>
      <section class="reading-block"><h3>星命メッセージ</h3><p>${msg.starMessage}</p></section>
    `;

    el.innerHTML=`<section class='card'><h2>診断結果</h2><div class='grid'><div class='kpi'>出生星命：${r.map.seimeiType}</div><div class='kpi'>共鳴カード：${window.ShionTarotData.majorArcana[r.map.arcanaId].nameJa}</div><div class='kpi'>デカン：${r.map.decanTitle}（${r.map.decanTheme}）</div><div class='kpi'>年齢：${r.age}歳 / 経過日数：約${r.elapsedDays.toLocaleString()}日</div><div class='kpi'>宇宙移動距離：約${Math.round(r.cosmicDistanceKm).toLocaleString()}km<br>AU：約${Math.round(r.au).toLocaleString()} / 光年：約${r.lightYears.toFixed(4)}</div><div class='kpi'>人生章：${r.lifeArcana.nameJa} ${r.lifeRange[0]}〜${r.lifeRange[1]}歳<br>今年の年運：${r.yearArcana.nameJa}</div></div>${r.map.boundaryWarning?`<p class='msg'>${r.map.boundaryWarning}</p>`:''}<h3>今後3年の人生年表（無料）</h3><table><tr><th>年</th><th>年齢</th><th>人生章</th><th>年運</th><th>テーマ</th><th>注意点</th><th>行動指針</th></tr>${rows}</table><div class='card lock'><p>4年目以降の星命軌道年表は、完全鑑定書で詳しく読み解きます。</p></div><h3>相談ジャンル別メッセージ</h3><div id='readingText' class='reading-sections'>${readingHtml}</div><h3>有料鑑定プラン</h3><ul><li>星命軌道ミニ鑑定：3,300円</li><li>星命軌道 深掘り鑑定：6,800円</li><li>星命軌道 完全鑑定書：12,000円〜15,000円</li></ul><p><a class='cta' href='#'>もっと深く鑑定する</a></p></section>`;
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
