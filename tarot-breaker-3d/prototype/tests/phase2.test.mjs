import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createState, movePlayer, lookPlayer, nearbyEvent, enterSkit, leaveSkit } from '../js/state.js';
import { InputController } from '../js/input.js';
import { AudioController } from '../js/audio.js';
import { SkitBridge } from '../js/skit-bridge.js';
const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.PHASE2_NODE_MODULES ? path.join(process.env.PHASE2_NODE_MODULES, 'jsdom') : 'jsdom');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const json = p => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
const map = json('../data/world.json'), events = json('../data/events.json').events, characters = json('../data/characters.json');
const skitData = JSON.parse(fs.readFileSync(path.join(root, events[0].skitPath), 'utf8'));

test('walk to the event, preserve pose across two complete conversations, and walk again', () => {
  const state = createState(map); state.mode = 'explore';
  assert.equal(nearbyEvent(state, events, map), null);
  for (let i = 0; i < 48; i++) movePlayer(state, { x: 0, z: -1 }, 0.05, map);
  const event = nearbyEvent(state, events, map); assert.equal(event.id, events[0].id);
  lookPlayer(state, 20, -10); const position = { ...state.player };
  for (let i = 0; i < 2; i++) {
    assert.equal(enterSkit(state, event), true); assert.equal(enterSkit(state, event), false);
    movePlayer(state, { x: 1, z: 1 }, 1, map); lookPlayer(state, 100, 100);
    assert.deepEqual(state.player, position);
    assert.equal(leaveSkit(state, true), true); assert.equal(leaveSkit(state), false);
    assert.deepEqual(state.player, position);
  }
  movePlayer(state, { x: 1, z: 0 }, 0.05, map);
  assert.notEqual(state.player.x, position.x); assert.equal(state.completed, 2);
});
test('collision, diagonal speed, long-frame clamp and pitch limits', () => {
  const state = createState(map); state.mode = 'explore';
  const before = { ...state.player }; movePlayer(state, {x:1,z:1}, 10, map);
  assert.ok(Math.hypot(state.player.x-before.x,state.player.z-before.z) <= map.player.speed*0.05+1e-9);
  for (let i=0;i<1000;i++) movePlayer(state,{x:1,z:1},0.05,map);
  assert.equal(state.player.x,map.bounds.maxX-map.player.radius); assert.equal(state.player.z,map.bounds.maxZ-map.player.radius);
  state.player = { x: -3.6, z: 2, yaw: 0, pitch: 0 };
  for (let i=0;i<100;i++) movePlayer(state,{x:0,z:-1},0.05,map);
  assert.ok(state.player.z >= 0.75);
  for(let i=0;i<100;i++) lookPlayer(state,0,80);
  assert.equal(state.player.pitch,-0.8);
});
test('selected JSON has valid transitions, available portraits and protected Shiopon address', () => {
  const expressions = new Map();
  assert.ok(skitData.nodes[skitData.start]);
  for (const node of Object.values(skitData.nodes)) {
    if(node.next) assert.ok(skitData.nodes[node.next]);
    for(const choice of node.choices||[]) assert.ok(skitData.nodes[choice.next]);
    if(node.speaker==='shiopon') assert.doesNotMatch(node.text,/シオン(?:さま|様)/);
    for(const frame of node.cast||[]) {
      const relative=`assets/skit/${frame.character}/${frame.expression.replace(/\s+/g,'-')}.png`;
      assert.ok(fs.statSync(path.join(root,relative)).size>0,relative);
      const set=expressions.get(frame.character)||new Set(); set.add(frame.expression);expressions.set(frame.character,set);
    }
  }
  for(const id of ['shion','shiopon','lumiere']) assert.ok(expressions.get(id).size>=2);
  assert.equal(characters.shiopon.shionAddress,'シオンさん'); assert.equal(map.era,'past_1000');
});

