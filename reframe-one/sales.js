// PAY.JP本番審査・決済テスト完了後は、この2行を更新します。
const SALES_STATUS = "preparing"; // "preparing" | "open" | "closed"
const CHECKOUT_URL = ""; // 公開アプリの https://.../payjp/checkout
const LINE_URL = "https://lin.ee/LYnlU0f";

const salesViews = {
  closed: "Re:Frame ONE βの募集は終了しました。ご参加ありがとうございました。"
};

function replaceBrandPositioning() {
  const introLead = document.querySelector('.intro .lead');
  if (introLead) {
    introLead.innerHTML = 'Re:Frame ONEは、Re:Verse Shionの<strong>「未来を当てるのではなく、今の自分を読み直す」</strong>という考え方を、恋愛で心が揺れた瞬間に使える形へ落とし込んだWebアプリです。今すぐしたいこと・相談内容・衝動の強さ・次が見えている度を確認し、6つの画面を通して、最後は自分で次の一歩を選びます。';
  }

  document.querySelectorAll('.copy.panel').forEach((card) => {
    const label = card.querySelector('.label')?.textContent?.trim();
    if (label === 'SEPARATE') {
      const paragraphs = card.querySelectorAll('p');
      if (paragraphs[0]) paragraphs[0].textContent = 'Re:Frame ONEは、相談文に書かれた内容を「確認できる事実」「まだ分からないこと」「自分の解釈」に分けます。';
      if (paragraphs[1]) paragraphs[1].textContent = '相手の理由や本心を、分かったこととして補わない。それが、このアプリの大事なルールです。';
    }
    if (label === 'ONE RANDOM CARD') {
      const title = card.querySelector('h3');
      if (title) title.textContent = 'カードは、相談内容に合わせて都合よく選ばれません。';
    }
  });

  document.querySelectorAll('.step').forEach((step) => {
    if (step.querySelector('b')?.textContent?.includes('5 / TENTATIVE STEP')) {
      const text = step.querySelector('span');
      if (text) text.textContent = '今ある情報から仮の一歩が提示されますが、「正解」として押しつけません。';
    }
  });

  document.querySelectorAll('.section-head').forEach((head) => {
    if (head.querySelector('.label')?.textContent?.trim() === 'WHY RE:FRAME') {
      const h2 = head.querySelector('h2');
      if (h2) h2.innerHTML = '<span class="hline">答えを受け取って終わるのではなく、</span><span class="hline">自分で選び直すところまで。</span>';
    }
  });

  document.querySelectorAll('.diff.panel').forEach((card) => {
    const label = card.querySelector('b')?.textContent?.trim();
    if (label === 'BOUNDARY') {
      const p = card.querySelector('p');
      if (p) p.textContent = '相手の内心、未来、復縁、連絡の有無を断定しません。分からないことを「分からないまま残す」設計を守ります。';
    }
    if (label === 'AI PROCESSING') {
      const tag = card.querySelector('b');
      const title = card.querySelector('h3');
      const p = card.querySelector('p');
      if (tag) tag.textContent = 'INPUT HANDLING';
      if (title) title.textContent = '相談文の扱い';
      if (p) p.textContent = '相談文の整理処理には外部AIサービス（Google Gemini API）を使用します。実名・住所・電話番号・LINE ID・勤務先など、個人を特定できる内容は入力しないでください。';
    }
  });

  document.querySelectorAll('.caption').forEach((caption) => {
    if (caption.textContent.includes('その一行はAIへ送りません')) {
      caption.textContent = '選択理由は任意で一言残せます。その一行は相談本文の整理には使いません。';
    }
  });

  document.querySelectorAll('.faq details').forEach((details) => {
    const summary = details.querySelector('summary')?.textContent || '';
    if (summary.includes('ChatGPT')) {
      const p = details.querySelector('p');
      if (p) p.textContent = 'Re:Frame ONEは会話AIそのものを商品にしたものではありません。詩韻が設計したPAUSE、事実・不明・解釈、感情・願い、ランダムなタロット1枚、仮提案、最終選択という流れを、ひとつの体験として固定したアプリです。AIはその中で相談文を整理するために使う一部の仕組みです。';
    }
  });

  const purchase = document.querySelector('#purchase');
  if (purchase && !document.querySelector('[data-brand-story]')) {
    const section = document.createElement('section');
    section.dataset.brandStory = '1';
    section.innerHTML = `
      <div class="wrap final panel">
        <span class="label">FROM RE:VERSE SHION</span>
        <h2>占いを、答えをもらう時間から、<br>自分を読み直す時間へ。</h2>
        <p>Re:Frame ONEは、詩韻のタロット、思想、物語と同じ「選択を本人へ返す」という考え方から生まれた、Re:Verse Shionのひとつのプロダクトです。タロットを生活の中へ持ち込み、迷った瞬間に自分の選択へ戻るための道具にする。その最初の形がRe:Frame ONEです。</p>
      </div>
    `;
    purchase.before(section);
  }
}

replaceBrandPositioning();

document.querySelectorAll("[data-sales-cta]").forEach((container) => {
  container.replaceChildren();

  if (SALES_STATUS === "open" && CHECKOUT_URL) {
    const form = document.createElement("form");
    form.className = "checkout-form";
    form.method = "post";
    form.action = CHECKOUT_URL;

    const button = document.createElement("button");
    button.type = "submit";
    button.className = "purchase-button";
    button.textContent = "Re:Frame ONE βを購入する｜¥980";
    button.setAttribute("aria-label", "Re:Frame ONE βを980円で購入する");

    form.appendChild(button);
    container.appendChild(form);
    return;
  }

  if (SALES_STATUS === "preparing") {
    const link = document.createElement("a");
    link.className = "preparing-link";
    link.href = LINE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "販売開始をLINEで受け取る";

    const note = document.createElement("small");
    note.className = "sales-status-note";
    note.textContent = "カード決済（PAY.JP）は現在、審査・導入準備中です。";

    container.append(link, note);
    return;
  }

  const message = document.createElement("div");
  message.className = "sales-message";
  message.setAttribute("role", "status");
  message.textContent = salesViews.closed;
  container.appendChild(message);
});