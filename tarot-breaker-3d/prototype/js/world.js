import * as THREE from '../vendor/three-0.180.0/three.module.min.js';

export function createWorld(canvas, map, events) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.setClearColor(0x17182f);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x8a82a6, 0.0105);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 150);
  camera.rotation.order = 'YXZ';

  const base = new THREE.Group();
  base.name = map.mapId;
  scene.add(base);

  const b = map.bounds;
  const animated = [];
  const ownedTextures = [];
  const ownedGeometries = [];
  const ownedMaterials = [];

  const track = resource => {
    if (resource?.isTexture) ownedTextures.push(resource);
    else if (resource?.isBufferGeometry) ownedGeometries.push(resource);
    else if (resource?.isMaterial) ownedMaterials.push(resource);
    return resource;
  };

  const marble = track(new THREE.MeshPhysicalMaterial({
    color: 0xe6e3ee,
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.28,
    clearcoatRoughness: 0.25
  }));
  const marbleBright = track(new THREE.MeshPhysicalMaterial({
    color: 0xf4eff3,
    roughness: 0.25,
    metalness: 0.03,
    clearcoat: 0.36,
    clearcoatRoughness: 0.18
  }));
  const midnight = track(new THREE.MeshStandardMaterial({
    color: 0x20274b,
    roughness: 0.38,
    metalness: 0.20
  }));
  const gold = track(new THREE.MeshPhysicalMaterial({
    color: 0xd6bd78,
    roughness: 0.30,
    metalness: 0.62,
    clearcoat: 0.16
  }));
  const rock = track(new THREE.MeshStandardMaterial({
    color: 0x555c75,
    roughness: 0.86,
    metalness: 0.02
  }));
  const crystal = track(new THREE.MeshPhysicalMaterial({
    color: 0xaab8ff,
    emissive: 0x4f5fb4,
    emissiveIntensity: 1.25,
    roughness: 0.13,
    metalness: 0.02,
    transmission: 0.22,
    thickness: 0.8,
    ior: 1.42,
    transparent: true,
    opacity: 0.84,
    clearcoat: 0.65,
    clearcoatRoughness: 0.08
  }));
  const crystalWarm = track(new THREE.MeshPhysicalMaterial({
    color: 0xe6cfff,
    emissive: 0x8c5daf,
    emissiveIntensity: 1.18,
    roughness: 0.12,
    metalness: 0.01,
    transmission: 0.18,
    thickness: 0.75,
    ior: 1.40,
    transparent: true,
    opacity: 0.82,
    clearcoat: 0.58,
    clearcoatRoughness: 0.08
  }));
  const warmGlow = track(new THREE.MeshBasicMaterial({
    color: 0xffdfad,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));

  const cube = track(new THREE.BoxGeometry(1, 1, 1));
  const columnGeo = track(new THREE.CylinderGeometry(0.32, 0.40, 1, 12));
  const crystalBodyGeo = track(new THREE.CylinderGeometry(0.30, 0.38, 1, 6, 1, false));
  const crystalTipGeo = track(new THREE.ConeGeometry(0.30, 0.52, 6));
  const islandGeo = track(new THREE.IcosahedronGeometry(1, 1));

  function box(w, h, d, x, y, z, material = marble, parent = base) {
    const mesh = new THREE.Mesh(cube, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function cylinder(radius, height, x, y, z, material = marble, parent = base) {
    const mesh = new THREE.Mesh(columnGeo, material);
    mesh.scale.set(radius / 0.36, height, radius / 0.36);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function tubeBetween(curve, radius, material, parent = base, tubularSegments = 16) {
    const geo = track(new THREE.TubeGeometry(curve, tubularSegments, radius, 6, false));
    const mesh = new THREE.Mesh(geo, material);
    parent.add(mesh);
    return mesh;
  }

  function makeRadialTexture(inner = '#fff6df', mid = '#d8c7ff', outer = 'rgba(140,120,255,0)') {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, inner);
    g.addColorStop(0.24, mid);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return track(new THREE.CanvasTexture(c));
  }

  function makeGardenTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 160;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    let seed = 21;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 46; i++) {
      const x = 15 + rand() * 226;
      const y = 66 + rand() * 78;
      const r = 8 + rand() * 14;
      ctx.fillStyle = rand() > 0.55 ? '#526b55' : '#6f7664';
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.58, r, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 34; i++) {
      const x = 16 + rand() * 224;
      const y = 58 + rand() * 86;
      const r = 2 + rand() * 3.5;
      const palette = ['#d8c9ff', '#b9c9ff', '#f6e7ff', '#a7a5ff'];
      ctx.fillStyle = palette[i % palette.length];
      for (let p = 0; p < 5; p++) {
        const a = p / 5 * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.5, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff3c8';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeCloudTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) {
      const x = 40 + (i * 31) % 440;
      const y = 120 + Math.sin(i * 1.6) * 28;
      const r = 52 + (i % 4) * 15;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(240,231,255,.28)');
      g.addColorStop(0.45, 'rgba(205,199,238,.16)');
      g.addColorStop(1, 'rgba(178,176,219,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const tex = track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeWaterfallTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 512;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, 'rgba(236,239,255,.78)');
    g.addColorStop(0.55, 'rgba(179,194,255,.34)');
    g.addColorStop(1, 'rgba(179,194,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    for (let x = 5; x < c.width; x += 11) {
      ctx.fillStyle = x % 22 ? 'rgba(255,255,255,.17)' : 'rgba(205,218,255,.10)';
      ctx.fillRect(x, 0, 2, c.height);
    }
    const tex = track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1.4);
    return tex;
  }

  function makeSkyTexture() {
    const c = document.createElement('canvas');
    c.width = 1536;
    c.height = 768;
    const ctx = c.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, c.height);
    sky.addColorStop(0, '#0b1030');
    sky.addColorStop(0.34, '#1c2451');
    sky.addColorStop(0.67, '#6f668e');
    sky.addColorStop(0.88, '#d5aeb5');
    sky.addColorStop(1, '#f4d5ba');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, c.width, c.height);

    const sun = ctx.createRadialGradient(1170, 680, 0, 1170, 680, 430);
    sun.addColorStop(0, 'rgba(255,239,198,.78)');
    sun.addColorStop(0.28, 'rgba(255,201,177,.30)');
    sun.addColorStop(1, 'rgba(255,180,210,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(720, 260, 816, 508);

    let seed = 77;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 320; i++) {
      const t = i / 319;
      const centerX = 210 + t * 1140;
      const centerY = 135 + Math.sin(t * Math.PI) * 110;
      const spread = 22 + rand() * 110;
      const x = centerX + (rand() - 0.5) * spread;
      const y = centerY + (rand() - 0.5) * spread * 0.55;
      const r = 4 + rand() * 22;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rand() > 0.55 ? 'rgba(210,189,255,.18)' : 'rgba(255,208,232,.15)');
      g.addColorStop(1, 'rgba(150,150,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 720; i++) {
      const x = rand() * c.width;
      const y = rand() * c.height * 0.72;
      const r = rand() > 0.975 ? 2.3 : (0.45 + rand() * 1.0);
      ctx.fillStyle = rand() > 0.82 ? 'rgba(255,224,232,.9)' : 'rgba(226,235,255,.88)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    const tex = track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  function makeFloorTexture() {
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 1536;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, '#4b4c70');
    grad.addColorStop(0.48, '#333a63');
    grad.addColorStop(1, '#202b51');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(232,226,245,.10)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      const y = i * 118 + 40;
      ctx.moveTo(-50, y);
      ctx.bezierCurveTo(160, y - 34, 460, y + 52, 820, y - 22);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(225,194,124,.68)';
    ctx.lineWidth = 4;
    for (const x of [116, c.width - 116]) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(222,229,255,.16)';
    ctx.lineWidth = 2;
    for (let y = 70; y < c.height; y += 160) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
    }
    for (const cy of [350, 810, 1270]) {
      ctx.save();
      ctx.translate(c.width / 2, cy);
      ctx.strokeStyle = 'rgba(240,208,139,.76)';
      ctx.lineWidth = 4;
      for (const r of [34, 62, 94]) {
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-58, -58, 116, 116);
      ctx.strokeRect(-33, -33, 66, 66);
      ctx.restore();
    }
    const tex = track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(6, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  const glowTexture = makeRadialTexture();
  const gardenTexture = makeGardenTexture();
  const cloudTexture = makeCloudTexture();
  const waterfallTexture = makeWaterfallTexture();

  function glowSprite(x, y, z, scale = 1.2, color = 0xdacbff, parent = base, opacity = 0.72) {
    const mat = track(new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    }));
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale, scale, scale);
    parent.add(sprite);
    return sprite;
  }

  function gardenSprite(x, y, z, scale = 1.0) {
    const mat = track(new THREE.SpriteMaterial({ map: gardenTexture, transparent: true, depthWrite: false, fog: true }));
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale * 2.6, scale * 1.6, 1);
    base.add(sprite);
    return sprite;
  }

  function crystalCluster(x, z, scale = 1, material = crystal, parent = base, y = 0, glow = true) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    parent.add(group);
    const layout = [[0,0,1,0],[-0.34,0.08,0.63,-0.17],[0.34,0.10,0.72,0.16],[-0.16,-0.20,0.48,0.10]];
    for (const [lx, lz, sy, tilt] of layout) {
      const body = new THREE.Mesh(crystalBodyGeo, material);
      body.scale.set(scale * sy, scale * sy * 1.55, scale * sy);
      body.position.set(lx * scale, 0.72 * scale * sy * 1.55, lz * scale);
      body.rotation.z = tilt;
      group.add(body);
      const tip = new THREE.Mesh(crystalTipGeo, material);
      tip.scale.set(scale * sy, scale * sy, scale * sy);
      tip.position.set(lx * scale, 1.62 * scale * sy * 1.55, lz * scale);
      tip.rotation.z = tilt;
      group.add(tip);
    }
    if (glow) glowSprite(0, 1.12 * scale, 0, 2.1 * scale, 0xc8c6ff, group, 0.42);
    return group;
  }

  function crystalLamp(x, z, y = 1.45, scale = 0.48, parent = base) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    parent.add(group);
    const body = new THREE.Mesh(crystalBodyGeo, crystalWarm);
    body.scale.set(scale, scale * 1.35, scale);
    group.add(body);
    const tip = new THREE.Mesh(crystalTipGeo, crystalWarm);
    tip.scale.setScalar(scale);
    tip.position.y = 0.76 * scale * 1.35;
    group.add(tip);
    glowSprite(0, 0.18, 0, 1.5, 0xe3cfff, group, 0.72);
    return group;
  }

  function column(x, z, height = 5.7, parent = base, radius = 0.34) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    parent.add(group);
    box(radius * 2.8, 0.24, radius * 2.8, 0, 0.12, 0, marble, group);
    box(radius * 2.25, 0.18, radius * 2.25, 0, 0.34, 0, gold, group);
    const shaft = cylinder(radius, height - 0.72, 0, (height - 0.72) / 2 + 0.48, 0, marbleBright, group);
    shaft.scale.x *= 0.86;
    shaft.scale.z *= 0.86;
    box(radius * 2.15, 0.18, radius * 2.15, 0, height - 0.33, 0, gold, group);
    box(radius * 2.65, 0.28, radius * 2.65, 0, height - 0.10, 0, marble, group);
    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(radius * 0.48, 0), crystal);
    finial.position.y = height + 0.32;
    group.add(finial);
    glowSprite(0, height + 0.28, 0, 0.8, 0xcabfff, group, 0.34);
    return group;
  }

  function gothicArchAcross(z, width = 9.4, baseY = 4.7, apexY = 7.2) {
    const leftX = -width / 2;
    const rightX = width / 2;
    column(leftX, z, baseY + 0.15);
    column(rightX, z, baseY + 0.15);
    const leftCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(leftX, baseY, z), new THREE.Vector3(-width * 0.22, apexY - 0.3, z), new THREE.Vector3(0, apexY, z));
    const rightCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, apexY, z), new THREE.Vector3(width * 0.22, apexY - 0.3, z), new THREE.Vector3(rightX, baseY, z));
    tubeBetween(leftCurve, 0.16, marbleBright);
    tubeBetween(rightCurve, 0.16, marbleBright);
    tubeBetween(leftCurve, 0.055, gold);
    tubeBetween(rightCurve, 0.055, gold);
    crystalLamp(0, z, apexY - 0.26, 0.58);
  }

  function sideArcade(side) {
    const x = side * 5.45;
    const points = [-8.3, -5.6, -2.9, -0.2, 2.5, 5.2, 7.7];
    for (const z of points) column(x, z, 4.25, base, 0.25);
    for (let i = 0; i < points.length - 1; i++) {
      const z0 = points[i], z1 = points[i + 1], mid = (z0 + z1) / 2;
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 3.78, z0), new THREE.Vector3(x, 5.1, mid), new THREE.Vector3(x, 3.78, z1));
      tubeBetween(curve, 0.12, marbleBright, base, 12);
      const goldCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x - side * 0.035, 3.72, z0), new THREE.Vector3(x - side * 0.035, 4.95, mid), new THREE.Vector3(x - side * 0.035, 3.72, z1));
      tubeBetween(goldCurve, 0.035, gold, base, 12);
    }
  }

  function railing(side) {
    const x = side * 5.65;
    box(0.20, 0.70, b.maxZ - b.minZ + 0.5, x, 0.42, 0, marbleBright);
    box(0.10, 0.10, b.maxZ - b.minZ + 0.5, x - side * 0.12, 0.82, 0, gold);
    for (let z = b.minZ + 0.55; z <= b.maxZ - 0.5; z += 2.0) {
      box(0.48, 0.95, 0.48, x, 0.48, z, marble);
      crystalLamp(x - side * 0.02, z, 1.15, 0.36);
    }
  }

  function makeCloud(x, y, z, sx, sy, opacity = 0.22) {
    const mat = track(new THREE.SpriteMaterial({ map: cloudTexture, color: 0xe6dcf2, transparent: true, opacity, depthWrite: false, fog: true }));
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(sx, sy, 1);
    scene.add(sprite);
    animated.push({ type: 'cloud', object: sprite, phase: x * 0.17 + z * 0.09 });
    return sprite;
  }

  function waterfall(x, y, z, width, height, parent = scene, opacity = 0.38) {
    const mat = track(new THREE.MeshBasicMaterial({ map: waterfallTexture, color: 0xcbd9ff, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true }));
    const plane = new THREE.Mesh(track(new THREE.PlaneGeometry(width, height)), mat);
    plane.position.set(x, y, z);
    parent.add(plane);
    animated.push({ type: 'waterfall', object: plane, material: mat, phase: x + z });
    return plane;
  }

  function floatingIsland(x, y, z, sx = 4.5, sy = 1.4, sz = 3.4, palace = false) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    scene.add(group);
    const island = new THREE.Mesh(islandGeo, rock);
    island.scale.set(sx, sy, sz);
    island.rotation.set(0.2, x * 0.03, 0.12);
    group.add(island);
    box(sx * 1.35, 0.30, sz * 1.10, 0, sy * 0.62, 0, marble, group);
    for (const tx of [-sx * 0.65, 0, sx * 0.65]) {
      const h = palace && tx === 0 ? 5.4 : 2.6 + (Math.abs(tx) < 0.1 ? 0.8 : 0);
      box(0.42, h, 0.42, tx, sy * 0.62 + h / 2 + 0.2, 0, marbleBright, group);
      const tip = new THREE.Mesh(crystalTipGeo, crystal);
      tip.scale.setScalar(palace && tx === 0 ? 0.95 : 0.55);
      tip.position.set(tx, sy * 0.62 + h + (palace && tx === 0 ? 0.8 : 0.45), 0);
      group.add(tip);
    }
    if (palace) {
      const halo = new THREE.Mesh(track(new THREE.TorusGeometry(2.2, 0.045, 6, 48)), warmGlow);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, sy * 0.62 + 5.6, 0);
      group.add(halo);
      animated.push({ type: 'halo', object: halo, speed: 0.07 });
    }
    waterfall(-sx * 0.42, -sy * 1.9, 0.18, 0.85, sy * 4.5, group, 0.30);
    if (sx > 4) waterfall(sx * 0.38, -sy * 1.75, -0.20, 0.65, sy * 4.0, group, 0.26);
    return group;
  }

  function bridge(a, b, lift = 2.0) {
    const mid = new THREE.Vector3((a.x + b.x) / 2, Math.max(a.y, b.y) + lift, (a.z + b.z) / 2);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    tubeBetween(curve, 0.11, marbleBright, scene, 28);
  }

  function makeDistantKingdom() {
    const central = floatingIsland(0, 8.0, -47, 7.6, 2.2, 5.0, true);
    const crown = new THREE.Mesh(track(new THREE.CylinderGeometry(0.52, 0.82, 8.6, 8)), crystalWarm);
    crown.position.set(0, 8.4, 0);
    central.add(crown);
    const crownTip = new THREE.Mesh(track(new THREE.ConeGeometry(0.75, 2.2, 8)), crystalWarm);
    crownTip.position.set(0, 13.8, 0);
    central.add(crownTip);
    glowSprite(0, 8.6, 0, 5.6, 0xdcc8ff, central, 0.48);

    floatingIsland(-14, 11.5, -40, 4.2, 1.45, 3.1, false);
    floatingIsland(15.5, 13.0, -43, 4.8, 1.6, 3.4, false);
    floatingIsland(-22, 17.0, -54, 3.2, 1.1, 2.7, false);
    floatingIsland(23, 18.5, -58, 3.0, 1.0, 2.4, false);

    bridge(new THREE.Vector3(-10.5, 12.1, -41), new THREE.Vector3(-5.8, 10.2, -46), 1.4);
    bridge(new THREE.Vector3(11.5, 13.4, -44), new THREE.Vector3(6.0, 10.5, -47), 1.5);
    bridge(new THREE.Vector3(-19.5, 17.4, -53), new THREE.Vector3(-15.8, 12.5, -42), 1.8);
    bridge(new THREE.Vector3(20.6, 18.5, -57), new THREE.Vector3(17.2, 14.0, -44), 1.6);

    const beamMat = track(new THREE.MeshBasicMaterial({ color: 0xe8e1ff, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    const beam = new THREE.Mesh(track(new THREE.CylinderGeometry(0.28, 1.45, 42, 12, 1, true)), beamMat);
    beam.position.set(0, 24, -47);
    scene.add(beam);

    for (const c of [[-18,4.6,-32,22,8,.22],[14,5.0,-36,25,9,.20],[0,2.8,-49,30,9,.18],[-28,9.5,-58,18,7,.15],[26,10,-60,20,8,.15]]) makeCloud(...c);
  }

  const skyTex = makeSkyTexture();
  const skyMat = track(new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
  const sky = new THREE.Mesh(track(new THREE.SphereGeometry(92, 32, 20)), skyMat);
  sky.rotation.y = -0.55;
  scene.add(sky);

  const starPositions = [];
  const starColors = [];
  let starSeed = 53;
  const starRand = () => { starSeed = (starSeed * 16807) % 2147483647; return starSeed / 2147483647; };
  for (let i = 0; i < 250; i++) {
    const a = starRand() * Math.PI * 2;
    const y = starRand() * 0.80 + 0.15;
    const r = Math.sqrt(Math.max(0, 1 - y * y)) * 64;
    starPositions.push(Math.sin(a) * r, y * 64, Math.cos(a) * r);
    const warm = starRand() > 0.84;
    starColors.push(warm ? 1 : .72, warm ? .83 : .82, warm ? .91 : 1);
  }
  const starsGeo = track(new THREE.BufferGeometry());
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  starsGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
  const starsMat = track(new THREE.PointsMaterial({ size: 0.095, vertexColors: true, transparent: true, opacity: 0.88, fog: false }));
  const stars = new THREE.Points(starsGeo, starsMat);
  scene.add(stars);
  animated.push({ type: 'stars', object: stars, material: starsMat });

  const constellationMat = track(new THREE.LineBasicMaterial({ color: 0xb9c6ff, transparent: true, opacity: 0.24, fog: false }));
  const constellations = [
    [[-15,25,-39],[-10,28,-41],[-4,25,-44],[1,30,-47],[6,27,-45]],
    [[13,21,-38],[17,25,-41],[21,23,-45],[24,27,-47]],
    [[-25,18,-28],[-21,22,-32],[-17,19,-35],[-13,23,-38]]
  ];
  for (const chain of constellations) {
    const verts = [];
    for (let i = 0; i < chain.length - 1; i++) verts.push(...chain[i], ...chain[i + 1]);
    const g = track(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    scene.add(new THREE.LineSegments(g, constellationMat));
  }

  const floorTexture = makeFloorTexture();
  const floorMat = track(new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: floorTexture, roughness: 0.21, metalness: 0.13, clearcoat: 0.42, clearcoatRoughness: 0.12 }));
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(b.maxX - b.minX + 1.0, b.maxZ - b.minZ + 1.0)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  base.add(floor);

  for (const side of [-1, 1]) {
    box(0.14, 0.14, b.maxZ - b.minZ + 0.65, side * 5.2, 0.07, 0, gold);
    box(0.42, 0.22, b.maxZ - b.minZ + 0.7, side * 5.74, 0.11, 0, marbleBright);
  }

  railing(-1);
  railing(1);
  sideArcade(-1);
  sideArcade(1);
  for (const z of [-6.4, -1.8, 3.1]) gothicArchAcross(z, 9.45, 4.75, 7.25);

  for (const [x, z, s, warm] of [[-4.65,-7,.62,1],[4.6,-6.2,.54,0],[-4.55,-3.7,.50,0],[4.62,-3.1,.58,1],[-4.65,.3,.56,1],[4.58,1.1,.52,0],[-4.62,4.3,.60,0],[4.58,5.2,.55,1]]) {
    crystalCluster(x, z, s, warm ? crystalWarm : crystal);
    gardenSprite(x * 0.93, 0.68, z + 0.18, 0.72);
  }

  for (const x of [-3.6, 3.6]) {
    box(2.0, 0.34, 0.68, x, 0.21, 6.7, marble);
    box(1.72, 0.07, 0.56, x, 0.42, 6.7, gold);
    box(1.72, 0.65, 0.12, x, 0.72, 7.00, midnight);
  }

  box(4.2, 5.05, 0.26, 0, 2.52, b.minZ + 0.02, midnight);
  box(4.55, 0.13, 0.34, 0, 5.03, b.minZ + 0.02, gold);
  for (const x of [-2.02, 2.02]) {
    box(0.13, 5.05, 0.34, x, 2.52, b.minZ + 0.02, gold);
    column(x * 1.34, b.minZ + 0.1, 5.2, base, 0.27);
  }
  const gateCrystal = crystalCluster(0, b.minZ + 0.23, 0.82, crystalWarm, base, 1.10, true);
  gateCrystal.scale.set(0.88, 1.55, 0.88);
  glowSprite(0, 3.15, b.minZ + 0.30, 4.8, 0xd9c8ff, base, 0.30);

  makeDistantKingdom();

  for (const event of events) {
    const eventMat = track(crystalWarm.clone());
    eventMat.emissiveIntensity = 1.48;
    const cluster = crystalCluster(event.position.x, event.position.z, 0.48, eventMat, base, 0.03, true);
    const ringMat = track(new THREE.MeshBasicMaterial({ color: 0xe1ca8f, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false }));
    const ring = new THREE.Mesh(track(new THREE.RingGeometry(0.72, 0.75, 48)), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(event.position.x, 0.035, event.position.z);
    base.add(ring);
    const motePositions = [];
    for (let i = 0; i < 34; i++) {
      const a = i / 34 * Math.PI * 2;
      const r = 0.36 + (i % 6) * 0.055;
      motePositions.push(event.position.x + Math.cos(a) * r, 0.28 + (i % 9) * 0.17, event.position.z + Math.sin(a) * r);
    }
    const moteGeo = track(new THREE.BufferGeometry());
    moteGeo.setAttribute('position', new THREE.Float32BufferAttribute(motePositions, 3));
    const moteMat = track(new THREE.PointsMaterial({ color: 0xf5ebff, size: 0.05, transparent: true, opacity: 0.84, blending: THREE.AdditiveBlending, depthWrite: false }));
    const motes = new THREE.Points(moteGeo, moteMat);
    base.add(motes);
    const light = new THREE.PointLight(0xd1bfff, 7.0, 5.5, 2);
    light.position.set(event.position.x, 1.8, event.position.z);
    base.add(light);
    animated.push({ type: 'resonance', object: cluster, ring, motes, material: eventMat });
  }

  const airPositions = [];
  let moteSeed = 11;
  const moteRand = () => { moteSeed = (moteSeed * 48271) % 2147483647; return moteSeed / 2147483647; };
  for (let i = 0; i < 95; i++) airPositions.push((moteRand() - .5) * 12, 0.25 + moteRand() * 6.4, b.minZ + moteRand() * (b.maxZ - b.minZ));
  const airGeo = track(new THREE.BufferGeometry());
  airGeo.setAttribute('position', new THREE.Float32BufferAttribute(airPositions, 3));
  const airMat = track(new THREE.PointsMaterial({ color: 0xf1e4ff, size: 0.035, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false }));
  const airMotes = new THREE.Points(airGeo, airMat);
  base.add(airMotes);
  animated.push({ type: 'air', object: airMotes, material: airMat });

  scene.add(new THREE.HemisphereLight(0xe1e8ff, 0x514b68, 1.86));
  const dawn = new THREE.DirectionalLight(0xffd4b3, 2.65);
  dawn.position.set(9, 13, 8);
  scene.add(dawn);
  const celestial = new THREE.DirectionalLight(0x94a8ff, 1.32);
  celestial.position.set(-9, 10, -7);
  scene.add(celestial);
  const corridorWarm = new THREE.PointLight(0xffd8a2, 8.0, 18, 2);
  corridorWarm.position.set(0, 4.8, 6.8);
  base.add(corridorWarm);

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
        item.object.rotation.y = elapsed * 0.0012;
        item.material.opacity = 0.86 + Math.sin(elapsed * 0.62) * 0.035;
      } else if (item.type === 'resonance') {
        const pulse = 1 + Math.sin(elapsed * 1.65) * 0.035;
        item.object.scale.setScalar(pulse);
        item.ring.rotation.z = elapsed * 0.12;
        item.motes.rotation.y = elapsed * 0.24;
        item.material.emissiveIntensity = 1.42 + Math.sin(elapsed * 1.9) * 0.16;
      } else if (item.type === 'halo') {
        item.object.rotation.z = elapsed * item.speed;
      } else if (item.type === 'cloud') {
        item.object.position.x += Math.sin(elapsed * 0.04 + item.phase) * 0.0009;
      } else if (item.type === 'waterfall') {
        item.material.opacity = 0.27 + Math.sin(elapsed * 1.2 + item.phase) * 0.025;
        item.material.map.offset.y = -(elapsed * 0.035) % 1;
      } else if (item.type === 'air') {
        item.object.rotation.y = Math.sin(elapsed * 0.08) * 0.04;
        item.material.opacity = 0.44 + Math.sin(elapsed * 0.7) * 0.055;
      }
    }

    const bobY = Math.sin(walkPhase * 2) * 0.013 * walkBlend;
    const bobPitch = Math.sin(walkPhase) * 0.0016 * walkBlend;
    camera.position.set(player.x, map.player.eyeHeight + bobY, player.z);
    camera.rotation.set(player.pitch + bobPitch, player.yaw, 0, 'YXZ');
    renderer.render(scene, camera);
  }

  function dispose() {
    disposed = true;
    const geometries = new Set(ownedGeometries);
    const materials = new Set(ownedMaterials);
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
