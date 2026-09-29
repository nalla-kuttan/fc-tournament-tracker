import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { TrophyKind } from './trophies';

// Procedural 3D trophies, one design per award. Everything is built from
// lathed profiles, extruded outlines and primitives, so there are no model
// files to load. Units: roughly 1 = a quarter of the trophy's height.

const materials = () => ({
  gold: new THREE.MeshPhysicalMaterial({ color: '#F2C150', metalness: 1, roughness: 0.2, clearcoat: 0.35, clearcoatRoughness: 0.2 }),
  paleGold: new THREE.MeshPhysicalMaterial({ color: '#FCE7A8', metalness: 1, roughness: 0.28 }),
  roseGold: new THREE.MeshPhysicalMaterial({ color: '#F4A582', metalness: 1, roughness: 0.22, clearcoat: 0.4 }),
  silver: new THREE.MeshPhysicalMaterial({ color: '#E4DEE0', metalness: 1, roughness: 0.18, clearcoat: 0.3 }),
  steel: new THREE.MeshPhysicalMaterial({ color: '#B9C2D6', metalness: 1, roughness: 0.3 }),
  lacquer: new THREE.MeshPhysicalMaterial({ color: '#2A0D16', metalness: 0.1, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 }),
  coral: new THREE.MeshPhysicalMaterial({ color: '#EA6C56', metalness: 0.2, roughness: 0.35, clearcoat: 0.8 }),
  blue: new THREE.MeshPhysicalMaterial({ color: '#334075', metalness: 0.3, roughness: 0.35, clearcoat: 0.8 }),
});

type Materials = ReturnType<typeof materials>;

function lathe(points: Array<[number, number]>, material: THREE.Material, segments = 72) {
  return new THREE.Mesh(new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments), material);
}

// A two-tier lacquered plinth with a gold band, round or square.
function plinth(m: Materials, shape: 'round' | 'square', width = 1.5) {
  const group = new THREE.Group();
  if (shape === 'round') {
    const low = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.62, width * 0.66, 0.38, 72), m.lacquer);
    low.position.y = 0.19;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.625, width * 0.625, 0.07, 72), m.gold);
    band.position.y = 0.3;
    const high = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.48, width * 0.54, 0.26, 72), m.lacquer);
    high.position.y = 0.51;
    group.add(low, band, high);
    group.userData.top = 0.64;
  } else {
    const low = new THREE.Mesh(new RoundedBoxGeometry(width * 1.1, 0.4, width * 0.8, 4, 0.06), m.lacquer);
    low.position.y = 0.2;
    const band = new THREE.Mesh(new RoundedBoxGeometry(width * 1.12, 0.07, width * 0.82, 2, 0.02), m.gold);
    band.position.y = 0.3;
    const high = new THREE.Mesh(new RoundedBoxGeometry(width * 0.85, 0.24, width * 0.6, 4, 0.05), m.lacquer);
    high.position.y = 0.52;
    group.add(low, band, high);
    group.userData.top = 0.64;
  }
  return group;
}

function handle(m: THREE.Material, side: 1 | -1) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.72, 3.05, 0),
    new THREE.Vector3(side * 1.25, 3.0, 0),
    new THREE.Vector3(side * 1.32, 2.55, 0),
    new THREE.Vector3(side * 1.02, 2.1, 0),
    new THREE.Vector3(side * 0.55, 1.95, 0),
  ]);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.065, 16, false), m);
}

// A gold crown with pointed tips, pearls and coral gems, for a title won
// without dropping a point.
function crown(m: Materials) {
  const group = new THREE.Group();
  const radius = 0.34;
  const bandMaterial = m.gold.clone();
  bandMaterial.side = THREE.DoubleSide;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.94, 0.2, 64, 1, true), bandMaterial);
  band.position.y = 0.1;
  const rimLow = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.95, 0.03, 12, 64), m.paleGold);
  rimLow.rotation.x = Math.PI / 2;
  const rimHigh = rimLow.clone();
  rimHigh.scale.setScalar(radius / (radius * 0.95));
  rimHigh.position.y = 0.2;
  group.add(band, rimLow, rimHigh);
  const points = 6;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.3, 4), m.gold);
    tip.position.set(Math.cos(angle) * radius * 0.97, 0.34, Math.sin(angle) * radius * 0.97);
    tip.rotation.y = -angle;
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), m.paleGold);
    pearl.position.set(tip.position.x, 0.51, tip.position.z);
    const gemAngle = angle + Math.PI / points;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), m.coral);
    gem.position.set(Math.cos(gemAngle) * radius * 1.01, 0.1, Math.sin(gemAngle) * radius * 1.01);
    gem.rotation.y = -gemAngle;
    group.add(tip, pearl, gem);
  }
  const cap = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), m.coral);
  cap.scale.y = 0.55;
  cap.position.y = 0.16;
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), m.paleGold);
  orb.position.y = 0.34;
  group.add(cap, orb);
  return group;
}

