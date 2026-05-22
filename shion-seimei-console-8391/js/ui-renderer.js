window.ShionUiRenderer = {
  render(el, input, data, text) {
    const chart = data.chart || {};
    const ref = chart.sanmeiReference || {};
    const pillars = chart.pillars || {};
    const fe = chart.fiveElements || {};
    const z = data.zodiacDecan || {};

    const m = data.months.map((v) => `
      <div class='card'>
        <strong>${v.title}</strong>
        <p>${v.theme}</p>
        <p>${v.message}</p>
        <p>今月の行動：${v.action}</p>
        <p>注意点：${v.caution || '焦らず、今できる一歩から。'}</p>
        <p>合言葉：${v.phrase}</p>
      </div>`).join('');

    el.innerHTML = `<article><h2>鑑定の扉</h2><p>それでは、${input.name || 'ご相談者さま'}さんの星命を見ていきます。</p>
      <div class='summary'>
        <div class='card'>中心星命：${data.center}</div>
        <div class='card'>補助星命：${data.sub}</div>
        <div class='card'>年テーマ：${data.year.title}</div>
      </div>
      <h3>なぜこの結果になったか（参考根拠）</h3>
      <div class='summary'>
        <div class='card'>算命学参考：日干 ${ref.dayStem || '-'} / ${ref.element || '-'} / ${ref.yinYang || '-'}</div>
        <div class='card'>三柱：年 ${pillars.year ? pillars.year.name : '-'}・月 ${pillars.month ? pillars.month.name : '-'}・日 ${pillars.day ? pillars.day.name : '-'}</div>
        <div class='card'>五行バランス：${fe.counts ? Object.entries(fe.counts).map(([k, v]) => `${k}${v}`).join('・') : '-'}</div>
        <div class='card'>星座デカン：${z.zodiacNameJa || '-'} 第${z.decanNumber || '-'}デカン（${z.decanTitle || '簡易判定'})</div>
      </div>
      <h3>あなたの本質と今年の流れ</h3><pre>${text}</pre>
      <h3>月別未来鑑定</h3>${m}
      <h3>もっと深く見たい方へ</h3><p>個人鑑定では、恋愛・仕事・お金など今の状況に合わせて、さらに細かく整理していけます。</p>
      <textarea id='finalReading' rows='16'>${text}</textarea></article>`;
  }
};
