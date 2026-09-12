import * as THREE from '../vendor/three-0.180.0/three.module.min.js';

export function createWorld(canvas, map, events) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x171936);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x77759a, 0.018);

  const camera = new THREE.PerspectiveCamera(61, 1, 0.1, 120);
  camera.rotation.order = 'YXZ';

  const base = new THREE.Group();
  base.name = map.mapId;
  scene.add(base);

  const animated = [];
  const ownedTextures = [];
  const b = map.bounds;

  const stone = new THREE.MeshStandardMaterial({ color: 0xd9dfeb, roughness: 0.58, metalness: 0.05 });
  const paleStone = new THREE.MeshStandardMaterial({ color: 0xf0edf1, roughness: 0.48, metalness: 0.08 });
  const deepBlue = new THREE.MeshStandardMaterial({ color: 0x20284a, roughness: 0.42, metalness: 0.18 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd1bc7b, roughness: 0.34, metalness: 0.48 });
  const rock = new THREE.MeshStandardMaterial({ color: 0x596079, roughness: 0.86, metalness: 0.02 });
  const crystal = new THREE.MeshStandardMaterial({
    color: 0xaebcff,
    emissive: 0x4f54a4,
    emissiveIntensity: 1.15,
    roughness: 0.16,
    metalness: 0.08,
    transparent: true,
    opacity: 0.82
  });
  const crystalWarm = new THREE.MeshStandardMaterial({
    color: 0xf1dbff,
    emissive: 0x8b5ca5,
    emissiveIntensity: 1.05,
    roughness: 0.18,
    transparent: true,
    opacity: 0.78
  });

  const cube = new THREE.BoxGeometry(1, 1, 1);
  const sixCrystal = new THREE.CylinderGeometry(0.34, 0.42, 1.6, 6, 1, false);
  const sixTip = new THREE.ConeGeometry(0.34, 0.58, 6);
  const columnGeo = new THREE.CylinderGeometry(0.34, 0.42, 4.6, 10);
  const starFragmentGeo = new THREE.IcosahedronGeometry(1, 0);

  function box(w, h, d, x, y, z, material = stone, parent = base) {
    const mesh = new THREE.Mesh(cube, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function makeFloorTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 1024;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, '#34355d');
    grad.addColorStop(0.55, '#252b4f');
    grad.addColorStop(1, '#1a2341');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.strokeStyle = 'rgba(223,197,129,.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(94, 0); ctx.lineTo(94, c.height);
    ctx.moveTo(c.width - 94, 0); ctx.lineTo(c.width - 94, c.height);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(221,224,255,.18)';
    ctx.lineWidth = 2;
    for (let y = 64; y < c.height; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(c.width, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(c.width / 2, c.height * 0.46);
    ctx.strokeStyle = 'rgba(232,208,147,.78)';
    ctx.lineWidth = 3;
    for (const r of [42, 72, 108]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.rotate(Math.PI / 4);
    for (const s of [64, 116]) {
      ctx.strokeRect(-s / 2, -s / 2, s, s);
    }
    ctx.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    ownedTextures.push(tex);
    return tex;
  }

  function makeBannerTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 384;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, '#202950');
    g.addColorStop(1, '#121936');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#d7bd78';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, c.width - 20, c.height - 20);
    ctx.translate(c.width / 2, 118);
    ctx.strokeStyle = '#e6cc86';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-18, -18, 36, 36);
    ctx.beginPath();
    ctx.moveTo(-40, 0); ctx.lineTo(40, 0);
    ctx.moveTo(0, -40); ctx.lineTo(0, 40);
    ctx.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    ownedTextures.push(tex);
    return tex;
  }

  function crystalCluster(x, z, scale = 1, material = crystal, parent = base, y = 0) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    parent.add(group);
    const layout = [
      [0, 0, 1.0, 0],
      [-0.34, 0.12, 0.62, -0.18],
      [0.35, 0.08, 0.72, 0.16]
    ];
    for (const [lx, lz, sy, tilt] of layout) {
      const body = new THREE.Mesh(sixCrystal, material);
      body.scale.set(scale * sy, scale * sy, scale * sy);
      body.position.set(lx * scale, 0.8 * scale * sy, lz * scale);
      body.rotation.z = tilt;
      group.add(body);
      const tip = new THREE.Mesh(sixTip, material);
      tip.scale.set(scale * sy, scale * sy, scale * sy);
      tip.position.set(lx * scale, 1.87 * scale * sy, lz * scale);
      tip.rotation.z = tilt;
      group.add(tip);
    }
    return group;
  }

  function column(x, z, height = 5.3) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    base.add(group);

    const shaft = new THREE.Mesh(columnGeo, paleStone);
    shaft.scale.y = height / 4.6;
    shaft.position.y = height / 2;
    group.add(shaft);

    box(1.0, 0.28, 1.0, 0, 0.14, 0, stone, group);
    box(0.82, 0.18, 0.82, 0, height + 0.09, 0, gold, group);
    box(0.72, 0.16, 0.72, 0, 0.38, 0, gold, group);
    return group;
  }

  function pointedArch(z, width = 9.3, height = 5.3) {
    const group = new THREE.Group();
    group.position.z = z;
    base.add(group);
    const x = width / 2;
    column(-x, z, height);
    column(x, z, height);
    const beam = box(width - 0.8, 0.34, 0.38, 0, height - 0.08, z, stone);
    beam.material = paleStone;

    const left = box(width * 0.33, 0.24, 0.30, -width * 0.16, height + 0.82, z, gold);
    left.rotation.z = -0.38;
    const right = box(width * 0.33, 0.24, 0.30, width * 0.16, height + 0.82, z, gold);
    right.rotation.z = 0.38;
    const jewel = crystalCluster(0, z, 0.32, crystalWarm, base, height + 0.44);
    jewel.scale.setScalar(0.7);
  }

  function railingSide(x, side) {
    box(0.2, 0.78, b.maxZ - b.minZ + 0.6, x, 0.44, 0, paleStone);
    box(0.10, 0.12, b.maxZ - b.minZ + 0.6, x - side * 0.13, 0.92, 0, gold);
    for (let z = b.minZ + 0.4; z <= b.maxZ - 0.4; z += 2.15) {
      box(0.48, 1.16, 0.48, x, 0.58, z, stone);
      crystalCluster(x - side * 0.02, z, 0.34, z % 4 > 0 ? crystal : crystalWarm, base, 1.08);
    }
  }

  function makeSky() {
    const geometry = new THREE.SphereGeometry(78, 24, 16);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x111633) },
        midColor: { value: new THREE.Color(0x4c4e86) },
        dawnColor: { value: new THREE.Color(0xe8b9bd) },
        horizonColor: { value: new THREE.Color(0xf3dac1) }
      },
      vertexShader: `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vPos;
        uniform vec3 topColor, midColor, dawnColor, horizonColor;
        void main(){
          float h=normalize(vPos).y*0.5+0.5;
          float east=normalize(vPos).x*0.5+0.5;
          vec3 c=mix(horizonColor,midColor,smoothstep(0.25,0.60,h));
          c=mix(c,topColor,smoothstep(0.58,0.93,h));
          float glow=(1.0-smoothstep(0.12,0.58,h))*smoothstep(0.35,0.95,east);
          c=mix(c,dawnColor,glow*0.42);
          gl_FragColor=vec4(c,1.0);
        }`
    });
    scene.add(new THREE.Mesh(geometry, material));
  }

  function makeStars() {
    const positions = [];
    const colors = [];
    let seed = 53;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 420; i++) {
      const a = rand() * Math.PI * 2;
      const y = rand() * 0.86 + 0.08;
      const r = Math.sqrt(Math.max(0, 1 - y * y)) * 60;
      positions.push(Math.sin(a) * r, y * 60, Math.cos(a) * r);
      const warm = rand() > 0.82;
      colors.push(warm ? 1.0 : 0.72, warm ? 0.82 : 0.80, warm ? 0.88 : 1.0);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.10,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      fog: false,
      sizeAttenuation: true
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    animated.push({ type: 'stars', object: points, material });

    const constellationMaterial = new THREE.LineBasicMaterial({ color: 0x9bb8ff, transparent: true, opacity: 0.30, fog: false });
    const constellations = [
      [[-14,24,-37],[-10,27,-39],[-5,24,-42],[0,28,-44],[5,25,-43]],
      [[12,19,-36],[16,23,-38],[20,21,-42],[23,25,-44]],
      [[-24,16,-25],[-20,20,-30],[-16,17,-33],[-12,21,-35]]
    ];
    for (const chain of constellations) {
      const verts = [];
      for (let i = 0; i < chain.length - 1; i++) verts.push(...chain[i], ...chain[i + 1]);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      scene.add(new THREE.LineSegments(g, constellationMaterial));
    }
  }

  function makeDistantKingdom() {
    const kingdom = new THREE.Group();
    kingdom.position.set(0, 5.4, -34);
    scene.add(kingdom);

    const island = new THREE.Mesh(new THREE.IcosahedronGeometry(5.8, 1), rock);
    island.scale.set(1.5, 0.38, 0.8);
    island.position.y = -0.7;
    kingdom.add(island);

    box(8.0, 0.45, 4.5, 0, 0.55, 0, paleStone, kingdom);
    box(4.0, 1.2, 2.4, 0, 1.35, 0.2, stone, kingdom);

    for (const x of [-3.0, -1.8, 1.8, 3.0]) {
      const tower = box(0.62, 4.0 + (Math.abs(x) < 2 ? 1.2 : 0), 0.62, x, 3.0, 0, paleStone, kingdom);
      const crown = new THREE.Mesh(sixTip, crystal);
      crown.scale.setScalar(0.8);
      crown.position.set(x, 5.4 + (Math.abs(x) < 2 ? 1.2 : 0), 0);
      kingdom.add(crown);
      tower.rotation.y = 0.15 * x;
    }

    const central = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.15, 8.8, 8), crystalWarm);
    central.position.set(0, 5.0, -0.2);
    kingdom.add(central);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.2, 8), crystalWarm);
    crown.position.set(0, 10.5, -0.2);
    kingdom.add(crown);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.055, 6, 48), new THREE.MeshBasicMaterial({ color: 0xf0d6a1, transparent: true, opacity: 0.72, fog: false }));
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, 8.0, -0.2);
    kingdom.add(halo);

    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.34, 28, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8e2ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, fog: false }));
    beam.position.set(0, 15, -0.2);
    kingdom.add(beam);

    const palaceLight = new THREE.PointLight(0xe8d8ff, 24, 45, 2);
    palaceLight.position.set(0, 6.0, 0);
    kingdom.add(palaceLight);

    for (const [x, y, z, s] of [
      [-14,10,-28,2.2],[15,13,-31,1.8],[-20,17,-39,1.3],[19,20,-44,1.1],[-9,20,-47,0.9],[10,24,-49,0.8]
    ]) {
      const frag = new THREE.Mesh(starFragmentGeo, rock);
      frag.position.set(x, y, z);
      frag.scale.set(s * 1.2, s * 0.45, s);
      frag.rotation.set(randAngle(x), randAngle(y), randAngle(z));
      scene.add(frag);
      crystalCluster(x, z, s * 0.18, crystal, scene, y + s * 0.25);
    }
  }

  function randAngle(n) {
    return (Math.sin(n * 12.9898) * 43758.5453 % 1) * Math.PI;
  }

  makeSky();
  makeStars();

  const floorTexture = makeFloorTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: floorTexture,
    roughness: 0.30,
    metalness: 0.18
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(b.maxX - b.minX + 0.8, b.maxZ - b.minZ + 0.8), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  base.add(floor);

  // The corridor is a real place in the Star Country: ceremonial enough to feel royal,
  // but still broad and walkable rather than a sealed temple chamber.
  railingSide(b.minX + 0.28, -1);
  railingSide(b.maxX - 0.28, 1);

  for (const z of [-7.3, -2.7, 2.4]) pointedArch(z, 9.0, 5.15);

  // Side crystal gardens and low seating hint that this was lived-in space, not only a shrine.
  for (const z of [-6.0, -3.7, -0.3, 1.8, 4.4, 6.6]) {
    crystalCluster(-4.55, z, 0.62, z < 0 ? crystalWarm : crystal);
    crystalCluster(4.55, z + 0.35, 0.55, z > 0 ? crystalWarm : crystal);
  }
  box(2.1, 0.38, 0.72, -3.35, 0.19, 5.8, stone);
  box(2.1, 0.38, 0.72, 3.35, 0.19, 5.8, stone);
  box(1.75, 0.08, 0.60, -3.35, 0.42, 5.8, gold);
  box(1.75, 0.08, 0.60, 3.35, 0.42, 5.8, gold);

  // A monumental gate closes the far end, while the actual kingdom remains visible beyond it.
  box(3.8, 4.8, 0.28, 0, 2.4, b.minZ + 0.03, deepBlue);
  box(4.15, 0.12, 0.34, 0, 4.86, b.minZ + 0.03, gold);
  for (const x of [-1.9, 1.9]) box(0.12, 4.8, 0.34, x, 2.4, b.minZ + 0.03, gold);
  const gateCrystal = crystalCluster(0, b.minZ + 0.3, 1.0, crystalWarm, base, 1.25);
  gateCrystal.scale.set(0.86, 1.55, 0.86);

  const bannerTex = makeBannerTexture();
  const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true, side: THREE.DoubleSide });
  for (const [x, z] of [[-4.38,-5.0],[4.38,-5.0],[-4.38,0.0],[4.38,0.0]]) {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 2.7), bannerMat);
    banner.position.set(x, 3.25, z);
    banner.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    base.add(banner);
  }

  makeDistantKingdom();

  // Memory points are no longer generic diamonds; they are quiet resonance crystals embedded in the country.
  for (const event of events) {
    const eventMat = crystalWarm.clone();
    eventMat.emissiveIntensity = 1.35;
    const cluster = crystalCluster(event.position.x, event.position.z, 0.56, eventMat, base, 0.02);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.78, 0.82, 48),
      new THREE.MeshBasicMaterial({ color: 0xd8c894, transparent: true, opacity: 0.46, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(event.position.x, 0.028, event.position.z);
    base.add(ring);

    const motePositions = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = 0.38 + (i % 4) * 0.07;
      motePositions.push(event.position.x + Math.cos(a) * r, 0.35 + (i % 6) * 0.21, event.position.z + Math.sin(a) * r);
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.Float32BufferAttribute(motePositions, 3));
    const moteMat = new THREE.PointsMaterial({ color: 0xf3e8ff, size: 0.045, transparent: true, opacity: 0.8 });
    const motes = new THREE.Points(moteGeo, moteMat);
    base.add(motes);
    animated.push({ type: 'resonance', object: cluster, ring, motes, material: eventMat, baseY: cluster.position.y });

    const light = new THREE.PointLight(0xcab9ff, 5.5, 5.2, 2);
    light.position.set(event.position.x, 1.8, event.position.z);
    base.add(light);
  }

  scene.add(new THREE.HemisphereLight(0xd9e4ff, 0x57506e, 2.05));
  const dawn = new THREE.DirectionalLight(0xffd7b5, 2.35);
  dawn.position.set(8, 13, 7);
  scene.add(dawn);
  const blueFill = new THREE.DirectionalLight(0x9daeff, 1.15);
  blueFill.position.set(-9, 8, -4);
  scene.add(blueFill);

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  let disposed = false;
  let walkPhase = 0;
  let walkBlend = 0;
  let elapsed = 0;

  function resize() {
    if (disposed) return;
    const width = canvas.clientWidth;
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render(player, motion = {}) {
    if (disposed) return;
    const dt = Math.min(Math.max(Number(motion.delta) || 0, 0), 0.05);
    elapsed += dt;
    const moving = Boolean(motion.moving) && !reduceMotion;
    const targetBlend = moving ? 1 : 0;
    const smoothing = 1 - Math.exp(-10 * dt);
    walkBlend += (targetBlend - walkBlend) * smoothing;
    if (moving) walkPhase += dt * 9.2;

    for (const item of animated) {
      if (item.type === 'stars') {
        item.object.rotation.y = elapsed * 0.0024;
        item.material.opacity = 0.88 + Math.sin(elapsed * 0.7) * 0.04;
      } else if (item.type === 'resonance') {
        const pulse = 1 + Math.sin(elapsed * 1.8) * 0.035;
        item.object.scale.setScalar(pulse);
        item.ring.rotation.z = elapsed * 0.12;
        item.motes.rotation.y = elapsed * 0.26;
        item.material.emissiveIntensity = 1.28 + Math.sin(elapsed * 2.0) * 0.18;
      }
    }

    const bobY = Math.sin(walkPhase * 2) * 0.014 * walkBlend;
    const bobPitch = Math.sin(walkPhase) * 0.0018 * walkBlend;
    camera.position.set(player.x, map.player.eyeHeight + bobY, player.z);
    camera.rotation.set(player.pitch + bobPitch, player.yaw, 0, 'YXZ');
    renderer.render(scene, camera);
  }

  function dispose() {
    disposed = true;
    const geometries = new Set();
    const materials = new Set();
    scene.traverse(o => {
      if (o.geometry) geometries.add(o.geometry);
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => materials.add(m));
        else materials.add(o.material);
      }
    });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    ownedTextures.forEach(t => t.dispose());
    renderer.dispose();
  }

  resize();
  return { render, resize, dispose, info: renderer.info, scene, camera };
}
