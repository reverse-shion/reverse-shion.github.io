/* 音トグル */
(function(){
  const btn=document.querySelector('[data-sound-toggle]');
  if(!btn)return;
  btn.addEventListener('click',function(){
    const on=this.getAttribute('aria-pressed')==='true';
    this.setAttribute('aria-pressed',String(!on));
  });
})();

/* 光転移 */
const overlay=document.getElementById('ensotrans');
function playTransfer(x,y){
  if(!overlay)return;
  overlay.style.background=`radial-gradient(120px 120px at ${x}px ${y}px,rgba(255,255,255,0.95),rgba(255,255,255,0.85) 35%,rgba(255,255,255,0.0) 60%)`;
  overlay.classList.add('is-anim');
}
function transferTo(url){
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay=reduce?120:820;
  setTimeout(()=>{window.location.href=url;},delay);
}
document.querySelectorAll('a[href^="/philosophy"],a[href^="/tarotbreaker"]').forEach(el=>{
  el.addEventListener('click',ev=>{
    const x=ev.clientX??window.innerWidth/2;
    const y=ev.clientY??window.innerHeight/2;
    playTransfer(x,y);
    transferTo(el.getAttribute('href'));
    ev.preventDefault();
  });
});
window.addEventListener('pageshow',()=>{overlay.classList.remove('is-anim');});