function domFixture() {
  const dom = new JSDOM('<main><div id="stick"><span id="thumb"></span></div><div id="look"></div></main><div id="sv-skit" hidden><section class="sv-overlay-panel"><button id="close">戻る</button><div id="mount"></div></section></div>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://example.test/subsite/' });
  const w=dom.window;
  for(const name of ['window','document','Image','requestAnimationFrame','cancelAnimationFrame']) globalThis[name] = name==='window'? w : (typeof w[name]==='function' && !['Image'].includes(name) ? w[name].bind(w):w[name]);
  w.eval(fs.readFileSync(path.join(root,'js/skitEngine.js'),'utf8'));
  // Assert that a supplied player name works even when all storage access throws.
  Object.defineProperty(w,'localStorage',{get(){throw new Error('storage denied');}});
  const controller = new SkitBridge({ host:w.document.getElementById('sv-skit'), mount:w.document.getElementById('mount'), closeButton:w.document.getElementById('close'),characters,onClose:()=>{},onError:()=>{},source:w.SV_SkitEngine });
  return {dom,w,controller};
}
test('existing engine: 20 visits, all eight nodes, real cast changes, complete cleanup, no storage', async () => {
  const {dom,w,controller}=domFixture(); let closed=0;
  controller.onClose=()=>closed++;
  globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(skitData)});
  let adds=0, removes=0;
  const panel=w.document.querySelector('.sv-overlay-panel');
  const add=panel.addEventListener.bind(panel), remove=panel.removeEventListener.bind(panel);
  panel.addEventListener=(type,...args)=>{if(type==='keydown')adds++;add(type,...args);};
  panel.removeEventListener=(type,...args)=>{if(type==='keydown')removes++;remove(type,...args);};
  for(let i=0;i<20;i++) {
    await controller.open(events[0]); const engine=controller.session.engine;
    assert.equal(engine.userName,'シオン');
    const expressions=new Set(); let count=0;
    do { expressions.add(engine.currentNode.cast[0].expression);count++; if(!engine.isEndReached) engine.handleAdvance(); else break; } while(count<15);
    assert.equal(count,8);assert.ok(expressions.size>=2);assert.equal(engine.isEndReached,true);
    assert.equal(engine.nameEl.textContent,'シオン');
    engine.requestNextEpisode();
    assert.equal(controller.session,null);assert.equal(engine.keyHandler,null);assert.equal(engine._preloadCache.size,0);
    assert.equal(engine.autoTimer,null);assert.equal(engine.rootEl,null); assert.equal(w.document.getElementById('sv-skit').hidden,true);
  }
  assert.equal(closed,20);assert.equal(adds,20);assert.equal(removes,20);
  controller.dispose();dom.window.close();
});
test('late fetch after close cannot overwrite a later conversation; errors permit retry', async () => {
  const {dom,controller}=domFixture(); let resolveOld; let calls=0; let errors=0;
  controller.onError=()=>errors++;
  globalThis.fetch=()=>{ calls++;return calls===1?new Promise(resolve=>{resolveOld=resolve;}):Promise.resolve({ok:true,json:async()=>structuredClone(skitData)}); };
  const old=controller.open(events[0]);controller.close();
  await controller.open(events[0]);const active=controller.session.engine;
  resolveOld({ok:true,json:async()=>structuredClone(skitData)});await old;
  assert.equal(controller.session.engine,active);assert.equal(active.currentNode.id,skitData.start);assert.equal(errors,0);
  controller.close(); globalThis.fetch=async()=>({ok:false,status:404}); await controller.open(events[0]);
  assert.equal(controller.session,null);assert.equal(errors,1);
  globalThis.fetch=async()=>({ok:true,json:async()=>structuredClone(skitData)});await controller.open(events[0]);assert.ok(controller.session);
  controller.dispose();dom.window.close();
});
test('shared engine preserves legacy stored/passed names and survives denied storage', async () => {
  const dom = new JSDOM('<section class="sv-overlay-panel"><div id="root"></div></section>', { runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.test/' });
  const w=dom.window;w.eval(fs.readFileSync(path.join(root,'js/skitEngine.js'),'utf8'));
  w.fetch=async()=>({ok:true,json:async()=>structuredClone(skitData)});
  const engine=w.SV_SkitEngine, options={rootEl:w.document.getElementById('root'),skitUrl:'/skit.json'};
  w.localStorage.setItem('sv_user_name','既存の閲覧者');
  await engine.start(options);assert.equal(engine.userName,'既存の閲覧者');
  await engine.start({...options,userName:'指定名'});assert.equal(engine.userName,'指定名');
  Object.defineProperty(w,'localStorage',{get(){throw new Error('denied');}});
  await engine.start(options);assert.equal(engine.userName,'ゲスト');
  engine.stop();dom.window.close();
});
test('touch move and look have separate pointers; cancel, blur, resize and pause clear input', () => {
  const {dom,w,controller}=domFixture(); let dx=0;
  const $=id=>w.document.getElementById(id), stick=$('stick'),look=$('look');
  for(const el of [stick,look]) { const ids=new Set();el.setPointerCapture=id=>ids.add(id);el.hasPointerCapture=id=>ids.has(id);el.releasePointerCapture=id=>ids.delete(id); }
  stick.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});
  const input=new InputController({stick,thumb:$('thumb'),look,onLook:x=>dx+=x,onInteract:()=>{},target:w});input.setEnabled(true);
  const pointer=(el,type,id,x,y)=>{const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:y,pointerType:'touch',button:0});el.dispatchEvent(e);};
  pointer(stick,'pointerdown',1,50,18);pointer(look,'pointerdown',2,180,100);pointer(look,'pointermove',2,200,100);
  assert.equal(input.sample().z,-1);assert.equal(dx,20);assert.equal(input.pointers.size,2);
  pointer(look,'pointerup',2,200,100);assert.equal(input.sample().z,-1);
  pointer(stick,'pointercancel',1,50,18);assert.deepEqual(input.sample(),{x:0,z:0});
  for(const type of ['blur','resize']) {pointer(stick,'pointerdown',1,50,18);w.dispatchEvent(new w.Event(type));assert.deepEqual(input.sample(),{x:0,z:0});}
  w.dispatchEvent(new w.KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));assert.equal(input.sample().z,-1);
  input.setEnabled(false);input.setEnabled(true);assert.deepEqual(input.sample(),{x:0,z:0});
  input.dispose();controller.dispose();dom.window.close();
});

