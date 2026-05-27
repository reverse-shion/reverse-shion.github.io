window.ShionTextComposer = {
  compose(input, data) {
    const name = input.name || 'ご相談者さま';
    const s = window.ShionSeimeiTypes[data.centerKey] || window.ShionSeimeiTypes[data.center] || window.ShionSeimeiTypes['調和'];
    const tarot = window.ShionTarotData.message(input.tarot);
    const ref = data.chart.sanmeiReference || {};
    const pillars = data.chart.pillars || {};
    const z = data.zodiacDecan || {};

    return `それでは、${name}さんの星命を見ていきます。

これは詩韻式の参考鑑定で、自己理解の補助線としてお使いください。
中心星命は「${data.center}」、補助星命は「${data.sub}」。${s.core}傾向があり、${s.strength}力が表れやすい方です。

算命学参考としては、日干は「${ref.dayStem || '未算出'}（${ref.element || '参考'}・${ref.yinYang || '参考'}）」。
年柱 ${pillars.year ? pillars.year.name : '-'} / 月柱 ${pillars.month ? pillars.month.name : '-'} / 日柱 ${pillars.day ? pillars.day.name : '-'} を重ねると、今の力の使い方が見えやすくなります。

星座デカンは「${z.zodiacNameJa || '未判定'} 第${z.decanNumber || '-'}デカン」。${z.seimeiMessage || ''}
${z.boundaryWarning || ''}

${tarot}

月別未来鑑定は、相談ジャンル・五行・星命タイプ・タロット共鳴を重ねた参考ガイドです。断定ではなく、今月の行動のヒントとしてやさしく使ってください。`;
  }
};
