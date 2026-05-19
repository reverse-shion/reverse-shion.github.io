(function (root, factory) {
  let futureScore = root.ShionFutureScore;

  if (typeof require === 'function' && (!futureScore || typeof module !== 'undefined')) {
    try {
      futureScore = require('./future-score.js');
    } catch (error) {
      futureScore = null;
    }
  }

  const api = factory(futureScore || {});

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionMonthlyReading = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (FutureScore) {
  'use strict';

  function text(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    const trimmed = String(value).trim();
    return trimmed === '' ? fallback : trimmed;
  }

  function compact(value) {
    return text(value)
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .trim();
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function scoreNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function scoreText(value) {
    const num = Number(value);
    return Number.isFinite(num) ? String(Math.round(num)) : '未算出';
  }

  function monthLabel(item) {
    if (!item) return '';
    if (item.label) return item.label;
    return item.month ? `${item.month}月` : '';
  }

  function monthList(items, fallback = 'まだ月別の流れは出ていません') {
    const list = asArray(items)
      .map(monthLabel)
      .filter(Boolean);

    return list.length ? list.join('・') : fallback;
  }

  function byMonth(a, b) {
    return scoreNumber(a && a.month) - scoreNumber(b && b.month);
  }

  function sortByMonth(items) {
    return asArray(items).slice().sort(byMonth);
  }

  function getTopByKey(scores, key, count = 3) {
    return asArray(scores)
      .filter((item) => item && Number.isFinite(Number(item[key])))
      .slice()
      .sort((a, b) => (scoreNumber(b[key]) - scoreNumber(a[key])) || byMonth(a, b))
      .slice(0, count);
  }

  function getTopWorkMoney(scores, count = 3) {
    return asArray(scores)
      .map((item) => ({
        ...item,
        workMoneyScore: Math.round((scoreNumber(item.workScore) + scoreNumber(item.moneyScore)) / 2)
      }))
      .sort((a, b) => (scoreNumber(b.workMoneyScore) - scoreNumber(a.workMoneyScore)) || byMonth(a, b))
      .slice(0, count);
  }

  function top(scores, fnName, count = 3) {
    if (FutureScore && typeof FutureScore[fnName] === 'function') {
      return FutureScore[fnName](scores, count);
    }

    if (fnName === 'getTurningPointMonths') return getTopByKey(scores, 'turningPointScore', count);
    if (fnName === 'getCautionMonths') return getTopByKey(scores, 'cautionScore', count);
    if (fnName === 'getLoveOpportunityMonths') return getTopByKey(scores, 'loveScore', count);
    if (fnName === 'getWorkMoneyMonths') return getTopWorkMoney(scores, count);

    return [];
  }

  function averageActivityScore(item) {
    return Math.round(
      (
        scoreNumber(item && item.loveScore) +
        scoreNumber(item && item.workScore) +
        scoreNumber(item && item.moneyScore) +
        scoreNumber(item && item.relationshipScore)
      ) / 4
    );
  }

  function classifyMonth(item) {
    const explicit = text(item && item.monthType);
    if (explicit) return explicit;

    const turning = scoreNumber(item && item.turningPointScore);
    const caution = scoreNumber(item && item.cautionScore);
    const activity = Math.max(
      scoreNumber(item && item.loveScore),
      scoreNumber(item && item.workScore),
      scoreNumber(item && item.moneyScore),
      scoreNumber(item && item.relationshipScore)
    );

    if (turning >= 68) return '転換期';
    if (caution >= 65) return '慎重月';
    if (activity >= 68 || averageActivityScore(item) >= 64) return '追い風月';

    return '整える月';
  }

  function monthType(item) {
    return classifyMonth(item);
  }

  function typeMonths(scores, typeName) {
    return sortByMonth(asArray(scores).filter((item) => monthType(item) === typeName));
  }

  function uniqueThemes(scores) {
    return Array.from(
      new Set(
        asArray(scores)
          .flatMap((item) => asArray(item.themes))
          .map((theme) => text(theme))
          .filter(Boolean)
      )
    );
  }

  function joinedThemes(item) {
    return asArray(item && item.themes)
      .map((theme) => text(theme))
      .filter(Boolean)
      .slice(0, 3)
      .join('・') || '見直し・準備';
  }

  function firstTheme(item, fallback = '見直し') {
    return asArray(item && item.themes)
      .map((theme) => text(theme))
      .filter(Boolean)[0] || fallback;
  }

  function getTopic(input = {}) {
    return text(input.topic, '総合');
  }

  function getMemo(input = {}) {
    return text(input.memo, '');
  }

  function memoOpening(input = {}) {
    const memo = getMemo(input);
    if (!memo) return '';

    return compact(
`今回のメモには「${memo}」とあります。

この言葉から、あなたが今何を一番気にかけているのかが伝わってきます。`
    );
  }

  function fallbackMonthLead(item) {
    const label = monthLabel(item);
    const type = monthType(item);
    const theme = firstTheme(item);

    const leads = {
      '追い風月': [
        `${label}は、動いた分だけ反応が返ってきやすい月です。迷っているなら、少し勇気を出して外に出してみてください。`,
        `${label}は、待っているより行動した方が手応えを感じやすいタイミングです。完璧じゃなくても、今の自分で大丈夫です。`,
        `${label}は「${theme}」がきっかけになりやすい月です。人との会話や自分の発信を止めすぎないことが大切です。`
      ],
      '慎重月': [
        `${label}は、急ぐより立ち止まって確認するのに向いています。止まることは後退ではありません。`,
        `${label}は気持ちが揺れやすい時期です。大事な判断は焦らず、一晩置くくらいの余裕を持ってください。`,
        `${label}は「${theme}」を丁寧に扱う月です。今あるものを守りながら、次に繋げる準備をしましょう。`
      ],
      '転換期': [
        `${label}は、これまでぼんやりしていたことがはっきり見え始める月です。「このままでいいのか」と感じたら、それが大事なサインです。`,
        `${label}は、気持ちや状況の向きが変わりやすい時期です。古い違和感に気づいたら、無理に無視しないでください。`,
        `${label}は、選び直しのタイミングです。今まで続けていたやり方を見直すことで、新しい道が見えやすくなります。`
      ],
      '整える月': [
        `${label}は、大きく動くより足元を整える月です。予定や気持ちを整理すると、後がとても楽になります。`,
        `${label}は、心に余白を作る時期です。詰め込みすぎていたものを一つ手放すだけでも、視界が変わります。`,
        `${label}は「${theme}」を静かに進めるのに良い月です。焦らず、続けられる形を探してください。`
      ]
    };

    const list = leads[type] || leads['整える月'];
    const index = Math.abs(scoreNumber(item && item.month)) % list.length;
    return list[index];
  }

  function fallbackMonthlyAction(item) {
    const type = monthType(item);
    const theme = firstTheme(item);

    if (type === '追い風月') return `「${theme}」につながることを一つだけ、外に出してみる。`;
    if (type === '慎重月') return '大事な返事や約束は、すぐ決めず一度確認する。';
    if (type === '転換期') return '今の違和感や「変えたい」と思うことを、紙に書き出してみる。';

    return '予定や気持ちを一つ整理して、余白を意識的に作る。';
  }

  function fallbackMonthlyKeyword(item) {
    const type = monthType(item);

    if (type === '追い風月') return '動けば、道は応えてくれる';
    if (type === '慎重月') return '急がない勇気も、前に進む力';
    if (type === '転換期') return '選び直すことで、見える世界が変わる';

    return '余白が、次の扉を開く';
  }

  function cautionLine(item) {
    const explicit = text(item && item.cautionText);
    if (explicit) return explicit;

    const type = monthType(item);
    const caution = scoreNumber(item && item.cautionScore);

    if (type === '慎重月' || caution >= 65) {
      return 'ここは無理に前に進もうとせず、一度立ち止まって確認する方が安心です。';
    }

    if ((type === '転換期' || type === '追い風月') && caution >= 58) {
      return '動きやすい時期ですが、勢いだけで決めないことが大切です。';
    }

    return '';
  }

  function themeLine(item) {
    const label = monthLabel(item);
    const theme = joinedThemes(item);

    const note = text(
      item && item.note,
      monthType(item) === '慎重月'
        ? '急いで広げるより、確認に向く月です'
        : monthType(item) === '追い風月'
          ? '動いたことが反応として返りやすい月です'
          : monthType(item) === '転換期'
            ? '選び直しや方向転換が起こりやすい月です'
            : '準備や土台づくりに向く月です'
    );

    return `${label}は「${theme}」がテーマで、${note}。`;
  }

  function buildYearOverview(input = {}, chart = {}, scores = []) {
    const year = text(input.targetYear, String(new Date().getFullYear()));
    const topic = getTopic(input);
    const seimei = chart.seimei || {};
    const type = seimei.baseType || {};
    const typeName = text(type.name, '星命タイプ');
    const themes = uniqueThemes(scores);
    const mainTheme = themes[0] || '見直し';
    const subTheme = themes[1] || '一歩を出す';
    const strength = text(type.strength || type.essence, '今あるものを形にしていく力');
    const shadow = text(type.shadow, '考えすぎて動きが止まること');

    const memoText = memoOpening(input);

    const topicLine = topic === '恋愛'
      ? '恋愛では、相手のことばかり考えるより、自分が安心できる関係かを大切にしてください。'
      : topic === '仕事'
        ? '仕事では、頑張る量より「どこに力を注ぐか」を選ぶことが今年の鍵になります。'
        : topic === '金運'
          ? '金運では、不安を溜め込むより、お金の流れをシンプルに見える形にすることが大事です。'
          : topic === '人間関係'
            ? '人間関係では、相手に合わせることより、自分が無理なくいられる距離感を見つけることが大切です。'
            : '今年は、無理に大きく変わろうとするより、今の自分に合ったペースを見つける一年になりそうです。';

    return compact(
`${memoText ? `${memoText}\n\n` : ''}${year}年は、あなたにとって「頑張りすぎを手放す年」になりそうです。

${typeName}の強みである「${strength}」は、確かに今年もあなたを支えてくれます。
ただ、その力が強くなりすぎると${shadow}にもなりやすいので、意識的に「ほどく」ことを覚えておくと良いでしょう。

今年は「${mainTheme}」と「${subTheme}」を、少しずつ現実に移していくイメージです。

${topicLine}

大きく結果を出そうとしなくて大丈夫です。
今、あなたが何に疲れていて、何を大事にしたいと思っているのか。
そこに耳を傾けるところから、今年は始まります。`
    );
  }

  function buildTurningPointReading(scores = []) {
    const months = top(scores, 'getTurningPointMonths', 3);

    if (!months.length) {
      return '転換期は、月別スコアが整ってから確認できます。';
    }

    const timeline = sortByMonth(months);

    return compact(
`今年、特に流れが変わりやすい転換期は、影響の強さで見ると${monthList(months)}です。

実際に体感しやすい順番は、${monthList(timeline)}です。

${months.map(themeLine).join('\n')}

転換期は、派手な事件が起きる月というより、
「このままでいいのかな」「そろそろ変えたい」という本音が自然と浮かび上がってくる時期です。

その声に気づけるかどうかが、大事なポイントになります。`
    );
  }

  function buildScoreGuide() {
    return compact(
`ここに出てくる数字は「運の良し悪し」を決める点数ではありません。

数字が高いほど、そのテーマが動きやすく、意識に上がりやすく、現実として形になりやすい目安だと思ってください。

注意の数字が高い月も、怖い月ではありません。
丁寧に確認を入れたり、少し距離を置いたりするだけで、避けられるトラブルは意外と多いものです。`
    );
  }

  function buildMonthlyReading(scores = []) {
    if (!Array.isArray(scores) || !scores.length) {
      return '月別運勢は、未来スコア生成後に表示されます。';
    }

    return sortByMonth(scores)
      .map((item) => {
        const label = monthLabel(item);
        const type = monthType(item);
        const themes = joinedThemes(item);
        const lead = text(item.themeText || item.monthLead, fallbackMonthLead(item));
        const caution = cautionLine(item);
        const action = text(item.monthlyAction, fallbackMonthlyAction(item));
        const keyword = text(item.monthlyKeyword, fallbackMonthlyKeyword(item));

        return compact(
`${label}｜${type}

テーマ：${themes}
恋愛${scoreText(item.loveScore)}／仕事${scoreText(item.workScore)}／金運${scoreText(item.moneyScore)}／注意${scoreText(item.cautionScore)}

${lead}
${caution ? `\n${caution}` : ''}

今月の行動：
${action}

この月の合言葉：
${keyword}。`
        );
      })
      .join('\n\n');
  }

  function buildLoveReading(scores = [], input = {}) {
    const months = top(scores, 'getLoveOpportunityMonths', 3);

    if (!months.length) {
      return '恋愛・出会いの流れは、月別スコアが整ってから確認できます。';
    }

    const timeline = sortByMonth(months);
    const topic = getTopic(input);

    const opening = topic === '恋愛'
      ? '恋愛のことで心がざわついているなら、まず知っておいてほしいことがあります。'
      : '恋愛以外のテーマでも、今年は人とのつながりが心を動かす場面が多くなりそうです。';

    return compact(
`${opening}

相手の気持ちを確かめたいのに、なかなか言葉にできない。
待っているのに反応が薄いと、どんどん不安が大きくなる。
そんな気持ち、すごくわかります。

恋愛・出会いが動きやすい月は${monthList(months)}です。
実際に感じやすい順は${monthList(timeline)}です。

今年は「相手がどう思っているか」だけでなく、
「自分はこの関係で安心できているか」も同じくらい大事にしてみてください。

${months.map((item) => {
  const label = monthLabel(item);
  const cards = asArray(item.cards).filter(Boolean).join('・') || '縁の気配';
  return `${label}は${cards}が重なり、連絡や距離感に変化が出やすい月です。`;
}).join('\n')}`
    );
  }

  function buildWorkReading(scores = [], input = {}) {
    const months = top(scores, 'getWorkMoneyMonths', 3);

    if (!months.length) {
      return '仕事の流れは、月別スコアが整ってから確認できます。';
    }

    const timeline = sortByMonth(months);

    return compact(
`今年の仕事は、「もっと頑張る」よりも「どこに力を注ぐか」を選ぶことが大切になります。

全部を抱え込もうとすると、せっかくの力が分散してしまいます。
自分の役割や見せ方を決めるほど、周りからの反応が変わりやすい一年です。

仕事の流れが出やすい月は${monthList(months)}です。
実際に動きやすい順は${monthList(timeline)}です。

完璧を待たず、今のできる形で一度外に出してみること。
そこから次の道筋が見えてきます。

${months.map((item) => {
  const label = monthLabel(item);
  const theme = firstTheme(item, '見せ方の整理');
  return `${label}は仕事${scoreText(item.workScore)}の流れが強まり、「${theme}」がポイントになります。`;
}).join('\n')}`
    );
  }

  function buildMoneyReading(scores = [], input = {}) {
    const months = getTopByKey(scores, 'moneyScore', 3);

    if (!months.length) {
      return '金運の流れは、月別スコアが整ってから確認できます。';
    }

    const timeline = sortByMonth(months);
    const topic = getTopic(input);

    const opening = topic === '金運'
      ? '金運の不安を和らげるコツは、「不安の正体」を分けて見ることです。'
      : '金運は一気に増やすより、守るべきところと動かすところを明確にすると安定します。';

    return compact(
`${opening}

何にお金を使っているのか。
何を守りたいのか。
どこから収入の入口を作るのか。

この三つを見直すだけで、気持ちがかなり軽くなります。

金運が動きやすい月は${monthList(months)}です。
実際に見直しやすい順は${monthList(timeline)}です。

${months.map((item) => {
  const label = monthLabel(item);
  const theme = firstTheme(item, '収入整理');
  return `${label}は金運${scoreText(item.moneyScore)}の流れが出やすく、「${theme}」を意識すると良いでしょう。`;
}).join('\n')}`
    );
  }

  function buildWorkMoneyReading(scores = [], input = {}) {
    return compact(
`${buildWorkReading(scores, input)}

${buildMoneyReading(scores, input)}`
    );
  }

  function buildCautionReading(scores = []) {
    const months = top(scores, 'getCautionMonths', 3);

    if (!months.length) {
      return '注意して見直したい月は、月別スコアが整ってから確認できます。';
    }

    return compact(
`注意して見直したい月は、影響が強い順で見ると${monthList(months)}です。

ここは悪い月ではありません。
少し丁寧に扱えば、大きなズレを防ぎやすい時期です。

${months.map((item) => {
  const label = monthLabel(item);
  const line = cautionLine(item) || '返事や約束は、一呼吸置いてから決めると安心です。';
  return `${label}は${line}`;
}).join('\n')}`
    );
  }

  function buildLuckyActionReading(scores = [], input = {}) {
    const topic = getTopic(input);

    const actions = {
      '恋愛': [
        '連絡する前に、本当に伝えたいことを一文にまとめる',
        '相手の言葉と行動を分けて冷静に見る',
        '自分が安心できる関係かを自分に問う'
      ],
      '仕事': [
        '今一番見せたいことを一つ整理する',
        '抱えている仕事を「続ける・手放す」で分ける',
        '学んだことを小さな形にして外に出す'
      ],
      '金運': [
        '固定費を一つ見直す',
        '収入につながる行動を紙に書き出す',
        '守るお金と使うお金を明確に分ける'
      ],
      '人間関係': [
        '返事を急がず一旦置く',
        '相手に合わせる前に自分の気持ちを確認する',
        '無理のない距離感を自分で決める'
      ],
      '総合': [
        '月初に今月のテーマを一つ決める',
        '不安を事実と想像に分けて書き出す',
        '月末に「できたこと」を一つ認める'
      ]
    };

    const list = actions[topic] || actions['総合'];

    return compact(
`今年意識したい開運アクション

・${list[0]}
・${list[1]}
・${list[2]}

大きく変えようとしなくて大丈夫です。
一つだけ選んで続けるだけで、未来の向きは少しずつ変わっていきます。`
    );
  }

  function buildYearMap(scores = []) {
    const months = asArray(scores);

    if (!months.length) {
      return '今年の運気マップは、月別スコアが整ってから表示されます。';
    }

    const tailwind = typeMonths(months, '追い風月');
    const cautious = typeMonths(months, '慎重月');
    const turning = typeMonths(months, '転換期');
    const turningRank = top(months, 'getTurningPointMonths', 3);
    const cautionRank = top(months, 'getCautionMonths', 3);

    return compact(
`追い風月：${monthList(tailwind)}
慎重月：${monthList(cautious)}
転換期：${monthList(turning)}

${turningRank.length ? `転換期は影響の強い順で${monthList(turningRank)}。実際に感じやすいのは${monthList(sortByMonth(turningRank))}です。` : ''}

${cautionRank.length ? `注意して見直したい月は${monthList(cautionRank)}。ここは丁寧に扱うと、大きなトラブルを避けやすいタイミングです。` : ''}`
    );
  }

  function buildFutureOutlook(scores = [], input = {}) {
    const year = text(input.targetYear, String(new Date().getFullYear()));
    const turning = sortByMonth(top(scores, 'getTurningPointMonths', 3));
    const first = turning[0] ? monthLabel(turning[0]) : '';
    const last = turning[turning.length - 1] ? monthLabel(turning[turning.length - 1]) : '';

    const timelineText = first && last && first !== last
      ? `${first}から${last}にかけて動いたことは、後半に手応えとして返ってきやすいでしょう。`
      : '今年少しずつ選び直してきたことは、後半に少しずつ形を見せてくれます。';

    return compact(
`${year}年の後半には、今まだぼんやりしている課題や気持ちに、だんだん輪郭が出てくるはずです。

${timelineText}

大きな成果を一気に掴むというより、
「あ、この方向でいいのかもしれない」
そう思える瞬間が増えていくイメージです。

迷いは完全になくならなくても大丈夫です。
選ぶ理由が少しずつ見えてくるだけで、今年の意味は十分にあります。`
    );
  }

  function buildPersonalReadingCta(input = {}) {
    const topic = getTopic(input);

    const topicDetail = topic === '恋愛'
      ? '相手の本音、この関係をどう進めるか、連絡のタイミングなど'
      : topic === '仕事'
        ? '今の環境を続けるべきか、動くならいつ・どの方向か、評価につながる選択など'
        : topic === '金運'
          ? '不安の正体をどう整理するか、収入の入口をどう作るか、守るべきお金の形など'
          : topic === '人間関係'
            ? '今の距離感を続けていいのか、どこまで合わせるべきか、自分を守る線引きなど'
            : '今の迷いの原因と、それに対して一番合う選択肢';

    return compact(
`ここまでで、今年の大きな地図は見えてきたと思います。

ただ、一年全体の傾向ではなく、
「今、あなたが実際に立っている場所」から先を見るには、もう少し細かい視点が必要です。

${topicDetail}

そんなときは、個人鑑定であなたの現在の状況とタロットを重ねてみましょう。
生年月日の流れだけではなく、今この瞬間のあなたに本当に響くメッセージをお伝えします。

一人で抱え込まなくていいんです。
必要なときに、一緒に丁寧に読み解いていきましょう。

未来は、今からの選び方で少しずつ変えていけます。
大丈夫だよ。まだ、間に合います。`
    );
  }

  function buildFutureReading(input = {}, chart = {}, tarotEntries = [], scores = []) {
    const hasTarot = Array.isArray(tarotEntries) && tarotEntries.some((entry) => text(entry.name || entry.nameJa));

    const tarotNote = hasTarot
      ? '選ばれたタロットのメッセージも、未来の流れを読む大切な補助線として重ねています。'
      : '今回はタロット未選択です。星命の流れを中心に、今年の動きをお伝えしています。';

    return compact(
[
  '1. 今年の結論',
  buildYearOverview(input, chart, scores),
  tarotNote,

  '2. 今年の運気マップ',
  buildYearMap(scores),

  '3. 数字の見方',
  buildScoreGuide(),

  '4. 月別未来鑑定',
  buildMonthlyReading(scores),

  '5. 恋愛・仕事・金運の流れ',
  buildLoveReading(scores, input),
  buildWorkReading(scores, input),
  buildMoneyReading(scores, input),

  '6. 今年意識したいこと',
  buildLuckyActionReading(scores, input),

  '7. この先に待っている未来',
  buildFutureOutlook(scores, input),

  '8. 個人鑑定のご案内',
  buildPersonalReadingCta(input)
].join('\n\n')
    );
  }

  return {
    buildFutureReading,
    buildYearOverview,
    buildTurningPointReading,
    buildScoreGuide,
    buildMonthlyReading,
    buildLoveReading,
    buildWorkReading,
    buildMoneyReading,
    buildWorkMoneyReading,
    buildCautionReading,
    buildLuckyActionReading,
    buildYearMap,
    buildFutureOutlook,
    buildPersonalReadingCta
  };
});
