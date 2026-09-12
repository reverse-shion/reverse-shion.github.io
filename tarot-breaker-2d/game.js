(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha:false, desynchronized:true });
  const startScreen = document.getElementById('start-screen');
  const startButton = document.getElementById('start');
  const loadNote = document.getElementById('load-note');
  const guide = document.getElementById('guide');
  const joystick = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  const resetButton = document.getElementById('reset');

  const WORLD = { width:512, height:384 };
  const SPAWN = { x:256, y:349 };
  const FRAME = { w:32, h:50, count:8 };
  const PLAYER_DRAW = { w:35, h:55 };
  const SPEED = 74;
  const DPR_LIMIT = 1.75;
  const directionRows = { down:0, up:1, left:2, right:3 };

  const map = new Image();
  const sprite = new Image();
  map.src = './assets/star-gate-garden.webp?v=0.1.1';
  sprite.src = './assets/shion-walk.webp?v=0.1.1';

  let loaded = false, running = false, raf = 0, last = 0, elapsed = 0, frameTime = 0;
  let cssWidth = 1, cssHeight = 1, dpr = 1;
  const player = { x:SPAWN.x, y:SPAWN.y, dir:'up', moving:false, frame:0 };
  const camera = { x:SPAWN.x, y:SPAWN.y, zoom:1 };
  const keys = new Set();
  const stick = { active:false, id:null, ox:0, oy:0, x:0, y:0 };

  const scale = 512 / 1448;
  const Z = p => p.map(([x,y]) => [x*scale,y*scale]);
  const walkZones = [
    { type:'poly', points:Z([[555,1086],[902,1086],[950,920],[980,790],[965,675],[925,590],[925,480],[530,480],[500,585],[500,700],[520,845]]) },
    { type:'ellipse', cx:730*scale, cy:515*scale, rx:286*scale, ry:155*scale },
    { type:'poly', points:Z([[550,470],[914,470],[902,370],[870,280],[865,165],[590,165],[580,280],[550,370]]) },
    { type:'poly', points:Z([[430,390],[580,390],[565,515],[390,555],[145,545],[0,515],[0,385],[180,365]]) },
    { type:'poly', points:Z([[900,390],[1040,355],[1230,350],[1448,370],[1448,565],[1265,590],[1080,570],[940,525]]) },
    { type:'poly', points:Z([[1020,555],[1448,540],[1448,840],[1280,845],[1120,790],[1000,680]]) }
  ];

  const sparkles = Array.from({length:28},(_,i)=>({x:42+((i*79)%430),y:38+((i*53)%260),p:i*.73,s:.5+(i%3)*.35}));

  function pointInPoly(x,y,pts){ let c=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i],[xj,yj]=pts[j]; if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-6)+xi)) c=!c; } return c; }
  function walkable(x,y){
    if(x<5||y<45||x>WORLD.width-5||y>WORLD.height-3) return false;
    return walkZones.some(z => z.type==='ellipse' ? (((x-z.cx)/z.rx)**2+((y-z.cy)/z.ry)**2<=1) : pointInPoly(x,y,z.points));
  }
  function resize(){
    const r=canvas.getBoundingClientRect(); cssWidth=Math.max(1,r.width); cssHeight=Math.max(1,r.height);
    dpr=Math.min(window.devicePixelRatio||1,DPR_LIMIT); canvas.width=Math.round(cssWidth*dpr); canvas.height=Math.round(cssHeight*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
    const cover=Math.max(cssWidth/WORLD.width, cssHeight/WORLD.height); camera.zoom=Math.max(cover,1.06);
  }
  function inputVector(){ let x=0,y=0; if(keys.has('ArrowLeft')||keys.has('a'))x--; if(keys.has('ArrowRight')||keys.has('d'))x++; if(keys.has('ArrowUp')||keys.has('w'))y--; if(keys.has('ArrowDown')||keys.has('s'))y++; if(stick.active){x+=stick.x;y+=stick.y;} const l=Math.hypot(x,y); return l>1?{x:x/l,y:y/l}:{x,y}; }
  function move(dt){
    const v=inputVector(),m=Math.hypot(v.x,v.y); player.moving=m>.08;
    if(!player.moving){ player.frame=0; return; }
    player.dir=Math.abs(v.x)>Math.abs(v.y)?(v.x<0?'left':'right'):(v.y<0?'up':'down');
    const d=SPEED*dt,nx=player.x+v.x*d,ny=player.y+v.y*d;
    if(walkable(nx,ny)){player.x=nx;player.y=ny;} else { if(walkable(nx,player.y))player.x=nx; if(walkable(player.x,ny))player.y=ny; }
    frameTime+=dt; if(frameTime>.095){frameTime=0;player.frame=(player.frame+1)%FRAME.count;}
  }
  function updateCamera(dt){
    const vw=cssWidth/camera.zoom,vh=cssHeight/camera.zoom,hx=vw/2,hy=vh/2;
    const tx=Math.max(hx,Math.min(WORLD.width-hx,player.x)); const ty=Math.max(hy,Math.min(WORLD.height-hy,player.y-14)); const e=1-Math.exp(-8*dt); camera.x+=(tx-camera.x)*e; camera.y+=(ty-camera.y)*e;
  }
  function draw(){
    const vw=cssWidth/camera.zoom,vh=cssHeight/camera.zoom; let sx=camera.x-vw/2,sy=camera.y-vh/2; sx=Math.max(0,Math.min(Math.max(0,WORLD.width-vw),sx)); sy=Math.max(0,Math.min(Math.max(0,WORLD.height-vh),sy));
    ctx.save(); ctx.scale(camera.zoom,camera.zoom); ctx.translate(-sx,-sy); ctx.imageSmoothingEnabled=true; ctx.drawImage(map,0,0,WORLD.width,WORLD.height);
    for(const p of sparkles){const a=.1+(Math.sin(elapsed*.9+p.p)+1)*.1;ctx.globalAlpha=a;ctx.fillStyle='#fff4cf';ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,Math.PI*2);ctx.fill();} ctx.globalAlpha=1;
    ctx.fillStyle='rgba(12,10,30,.28)';ctx.beginPath();ctx.ellipse(player.x,player.y-1,10,3.5,0,0,Math.PI*2);ctx.fill();
    const row=directionRows[player.dir],fr=player.moving?player.frame:0; ctx.imageSmoothingEnabled=false; ctx.drawImage(sprite,fr*FRAME.w,row*FRAME.h,FRAME.w,FRAME.h,player.x-PLAYER_DRAW.w/2,player.y-PLAYER_DRAW.h+4,PLAYER_DRAW.w,PLAYER_DRAW.h); ctx.restore();
  }
  function loop(now){ if(!running)return; const dt=Math.min(last?(now-last)/1000:0,.05);last=now;elapsed+=dt;move(dt);updateCamera(dt);ctx.clearRect(0,0,cssWidth,cssHeight);draw();raf=requestAnimationFrame(loop); }
  function reset(){ player.x=SPAWN.x;player.y=SPAWN.y;player.dir='up';player.frame=0;camera.x=SPAWN.x;camera.y=SPAWN.y; }
  function start(){ if(!loaded||running)return; running=true; startScreen.hidden=true; guide.hidden=false; resetButton.hidden=false; resize();reset();last=performance.now();raf=requestAnimationFrame(loop);setTimeout(()=>guide.classList.add('is-gone'),7000); }
  function beginStick(e){ if(!running)return; if(e.pointerType==='mouse'&&e.button!==0)return; if(e.clientX>cssWidth*.66)return; stick.active=true;stick.id=e.pointerId;stick.ox=e.clientX;stick.oy=e.clientY;stick.x=0;stick.y=0;joystick.hidden=false;joystick.style.left=`${stick.ox}px`;joystick.style.top=`${stick.oy}px`;canvas.setPointerCapture?.(e.pointerId);guide.classList.add('is-gone');e.preventDefault(); }
  function updateStick(e){ if(!stick.active||e.pointerId!==stick.id)return; const max=38;let dx=e.clientX-stick.ox,dy=e.clientY-stick.oy,l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max;}stick.x=dx/max;stick.y=dy/max;knob.style.transform=`translate(${dx}px,${dy}px)`;e.preventDefault(); }
  function endStick(e){ if(!stick.active||e.pointerId!==stick.id)return;stick.active=false;stick.id=null;stick.x=stick.y=0;knob.style.transform='translate(0,0)';joystick.hidden=true; }

  startButton.addEventListener('click',start); resetButton.addEventListener('click',reset); canvas.addEventListener('pointerdown',beginStick,{passive:false});canvas.addEventListener('pointermove',updateStick,{passive:false});canvas.addEventListener('pointerup',endStick);canvas.addEventListener('pointercancel',endStick);
  window.addEventListener('resize',()=>{resize();if(running)draw();});
  window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d'].includes(k)){keys.add(k);guide.classList.add('is-gone');e.preventDefault();}},{passive:false});
  window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));

  Promise.all([map.decode(),sprite.decode()]).then(()=>{loaded=true;resize();reset();draw();startButton.disabled=false;startButton.textContent='星の国へ';loadNote.textContent='タップして探索を始める';}).catch(()=>{startButton.disabled=true;startButton.textContent='読み込み失敗';loadNote.textContent='Safariで再読み込みしてください';});
})();
