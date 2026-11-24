import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ---------- Tuning ----------
const ARENA_SIZE = 40;       // half-size of the arena map
const MAP_SIZES = {          // half-size of the Wilds and radius of each Space planet
  normal: { wilds: 200, planet: 60 },
  big: { wilds: 300, planet: 85 },
  huge: { wilds: 400, planet: 110 },
};
const VOID_Y = -1000;        // "ground" height out in empty space
const SPACE_GRAVITY = 10;
const PLAYER_RADIUS = 0.45;
const EYE_HEIGHT = 1.6;
const STEP_HEIGHT = 0.35;
const GRAVITY = 24;
const JUMP_SPEED = 11.5;
const WALK_SPEED = 7;
const SPRINT_SPEED = 11;
const MOUSE_SENS = 0.0022;
const BASE_FOV = 75;
const SCOPE_FOV = 22;
const SWING_TIME = 0.4;
const WALL_W = 4;
const WALL_H = 3;
const WALL_T = 0.35;
const WALL_COST = 5;
const WALL_HP = 300;
const MAX_WALLS = 30;
const MAX_MATES = 13;
const MATE_NAMES = ['Bolt', 'Nova', 'Rex', 'Pixel', 'Echo', 'Zap', 'Blaze', 'Frost', 'Comet', 'Jet', 'Max', 'Luna'];
const MATE_COLORS = [0x3d8bff, 0x2fd17a, 0xffb020, 0xc65bff, 0xff5fa2, 0x00e5ff, 0xff6a3d, 0x9fe8ff, 0xfff15a, 0x7a7dff, 0xa8ff60, 0xff9ed8];

const WEAPONS = [
  { id: 'rifle', icon: '🔫', name: '步枪', en: 'Rifle', mag: 30, interval: 0.1, reload: 1.3, damage: 25, pellets: 1, spread: 0.005, auto: true, recoil: 0.006, kick: 1, tracer: 0x9ffcff },
  { id: 'shotgun', icon: '💥', name: '霰弹枪', en: 'Shotgun', mag: 6, interval: 0.7, reload: 1.6, damage: 16, pellets: 10, spread: 0.11, auto: false, recoil: 0.04, kick: 2.2, tracer: 0xffb36b },
  { id: 'sniper', icon: '🎯', name: '狙击枪', en: 'Sniper', mag: 5, interval: 0.9, reload: 1.8, damage: 150, pellets: 1, spread: 0.02, auto: false, pierce: true, scope: true, recoil: 0.05, kick: 2.5, tracer: 0xd59bff },
  { id: 'rocket', icon: '🚀', name: '火箭筒', en: 'Rocket', mag: 3, interval: 0.8, reload: 2.0, damage: 160, splash: 5.5, projectile: true, auto: false, recoil: 0.05, kick: 2 },
  { id: 'sword', icon: '⚔️', name: '能量剑', en: 'Sword', melee: true, interval: 0.42, damage: 70, range: 3.4, auto: true },
  { id: 'lightning', icon: '⚡', name: '闪电枪', en: 'Lightning', mag: 40, interval: 0.14, reload: 1.2, damage: 26, chain: 5, chainRange: 10, auto: true, recoil: 0.003, kick: 0.6 },
];
const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));

const MONSTERS = [
  { type: 'golem', name: '熔岩巨人', en: 'LAVA GOLEM', color: 0xff6a1a, body: 0x3a2a26, hp: 2600 },
  { type: 'spider', name: '毒液蜘蛛', en: 'VENOM SPIDER', color: 0x7dff3a, body: 0x1c2a1c, hp: 2000 },
  { type: 'eye', name: '深渊之眼', en: 'ABYSS EYE', color: 0xc65bff, body: 0xe8e2f2, hp: 2100 },
  { type: 'necro', name: '亡灵法师', en: 'NECROMANCER', color: 0x6dffb0, body: 0x2a1f3a, hp: 2300 },
  { type: 'spider', name: '冰晶蜘蛛', en: 'CRYSTAL SPIDER', color: 0x7fe8ff, body: 0x1c2a3a, hp: 2600 },
  { type: 'golem', name: '冰霜巨人', en: 'FROST GIANT', color: 0x6fd6ff, body: 0x24364a, hp: 3000 },
  { type: 'eye', name: '血月之眼', en: 'BLOOD MOON EYE', color: 0xff3040, body: 0xf2e0e0, hp: 2800 },
  { type: 'dragon', name: '火焰巨龙', en: 'FIRE DRAGON', color: 0xff7a1a, body: 0x7a2214, hp: 3200 },
  { type: 'necro', name: '骷髅巫王', en: 'LICH KING', color: 0xb070ff, body: 0x1a1030, hp: 3200 },
  { type: 'titan', name: '泰坦机甲', en: 'TITAN MECH', color: 0xff3355, body: 0x4a4f5c, hp: 3600 },
  { type: 'dragon', name: '雷霆巨龙', en: 'THUNDER DRAGON', color: 0xffe14a, body: 0x2a3a6a, hp: 3800 },
  { type: 'king', name: '机甲之王', en: 'ROBOT KING', color: 0xffd23f, body: 0x3a3450, hp: 3500 },
];
// Space planets: which MONSTERS live on each one
const PLANETS = [
  { name: '月球基地', en: 'MOON BASE', icon: '🌕', color: 0xa8a8b4, ground: '#9a9aa6', spots: '#74747f', bosses: [1, 2], x: 0, z: 0, y: 0 },
  { name: '火星', en: 'MARS', icon: '🔴', color: 0xc8582f, ground: '#b5522f', spots: '#7f3418', bosses: [0, 9, 7], x: 430, z: 120, y: 40 },
  { name: '冰冻星', en: 'ICE PLANET', icon: '🧊', color: 0xbfe8ff, ground: '#d4ecf8', spots: '#98c4dc', bosses: [5, 4, 10], x: -400, z: 280, y: -30 },
  { name: '毒雾星', en: 'TOXIC PLANET', icon: '☣️', color: 0x6ec044, ground: '#5f9a38', spots: '#3a6a1e', bosses: [3, 8, 6], x: 160, z: -460, y: 60 },
  { name: '暗黑星', en: 'DARK STAR', icon: '🌑', color: 0x6a4a9a, ground: '#40305e', spots: '#261a3c', bosses: [11], x: -330, z: -360, y: -50, final: true },
];
const MINION_SETS = [
  ['grunt', 'grunt', 'grunt'],
  ['grunt', 'grunt', 'drone', 'drone'],
  ['grunt', 'grunt', 'brute', 'drone'],
  ['grunt', 'grunt', 'grunt', 'drone'],
  ['brute', 'brute', 'drone', 'drone'],
  ['grunt', 'grunt', 'drone', 'drone', 'drone'],
  ['brute', 'brute', 'grunt', 'grunt', 'drone'],
  ['brute', 'brute', 'grunt', 'grunt', 'drone', 'drone'],
  ['brute', 'brute', 'brute', 'drone', 'drone'],
  ['grunt', 'grunt', 'grunt', 'brute', 'drone', 'drone'],
  ['brute', 'brute', 'drone', 'drone', 'drone', 'drone'],
  ['brute', 'brute', 'brute', 'grunt', 'grunt', 'drone', 'drone'],
];
const FINAL_BOSS = { type: 'emperor', final: true, name: '人类帝皇', en: 'THE EMPEROR', color: 0xffd23f, body: 0xd9a83c, hp: 9000 };

const $ = (id) => document.getElementById(id);
const ui = {
  hud: $('hud'), score: $('score'), wave: $('wave'), revives: $('revives'), team: $('team'),
  healthFill: $('health-fill'), healthText: $('health-text'),
  armorFill: $('armor-fill'), armorText: $('armor-text'),
  ammo: $('ammo'), reloadHint: $('reload-hint'), weaponName: $('weapon-name'), bricks: $('bricks'),
  weaponBar: $('weapon-bar'), prompt: $('prompt'), buildHint: $('build-hint'), scope: $('scope'), abilities: $('abilities'),
  shieldFx: $('shield-fx'), powerFx: $('power-fx'),
  banner: $('banner'), enemiesLeft: $('enemies-left'), toast: $('toast'),
  tracker: $('tracker'), trackerArrow: $('tracker-arrow'), trackerText: $('tracker-text'),
  boss: $('boss'), bossName: $('boss-name'), bossFill: $('boss-fill'),
  damage: $('damage'), hitmarker: $('hitmarker'), radar: $('radar'),
  start: $('screen-start'), pause: $('screen-pause'), over: $('screen-over'),
  reward: $('screen-reward'), rewardCards: $('reward-cards'), rewardTitle: $('reward-title'),
  overTitle: $('over-title'), finalScore: $('final-score'), finalLabel: $('final-label'), finalWave: $('final-wave'),
  btnContinue: $('btn-continue'), teamCount: $('team-count'),
  best: $('best'), bestStart: $('best-start'),
};
const radarCtx = ui.radar.getContext('2d');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
const dist2d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const openWorld = () => mode !== 'arena';

// ---------- Renderer / scene ----------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07081a);
scene.fog = new THREE.Fog(0x07081a, 25, 95);

const camera = new THREE.PerspectiveCamera(BASE_FOV, window.innerWidth / window.innerHeight, 0.05, 900);
camera.rotation.order = 'YXZ';
scene.add(camera);

// Bloom makes every neon edge, blade and explosion glow
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.35, 0.72);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const hemi = new THREE.HemisphereLight(0x9aa8ff, 0x302048, 2.4);
scene.add(hemi);
// The sun follows the player so shadows work anywhere on the big map
const sun = new THREE.DirectionalLight(0xd0d8ff, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 200 });
scene.add(sun, sun.target);
const ARENA_SUN = new THREE.Vector3(20, 40, 15).normalize();
const WILDS_SUN = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(58), THREE.MathUtils.degToRad(140));
let sunDir = ARENA_SUN;

