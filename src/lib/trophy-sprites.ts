import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildTrophy, disposeObject, lightStudio } from './trophy-models';
import type { TrophyKind } from './trophies';

// Renders each trophy once into a turntable sprite sheet (a strip of frames
// around 360°), using a single WebGL context for the whole trophy case.
// Pages then show plain images and step through frames on hover.

export const SPRITE_FRAMES = 24;
export const SPRITE_WIDTH = 180;
export const SPRITE_HEIGHT = 240;
const PIXEL_RATIO = 1.5;
// Frame 0 is a three-quarter view.
const START_ANGLE = -0.5;

let studio: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera } | null | undefined;
const sheets = new Map<string, Promise<string | null>>();
let queue: Promise<unknown> = Promise.resolve();

export function contactShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 4.2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.005;
  return plane;
}

export function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

function getStudio() {
  if (studio !== undefined) return studio;
  try {
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(PIXEL_RATIO);
    renderer.setSize(SPRITE_WIDTH, SPRITE_HEIGHT, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.environment = studioEnvironment(renderer);
    lightStudio(scene);
    scene.add(contactShadow());
    const camera = new THREE.PerspectiveCamera(26, SPRITE_WIDTH / SPRITE_HEIGHT, 0.1, 100);
    camera.position.set(0, 2.9, 10.2);
    camera.lookAt(0, 2.05, 0);
    studio = { renderer, scene, camera };
  } catch {
    // No WebGL: callers fall back to flat icons.
    studio = null;
  }
  return studio;
}

function render(kind: TrophyKind, crowned: boolean): string | null {
  const setup = getStudio();
  if (!setup) return null;
  const { renderer, scene, camera } = setup;
  const trophy = buildTrophy(kind, crowned);
  scene.add(trophy);
  const frameWidth = SPRITE_WIDTH * PIXEL_RATIO;
  const frameHeight = SPRITE_HEIGHT * PIXEL_RATIO;
  const sheet = document.createElement('canvas');
  sheet.width = frameWidth * SPRITE_FRAMES;
  sheet.height = frameHeight;
  const context = sheet.getContext('2d');
  if (!context) return null;
  for (let frame = 0; frame < SPRITE_FRAMES; frame++) {
    trophy.rotation.y = START_ANGLE + (frame / SPRITE_FRAMES) * Math.PI * 2;
    renderer.render(scene, camera);
    context.drawImage(renderer.domElement, frame * frameWidth, 0, frameWidth, frameHeight);
  }
  scene.remove(trophy);
  disposeObject(trophy);
  return sheet.toDataURL('image/webp', 0.9);
}

// One sheet per trophy design, rendered at most once per page load, one at a time.
export function getTrophySheet(kind: TrophyKind, crowned = false): Promise<string | null> {
  const key = `${kind}${crowned ? ':crowned' : ''}`;
  let sheet = sheets.get(key);
  if (!sheet) {
    sheet = queue.then(() => new Promise<string | null>((resolve) => {
      // Yield between kinds so the page stays responsive.
      requestAnimationFrame(() => {
        try {
          resolve(render(kind, crowned));
        } catch {
          resolve(null);
        }
      });
    }));
    queue = sheet;
    sheets.set(key, sheet);
  }
  return sheet;
}
