// /assets/js/letters.js
// 各行<p class="line"> を 1文字ずつ <span class="char"> に分解し、順次 .on を付与
(() => {
  const LINE_DELAY   = 280;  // 行間（ms）：行が visible になってから最初の文字が出るまで
  const CHAR_INTERVAL= 26;   // 文字間（ms）：1文字ごとの遅延
  const MAX_PER_TICK = 3;    // 1フレームで進める最大文字数（モバイル負荷軽減）

  function splitToChars(line){
    if(line.dataset.splitted) return;
    line.dataset.splitted = "1";
    const html = line.innerHTML;
    const frag = document.createDocumentFragment();
    // テキストノードだけラップ（タグは保持）
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT, null);
    const targets = [];
    while(walker.nextNode()){ targets.push(walker.currentNode); }
    targets.forEach(node=>{
      const chars = [...node.nodeValue];
      const spanWrap = document.createDocumentFragment();
      chars.forEach(ch=>{
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        spanWrap.appendChild(s);
      });
      node.parentNode.replaceChild(spanWrap, node);
    });
  }

  function revealLineChars(line){
    const chars = Array.from(line.querySelectorAll('.char'));
    if(!chars.length) return;
    let i = 0;
    const tick = () => {
      let step = 0;
      while(i < chars.length && step < MAX_PER_TICK){
        chars[i++].classList.add('on');
        step++;
      }
      if(i < chars.length) requestAnimationFrame(tick);
    };
    setTimeout(()=>requestAnimationFrame(tick), LINE_DELAY);
  }

  function setup(){
    const lines = Array.from(document.querySelectorAll('.mode .line'));
    // IntersectionObserver：行が見えたら分割→順次出現
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const line = e.target;
          splitToChars(line);
          line.classList.add('visible');
          revealLineChars(line);
          io.unobserve(line);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });

    lines.forEach(l => io.observe(l));

    // タブ切替互換：tabpanelが切り替わったら対象行を再監視
    document.querySelector('.mode-switch')?.addEventListener('click', (ev)=>{
      const btn = ev.target.closest('[role="tab"]'); if(!btn) return;
      const targetId = btn.getAttribute('aria-controls');
      const panel = document.getElementById(targetId);
      if(!panel) return;
      panel.querySelectorAll('.line').forEach(l=>{
        // 再読み込み時にももう一度見せたい場合は data-splitted を消す
        // l.removeAttribute('data-splitted');
        io.observe(l);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', setup);
})();