// Clear blue daytime sky for the Wilds: deep blue overhead, lighter at the horizon, with a sun disc
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(800, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { sunDir: { value: WILDS_SUN } },
    vertexShader: `varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: `varying vec3 vDir;
      uniform vec3 sunDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(vec3(0.55, 0.75, 0.95), vec3(0.12, 0.35, 0.78), pow(h, 0.6));
        float sun = max(dot(vDir, normalize(sunDir)), 0.0);
        col += vec3(1.0, 0.95, 0.8) * (pow(sun, 800.0) * 3.0 + pow(sun, 12.0) * 0.15);
        gl_FragColor = vec4(col, 1.0);
      }`,
  }),
);
sky.visible = false;
scene.add(sky);
const boomLight = new THREE.PointLight(0xff8a3d, 0, 25, 1.5);
scene.add(boomLight);

// Stars
const stars = (() => {
  const pts = [];
  for (let i = 0; i < 1500; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(300);
    if (v.y < 15) v.y = Math.abs(v.y) + 15;
    pts.push(v.x, v.y, v.z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaab8ff, size: 1.2, fog: false }));
  scene.add(points);
  return points;
})();

// ---------- Level ----------
const levelGroup = new THREE.Group();
scene.add(levelGroup);
const colliders = [];   // { minX, maxX, minZ, maxZ, top }
const solidMeshes = []; // raycast targets for bullets
let bounds = ARENA_SIZE;
let builtLevel = null;
let centerRing = null;
let wildsLayout = null; // { camps, supplies, stars }
let flatSpots = [];     // flattened areas on the hills: { x, z, r, h }
let planets = [];       // built Space planets
let builtKey = null;    // mode + map size of the level currently built
let mapSize = 'normal';

function rawTerrain(x, z) {
  return Math.sin(x * 0.021) * Math.cos(z * 0.017) * 6
    + Math.sin(x * 0.047 + 1.3) * Math.sin(z * 0.052 + 0.7) * 2.2
    + Math.sin((x + z) * 0.011 + 2) * 4
    + Math.sin(x * 0.13) * Math.sin(z * 0.11) * 0.4;
}

// Ground height: rolling hills in the Wilds, flat in the Arena
function planetAt(x, z) {
  for (const p of planets) if ((x - p.x) ** 2 + (z - p.z) ** 2 < p.r * p.r) return p;
  return null;
}

function clampToPlanet(pos, p, margin) {
  const dx = pos.x - p.x;
  const dz = pos.z - p.z;
  const d = Math.hypot(dx, dz);
  const max = p.r - margin;
  if (d > max) {
    pos.x = p.x + (dx / d) * max;
    pos.z = p.z + (dz / d) * max;
  }
}

function terrainY(x, z) {
  if (builtLevel === 'arena') return 0;
  let base = 0;
  let h;
  if (builtLevel === 'space') {
    const p = planetAt(x, z);
    if (!p) return VOID_Y;
    base = p.y;
    h = rawTerrain(x * 1.5, z * 1.5) * 0.35 * clamp((p.r - Math.hypot(x - p.x, z - p.z)) / 12, 0, 1);
  } else {
    h = rawTerrain(x, z);
  }
  for (const f of flatSpots) {
    const d = Math.hypot(x - f.x, z - f.z);
    if (d < f.r + 12) {
      const t = d <= f.r ? 0 : (d - f.r) / 12;
      h = f.h + (h - f.h) * t * t * (3 - 2 * t);
    }
  }
  return base + h;
}

// Distance along a ray to the ground, or null
function rayTerrain(origin, dir, far) {
  if (builtLevel === 'arena') {
    if (dir.y >= 0) return null;
    const t = -origin.y / dir.y;
    return t <= far ? t : null;
  }
  let prevT = 0;
  let prevD = origin.y - terrainY(origin.x, origin.z);
  if (prevD < 0) return 0;
  for (let t = 0.75; t <= far; t += t < 30 ? 0.75 : 1.5) {
    const d = origin.y + dir.y * t - terrainY(origin.x + dir.x * t, origin.z + dir.z * t);
    if (d < 0) return prevT + (t - prevT) * (prevD / (prevD - d));
    prevT = t;
    prevD = d;
  }
  return null;
}

// Ray against meshes + the ground; hits sorted by distance ({ point, distance, object | null })
function castRay(origin, dir, far, targets) {
  raycaster.set(origin, dir);
  raycaster.far = far;
  const hits = raycaster.intersectObjects(targets, false);
  const t = rayTerrain(origin, dir, far);
  if (t !== null) {
    const ground = { distance: t, point: origin.clone().addScaledVector(dir, t), object: null };
    const cut = hits.findIndex((h) => h.distance > t);
    if (cut >= 0) hits.splice(cut, hits.length - cut, ground);
    else hits.push(ground);
  }
  return hits;
}

function clearLevel() {
  levelGroup.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) { o.material.map?.dispose(); o.material.dispose(); }
  });
  levelGroup.clear();
  planets = [];
  colliders.length = 0;
  solidMeshes.length = 0;
  centerRing = null;
}

function groundTexture(draw, repeat) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  draw(c.getContext('2d'));
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function addFloor(tex) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(bounds * 2, bounds * 2),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  levelGroup.add(floor);
  solidMeshes.push(floor);
}

function addBox(x, z, w, d, h, material, edgeColor, baseY = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, baseY + h / 2, z);
  mesh.castShadow = mesh.receiveShadow = true;
  if (edgeColor !== undefined) {
    mesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: edgeColor }),
    ));
  }
  levelGroup.add(mesh);
  solidMeshes.push(mesh);
  colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, top: baseY + h });
  return mesh;
}

function buildArena() {
  clearLevel();
  builtLevel = 'arena';
  bounds = ARENA_SIZE;
  sky.visible = false;
  stars.visible = true;
  scene.environment = null;
  setCameraFar(900);
  renderer.toneMappingExposure = 1;
  bloomPass.threshold = 0.72;
  bloomPass.strength = 0.45;
  sunDir = ARENA_SUN;
  sun.color.setHex(0xd0d8ff);
  sun.intensity = 2.6;
  hemi.intensity = 2.4;
  scene.background.setHex(0x07081a);
  scene.fog.color.setHex(0x07081a);
  scene.fog.near = 25;
  scene.fog.far = 95;
  hemi.color.setHex(0x9aa8ff);
  hemi.groundColor.setHex(0x302048);

  addFloor(groundTexture((g) => {
    g.fillStyle = '#10122a';
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#232a66';
    g.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
    }
    g.strokeStyle = '#3c46c8';
    g.lineWidth = 4;
    g.strokeRect(0, 0, 256, 256);
  }, ARENA_SIZE / 2));

  centerRing = new THREE.Mesh(
    new THREE.RingGeometry(3.6, 4, 64),
    new THREE.MeshBasicMaterial({ color: 0x33f0ff, transparent: true, opacity: 0.3 }),
  );
  centerRing.rotation.x = -Math.PI / 2;
  centerRing.position.y = 0.02;
  levelGroup.add(centerRing);

  for (const [x, z, c] of [[-30, -30, 0x00ffff], [30, -30, 0xff00cc], [-30, 30, 0xff00cc], [30, 30, 0x00ffff]]) {
    const l = new THREE.PointLight(c, 40, 40, 1.6);
    l.position.set(x, 6, z);
    levelGroup.add(l);
  }

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x232858, roughness: 0.8, metalness: 0.05 });
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x2e3a80, roughness: 0.6, metalness: 0.1 });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x45307a, roughness: 0.5, metalness: 0.15 });
  const S = ARENA_SIZE;

  // Outer walls with a neon strip on top
  for (const [x, z, w, d] of [[0, -S, S * 2 + 1, 1], [0, S, S * 2 + 1, 1], [-S, 0, 1, S * 2 + 1], [S, 0, 1, S * 2 + 1]]) {
    addBox(x, z, w, d, 5, wallMat);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, d), new THREE.MeshBasicMaterial({ color: 0xff2bd6 }));
    strip.position.set(x, 5.05, z);
    levelGroup.add(strip);
  }
  for (const [x, z] of [[-13, -13], [13, -13], [-13, 13], [13, 13]]) addBox(x, z, 2.6, 2.6, 7, pillarMat, 0xff2bd6);
  for (const [x, z, w, d] of [[0, -20, 7, 0.8], [0, 20, 7, 0.8], [-20, 0, 0.8, 7], [20, 0, 0.8, 7]]) addBox(x, z, w, d, 1.3, crateMat, 0x33f0ff);

  // Random crates (avoid center spawn and overlapping)
  const placed = [];
  let tries = 0;
  while (placed.length < 22 && tries++ < 500) {
    const size = 1.6 + Math.random() * 1.4;
    const x = (Math.random() * 2 - 1) * (S - 5);
    const z = (Math.random() * 2 - 1) * (S - 5);
    if (Math.hypot(x, z) < 8) continue;
    if (placed.some((p) => Math.hypot(p.x - x, p.z - z) < (p.size + size) * 0.9 + 1.5)) continue;
    if (colliders.some((c) => x + size > c.minX - 1.5 && x - size < c.maxX + 1.5 && z + size > c.minZ - 1.5 && z - size < c.maxZ + 1.5)) continue;
    addBox(x, z, size, size, Math.random() < 0.65 ? 1.2 : 2.4, crateMat, Math.random() < 0.5 ? 0x33f0ff : 0xff2bd6);
    placed.push({ x, z, size });
  }
  builtLevel = 'arena';
}

// Many copies of one shape drawn in a single call; returns the mesh
function scatter(geometry, material, items, { solid = true, shadow = true } = {}) {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  items.forEach((it, i) => {
    q.setFromEuler(new THREE.Euler(it.rx || 0, it.ry || 0, it.rz || 0));
    m.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.sx, it.sy, it.sz));
    mesh.setMatrixAt(i, m);
    if (it.color !== undefined) mesh.setColorAt(i, new THREE.Color(it.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  levelGroup.add(mesh);
  if (solid) solidMeshes.push(mesh);
  return mesh;
}

function buildWilds() {
  clearLevel();
  builtLevel = 'wilds';
  const W = MAP_SIZES[mapSize].wilds;
  const k = W / 200;            // how much bigger than the normal map
  const dense = Math.min(k * k, 2.5);
  bounds = W;
  setCameraFar(900);
  sky.visible = true;
  stars.visible = false;
  scene.environment = null;
  renderer.toneMappingExposure = 1;
  bloomPass.threshold = 0.95;
  bloomPass.strength = 0.3;
  scene.background.setHex(0x8cbcf0);
  scene.fog.color.setHex(0x8cbcf0);
  scene.fog.near = 500;
  scene.fog.far = 900;
  sunDir = WILDS_SUN;
  sun.color.setHex(0xfff1dd);
  sun.intensity = 3;
  hemi.color.setHex(0xbfd9ff);
  hemi.groundColor.setHex(0x4a5a30);
  hemi.intensity = 1.4;

  // Monster camps far apart, nearest (easiest) first
  const camps = [];
  const radii = [45, 60, 75, 90, 105, 120, 135, 148, 160, 170, 180, 188].map((r) => r * k);
  radii.forEach((r, i) => {
    let best = null;
    for (let t = 0; t < 60; t++) {
      const a = Math.random() * Math.PI * 2;
      const c = { x: Math.cos(a) * r, z: Math.sin(a) * r, monster: MONSTERS[i] };
      const gap = Math.min(Infinity, ...camps.map((o) => Math.hypot(o.x - c.x, o.z - c.z)));
      if (!best || gap > best.gap) best = { ...c, gap };
      if (gap >= 45 * k) break;
    }
    camps.push(best);
  });
  flatSpots = [{ x: 0, z: 0, r: 14 }, ...camps.map((c) => ({ x: c.x, z: c.z, r: 16 }))];
  for (const f of flatSpots) f.h = rawTerrain(f.x, f.z);

  // Hilly ground with grass texture, tinted by height and slope
  const grass = groundTexture((g) => {
    g.fillStyle = '#5d8f3e';
    g.fillRect(0, 0, 256, 256);
    const shades = ['#4c7f33', '#6aa047', '#3f6e2b', '#7db255', '#557f38'];
    for (let i = 0; i < 2200; i++) {
      g.strokeStyle = shades[i % shades.length];
      g.lineWidth = 1 + Math.random();
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + rand(-2, 2), y - rand(3, 7));
      g.stroke();
    }
    for (let i = 0; i < 30; i++) {
      g.fillStyle = 'rgba(110, 90, 60, 0.35)';
      g.beginPath();
      g.arc(Math.random() * 256, Math.random() * 256, rand(3, 10), 0, Math.PI * 2);
      g.fill();
    }
  }, W / 3);
  const segs = Math.min(320, Math.round(200 * k));
  const tg = new THREE.PlaneGeometry(W * 2, W * 2, segs, segs);
  tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, terrainY(tp.getX(i), tp.getZ(i)));
  tg.computeVertexNormals();
  const tn = tg.attributes.normal;
  const tint = [];
  const col = new THREE.Color();
  const dirt = new THREE.Color(0.75, 0.62, 0.45);
  for (let i = 0; i < tp.count; i++) {
    const h = clamp((tp.getY(i) + 12) / 24, 0, 1);
    const slope = clamp((1 - tn.getY(i)) * 6, 0, 1);
    col.setRGB(0.75 + h * 0.3, 0.8 + h * 0.25, 0.7 + h * 0.15).lerp(dirt, slope * 0.7).multiplyScalar(rand(0.92, 1.05));
    tint.push(col.r, col.g, col.b);
  }
  tg.setAttribute('color', new THREE.Float32BufferAttribute(tint, 3));
  const ground = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ map: grass, vertexColors: true, roughness: 0.95 }));
  ground.receiveShadow = true;
  levelGroup.add(ground);

  const reserved = [{ x: 0, z: 0, r: 10 }, ...camps.map((c) => ({ x: c.x, z: c.z, r: 15 }))];
  const freeSpot = (margin, minR = 0) => {
    for (let t = 0; t < 40; t++) {
      const x = rand(-W + margin, W - margin);
      const z = rand(-W + margin, W - margin);
      if (Math.hypot(x, z) < minR) continue;
      if (reserved.some((r) => Math.hypot(r.x - x, r.z - z) < r.r + margin)) continue;
      return { x, z, y: terrainY(x, z) };
    }
    return null;
  };

  const supplies = [];
  for (let i = 0; i < 18 * k; i++) {
    const p = freeSpot(4, 18);
    if (p) { supplies.push(p); reserved.push({ ...p, r: 3 }); }
  }
  const starSpots = [];
  for (let i = 0; i < 22 * k; i++) {
    const p = freeSpot(3, 12);
    if (p) { starSpots.push(p); reserved.push({ ...p, r: 2 }); }
  }

  // Stone ruins around each camp for cover
  const ruinMat = new THREE.MeshStandardMaterial({ color: 0x8a8174, roughness: 0.9 });
  for (const c of camps) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rand(-0.2, 0.2);
      const r = rand(9, 13);
      const x = c.x + Math.cos(a) * r;
      const z = c.z + Math.sin(a) * r;
      const tall = Math.random() < 0.4;
      const h = tall ? rand(4, 7) : rand(1.1, 2.2);
      addBox(x, z, tall ? 1.6 : rand(2, 3.5), tall ? 1.6 : rand(1, 2), h + 0.5, ruinMat, undefined, terrainY(x, z) - 0.5);
    }
  }

  // Trees: pines and round leafy trees
  const trunks = [];
  const pineLow = [];
  const pineHigh = [];
  const leafy = [];
  const greens = [0x2f5d2a, 0x3b6e2f, 0x2a4d26, 0x456f2c];
  const leafGreens = [0x4f8a34, 0x5f9a3a, 0x6c9c34, 0x3f7a30];
  for (let i = 0; i < 360 * dense; i++) {
    const p = freeSpot(2);
    if (!p) continue;
    reserved.push({ ...p, r: 1.5 });
    const s = rand(0.85, 1.35);
    trunks.push({ x: p.x, y: p.y + 1.4 * s, z: p.z, sx: s, sy: s, sz: s });
    if (Math.random() < 0.6) {
      const c = greens[i % greens.length];
      pineLow.push({ x: p.x, y: p.y + 3.6 * s, z: p.z, sx: s, sy: s, sz: s, ry: rand(0, 6), color: c });
      pineHigh.push({ x: p.x, y: p.y + 5.4 * s, z: p.z, sx: s * 0.7, sy: s * 0.8, sz: s * 0.7, ry: rand(0, 6), color: c });
    } else {
      leafy.push({ x: p.x, y: p.y + 4 * s, z: p.z, sx: s * rand(0.9, 1.2), sy: s * rand(0.8, 1.05), sz: s * rand(0.9, 1.2), ry: rand(0, 6), color: leafGreens[i % leafGreens.length] });
    }
    colliders.push({ minX: p.x - 0.4, maxX: p.x + 0.4, minZ: p.z - 0.4, maxZ: p.z + 0.4, top: p.y + 5 });
  }
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true });
  scatter(new THREE.CylinderGeometry(0.22, 0.38, 2.8, 7), new THREE.MeshStandardMaterial({ color: 0x5b3b24, roughness: 0.95 }), trunks);
  scatter(new THREE.ConeGeometry(1.9, 3.6, 8), leafMat, pineLow, { solid: false });
  scatter(new THREE.ConeGeometry(1.9, 3.6, 8), leafMat, pineHigh, { solid: false });
  scatter(new THREE.IcosahedronGeometry(1.9, 1), leafMat, leafy, { solid: false });

  // Bushes
  const bushes = [];
  for (let i = 0; i < 160 * dense; i++) {
    const p = freeSpot(1.5);
    if (!p) continue;
    const s = rand(0.6, 1.2);
    bushes.push({ x: p.x, y: p.y + 0.35 * s, z: p.z, sx: s, sy: s * 0.7, sz: s, ry: rand(0, 6), color: leafGreens[i % leafGreens.length] });
  }
  scatter(new THREE.IcosahedronGeometry(0.9, 1), leafMat, bushes, { solid: false });

  // Rocks (small ones can be jumped on)
  const rocks = [];
  for (let i = 0; i < 150 * dense; i++) {
    const p = freeSpot(3);
    if (!p) continue;
    const s = rand(0.8, 2.8);
    reserved.push({ ...p, r: s + 0.5 });
    rocks.push({ x: p.x, y: p.y + s * 0.3, z: p.z, sx: s, sy: s * 0.7, sz: s, ry: rand(0, 6), rx: rand(-0.2, 0.2), color: [0x8a8780, 0x7a776f, 0x9a958a][i % 3] });
    colliders.push({ minX: p.x - s * 0.8, maxX: p.x + s * 0.8, minZ: p.z - s * 0.8, maxZ: p.z + s * 0.8, top: p.y + s }); 
  }
  scatter(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }), rocks);

  // Grass tufts: three crossed blades, dark at the root and light at the tip
  const blade = new THREE.BufferGeometry();
  const bp = [];
  const bc = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI;
    const dx = Math.cos(a) * 0.07;
    const dz = Math.sin(a) * 0.07;
    const lean = rand(-0.12, 0.12);
    bp.push(-dx, 0, -dz, dx, 0, dz, lean, 0.5, lean);
    bc.push(0.07, 0.16, 0.04, 0.07, 0.16, 0.04, 0.26, 0.45, 0.12);
  }
  blade.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  blade.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
  blade.computeVertexNormals();
  const tufts = [];
  for (let i = 0; i < 16000 * Math.min(k, 2); i++) {
    const x = rand(-W + 1, W - 1);
    const z = rand(-W + 1, W - 1);
    const s = rand(0.6, 1.1);
    tufts.push({ x, y: terrainY(x, z) - 0.03, z, sx: s, sy: s * rand(0.8, 1.3), sz: s, ry: rand(0, 6) });
  }
  scatter(blade, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.9 }), tufts, { solid: false, shadow: false });

  // Wildflowers
  const flowers = [];
  for (let i = 0; i < 1800 * k; i++) {
    const x = rand(-W + 1, W - 1);
    const z = rand(-W + 1, W - 1);
    flowers.push({ x, y: terrainY(x, z) + 0.3, z, sx: 1, sy: 1, sz: 1, color: [0xff5a5a, 0xffe14a, 0xffffff, 0xc88cff][i % 4] });
  }
  scatter(new THREE.IcosahedronGeometry(0.07, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), flowers, { solid: false, shadow: false });

  wildsLayout = { camps, supplies, stars: starSpots };
}

function setCameraFar(far) {
  camera.far = far;
  camera.updateProjectionMatrix();
}

// A rocket ship that stands on each planet's launch pad
function makeRocketShip(color) {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xeeeef2, roughness: 0.35, metalness: 0.3 });
  const accent = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 });
  g.add(
    part(new THREE.CylinderGeometry(1.2, 1.4, 7, 20), white, 0, 4.5, 0),
    part(new THREE.ConeGeometry(1.2, 2.6, 20), accent, 0, 9.3, 0),
    part(new THREE.CylinderGeometry(0.8, 1.0, 0.8, 16), metalMat(0x333340), 0, 0.6, 0),
    part(new THREE.SphereGeometry(0.45, 14, 10), glowMat(0x7ff6ff), 0, 6.2, 1.12),
    part(new THREE.CylinderGeometry(1.22, 1.22, 0.3, 20), accent, 0, 3.0, 0),
  );
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const fin = part(boxG(0.15, 2.2, 1.6), accent, Math.sin(a) * 1.4, 1.6, Math.cos(a) * 1.4);
    fin.rotation.y = a;
    g.add(fin);
  }
  const flame = part(new THREE.ConeGeometry(0.8, 3, 12), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }), 0, -1.4, 0, Math.PI);
  flame.visible = false;
  g.add(flame);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, flame };
}

function buildSpace() {
  clearLevel();
  builtLevel = 'space';
  const R = MAP_SIZES[mapSize].planet;
  const spread = 1 + (R - 60) / 120;
  bounds = 1200;
  setCameraFar(2600);
  sky.visible = false;
  stars.visible = true;
  scene.environment = null;
  renderer.toneMappingExposure = 1;
  bloomPass.threshold = 0.72;
  bloomPass.strength = 0.5;
  scene.background.setHex(0x02030a);
  scene.fog.color.setHex(0x02030a);
  scene.fog.near = 3000;
  scene.fog.far = 4000;
  sunDir = ARENA_SUN;
  sun.color.setHex(0xffffff);
  sun.intensity = 3.2;
  hemi.color.setHex(0x8890b0);
  hemi.groundColor.setHex(0x202030);
  hemi.intensity = 1.3;

  planets = PLANETS.map((def) => ({ ...def, x: def.x * spread, z: def.z * spread, r: R }));
  flatSpots = [];
  for (const p of planets) {
    p.pad = { x: p.x + R * 0.55, z: p.z };
    p.spawn = { x: p.pad.x - 8, z: p.pad.z };
    p.camps = p.bosses.map((mi, i) => {
      const a = Math.PI / 2 + (i + 0.5) * (Math.PI / p.bosses.length) + (p.final ? Math.PI / 2 : 0);
      const r = p.final ? R * 0.45 : R * 0.55;
      return { x: p.x + Math.cos(a) * r, z: p.z + Math.sin(a) * r, monster: MONSTERS[mi] };
    });
    flatSpots.push({ x: p.pad.x, z: p.pad.z, r: 7, h: 0 }, { x: p.x, z: p.z, r: 8, h: 0 }, ...p.camps.map((c) => ({ x: c.x, z: c.z, r: 10, h: 0 })));
  }

  const rockItems = [];
  const crystalItems = [];
  for (const p of planets) {
    // Surface disc with gentle hills, sitting on the top of a big round planet
    const tex = groundTexture((g) => {
      g.fillStyle = p.ground;
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = rand(4, 18);
        g.fillStyle = p.spots;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.12)';
        g.lineWidth = 2;
        g.beginPath(); g.arc(x - 1, y - 1, r, Math.PI, Math.PI * 1.6); g.stroke();
      }
    }, R / 6);
    const dg = new THREE.RingGeometry(0.5, R, 128, 48).rotateX(-Math.PI / 2);
    const pos = dg.attributes.position;
    const uv = dg.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + p.x;
      const z = pos.getZ(i) + p.z;
      pos.setXYZ(i, x, terrainY(x, z), z);
      uv.setXY(i, x / 24, z / 24);
    }
    dg.computeVertexNormals();
    tex.repeat.set(1, 1);
    const disc = new THREE.Mesh(dg, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    disc.receiveShadow = true;
    levelGroup.add(disc);

    const Rs = R * 1.3;
    const drop = Math.sqrt(Rs * Rs - R * R);
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(Rs, 48, 24, 0, Math.PI * 2, Math.acos(drop / Rs), Math.PI - Math.acos(drop / Rs)),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.9, flatShading: true }),
    );
    ball.position.set(p.x, p.y - drop - 0.3, p.z);
    levelGroup.add(ball);

    const name = makeLabel(`${p.icon} ${p.name} ${p.en}`, 0xffffff);
    name.scale.set(44, 11, 1);
    name.position.set(p.x, p.y + 45, p.z);
    levelGroup.add(name);

    // Launch pad and rocket
    const padY = terrainY(p.pad.x, p.pad.z);
    const pad = part(new THREE.CylinderGeometry(5, 5.4, 0.5, 32), metalMat(0x50525e), p.pad.x, padY + 0.05, p.pad.z);
    pad.receiveShadow = true;
    const padRing = part(new THREE.TorusGeometry(4.6, 0.12, 8, 48), glowMat(0xffb020), p.pad.x, padY + 0.35, p.pad.z, Math.PI / 2);
    const ship = makeRocketShip(p.color);
    ship.group.position.set(p.pad.x, padY + 0.3, p.pad.z);
    p.rocket = ship.group;
    levelGroup.add(pad, padRing, ship.group);
    colliders.push({ minX: p.pad.x - 1.4, maxX: p.pad.x + 1.4, minZ: p.pad.z - 1.4, maxZ: p.pad.z + 1.4, top: padY + 11 });

    // Ruins around the boss camps
    const ruinMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.color).multiplyScalar(0.6), roughness: 0.8 });
    for (const c of p.camps) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        const x = c.x + Math.cos(a) * 9;
        const z = c.z + Math.sin(a) * 9;
        addBox(x, z, 1.6, 1.6, rand(2, 5), ruinMat, p.color, terrainY(x, z) - 0.5);
      }
    }

    // Rocks and crystals, kept away from pads, centers and camps
    const keepOut = [{ x: p.pad.x, z: p.pad.z, r: 9 }, { x: p.x, z: p.z, r: 8 }, ...p.camps.map((c) => ({ x: c.x, z: c.z, r: 14 }))];
    const count = Math.round(40 * (R / 60) ** 2);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * (R - 6);
      const x = p.x + Math.cos(a) * rr;
      const z = p.z + Math.sin(a) * rr;
      if (keepOut.some((o) => Math.hypot(o.x - x, o.z - z) < o.r)) continue;
      const y = terrainY(x, z);
      if (i % 3 === 0) {
        const sc = rand(0.6, 1.2);
        crystalItems.push({ x, y: y + sc * 1.2, z, sx: sc * 0.6, sy: sc * 2, sz: sc * 0.6, ry: rand(0, 6), rz: rand(-0.3, 0.3), color: [0x33f0ff, 0xff2bd6, 0xffd23f][i % 3] });
        colliders.push({ minX: x - 0.4, maxX: x + 0.4, minZ: z - 0.4, maxZ: z + 0.4, top: y + sc * 2.2 });
      } else {
        const sc = rand(0.8, 2.4);
        rockItems.push({ x, y: y + sc * 0.3, z, sx: sc, sy: sc * 0.7, sz: sc, ry: rand(0, 6), color: new THREE.Color(p.color).multiplyScalar(rand(0.45, 0.7)).getHex() });
        colliders.push({ minX: x - sc * 0.8, maxX: x + sc * 0.8, minZ: z - sc * 0.8, maxZ: z + sc * 0.8, top: y + sc });
      }
    }
  }
  scatter(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }), rockItems);
  scatter(new THREE.OctahedronGeometry(0.6, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), crystalItems, { shadow: false });

  // Far-away scenery: a glowing sun and a ringed gas giant
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false }));
  sunBall.position.copy(ARENA_SUN).multiplyScalar(1900);
  const giant = new THREE.Mesh(new THREE.SphereGeometry(220, 48, 24), new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 1 }));
  giant.position.set(-900, -350, 1400);
  const ring = new THREE.Mesh(new THREE.RingGeometry(280, 420, 96), new THREE.MeshStandardMaterial({ color: 0xe8c9a0, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }));
  ring.position.copy(giant.position);
  ring.rotation.set(-1.2, 0.3, 0);
  levelGroup.add(sunBall, giant, ring);
}

// ---------- Collision helpers ----------
function circleHitsRect(p, r, c) {
  const cx = clamp(p.x, c.minX, c.maxX);
  const cz = clamp(p.z, c.minZ, c.maxZ);
  return (p.x - cx) ** 2 + (p.z - cz) ** 2 < r * r;
}

// Push a circle (x,z,r) out of every collider whose top is above `feetY + STEP_HEIGHT`.
function pushOut(pos, r, feetY) {
  for (const c of colliders) {
    if (c.top <= feetY + STEP_HEIGHT) continue;
    const cx = clamp(pos.x, c.minX, c.maxX);
    const cz = clamp(pos.z, c.minZ, c.maxZ);
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      pos.x += (dx / d) * (r - d);
      pos.z += (dz / d) * (r - d);
    } else {
      // Center is inside the box: exit along the shortest axis
      const exits = [
        [pos.x - c.minX + r, -1, 0], [c.maxX - pos.x + r, 1, 0],
        [pos.z - c.minZ + r, 0, -1], [c.maxZ - pos.z + r, 0, 1],
      ].sort((a, b) => a[0] - b[0]);
      pos.x += exits[0][1] * exits[0][0];
      pos.z += exits[0][2] * exits[0][0];
    }
  }
  const lim = bounds - 0.5 - r;
  pos.x = clamp(pos.x, -lim, lim);
  pos.z = clamp(pos.z, -lim, lim);
}

function groundHeightAt(x, z, r, feetY) {
  let h = terrainY(x, z);
  for (const c of colliders) {
    if (c.top > feetY + STEP_HEIGHT) continue;
    if (circleHitsRect({ x, z }, r * 0.8, c)) h = Math.max(h, c.top);
  }
  return h;
}

function insideSolid(p) {
  if (p.y <= terrainY(p.x, p.z)) return true;
  for (const c of colliders) {
    if (p.y < c.top && p.x > c.minX && p.x < c.maxX && p.z > c.minZ && p.z < c.maxZ) return true;
  }
  return Math.abs(p.x) > bounds - 0.5 || Math.abs(p.z) > bounds - 0.5;
}

// Walk toward (tx, tz), sliding along obstacles and side-stepping when stuck
function steer(ent, tx, tz, speed, dt) {
  const g = ent.group.position;
  const dx = tx - g.x;
  const dz = tz - g.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  let nx = dx / dist;
  let nz = dz / dist;
  if (ent.detourT > 0) {
    ent.detourT -= dt;
    const mx = nx * 0.3 - nz * ent.detour;
    const mz = nz * 0.3 + nx * ent.detour;
    const l = Math.hypot(mx, mz);
    nx = mx / l;
    nz = mz / l;
  }
  const step = Math.min(speed * dt, dist);
  const bx = g.x;
  const bz = g.z;
  g.x += nx * step;
  g.z += nz * step;
  pushOut(g, ent.radius, terrainY(g.x, g.z));
  if (step > 0.01 && Math.hypot(g.x - bx, g.z - bz) < step * 0.3 && ent.detourT <= 0) {
    ent.detour = Math.random() < 0.5 ? 1 : -1;
    ent.detourT = 0.8;
  }
}

// ---------- Audio (synthesized, no asset files) ----------
let actx = null;
let master = null;
let noiseBuffer = null;

function initAudio() {
  if (actx) { actx.resume(); return; }
  actx = new (window.AudioContext || window.webkitAudioContext)();
  master = actx.createGain();
  master.gain.value = 0.45;
  master.connect(actx.destination);
  noiseBuffer = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

function noise(dur, f0, f1, vol, when = 0) {
  if (!actx || vol <= 0.001) return;
  const t = actx.currentTime + when;
  const src = actx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = actx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(f0, t);
  filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur);
}

function tone(type, f0, f1, dur, vol, when = 0) {
  if (!actx || vol <= 0.001) return;
  const t = actx.currentTime + when;
  const osc = actx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur);
}

const near = (dist, range = 40) => Math.max(0.1, 1 - dist / range);
const sfx = {
  rifle() { noise(0.12, 4000, 300, 0.5); tone('sine', 180, 45, 0.12, 0.6); },
  shotgun() { noise(0.3, 3000, 150, 0.85); tone('sine', 120, 35, 0.25, 0.8); },
  sniper() { noise(0.4, 7000, 200, 0.75); tone('square', 1800, 200, 0.15, 0.08); tone('sine', 90, 28, 0.35, 0.8); },
  rocket() { noise(0.45, 1500, 250, 0.5); tone('sawtooth', 160, 520, 0.3, 0.1); },
  lightning() { tone('sawtooth', rand(900, 1400), 260, 0.1, 0.1); noise(0.08, 8000, 2000, 0.25); },
  mateShot(dist) { if (dist < 50) noise(0.08, 3000, 400, 0.18 * near(dist, 50)); },
  explosion(dist) { noise(1.1, 1600, 40, 0.9 * near(dist, 60)); tone('sine', 85, 22, 0.8, 0.9 * near(dist, 60)); },
  swing() { noise(0.2, 5000, 500, 0.35); tone('sine', 520, 180, 0.16, 0.06); },
  swordHit() { tone('sawtooth', 320, 110, 0.14, 0.25); noise(0.1, 2500, 400, 0.4); },
  deflect() { tone('square', 2000, 3200, 0.07, 0.15); },
  hit() { tone('square', 900, 1300, 0.05, 0.12); },
  head() { tone('square', 1500, 2200, 0.08, 0.16); },
  kill() { noise(0.6, 1200, 60, 0.7); tone('sawtooth', 220, 35, 0.45, 0.2); },
  bossDie() { noise(2, 1200, 30, 1); tone('sawtooth', 300, 30, 1.6, 0.3); [523, 659, 784, 1047, 1319].forEach((f, i) => tone('triangle', f, f, 0.3, 0.15, 0.6 + i * 0.1)); },
  roar(dist) { tone('sawtooth', 110, 55, 0.9, 0.35 * near(dist, 60)); noise(0.9, 600, 80, 0.4 * near(dist, 60)); },
  hurt() { tone('sawtooth', 240, 80, 0.25, 0.35); noise(0.15, 800, 100, 0.3); },
  armorHit() { tone('triangle', 1300, 700, 0.12, 0.22); },
  enemyShot(dist) { tone('square', 760, 180, 0.2, 0.12 * near(dist)); },
  empty() { tone('square', 300, 280, 0.03, 0.1); },
  reload() { tone('square', 500, 450, 0.04, 0.12); tone('square', 900, 850, 0.05, 0.14, 0.9); },
  switch() { tone('square', 700, 900, 0.04, 0.08); },
  pickup() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.12, 0.2, i * 0.06)); },
  power() { [659, 880, 1175, 1568].forEach((f, i) => tone('square', f, f * 1.02, 0.12, 0.1, i * 0.05)); },
  unlock() { [392, 523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f * 1.01, 0.2, 0.18, i * 0.07)); },
  legend() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone('triangle', f, f, 0.4, 0.18, i * 0.09)); },
  wave() { [262, 330, 392, 523].forEach((f, i) => tone('sawtooth', f, f * 1.01, 0.35, 0.08, i * 0.09)); },
  spawn() { tone('sine', 120, 600, 0.4, 0.1); },
  build() { tone('square', 300, 620, 0.1, 0.12); tone('triangle', 620, 940, 0.12, 0.12, 0.06); },
  wallHit() { noise(0.08, 1400, 400, 0.25); },
  wallBreak() { noise(0.45, 2500, 100, 0.55); tone('square', 400, 90, 0.3, 0.1); },
  revive() { [262, 392, 523, 784, 1047].forEach((f, i) => tone('sine', f, f, 0.5, 0.2, i * 0.08)); },
  shield() { tone('sine', 300, 900, 0.4, 0.2); },
  jet() { noise(0.12, 900, 300, 0.12); },
  rocketLaunch() { noise(2.5, 1200, 60, 0.7); tone('sawtooth', 60, 220, 2, 0.15); },
  step() { noise(0.07, rand(500, 800), 120, 0.1); },
  land() { noise(0.18, 600, 80, 0.3); tone('sine', 90, 40, 0.15, 0.25); },
  strike(dist) { noise(0.5, 2000, 80, 0.6 * near(dist, 50)); },
  summon() { tone('sine', 200, 80, 0.6, 0.2); tone('triangle', 400, 900, 0.4, 0.1); },
  blink() { tone('sine', 1200, 300, 0.25, 0.15); },
};

// ---------- Small model helpers ----------
const metalMat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.25 });
const glowMat = (color) => new THREE.MeshBasicMaterial({ color });
const boxG = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const tubeG = (r, len, seg = 14) => new THREE.CylinderGeometry(r, r, len, seg).rotateX(Math.PI / 2);
const UP = new THREE.Vector3(0, 1, 0);

function part(geo, material, x = 0, y = 0, z = 0, rx = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.x = rx;
  return m;
}

// A cylinder stretched between two points
function limb(a, b, r, material) {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, len, 6), material);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}

function makeLabel(text, color) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true }));
  sprite.scale.set(1.6, 0.4, 1);
  sprite.renderOrder = 10;
  sprite.userData.draw = (t) => {
    const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 64);
    g.font = 'bold 30px "Avenir Next", "PingFang SC", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 6;
    g.strokeStyle = 'rgba(0,0,0,0.75)';
    g.strokeText(t, 128, 32);
    g.fillStyle = hex(color);
    g.fillText(t, 128, 32);
    tex.needsUpdate = true;
  };
  sprite.userData.draw(text);
  return sprite;
}

// ---------- Weapon models (attached to camera) ----------
const weaponHolder = new THREE.Group();
const HOLDER_REST = new THREE.Vector3(0.24, -0.24, -0.5);
weaponHolder.position.copy(HOLDER_REST);
camera.add(weaponHolder);

function withMuzzle(group, x, y, z) {
  const muzzle = new THREE.Object3D();
  muzzle.position.set(x, y, z);
  group.add(muzzle);
  return { group, muzzle };
}

function buildRifle() {
  const g = new THREE.Group();
  const body = metalMat(0x4a5070);
  const dark = metalMat(0x262a3e);
  const glow = glowMat(0x33f0ff);
  g.add(
    part(boxG(0.085, 0.1, 0.36), body),
    part(tubeG(0.022, 0.26), dark, 0, 0.015, -0.3),
    part(boxG(0.05, 0.14, 0.07), dark, 0, -0.1, -0.06, 0.15),
    part(boxG(0.055, 0.13, 0.07), dark, 0, -0.09, 0.11, 0.3),
    part(boxG(0.07, 0.08, 0.16), body, 0, -0.01, 0.25),
    part(boxG(0.09, 0.018, 0.04), glow, 0, 0.02, -0.08),
    part(boxG(0.09, 0.018, 0.04), glow, 0, 0.02, 0.06),
    part(boxG(0.02, 0.03, 0.05), glow, 0, 0.065, -0.1),
  );
  return withMuzzle(g, 0, 0.015, -0.44);
}

function buildShotgun() {
  const g = new THREE.Group();
  const body = metalMat(0x3c3c52);
  const wood = metalMat(0x7a4424);
  const glow = glowMat(0xff8a3d);
  g.add(
    part(boxG(0.1, 0.11, 0.3), body),
    part(tubeG(0.028, 0.44), body, -0.03, 0.02, -0.34),
    part(tubeG(0.028, 0.44), body, 0.03, 0.02, -0.34),
    part(boxG(0.12, 0.065, 0.15), wood, 0, -0.05, -0.27),
    part(boxG(0.06, 0.14, 0.08), wood, 0, -0.1, 0.12, 0.3),
    part(boxG(0.08, 0.09, 0.18), wood, 0, -0.02, 0.24),
    part(boxG(0.105, 0.02, 0.22), glow, 0, 0.06, 0),
    part(tubeG(0.031, 0.02), glow, -0.03, 0.02, -0.55),
    part(tubeG(0.031, 0.02), glow, 0.03, 0.02, -0.55),
  );
  return withMuzzle(g, 0, 0.02, -0.58);
}

function buildSniper() {
  const g = new THREE.Group();
  const body = metalMat(0x2f2a48);
  const dark = metalMat(0x1a1828);
  const glow = glowMat(0xb26bff);
  g.add(
    part(boxG(0.07, 0.09, 0.5), body, 0, 0, -0.05),
    part(tubeG(0.018, 0.5), dark, 0, 0.01, -0.55),
    part(tubeG(0.036, 0.24), dark, 0, 0.095, -0.06),
    part(tubeG(0.04, 0.02), glow, 0, 0.095, -0.19),
    part(tubeG(0.04, 0.02), glow, 0, 0.095, 0.07),
    part(boxG(0.06, 0.12, 0.2), body, 0, -0.02, 0.29),
    part(boxG(0.05, 0.13, 0.07), dark, 0, -0.1, 0.1, 0.3),
    part(boxG(0.075, 0.015, 0.3), glow, 0, -0.04, -0.12),
  );
  return withMuzzle(g, 0, 0.01, -0.82);
}

function buildRocket() {
  const g = new THREE.Group();
  const tube = metalMat(0x2c4a3a);
  const dark = metalMat(0x1b2522);
  const glow = glowMat(0x3fd655);
  const nose = new THREE.ConeGeometry(0.05, 0.12, 12).rotateX(-Math.PI / 2);
  g.add(
    part(tubeG(0.055, 0.7, 18), tube, 0, 0.04, -0.15),
    part(tubeG(0.061, 0.04, 18), glow, 0, 0.04, -0.48),
    part(tubeG(0.061, 0.03, 18), dark, 0, 0.04, 0.2),
    part(nose, glowMat(0xff4567), 0, 0.04, -0.53),
    part(boxG(0.045, 0.12, 0.06), dark, 0, -0.06, -0.05, 0.2),
    part(boxG(0.02, 0.04, 0.06), glow, 0.065, 0.07, -0.2),
  );
  g.position.set(0.05, 0.01, 0);
  return withMuzzle(g, 0, 0.04, -0.58);
}

function buildLightning() {
  const g = new THREE.Group();
  const body = metalMat(0x2a3550);
  const glow = glowMat(0x9fd8ff);
  g.add(
    part(boxG(0.09, 0.1, 0.34), body),
    part(tubeG(0.03, 0.34), metalMat(0x1a2030), 0, 0.01, -0.3),
    part(boxG(0.055, 0.13, 0.07), body, 0, -0.09, 0.1, 0.3),
    part(new THREE.SphereGeometry(0.04, 10, 10), glow, 0, 0.01, -0.48),
  );
  for (let i = 0; i < 3; i++) g.add(part(new THREE.TorusGeometry(0.05, 0.012, 6, 16), glow, 0, 0.01, -0.2 - i * 0.08));
  return withMuzzle(g, 0, 0.01, -0.5);
}

function buildSword() {
  const pivot = new THREE.Group();
  const blade = new THREE.Group();
  const coreMat = glowMat(0xe0ffff);
  const auraMat = new THREE.MeshBasicMaterial({ color: 0x33f0ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
  blade.add(
    part(new THREE.CylinderGeometry(0.022, 0.026, 0.2, 10), metalMat(0x222233)),
    part(boxG(0.16, 0.03, 0.05), glowMat(0xff2bd6), 0, 0.11, 0),
    part(boxG(0.04, 0.8, 0.012), coreMat, 0, 0.52, 0),
    part(boxG(0.1, 0.86, 0.05), auraMat, 0, 0.52, 0),
  );
  blade.rotation.set(-0.55, 0, 0.35);
  pivot.add(blade);
  return { group: pivot, muzzle: null, blade, coreMat, auraMat };
}

const models = {
  rifle: buildRifle(),
  shotgun: buildShotgun(),
  sniper: buildSniper(),
  rocket: buildRocket(),
  sword: buildSword(),
  lightning: buildLightning(),
};
for (const m of Object.values(models)) {
  m.group.visible = false;
  weaponHolder.add(m.group);
}
// Remember original glow colors so "golden weapons" can be undone on restart
weaponHolder.traverse((o) => { if (o.material?.isMeshBasicMaterial) o.userData.baseColor = o.material.color.getHex(); });

const muzzleFlash = new THREE.Mesh(
  new THREE.SphereGeometry(0.07, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, blending: THREE.AdditiveBlending }),
);
muzzleFlash.visible = false;
const muzzleLight = new THREE.PointLight(0xffaa55, 0, 8, 2);

// Sword slash arc in front of the camera
const slashArc = new THREE.Mesh(
  new THREE.RingGeometry(0.95, 1.3, 32, 1, 0, Math.PI * 0.85),
  new THREE.MeshBasicMaterial({ color: 0x9ffcff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }),
);
slashArc.position.set(0, -0.15, -1.4);
slashArc.rotation.z = -0.25;
camera.add(slashArc);

// ---------- Effects: particles, tracers, beams, shockwaves ----------
const particles = [];
const particleGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09);

function burst(pos, color, count, speed, life = 0.6) {
  for (let i = 0; i < count && particles.length < 600; i++) {
    const mesh = new THREE.Mesh(particleGeo, new THREE.MeshBasicMaterial({ color, transparent: true }));
    mesh.position.copy(pos);
    const vel = new THREE.Vector3().randomDirection().multiplyScalar(speed * (0.3 + Math.random() * 0.7));
    vel.y = Math.abs(vel.y) * 0.8 + speed * 0.2;
    scene.add(mesh);
    particles.push({ mesh, vel, life: life * (0.6 + Math.random() * 0.4), max: life });
  }
}

const tracers = []; // { mesh, life, max, ownGeo }
const tracerGeo = new THREE.BoxGeometry(0.025, 0.025, 1);
tracerGeo.translate(0, 0, 0.5);

function tracer(from, to, color = 0x9ffcff, width = 1) {
  const mesh = new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending,
  }));
  mesh.position.copy(from);
  mesh.lookAt(to);
  mesh.scale.set(width, width, from.distanceTo(to));
  scene.add(mesh);
  tracers.push({ mesh, life: width > 1 ? 0.25 : 0.07, max: width > 1 ? 0.25 : 0.07 });
}

// Jagged lightning bolt between two points
function bolt(a, b, color = 0xbfe8ff) {
  const pts = [];
  const segs = Math.max(4, Math.round(a.distanceTo(b) / 1.2));
  for (let i = 0; i <= segs; i++) {
    const p = a.clone().lerp(b, i / segs);
    if (i > 0 && i < segs) p.add(new THREE.Vector3(rand(-0.35, 0.35), rand(-0.35, 0.35), rand(-0.35, 0.35)));
    pts.push(p);
  }
  const mesh = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true }));
  scene.add(mesh);
  tracers.push({ mesh, life: 0.1, max: 0.1, ownGeo: true });
  burst(b, color, 3, 3, 0.25);
}

const fx = []; // { mesh, life, max, kind: 'beam' | 'shock', size }
const shockGeo = new THREE.SphereGeometry(1, 24, 16);

function spawnBeam(x, z, color) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 12, 16, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }),
  );
  mesh.position.set(x, terrainY(x, z) + 6, z);
  scene.add(mesh);
  fx.push({ mesh, life: 0.7, max: 0.7, kind: 'beam', ownGeo: true });
}

function shockwave(pos, color, size) {
  const mesh = new THREE.Mesh(shockGeo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  mesh.position.copy(pos);
  mesh.scale.setScalar(0.2);
  scene.add(mesh);
  fx.push({ mesh, life: 0.4, max: 0.4, kind: 'shock', size });
}

function disposeMesh(mesh) {
  scene.remove(mesh);
  mesh.material.dispose();
}

function disposeGroup(group) {
  scene.remove(group);
  group.traverse((o) => {
    if (o.geometry && o.geometry !== particleGeo) o.geometry.dispose();
    if (o.material) { o.material.map?.dispose(); o.material.dispose(); }
  });
}

// Defeated enemies break into pieces that tumble and fade
const debris = [];
function shatter(group, center) {
  group.updateMatrixWorld(true);
  const pieces = [];
  group.traverse((o) => { if (o.isMesh) pieces.push(o); });
  const life = rand(2.2, 2.8);
  for (const m of pieces) {
    scene.attach(m);
    m.material.transparent = true;
    const dir = m.getWorldPosition(new THREE.Vector3()).sub(center);
    dir.y = Math.abs(dir.y) + 0.4;
    dir.normalize();
    debris.push({
      mesh: m, life,
      vel: dir.multiplyScalar(rand(3, 8)).add(new THREE.Vector3(0, rand(2, 5), 0)),
      spin: new THREE.Vector3(rand(-8, 8), rand(-8, 8), rand(-8, 8)),
    });
  }
  scene.remove(group);
  while (debris.length > 350) removeDebris(0);
}

function removeDebris(i) {
  const d = debris[i];
  scene.remove(d.mesh);
  d.mesh.geometry.dispose();
  d.mesh.material.dispose();
  debris.splice(i, 1);
}

// Telegraphed blasts: a flashing red circle on the ground, then a hit from the sky
const strikes = [];
function strike(x, z, delay, radius, dmg, color) {
  const y = terrainY(x, z) + 0.15;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.8, radius, 32),
    new THREE.MeshBasicMaterial({ color: 0xff2030, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, y, z);
  scene.add(ring);
  strikes.push({ ring, pos: new THREE.Vector3(x, y, z), t: delay, radius, dmg, color });
}

function removeStrike(i) {
  strikes[i].ring.geometry.dispose();
  disposeMesh(strikes[i].ring);
  strikes.splice(i, 1);
}

function updateStrikes(dt) {
  for (let i = strikes.length - 1; i >= 0; i--) {
    const st = strikes[i];
    st.t -= dt;
    st.ring.material.opacity = 0.4 + Math.abs(Math.sin(st.t * 12)) * 0.5;
    if (st.t > 0) continue;
    tracer(st.pos.clone().setY(st.pos.y + 40), st.pos, st.color, 4);
    burst(st.pos, st.color, 20, 8, 0.7);
    shockwave(st.pos, st.color, st.radius);
    boomLight.color.setHex(st.color);
    boomLight.position.copy(st.pos);
    boomLight.intensity = 50;
    const d = dist2d(player.pos, st.pos);
    sfx.strike(d);
    if (d < st.radius && player.pos.y - st.pos.y < 3) damagePlayer(st.dmg);
    for (const m of mates) if (m.downT <= 0 && dist2d(m.group.position, st.pos) < st.radius) damageMate(m, st.dmg);
    removeStrike(i);
  }
}

// Tall light pillar that can be seen through the fog from far away
function makeBeacon(color, height = 60) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, height, 12, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, fog: false }),
  );
  mesh.position.y = height / 2;
  return mesh;
}

// ---------- Game state ----------
const enemies = [];
const orbs = [];
const rockets = [];
const pickups = [];  // health / armor / power stars
const loot = [];     // supply crates and legendary chests
const mates = [];
const WHITE = new THREE.Color(0xffffff);

const player = {
  pos: new THREE.Vector3(),
  vy: 0, onGround: true, yaw: 0, pitch: 0,
  bob: 0, recoil: 0, shake: 0,
};
const keys = new Set();
let mouseDown = false;
let state = 'menu'; // menu | playing | paused | reward | over
let mode = 'arena'; // arena | wilds
let teamSize = 2;
let score = 0;
let wave = 0;
let difficulty = 1;
let wavePhase = 'fighting'; // fighting | cleared | reward | break
let phaseT = 0;
let spawnQueue = [];
let spawnTimer = 0;
let monstersTotal = 0;
let monstersDefeated = 0;
let victoryShown = false;
let finalSpawned = false;
let campCount = 0;
let finalSpot = { x: 0, z: 0 };
let travel = null;
let finalT = 0;
let patrolT = 0;
let playTime = 0;
let edgeToastT = 0;
let hitmarkerT = 0;
let damageFlash = 0;
let bannerTimer = null;
let toastTimer = null;
let lastShown = null;
let hudT = 0;
let rewardSource = 'wave';
let best = Number(localStorage.getItem('neon-arena-best') || 0);
ui.bestStart.textContent = best;

// ---------- Enemies ----------
function tagHit(enemy, mesh, isHead = false) {
  for (const m of enemy.flashMats) m.userData.baseEmissive ??= m.emissive.clone();
  mesh.userData.enemy = enemy;
  mesh.userData.head = isHead;
  enemy.hitMeshes.push(mesh);
}

function baseEnemy(type, group, bodyMat, extra) {
  return {
    type, group, hitMeshes: [], flashMats: [bodyMat], flash: 0, t: Math.random() * 10,
    attackCd: 0, specialCd: 3, shootCd: 2, detourT: 0, detour: 1, aggro: true, camp: null,
    ...extra,
  };
}

// Necron warriors (silver skeleton robots) and Space Marines (power armor); brutes are heavy marines
function makeWalker(x, z, kind) {
  const brute = kind === 'brute';
  const necron = !brute && Math.random() < 0.55;
  const group = new THREE.Group();
  const bodyMat = necron
    ? new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.35, envMap: armorEnv() })
    : armorMat(brute ? 0x1d3f9a : 0x2a56c0);
  const glow = new THREE.MeshBasicMaterial({ color: necron ? 0x3dff6a : 0xff2a1a });
  const e = baseEnemy(kind, group, bodyMat, {
    flying: false,
    hp: brute ? 380 + difficulty * 25 : 100 + difficulty * 6,
    radius: brute ? 0.8 : 0.5,
    centerY: brute ? 1.4 : 0.95,
    reach: brute ? 2.1 : 1.5,
    vReach: brute ? 2.6 : 1.8,
    score: brute ? 300 : 100,
    meleeDmg: brute ? 22 + difficulty * 2 : 10 + difficulty,
    wallDmg: brute ? 90 : 35,
    color: necron ? 0x3dff6a : 0x4a7ae0,
    faction: necron ? 'necron' : 'marine',
    speed: brute ? Math.min(2.6 + difficulty * 0.1, 4.2) : Math.min(3.6 + difficulty * 0.25, 7.5) * rand(0.85, 1.15),
  });

  if (necron) buildNecron(e, group, bodyMat, glow);
  else buildMarine(e, group, bodyMat, glow, brute);
  group.traverse((o) => { if (o.isMesh && !o.material.isMeshBasicMaterial) o.castShadow = true; });
  if (brute) group.scale.setScalar(1.55);

  group.position.set(x, 0, z);
  e.maxHp = e.hp;
  return e;
}

function buildNecron(e, group, metal, glow) {
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2d30, metalness: 0.8, roughness: 0.45, envMap: armorEnv() });
  e.legs = [];
  for (const [sx, phase] of [[-1, 0], [1, Math.PI]]) {
    const leg = new THREE.Group();
    leg.position.set(0.14 * sx, 0.95, 0);
    const thigh = limb(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.45, 0.05), 0.06, metal);
    const knee = blob(0.07, dark, 0, -0.46, 0.06);
    const shin = limb(new THREE.Vector3(0, -0.46, 0.05), new THREE.Vector3(0, -0.9, -0.02), 0.05, metal);
    const foot = part(boxG(0.12, 0.05, 0.26), dark, 0, -0.93, 0.06);
    leg.add(thigh, knee, shin, foot);
    leg.userData.phase = phase;
    e.legs.push(leg);
    tagHit(e, thigh);
    tagHit(e, shin);
    group.add(leg);
  }
  const pelvis = part(boxG(0.34, 0.12, 0.18), dark, 0, 0.98, 0);
  const spine = limb(new THREE.Vector3(0, 1.0, -0.04), new THREE.Vector3(0, 1.62, -0.04), 0.045, metal);
  const core = blob(0.1, glow, 0, 1.36, 0.02);
  group.add(pelvis, spine, core);
  // Ribcage of bent metal bars around a glowing core
  for (let k = 0; k < 4; k++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.2 - k * 0.015, 0.018, 6, 20, Math.PI * 1.4), metal);
    rib.rotation.set(Math.PI / 2, 0, -Math.PI * 0.2 + Math.PI / 2);
    rib.position.set(0, 1.5 - k * 0.09, 0);
    rib.scale.set(1, 0.8, 1);
    group.add(rib);
    tagHit(e, rib);
  }
  const shoulders = part(boxG(0.56, 0.08, 0.16), dark, 0, 1.62, -0.02);
  const head = new THREE.Group();
  head.position.set(0, 1.8, 0.02);
  const skull = blob(0.14, metal, 0, 0, 0, 0.9, 1.1, 1);
  const jaw = part(boxG(0.14, 0.08, 0.12), metal, 0, -0.11, 0.04);
  const crest = part(boxG(0.05, 0.12, 0.26), dark, 0, 0.12, -0.02);
  const eyeL = part(boxG(0.05, 0.022, 0.02), glow, -0.045, 0.02, 0.13);
  const eyeR = part(boxG(0.05, 0.022, 0.02), glow, 0.045, 0.02, 0.13);
  head.add(skull, jaw, crest, eyeL, eyeR);
  group.add(shoulders, head);
  tagHit(e, pelvis);
  tagHit(e, spine);
  tagHit(e, core);
  tagHit(e, skull, true);
  tagHit(e, jaw, true);
  const arm = (sx) => {
    const a = new THREE.Group();
    a.position.set(0.3 * sx, 1.6, 0);
    a.add(
      part(boxG(0.14, 0.1, 0.16), dark, 0, 0.02, 0),
      limb(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.36, 0), 0.04, metal),
      limb(new THREE.Vector3(0, -0.36, 0), new THREE.Vector3(0, -0.7, 0.03), 0.035, metal),
      blob(0.05, dark, 0, -0.72, 0.03),
    );
    tagHit(e, a.children[1]);
    return a;
  };
  e.armL = arm(-1);
  e.armR = arm(1);
  // Gauss flayer: long rifle with a glowing green tube and a blade
  const gun = new THREE.Group();
  gun.position.set(0, -0.72, 0.05);
  gun.rotation.x = Math.PI / 2;
  gun.add(
    part(boxG(0.06, 0.08, 0.7), dark, 0, 0, 0.15),
    part(tubeG(0.025, 0.5), glow, 0, 0.06, 0.12),
    part(boxG(0.015, 0.09, 0.25), metal, 0, -0.06, 0.55),
  );
  e.armR.add(gun);
  e.armR.rotation.x = -0.6;
  group.add(e.armL, e.armR);
}

function buildMarine(e, group, armor, glow, heavy) {
  const trim = new THREE.MeshStandardMaterial({ color: 0xc9a13a, metalness: 1, roughness: 0.35, envMap: armorEnv() });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness: 0.6, metalness: 0.4 });
  e.legs = [];
  for (const [sx, phase] of [[-1, 0], [1, Math.PI]]) {
    const leg = new THREE.Group();
    leg.position.set(0.18 * sx, 0.95, 0);
    const thigh = capsule(0.14, 0.24, armor, 0, -0.22, 0);
    const knee = blob(0.11, armor, 0, -0.46, 0.08, 1, 1, 0.8);
    const shin = part(boxG(0.22, 0.36, 0.24), armor, 0, -0.66, 0);
    const boot = part(boxG(0.24, 0.12, 0.34), dark, 0, -0.9, 0.05);
    leg.add(thigh, knee, shin, boot);
    leg.userData.phase = phase;
    e.legs.push(leg);
    tagHit(e, thigh);
    tagHit(e, shin);
    group.add(leg);
  }
  const waist = part(boxG(0.5, 0.2, 0.34), dark, 0, 1.0, 0);
  const torso = part(boxG(0.66, 0.5, 0.44), armor, 0, 1.33, 0);
  const aquila = [-1, 1].map((sx) => {
    const wing = part(boxG(0.2, 0.05, 0.02), trim, 0.11 * sx, 1.43, 0.23);
    wing.rotation.z = 0.3 * sx;
    return wing;
  });
  const pack = part(boxG(0.56, 0.5, 0.24), armor, 0, 1.38, -0.32);
  const vents = [-1, 1].map((sx) => part(new THREE.CylinderGeometry(0.06, 0.07, 0.24, 10), dark, 0.17 * sx, 1.72, -0.36));
  const padR = heavy ? 0.3 : 0.24;
  const pads = [-1, 1].map((sx) => {
    const pad = part(new THREE.SphereGeometry(padR, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), armor, (0.36 + padR * 0.5) * sx, 1.52, 0);
    pad.scale.set(1, 1.1, 1.05);
    pad.add(part(new THREE.TorusGeometry(padR, 0.025, 6, 24), trim, 0, 0, 0, Math.PI / 2));
    tagHit(e, pad);
    return pad;
  });
  const head = new THREE.Group();
  head.position.set(0, 1.74, 0.03);
  const helm = blob(0.16, armor, 0, 0, 0, 0.95, 1.05, 1.05);
  const grille = part(boxG(0.12, 0.1, 0.08), dark, 0, -0.07, 0.13);
  grille.rotation.x = -0.3;
  const eyes = [-0.055, 0.055].map((ex) => blob(0.032, glow, ex, 0.02, 0.135, 1.2, 0.8, 0.5));
  head.add(helm, grille, ...eyes);
  group.add(waist, torso, ...aquila, pack, ...vents, ...pads, head);
  for (const m of [waist, torso, pack]) tagHit(e, m);
  tagHit(e, helm, true);
  tagHit(e, grille, true);
  const arm = (sx) => {
    const a = new THREE.Group();
    a.position.set(0.42 * sx, 1.48, 0);
    const upper = capsule(0.11, 0.22, armor, 0, -0.18, 0);
    const fore = capsule(0.11, 0.2, armor, 0, -0.46, 0);
    const fist = blob(0.1, dark, 0, -0.66, 0);
    a.add(upper, fore, fist);
    tagHit(e, upper);
    tagHit(e, fore);
    return a;
  };
  e.armL = arm(-1);
  e.armR = arm(1);
  // Bolter
  const gun = new THREE.Group();
  gun.position.set(0, -0.68, 0.05);
  gun.rotation.x = Math.PI / 2;
  gun.add(
    part(boxG(0.11, 0.15, 0.5), dark, 0, 0, 0.12),
    part(boxG(0.08, 0.18, 0.08), dark, 0, -0.14, 0.08),
    part(tubeG(0.03, 0.12), dark, 0, 0.03, 0.42),
    part(boxG(0.115, 0.03, 0.2), trim, 0, 0.08, 0.1),
  );
  e.armR.add(gun);
  e.armR.rotation.x = -0.6;
  group.add(e.armL, e.armR);
}

// Canoptek scarab: a flying metal beetle that replaces the old drone
function makeDrone(x, z) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.35, envMap: armorEnv() });
  const glow = new THREE.MeshBasicMaterial({ color: 0x3dff6a });
  const e = baseEnemy('drone', group, bodyMat, {
    flying: true, homeY: 3, keepDist: 11, volley: 1,
    hp: 70 + difficulty * 5, radius: 0.8, centerY: 0, score: 150, color: 0x3dff6a, orbColor: 0x3dff6a,
    speed: Math.min(4 + difficulty * 0.2, 7), strafe: Math.random() < 0.5 ? 1 : -1, strafeT: rand(2, 4),
    orbDmg: 8 + difficulty,
  });
  e.shootCd = rand(1.5, 3);

  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2d30, metalness: 0.8, roughness: 0.45, envMap: armorEnv() });
  const core = blob(0.6, bodyMat, 0, 0, 0, 1, 0.42, 1.25);
  const ridge = part(boxG(0.06, 0.06, 1.3), dark, 0, 0.24, 0);
  const belly = part(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 20), glow, 0, -0.2, 0);
  const eye = blob(0.2, dark, 0, 0.02, 0.72, 1, 0.8, 0.8);
  const eyes = [-0.08, 0.08].map((ex) => blob(0.05, glow, ex, 0.07, 0.86));
  const mandibles = [-1, 1].map((sx) => {
    const m = part(new THREE.ConeGeometry(0.04, 0.3, 6), dark, 0.1 * sx, -0.05, 0.95, Math.PI / 2);
    m.rotation.z = 0.3 * sx;
    return m;
  });
  const legs = [];
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) legs.push(limb(new THREE.Vector3(0.4 * sx, -0.1, 0.3 - k * 0.3), new THREE.Vector3(0.75 * sx, -0.45, 0.4 - k * 0.35), 0.03, dark));
  e.ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 6, 32), glow);
  e.ring.rotation.x = Math.PI / 2;
  e.ring.position.y = -0.18;
  core.castShadow = true;
  group.add(core, ridge, belly, eye, ...eyes, ...mandibles, ...legs, e.ring);
  tagHit(e, core);
  tagHit(e, eye, true);

  group.position.set(x, 3, z);
  e.maxHp = e.hp;
  return e;
}

// ---------- Monsters (bosses) ----------
function bossStats(def, extra) {
  // Bosses get tougher with every AI teammate so a big team still has a real fight
  const hpScale = (mode === 'arena' ? 0.8 + wave * 0.1 : 1) * (1 + 0.15 * mates.length);
  const hp = def.hp * hpScale;
  return {
    boss: true, final: !!def.final, def, name: def.name, en: def.en, color: def.color, score: def.final ? 10000 : 3000,
    hp, maxHp: hp, orbDmg: 16 + difficulty * 1.5, barrageCd: 4, summonCd: 5, blinkCd: 0, ...extra,
  };
}

function makeGolem(def, x, z) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.body, emissive: new THREE.Color(def.color).multiplyScalar(0.08), roughness: 0.9, flatShading: true });
  const glow = glowMat(def.color);
  const rock = new THREE.DodecahedronGeometry(1, 0);
  const torso = part(rock, bodyMat, 0, 1.9, 0);
  torso.scale.set(1.1, 1, 0.8);
  const head = part(rock, bodyMat, 0, 3.05, 0.1);
  head.scale.setScalar(0.45);
  const eyes = [-0.16, 0.16].map((ex) => part(boxG(0.14, 0.08, 0.05), glow, ex, 3.1, 0.5));
  const core = part(new THREE.IcosahedronGeometry(0.28, 0), glow, 0, 2.0, 0.75);
  const cracks = [[-0.4, 2.3], [0.45, 1.6], [-0.2, 1.4]].map(([cx, cy]) => part(boxG(0.3, 0.05, 0.05), glow, cx, cy, 0.78));
  const e = baseEnemy(def.type, group, bodyMat, bossStats(def, {
    flying: false, radius: 2, centerY: 3, reach: 3.8, vReach: 4.5, speed: 3.8, meleeDmg: 38, wallDmg: 200,
    slam: true, slamDmg: 35, volley: 1, orbScale: 2.6, orbColor: def.color, orbSplash: 3.5,
  }));
  const arms = [-1, 1].map((s) => {
    const arm = new THREE.Group();
    arm.position.set(1.25 * s, 2.5, 0);
    const upper = part(rock, bodyMat, 0, -0.6, 0);
    upper.scale.set(0.45, 0.8, 0.45);
    const fist = part(rock, bodyMat, 0, -1.55, 0.1);
    fist.scale.setScalar(0.55);
    arm.add(upper, fist);
    tagHit(e, upper);
    tagHit(e, fist);
    return arm;
  });
  [e.armL, e.armR] = arms;
  const legs = [-0.5, 0.5].map((lx) => {
    const leg = part(rock, bodyMat, lx, 0.6, 0);
    leg.scale.set(0.45, 0.65, 0.45);
    tagHit(e, leg);
    return leg;
  });
  group.add(torso, head, core, ...eyes, ...cracks, ...arms, ...legs);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  tagHit(e, torso);
  tagHit(e, head, true);
  tagHit(e, core, true);
  group.scale.setScalar(1.6);
  group.position.set(x, 0, z);
  return e;
}

function makeSpider(def, x, z) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.body, emissive: new THREE.Color(def.color).multiplyScalar(0.06), roughness: 0.5, metalness: 0.2 });
  const glow = glowMat(def.color);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x111811, roughness: 0.6 });
  const abdomen = part(new THREE.SphereGeometry(1.1, 18, 14), bodyMat, 0, 1.4, -1.0);
  abdomen.scale.set(1, 0.85, 1.25);
  const stripe = part(boxG(0.25, 0.08, 1.8), glow, 0, 2.3, -1.0);
  const thorax = part(new THREE.SphereGeometry(0.7, 16, 12), bodyMat, 0, 1.15, 0.55);
  const eyes = [[-0.22, 1.35], [0.22, 1.35], [-0.12, 1.15], [0.12, 1.15]].map(([ex, ey]) => part(new THREE.SphereGeometry(0.09, 8, 8), glow, ex, ey, 1.2));
  const fangs = [-0.15, 0.15].map((fx) => {
    const f = part(new THREE.ConeGeometry(0.06, 0.35, 6), glow, fx, 0.85, 1.15);
    f.rotation.x = Math.PI;
    return f;
  });
  const e = baseEnemy('spider', group, bodyMat, bossStats(def, {
    flying: false, radius: 2.2, centerY: 1.7, reach: 3.2, vReach: 3, speed: 7.5, meleeDmg: 30, wallDmg: 150,
    leap: true, slamDmg: 28, legs: [], volley: 3, orbColor: def.color,
  }));
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Group();
      const zOff = 0.95 - i * 0.45;
      leg.position.set(0.45 * s, 1.15, zOff);
      const knee = new THREE.Vector3(1.2 * s, 0.9, (zOff - 0.3) * 0.9);
      const foot = new THREE.Vector3(2.1 * s, -1.15, (zOff - 0.3) * 1.6);
      leg.add(limb(new THREE.Vector3(), knee, 0.09, legMat), limb(knee, foot, 0.07, legMat));
      leg.userData.phase = i * 1.3 + (s > 0 ? Math.PI : 0);
      e.legs.push(leg);
      group.add(leg);
    }
  }
  group.add(abdomen, stripe, thorax, ...eyes, ...fangs);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  tagHit(e, abdomen);
  tagHit(e, thorax);
  for (const eye of eyes) tagHit(e, eye, true);
  group.scale.setScalar(1.4);
  group.position.set(x, 0, z);
  return e;
}

function makeEye(def, x, z) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.body, emissive: 0x1a0a22, roughness: 0.3 });
  const glow = glowMat(def.color);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.6, 28, 20), bodyMat);
  const iris = part(new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32), glow, 0, 0, 1.5, Math.PI / 2);
  const pupil = part(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 24), glowMat(0x080010), 0, 0, 1.56, Math.PI / 2);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.1, 8, 48), glow);
  ring.rotation.x = Math.PI / 2;
  const spikes = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sp = part(new THREE.ConeGeometry(0.15, 0.7, 6), glow, Math.cos(a) * 1.75, Math.sin(a) * 1.75, -0.2);
    sp.rotation.z = a - Math.PI / 2;
    spikes.push(sp);
  }
  const tentacles = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const top = new THREE.Vector3(Math.cos(a) * 0.8, -1.2, Math.sin(a) * 0.8 - 0.4);
    tentacles.push(limb(top, top.clone().add(new THREE.Vector3(Math.cos(a) * 0.6, -1.8, Math.sin(a) * 0.6)), 0.12, bodyMat));
  }
  const e = baseEnemy('eye', group, bodyMat, bossStats(def, {
    flying: true, homeY: 6.5, keepDist: 15, volley: 5, radius: 2.3, centerY: 0, speed: 5, orbColor: def.color,
    strafe: 1, strafeT: 3,
  }));
  e.ring = ring;
  group.add(ball, iris, pupil, ring, ...spikes, ...tentacles);
  ball.castShadow = true;
  tagHit(e, ball);
  tagHit(e, iris, true);
  tagHit(e, pupil, true);
  group.position.set(x, 6.5, z);
  return e;
}

function makeKing(def, x, z) {
  const e = makeWalker(x, z, 'brute');
  const bodyMat = e.flashMats[0];
  bodyMat.color.setHex(def.body);
  bodyMat.emissive.setHex(0x1a1430);
  bodyMat.userData.baseEmissive = bodyMat.emissive.clone();
  e.group.traverse((o) => { if (o.material?.isMeshBasicMaterial) o.material.color.setHex(def.color); });
  const gold = glowMat(def.color);
  const crown = new THREE.Group();
  crown.add(part(new THREE.CylinderGeometry(0.3, 0.32, 0.12, 16, 1, true), gold));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    crown.add(part(new THREE.ConeGeometry(0.06, 0.2, 6), gold, Math.cos(a) * 0.3, 0.14, Math.sin(a) * 0.3));
  }
  crown.position.y = 2.15;
  e.group.add(crown);
  e.group.scale.setScalar(2.6);
  Object.assign(e, bossStats(def, {
    type: 'king', radius: 1.4, centerY: 2.4, reach: 3.4, vReach: 4.5, speed: 4, meleeDmg: 40, wallDmg: 200,
    slam: true, slamDmg: 35, volley: 4, orbColor: def.color,
  }));
  return e;
}

function makeDragon(def, x, z) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.body, emissive: new THREE.Color(def.color).multiplyScalar(0.06), roughness: 0.55, metalness: 0.2, flatShading: true });
  const wingMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(def.body).multiplyScalar(0.7), emissive: new THREE.Color(def.color).multiplyScalar(0.08), roughness: 0.7, side: THREE.DoubleSide });
  const glow = glowMat(def.color);
  const body = part(new THREE.SphereGeometry(1, 16, 12), bodyMat);
  body.scale.set(1.1, 0.9, 2.2);
  const neck = limb(new THREE.Vector3(0, 0.3, 1.6), new THREE.Vector3(0, 1.3, 2.9), 0.45, bodyMat);
  const head = part(boxG(0.8, 0.6, 1.1), bodyMat, 0, 1.45, 3.35);
  const snout = part(boxG(0.55, 0.38, 0.8), bodyMat, 0, 1.3, 4.1);
  const mouth = part(boxG(0.45, 0.06, 0.6), glow, 0, 1.12, 4.05);
  const eyes = [-0.28, 0.28].map((ex) => part(new THREE.SphereGeometry(0.09, 8, 8), glow, ex, 1.6, 3.75));
  const horns = [-0.25, 0.25].map((hx) => part(new THREE.ConeGeometry(0.09, 0.7, 6), glow, hx, 1.95, 3.0, -0.9));
  const tail = [];
  let prev = new THREE.Vector3(0, -0.1, -1.9);
  for (let i = 0; i < 5; i++) {
    const next = new THREE.Vector3(0, -0.25 - i * 0.12, -2.8 - i * 0.95);
    tail.push(limb(prev, next, 0.42 - i * 0.07, bodyMat));
    prev = next;
  }
  const spike = part(new THREE.ConeGeometry(0.25, 0.8, 6), glow, 0, prev.y, prev.z - 0.3, -Math.PI / 2);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.3);
  for (const [px, py] of [[2.2, 1.4], [5.2, 0.9], [4.4, -0.6], [3.0, -0.4], [2.0, -1.3], [0, -1.0]]) shape.lineTo(px, py);
  const wingGeo = new THREE.ShapeGeometry(shape).rotateX(Math.PI / 2);
  const wings = [-1, 1].map((sx) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.8 * sx, 0.45, 0.6);
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.scale.x = sx;
    pivot.add(wing, limb(new THREE.Vector3(0, 0.02, 0.3), new THREE.Vector3(5.2 * sx, 0.02, 0.9), 0.08, glow));
    return pivot;
  });
  const legs = [[0.6, 1.0], [-0.6, 1.0], [0.7, -1.0], [-0.7, -1.0]].map(([lx, lz]) => limb(new THREE.Vector3(lx, -0.5, lz), new THREE.Vector3(lx * 1.15, -1.5, lz + 0.2), 0.16, bodyMat));
  const e = baseEnemy('dragon', group, bodyMat, bossStats(def, {
    flying: true, homeY: def.final ? 13 : 10, keepDist: 18, volley: def.final ? 5 : 3, radius: def.final ? 4.5 : 3, centerY: 0,
    speed: def.final ? 8 : 7, strafe: 1, strafeT: 3, orbColor: def.color, orbScale: 2.4, orbSplash: 3.5, dive: true, barrage: !!def.final,
  }));
  e.flashMats.push(wingMat);
  e.wings = wings;
  group.add(body, neck, head, snout, mouth, ...eyes, ...horns, ...tail, spike, ...wings, ...legs);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  tagHit(e, body);
  tagHit(e, neck);
  tagHit(e, head, true);
  tagHit(e, snout, true);
  for (const t of tail) tagHit(e, t);
  for (const w of wings) tagHit(e, w.children[0]);
  group.scale.setScalar(def.final ? 2 : 1.2);
  group.position.set(x, 10, z);
  return e;
}

function makeNecro(def, x, z) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.body, emissive: 0x120a1c, roughness: 0.8 });
  const bone = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.6 });
  const glow = glowMat(def.color);
  const robe = part(new THREE.ConeGeometry(0.95, 2.4, 12), bodyMat, 0, 1.2, 0);
  const chest = part(new THREE.SphereGeometry(0.5, 12, 10), bodyMat, 0, 2.25, 0);
  chest.scale.set(1.4, 0.8, 1);
  const hood = part(new THREE.ConeGeometry(0.48, 1.0, 12), bodyMat, 0, 2.95, -0.05);
  const skull = part(new THREE.SphereGeometry(0.3, 14, 12), bone, 0, 2.6, 0.12);
  const eyes = [-0.1, 0.1].map((ex) => part(new THREE.SphereGeometry(0.06, 8, 8), glow, ex, 2.64, 0.38));
  const staff = limb(new THREE.Vector3(0.8, 0.1, 0.3), new THREE.Vector3(0.8, 3.3, 0.3), 0.05, new THREE.MeshStandardMaterial({ color: 0x3a2a1a }));
  const orb = part(new THREE.IcosahedronGeometry(0.25, 1), glow, 0.8, 3.5, 0.3);
  const arms = [
    limb(new THREE.Vector3(0.45, 2.35, 0), new THREE.Vector3(0.8, 2.1, 0.3), 0.12, bodyMat),
    limb(new THREE.Vector3(-0.45, 2.35, 0), new THREE.Vector3(-0.7, 1.7, 0.3), 0.12, bodyMat),
  ];
  const sigil = new THREE.Mesh(
    new THREE.RingGeometry(1.3, 1.5, 32),
    new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }),
  );
  sigil.rotation.x = -Math.PI / 2;
  sigil.position.y = -0.68;
  const e = baseEnemy('necro', group, bodyMat, bossStats(def, {
    flying: true, homeY: 1, keepDist: 16, volley: 3, radius: 1.3, centerY: 2.6, speed: 5.5,
    strafe: 1, strafeT: 3, orbColor: def.color, summoner: true, blinker: true,
  }));
  e.ring = sigil;
  group.add(robe, chest, hood, skull, ...eyes, staff, orb, ...arms, sigil);
  group.traverse((o) => { if (o.isMesh && o !== sigil) o.castShadow = true; });
  for (const m of [robe, chest, hood, staff, ...arms]) tagHit(e, m);
  tagHit(e, skull, true);
  tagHit(e, orb, true);
  group.scale.setScalar(1.4);
  group.position.set(x, 1, z);
  return e;
}

function makeTitan(def, x, z) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.body, emissive: 0x0a0a10, roughness: 0.45, metalness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23252c, roughness: 0.6, metalness: 0.5 });
  const glow = glowMat(def.color);
  const legs = [-0.75, 0.75].map((lx) => part(boxG(0.7, 2.2, 0.9), dark, lx, 1.1, 0));
  const feet = [-0.75, 0.75].map((lx) => part(boxG(0.9, 0.3, 1.4), bodyMat, lx, 0.15, 0.2));
  const hips = part(boxG(2, 0.6, 1.2), dark, 0, 2.4, 0);
  const torso = part(boxG(2.4, 1.8, 1.6), bodyMat, 0, 3.5, 0);
  const cockpit = part(boxG(1, 0.35, 0.1), glow, 0, 3.8, 0.82);
  const head = part(boxG(0.8, 0.5, 0.8), bodyMat, 0, 4.65, 0.1);
  const visor = part(boxG(0.6, 0.12, 0.05), glow, 0, 4.7, 0.52);
  const pods = [-1, 1].map((sx) => {
    const pod = part(boxG(0.8, 0.8, 1.4), dark, 1.65 * sx, 4.5, 0);
    for (let i = 0; i < 4; i++) pod.add(part(boxG(0.14, 0.14, 0.05), glow, ((i % 2) - 0.5) * 0.35, (Math.floor(i / 2) - 0.5) * 0.35, 0.71));
    return pod;
  });
  const arms = [-1, 1].map((sx) => {
    const arm = new THREE.Group();
    arm.position.set(1.5 * sx, 3.9, 0);
    arm.add(part(boxG(0.5, 1.6, 0.5), bodyMat, 0, -0.8, 0), part(boxG(0.4, 0.4, 1.2), dark, 0, -1.6, 0.4), part(boxG(0.12, 0.12, 0.05), glow, 0, -1.6, 1.02));
    return arm;
  });
  const e = baseEnemy('titan', group, bodyMat, bossStats(def, {
    flying: false, radius: 2.4, centerY: 5.5, reach: 4.6, vReach: 8, speed: 2.8, meleeDmg: 40, wallDmg: 300,
    slam: true, slamDmg: 35, volley: 2, orbColor: def.color, barrage: true,
  }));
  [e.armL, e.armR] = arms;
  group.add(...legs, ...feet, hips, torso, cockpit, head, visor, ...pods, ...arms);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  for (const m of [...legs, ...feet, hips, torso, ...pods]) tagHit(e, m);
  for (const a of arms) tagHit(e, a.children[0]);
  tagHit(e, head, true);
  tagHit(e, cockpit, true);
  group.scale.setScalar(1.7);
  group.position.set(x, 0, z);
  return e;
}

// Giant golden emperor: halo, red cape, laurel crown and a flaming sword
function makeEmperor(def, x, z) {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: def.body, metalness: 1, roughness: 0.28, envMap: armorEnv(), envMapIntensity: 1.2 });
  const goldDark = new THREE.MeshStandardMaterial({ color: 0x8a6420, metalness: 1, roughness: 0.4, envMap: armorEnv() });
  const red = new THREE.MeshStandardMaterial({ color: 0x8a1010, roughness: 0.85, side: THREE.DoubleSide });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe8c4a0, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.9 });
  const light = glowMat(0xfff2c0);
  const e = baseEnemy('emperor', group, gold, bossStats(def, {
    flying: false, radius: 2.2, centerY: 3.8, reach: 5.5, vReach: 8, speed: 4.6, meleeDmg: 55, wallDmg: 400,
    slam: true, slamDmg: 45, volley: 5, orbColor: 0xffe27a, barrage: true, leap: true, legs: [],
  }));
  for (const [sx, phase] of [[-1, 0], [1, Math.PI]]) {
    const leg = new THREE.Group();
    leg.position.set(0.22 * sx, 1.0, 0);
    const thigh = capsule(0.16, 0.35, gold, 0, -0.25, 0);
    const knee = blob(0.11, goldDark, 0, -0.5, 0.1, 1, 1, 0.7);
    const shin = capsule(0.14, 0.3, gold, 0, -0.68, 0);
    const boot = blob(0.15, goldDark, 0, -0.95, 0.08, 1, 0.6, 1.5);
    leg.add(thigh, knee, shin, boot);
    leg.userData.phase = phase;
    e.legs.push(leg);
    for (const m of [thigh, shin]) tagHit(e, m);
    group.add(leg);
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const tasset = part(boxG(0.3, 0.38, 0.04), gold, Math.sin(a) * 0.32, 0.82, Math.cos(a) * 0.26);
    tasset.rotation.y = a;
    tasset.rotation.x = 0.15;
    group.add(tasset);
  }
  const chest = blob(0.42, gold, 0, 1.48, 0, 1.25, 1, 0.82);
  const belly = part(boxG(0.6, 0.35, 0.42), goldDark, 0, 1.1, 0);
  const belt = part(boxG(0.64, 0.1, 0.46), red, 0, 0.95, 0);
  const aquila = [-1, 1].map((sx) => {
    const wing = part(boxG(0.28, 0.06, 0.02), light, 0.16 * sx, 1.55, 0.35);
    wing.rotation.z = 0.35 * sx;
    return wing;
  });
  const gem = blob(0.06, glowMat(0xff3030), 0, 1.5, 0.36);
  const cape = part(boxG(1.1, 1.8, 0.03), red, 0, 1.0, -0.4);
  cape.rotation.x = 0.12;
  e.cape = cape;
  const collar = part(new THREE.TorusGeometry(0.2, 0.06, 8, 20), gold, 0, 1.88, 0, Math.PI / 2);
  const pads = [-1, 1].map((sx) => {
    const pad = part(new THREE.SphereGeometry(0.32, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0.58 * sx, 1.78, 0);
    pad.add(part(new THREE.TorusGeometry(0.33, 0.035, 6, 24), goldDark, 0, 0, 0, Math.PI / 2));
    tagHit(e, pad);
    return pad;
  });
  const head = new THREE.Group();
  head.position.set(0, 2.08, 0.03);
  const face = blob(0.15, skin, 0, 0, 0, 0.9, 1.1, 0.95);
  const hair = part(new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat, 0, 0.02, -0.01);
  const hairBack = part(boxG(0.28, 0.32, 0.08), hairMat, 0, -0.08, -0.12);
  const eyes = [-0.05, 0.05].map((ex) => blob(0.018, glowMat(0xffe27a), ex, 0.02, 0.14));
  const laurel = part(new THREE.TorusGeometry(0.16, 0.022, 6, 24), glowMat(0x9fd060), 0, 0.07, 0, Math.PI / 2 - 0.15);
  head.add(face, hair, hairBack, ...eyes, laurel);
  tagHit(e, face, true);
  // Halo with rays behind the head
  const halo = new THREE.Group();
  halo.position.set(0, 2.1, -0.35);
  halo.add(new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 8, 48), light));
  for (let k = 0; k < 12; k++) {
    const ray = part(boxG(0.025, 0.28, 0.01), light, 0, 0, 0);
    const a = (k / 12) * Math.PI * 2;
    ray.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0);
    ray.rotation.z = a - Math.PI / 2;
    halo.add(ray);
  }
  e.halo = halo;
  const arms = [-1, 1].map((sx) => {
    const a = new THREE.Group();
    a.position.set(0.62 * sx, 1.68, 0);
    const upper = capsule(0.14, 0.25, gold, 0, -0.2, 0);
    const fore = capsule(0.13, 0.22, gold, 0, -0.5, 0);
    const fist = blob(0.13, goldDark, 0, -0.72, 0);
    a.add(upper, fore, fist);
    for (const m of [upper, fore]) tagHit(e, m);
    return a;
  });
  // Flaming sword in the right hand
  const sword = new THREE.Group();
  sword.position.set(0, -0.75, 0);
  sword.add(
    part(boxG(0.3, 0.05, 0.08), goldDark, 0, -0.08, 0),
    part(boxG(0.08, 1.6, 0.025), light, 0, -0.95, 0),
    part(boxG(0.18, 1.7, 0.1), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }), 0, -0.95, 0),
  );
  arms[1].add(sword);
  [e.armL, e.armR] = arms;
  group.add(chest, belly, belt, ...aquila, gem, cape, collar, ...pads, head, halo, ...arms);
  group.traverse((o) => { if (o.isMesh && o.material !== light) o.castShadow = true; });
  for (const m of [chest, belly, cape]) tagHit(e, m);
  group.scale.setScalar(2.6);
  group.position.set(x, 0, z);
  return e;
}

function makeMonster(def, x, z) {
  const makers = { golem: makeGolem, spider: makeSpider, eye: makeEye, king: makeKing, dragon: makeDragon, necro: makeNecro, titan: makeTitan, emperor: makeEmperor };
  return makers[def.type](def, x, z);
}

function ringSpawnPoint() {
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 26 + Math.random() * 10;
    const p = { x: Math.cos(a) * r, z: Math.sin(a) * r };
    pushOut(p, 1, terrainY(p.x, p.z));
    if (Math.hypot(p.x - player.pos.x, p.z - player.pos.z) > 15) return p;
  }
  return { x: 30, z: 30 };
}

// type: grunt | brute | drone | boss; opts: { x, z, def, camp, aggro }
function spawnEnemy(type, opts = {}) {
  const p = opts.x !== undefined ? { x: opts.x, z: opts.z } : ringSpawnPoint();
  pushOut(p, 1, terrainY(p.x, p.z));
  let e;
  if (type === 'boss') e = makeMonster(opts.def, p.x, p.z);
  else if (type === 'drone') e = makeDrone(p.x, p.z);
  else e = makeWalker(p.x, p.z, type);
  e.camp = opts.camp ?? null;
  e.aggro = opts.aggro ?? true;
  e.summonedBy = opts.summonedBy ?? null;
  e.planet = builtLevel === 'space' ? planetAt(p.x, p.z) : null;
  e.group.position.y = terrainY(p.x, p.z) + (e.flying ? e.homeY : 0);
  if (opts.skeleton) {
    const m = e.flashMats[0];
    m.color.setHex(0xd8d2c0);
    m.emissive.setHex(0x1a1a14);
    m.userData.baseEmissive = m.emissive.clone();
    e.group.traverse((o) => { if (o.material?.isMeshBasicMaterial) o.material.color.setHex(0x6dffb0); });
    e.color = 0xd8d2c0;
    e.score = 50;
  }
  if (e.boss) {
    e.beacon = makeBeacon(e.color, 70);
    e.beacon.position.set(p.x, terrainY(p.x, p.z) + 35, p.z);
    scene.add(e.beacon);
  }
  scene.add(e.group);
  enemies.push(e);
  if (opts.x === undefined || opts.aggro) {
    spawnBeam(p.x, p.z, e.color);
    sfx.spawn();
  }
  return e;
}

function enemyCenter(e) {
  const c = e.group.position.clone();
  c.y += e.centerY;
  return c;
}

function alertCamp(e) {
  if (!e.aggro && e.boss) {
    showToast(`👹 ${e.name} 发现你了！${e.en} SPOTTED YOU!`, 2000);
    sfx.roar(camera.position.distanceTo(e.group.position));
  }
  e.aggro = true;
  if (e.camp === null) return;
  for (const o of enemies) if (o.camp === e.camp && !o.aggro) alertCamp(o);
}

const rage = (e) => (e.enraged ? 0.6 : 1);

// At half health a monster gets angry: faster, more shots, and calls for backup
function enrage(e) {
  e.enraged = true;
  e.speed *= 1.35;
  if (e.volley) e.volley += 2;
  for (const m of e.flashMats) {
    m.userData.baseEmissive = new THREE.Color(0x5a0c0c);
    m.emissive.copy(m.userData.baseEmissive);
  }
  showToast(`😡 ${e.name} 愤怒了！${e.en} IS ENRAGED!`, 2400);
  sfx.roar(camera.position.distanceTo(e.group.position));
  shockwave(enemyCenter(e), 0xff2020, 8);
  const g = e.group.position;
  for (let i = 0; i < 3; i++) {
    const type = e.flying && !e.summoner ? 'drone' : i === 0 && difficulty >= 4 ? 'brute' : 'grunt';
    spawnEnemy(type, { x: g.x + rand(-7, 7), z: g.z + rand(-7, 7), aggro: true });
  }
}

function damageEnemy(e, amount, head, point) {
  if (!enemies.includes(e)) return false;
  e.hp -= amount;
  e.flash = 1;
  if (!e.aggro) alertCamp(e);
  if (e.boss && !e.enraged && e.hp > 0 && e.hp < e.maxHp * 0.5) enrage(e);
  if (point) burst(point, head ? 0xffffff : e.color, head ? 10 : 6, 4, 0.35);
  if (e.hp <= 0) {
    killEnemy(e, head);
    return true;
  }
  return false;
}

function killEnemy(e, headshot) {
  const idx = enemies.indexOf(e);
  if (idx < 0) return;
  enemies.splice(idx, 1);
  const pos = enemyCenter(e);
  burst(pos, e.color, e.boss ? 80 : e.type === 'brute' ? 45 : 28, e.boss ? 14 : 8, e.boss ? 1.4 : 0.9);
  burst(pos, 0xffffff, 10, 5, 0.4);
  shatter(e.group, pos);
  if (e.beacon) disposeGroup(e.beacon);
  addScore(e.score + (headshot ? 50 : 0));
  player.bricks += e.boss ? 20 : 2;
  updateAmmoUI();
  const x = e.group.position.x;
  const z = e.group.position.z;
  if (e.boss) {
    monstersDefeated++;
    if (openWorld()) {
      difficulty = 2 + monstersDefeated;
      if (!finalSpawned && monstersDefeated === campCount) finalT = 10;
    }
    shockwave(pos, e.color, 12);
    boomLight.color.setHex(e.color);
    boomLight.position.copy(pos);
    boomLight.intensity = 120;
    player.shake = 0.5;
    sfx.bossDie();
    showBanner(`${e.name} 被打败了！`, `${e.en} DEFEATED · 快去拿传说宝箱 GRAB THE LEGENDARY CHEST`, 3500);
    spawnLoot('legend', x, z);
    for (let i = 0; i < 3; i++) spawnPickup(x + rand(-3, 3), z + rand(-3, 3), 'power');
  } else {
    sfx.kill();
    const lowHp = player.health < player.maxHealth * 0.4;
    const roll = Math.random();
    if (roll < (lowHp ? 0.3 : 0.12)) spawnPickup(x, z, 'health');
    else if (roll < (lowHp ? 0.4 : 0.2)) spawnPickup(x, z, 'armor');
    else if (roll < (lowHp ? 0.5 : 0.3)) spawnPickup(x, z, 'power');
  }
  updateEnemyCount();
}

const orbGeo = new THREE.SphereGeometry(0.18, 10, 10);
const haloGeo = new THREE.SphereGeometry(0.35, 10, 10);

function targetHead(t) {
  if (t === 'player') return camera.position.clone().setY(camera.position.y - 0.3);
  return t.group.position.clone().setY(t.group.position.y + 1.3);
}

function fireOrb(e, t, angle = 0) {
  const from = e.group.position.clone();
  from.y += e.flying ? e.centerY : e.centerY * 1.4;
  const vel = targetHead(t).sub(from).normalize();
  vel.applyAxisAngle(UP, angle).multiplyScalar(15 + difficulty * 0.5);
  const mesh = new THREE.Mesh(
    orbGeo,
    new THREE.MeshBasicMaterial({ color: e.orbColor ? new THREE.Color(e.orbColor).lerp(WHITE, 0.5) : 0xffb347, transparent: true, blending: THREE.AdditiveBlending }),
  );
  mesh.add(new THREE.Mesh(
    haloGeo,
    new THREE.MeshBasicMaterial({ color: e.boss ? e.color : 0xff6a00, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
  ));
  mesh.scale.setScalar(e.orbScale || (e.boss ? 1.7 : 1));
  mesh.position.copy(from).addScaledVector(vel, 0.05);
  scene.add(mesh);
  orbs.push({ mesh, vel, life: 4, dmg: e.orbDmg, splash: e.orbSplash || 0, color: e.orbColor || 0xffa630 });
  sfx.enemyShot(from.distanceTo(camera.position));
}

function fireVolley(e, t) {
  const n = e.volley;
  for (let i = 0; i < n; i++) fireOrb(e, t, n > 1 ? (i - (n - 1) / 2) * 0.12 : 0);
}

function removeOrb(i) {
  const o = orbs[i];
  o.mesh.children[0].material.dispose();
  disposeMesh(o.mesh);
  orbs.splice(i, 1);
}

// Big area attack around a monster
function slam(e, radius, dmg) {
  const pos = e.group.position.clone().setY(terrainY(e.group.position.x, e.group.position.z) + 0.4);
  shockwave(pos, e.color, radius);
  burst(pos, e.color, 30, 9, 0.8);
  boomLight.color.setHex(e.color);
  boomLight.position.copy(pos);
  boomLight.intensity = 60;
  const d = dist2d(player.pos, pos);
  sfx.explosion(d);
  player.shake = Math.min(0.6, player.shake + Math.max(0, 1 - d / 20) * 0.5);
  if (d < radius && player.pos.y - pos.y < 2.5) damagePlayer(dmg);
  for (const m of mates) if (m.downT <= 0 && dist2d(m.group.position, pos) < radius) damageMate(m, dmg);
}

function spawnPickup(x, z, kind) {
  const group = new THREE.Group();
  const color = { armor: 0x4db8ff, health: 0x3dff9a, power: 0xffd23f }[kind];
  const glow = new THREE.MeshBasicMaterial({ color });
  if (kind === 'armor') {
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.08, 6), glow);
    shield.rotation.x = Math.PI / 2;
    group.add(shield);
  } else if (kind === 'power') {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), glow);
    const star2 = star.clone();
    star2.rotation.set(Math.PI / 4, 0, Math.PI / 4);
    group.add(star, star2);
  } else {
    const bar = new THREE.BoxGeometry(0.5, 0.16, 0.16);
    const b = new THREE.Mesh(bar, glow);
    b.rotation.z = Math.PI / 2;
    group.add(new THREE.Mesh(bar, glow), b);
  }
  group.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.6, 0.6),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false }),
  ));
  const p = { x, z };
  pushOut(p, 0.5, terrainY(x, z));
  const baseY = terrainY(p.x, p.z);
  group.position.set(p.x, baseY + 0.8, p.z);
  scene.add(group);
  pickups.push({ group, kind, baseY, t: Math.random() * 5, life: kind === 'power' && openWorld() ? Infinity : 25 });
}

// Supply crates (normal reward) and legendary chests (monster loot)
function spawnLoot(kind, x, z) {
  const legend = kind === 'legend';
  const color = legend ? 0xffd23f : 0x3d8bff;
  const group = new THREE.Group();
  const boxMat = new THREE.MeshStandardMaterial({ color: legend ? 0x6a4a10 : 0x1a2c55, emissive: new THREE.Color(color).multiplyScalar(0.15), roughness: 0.5 });
  const chest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), boxMat);
  chest.position.y = 0.4;
  chest.castShadow = true;
  chest.add(new THREE.LineSegments(new THREE.EdgesGeometry(chest.geometry), new THREE.LineBasicMaterial({ color })));
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 0.85), glowMat(color));
  band.position.y = 0.55;
  const icon = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), glowMat(color));
  icon.position.y = 1.4;
  const beacon = makeBeacon(color, legend ? 80 : 30);
  if (!legend) beacon.material.opacity = 0.2;
  group.add(chest, band, icon, beacon);
  const p = { x, z };
  pushOut(p, 1, terrainY(p.x, p.z));
  group.position.set(p.x, terrainY(p.x, p.z), p.z);
  scene.add(group);
  loot.push({ group, kind, icon, t: Math.random() * 5 });
}

// ---------- AI teammates ----------
const SKIN_TONES = ['#4f6b2a', '#5d7a30', '#45602a', '#56702e', '#3f5a26', '#62773a']; // gritty ork greens
const PANTS_COLORS = [0x3a3226, 0x2e2e2a, 0x4a3c2a, 0x33302a];
const orkSkinCache = new Map();

// Mottled, scarred green skin (shared per tone)
function orkSkin(base) {
  if (orkSkinCache.has(base)) return orkSkinCache.get(base);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(20,35,10,0.18)' : 'rgba(160,190,90,0.10)';
    g.beginPath();
    g.arc(Math.random() * 128, Math.random() * 128, rand(1, 6), 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(60,20,15,0.35)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-14, 14), y + rand(6, 16)); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 1.5, roughness: 0.8 });
  orkSkinCache.set(base, mat);
  return mat;
}

// Soft sky reflections so metal armor shines like real metal (used only on armor)
let armorEnvTex = null;
function armorEnv() {
  if (armorEnvTex) return armorEnvTex;
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(
    new THREE.SphereGeometry(50, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec3 vDir;
        void main() {
          float h = vDir.y;
          vec3 sky = mix(vec3(0.95, 0.95, 0.92), vec3(0.45, 0.6, 0.9), clamp(h, 0.0, 1.0));
          vec3 ground = mix(vec3(0.5, 0.48, 0.42), vec3(0.18, 0.16, 0.13), clamp(-h * 3.0, 0.0, 1.0));
          vec3 col = h > 0.0 ? sky : ground;
          col += vec3(4.0, 3.8, 3.4) * pow(max(dot(vDir, normalize(vec3(0.4, 0.7, 0.3))), 0.0), 60.0);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  ));
  const pm = new THREE.PMREMGenerator(renderer);
  armorEnvTex = pm.fromScene(envScene, 0.02).texture;
  pm.dispose();
  return armorEnvTex;
}

// Worn metal: chipped paint (or bare steel), scratches, rust streaks, grime and dents
const wornCache = new Map();
function wornMetal(paint) {
  const key = paint ?? 'steel';
  if (wornCache.has(key)) return wornCache.get(key);
  const S = 256;
  const layers = ['color', 'rough', 'metal', 'bump'].map(() => {
    const c = document.createElement('canvas');
    c.width = c.height = S;
    return c;
  });
  const [cc, rc, mc, bc] = layers.map((c) => c.getContext('2d'));
  const fill = (g, style) => { g.fillStyle = style; g.fillRect(0, 0, S, S); };
  // Faded, dirty paint rather than bright toy colors
  fill(cc, paint !== null ? `#${new THREE.Color(paint).lerp(new THREE.Color(0x6a6658), 0.35).multiplyScalar(0.72).getHexString()}` : '#6f6d69');
  fill(rc, paint !== null ? '#8a8a8a' : '#6a6a6a');
  fill(mc, paint !== null ? '#262626' : '#e6e6e6');
  fill(bc, '#808080');
  // fine speckle and brushed streaks
  for (let i = 0; i < 2500; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    cc.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
    cc.fillRect(x, y, 2, 2);
    rc.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
    rc.fillRect(x, y, 2, 2);
  }
  if (paint === null) {
    for (let i = 0; i < 90; i++) {
      const y = Math.random() * S;
      cc.strokeStyle = 'rgba(255,255,255,0.05)';
      cc.beginPath(); cc.moveTo(0, y); cc.lineTo(S, y + rand(-3, 3)); cc.stroke();
    }
  }
  // dents
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = rand(6, 18);
    const gr = bc.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(0,0,0,0.5)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    bc.fillStyle = gr;
    bc.beginPath(); bc.arc(x, y, r, 0, Math.PI * 2); bc.fill();
  }
  // paint chipped down to bare metal
  const chips = [];
  if (paint !== null) {
    for (let i = 0; i < 45; i++) {
      const x = Math.random() * S;
      const y = Math.random() * S;
      const r = rand(2, 10);
      const pts = Array.from({ length: 8 }, (_, k) => {
        const a = (k / 8) * Math.PI * 2;
        const rr = r * rand(0.5, 1.2);
        return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
      });
      const shape = (g, style) => {
        g.fillStyle = style;
        g.beginPath();
        pts.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py)));
        g.closePath();
        g.fill();
      };
      shape(cc, '#8f8c86');
      shape(rc, '#4a4a4a');
      shape(mc, '#e0e0e0');
      shape(bc, '#686868');
      chips.push([x, y]);
    }
  }
  // scratches
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const a = Math.random() * Math.PI;
    const l = rand(8, 50);
    for (const [g, style] of [[cc, 'rgba(210,210,205,0.45)'], [mc, 'rgba(255,255,255,0.6)'], [bc, 'rgba(0,0,0,0.35)']]) {
      g.strokeStyle = style;
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  }
  // rust patches and streaks running down
  const rustSpots = chips.length ? chips.slice(0, 14) : Array.from({ length: 16 }, () => [Math.random() * S, Math.random() * S]);
  for (const [x, y] of rustSpots) {
    const r = rand(4, 12);
    const gr = cc.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(120,58,20,0.85)');
    gr.addColorStop(1, 'rgba(120,58,20,0)');
    cc.fillStyle = gr;
    cc.beginPath(); cc.arc(x, y, r, 0, Math.PI * 2); cc.fill();
    const sg = cc.createLinearGradient(x, y, x, y + rand(20, 60));
    sg.addColorStop(0, 'rgba(110,55,20,0.4)');
    sg.addColorStop(1, 'rgba(110,55,20,0)');
    cc.fillStyle = sg;
    cc.fillRect(x - 1.5, y, 3, 60);
    rc.fillStyle = '#e8e8e8';
    rc.beginPath(); rc.arc(x, y, r * 0.7, 0, Math.PI * 2); rc.fill();
    mc.fillStyle = '#151515';
    mc.beginPath(); mc.arc(x, y, r * 0.7, 0, Math.PI * 2); mc.fill();
  }
  // grime collects toward the bottom
  const grime = cc.createLinearGradient(0, S * 0.5, 0, S);
  grime.addColorStop(0, 'rgba(30,25,15,0)');
  grime.addColorStop(1, 'rgba(30,25,15,0.35)');
  cc.fillStyle = grime;
  cc.fillRect(0, 0, S, S);

  const [map, roughnessMap, metalnessMap, bumpMap] = layers.map((c) => new THREE.CanvasTexture(c));
  map.colorSpace = THREE.SRGBColorSpace;
  const tex = { map, roughnessMap, metalnessMap, bumpMap };
  wornCache.set(key, tex);
  return tex;
}