// Champion: a lidded two-handled cup on a round plinth.
function championCup(m: Materials, crowned = false) {
  const group = new THREE.Group();
  const base = plinth(m, 'round', 1.7);
  const cup = lathe([
    [0, 0], [0.62, 0], [0.62, 0.06], [0.5, 0.14], [0.2, 0.32], [0.15, 0.55], [0.26, 0.66], [0.26, 0.74], [0.14, 0.86],
    [0.15, 1.0], [0.4, 1.16], [0.66, 1.45], [0.8, 1.85], [0.86, 2.3], [0.9, 2.55], [0.98, 2.62], [0.96, 2.68], [0.84, 2.62], [0, 2.6],
  ], m.gold);
  const band = lathe([[0.83, 1.78], [0.86, 1.8], [0.9, 1.95], [0.87, 1.98], [0.84, 1.96]], m.paleGold);
  const lid = lathe([[0, 2.9], [0.82, 2.66], [0.9, 2.66], [0.86, 2.74], [0.5, 2.98], [0.18, 3.1], [0.14, 3.2], [0, 3.22]], m.gold);
  const top = new THREE.Group();
  top.add(cup, band, lid, handle(m.gold, 1), handle(m.gold, -1));
  if (crowned) {
    const topper = crown(m);
    topper.position.y = 3.14;
    topper.scale.setScalar(1.55);
    top.add(topper);
  } else {
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 16), m.paleGold);
    finial.position.y = 3.34;
    top.add(finial);
  }
  top.position.y = base.userData.top;
  group.add(base, top);
  return group;
}

// Runner-up: a silver medal on a French Blue ribbon, standing on an easel.
function runnerUpMedal(m: Materials) {
  const group = new THREE.Group();
  const base = plinth(m, 'square', 1.2);
  const stand = new THREE.Mesh(new RoundedBoxGeometry(0.18, 2.2, 0.18, 3, 0.05), m.lacquer);
  stand.position.set(0, base.userData.top + 1.1, -0.2);
  const medal = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.14, 96), m.silver);
  disc.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 16, 96), m.silver);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.035, 12, 96), m.silver);
  inner.position.z = 0.08;
  const star = extrudedStar(0.36, 0.15, 0.08, m.silver);
  star.position.z = 0.07;
  medal.add(disc, rim, inner, star);
  medal.position.set(0, base.userData.top + 1.55, 0);
  const ribbon = new THREE.Group();
  for (const side of [-1, 1]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.4, 0.03), m.blue);
    strip.position.set(side * 0.25, base.userData.top + 2.6, -0.05);
    strip.rotation.z = side * 0.32;
    ribbon.add(strip);
  }
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 12, 32), m.silver);
  loop.position.set(0, base.userData.top + 2.44, 0);
  group.add(base, stand, ribbon, loop, medal);
  return group;
}

function extrudedStar(outer: number, inner: number, depth: number, material: THREE.Material, points = 5) {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.5, bevelSize: outer * 0.06, bevelSegments: 3 });
  geometry.center();
  return new THREE.Mesh(geometry, material);
}

