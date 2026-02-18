const music = document.getElementById("music");
const video = document.getElementById("bgVideo");
const canvas = document.getElementById("noteCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const startBtn = document.getElementById("startBtn");

let notes = [];
let score = 0;
let combo = 0;
let running = false;
let duration = 60;

function createNotes() {
  notes = [];
  for (let i = 1; i < duration; i += 0.6) {
    notes.push({ time: i, hit: false });
  }
}

function resize() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

function startGame() {
  score = 0;
  combo = 0;
  createNotes();
  running = true;

  music.currentTime = 0;
  video.currentTime = 0;

  music.play();
  video.play();

  loop();
}

startBtn.addEventListener("click", startGame);

function loop() {
  if (!running) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const time = music.currentTime;

  notes.forEach(note => {
    if (note.hit) return;

    const diff = note.time - time;
    const y = canvas.height * 0.6 - diff * 400;

    // 自動MISS処理（通過）
    if (diff < -0.2 && !note.hit) {
      note.hit = true;
      combo = 0;
    }

    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(canvas.width/2, y, 12, 0, Math.PI*2);
    ctx.fill();
  });

  scoreEl.textContent = score;
  comboEl.textContent = combo;

  if (time >= duration) {
    running = false;
    alert("RESULT\nScore: " + score);
  }

  requestAnimationFrame(loop);
}

function judge() {
  if (!running) return;

  const time = music.currentTime;

  let bestNote = null;
  let closest = 999;

  notes.forEach(note => {
    if (note.hit) return;
    const diff = Math.abs(note.time - time);
    if (diff < closest) {
      closest = diff;
      bestNote = note;
    }
  });

  if (!bestNote) return;

  if (closest < 0.08) {
    bestNote.hit = true;
    combo++;
    score += 100 + combo * 5;
  } 
  else if (closest < 0.15) {
    bestNote.hit = true;
    combo++;
    score += 50 + combo * 3;
  } 
  else {
    combo = 0;
  }
}

canvas.addEventListener("touchstart", judge);
canvas.addEventListener("mousedown", judge);