function armorMat(paint) {
  return new THREE.MeshStandardMaterial({
    ...wornMetal(paint), bumpScale: 2.5, roughness: 1, metalness: 1,
    envMap: armorEnv(), envMapIntensity: 1, side: THREE.DoubleSide,
  });
}

// A curved plate wrapped around the front of the body (arc in radians, centered on +z)
function curvedPlate(r, h, arc, mat) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, h, 22, 1, true, -arc / 2, arc), mat);
}
// A metal rim along that curve
function rimArc(r, arc, mat) {
  const g = new THREE.TorusGeometry(r, 0.022, 6, 28, arc).rotateX(Math.PI / 2).rotateY(arc / 2 - Math.PI / 2);
  return new THREE.Mesh(g, mat);
}

const blob = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const m = part(new THREE.SphereGeometry(r, 16, 12), mat, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
};
const capsule = (r, len, mat, x, y, z) => part(new THREE.CapsuleGeometry(r, len, 4, 10), mat, x, y, z);

function makeMate(i, warboss = false) {
  const color = warboss ? 0xffd23f : MATE_COLORS[i % MATE_COLORS.length];
  const name = warboss ? 'Ghazghkull' : MATE_NAMES[i % MATE_NAMES.length];
  const group = new THREE.Group();
  const skin = orkSkin(warboss ? '#3f5a26' : SKIN_TONES[i % SKIN_TONES.length]);
  const bodyMat = armorMat(warboss ? 0x2b2b2b : color);   // painted, chipped armor in the team color
  const iron = armorMat(null);       // bare, scratched steel
  const rust = new THREE.MeshStandardMaterial({ color: 0x6a3a1e, roughness: 0.9 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.9 });
  const cloth = new THREE.MeshStandardMaterial({ color: PANTS_COLORS[i % PANTS_COLORS.length], roughness: 0.95 });
  const bone = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.5, metalness: 0.4 });

  // Short, thick, slightly bent legs with heavy boots
  const legs = [-0.2, 0.2].map((lx) => {
    const leg = new THREE.Group();
    leg.position.set(lx, 0.82, 0);
    const thigh = capsule(0.15, 0.28, cloth, 0, -0.2, 0.04);
    thigh.rotation.x = -0.2;
    const shin = capsule(0.13, 0.26, cloth, 0, -0.52, 0.02);
    const boot = blob(0.16, leather, 0, -0.76, 0.08, 1, 0.6, 1.5);
    const kneePad = blob(0.1, iron, 0, -0.38, 0.13, 1, 1, 0.6);
    leg.add(thigh, shin, boot, kneePad);
    return leg;
  });

  // Hulking hunched torso, leaning forward
  const torso = new THREE.Group();
  torso.position.set(0, 1.18, 0);
  torso.rotation.x = 0.28;
  torso.add(
    blob(0.4, skin, 0, 0.25, 0, 1.25, 1, 0.85),          // chest
    blob(0.33, skin, 0, -0.12, 0.05, 1.1, 0.9, 0.9),     // gut
    blob(0.3, skin, 0, 0.5, -0.15, 1.5, 0.7, 0.9),       // huge back/neck muscles
    part(boxG(0.7, 0.12, 0.6), leather, 0, -0.32, 0.02),  // belt
  );
  // Curved breastplate with steel rims and a row of rivets
  const breast = curvedPlate(0.47, 0.46, 2.1, bodyMat);
  breast.position.set(0, 0.27, 0);
  breast.scale.set(1.05, 1, 0.86);
  torso.add(breast);
  for (const ry of [0.5, 0.04]) {
    const rim = rimArc(0.47, 2.1, iron);
    rim.position.set(0, ry, 0);
    rim.scale.set(1.05, 1, 0.86);
    torso.add(rim);
  }
  for (let k = 0; k < 7; k++) {
    const a = Math.PI / 2 + (k - 3) * 0.28;
    torso.add(part(new THREE.SphereGeometry(0.022, 6, 4), iron, Math.cos(a) * 0.47 * 1.05, 0.44, Math.sin(a) * 0.47 * 0.86));
  }
  // Overlapping belly plates
  for (const [py, mat] of [[-0.1, iron], [-0.21, bodyMat]]) {
    const band = curvedPlate(0.42, 0.13, 1.8, mat);
    band.position.set(0, py, 0.03);
    band.scale.set(1.05, 1, 0.95);
    torso.add(band);
  }
  torso.add(blob(0.07, bone, 0, -0.32, 0.33, 1, 1, 0.7));   // skull buckle
  const tabard = part(boxG(0.3, 0.42, 0.03), bodyMat, 0, -0.55, 0.3);
  tabard.rotation.x = -0.2;
  torso.add(tabard);

  // Head sits low and forward between the shoulders
  const head = new THREE.Group();
  head.position.set(0, 1.78, 0.32);
  head.add(
    blob(0.17, skin, 0, 0.04, -0.02, 1.1, 0.85, 1.05),     // cranium
    blob(0.2, skin, 0, -0.1, 0.07, 1.15, 0.6, 1.0),        // massive underbite jaw
    blob(0.12, skin, 0, 0.07, 0.11, 1.6, 0.45, 0.8),       // heavy brow ridge
    blob(0.05, skin, 0, -0.01, 0.19, 1.3, 0.8, 0.9),       // flat nose
  );
  for (const ex of [-0.065, 0.065]) head.add(blob(0.022, glowMat(0xff3a1a), ex, 0.025, 0.165));
  for (let t = 0; t < 6; t++) {                            // jagged lower teeth
    const tooth = part(new THREE.ConeGeometry(0.014, 0.05, 5), bone, -0.1 + t * 0.04, -0.04, 0.22);
    tooth.rotation.x = -0.2;
    head.add(tooth);
  }
  for (const sx of [-1, 1]) {
    const tusk = part(new THREE.ConeGeometry(0.03, 0.14, 6), bone, 0.12 * sx, -0.02, 0.18);
    tusk.rotation.set(-0.3, 0, -0.35 * sx);
    const ear = part(new THREE.ConeGeometry(0.045, 0.2, 5), skin, 0.18 * sx, 0.03, -0.06);
    ear.rotation.set(0.4, 0, -1.3 * sx);
    head.add(tusk, ear);
  }
  if (warboss || i % 2 === 0) {
    // Horned iron helmet
    const helm = part(new THREE.SphereGeometry(0.19, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), iron, 0, 0.06, -0.03);
    helm.scale.set(1.12, 1.05, 1.12);
    head.add(helm, part(new THREE.TorusGeometry(0.205, 0.02, 6, 28), iron, 0, 0.07, -0.03, Math.PI / 2), part(boxG(0.035, 0.12, 0.03), iron, 0, 0.04, 0.19));
    for (const sx of [-1, 1]) {
      const horn = part(new THREE.ConeGeometry(0.04, 0.24, 8), bone, 0.15 * sx, 0.16, -0.02);
      horn.rotation.z = -0.7 * sx;
      head.add(horn);
    }
  } else {
    head.add(part(boxG(0.05, 0.08, 0.28), dark, 0, 0.19, -0.03)); // topknot
  }

  // Massive arms: shoulder pads, bulging biceps, bracers, big fists
  const arm = (sx) => {
    const a = new THREE.Group();
    a.position.set(0.56 * sx, 1.52, 0.1);
    const pad = part(new THREE.SphereGeometry(sx < 0 ? 0.25 : 0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), sx < 0 ? bodyMat : iron, 0, 0.05, 0);
    pad.scale.set(1.1, 0.9, 1.1);
    const padR = sx < 0 ? 0.25 : 0.2;
    const padRim = part(new THREE.TorusGeometry(padR * 1.1, 0.025, 6, 24), iron, 0, 0.05, 0, Math.PI / 2);
    a.add(padRim);
    for (let k = 0; k < 4; k++) {
      const ang = (k / 4) * Math.PI * 2 + 0.4;
      a.add(part(new THREE.SphereGeometry(0.02, 6, 4), iron, Math.cos(ang) * padR * 0.8, 0.05 + padR * 0.5, Math.sin(ang) * padR * 0.8));
    }
    a.add(
      pad,
      capsule(0.13, 0.2, skin, 0, -0.18, 0),
      blob(0.13, skin, 0, -0.16, 0.06, 0.9, 1.1, 0.8),    // bicep
      capsule(0.11, 0.2, skin, 0, -0.47, 0),
      part(new THREE.CylinderGeometry(0.125, 0.125, 0.14, 10), rust, 0, -0.52, 0),
      blob(0.12, skin, 0, -0.68, 0, 1, 0.9, 1.1),          // fist
    );
    if (sx < 0) for (let k = 0; k < 3; k++) a.add(part(new THREE.ConeGeometry(0.03, 0.14, 6), bone, -0.08 + k * 0.08, 0.27, 0));
    return a;
  };
  const armL = arm(-1);
  const armR = arm(1);
  armR.rotation.x = -1.4; // aiming forward
  armL.rotation.set(-1.15, 0, 0.5);

  // Chunky twin-barrel "shoota" with a drum magazine
  const gun = new THREE.Group();
  gun.add(
    part(boxG(0.13, 0.16, 0.42), iron, 0, 0, 0.1),
    part(tubeG(0.03, 0.3), dark, -0.035, 0.03, 0.42),
    part(tubeG(0.03, 0.3), dark, 0.035, 0.03, 0.42),
    part(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 14), rust, 0, -0.12, 0.08),
    part(boxG(0.14, 0.03, 0.12), bodyMat, 0, 0.09, 0.05),
  );
  gun.position.set(0, -0.74, 0.05);
  gun.rotation.x = Math.PI / 2;
  armR.add(gun);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.03, 0.6);
  gun.add(muzzle);

  const label = makeLabel(`${name} Lv1`, color);
  label.position.y = 2.35;
  group.add(...legs, torso, head, armL, armR, label);
  if (warboss) {
    // Mega armor warboss: metal jaw, power klaw, exhaust stacks and a checkered trophy banner
    head.add(part(boxG(0.34, 0.1, 0.24), iron, 0, -0.15, 0.08));
    armL.add(blob(0.17, iron, 0, -0.7, 0, 1.1, 0.9, 1.1));
    for (let k = 0; k < 3; k++) armL.add(part(new THREE.ConeGeometry(0.05, 0.32, 6), iron, -0.08 + k * 0.08, -0.9, 0.06, Math.PI));
    for (const sx of [-1, 1]) {
      group.add(part(new THREE.CylinderGeometry(0.07, 0.09, 0.6, 10), iron, 0.25 * sx, 1.85, -0.42));
      group.add(part(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 10), dark, 0.25 * sx, 2.18, -0.42));
    }
    group.add(limb(new THREE.Vector3(0, 1.3, -0.5), new THREE.Vector3(0, 3.1, -0.6), 0.03, dark));
    const bc = document.createElement('canvas');
    bc.width = bc.height = 64;
    const g = bc.getContext('2d');
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#eee'; g.fillRect(x * 16, y * 16, 16, 16); }
    g.fillStyle = '#c01818';
    g.beginPath(); g.arc(32, 32, 13, 0, Math.PI * 2); g.fill();
    const btex = new THREE.CanvasTexture(bc);
    btex.colorSpace = THREE.SRGBColorSpace;
    btex.magFilter = THREE.NearestFilter;
    group.add(part(new THREE.PlaneGeometry(0.7, 0.9), new THREE.MeshStandardMaterial({ map: btex, side: THREE.DoubleSide, roughness: 0.9 }), 0, 2.55, -0.62));
    group.add(blob(0.09, bone, 0, 3.15, -0.6));
    group.scale.setScalar(1.55);
  }
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return {
    name, color, group, bodyMat, armL, armR, legs, muzzle, label,
    hp: warboss ? 600 : 150, maxHp: warboss ? 600 : 150, level: 1, fireCd: rand(0.3, 0.8), retargetT: 0, target: null,
    downT: 0, calmT: 0, slot: i, t: 0, detourT: 0, detour: 1, radius: warboss ? 0.85 : 0.55, labelText: '',
    warboss, baseScale: warboss ? 1.55 : 1, dmgMult: warboss ? 3 : 1, fireRate: warboss ? 1.5 : 1,
  };
}