// Golden Boot: an extruded boot with studs and laces.
function goldenBoot(m: Materials) {
  const group = new THREE.Group();
  const base = plinth(m, 'square', 1.5);
  // Side view of the boot, toe to the right.
  const outline = new THREE.Shape();
  outline.moveTo(-0.95, 0);
  outline.lineTo(1.0, 0);
  outline.bezierCurveTo(1.3, 0, 1.42, 0.14, 1.36, 0.3);
  outline.bezierCurveTo(1.3, 0.46, 1.05, 0.5, 0.8, 0.56);
  outline.bezierCurveTo(0.5, 0.64, 0.25, 0.8, 0.05, 1.05);
  outline.lineTo(-0.12, 1.32);
  outline.bezierCurveTo(-0.35, 1.4, -0.7, 1.42, -0.92, 1.36);
  outline.bezierCurveTo(-1.08, 1.0, -1.12, 0.45, -0.95, 0);
  const depth = 0.5;
  const bootGeometry = new THREE.ExtrudeGeometry(outline, { depth, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.14, bevelSegments: 10, curveSegments: 48 });
  // Taper the slab into a boot: narrower toward the toe and the ankle.
  const position = bootGeometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const toe = THREE.MathUtils.clamp((x - 0.1) / 1.25, 0, 1);
    const ankle = THREE.MathUtils.clamp((y - 0.55) / 0.9, 0, 1);
    const narrow = (1 - 0.42 * toe * toe) * (1 - 0.25 * ankle);
    position.setZ(i, depth / 2 + (position.getZ(i) - depth / 2) * narrow);
  }
  bootGeometry.computeVertexNormals();
  // Outline coordinates, shifted so the boot is centred.
  const offset = new THREE.Vector3(-0.2, -0.7, -depth / 2);
  bootGeometry.translate(offset.x, offset.y, offset.z);
  const at = (x: number, y: number, z = 0) => new THREE.Vector3(x + offset.x, y + offset.y, z);
  const boot = new THREE.Mesh(bootGeometry, m.gold);
  const sole = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.1, 0.62, 3, 0.04), m.paleGold);
  sole.position.copy(at(0.2, -0.24));
  const studs = new THREE.Group();
  for (const x of [-0.7, -0.35, 0.35, 0.7, 1.0]) {
    for (const z of [-0.16, 0.16]) {
      const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.14, 16), m.paleGold);
      stud.position.copy(at(x, -0.34, z));
      studs.add(stud);
    }
  }
  // Laces across the vamp, which rises from (0.8, 0.56) to (0.05, 1.05).
  const laces = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const t = 0.15 + i * 0.22;
    const lace = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.46, 8), m.paleGold);
    lace.rotation.x = Math.PI / 2;
    lace.position.copy(at(0.8 - t * 0.75, 0.56 + t * 0.49 + 0.12));
    laces.add(lace);
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 12, 32), m.paleGold);
  collar.scale.set(1.35, 1, 0.8);
  collar.rotation.x = Math.PI / 2;
  collar.position.copy(at(-0.5, 1.45));
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 10, 48, Math.PI * 0.5), m.coral);
  stripe.rotation.z = Math.PI * 0.75;
  stripe.position.copy(at(-0.1, 0.25, depth / 2 + 0.17));
  const stripeBack = stripe.clone();
  stripeBack.position.z = -(depth / 2 + 0.17);
  const bootGroup = new THREE.Group();
  bootGroup.add(boot, sole, studs, laces, collar, stripe, stripeBack);
  bootGroup.rotation.y = -0.35;
  bootGroup.position.y = base.userData.top + 0.9;
  bootGroup.scale.setScalar(0.95);
  group.add(base, bootGroup);
  return group;
}

// Golden Ball: a faceted gold football in a cradle on a round plinth.
function goldenBall(m: Materials) {
  const group = new THREE.Group();
  const base = plinth(m, 'round', 1.4);
  const cradle = lathe([[0, 0], [0.42, 0], [0.42, 0.05], [0.16, 0.2], [0.12, 0.7], [0.3, 0.86], [0.46, 0.98], [0.44, 1.02], [0, 0.96]], m.gold);
  cradle.position.y = base.userData.top;
  const ballGeometry = new THREE.IcosahedronGeometry(0.82, 1);
  const ball = new THREE.Mesh(ballGeometry, new THREE.MeshPhysicalMaterial({ color: '#F2C150', metalness: 1, roughness: 0.16, clearcoat: 0.5, flatShading: true }));
  ball.position.y = base.userData.top + 1.72;
  const seams = new THREE.LineSegments(new THREE.EdgesGeometry(ballGeometry, 1), new THREE.LineBasicMaterial({ color: '#8A5A0B' }));
  seams.position.copy(ball.position);
  seams.scale.setScalar(1.002);
  group.add(base, cradle, ball, seams);
  return group;
}

