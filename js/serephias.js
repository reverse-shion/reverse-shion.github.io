/* ===========================
   1. 星屑アニメーション
=========================== */
const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let stars = Array.from({length:180}, () => ({
  x: Math.random() * w,
  y: Math.random() * h,
  s: Math.random() * 2,
  v: 0.2 + Math.random() * 0.3
}));

function animateStars() {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "white";
  stars.forEach(star => {
    ctx.fillRect(star.x, star.y, star.s, star.s);
    star.y += star.v;
    if (star.y > h) star.y = 0;
  });
  requestAnimationFrame(animateStars);
}
animateStars();

/* ===========================
   2. オープニング4カット
=========================== */
const cuts = [
  document.getElementById("cut1"),
  document.getElementById("cut2"),
  document.getElementById("cut3"),
  document.getElementById("cut4")
];

let step = 0;

function playOP() {
  if (step < cuts.length) {
    cuts[step].style.opacity = 1;
    setTimeout(() => {
      cuts[step].style.opacity = 0;
      step++;
      setTimeout(playOP, 400); 
    }, 2000);
  } else {
    startText();
  }
}
playOP();

/* ===========================
   3. テキスト・タイプライター
=========================== */

const textBox = document.getElementById("text-box");
const tw = document.getElementById("typewriter");
const skip = document.getElementById("skip-btn");

const messages = [
  "我が名は──セレフィアス。\n星霊の神子にして、言霊の巫子。",
  "あなたがこの門を越えたということは、もう “星の記憶” から逃れられないということ。",
  "光は失われてはいない。ただ、思い出されるのを待っているだけ。",
  "あなたの星は、まだ沈んでいない。",
  "そして──あなたの魂の奥底で眠る“始原の声”も、いま静かに目を覚まそうとしている。",
  "さあ──歩もう。星の言霊が導く場所へ。",
  "ここは、魂がひらかれる場所。ようこそ──星霊の間へ。"
];

let msgIndex = 0;
let charIndex = 0;
let typing = true;

function typeMessage() {
  if (charIndex < messages[msgIndex].length) {
    tw.textContent += messages[msgIndex][charIndex];
    charIndex++;
    setTimeout(typeMessage, 55);
  } else {
    msgIndex++;
    if (msgIndex < messages.length) {
      charIndex = 0;
      tw.innerHTML += "<br><br>";
      setTimeout(typeMessage, 500);
    } else {
      finishOP();
    }
  }
}

function startText() {
  textBox.style.opacity = 1;
  setTimeout(typeMessage, 600);
}

/* SKIPボタン */
skip.addEventListener("click", () => {
  tw.textContent = messages.join("\n\n");
  finishOP();
});

/* ===========================
   4. メニュー出現
=========================== */
const menu = document.getElementById("main-menu");
const deepgate = document.getElementById("deepgate-btn");

function finishOP() {
  textBox.style.opacity = 0;
  setTimeout(() => {
    menu.style.opacity = 1;
    menu.style.pointerEvents = "auto";
  }, 1200);

  /* 月2回の開門設定 */
  const d = new Date().getDate();
  if (d !== 1 && d !== 15) {
    deepgate.classList.add("locked");
  }
}