// Rows of four in an arc behind the player
function mateSlot(i) {
  const a = ((i % 4) - 1.5) * 0.6;
  const r = 2.6 + Math.floor(i / 4) * 2.2;
  return [Math.sin(a) * r, Math.cos(a) * r];
}

function formationSpot(slot) {
  const [sx, sz] = mateSlot(slot);
  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  // right = (cos, -sin), back = (sin, cos)
  const spot = { x: player.pos.x + cos * sx + sin * sz, z: player.pos.z - sin * sx + cos * sz };
  if (builtLevel === 'space' && player.planet) clampToPlanet(spot, player.planet, 2);
  return spot;
}

function addMate(warboss = false) {
  if (mates.length >= MAX_MATES) return null;
  const m = makeMate(mates.filter((o) => !o.warboss).length, warboss);
  m.slot = mates.length;
  const p = formationSpot(m.slot);
  pushOut(p, 0.6, terrainY(p.x, p.z));
  m.group.position.set(p.x, terrainY(p.x, p.z), p.z);
  scene.add(m.group);
  mates.push(m);
  spawnBeam(p.x, p.z, m.color);
  return m;
}

function mateDamage(m) {
  return 16 * (1 + 0.3 * (m.level - 1)) * m.dmgMult;
}

function refreshMateLabel(m) {
  const text = m.downT > 0 ? `💀 ${Math.ceil(m.downT)}s` : `${m.name} Lv${m.level}`;
  if (text !== m.labelText) {
    m.labelText = text;
    m.label.userData.draw(text);
  }
}