// Star Man: a rose-gold star on a slim column.
function starMan(m: Materials) {
  const group = new THREE.Group();
  const base = plinth(m, 'square', 1.2);
  const column = lathe([[0, 0], [0.3, 0], [0.3, 0.08], [0.12, 0.2], [0.09, 1.3], [0.2, 1.42], [0.2, 1.48], [0, 1.48]], m.gold);
  column.position.y = base.userData.top;
  const star = extrudedStar(1.0, 0.44, 0.22, m.roseGold);
  star.position.y = base.userData.top + 2.35;
  const core = extrudedStar(0.45, 0.2, 0.3, m.coral);
  core.position.set(0, base.userData.top + 2.35, 0.08);
  group.add(base, column, star, core);
  return group;
}

// Iron Wall: a steel shield with a French Blue enamel face.
function ironWall(m: Materials) {
  const group = new THREE.Group();
  const base = plinth(m, 'square', 1.4);
  const shieldShape = (scale: number) => {
    const s = new THREE.Shape();
    s.moveTo(0, 1.25 * scale);
    s.lineTo(0.95 * scale, 0.95 * scale);
    s.lineTo(0.95 * scale, 0.05 * scale);
    s.bezierCurveTo(0.95 * scale, -0.75 * scale, 0.45 * scale, -1.1 * scale, 0, -1.35 * scale);
    s.bezierCurveTo(-0.45 * scale, -1.1 * scale, -0.95 * scale, -0.75 * scale, -0.95 * scale, 0.05 * scale);
    s.lineTo(-0.95 * scale, 0.95 * scale);
    s.closePath();
    return s;
  };
  const outer = new THREE.ExtrudeGeometry(shieldShape(1), { depth: 0.24, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 4, curveSegments: 24 });
  outer.center();
  const shield = new THREE.Mesh(outer, m.steel);
  const face = new THREE.ExtrudeGeometry(shieldShape(0.78), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 24 });
  face.center();
  const enamel = new THREE.Mesh(face, m.blue);
  enamel.position.z = 0.16;
  // A double chevron on the enamel face.
  const chevron = (y: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.5, y + 0.22);
    shape.lineTo(0, y - 0.1);
    shape.lineTo(0.5, y + 0.22);
    shape.lineTo(0.5, y + 0.02);
    shape.lineTo(0, y - 0.3);
    shape.lineTo(-0.5, y + 0.02);
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 2 }), m.silver);
    mesh.position.z = 0.2;
    return mesh;
  };
  const upper = chevron(0.25);
  const lower = chevron(-0.2);
  const shieldGroup = new THREE.Group();
  shieldGroup.add(shield, enamel, upper, lower);
  shieldGroup.position.y = base.userData.top + 1.55;
  group.add(base, shieldGroup);
  return group;
}

const BUILDERS: Record<TrophyKind, (m: Materials, crowned: boolean) => THREE.Group> = {
  title: championCup,
  'runner-up': runnerUpMedal,
  'golden-boot': goldenBoot,
  'golden-ball': goldenBall,
  motm: starMan,
  'best-defence': ironWall,
};

// A trophy centred on the origin, feet on y = 0, scaled to 4 units tall.
// `crowned` tops the champion cup with a crown (a perfect tournament).
export function buildTrophy(kind: TrophyKind, crowned = false) {
  const group = BUILDERS[kind](materials(), crowned);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  // Fit 4 units tall, or narrower if it's wide, so it never leaves the frame
  // while turning.
  const scale = Math.min(4 / size.y, 3.1 / Math.hypot(size.x, size.z));
  group.scale.setScalar(scale);
  const centre = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
  group.position.x -= centre.x;
  group.position.z -= centre.z;
  group.position.y -= new THREE.Box3().setFromObject(group).min.y;
  return group;
}

// Studio lighting shared by the sprite renderer and the live viewer: a warm
// key, a coral rim and a French Blue fill, over a soft studio reflection.
export function lightStudio(scene: THREE.Scene) {
  const key = new THREE.DirectionalLight('#FFE9D2', 2.4);
  key.position.set(3, 6, 5);
  const rim = new THREE.DirectionalLight('#FF8A73', 2.2);
  rim.position.set(-5, 3, -4);
  const fill = new THREE.DirectionalLight('#7E8CC2', 1.2);
  fill.position.set(-4, 1, 5);
  scene.add(key, rim, fill, new THREE.AmbientLight('#FFF7F6', 0.25));
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    for (const entry of Array.isArray(material) ? material : material ? [material] : []) {
      (entry as THREE.MeshBasicMaterial).map?.dispose();
      entry.dispose();
    }
  });
}
