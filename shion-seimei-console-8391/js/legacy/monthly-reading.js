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

    if (turning >= 76) return '転換期';
    if (caution >= 68) return '慎重月';
    if (activity >= 74 || averageActivityScore(item) >= 70) return '追い風月';

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

  function secondTheme(item, fallback = '今できる一歩') {
    return asArray(item && item.themes)
      .map((theme) => text(theme))
      .filter(Boolean)[1] || fallback;
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

この言葉から、今のあなたが何を一番気にかけているのかが伝わってきます。`
    );
  }

  function scoreTone(value) {
    const score = scoreNumber(value);

    if (score >= 80) return 'かなり動きやすい';
    if (score >= 70) return '動きが出やすい';
    if (score >= 60) return '少し意識に上がりやすい';
    if (score >= 50) return '穏やかに扱いたい';
    return '無理に急がなくていい';
  }

  function buildSoftScoreLine(item) {
    return `恋愛は${scoreTone(item && item.loveScore)}、仕事は${scoreTone(item && item.workScore)}、金運は${scoreTone(item && item.moneyScore)}月です。注意面は${scoreTone(item && item.cautionScore)}ため、勢いより確認を大切にしてください。`;
  }

  function isGenericLead(value) {
    const v = text(value);

    if (!v) return true;

    return [
      '不安を溜め込まず、お金の入口と出口',
      '足元を見直す月です',
      '追い風の吹く月です',
      '慎重に進みたい月です',
      '転換期です。気持ちや状況の向き',
      '行動したことに反応が返ってきやすくなります',
      '焦らず準備することで、後半の動きが楽になります'
    ].some((phrase) => v.includes(phrase));
  }

  function moneyFocusByMonth(item) {
    const month = scoreNumber(item && item.month);
    const type = monthType(item);
    const theme = firstTheme(item);

    if (type === '慎重月') {
      return `${monthLabel(item)}は、大きな支出や契約を急がず確認したい月です。金額だけでなく、「今の自分に本当に必要か」を一度見直してください。`;
    }

    if (type === '転換期') {
      return `${monthLabel(item)}は、お金の使い方や収入の作り方を選び直しやすい月です。「前と同じやり方でいいのか」と感じたら、そこに見直しのヒントがあります。`;
    }

    if (type === '追い風月') {
      return `${monthLabel(item)}は、収入につながる行動を試しやすい月です。いきなり大きく増やすより、今できる入口を一つ増やす意識が合っています。`;
    }

    if ([1, 2].includes(month)) {
      return `${monthLabel(item)}は、固定費や日々の出費を見直すのに向いています。まずは「なんとなく使っているお金」を一つ減らすだけでも十分です。`;
    }

    if ([9, 10].includes(month)) {
      return `${monthLabel(item)}は、守るお金と動かすお金を分けたい月です。安心のために残すもの、未来のために使うものを分けて考えてください。`;
    }

    if ([11, 12].includes(month)) {
      return `${monthLabel(item)}は、来年に向けたお金の使い方を決める時期です。焦って増やすより、続けられる仕組みを作る方が安定します。`;
    }

    return `${monthLabel(item)}は、「${theme}」を通してお金の扱い方を見直したい月です。増やすことだけでなく、安心して使える形を作ることも大切です。`;
  }

  function topicMonthLead(item, topic = '総合') {
    const label = monthLabel(item);
    const type = monthType(item);
    const main = firstTheme(item);
    const sub = secondTheme(item);

    if (topic === '金運') {
      return moneyFocusByMonth(item);
    }

    if (topic === '恋愛') {
      if (type === '追い風月') {
        return `${label}は、人との距離が動きやすい月です。相手の反応を待つだけでなく、自分の気持ちも短い言葉にしてみてください。`;
      }

      if (type === '慎重月') {
        return `${label}は、恋愛を急いで決めつけない方がいい月です。相手の言葉だけでなく、行動の温度も落ち着いて見てください。`;
      }

      if (type === '転換期') {
        return `${label}は、関係性の見え方が変わりやすい月です。「本当はどうしたいのか」を自分に聞く時間を作ってください。`;
      }

      return `${label}は、恋愛面では心の整理を優先したい月です。不安になった時ほど、事実と想像を分けて見てください。`;
    }

    if (topic === '仕事') {
      if (type === '追い風月') {
        return `${label}は、仕事で手応えを感じやすい月です。提案、発信、相談など、外へ出す行動に追い風があります。`;
      }

      if (type === '慎重月') {
        return `${label}は、仕事の進め方を確認したい月です。抱えすぎている作業や、無理な予定を一度見直してください。`;
      }

      if (type === '転換期') {
        return `${label}は、働き方や役割の見方が変わりやすい月です。続けるものと変えるものを分けると、次が見えてきます。`;
      }

      return `${label}は、仕事の足場を作る月です。派手な成果より、続けられる形を作ることが後の評価につながります。`;
    }

    if (topic === '人間関係') {
      if (type === '追い風月') {
        return `${label}は、人との会話から次のきっかけが生まれやすい月です。短い連絡や近況報告でも、関係が動く可能性があります。`;
      }

      if (type === '慎重月') {
        return `${label}は、言葉の行き違いに注意したい月です。返事を急がず、少し時間を置いてから伝えると安心です。`;
      }

      if (type === '転換期') {
        return `${label}は、距離感を選び直す月です。無理に合わせてきた関係ほど、自分の本音が見えやすくなります。`;
      }

      return `${label}は、人間関係を穏やかに見直したい月です。誰かに合わせる前に、自分の疲れ具合も確認してください。`;
    }

    if (type === '追い風月') {
      return `${label}は、「${main}」が表に出やすい月です。${sub}を意識すると、動いた分だけ手応えが返ってきやすくなります。`;
    }

    if (type === '慎重月') {
      return `${label}は、「${main}」を急がず扱いたい月です。すぐに決めるより、一度確認を入れることで後悔を減らせます。`;
    }

    if (type === '転換期') {
      return `${label}は、「${main}」をきっかけに見え方が変わりやすい月です。違和感を無視せず、選び直す余地を残してください。`;
    }

    return `${label}は、「${main}」を静かに進めたい月です。大きく動くより、今あるものを扱いやすい形に直していきましょう。`;
  }

  function buildMonthlyLeadText(item, topic = '総合') {
    const themeText = text(item && item.themeText);
    const monthLead = text(item && item.monthLead);

    if (themeText && !isGenericLead(themeText)) return themeText;
    if (monthLead && !isGenericLead(monthLead)) return monthLead;

    return topicMonthLead(item, topic);
  }

  function fallbackMonthlyAction(item, topic = '総合') {
    const type = monthType(item);
    const theme = firstTheme(item);

    if (topic === '金運') {
      if (type === '追い風月') return '収入につながりそうな行動を、一つだけ試してみる。';
      if (type === '慎重月') return '大きな支出や契約は、時間を置いてから決める。';
      if (type === '転換期') return 'お金の使い方で変えたい習慣を一つ書き出す。';
      return '固定費か毎日の出費を一つだけ見直す。';
    }

    if (topic === '恋愛') {
      if (type === '追い風月') return '伝えたい気持ちを短い言葉にしてみる。';
      if (type === '慎重月') return '相手の反応だけで判断せず、自分の安心感も確認する。';
      if (type === '転換期') return 'この関係で本当に望んでいることを書き出す。';
      return '不安になった出来事を、事実と想像に分けてみる。';
    }

    if (topic === '仕事') {
      if (type === '追い風月') return '今見せたい成果や考えを、一つだけ外に出す。';
      if (type === '慎重月') return '抱えている仕事を「続けるもの」と「手放すもの」に分ける。';
      if (type === '転換期') return '働き方で変えたい点を一つ明確にする。';
      return '優先順位を一つ決め、力を注ぐ場所を絞る。';
    }

    if (topic === '人間関係') {
      if (type === '追い風月') return '気になっている相手に、短い近況を伝えてみる。';
      if (type === '慎重月') return '返事を急がず、自分の本音を確認してから伝える。';
      if (type === '転換期') return '無理を感じている関係を一つ見直す。';
      return '心が疲れる距離感を、少しだけ調整する。';
    }

    if (type === '追い風月') return `「${theme}」につながることを一つ、外に出してみる。`;
    if (type === '慎重月') return '大事な返事や約束は、すぐ決めず一度確認する。';
    if (type === '転換期') return '今の違和感や「変えたい」と思うことを書き出す。';

    return '予定や気持ちを一つ整理して、余白を作る。';
  }

  function fallbackMonthlyKeyword(item) {
    const type = monthType(item);

    if (type === '追い風月') return '動けば、道は応えてくれる';
    if (type === '慎重月') return '急がない勇気も、前に進む力になる';
    if (type === '転換期') return '選び直すことで、景色は変わる';

    return '余白が、次の力を生む';
  }

  function cautionLine(item) {
    const explicit = text(item && item.cautionText);
    const type = monthType(item);
    const caution = scoreNumber(item && item.cautionScore);

    if (explicit && caution >= 65) return explicit;

    if (type === '慎重月' || caution >= 68) {
      return 'ここは急いで前に進めるより、予定・お金・言葉を一度確認したい月です。';
    }

    if ((type === '転換期' || type === '追い風月') && caution >= 60) {
      return '動きやすい時期ですが、勢いだけで決めると後で直したくなるかもしれません。大事なことほど一呼吸置いてください。';
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
          ? '行動が反応につながりやすい月です'
          : monthType(item) === '転換期'
            ? '選び直しや方向転換が起こりやすい月です'
            : '準備や見直しに向く月です'
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
      ? '恋愛では、相手の気持ちを追いかけすぎるより、自分が安心できる関係かを見ていくことが大切です。'
      : topic === '仕事'
        ? '仕事では、頑張る量より「どこに力を注ぐか」を選ぶことが今年の鍵になります。'
        : topic === '金運'
          ? '金運では、不安を抱え込むより、お金の入口・出口・守る分を分けて見ることが大事です。'
          : topic === '人間関係'
            ? '人間関係では、相手に合わせることより、自分が無理なくいられる距離感を見つけることが大切です。'
            : '今年は、無理に大きく変わろうとするより、今の自分に合うペースを見つける一年になりそうです。';

    return compact(
`${memoText ? `${memoText}\n\n` : ''}${year}年は、あなたにとって「頑張りすぎを手放す年」になりそうです。

${typeName}の強みである「${strength}」は、今年もあなたを支えてくれます。
ただ、その力が強く出すぎると、${shadow}にもつながりやすくなります。

今年は「${mainTheme}」と「${subTheme}」を、現実の中で少しずつ扱っていく年です。

${topicLine}

大きく結果を出そうとしなくて大丈夫です。
今、何に疲れていて、何を大事にしたいのか。
そこに気づくところから、今年の流れは変わり始めます。`
    );
  }

  function buildTurningPointReading(scores = []) {
    const months = top(scores, 'getTurningPointMonths', 3);

    if (!months.length) {
      return '転換期は、月別スコアが整ってから確認できます。';
    }

    const timeline = sortByMonth(months);

    return compact(
`今年、選択や切り替えが強く出やすい月は、影響の強さで見ると${monthList(months)}です。

実際に体感しやすい順番は、${monthList(timeline)}です。

${months.map(themeLine).join('\n')}

転換期は、必ず大きな事件が起きる月ではありません。
「このままでいいのかな」「そろそろ変えたい」という本音が浮かびやすい時期です。

その声に気づけるかどうかが、大事なポイントになります。`
    );
  }

  function buildScoreGuide() {
    return compact(
`数字は「運の良し悪し」を決める点数ではありません。

恋愛・仕事・金運・注意のテーマが、どれくらい表に出やすいかを見るための目安です。

注意が高い月も、怖い月ではありません。
予定、支出、言葉、判断を少し丁寧に扱うことで、避けられるズレは多くあります。`
    );
  }

  function buildMonthlyReading(scores = [], input = {}) {
    if (!Array.isArray(scores) || !scores.length) {
      return '月別運勢は、未来スコア生成後に表示されます。';
    }

    const topic = getTopic(input);

    return sortByMonth(scores)
      .map((item) => {
        const label = monthLabel(item);
        const type = monthType(item);
        const themes = joinedThemes(item);
        const lead = buildMonthlyLeadText(item, topic);
        const caution = cautionLine(item);
        const action = fallbackMonthlyAction(item, topic);
        const keyword = text(item.monthlyKeyword, fallbackMonthlyKeyword(item));

        return compact(
`${label}｜${type}

テーマ：${themes}
月の見方：${buildSoftScoreLine(item)}

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

    if (topic !== '恋愛') {
      return compact(
`恋愛や人との縁が動きやすい月は、${monthList(months)}です。
実際に感じやすい順は${monthList(timeline)}です。

今回の主テーマは「${topic}」なので、ここでは恋愛そのものよりも、
人とのつながりが安心感や行動のきっかけになりやすい時期として見てください。

${months.map((item) => {
  const label = monthLabel(item);
  const cards = asArray(item.cards).filter(Boolean).join('・') || '縁の気配';
  return `${label}は${cards}が重なり、人とのやり取りから気づきが生まれやすい月です。`;
}).join('\n')}`
      );
    }

    return compact(
`恋愛のことで心がざわついているなら、まず知っておいてほしいことがあります。

相手の気持ちを確かめたいのに、なかなか聞けない。
待っている時間が長くなるほど、不安だけが大きくなる。
その苦しさは、決して弱さではありません。

恋愛・出会いが動きやすい月は${monthList(months)}です。
実際に感じやすい順は${monthList(timeline)}です。

今年は「相手がどう思っているか」だけでなく、
「自分はこの関係で安心できているか」も大切にしてください。

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
    const topic = getTopic(input);

    const opening = topic === '金運'
      ? '金運を安定させるには、仕事や収入の入口をどう作るかも大切になります。'
      : '今年の仕事は、「もっと頑張る」よりも「どこに力を注ぐか」を選ぶことが大切になります。';

    return compact(
`${opening}

全部を抱え込もうとすると、せっかくの力が分散してしまいます。
役割、見せ方、収入につながる行動を絞るほど、次の道筋が見えやすくなります。

仕事の動きが出やすい月は${monthList(months)}です。
実際に動きやすい順は${monthList(timeline)}です。

${months.map((item) => {
  const label = monthLabel(item);
  const theme = firstTheme(item, '見せ方の整理');
  return `${label}は仕事面で「${theme}」がポイントになります。完璧を待つより、今できる形で一度外へ出してみてください。`;
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
      : '金運は一気に増やすより、守るところと動かすところを分けると安定しやすくなります。';

    return compact(
`${opening}

何にお金を使っているのか。
何を守りたいのか。
どこから収入の入口を作るのか。

この三つが見えてくると、漠然とした不安は少し軽くなります。

金運が動きやすい月は${monthList(months)}です。
実際に見直しやすい順は${monthList(timeline)}です。

${months.map((item) => {
  const label = monthLabel(item);
  const theme = firstTheme(item, '収入整理');

  if (monthType(item) === '慎重月') {
    return `${label}は「${theme}」を急がず確認したい月です。大きな支出や契約は、一度時間を置いてから判断してください。`;
  }

  if (monthType(item) === '転換期') {
    return `${label}は「${theme}」をきっかけに、お金の使い方を選び直しやすい月です。前のやり方にこだわりすぎないことが鍵になります。`;
  }

  if (monthType(item) === '追い風月') {
    return `${label}は「${theme}」を収入の入口につなげやすい月です。思いついた行動を一つ、現実に試してみてください。`;
  }

  return `${label}は「${theme}」を見直しながら、お金の扱い方を安定させたい月です。`;
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
        '相手の言葉と行動を分けて見る',
        '自分が安心できる関係かを自分に問う'
      ],
      '仕事': [
        '今一番見せたいことを一つ整理する',
        '抱えている仕事を「続ける・手放す」で分ける',
        '学んだことを形にして外に出す'
      ],
      '金運': [
        '固定費を一つ見直す',
        '収入につながる行動を紙に書き出す',
        '守るお金と使うお金を分ける'
      ],
      '人間関係': [
        '返事を急がず一旦置く',
        '相手に合わせる前に自分の気持ちを確認する',
        '無理のない距離感を自分で決める'
      ],
      '今月の運勢': [
        '今月やることを一つに絞る',
        '後回しにしている確認を一つ済ませる',
        '月末にできたことを一つ認める'
      ],
      '総合': [
        '月初に今月のテーマを一つ決める',
        '不安を事実と想像に分けて書き出す',
        '月末にできたことを一つ認める'
      ]
    };

    const list = actions[topic] || actions['総合'];

    return compact(
`今年意識したい開運アクション

・${list[0]}
・${list[1]}
・${list[2]}

大きく変えようとしなくて大丈夫です。
一つ選んで続けるだけでも、未来の向きは少しずつ変わっていきます。`
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

選択や切り替えが強く出やすい月は、影響の強い順で${monthList(turningRank)}です。
実際に体感しやすい順番は${monthList(sortByMonth(turningRank))}です。

注意して見直したい月は${monthList(cautionRank)}です。
ここは怖がる月ではなく、確認を丁寧にすることで余計な不安やズレを防ぎやすいタイミングです。`
    );
  }

  function buildFutureOutlook(scores = [], input = {}) {
    const year = text(input.targetYear, String(new Date().getFullYear()));
    const turning = sortByMonth(top(scores, 'getTurningPointMonths', 3));
    const first = turning[0] ? monthLabel(turning[0]) : '';
    const last = turning[turning.length - 1] ? monthLabel(turning[turning.length - 1]) : '';

    const timelineText = first && last && first !== last
      ? `${first}から${last}にかけて向き合ったことは、後半に手応えとして返ってきやすいでしょう。`
      : '今年選び直してきたことは、後半に少しずつ形を見せてくれます。';

    return compact(
`${year}年の後半には、今まだぼんやりしている課題や気持ちに、少しずつ輪郭が出てきそうです。

${timelineText}

大きな成果を一気に掴むというより、
「あ、この方向でいいのかもしれない」
そう思える瞬間が増えていくイメージです。

迷いが完全になくならなくても大丈夫です。
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
          ? '不安の正体、支出の見直し、収入につながる行動の整理など'
          : topic === '人間関係'
            ? '今の距離感を続けていいのか、どこまで合わせるべきか、自分を守る線引きなど'
            : '今の迷いの原因と、それに対して一番合う選択肢';

    return compact(
`ここまでで、今年の大きな傾向と、意識したい月は見えてきました。

ただ、実際の悩みは一人ひとり違います。
${topicDetail}は、今の状況とタロットを重ねることで、もっと細かく見ていけます。

必要な時は、一人で抱え込まずに相談してください。
あなたの状況に合わせて、一緒に読み解いていきましょう。`
    );
  }

  function buildFutureReading(input = {}, chart = {}, tarotEntries = [], scores = [], options = {}) {
    const hasTarot = Array.isArray(tarotEntries) && tarotEntries.some((entry) => text(entry.name || entry.nameJa));
    const includeCta = options && options.includeCta === true;

    const tarotNote = hasTarot
      ? '選ばれたタロットのメッセージも、未来を読むための補助線として重ねています。'
      : '今回はタロット未選択です。星命の流れを中心に、今年の動きを見ています。';

    const sections = [
      '【今年の結論】',
      buildYearOverview(input, chart, scores),
      tarotNote,

      '【今年の運気マップ】',
      buildYearMap(scores),

      '【数字の見方】',
      buildScoreGuide(),

      '【月別未来鑑定】',
      buildMonthlyReading(scores, input),

      '【恋愛・仕事・金運の流れ】',
      buildLoveReading(scores, input),
      buildWorkReading(scores, input),
      buildMoneyReading(scores, input),

      '【今年意識したいこと】',
      buildLuckyActionReading(scores, input),

      '【この先に待っている未来】',
      buildFutureOutlook(scores, input)
    ];

    if (includeCta) {
      sections.push(
        '【もっと深く見たい方へ】',
        buildPersonalReadingCta(input)
      );
    }

    return compact(sections.join('\n\n'));
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