function levelUpMate(m, levels = 1) {
  m.level += levels;
  m.maxHp += 25 * levels;
  m.hp = m.maxHp;
  m.group.scale.setScalar(m.baseScale * Math.min(1.3, 1 + 0.05 * (m.level - 1)));
  m.bodyMat.emissive.copy(new THREE.Color(m.color).multiplyScalar(Math.min(0.35, 0.05 * (m.level - 1))));
  burst(m.group.position.clone().setY(1.2), 0xffd23f, 16, 4, 0.6);
  refreshMateLabel(m);
}

function damageMate(m, n) {
  if (m.downT > 0) return;
  m.hp -= n;
  m.calmT = 0;
  burst(m.group.position.clone().setY(1.2), m.color, 4, 3, 0.3);
  if (m.hp <= 0) {
    m.hp = 0;
    m.downT = 10;
    m.target = null;
    m.group.rotation.x = -Math.PI / 2;
    m.group.position.y = terrainY(m.group.position.x, m.group.position.z) + 0.35;
    showToast(`🤖 ${m.name} 倒下了，10 秒后回来 · is down, back in 10s`);
    refreshMateLabel(m);
  }
}

function respawnMate(m) {
  const p = formationSpot(m.slot);
  pushOut(p, 0.6, terrainY(p.x, p.z));
  m.group.position.set(p.x, terrainY(p.x, p.z), p.z);
  m.group.rotation.set(0, player.yaw + Math.PI, 0);
  m.hp = m.maxHp;
  m.downT = 0;
  spawnBeam(p.x, p.z, m.color);
  refreshMateLabel(m);
}

function mateFire(m, e) {
  const from = m.muzzle.getWorldPosition(new THREE.Vector3());
  const to = enemyCenter(e).add(new THREE.Vector3(rand(-0.4, 0.4), rand(-0.3, 0.5), rand(-0.4, 0.4)));
  const dir = to.clone().sub(from);
  const d = dir.length();
  dir.divideScalar(d);
  const hit = castRay(from, dir, d + 2, solidMeshes.concat(e.hitMeshes))[0];
  if (hit && hit.object?.userData.enemy === e) {
    const head = hit.object.userData.head;
    damageEnemy(e, mateDamage(m) * (head ? 2 : 1), head, hit.point);
  }
  tracer(from, hit ? hit.point : to, m.color, 1);
  sfx.mateShot(camera.position.distanceTo(from));
}

function updateMates(dt) {
  for (const m of mates) {
    m.t += dt;
    const g = m.group.position;
    if (m.downT > 0) {
      m.downT -= dt;
      refreshMateLabel(m);
      if (m.downT <= 0) {
        respawnMate(m);
        showToast(`🤖 ${m.name} 回来了！· is back!`);
      }
      continue;
    }

    // Catch up if we fell far behind (big map)
    const spot = formationSpot(m.slot);
    if (dist2d(g, player.pos) > (openWorld() ? 45 : 30)) {
      pushOut(spot, 0.6, terrainY(spot.x, spot.z));
      g.set(spot.x, terrainY(spot.x, spot.z), spot.z);
      spawnBeam(spot.x, spot.z, m.color);
    }

    // Pick the nearest awake enemy close to the team
    m.retargetT -= dt;
    if (m.retargetT <= 0 || (m.target && !enemies.includes(m.target))) {
      m.retargetT = 0.5;
      let best = null;
      let bestD = 34;
      for (const e of enemies) {
        const d = dist2d(e.group.position, g);
        if (d < bestD && (e.aggro || d < 18) && dist2d(e.group.position, player.pos) < 40) { best = e; bestD = d; }
      }
      m.target = best;
    }

    // Move: grab a power star if one is close, otherwise hold formation
    let tx = spot.x;
    let tz = spot.z;
    if (!m.target) {
      const star = pickups.find((p) => p.kind === 'power' && dist2d(p.group.position, g) < 18);
      if (star) { tx = star.group.position.x; tz = star.group.position.z; }
    }
    const toSpot = Math.hypot(tx - g.x, tz - g.z);
    const holding = m.target && dist2d(spot, g) < 8;
    const moving = !holding && toSpot > 1.2;
    if (moving) steer(m, tx, tz, toSpot > 8 ? 11 : 7.5, dt);
    if (dist2d(g, player.pos) < 1.1) {
      const k = 1.1 / (dist2d(g, player.pos) || 1);
      g.x = player.pos.x + (g.x - player.pos.x) * k;
      g.z = player.pos.z + (g.z - player.pos.z) * k;
    }

    // Face target or travel direction; walk animation
    if (m.target) {
      const tp = m.target.group.position;
      m.group.rotation.y = Math.atan2(tp.x - g.x, tp.z - g.z);
    } else if (moving) {
      m.group.rotation.y = Math.atan2(tx - g.x, tz - g.z);
    }
    g.y = terrainY(g.x, g.z) + (moving ? Math.abs(Math.sin(m.t * 12)) * 0.06 : 0);
    m.label.visible = dist2d(g, player.pos) > 5;
    if (builtLevel === 'space' && player.planet) clampToPlanet(g, player.planet, 1);
    m.armL.rotation.x = -1.2 + (moving ? Math.sin(m.t * 12) * 0.15 : 0);
    m.legs[0].rotation.x = moving ? Math.sin(m.t * 12) * 0.6 : 0;
    m.legs[1].rotation.x = moving ? -Math.sin(m.t * 12) * 0.6 : 0;

    // Shoot
    m.fireCd -= dt;
    if (m.target && m.fireCd <= 0) {
      m.fireCd = rand(0.4, 0.55) / (1 + 0.1 * (m.level - 1)) / m.fireRate;
      mateFire(m, m.target);
    }

    // Heal when out of combat
    m.calmT += dt;
    if (!m.target && m.calmT > 3 && m.hp < m.maxHp) m.hp = Math.min(m.maxHp, m.hp + 8 * dt);
  }

  // Keep teammates from stacking
  for (let i = 0; i < mates.length; i++) {
    for (let j = i + 1; j < mates.length; j++) {
      const a = mates[i].group.position;
      const b = mates[j].group.position;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.001 && d < 1.1) {
        const push = (1.1 - d) / 2;
        a.x -= (dx / d) * push; a.z -= (dz / d) * push;
        b.x += (dx / d) * push; b.z += (dz / d) * push;
      }
    }
  }
}

// ---------- Building ----------
const walls = []; // { mesh, rect, collider, hp, maxHp, grow, edgeMat, stripMat }
const WALL_GLOW = 0x1aa6bf;
const WALL_HURT = new THREE.Color(0xff3355);
const ghost = new THREE.Mesh(
  new THREE.BoxGeometry(WALL_W, WALL_H, WALL_T),
  new THREE.MeshBasicMaterial({ color: 0x33f0ff, transparent: true, opacity: 0.22, depthWrite: false }),
);
ghost.add(new THREE.LineSegments(new THREE.EdgesGeometry(ghost.geometry), new THREE.LineBasicMaterial({ color: 0x33f0ff })));
ghost.visible = false;
scene.add(ghost);
let ghostRect = null;
let ghostBase = 0;
let ghostValid = false;

function updateGhost() {
  ghost.visible = player.building && state === 'playing';
  if (!ghost.visible) return;
  const dx = -Math.sin(player.yaw);
  const dz = -Math.cos(player.yaw);
  const spansX = Math.abs(dz) >= Math.abs(dx); // facing along z → wall spans x
  const cx = Math.round((player.pos.x + dx * 3.2) * 2) / 2;
  const cz = Math.round((player.pos.z + dz * 3.2) * 2) / 2;
  const hw = (spansX ? WALL_W : WALL_T) / 2;
  const hd = (spansX ? WALL_T : WALL_W) / 2;
  const ex = spansX ? WALL_W / 2 : 0;
  const ez = spansX ? 0 : WALL_W / 2;
  ghostBase = Math.min(terrainY(cx, cz), terrainY(cx - ex, cz - ez), terrainY(cx + ex, cz + ez)) - 0.2;
  ghostRect = { minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd, top: ghostBase + WALL_H };
  ghost.position.set(cx, ghostBase + WALL_H / 2, cz);
  ghost.rotation.y = spansX ? 0 : Math.PI / 2;
  const lim = bounds - 0.5;
  const inside = ghostRect.minX > -lim && ghostRect.maxX < lim && ghostRect.minZ > -lim && ghostRect.maxZ < lim;
  ghostValid = inside && player.bricks >= WALL_COST && walls.length < MAX_WALLS && !circleHitsRect(player.pos, PLAYER_RADIUS + 0.1, ghostRect);
  const col = ghostValid ? 0x33f0ff : 0xff3355;
  ghost.material.color.setHex(col);
  ghost.children[0].material.color.setHex(col);
}

function placeWall() {
  if (!ghostValid) {
    sfx.empty();
    showToast(player.bricks < WALL_COST ? '🧱 建材不够 · Not enough bricks' : '这里放不了 · Can\'t build here');
    return;
  }
  player.bricks -= WALL_COST;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_W, WALL_H, WALL_T),
    new THREE.MeshStandardMaterial({ color: 0x123a58, emissive: 0x0a2a40, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.93 }),
  );
  mesh.position.copy(ghost.position);
  mesh.rotation.y = ghost.rotation.y;
  mesh.castShadow = mesh.receiveShadow = true;
  const edgeMat = new THREE.LineBasicMaterial({ color: WALL_GLOW });
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat));
  const stripMat = glowMat(WALL_GLOW);
  for (const y of [-0.6, 0.6]) mesh.add(part(boxG(WALL_W * 0.94, 0.06, WALL_T + 0.02), stripMat, 0, y, 0));
  mesh.scale.y = 0.01;
  scene.add(mesh);

  const wall = { mesh, rect: { ...ghostRect }, base: ghostBase, hp: WALL_HP * player.wallHpMult, grow: 0, edgeMat, stripMat };
  wall.maxHp = wall.hp;
  wall.collider = { ...ghostRect, wall };
  mesh.userData.wall = wall;
  colliders.push(wall.collider);
  solidMeshes.push(mesh);
  walls.push(wall);
  sfx.build();
  burst(new THREE.Vector3(mesh.position.x, 0.2, mesh.position.z), 0x33f0ff, 12, 3, 0.4);
  updateAmmoUI();
}

