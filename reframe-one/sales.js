const LINE_URL = "https://lin.ee/LYnlU0f";

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
      const title = card.querySelector('h3'); if (title) title.textContent = 'カードは、相談内容に合わせて都合よく選ばれません。';
    }
  });
  document.querySelectorAll('.step').forEach((step) => { if (step.querySelector('b')?.textContent?.includes('5 / TENTATIVE STEP')) { const t=step.querySelector('span'); if(t)t.textContent='今ある情報から仮の一歩が提示されますが、「正解」として押しつけません。'; }});
  document.querySelectorAll('.section-head').forEach((head)=>{if(head.querySelector('.label')?.textContent?.trim()==='WHY RE:FRAME'){const h=head.querySelector('h2');if(h)h.innerHTML='<span class="hline">答えを受け取って終わるのではなく、</span><span class="hline">自分で選び直すところまで。</span>';}});
  document.querySelectorAll('.diff.panel').forEach((card)=>{const label=card.querySelector('b')?.textContent?.trim();if(label==='BOUNDARY'){const p=card.querySelector('p');if(p)p.textContent='相手の内心、未来、復縁、連絡の有無を断定しません。分からないことを「分からないまま残す」設計を守ります。';}if(label==='AI PROCESSING'){const tag=card.querySelector('b'),title=card.querySelector('h3'),p=card.querySelector('p');if(tag)tag.textContent='INPUT HANDLING';if(title)title.textContent='相談文の扱い';if(p)p.textContent='相談文の整理処理にはGoogle Gemini APIを使用します。実名・住所・電話番号・LINE ID・勤務先など、個人を特定できる内容は入力しないでください。';}});
  document.querySelectorAll('.caption').forEach((caption)=>{if(caption.textContent.includes('その一行はAIへ送りません'))caption.textContent='選択理由は任意で一言残せます。その一行は相談本文の整理には使いません。';});
  document.querySelectorAll('.faq details').forEach((details)=>{if((details.querySelector('summary')?.textContent||'').includes('ChatGPT')){const p=details.querySelector('p');if(p)p.textContent='Re:Frame ONEは会話AIそのものを商品にしたものではありません。詩韻が設計したPAUSE、事実・不明・解釈、感情・願い、ランダムなタロット1枚、仮提案、最終選択という流れを、ひとつの体験として固定したアプリです。AIはその中で相談文を整理するために使う一部の仕組みです。';}});
  const purchase=document.querySelector('#purchase');if(purchase&&!document.querySelector('[data-brand-story]')){const section=document.createElement('section');section.dataset.brandStory='1';section.innerHTML='<div class="wrap final panel"><span class="label">FROM RE:VERSE SHION</span><h2>占いを、答えをもらう時間から、<br>自分を読み直す時間へ。</h2><p>Re:Frame ONEは、詩韻のタロット、思想、物語と同じ「選択を本人へ返す」という考え方から生まれた、Re:Verse Shionのひとつのプロダクトです。タロットを生活の中へ持ち込み、迷った瞬間に自分の選択へ戻るための道具にする。その最初の形がRe:Frame ONEです。</p></div>';purchase.before(section);}
}

function applyBuyoutTerms(){
  document.querySelectorAll('.payfacts').forEach((list)=>{if(list.querySelector('[data-buyout-term]'))return;const a=document.createElement('li');a.dataset.buyoutTerm='1';a.textContent='利用期限なし';const b=document.createElement('li');b.dataset.buyoutTerm='1';b.textContent='商品上の総回数制限なし（短時間の技術的制限あり）';list.append(a,b);});
  const purchaseMain=document.querySelector('.purchase-main');if(purchaseMain&&!purchaseMain.querySelector('[data-buyout-copy]')){const p=document.createElement('p');p.dataset.buyoutCopy='1';p.innerHTML='<strong>980円（税込）の買い切りで、利用期限はありません。</strong>月額料金・自動更新はありません。β版の内容・機能・提供形態は、正式版への移行やサービス改善等に伴い変更される場合があります。';const legal=purchaseMain.querySelector('.legal');purchaseMain.insertBefore(p,legal||null);}
  const faq=document.querySelector('.faq');if(faq&&!faq.querySelector('[data-buyout-faq]')){const d=document.createElement('details');d.className='panel';d.dataset.buyoutFaq='1';d.innerHTML='<summary>どのくらい使えますか？</summary><p>980円（税込）の買い切りで、利用期限はありません。商品上の総利用回数制限も設けていません。ただし、安全・負荷・不正利用対策のため、短時間の連続利用には一時的な技術制限があります。β版の内容・機能・提供形態は今後変更される場合があります。</p>';faq.appendChild(d);}
}

replaceBrandPositioning();
applyBuyoutTerms();

document.querySelectorAll('[data-sales-cta]').forEach((container)=>{container.replaceChildren();const link=document.createElement('a');link.className='preparing-link';link.href=LINE_URL;link.target='_blank';link.rel='noopener noreferrer';link.textContent='LINEで購入を申し込む｜¥980';link.setAttribute('aria-label','Re:Frame ONE βをLINEで購入申し込みする');const note=document.createElement('small');note.className='sales-status-note';note.textContent='LINEを開いたら「Re:Frame ONE 購入希望」と送ってください。お支払い方法をご案内します。';container.append(link,note);});