class FakeAudio extends EventTarget {
  constructor(){super();this.paused=true;this.plays=0;this.volume=1;this.src='';}
  play(){this.plays++;this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){this.src='';} load(){}
}
test('one audio instance through 20 skit cycles; off/background/disposal really pause', async () => {
  let instances=0; const track=new FakeAudio();const audio=new AudioController('/bgm',()=>{},()=>{instances++;return track;});
  audio.setScene('explore',true);assert.equal(instances,0);audio.toggle();await audio.pending;
  for(let i=0;i<20;i++){audio.setScene('skit',true);assert.equal(track.volume,0.18);audio.setScene('explore',true);assert.equal(track.volume,0.34);}
  assert.equal(instances,1);assert.equal(track.plays,1);
  audio.setScene('explore',false);assert.equal(track.paused,true);
  audio.setScene('explore',true);await audio.pending;assert.equal(track.paused,false);
  audio.toggle();assert.equal(track.paused,true);audio.dispose();assert.equal(track.src,'');
});
test('audio play rejection and delayed play completion cannot leave unwanted sound', async () => {
  const track=new FakeAudio();let resolvePlay;track.play=()=>new Promise(resolve=>{resolvePlay=()=>{track.paused=false;resolve();};});
  const audio=new AudioController('/bgm',()=>{},()=>track);audio.setScene('explore',true);audio.toggle();audio.toggle();resolvePlay();await audio.pending;assert.equal(track.paused,true);
  track.play=()=>Promise.reject(new Error('autoplay'));audio.toggle();await audio.pending;assert.equal(audio.enabled,false);
  audio.dispose();
});