function removeWall(wall, withFx = true) {
  const i = walls.indexOf(wall);
  if (i < 0) return;
  walls.splice(i, 1);
  colliders.splice(colliders.indexOf(wall.collider), 1);
  solidMeshes.splice(solidMeshes.indexOf(wall.mesh), 1);
  disposeGroup(wall.mesh);
  if (withFx) {
    burst(wall.mesh.position, 0x33f0ff, 30, 6, 0.8);
    sfx.wallBreak();
  }
}

function damageWall(wall, n) {
  wall.hp -= n;
  const f = Math.max(0, wall.hp / wall.maxHp);
  wall.mesh.material.emissive.setHex(0x0a2a40).lerp(WALL_HURT, (1 - f) * 0.5);
  wall.edgeMat.color.setHex(WALL_GLOW).lerp(WALL_HURT, 1 - f);
  wall.stripMat.color.copy(wall.edgeMat.color);
  const p = wall.mesh.position.clone();
  p.y = 0.5 + Math.random() * 2;
  burst(p, 0x33f0ff, 4, 3, 0.3);
  sfx.wallHit();
  if (wall.hp <= 0) removeWall(wall);
}

// The player-built wall standing between enemy `e` and the direction (nx, nz), if touching
function blockingWall(e, nx, nz) {
  const g = e.group.position;
  for (const w of walls) {
    const dx = clamp(g.x, w.rect.minX, w.rect.maxX) - g.x;
    const dz = clamp(g.z, w.rect.minZ, w.rect.maxZ) - g.z;
    const d = Math.hypot(dx, dz);
    if (d < e.radius + 0.35 && (d < 1e-3 || (dx * nx + dz * nz) / d > 0.2)) return w;
  }
  return null;
}

function wallAt(p) {
  return walls.find((w) => p.y < w.rect.top && p.y > w.base && p.x > w.rect.minX && p.x < w.rect.maxX && p.z > w.rect.minZ && p.z < w.rect.maxZ);
}

// ---------- HUD ----------
function addScore(n) {
  score += n;
  ui.score.textContent = `SCORE ${score}`;
}

function showBanner(text, sub = '', ms = 1800) {
  ui.banner.innerHTML = sub ? `${text}<small>${sub}</small>` : text;
  ui.banner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => ui.banner.classList.remove('show'), ms);
}

function showToast(text, ms = 1400) {
  ui.toast.textContent = text;
  ui.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove('show'), ms);
}

function updateEnemyCount() {
  if (openWorld()) {
    ui.enemiesLeft.textContent = `👹 怪兽 · MONSTERS ${monstersDefeated} / ${monstersTotal}`;
    return;
  }
  const n = enemies.length + spawnQueue.length;
  ui.enemiesLeft.textContent = n > 0 ? `敌人 · ENEMIES × ${n}` : '';
}

function updateHealthUI() {
  const h = Math.max(0, Math.round(player.health));
  ui.healthText.textContent = h;
  ui.healthFill.style.width = `${(h / player.maxHealth) * 100}%`;
  const ratio = h / player.maxHealth;
  const color = ratio > 0.6 ? '#3dff9a' : ratio > 0.3 ? '#ffd166' : '#ff4567';
  ui.healthFill.style.background = color;
  ui.healthFill.style.boxShadow = `0 0 12px ${color}`;
  ui.armorText.textContent = Math.round(player.armor);
  ui.armorFill.style.width = `${(player.armor / player.maxArmor) * 100}%`;
  ui.revives.textContent = player.revives ? `👼 复活币 · EXTRA LIFE × ${player.revives}` : '';
}

function currentWeapon() {
  return WEAPON_BY_ID[player.weapon];
}

function updateAmmoUI() {
  const w = currentWeapon();
  ui.weaponName.textContent = player.building ? '建造 · BUILD' : `${w.name} · ${w.en}`;
  if (player.building) ui.ammo.innerHTML = `${Math.floor(player.bricks / WALL_COST)}<span> 面墙 walls</span>`;
  else if (w.melee || player.infiniteAmmo) ui.ammo.innerHTML = '∞';
  else ui.ammo.innerHTML = `${player.ammo[w.id]}<span> / ∞</span>`;
  ui.ammo.classList.toggle('low', !w.melee && !player.building && !player.infiniteAmmo && player.ammo[w.id] <= Math.ceil(w.mag / 5));
  ui.reloadHint.classList.toggle('active', player.reloadT > 0);
  if (player.building) ui.reloadHint.textContent = `每面墙 ${WALL_COST} 🧱 · per wall`;
  else if (w.melee) ui.reloadHint.textContent = '能打掉子弹 · Blocks orbs';
  else if (player.reloadT > 0) ui.reloadHint.textContent = '换弹中 · RELOADING';
  else if (w.chain) ui.reloadHint.textContent = '连锁闪电 · Chain lightning';
  else ui.reloadHint.textContent = w.scope ? '右键开镜 · Right-click scope' : 'R 换弹 · Reload';
  ui.bricks.textContent = `🧱 ${player.bricks}`;
}

function refreshWeaponUI() {
  ui.weaponBar.innerHTML = WEAPONS.map((w, i) => {
    const owned = player.owned.has(w.id);
    if (w.id === 'lightning' && !owned) return '';
    const active = !player.building && player.weapon === w.id;
    return `<div class="slot${active ? ' active' : ''}${owned ? '' : ' locked'}"><span class="ic">${owned ? w.icon : '🔒'}</span><span class="k">${i + 1}</span> ${w.name}</div>`;
  }).join('') + `<div class="slot build${player.building ? ' active' : ''}"><span class="ic">🧱</span><span class="k">Q</span> 造墙</div>`;
  ui.buildHint.classList.toggle('hidden', !player.building);
  updateAmmoUI();
}

// Team list, abilities, monster tracker and boss bar (refreshed a few times per second)
function updateSlowHud() {
  ui.team.innerHTML = mates.map((m) => `
    <div class="mate${m.downT > 0 ? ' down' : ''}">
      <span class="dot" style="background:${hex(m.color)};color:${hex(m.color)}"></span>
      <span class="nm" style="color:${hex(m.color)}">${m.downT > 0 ? '💀 ' : '🤖 '}${m.name}</span>
      <span>Lv${m.level}</span>
      <span class="mbar"><div style="width:${(m.hp / m.maxHp) * 100}%"></div></span>
    </div>`).join('');

  const ab = [];
  if (player.powerT > 0) ab.push(`<div class="ab on">⭐ 超级状态 POWER ${Math.ceil(player.powerT)}s</div>`);
  if (player.jetpack) ab.push(`<div class="ab ${player.fuel > 0.2 ? 'ready' : ''}">🎒 喷气 JET ${Math.round(player.fuel * 100)}%</div>`);
  if (player.shieldAbility) {
    if (player.shieldT > 0) ab.push(`<div class="ab on">🔮 护盾 SHIELD ${Math.ceil(player.shieldT)}s</div>`);
    else if (player.shieldCd > 0) ab.push(`<div class="ab">🔮 E ${Math.ceil(player.shieldCd)}s</div>`);
    else ab.push('<div class="ab ready">🔮 按 E 护盾 · SHIELD</div>');
  }
  if (player.regen) ab.push('<div class="ab ready">💚 回血 REGEN</div>');
  ui.abilities.innerHTML = ab.join('');
  const rocketHere = nearRocket();
  ui.prompt.classList.toggle('hidden', !rocketHere);
  if (rocketHere) ui.prompt.textContent = '🚀 按 E 坐火箭去别的星球 · Press E to fly to another planet';

  // Point toward the nearest monster (or legendary chest) on the big map
  // Legendary chests first, otherwise the closest monster
  let goal = null;
  if (mode === 'space') {
    const here = player.planet;
    const onHere = (o) => planetAt(o.group.position.x, o.group.position.z) === here;
    const nearest = (list, make) => {
      let found = null;
      for (const item of list) {
        const d = dist2d(item.group.position, player.pos);
        if (!found || d < found.d) found = { ...make(item), pos: item.group.position, d };
      }
      return found;
    };
    goal = nearest(loot.filter((l) => l.kind === 'legend' && onHere(l)), () => ({ text: '🎁 传说宝箱 LEGENDARY CHEST', loot: true }))
      || nearest(enemies.filter((e) => e.boss && onHere(e)), (e) => ({ text: `👹 ${e.name} ${e.en}`, loot: false }));
    if (!goal && here && enemies.some((e) => e.boss)) {
      goal = { text: '🚀 坐火箭去别的星球 · TAKE THE ROCKET', loot: true, pos: here.rocket.position, d: dist2d(here.rocket.position, player.pos) };
    }
  } else if (mode === 'wilds') {
    const nearest = (list, make) => {
      let found = null;
      for (const item of list) {
        const d = dist2d(item.group.position, player.pos);
        if (!found || d < found.d) found = { ...make(item), pos: item.group.position, d };
      }
      return found;
    };
    goal = nearest(loot.filter((l) => l.kind === 'legend'), () => ({ text: '🎁 传说宝箱 LEGENDARY CHEST', loot: true }))
      || nearest(enemies.filter((e) => e.boss), (e) => ({ text: `👹 ${e.name} ${e.en}`, loot: false }));
  }
  ui.tracker.classList.toggle('hidden', !goal);
  if (goal) {
    const dx = goal.pos.x - player.pos.x;
    const dz = goal.pos.z - player.pos.z;
    const sin = Math.sin(player.yaw);
    const cos = Math.cos(player.yaw);
    const angle = Math.atan2(dx * cos - dz * sin, -dx * sin - dz * cos);
    ui.trackerArrow.style.transform = `rotate(${angle}rad)`;
    ui.trackerText.textContent = `${goal.text} · ${Math.round(goal.d)}m`;
    ui.tracker.classList.toggle('loot', goal.loot);
  }

  // Boss health bar when a monster is close
  let boss = null;
  for (const e of enemies) {
    if (e.boss && (e.aggro || dist2d(e.group.position, player.pos) < 40) && dist2d(e.group.position, player.pos) < 70) { boss = e; break; }
  }
  ui.boss.classList.toggle('hidden', !boss);
  if (boss) {
    ui.bossName.textContent = `${boss.name} · ${boss.en}`;
    ui.bossFill.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
  }
}

// ---------- Waves / modes ----------
function startWave(n) {
  wave = n;
  difficulty = n;
  wavePhase = 'fighting';
  ui.wave.textContent = `WAVE ${wave}`;
  const grunts = 3 + n * 2;
  const drones = n >= 2 ? n - 1 + Math.floor(n / 3) : 0;
  const brutes = n >= 3 ? Math.floor((n - 1) / 2) : 0;
  spawnQueue = shuffle([...Array(grunts).fill('grunt'), ...Array(drones).fill('drone'), ...Array(brutes).fill('brute')]);
  // A monster every 2 waves; two at once from wave 8, three from wave 16
  const bossDefs = [];
  if (n % 2 === 0) {
    const count = n >= 16 ? 3 : n >= 8 ? 2 : 1;
    for (let j = 0; j < count; j++) bossDefs.push(MONSTERS[(n / 2 - 1 + j * 5) % MONSTERS.length]);
  }
  for (const def of bossDefs) spawnQueue.splice(Math.floor(spawnQueue.length / 2), 0, { boss: def });
  spawnTimer = 1;
  const total = grunts + drones + brutes;
  let sub = `${total} 个敌人 · ENEMIES`;
  if (n === 1) sub = '消灭所有敌人 · ELIMINATE ALL';
  else if (bossDefs.length) sub = `👹 怪兽来了：${bossDefs.map((d) => d.name).join(' + ')} · BOSS: ${bossDefs.map((d) => d.en).join(' + ')}`;
  else if (brutes && n === 3) sub = '⚠️ 大块头来了 · BRUTES INCOMING';
  showBanner(`WAVE ${n}`, sub);
  sfx.wave();
  updateEnemyCount();
}

function setupSpace() {
  campCount = 0;
  for (const p of planets) {
    for (const c of p.camps) {
      difficulty = 2 + campCount;
      spawnEnemy('boss', { def: c.monster, x: c.x, z: c.z, camp: campCount, aggro: false });
      const minions = MINION_SETS[campCount % MINION_SETS.length];
      minions.forEach((type, j) => {
        const a = (j / minions.length) * Math.PI * 2;
        spawnEnemy(type, { x: c.x + Math.cos(a) * 6, z: c.z + Math.sin(a) * 6, camp: campCount, aggro: false });
      });
      campCount++;
    }
    for (let i = 0; i < 3; i++) {
      const a = rand(-1, 1);
      spawnLoot('supply', p.x + Math.cos(a) * p.r * 0.75, p.z + Math.sin(a) * p.r * 0.75);
    }
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      spawnPickup(p.x + Math.cos(a) * p.r * 0.3, p.z + Math.sin(a) * p.r * 0.3, 'power');
    }
  }
  difficulty = 2;
  monstersTotal = campCount + 1;
  const dark = planets.find((p) => p.final);
  finalSpot = { x: dark.x, z: dark.z };
  patrolT = 30;
  ui.wave.textContent = `🚀 ${planets[0].name}`;
  showBanner('🚀 太空冒险 · SPACE', '打败星球上的 Boss，坐火箭去别的星球 · Beat the bosses, ride rockets to other planets', 4000);
  sfx.wave();
  updateEnemyCount();
}

function setupWilds() {
  difficulty = 2;
  campCount = wildsLayout.camps.length;
  finalSpot = { x: 0, z: 0 };
  monstersTotal = wildsLayout.camps.length + 1; // + the final boss
  const minionSets = [
    ['grunt', 'grunt', 'grunt'],
    ['grunt', 'grunt', 'drone', 'drone'],
    ['grunt', 'grunt', 'brute', 'drone'],
    ['grunt', 'grunt', 'grunt', 'drone'],
    ['brute', 'brute', 'drone', 'drone'],
    ['grunt', 'grunt', 'drone', 'drone', 'drone'],
    ['brute', 'brute', 'grunt', 'grunt', 'drone'],
    ['brute', 'brute', 'grunt', 'grunt', 'drone', 'drone'],
    ['brute', 'brute', 'brute', 'drone', 'drone'],
    ['grunt', 'grunt', 'grunt', 'brute', 'drone', 'drone'],
    ['brute', 'brute', 'drone', 'drone', 'drone', 'drone'],
    ['brute', 'brute', 'brute', 'grunt', 'grunt', 'drone', 'drone'],
  ];
  wildsLayout.camps.forEach((c, i) => {
    difficulty = 2 + i;
    spawnEnemy('boss', { def: c.monster, x: c.x, z: c.z, camp: i, aggro: false });
    minionSets[i].forEach((type, j) => {
      const a = (j / minionSets[i].length) * Math.PI * 2;
      spawnEnemy(type, { x: c.x + Math.cos(a) * 6, z: c.z + Math.sin(a) * 6, camp: i, aggro: false });
    });
  });
  difficulty = 2;
  for (const s of wildsLayout.supplies) spawnLoot('supply', s.x, s.z);
  for (const s of wildsLayout.stars) spawnPickup(s.x, s.z, 'power');
  patrolT = 25;
  ui.wave.textContent = '荒野探险 · WILDS';
  showBanner('荒野探险 · WILDS', '跟着红色箭头找到怪兽 · Follow the red arrow to find monsters', 3500);
  sfx.wave();
  updateEnemyCount();
}

function updateWaves(dt) {
  if (wavePhase === 'fighting') {
    if (spawnQueue.length) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        const next = spawnQueue.shift();
        if (next.boss) {
          spawnEnemy('boss', { def: next.boss });
          showToast(`👹 ${next.boss.name} 出现了！${next.boss.en} APPEARS!`, 2500);
          sfx.roar(30);
        } else {
          spawnEnemy(next);
        }
        spawnTimer = Math.max(0.35, 0.9 - wave * 0.05);
        updateEnemyCount();
      }
    } else if (enemies.length === 0) {
      wavePhase = 'cleared';
      phaseT = 1.6;
      addScore(wave * 200);
      showBanner('WAVE CLEAR', `+${wave * 200} 奖励 · BONUS　🧱 +10`, 1500);
      player.health = Math.min(player.maxHealth, player.health + 15);
      player.bricks += 10;
      for (const m of mates) if (m.downT > 0) respawnMate(m);
      updateHealthUI();
      updateAmmoUI();
    }
  } else if (wavePhase === 'cleared') {
    phaseT -= dt;
    if (phaseT <= 0) {
      wavePhase = 'reward';
      openRewards('wave');
    }
  } else if (wavePhase === 'break') {
    phaseT -= dt;
    if (phaseT <= 0) startWave(wave + 1);
  }
}

function spawnFinalBoss() {
  finalSpawned = true;
  difficulty = 2 + monstersDefeated;
  spawnEnemy('boss', { def: FINAL_BOSS, x: finalSpot.x, z: finalSpot.z, aggro: true });
  if (mode === 'space') showBanner('⚠️ 最终 BOSS · FINAL BOSS', `${FINAL_BOSS.name}在暗黑星上！坐火箭去！${FINAL_BOSS.en} IS ON THE DARK STAR!`, 4500);
  else showBanner('⚠️ 最终 BOSS · FINAL BOSS', `${FINAL_BOSS.name}来了！${FINAL_BOSS.en} IS COMING!`, 4000);
  sfx.roar(30);
}

function updateWilds(dt) {
  if (finalT > 0) {
    finalT -= dt;
    if (finalT <= 0) spawnFinalBoss();
  }
  // Roaming patrols keep the exploring exciting
  patrolT -= dt;
  if (patrolT <= 0) {
    patrolT = rand(18, 28);
    const roaming = enemies.filter((e) => e.camp === null).length;
    const here = player.planet;
    if (roaming < 8 && (mode !== 'space' || (here && planetAt(player.pos.x, player.pos.z) === here))) {
      const a = Math.random() * Math.PI * 2;
      const r = mode === 'space' ? rand(0.4, 0.85) * here.r : rand(40, 55);
      const cx = (mode === 'space' ? here.x : player.pos.x) + Math.cos(a) * r;
      const cz = (mode === 'space' ? here.z : player.pos.z) + Math.sin(a) * r;
      const types = ['grunt', 'grunt'];
      if (difficulty >= 3) types.push('drone');
      if (difficulty >= 4 && Math.random() < 0.5) types.push('brute');
      for (const t of types) spawnEnemy(t, { x: cx + rand(-3, 3), z: cz + rand(-3, 3), aggro: true });
    }
  }
  if (!victoryShown && monstersDefeated >= monstersTotal && !loot.some((l) => l.kind === 'legend')) victory();
}

// ---------- Game flow ----------
function clearWorld() {
  for (const e of enemies) { disposeGroup(e.group); if (e.beacon) disposeGroup(e.beacon); }
  enemies.length = 0;
  while (orbs.length) removeOrb(orbs.length - 1);
  for (const r of rockets) disposeGroup(r.mesh);
  rockets.length = 0;
  for (const p of pickups) disposeGroup(p.group);
  pickups.length = 0;
  for (const l of loot) disposeGroup(l.group);
  loot.length = 0;
  for (const m of mates) disposeGroup(m.group);
  mates.length = 0;
  for (const p of particles) disposeMesh(p.mesh);
  particles.length = 0;
  while (walls.length) removeWall(walls[0], false);
  while (debris.length) removeDebris(debris.length - 1);
  while (strikes.length) removeStrike(strikes.length - 1);
}

function resetGame() {
  clearWorld();
  const key = mode === 'arena' ? 'arena' : `${mode}:${mapSize}`;
  if (builtKey !== key) {
    ({ arena: buildArena, wilds: buildWilds, space: buildSpace })[mode]();
    builtKey = key;
  }
  Object.assign(player, {
    vy: 0, onGround: true, yaw: 0, pitch: 0, recoil: 0, shake: 0,
    health: 100, maxHealth: 100, armor: 0, maxArmor: 100, revives: 0,
    weapon: 'rifle', owned: new Set(['rifle', 'sword']),
    ammo: Object.fromEntries(WEAPONS.filter((w) => w.mag).map((w) => [w.id, w.mag])),
    fireCd: 0, reloadT: 0, reloadDur: 1, reloadWeapon: null, switchT: 0,
    swingT: 0, quickMelee: false, firedThisPress: false,
    bricks: 30, building: false, scoped: false,
    damageMult: 1, speedMult: 1, swordMult: 1, swordRange: 1, wallHpMult: 1,
    powerT: 0, jetpack: false, fuel: 1, shieldAbility: false, shieldT: 0, shieldCd: 0,
    regen: 0, infiniteAmmo: false, golden: false, giantSword: false, lastStep: 0,
  });
  player.planet = mode === 'space' ? planets[0] : null;
  const start = mode === 'space' ? planets[0].spawn : { x: 0, z: 0 };
  player.pos.set(start.x, terrainY(start.x, start.z), start.z);
  player.yaw = mode === 'space' ? -Math.PI / 2 : 0;
  if (mode === 'space') player.jetpack = true;
  models.sword.auraMat.color.set(0x33f0ff);
  models.sword.coreMat.color.set(0xe0ffff);
  models.sword.group.scale.setScalar(1);
  weaponHolder.traverse((o) => { if (o.userData.baseColor !== undefined) o.material.color.setHex(o.userData.baseColor); });
  camera.fov = BASE_FOV;
  camera.updateProjectionMatrix();
  score = 0;
  wave = 0;
  monstersDefeated = 0;
  monstersTotal = 0;
  victoryShown = false;
  finalSpawned = false;
  finalT = 0;
  playTime = 0;
  addScore(0);
  addMate(true); // Ghazghkull Thraka always fights with you
  for (let i = 0; i < teamSize; i++) addMate();
  updateHealthUI();
  refreshWeaponUI();
  if (mode === 'wilds') setupWilds();
  else if (mode === 'space') setupSpace();
  else startWave(1);
}

function lockPointer() {
  const p = canvas.requestPointerLock?.();
  if (p && p.catch) p.catch(() => {});
}

function startGame(newMode = mode) {
  mode = newMode;
  initAudio();
  resetGame();
  setState('playing');
  lockPointer();
}

function goToMenu() {
  clearWorld();
  setState('menu');
  document.exitPointerLock?.();
}

function setState(s) {
  state = s;
  ui.start.classList.toggle('hidden', s !== 'menu');
  ui.pause.classList.toggle('hidden', s !== 'paused');
  ui.over.classList.toggle('hidden', s !== 'over');
  ui.reward.classList.toggle('hidden', s !== 'reward');
  ui.hud.classList.toggle('hidden', s === 'menu' || s === 'travel');
  if (s !== 'playing') ui.scope.classList.add('hidden');
  weaponHolder.visible = s !== 'menu' && s !== 'travel';
  ghost.visible = false;
  mouseDown = false;
  player.scoped = false;
}

function saveBest() {
  if (score > best) {
    best = score;
    localStorage.setItem('neon-arena-best', String(best));
  }
  ui.best.textContent = best;
  ui.bestStart.textContent = best;
}

