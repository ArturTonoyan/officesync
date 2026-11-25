import type {
  FurniturePack3D,
  ModelContext,
} from "@jbaysolutions/floorplan-elements/3d";
import * as THREE from "three";
import { EVAC_POSTER_KIND } from "../components/EvacuationMap/types";
import { getEvacPosterTexture } from "../components/EvacuationMap/evacCache";

/**
 * План эвакуации = зелёная рамка + PNG (запечённый SVG).
 * Pack merge выбрасывает UV → шейдер считает UV из position.
 */

function addBox(
  group: THREE.Group,
  mat: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  group.add(m);
}

function loadMapTexture(dataUrl: string): THREE.Texture {
  const tex = new THREE.TextureLoader().load(dataUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

function planMaterial(
  map: THREE.Texture,
  planeW: number,
  planeH: number,
  planeCx: number,
  planeCy: number,
  flipX = false,
): THREE.ShaderMaterial {
  const minX = planeCx - planeW / 2;
  const minY = planeCy - planeH / 2;
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      uMin: { value: new THREE.Vector2(minX, minY) },
      uSize: { value: new THREE.Vector2(planeW, planeH) },
      uFlipX: { value: flipX ? 1 : 0 },
    },
    vertexShader: /* glsl */ `
      uniform vec2 uMin;
      uniform vec2 uSize;
      uniform float uFlipX;
      varying vec2 vUv;
      void main() {
        float ux = (position.x - uMin.x) / uSize.x;
        float uy = (position.y - uMin.y) / uSize.y;
        vUv = vec2(uFlipX > 0.5 ? 1.0 - ux : ux, uy);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(map, vUv);
        gl_FragColor = c;
      }
    `,
    toneMapped: false,
    side: THREE.FrontSide,
  });
}

function buildEvacPoster(group: THREE.Group, ctx: ModelContext) {
  const board = 52;
  const thick = 2.8;
  const yBase = 132 + board / 2;
  const faceZ = thick / 2 + 0.15;
  const faceSize = board - 1.2;

  addBox(
    group,
    ctx.color("#0B6B38"),
    board + 2.5,
    board + 2.5,
    thick,
    0,
    yBase,
    0,
  );

  const dataUrl =
    getEvacPosterTexture(ctx.item.id) || getEvacPosterTexture(null);

  if (dataUrl) {
    const map = loadMapTexture(dataUrl);
    const frontMat = planMaterial(map, faceSize, faceSize, 0, yBase, false);
    const backMat = planMaterial(map, faceSize, faceSize, 0, yBase, true);

    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(faceSize, faceSize),
      frontMat,
    );
    front.position.set(0, yBase, faceZ);
    front.castShadow = false;
    group.add(front);

    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(faceSize, faceSize),
      backMat,
    );
    back.position.set(0, yBase, -faceZ);
    back.rotation.y = Math.PI;
    back.castShadow = false;
    group.add(back);
    return;
  }

  const cream = ctx.color("#FFFCE8");
  addBox(group, cream, faceSize, faceSize, 0.4, 0, yBase, faceZ);
  addBox(group, cream, faceSize, faceSize, 0.4, 0, yBase, -faceZ);
  addBox(
    group,
    ctx.color("#00A651"),
    faceSize * 0.7,
    1.2,
    0.5,
    0,
    yBase - 4,
    faceZ + 0.3,
  );
}

export const evacMap3D: FurniturePack3D = {
  name: "evac-map",
  models: [
    {
      kind: EVAC_POSTER_KIND,
      width: 60,
      depth: 4,
      height: "fixed",
      build: buildEvacPoster,
    },
  ],
};
