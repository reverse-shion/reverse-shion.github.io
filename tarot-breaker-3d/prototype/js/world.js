import * as THREE from '../vendor/three-0.180.0/three.module.min.js';

export function createWorld(canvas, map, events) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x101526);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x101526, 10, 38);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 70);
  camera.rotation.order = 'YXZ';
  const base = new THREE.Group(); base.name = map.mapId; scene.add(base);
  const stone = new THREE.MeshLambertMaterial({ color: 0x9ca9bb });
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x394758 });
  const gold = new THREE.MeshBasicMaterial({ color: 0xa79a72 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xbcdbe0 });
  const cube = new THREE.BoxGeometry(1, 1, 1);
  function box(w, h, d, x, y, z, material = stone) {
    const mesh = new THREE.Mesh(cube, material); mesh.scale.set(w, h, d); mesh.position.set(x, y, z); base.add(mesh); return mesh;
  }
  const b = map.bounds;
  box(b.maxX - b.minX + 0.5, 0.25, b.maxZ - b.minZ + 0.5, 0, -0.125, 0, floorMat);
  for (const x of [b.minX - 0.15, b.maxX + 0.15]) box(0.3, 1, b.maxZ - b.minZ + 0.6, x, 0.5, 0);
  for (const z of [b.minZ - 0.15, b.maxZ + 0.15]) box(b.maxX - b.minX, 1, 0.3, 0, 0.5, z);
  for (const o of map.obstacles) box(o.halfX * 2, o.height, o.halfZ * 2, o.x, o.height / 2, o.z);
  box(8.1, 0.35, 0.9, 0, 4.15, 0);
  box(3.4, 4.2, 0.2, 0, 2.1, b.minZ, floorMat);
  box(3.55, 0.08, 0.25, 0, 4.25, b.minZ, gold);
  for (const x of [-1.75, 1.75]) box(0.08, 4.2, 0.25, x, 2.1, b.minZ, gold);
  for (let z = -8; z <= 8; z += 2) box(5, 0.012, 0.025, 0, 0.012, z, gold);
  for (const x of [-2.5, 2.5]) box(0.025, 0.012, 17, x, 0.012, 0, gold);
  for (const event of events) {
    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), glow);
    marker.name = event.id; marker.position.set(event.position.x, 1.25, event.position.z); base.add(marker);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.69, 32), gold);
    ring.rotation.x = -Math.PI / 2; ring.position.set(event.position.x, 0.025, event.position.z); base.add(ring);
  }
  const stars = [];
  let seed = 37;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 180; i++) {
    const a = rand() * Math.PI * 2, y = rand() * 0.8 + 0.16, r = Math.sqrt(1 - y * y) * 32;
    stars.push(Math.sin(a) * r, y * 32, Math.cos(a) * r);
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xbbc6df, size: 0.07, fog: false })));
  scene.add(new THREE.HemisphereLight(0xd4e4ff, 0x353048, 2.1));
  const light = new THREE.DirectionalLight(0xffedc9, 1.5); light.position.set(-4, 9, 4); scene.add(light);

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  let disposed = false;
  let walkPhase = 0;
  let walkBlend = 0;

  function resize() {
    if (disposed) return;
    const width = canvas.clientWidth, height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  }

  function render(player, motion = {}) {
    if (disposed) return;
    const dt = Math.min(Math.max(Number(motion.delta) || 0, 0), 0.05);
    const moving = Boolean(motion.moving) && !reduceMotion;
    const targetBlend = moving ? 1 : 0;
    const smoothing = 1 - Math.exp(-10 * dt);
    walkBlend += (targetBlend - walkBlend) * smoothing;
    if (moving) walkPhase += dt * 9.2;

    // Deliberately subtle: enough to read as footsteps without causing strong motion sickness.
    const bobY = Math.sin(walkPhase * 2) * 0.014 * walkBlend;
    const bobPitch = Math.sin(walkPhase) * 0.0018 * walkBlend;
    camera.position.set(player.x, map.player.eyeHeight + bobY, player.z);
    camera.rotation.set(player.pitch + bobPitch, player.yaw, 0, 'YXZ');
    renderer.render(scene, camera);
  }

  function dispose() {
    disposed = true;
    const geometries = new Set(), materials = new Set();
    scene.traverse(o => {
      if (o.geometry) geometries.add(o.geometry);
      if (o.material) materials.add(o.material);
    });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose();
  }

  resize();
  return { render, resize, dispose, info: renderer.info, scene, camera };
}