function showEndScreen(won) {
  setState('over');
  saveBest();
  ui.overTitle.textContent = won ? '胜利！VICTORY' : 'GAME OVER';
  ui.overTitle.classList.toggle('danger', !won);
  ui.finalScore.textContent = score;
  if (openWorld()) {
    const t = Math.floor(playTime);
    ui.finalLabel.textContent = won ? '用时 · TIME' : '怪兽 · MONSTERS';
    ui.finalWave.textContent = won ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` : `${monstersDefeated} / ${monstersTotal}`;
  } else {
    ui.finalLabel.textContent = '波数 · WAVE';
    ui.finalWave.textContent = wave;
  }
  ui.btnContinue.classList.toggle('hidden', !won);
  document.exitPointerLock?.();
}

function gameOver() {
  showEndScreen(false);
}

function victory() {
  victoryShown = true;
  addScore(5000);
  sfx.legend();
  showEndScreen(true);
}

function damagePlayer(n) {
  if (state !== 'playing') return;
  if (player.shieldT > 0) {
    sfx.deflect();
    return;
  }
  const absorbed = Math.min(player.armor, n);
  player.armor -= absorbed;
  n -= absorbed;
  player.health -= n;
  if (n > 0) {
    damageFlash = Math.min(1, damageFlash + 0.6);
    sfx.hurt();
  } else {
    sfx.armorHit();
  }
  player.shake = Math.min(0.4, player.shake + 0.2);
  updateHealthUI();
  if (player.health <= 0) {
    if (player.revives > 0) revive();
    else gameOver();
  }
}

function hitTarget(t, dmg) {
  if (t === 'player') damagePlayer(dmg);
  else damageMate(t, dmg);
}

function revive() {
  player.revives--;
  player.health = player.maxHealth;
  player.armor = Math.max(player.armor, 50);
  explode(new THREE.Vector3(player.pos.x, player.pos.y + 1, player.pos.z), 250, 10, 0x9ffcff);
  while (orbs.length) removeOrb(orbs.length - 1);
  showBanner('复活！REVIVED', '复活币 -1 · EXTRA LIFE USED', 2200);
  sfx.revive();
  updateHealthUI();
}

// ---------- Rewards ----------
function unlockWeapon(id) {
  return () => {
    const w = WEAPON_BY_ID[id];
    player.owned.add(id);
    player.ammo[id] = w.mag;
    switchWeapon(id);
    showToast(`解锁 UNLOCKED ${w.icon} ${w.name} · ${w.en}`, 2200);
  };
}

const REWARDS = [
  { id: 'shotgun', weapon: true, icon: '💥', title: '霰弹枪', en: 'SHOTGUN', desc: '近距离一枪轰飞<br>Huge close-range blast', available: () => !player.owned.has('shotgun'), apply: unlockWeapon('shotgun') },
  { id: 'sniper', weapon: true, icon: '🎯', title: '狙击枪', en: 'SNIPER', desc: '右键开镜，子弹能穿透<br>Right-click to scope, bullets pierce', available: () => !player.owned.has('sniper'), apply: unlockWeapon('sniper') },
  { id: 'rocket', weapon: true, icon: '🚀', title: '火箭筒', en: 'ROCKET LAUNCHER', desc: '爆炸伤害一大片<br>Blows up a whole group', available: () => !player.owned.has('rocket') && difficulty >= 2, apply: unlockWeapon('rocket') },
  { id: 'recruit', icon: '🤖', title: '招募队友', en: 'RECRUIT TEAMMATE', desc: '多一个 AI 队友帮你打<br>One more AI buddy fights with you', available: () => mates.length < MAX_MATES, apply: () => { const m = addMate(); if (m) showToast(`🤖 ${m.name} 加入了队伍！joined the team!`); } },
  { id: 'team', icon: '🦾', title: '团队升级', en: 'TEAM UPGRADE', desc: '所有队友升一级并回满血<br>All teammates +1 level, full heal', available: () => mates.length > 0, apply: () => { for (const m of mates) { if (m.downT > 0) respawnMate(m); levelUpMate(m); } } },
  { id: 'armor', icon: '🛡️', title: '护甲 +60', en: 'ARMOR', desc: '先替你挡伤害<br>Absorbs damage before HP', available: () => player.armor < player.maxArmor, apply: () => { player.armor = Math.min(player.maxArmor, player.armor + 60); } },
  { id: 'heart', icon: '❤️', title: '生命上限 +25', en: 'MAX HEALTH', desc: '还会回满血<br>And fully heals you', apply: () => { player.maxHealth += 25; player.health = player.maxHealth; } },
  { id: 'damage', icon: '🔥', title: '伤害 +25%', en: 'DAMAGE UP', desc: '所有武器更痛<br>Every weapon hits harder', apply: () => { player.damageMult *= 1.25; } },
  { id: 'bricks', icon: '🧱', title: '建材 +30', en: 'BUILDING BRICKS', desc: '按 Q 造更多墙<br>Build more walls with Q', apply: () => { player.bricks += 30; } },
  { id: 'revive', icon: '👼', title: '复活币', en: 'EXTRA LIFE', desc: '死了以后原地复活一次<br>Come back once after you die', available: () => player.revives < 2, apply: () => { player.revives++; } },
  { id: 'flame', icon: '⚔️', title: '烈焰剑', en: 'FLAME SWORD', desc: '剑伤害 +50%，砍得更远<br>Sword +50% damage & reach', available: () => player.swordMult < 3, apply: () => {
    player.swordMult *= 1.5;
    player.swordRange *= 1.15;
    models.sword.auraMat.color.set(0xff6a00);
    models.sword.coreMat.color.set(0xfff0c0);
  } },
  { id: 'speed', icon: '⚡', title: '速度 +15%', en: 'SPEED UP', desc: '跑得更快<br>Move faster', available: () => player.speedMult < 1.6, apply: () => { player.speedMult *= 1.15; } },
  { id: 'walls', icon: '🏰', title: '坚固墙', en: 'STRONGER WALLS', desc: '新造的墙血量 ×2<br>New walls are twice as tough', available: () => player.wallHpMult < 4, apply: () => { player.wallHpMult *= 2; } },
];

// "Really special stuff" from defeated monsters
const LEGENDARY = [
  { id: 'jetpack', icon: '🎒', title: '喷气背包', en: 'JETPACK', desc: '跳起来后按住空格就能飞<br>Hold Space in the air to fly', available: () => !player.jetpack, apply: () => { player.jetpack = true; player.fuel = 1; } },
  { id: 'lightning', icon: '⚡', title: '闪电枪', en: 'LIGHTNING GUN', desc: '闪电会连着劈 5 个敌人<br>Lightning chains through 5 enemies', available: () => !player.owned.has('lightning'), apply: unlockWeapon('lightning') },
  { id: 'golden', icon: '👑', title: '黄金武器', en: 'GOLDEN GUNS', desc: '所有伤害 ×2，武器变金色<br>All damage ×2, weapons turn gold', available: () => !player.golden, apply: () => {
    player.golden = true;
    player.damageMult *= 2;
    for (const [id, m] of Object.entries(models)) {
      if (id !== 'sword') m.group.traverse((o) => { if (o.material?.isMeshBasicMaterial) o.material.color.setHex(0xffd23f); });
    }
  } },
  { id: 'infinite', icon: '♾️', title: '无限弹药', en: 'INFINITE AMMO', desc: '再也不用换弹<br>Never reload again', available: () => !player.infiniteAmmo, apply: () => { player.infiniteAmmo = true; player.reloadT = 0; } },
  { id: 'shield', icon: '🔮', title: '护盾泡泡', en: 'SHIELD BUBBLE', desc: '按 E：5 秒无敌<br>Press E: 5 seconds invincible', available: () => !player.shieldAbility, apply: () => { player.shieldAbility = true; player.shieldCd = 0; } },
  { id: 'army', icon: '🤖', title: '机器人军团', en: 'ROBOT ARMY', desc: '+2 个队友，全队升 2 级<br>+2 teammates, whole team +2 levels', apply: () => {
    addMate();
    addMate();
    for (const m of mates) { if (m.downT > 0) respawnMate(m); levelUpMate(m, 2); }
  } },
  { id: 'giant', icon: '🗡️', title: '巨人之剑', en: 'GIANT SWORD', desc: '剑变超大，伤害 ×2<br>Huge sword, double damage', available: () => !player.giantSword, apply: () => {
    player.giantSword = true;
    player.swordMult *= 2;
    player.swordRange *= 1.5;
    models.sword.group.scale.setScalar(1.35);
    models.sword.auraMat.color.set(0xffd23f);
    models.sword.coreMat.color.set(0xfff6d0);
  } },
  { id: 'regen', icon: '💚', title: '自动回血', en: 'REGENERATION', desc: '每秒自动回 3 点血<br>Heal 3 HP every second', available: () => !player.regen, apply: () => { player.regen = 3; } },
];
const TREASURE = { id: 'treasure', icon: '💰', title: '大宝藏', en: 'TREASURE', desc: '+1000 分，+30 建材<br>+1000 score, +30 bricks', apply: () => { addScore(1000); player.bricks += 30; } };
let rewardChoices = [];

function pickRewards(source) {
  const list = source === 'legend' ? LEGENDARY : REWARDS;
  const pool = list.filter((r) => !r.available || r.available());
  let picks;
  if (source === 'legend') {
    picks = shuffle(pool).slice(0, 3);
  } else {
    const weapons = shuffle(pool.filter((r) => r.weapon));
    picks = weapons.length ? [weapons.shift()] : [];
    const rest = shuffle([...weapons, ...pool.filter((r) => !r.weapon)]);
    while (picks.length < 3 && rest.length) picks.push(rest.shift());
  }
  while (picks.length < 3) picks.push(TREASURE);
  return shuffle(picks);
}

function openRewards(source) {
  rewardSource = source;
  const legend = source === 'legend';
  rewardChoices = pickRewards(source);
  ui.rewardTitle.textContent = legend ? '👑 传说奖励 · LEGENDARY LOOT' : source === 'supply' ? '📦 补给箱 · SUPPLY CRATE' : '选一个奖励 · CHOOSE A REWARD';
  ui.rewardTitle.classList.toggle('legend', legend);
  ui.rewardCards.innerHTML = rewardChoices.map((r, i) => `
    <div class="reward${legend ? ' legend' : r.weapon ? ' weapon' : ''}" data-i="${i}">
      <div class="num">${i + 1}</div>
      <div class="icon">${r.icon}</div>
      <div class="title">${r.title}</div>
      <div class="title-en">${r.en}</div>
      <div class="desc">${r.desc}</div>
    </div>`).join('');
  setState('reward');
  if (legend) sfx.legend();
  document.exitPointerLock?.();
}

function chooseReward(i) {
  const r = rewardChoices[i];
  if (!r || state !== 'reward') return;
  if (rewardSource === 'travel') {
    r.apply();
    return;
  }
  r.apply();
  sfx.unlock();
  setState('playing');
  lockPointer();
  if (rewardSource === 'wave') {
    wavePhase = 'break';
    phaseT = 2.5;
  }
  updateHealthUI();
  refreshWeaponUI();
  updateSlowHud();
}

ui.rewardCards.addEventListener('click', (e) => {
  const card = e.target.closest('.reward');
  if (card) chooseReward(Number(card.dataset.i));
});

// ---------- Rocket travel between planets ----------
function nearRocket() {
  if (mode !== 'space' || !player.planet) return null;
  return dist2d(player.planet.pad, player.pos) < 5 ? player.planet : null;
}

function openTravel() {
  const here = player.planet;
  const bossesOn = (p) => enemies.filter((e) => e.boss && e.planet === p).length;
  rewardChoices = planets.filter((p) => p !== here).map((p) => ({
    icon: p.icon, title: p.name, en: p.en,
    desc: bossesOn(p) ? `👹 还有 ${bossesOn(p)} 只 Boss<br>${bossesOn(p)} boss${bossesOn(p) > 1 ? 'es' : ''} left` : '✅ 已经清空<br>Cleared',
    apply: () => startTravel(p),
  }));
  rewardChoices.push({ icon: '❌', title: '不去了', en: 'STAY HERE', desc: '留在这个星球<br>Stay on this planet', apply: () => { setState('playing'); lockPointer(); } });
  rewardSource = 'travel';
  ui.rewardTitle.textContent = '🚀 去哪个星球？· WHERE TO?';
  ui.rewardTitle.classList.remove('legend');
  ui.rewardCards.innerHTML = rewardChoices.map((r, i) => `
    <div class="reward" data-i="${i}">
      <div class="num">${i + 1}</div>
      <div class="icon">${r.icon}</div>
      <div class="title">${r.title}</div>
      <div class="title-en">${r.en}</div>
      <div class="desc">${r.desc}</div>
    </div>`).join('');
  setState('reward');
  document.exitPointerLock?.();
}

function startTravel(dest) {
  const from = player.planet;
  const ship = makeRocketShip(from.color);
  ship.flame.visible = true;
  const a = from.rocket.position.clone();
  const b = new THREE.Vector3(dest.pad.x, terrainY(dest.pad.x, dest.pad.z) + 0.3, dest.pad.z);
  ship.group.position.copy(a);
  scene.add(ship.group);
  from.rocket.visible = false;
  travel = { t: 0, dur: 6, from, dest, ship, p0: a, p1: a.clone().setY(a.y + 140), p2: b.clone().setY(b.y + 140), p3: b };
  setState('travel');
  lockPointer();
  sfx.rocketLaunch();
}

function bezier(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return p0.clone().multiplyScalar(u * u * u)
    .addScaledVector(p1, 3 * u * u * t)
    .addScaledVector(p2, 3 * u * t * t)
    .addScaledVector(p3, t * t * t);
}

function updateTravel(dt) {
  travel.t += dt;
  const k = Math.min(1, travel.t / travel.dur);
  const e = k * k * (3 - 2 * k);
  const pos = bezier(e, travel.p0, travel.p1, travel.p2, travel.p3);
  const ahead = bezier(Math.min(1, e + 0.01), travel.p0, travel.p1, travel.p2, travel.p3);
  const dir = ahead.sub(pos);
  const ship = travel.ship.group;
  ship.position.copy(pos);
  if (dir.lengthSq() > 1e-6) ship.quaternion.setFromUnitVectors(UP, dir.normalize());
  if (Math.random() < 0.7) burst(pos.clone().addScaledVector(dir, -2), 0xffa040, 2, 3, 0.5);
  // Chase camera behind and above the rocket
  const toDest = travel.p3.clone().sub(travel.p0).setY(0).normalize();
  camera.position.copy(pos).addScaledVector(toDest, -20).add(new THREE.Vector3(0, 9, 0));
  camera.lookAt(pos);
  if (k >= 1) arrive();
}

function arrive() {
  const { from, dest, ship } = travel;
  disposeGroup(ship.group);
  from.rocket.visible = true;
  travel = null;
  player.planet = dest;
  const sp = dest.spawn;
  player.pos.set(sp.x, terrainY(sp.x, sp.z), sp.z);
  player.vy = 0;
  player.yaw = Math.atan2(sp.x - dest.x, sp.z - dest.z);
  player.pitch = 0;
  for (const m of mates) {
    if (m.downT > 0) respawnMate(m);
    const spot = formationSpot(m.slot);
    m.group.position.set(spot.x, terrainY(spot.x, spot.z), spot.z);
    spawnBeam(spot.x, spot.z, m.color);
  }
  while (orbs.length) removeOrb(orbs.length - 1);
  const left = enemies.filter((e) => e.boss && e.planet === dest).length;
  ui.wave.textContent = `🚀 ${dest.name}`;
  showBanner(`${dest.icon} ${dest.name} · ${dest.en}`, left ? `👹 这里有 ${left} 只 Boss · ${left} BOSS${left > 1 ? 'ES' : ''} HERE` : '✅ 这里已经清空 · ALL CLEAR', 3000);
  sfx.land();
  setState('playing');
}

// ---------- Weapons: switching, shooting, slashing, rockets ----------
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);
const dmgMult = () => player.damageMult * (player.powerT > 0 ? 2 : 1);

function switchWeapon(id) {
  if (!player.owned.has(id)) {
    showToast(id === 'lightning' ? '🔒 打败怪兽才能拿到 · Defeat a monster to find it' : '🔒 选奖励来解锁 · Unlock it from rewards');
    return;
  }
  if (id === player.weapon && !player.building) return;
  player.building = false;
  player.weapon = id;
  player.reloadT = 0;
  player.switchT = 0.25;
  player.scoped = false;
  sfx.switch();
  refreshWeaponUI();
}

function cycleWeapon(dir) {
  const owned = WEAPONS.filter((w) => player.owned.has(w.id));
  const i = owned.findIndex((w) => w.id === player.weapon);
  switchWeapon(owned[(i + dir + owned.length) % owned.length].id);
}

function toggleBuild() {
  player.building = !player.building;
  player.scoped = false;
  mouseDown = false;
  sfx.switch();
  refreshWeaponUI();
}

function startReload() {
  const w = currentWeapon();
  if (w.melee || player.infiniteAmmo || player.building || player.reloadT > 0 || player.ammo[w.id] === w.mag) return;
  player.reloadT = player.reloadDur = w.reload;
  player.reloadWeapon = w.id;
  sfx.reload();
  updateAmmoUI();
}

function useShield() {
  if (!player.shieldAbility || player.shieldT > 0 || player.shieldCd > 0) return;
  player.shieldT = 5;
  player.shieldCd = 20;
  sfx.shield();
  showToast('🔮 护盾开启！SHIELD UP!');
}

function muzzleWorldPos() {
  const m = models[player.weapon].muzzle;
  return m ? m.getWorldPosition(new THREE.Vector3()) : camera.position.clone();
}

function aimTargets() {
  return solidMeshes.concat(...enemies.map((e) => e.hitMeshes));
}

function tryFire() {
  const w = currentWeapon();
  if (player.fireCd > 0 || player.switchT > 0.1 || player.swingT > 0) return false;
  if (w.melee) {
    swingSword();
    player.fireCd = w.interval;
    return true;
  }
  if (player.reloadT > 0) return false;
  if (player.ammo[w.id] <= 0 && !player.infiniteAmmo) {
    sfx.empty();
    startReload();
    return false;
  }
  if (!player.infiniteAmmo) player.ammo[w.id]--;
  player.fireCd = w.interval;
  player.recoil = 1;
  player.pitch = Math.min(1.45, player.pitch + w.recoil);
  sfx[w.id]();
  muzzleFlash.visible = true;
  muzzleFlash.scale.setScalar((0.8 + Math.random() * 0.6) * (w.kick > 1.5 ? 1.8 : 1));
  muzzleLight.intensity = 6;
  if (w.projectile) fireRocket(w);
  else if (w.chain) fireLightning(w);
  else fireHitscan(w);
  updateAmmoUI();
  return true;
}

function fireHitscan(w) {
  raycaster.setFromCamera(screenCenter, camera);
  const origin = raycaster.ray.origin.clone();
  const baseDir = raycaster.ray.direction.clone();
  const sprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
  let spread = w.spread + (player.onGround ? 0 : 0.02) + (sprinting ? 0.01 : 0);
  if (w.scope && camera.fov < 40) spread = 0;
  const targets = aimTargets();
  const from = muzzleWorldPos();
  const results = new Map(); // enemy -> { dmg, head, point }

  for (let p = 0; p < w.pellets; p++) {
    const dir = baseDir.clone();
    dir.x += (Math.random() - 0.5) * spread * 2;
    dir.y += (Math.random() - 0.5) * spread * 2;
    dir.z += (Math.random() - 0.5) * spread * 2;
    dir.normalize();
    const hits = castRay(origin, dir, 200, targets);
    const pierced = new Set();
    let end = null;
    for (const h of hits) {
      const e = h.object?.userData.enemy;
      if (!e) {
        end = h.point;
        burst(h.point, w.tracer, w.pellets > 1 ? 2 : 5, 3, 0.3);
        break;
      }
      if (pierced.has(e)) continue;
      pierced.add(e);
      const head = h.object.userData.head;
      const r = results.get(e) || { dmg: 0, head: false, point: h.point };
      r.dmg += w.damage * dmgMult() * (head ? 2 : 1);
      r.head ||= head;
      results.set(e, r);
      if (!w.pierce) { end = h.point; break; }
    }
    tracer(from, end || origin.clone().addScaledVector(dir, 120), player.golden ? 0xffd23f : w.tracer, w.id === 'sniper' ? 3 : 1);
  }

  let killed = false;
  let head = false;
  for (const [e, r] of results) {
    head ||= r.head;
    if (damageEnemy(e, r.dmg, r.head, r.point)) killed = true;
  }
  if (results.size) {
    showHitmarker(killed);
    if (!killed) head ? sfx.head() : sfx.hit();
  }
}

function fireLightning(w) {
  raycaster.setFromCamera(screenCenter, camera);
  const hit = castRay(raycaster.ray.origin.clone(), raycaster.ray.direction.clone(), 70, aimTargets())[0];
  const from = muzzleWorldPos();
  let first = hit?.object?.userData.enemy;
  if (!first) {
    // A little aim assist: grab the enemy nearest the crosshair line
    let bestD = Infinity;
    for (const e of enemies) {
      const c = enemyCenter(e);
      const along = c.clone().sub(raycaster.ray.origin).dot(raycaster.ray.direction);
      if (along < 0 || along > 60) continue;
      const off = raycaster.ray.distanceToPoint(c) - e.radius;
      if (off < 1.5 && off < bestD) { bestD = off; first = e; }
    }
  }
  if (!first) {
    bolt(from, hit ? hit.point : raycaster.ray.at(40, new THREE.Vector3()));
    return;
  }
  const chain = [first];
  while (chain.length < w.chain) {
    const last = enemyCenter(chain[chain.length - 1]);
    let next = null;
    let bestD = w.chainRange;
    for (const e of enemies) {
      if (chain.includes(e)) continue;
      const d = enemyCenter(e).distanceTo(last);
      if (d < bestD) { bestD = d; next = e; }
    }
    if (!next) break;
    chain.push(next);
  }
  let prev = from;
  let killed = false;
  for (const e of chain) {
    const c = enemyCenter(e);
    bolt(prev, c, player.golden ? 0xffe27a : 0xbfe8ff);
    prev = c;
    if (damageEnemy(e, w.damage * dmgMult(), false, c)) killed = true;
  }
  showHitmarker(killed);
}

function fireRocket(w) {
  raycaster.setFromCamera(screenCenter, camera);
  const hit = castRay(raycaster.ray.origin.clone(), raycaster.ray.direction.clone(), 200, aimTargets())[0];
  const target = hit ? hit.point : raycaster.ray.at(150, new THREE.Vector3());
  const from = muzzleWorldPos();
  const dir = target.clone().sub(from).normalize();

  const mesh = new THREE.Group();
  mesh.add(
    part(tubeG(0.05, 0.32), metalMat(0xdddddd)),
    part(new THREE.ConeGeometry(0.05, 0.14, 10).rotateX(Math.PI / 2), glowMat(0xff4567), 0, 0, 0.23),
    part(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, blending: THREE.AdditiveBlending }), 0, 0, -0.2),
  );
  mesh.position.copy(from);
  mesh.lookAt(from.clone().add(dir));
  scene.add(mesh);
  rockets.push({ mesh, vel: dir.multiplyScalar(34), life: 3, damage: w.damage * dmgMult(), splash: w.splash });
}

function explode(pos, damage, radius, color = 0xff8a3d) {
  burst(pos, color, 36, 10, 0.9);
  burst(pos, 0xffe27a, 18, 7, 0.6);
  burst(pos, 0xffffff, 8, 4, 0.3);
  shockwave(pos, color, radius);
  boomLight.color.setHex(color);
  boomLight.position.copy(pos);
  boomLight.intensity = 80;
  const dist = camera.position.distanceTo(pos);
  sfx.explosion(dist);
  player.shake = Math.min(0.6, player.shake + Math.max(0, 1 - dist / 15) * 0.5);

  let killed = false;
  let any = false;
  for (const e of [...enemies]) {
    const c = enemyCenter(e);
    const reach = radius + e.radius;
    const d = c.distanceTo(pos);
    if (d > reach) continue;
    const falloff = 1 - (d / reach) * 0.6;
    if (!e.flying && !e.boss) {
      const kx = c.x - pos.x;
      const kz = c.z - pos.z;
      const kl = Math.hypot(kx, kz) || 1;
      const push = (e.type === 'brute' ? 0.6 : 1.6) * falloff;
      e.group.position.x += (kx / kl) * push;
      e.group.position.z += (kz / kl) * push;
    }
    any = true;
    if (damageEnemy(e, damage * falloff, false, null)) killed = true;
  }
  if (any) showHitmarker(killed);
}

function swingSword() {
  player.swingT = SWING_TIME;
  player.reloadT = 0;
  slashArc.material.opacity = 0.55;
  slashArc.material.color.copy(models.sword.auraMat.color).lerp(WHITE, 0.5);
  sfx.swing();

  const range = WEAPON_BY_ID.sword.range * player.swordRange;
  const damage = WEAPON_BY_ID.sword.damage * player.swordMult * dmgMult();
  const eye = camera.position;
  const fwd = camera.getWorldDirection(new THREE.Vector3());
  let killed = false;
  let any = false;
  for (const e of [...enemies]) {
    const c = enemyCenter(e);
    const to = c.clone().sub(eye);
    const d = to.length();
    if (d - e.radius > range) continue;
    to.normalize();
    if (to.dot(fwd) < 0.4 && d > e.radius + 0.8) continue;
    if (!e.flying && !e.boss) {
      const push = e.type === 'brute' ? 0.3 : 1.0;
      e.group.position.x += to.x * push;
      e.group.position.z += to.z * push;
    }
    any = true;
    if (damageEnemy(e, damage, false, c)) killed = true;
  }
  // The blade knocks enemy orbs out of the air
  for (let i = orbs.length - 1; i >= 0; i--) {
    const to = orbs[i].mesh.position.clone().sub(eye);
    if (to.length() < range + 0.6 && to.normalize().dot(fwd) > 0.3) {
      burst(orbs[i].mesh.position, 0xffffff, 8, 4, 0.3);
      removeOrb(i);
      sfx.deflect();
    }
  }
  if (any) {
    showHitmarker(killed);
    sfx.swordHit();
  }
}

function quickMelee() {
  if (player.building || player.swingT > 0) return;
  if (player.weapon === 'sword') { tryFire(); return; }
  player.quickMelee = true;
  swingSword();
}

function showHitmarker(kill) {
  hitmarkerT = kill ? 0.25 : 0.12;
  ui.hitmarker.classList.add('show');
  ui.hitmarker.classList.toggle('kill', kill);
}

// ---------- Input ----------
document.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (state === 'reward' && /^Digit[1-5]$/.test(e.code)) {
    chooseReward(Number(e.code.slice(5)) - 1);
    return;
  }
  if (state !== 'playing') return;
  if (e.code === 'Space') e.preventDefault();
  if (e.repeat) return;
  const slot = /^Digit([1-6])$/.exec(e.code);
  if (slot) switchWeapon(WEAPONS[Number(slot[1]) - 1].id);
  if (e.code === 'KeyR') startReload();
  if (e.code === 'KeyQ' || e.code === 'KeyB') toggleBuild();
  if (e.code === 'KeyV' || e.code === 'KeyF') quickMelee();
  if (e.code === 'KeyE') {
    if (nearRocket()) openTravel();
    else useShield();
  }
});
document.addEventListener('keyup', (e) => keys.delete(e.code));

document.addEventListener('mousemove', (e) => {
  if (state !== 'playing' || document.pointerLockElement !== canvas) return;
  const sens = MOUSE_SENS * (camera.fov / BASE_FOV);
  player.yaw -= e.movementX * sens;
  player.pitch = clamp(player.pitch - e.movementY * sens, -1.45, 1.45);
});

document.addEventListener('wheel', (e) => {
  if (state === 'playing' && !player.building && Math.abs(e.deltaY) > 2) cycleWeapon(Math.sign(e.deltaY));
}, { passive: true });

canvas.addEventListener('mousedown', (e) => {
  if (state !== 'playing') return;
  if (document.pointerLockElement !== canvas) { lockPointer(); return; }
  if (e.button === 0) {
    if (player.building) placeWall();
    else { mouseDown = true; player.firedThisPress = false; }
  }
  if (e.button === 2) player.scoped = true;
});
document.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouseDown = false;
  if (e.button === 2) player.scoped = false;
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && state === 'playing') setState('paused');
});
window.addEventListener('blur', () => { if (state === 'playing') setState('paused'); });

for (const b of document.querySelectorAll('button.mode')) b.addEventListener('click', () => startGame(b.dataset.mode));
const sizeButtons = [...document.querySelectorAll('button.size')];
function setMapSize(size) {
  mapSize = size;
  for (const b of sizeButtons) b.classList.toggle('on', b.dataset.size === size);
}
for (const b of sizeButtons) b.addEventListener('click', () => setMapSize(b.dataset.size));
setMapSize('normal');
$('team-minus').addEventListener('click', () => { teamSize = Math.max(0, teamSize - 1); ui.teamCount.textContent = teamSize; });
$('team-plus').addEventListener('click', () => { teamSize = Math.min(8, teamSize + 1); ui.teamCount.textContent = teamSize; });
$('btn-restart').addEventListener('click', () => startGame());
$('btn-menu').addEventListener('click', goToMenu);
$('btn-menu-pause').addEventListener('click', goToMenu);
$('btn-continue').addEventListener('click', () => { setState('playing'); lockPointer(); });
$('btn-resume').addEventListener('click', () => {
  initAudio();
  setState('playing');
  lockPointer();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Update ----------
const tmp = new THREE.Vector3();

function updatePlayer(dt) {
  const forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  const strafe = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const speed = (sprint ? SPRINT_SPEED : WALK_SPEED) * player.speedMult * (player.powerT > 0 ? 1.3 : 1) * (camera.fov < 40 ? 0.5 : 1);

  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  let mx = -sin * forward + cos * strafe;
  let mz = -cos * forward - sin * strafe;
  const len = Math.hypot(mx, mz);
  if (len > 0) {
    mx /= len; mz /= len;
    player.pos.x += mx * speed * dt;
    player.pos.z += mz * speed * dt;
    if (player.onGround) player.bob += dt * speed * 1.6;
    const step = Math.floor(player.bob / Math.PI);
    if (step !== player.lastStep) {
      player.lastStep = step;
      if (player.onGround) sfx.step();
    }
  }
  pushOut(player.pos, PLAYER_RADIUS, player.pos.y);
  if (mode === 'wilds' && (Math.abs(player.pos.x) > bounds - 3 || Math.abs(player.pos.z) > bounds - 3) && (edgeToastT -= dt) <= 0) {
    edgeToastT = 3;
    showToast('🌫️ 世界的尽头 · Edge of the world');
  }

  if (keys.has('Space') && player.onGround) {
    player.vy = JUMP_SPEED;
    player.onGround = false;
  } else if (player.jetpack && keys.has('Space') && !player.onGround && player.fuel > 0 && player.pos.y - Math.max(terrainY(player.pos.x, player.pos.z), player.planet ? player.planet.y : 0) < 40) {
    player.vy = Math.min(player.vy + 38 * dt, 8);
    player.fuel = Math.max(0, player.fuel - dt * (mode === 'space' ? 0.15 : 0.3));
    if (Math.random() < dt * 12) sfx.jet();
    if (Math.random() < 0.5) burst(tmp.set(player.pos.x, player.pos.y - 0.2, player.pos.z), 0xff9a3d, 1, 2, 0.3);
  }
  player.vy -= (mode === 'space' ? SPACE_GRAVITY : GRAVITY) * dt;
  player.pos.y += player.vy * dt;
  const ground = groundHeightAt(player.pos.x, player.pos.z, PLAYER_RADIUS, player.pos.y);
  if (player.pos.y <= ground) {
    if (!player.onGround && player.vy < -9) {
      sfx.land();
      player.shake = Math.min(0.3, player.shake + 0.08);
    }
    player.pos.y = ground;
    player.vy = 0;
    player.onGround = true;
    if (mode === 'space') player.planet = planetAt(player.pos.x, player.pos.z) || player.planet;
    if (player.jetpack) player.fuel = Math.min(1, player.fuel + dt * 0.4);
  } else {
    player.onGround = false;
  }

  // Drifted off into space: bring the player back to their planet's launch pad
  if (mode === 'space' && player.planet && player.pos.y < player.planet.y - 60) {
    const sp = player.planet.spawn;
    player.pos.set(sp.x, terrainY(sp.x, sp.z), sp.z);
    player.vy = 0;
    showToast('🌌 掉进太空了！· Lost in space! −20 HP', 2000);
    damagePlayer(20);
  }

  // Timed effects
  player.powerT = Math.max(0, player.powerT - dt);
  player.shieldT = Math.max(0, player.shieldT - dt);
  player.shieldCd = Math.max(0, player.shieldCd - dt);
  if (player.regen && player.health < player.maxHealth) {
    player.health = Math.min(player.maxHealth, player.health + player.regen * dt);
    if (Math.random() < dt * 4) updateHealthUI();
  }
  ui.shieldFx.style.opacity = player.shieldT > 0 ? 1 : 0;
  ui.powerFx.style.opacity = player.powerT > 0 ? 1 : 0;

  // Camera (before firing so the shot uses this frame's aim)
  player.shake = Math.max(0, player.shake - dt * 1.5);
  camera.position.set(
    player.pos.x + (Math.random() - 0.5) * player.shake * 0.3,
    player.pos.y + EYE_HEIGHT + Math.sin(player.bob * 2) * 0.04 * (len > 0 && player.onGround ? 1 : 0),
    player.pos.z + (Math.random() - 0.5) * player.shake * 0.3,
  );
  camera.rotation.set(player.pitch, player.yaw, 0);
  const w = currentWeapon();
  const scoping = player.scoped && w.scope && !player.building && player.reloadT === 0 && player.switchT === 0;
  const targetFov = scoping ? SCOPE_FOV : BASE_FOV;
  if (Math.abs(camera.fov - targetFov) > 0.05) {
    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 14);
    camera.updateProjectionMatrix();
  }
  ui.scope.classList.toggle('hidden', camera.fov > 40);
  camera.updateMatrixWorld();

  // Weapon timers
  player.fireCd -= dt;
  player.switchT = Math.max(0, player.switchT - dt);
  if (player.reloadT > 0) {
    player.reloadT -= dt;
    if (player.reloadT <= 0) {
      player.reloadT = 0;
      player.ammo[player.reloadWeapon] = WEAPON_BY_ID[player.reloadWeapon].mag;
      updateAmmoUI();
    }
  }
  if (player.swingT > 0) {
    player.swingT -= dt;
    if (player.swingT <= 0) {
      player.swingT = 0;
      if (player.quickMelee) {
        player.quickMelee = false;
        player.switchT = 0.15;
      }
    }
  }
  if (!player.building && mouseDown && (w.auto || !player.firedThisPress)) {
    if (tryFire()) player.firedThisPress = true;
  }
  if (!w.melee && !player.building && !player.infiniteAmmo && player.ammo[w.id] === 0 && player.reloadT === 0 && player.fireCd <= 0) startReload();

  updateWeaponPose(dt, len > 0);
  updateGhost();
}

function updateWeaponPose(dt, moving) {
  const shown = player.quickMelee ? 'sword' : player.weapon;
  if (shown !== lastShown) {
    lastShown = shown;
    for (const [id, m] of Object.entries(models)) m.group.visible = id === shown;
    if (models[shown].muzzle) models[shown].muzzle.add(muzzleFlash, muzzleLight);
  }
  weaponHolder.visible = camera.fov > 40;

  const w = WEAPON_BY_ID[shown];
  player.recoil = Math.max(0, player.recoil - dt * 10);
  const reloading = player.reloadT > 0 ? Math.sin((1 - player.reloadT / player.reloadDur) * Math.PI) : 0;
  const dip = player.switchT / 0.25 + (player.building ? 0.6 : 0);
  const kick = w.kick || 1;
  weaponHolder.position.set(
    HOLDER_REST.x + Math.cos(player.bob) * 0.012,
    HOLDER_REST.y + Math.abs(Math.sin(player.bob)) * (moving ? 0.015 : 0) - reloading * 0.15 - dip * 0.25,
    HOLDER_REST.z + player.recoil * 0.07 * kick,
  );
  weaponHolder.rotation.set(player.recoil * 0.12 * kick - reloading * 0.8 - dip * 0.4, 0, reloading * 0.3);

  // Sword: wind-up → slash right-to-left → return
  const pivot = models.sword.group;
  if (player.swingT > 0) {
    const s = 1 - player.swingT / SWING_TIME;
    let z;
    if (s < 0.12) z = -0.9 * (s / 0.12);
    else if (s < 0.55) z = -0.9 + 2.6 * (1 - (1 - (s - 0.12) / 0.43) ** 3);
    else z = 1.7 * (1 - (s - 0.55) / 0.45);
    const arc = Math.sin(Math.PI * s);
    pivot.rotation.set(-0.7 * arc, 0, z);
    pivot.position.set(-0.3 * Math.max(0, z) / 1.7, 0.05 * arc, -0.12 * arc);
  } else {
    pivot.rotation.set(0, 0, 0);
    pivot.position.set(0, 0, 0);
  }
}

// Nearest living target for an enemy: the player or a teammate
function nearestTarget(g) {
  let best = 'player';
  let bestPos = player.pos;
  let bestD = dist2d(player.pos, g);
  for (const m of mates) {
    if (m.downT > 0) continue;
    const d = dist2d(m.group.position, g);
    if (d < bestD) { best = m; bestPos = m.group.position; bestD = d; }
  }
  return [best, bestPos, bestD || 0.001];
}

function updateEnemies(dt) {
  for (const e of enemies) {
    e.t += dt;
    if (e.flash > 0) {
      e.flash = Math.max(0, e.flash - dt * 8);
      for (const m of e.flashMats) m.emissive.copy(m.userData.baseEmissive).lerp(WHITE, e.flash);
    }
    const g = e.group.position;
    if (e.beacon) e.beacon.position.set(g.x, terrainY(g.x, g.z) + 35, g.z);
    const [tgt, tpos, dist] = nearestTarget(g);
    if (!e.aggro) {
      if (dist < (e.boss ? 34 : 26)) alertCamp(e);
      else {
        // Idle at camp
        if (e.flying) g.y = terrainY(g.x, g.z) + e.homeY + Math.sin(e.t * 2) * 0.4;
        if (e.ring) e.ring.rotation.z += dt * 2;
        continue;
      }
    }
    const nx = (tpos.x - g.x) / dist;
    const nz = (tpos.z - g.z) / dist;
    e.group.rotation.y = Math.atan2(nx, nz);
    if (e.flying) updateFlyer(e, dt, tgt, tpos, dist, nx, nz);
    else updateWalker(e, dt, tgt, tpos, dist, nx, nz);
    pushOut(g, e.radius, e.flying || e.leapT > 0 ? g.y - 0.6 : terrainY(g.x, g.z));
    if (e.planet) clampToPlanet(g, e.planet, e.radius + 1);
  }

  // Keep enemies from stacking on each other
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i].group.position;
      const b = enemies[j].group.position;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const min = enemies[i].radius + enemies[j].radius;
      if (Math.abs(dx) > min || Math.abs(dz) > min) continue;
      const d = Math.hypot(dx, dz);
      if (d > 0.001 && d < min) {
        const push = (min - d) / 2;
        a.x -= (dx / d) * push; a.z -= (dz / d) * push;
        b.x += (dx / d) * push; b.z += (dz / d) * push;
      }
    }
  }
}

function updateWalker(e, dt, tgt, tpos, dist, nx, nz) {
  const g = e.group.position;
  e.attackCd -= dt;
  e.specialCd -= dt;
  e.shootCd -= dt;

  // Spider leap in progress
  if (e.leapT > 0) {
    e.leapT -= dt;
    const k = 1 - Math.max(0, e.leapT) / e.leapDur;
    g.x = e.leapFrom.x + (e.leapTo.x - e.leapFrom.x) * k;
    g.z = e.leapFrom.z + (e.leapTo.z - e.leapFrom.z) * k;
    g.y = terrainY(g.x, g.z) + Math.sin(k * Math.PI) * 4;
    if (e.leapT <= 0) {
      g.y = terrainY(g.x, g.z);
      slam(e, 4, e.slamDmg);
    }
    return;
  }

  const wall = dist > e.reach ? blockingWall(e, nx, nz) : null;
  let moving = false;
  if (wall) {
    // Punch through the player's wall
    if (e.attackCd <= 0) {
      e.attackCd = 0.9;
      if (e.armL) e.armL.rotation.x = e.armR.rotation.x = -1.6;
      damageWall(wall, e.wallDmg);
    }
  } else if (dist > e.reach * 0.8) {
    steer(e, tpos.x, tpos.z, e.speed, dt);
    moving = true;
  }
  const stride = Math.sin(e.t * e.speed * (e.boss ? 1.2 : 2.2));
  if (moving && e.armL && e.attackCd < 0.6) {
    e.armL.rotation.x = stride * 0.7;
    e.armR.rotation.x = -stride * 0.7;
  }
  if (e.legs) for (const leg of e.legs) leg.rotation.x = moving ? Math.sin(e.t * 14 + leg.userData.phase) * 0.35 : 0;
  g.y = terrainY(g.x, g.z) + (e.boss ? 0 : Math.abs(stride) * 0.08);

  const ty = tgt === 'player' ? player.pos.y : tgt.group.position.y;
  if (dist < e.reach && Math.abs(ty - g.y) < e.vReach && e.attackCd <= 0) {
    e.attackCd = e.boss ? 1.3 * rage(e) : e.type === 'brute' ? 1.3 : 0.9;
    if (e.armL) e.armL.rotation.x = e.armR.rotation.x = -1.6;
    hitTarget(tgt, e.meleeDmg);
  }

  // Monster special moves
  if (e.slam && dist < 8 && e.specialCd <= 0) {
    e.specialCd = 5 * rage(e);
    slam(e, 7, e.slamDmg);
  }
  if (e.leap && dist > 6 && dist < 18 && e.specialCd <= 0) {
    e.specialCd = 4 * rage(e);
    e.leapFrom = g.clone();
    e.leapTo = new THREE.Vector3(tpos.x - nx * 2, 0, tpos.z - nz * 2);
    e.leapDur = e.leapT = 0.8;
    sfx.roar(camera.position.distanceTo(g));
  }
  if (e.volley && dist > 6 && dist < 45 && e.shootCd <= 0) {
    e.shootCd = 3 * rage(e);
    fireVolley(e, tgt);
  }
  if (e.boss) bossExtras(e, dt, tpos, dist);
}

// Shared monster tricks: missile/meteor barrages, raising skeletons, teleporting
function bossExtras(e, dt, tpos, dist) {
  e.barrageCd -= dt;
  e.summonCd -= dt;
  e.blinkCd -= dt;
  if (e.barrage && e.barrageCd <= 0 && dist < 45) {
    e.barrageCd = 7 * rage(e);
    const n = e.final ? 8 : 6;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const off = i === 0 ? 0 : rand(1.5, 7);
      strike(tpos.x + Math.cos(a) * off, tpos.z + Math.sin(a) * off, 1.2 + i * 0.12, 3.2, 18 + difficulty * 2, e.color);
    }
    showToast('⚠️ 小心红圈！WATCH THE RED CIRCLES!');
  }
  if (e.summoner && e.summonCd <= 0) {
    e.summonCd = 9 * rage(e);
    const alive = enemies.filter((o) => o.summonedBy === e).length;
    const g = e.group.position;
    for (let i = 0; i < Math.min(3, 6 - alive); i++) {
      const a = Math.random() * Math.PI * 2;
      spawnEnemy('grunt', { x: g.x + Math.cos(a) * 4, z: g.z + Math.sin(a) * 4, aggro: true, skeleton: true, summonedBy: e });
    }
    sfx.summon();
  }
  if (e.blinker && dist < 7 && e.blinkCd <= 0) {
    e.blinkCd = 5 * rage(e);
    const g = e.group.position;
    burst(enemyCenter(e), e.color, 20, 5, 0.6);
    const a = Math.random() * Math.PI * 2;
    const p = { x: g.x + Math.cos(a) * 14, z: g.z + Math.sin(a) * 14 };
    pushOut(p, e.radius, terrainY(p.x, p.z));
    g.x = p.x;
    g.z = p.z;
    burst(enemyCenter(e), e.color, 20, 5, 0.6);
    sfx.blink();
  }
}

function updateFlyer(e, dt, tgt, tpos, dist, nx, nz) {
  const g = e.group.position;
  e.specialCd -= dt;
  if (e.wings) {
    const f = Math.sin(e.t * (e.diveT > 0 ? 3 : 6)) * 0.55;
    e.wings[0].rotation.z = -f;
    e.wings[1].rotation.z = f;
  }

  // Dragon dive: swoop down through the target and climb back up
  if (e.diveT > 0) {
    e.diveT -= dt;
    const k = 1 - Math.max(0, e.diveT) / e.diveDur;
    g.x = e.diveFrom.x + (e.diveTo.x - e.diveFrom.x) * k;
    g.z = e.diveFrom.z + (e.diveTo.z - e.diveFrom.z) * k;
    g.y = terrainY(g.x, g.z) + 2.2 + (e.homeY - 2.2) * (1 - Math.sin(k * Math.PI));
    if (k > 0.3 && k < 0.7) {
      const reach = e.radius + 1.5;
      if (!e.diveHit.has('player') && dist2d(player.pos, g) < reach && Math.abs(player.pos.y + 1 - g.y) < 4) {
        e.diveHit.add('player');
        damagePlayer(e.orbDmg * 1.5);
      }
      for (const m of mates) {
        if (m.downT <= 0 && !e.diveHit.has(m) && dist2d(m.group.position, g) < reach) {
          e.diveHit.add(m);
          damageMate(m, e.orbDmg * 1.5);
        }
      }
    }
    return;
  }
  if (e.dive && e.specialCd <= 0 && dist < 35) {
    e.specialCd = 9 * rage(e);
    e.diveFrom = g.clone();
    e.diveTo = new THREE.Vector3(tpos.x + nx * 14, 0, tpos.z + nz * 14);
    e.diveDur = e.diveT = 1.8;
    e.diveHit = new Set();
    sfx.roar(camera.position.distanceTo(g));
  }
  e.strafeT -= dt;
  if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = rand(2, 4); }
  let radial = 0;
  if (dist > e.keepDist + 3) radial = 1;
  else if (dist < e.keepDist - 3) radial = -1;
  g.x += (nx * radial - nz * e.strafe * 0.7) * e.speed * dt;
  g.z += (nz * radial + nx * e.strafe * 0.7) * e.speed * dt;
  g.y = terrainY(g.x, g.z) + e.homeY + Math.sin(e.t * 2) * 0.4;
  if (e.ring) e.ring.rotation.z += dt * 4;
  e.shootCd -= dt;
  if (e.shootCd <= 0 && dist < 45) {
    fireVolley(e, tgt);
    e.shootCd = e.boss ? 2.2 * rage(e) : Math.max(1.1, 2.4 - difficulty * 0.12) + Math.random() * 0.8;
  }
  if (e.boss) bossExtras(e, dt, tpos, dist);
}

function updateProjectiles(dt) {
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i];
    o.mesh.position.addScaledVector(o.vel, dt);
    o.life -= dt;
    const pos = o.mesh.position;
    let hit = pos.distanceTo(tmp.set(player.pos.x, player.pos.y + 1.1, player.pos.z)) < 0.6 + o.mesh.scale.x * 0.2;
    if (hit) damagePlayer(o.dmg);
    if (!hit) {
      for (const m of mates) {
        if (m.downT <= 0 && pos.distanceTo(tmp.set(m.group.position.x, m.group.position.y + 1.1, m.group.position.z)) < 0.6 + o.mesh.scale.x * 0.2) {
          damageMate(m, o.dmg);
          hit = true;
          break;
        }
      }
    }
    if (hit || o.life <= 0 || insideSolid(pos)) {
      const wall = wallAt(pos);
      if (wall) damageWall(wall, o.splash ? 60 : 15);
      burst(pos, o.color, o.splash ? 18 : 6, o.splash ? 6 : 3, 0.4);
      if (o.splash) {
        // Boulders and fireballs explode where they land
        shockwave(pos, o.color, o.splash);
        if (!hit && pos.distanceTo(tmp.set(player.pos.x, player.pos.y + 1, player.pos.z)) < o.splash) damagePlayer(o.dmg * 0.6);
        for (const m of mates) if (m.downT <= 0 && dist2d(m.group.position, pos) < o.splash) damageMate(m, o.dmg * 0.6);
      }
      removeOrb(i);
    }
  }

  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.mesh.position.addScaledVector(r.vel, dt);
    r.life -= dt;
    const pos = r.mesh.position;
    burst(pos, 0xffa040, 1, 1, 0.35);
    const hitEnemy = enemies.some((e) => enemyCenter(e).distanceTo(pos) < e.radius + 0.5);
    if (hitEnemy || r.life <= 0 || insideSolid(pos)) {
      explode(pos.clone(), r.damage, r.splash);
      disposeGroup(r.mesh);
      rockets.splice(i, 1);
    }
  }
}

function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pk = pickups[i];
    pk.t += dt;
    pk.life -= dt;
    pk.group.rotation.y += dt * 2;
    pk.group.position.y = pk.baseY + 0.8 + Math.sin(pk.t * 3) * 0.15;
    pk.group.visible = pk.life > 4 || Math.sin(pk.t * 20) > 0;
    const close = dist2d(pk.group.position, player.pos) < 1.3 && player.pos.y - pk.baseY < 2;
    let used = false;
    if (close && pk.kind === 'health' && player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + 30);
      showToast('❤️ +30 HP');
      used = true;
    } else if (close && pk.kind === 'armor' && player.armor < player.maxArmor) {
      player.armor = Math.min(player.maxArmor, player.armor + 25);
      showToast('🛡️ +25 护甲 ARMOR');
      used = true;
    } else if (close && pk.kind === 'power') {
      player.powerT = 10;
      showToast('⭐ 超级状态！双倍伤害 + 加速 · POWER UP! 2× damage + speed', 2000);
      used = true;
    } else if (pk.kind === 'power') {
      // Teammates grab power stars too, and level up
      const m = mates.find((mm) => mm.downT <= 0 && dist2d(mm.group.position, pk.group.position) < 1.3);
      if (m) {
        levelUpMate(m);
        showToast(`⭐ ${m.name} 升级了！LEVEL UP → Lv${m.level}`);
        used = true;
      }
    }
    if (used) {
      updateHealthUI();
      pk.kind === 'power' ? sfx.power() : sfx.pickup();
      burst(pk.group.position, { armor: 0x4db8ff, health: 0x3dff9a, power: 0xffd23f }[pk.kind], 14, 3, 0.5);
    }
    if (used || pk.life <= 0) {
      disposeGroup(pk.group);
      pickups.splice(i, 1);
    }
  }

  for (let i = loot.length - 1; i >= 0; i--) {
    const l = loot[i];
    l.t += dt;
    l.icon.rotation.y += dt * 2;
    l.icon.position.y = 1.4 + Math.sin(l.t * 3) * 0.15;
    if (dist2d(l.group.position, player.pos) < 1.8 && player.pos.y - l.group.position.y < 2.5) {
      burst(l.group.position.clone().setY(1), l.kind === 'legend' ? 0xffd23f : 0x3d8bff, 30, 6, 0.8);
      disposeGroup(l.group);
      loot.splice(i, 1);
      openRewards(l.kind === 'legend' ? 'legend' : 'supply');
      return;
    }
  }
}

function updateWalls(dt) {
  for (const w of walls) {
    if (w.grow >= 1) continue;
    w.grow = Math.min(1, w.grow + dt * 6);
    w.mesh.scale.y = Math.max(0.01, w.grow);
    w.mesh.position.y = w.base + (WALL_H / 2) * w.grow;
  }
}

function updateEffects(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.vel.y -= 15 * dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    const floorY = terrainY(p.mesh.position.x, p.mesh.position.z) + 0.05;
    if (p.mesh.position.y < floorY) { p.mesh.position.y = floorY; p.vel.multiplyScalar(0.5); p.vel.y *= -0.4; }
    p.mesh.rotation.x += dt * 8;
    p.mesh.material.opacity = Math.max(0, p.life / p.max);
    if (p.life <= 0) { disposeMesh(p.mesh); particles.splice(i, 1); }
  }
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i];
    d.life -= dt;
    d.vel.y -= 18 * dt;
    d.mesh.position.addScaledVector(d.vel, dt);
    d.mesh.rotation.x += d.spin.x * dt;
    d.mesh.rotation.y += d.spin.y * dt;
    d.mesh.rotation.z += d.spin.z * dt;
    const fy = terrainY(d.mesh.position.x, d.mesh.position.z) + 0.1;
    if (d.mesh.position.y < fy) {
      d.mesh.position.y = fy;
      d.vel.set(d.vel.x * 0.6, -d.vel.y * 0.3, d.vel.z * 0.6);
      d.spin.multiplyScalar(0.6);
    }
    if (d.life < 0.6) d.mesh.material.opacity = Math.max(0, d.life / 0.6);
    if (d.life <= 0) removeDebris(i);
  }
  for (let i = tracers.length - 1; i >= 0; i--) {
    const t = tracers[i];
    t.life -= dt;
    t.mesh.material.opacity = Math.max(0, t.life / t.max);
    if (t.life <= 0) {
      if (t.ownGeo) t.mesh.geometry.dispose();
      disposeMesh(t.mesh);
      tracers.splice(i, 1);
    }
  }
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    f.life -= dt;
    const k = Math.max(0, f.life / f.max);
    if (f.kind === 'beam') {
      f.mesh.material.opacity = k * 0.6;
      f.mesh.scale.x = f.mesh.scale.z = 0.4 + f.life;
    } else {
      f.mesh.material.opacity = k * 0.55;
      f.mesh.scale.setScalar(0.2 + (1 - k) * f.size);
    }
    if (f.life <= 0) {
      if (f.ownGeo) f.mesh.geometry.dispose();
      disposeMesh(f.mesh);
      fx.splice(i, 1);
    }
  }

  muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * 80);
  if (muzzleLight.intensity <= 0) muzzleFlash.visible = false;
  boomLight.intensity = Math.max(0, boomLight.intensity - dt * 250);
  slashArc.material.opacity = Math.max(0, slashArc.material.opacity - dt * 5);
  slashArc.rotation.z = -0.25 + (1 - slashArc.material.opacity / 0.55) * 0.6;

  if (hitmarkerT > 0) {
    hitmarkerT -= dt;
    if (hitmarkerT <= 0) ui.hitmarker.classList.remove('show');
  }
  damageFlash = Math.max(0, damageFlash - dt * 1.5);
  const lowHp = state === 'playing' && player.health < player.maxHealth * 0.3 ? 0.25 + Math.sin(performance.now() / 200) * 0.1 : 0;
  ui.damage.style.opacity = Math.max(damageFlash, lowHp);
  if (centerRing) centerRing.rotation.z += dt * 0.3;
}

function drawRadar() {
  const W = 160;
  const c = W / 2;
  const range = openWorld() ? 70 : 35;
  const scale = (c - 8) / range;
  radarCtx.clearRect(0, 0, W, W);
  radarCtx.strokeStyle = 'rgba(80,240,255,0.25)';
  radarCtx.lineWidth = 1;
  for (const r of [c * 0.33, c * 0.66]) {
    radarCtx.beginPath(); radarCtx.arc(c, c, r, 0, Math.PI * 2); radarCtx.stroke();
  }
  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  const toRadar = (x, z) => {
    const dx = x - player.pos.x;
    const dz = z - player.pos.z;
    let rx = dx * cos - dz * sin;
    let fz = -dx * sin - dz * cos;
    const d = Math.hypot(rx, fz);
    if (d > range) { rx *= range / d; fz *= range / d; }
    return [c + rx * scale, c - fz * scale];
  };
  const dot = (x, z, color, size) => {
    const [sx, sy] = toRadar(x, z);
    radarCtx.fillStyle = color;
    radarCtx.beginPath();
    radarCtx.arc(sx, sy, size, 0, Math.PI * 2);
    radarCtx.fill();
  };
  const square = (x, z, color, size) => {
    const [sx, sy] = toRadar(x, z);
    radarCtx.fillStyle = color;
    radarCtx.fillRect(sx - size, sy - size, size * 2, size * 2);
  };
  radarCtx.strokeStyle = '#5ff6ff';
  radarCtx.lineWidth = 2;
  for (const w of walls) {
    const spansX = w.rect.maxX - w.rect.minX > w.rect.maxZ - w.rect.minZ;
    const cx = (w.rect.minX + w.rect.maxX) / 2;
    const cz = (w.rect.minZ + w.rect.maxZ) / 2;
    const [ax, ay] = toRadar(spansX ? w.rect.minX : cx, spansX ? cz : w.rect.minZ);
    const [bx, by] = toRadar(spansX ? w.rect.maxX : cx, spansX ? cz : w.rect.maxZ);
    radarCtx.beginPath(); radarCtx.moveTo(ax, ay); radarCtx.lineTo(bx, by); radarCtx.stroke();
  }
  for (const pk of pickups) dot(pk.group.position.x, pk.group.position.z, { armor: '#4db8ff', health: '#3dff9a', power: '#ffd23f' }[pk.kind], 2.5);
  for (const l of loot) square(l.group.position.x, l.group.position.z, l.kind === 'legend' ? '#ffd23f' : '#3d8bff', l.kind === 'legend' ? 5 : 3);
  for (const e of enemies) {
    if (e.boss) {
      const [sx, sy] = toRadar(e.group.position.x, e.group.position.z);
      radarCtx.fillStyle = hex(e.color);
      radarCtx.beginPath(); radarCtx.arc(sx, sy, 7, 0, Math.PI * 2); radarCtx.fill();
      radarCtx.strokeStyle = '#fff';
      radarCtx.lineWidth = 2;
      radarCtx.stroke();
    } else {
      dot(e.group.position.x, e.group.position.z, hex(e.color), e.type === 'brute' ? 5 : 3.5);
    }
  }
  for (const m of mates) if (m.downT <= 0) dot(m.group.position.x, m.group.position.z, hex(m.color), 3.5);
  // Player arrow (always pointing up)
  radarCtx.fillStyle = '#9ffcff';
  radarCtx.beginPath();
  radarCtx.moveTo(c, c - 7); radarCtx.lineTo(c - 5, c + 5); radarCtx.lineTo(c + 5, c + 5);
  radarCtx.closePath(); radarCtx.fill();
}

// ---------- Main loop ----------
const clock = new THREE.Clock();
let menuT = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state === 'playing') {
    playTime += dt;
    // Stop as soon as something opens a screen (reward, game over) so later steps can't override it
    const steps = [updatePlayer, updateMates, updateEnemies, updateProjectiles, updateStrikes, updatePickups, updateWalls, mode === 'arena' ? updateWaves : updateWilds];
    for (const step of steps) {
      if (state !== 'playing') break;
      step(dt);
    }
    updateEffects(dt);
    drawRadar();
    hudT -= dt;
    if (hudT <= 0) {
      hudT = 0.2;
      updateSlowHud();
    }
  } else if (state === 'travel') {
    updateTravel(dt);
    updateEffects(dt);
  } else if (state === 'over') {
    updateEffects(dt);
  } else if (state === 'menu') {
    menuT += dt * 0.12;
    const base = terrainY(0, 0);
    camera.position.set(Math.cos(menuT) * 30, base + 14, Math.sin(menuT) * 30);
    camera.lookAt(0, base, 0);
    if (centerRing) centerRing.rotation.z += dt * 0.3;
  }
  const focus = state === 'menu' ? new THREE.Vector3() : player.pos;
  sun.position.copy(focus).addScaledVector(sunDir, 80);
  sun.target.position.copy(focus);
  if (sky.visible) sky.position.copy(camera.position);
  stars.position.copy(camera.position);
  composer.render();
}

buildArena();
setState('menu');
frame();

// Handy for debugging in the console
window.neonArena = {
  player, enemies, walls, models, mates, loot, pickups,
  get state() { return state; },
  get mode() { return mode; },
  get wave() { return wave; },
  get monsters() { return { defeated: monstersDefeated, total: monstersTotal }; },
  startGame, spawnEnemy, openRewards, chooseReward, switchWeapon, toggleBuild, placeWall, quickMelee, addMate, useShield,
  damageEnemy, spawnFinalBoss, startWave, terrainY, openTravel, startTravel, setMapSize, get planets() { return planets; }, strikes, debris, MONSTERS,
};
