import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const prototype=path.join(root,'tarot-breaker-3d/prototype');
const read=p=>fs.readFile(path.join(root,p));
test('vendored Three.js module and its dependency load at r180',async()=>{
  const THREE=await import('../vendor/three-0.180.0/three.module.min.js');
  assert.equal(THREE.REVISION,'180');
  const scene=new THREE.Scene();const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshLambertMaterial());scene.add(mesh);
  assert.equal(scene.children.length,1);mesh.geometry.dispose();mesh.material.dispose();
  const manifest=JSON.parse(await fs.readFile(path.join(prototype,'vendor/three-0.180.0/provenance.json'),'utf8'));
  for(const [name,hash] of Object.entries(manifest.sha256)) assert.equal(createHash('sha256').update(await fs.readFile(path.join(prototype,'vendor/three-0.180.0',name))).digest('hex'),hash,name);
});
test('static HTTP round-trip, MIME, JSON, portraits and every module import (including a subpath mount)',async()=>{
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.mp3':'audio/mpeg'};
  const server=http.createServer(async(req,res)=>{
    const pathname=new URL(req.url,'http://local').pathname.replace(/^\/subsite\//,'/');
    try{const data=await read(pathname.slice(1));res.writeHead(200,{'Content-Type':types[path.extname(pathname)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const origin=`http://127.0.0.1:${server.address().port}`;
    const entry=`${origin}/subsite/tarot-breaker-3d/prototype/index.html`;
    const html=(await read('tarot-breaker-3d/prototype/index.html')).toString();
    const queue=[entry,...[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]).filter(s=>!s.startsWith('data:')).map(s=>new URL(s,entry).href)];
    for(const p of ['data/world.json','data/events.json','data/characters.json']) queue.push(new URL(p+'?v=p2-1.1.0',entry).href);
    queue.push(`${origin}/subsite/skits/skit_005.json?v=p2-1.1.0`,`${origin}/subsite/audio/seifu-raguna.mp3?v=p2-1.1.0`);
    const skit=JSON.parse(await read('skits/skit_005.json'));
    for(const n of Object.values(skit.nodes)) for(const c of n.cast||[]) queue.push(`${origin}/subsite/assets/skit/${c.character}/${c.expression}.png?v=p2-1.1.0`);
    const visited=new Set();
    while(queue.length) {
      const url=queue.shift();if(visited.has(url))continue;visited.add(url);
      const response=await fetch(url);assert.equal(response.status,200,url);
      const data=Buffer.from(await response.arrayBuffer()), pathname=new URL(url).pathname.replace(/^\/subsite\//,'');
      assert.deepEqual(data,await read(pathname));
      if(new URL(url).pathname.endsWith('.js')) {
        assert.match(response.headers.get('content-type'),/javascript/);
        for(const match of data.toString().matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)) queue.push(new URL(match[1],url).href);
      }
      if(new URL(url).pathname.endsWith('.json')) JSON.parse(data);
    }
    assert.ok(visited.size>=29,`${visited.size} assets`);
  } finally { server.closeAllConnections();await new Promise(resolve=>server.close(resolve)); }
});
