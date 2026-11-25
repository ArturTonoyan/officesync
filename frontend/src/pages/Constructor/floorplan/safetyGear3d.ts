import type {
  FurniturePack3D,
  ModelContext,
} from "@jbaysolutions/floorplan-elements/3d";
import * as THREE from "three";
import {
  KIND_EXIT_ARROW,
  KIND_EXIT_SIGN,
  KIND_EXTINGUISHER,
  KIND_FIRE_SIGN,
  KIND_FIRST_AID,
} from "../components/SafetyGear/types";

/**
 * Pack merge сбрасывает UV — только ctx.color / геометрия, без CanvasTexture.
 * Спина предмета = −Z, лицо в комнату = +Z.
 */

const GREEN = "#00A651";
const GREEN_DARK = "#007A3D";
const RED = "#E30613";
const RED_DARK = "#B00510";
const WHITE = "#ffffff";
const METAL = "#2a2a2a";
const LABEL_BG = "#f5f5f5";

function addBox(
  group: THREE.Group,
  ctx: ModelContext,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  hex: string,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    ctx.color(hex),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addCyl(
  group: THREE.Group,
  ctx: ModelContext,
  rTop: number,
  rBot: number,
  h: number,
  x: number,
  y: number,
  z: number,
  hex: string,
  seg = 20,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, seg),
    ctx.color(hex),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

/** Стрелка внутри плоскости знака (выдавлена по +Z) */
function addInSquareArrow(
  group: THREE.Group,
  ctx: ModelContext,
  cx: number,
  cy: number,
  z: number,
  scale: number,
) {
  const shape = new THREE.Shape();
  shape.moveTo(-9, -3.2);
  shape.lineTo(1.5, -3.2);
  shape.lineTo(1.5, -6.5);
  shape.lineTo(10, 0);
  shape.lineTo(1.5, 6.5);
  shape.lineTo(1.5, 3.2);
  shape.lineTo(-9, 3.2);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.4,
    bevelEnabled: false,
  });
  const mesh = new THREE.Mesh(geo, ctx.color(WHITE));
  mesh.scale.set(scale, scale, 1);
  mesh.position.set(cx, cy, z);
  mesh.castShadow = true;
  group.add(mesh);
}

/** Упрощённый «бегущий человек» из боксов */
function addRunningMan(
  group: THREE.Group,
  ctx: ModelContext,
  cx: number,
  cy: number,
  z: number,
  s: number,
) {
  const m = ctx.color(WHITE);
  // голова
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.8 * s, 10, 10), m);
  head.position.set(cx, cy + 6.2 * s, z);
  group.add(head);
  // тело
  addBox(group, ctx, 2.6 * s, 5.5 * s, 1.2 * s, cx, cy + 2.2 * s, z, WHITE);
  // рука вперёд
  addBox(group, ctx, 4.5 * s, 1.3 * s, 1.1 * s, cx + 2.8 * s, cy + 3.5 * s, z, WHITE);
  // ноги
  addBox(group, ctx, 1.4 * s, 4.5 * s, 1.1 * s, cx - 1.2 * s, cy - 2.5 * s, z, WHITE);
  addBox(group, ctx, 1.4 * s, 4.5 * s, 1.1 * s, cx + 1.4 * s, cy - 2.8 * s, z, WHITE);
}

function buildExtinguisher(group: THREE.Group, ctx: ModelContext) {
  addBox(group, ctx, 18, 2, 10, 0, 12, -2, METAL);
  addBox(group, ctx, 4, 55, 2, 0, 40, -6, METAL);
  addCyl(group, ctx, 7.5, 8.5, 48, 0, 42, 0, RED);
  addCyl(group, ctx, 8.5, 8.5, 2, 0, 17, 0, RED_DARK);
  addCyl(group, ctx, 3.2, 4.5, 7, 0, 69, 0, METAL);
  addBox(group, ctx, 10, 3, 4, 2, 74, 0, METAL);
  addBox(group, ctx, 2, 10, 2, -5, 76, 0, METAL);
  addBox(group, ctx, 12, 2, 2, 0, 80, 0, METAL);
  addBox(group, ctx, 2, 8, 2, 5, 77, 0, METAL);
  const hose = addCyl(group, ctx, 1.4, 1.4, 18, 11, 66, 2, "#1a1a1a", 10);
  hose.rotation.z = Math.PI / 2.2;
  addCyl(group, ctx, 3.5, 1.6, 6, 18, 62, 3, METAL, 10);
  addBox(group, ctx, 11, 16, 0.5, 0, 42, 8.2, LABEL_BG);
  addBox(group, ctx, 9, 3, 0.4, 0, 47, 8.5, RED);
  addBox(group, ctx, 6, 5, 0.4, 0, 40, 8.5, RED);
}

/**
 * Аптечка: зелёный шкаф + белый крест (ISO 7010 E003).
 * Крест на +Z и −Z — какая сторона к комнате, крест виден.
 */
function buildFirstAid(group: THREE.Group, ctx: ModelContext) {
  const y = 145;
  const w = 40;
  const h = 32;
  const d = 12;

  // корпус один раз
  addBox(group, ctx, w, h, d, 0, y, 0, GREEN);
  addBox(group, ctx, w * 1.02, 2, d * 1.02, 0, y + h / 2 + 0.5, 0, GREEN_DARK);
  addBox(group, ctx, w * 1.02, 2, d * 1.02, 0, y - h / 2 - 0.5, 0, GREEN_DARK);

  const paintFace = (sign: 1 | -1) => {
    const zDoor = sign * (d / 2 + 0.7);
    const zOut = sign * (d / 2 + 2.2);

    addBox(group, ctx, w * 0.92, h * 0.88, 1.5, 0, y, zDoor, GREEN_DARK);
    addBox(group, ctx, w * 0.86, h * 0.8, 1.1, 0, y, zDoor + sign * 0.9, GREEN);

    // белый крест
    addBox(group, ctx, 22, 7, 1.6, 0, y + 2, zOut, WHITE);
    addBox(group, ctx, 7, 22, 1.6, 0, y + 2, zOut, WHITE);

    // петли / замок
    addBox(group, ctx, 2, 4, 2, -w * 0.4, y + 8, zOut, METAL);
    addBox(group, ctx, 2, 4, 2, -w * 0.4, y - 8, zOut, METAL);
    addBox(group, ctx, 2.5, 5, 2.2, w * 0.38, y, zOut + sign * 0.3, METAL);

    // полоска под крестом
    addBox(group, ctx, 24, 4.5, 1.2, 0, y - 12, zOut, GREEN_DARK);
    addBox(group, ctx, 18, 2.4, 1, 0, y - 12, zOut + sign * 0.5, WHITE);
  };

  paintFace(1);
  paintFace(-1);
}

/** Лицо знака на +Z (и копия на −Z через группу) */
function paintExitFace(
  group: THREE.Group,
  ctx: ModelContext,
  y: number,
  w: number,
  h: number,
  mode: "exit" | "arrow",
) {
  const zPlate = 2.2;
  addBox(group, ctx, w + 2, h + 2, 4, 0, y, 0, GREEN_DARK);
  addBox(group, ctx, w, h, 2.5, 0, y, 0.4, GREEN);

  if (mode === "exit") {
    addRunningMan(group, ctx, -w * 0.28, y, zPlate, 0.85);
    // рамка «дверь»
    addBox(group, ctx, 10, 12, 0.8, -w * 0.28, y, zPlate + 0.2, WHITE);
    addBox(group, ctx, 8, 10, 0.6, -w * 0.28, y, zPlate + 0.35, GREEN);
    // буквы «ВЫХОД» — блоки
    const letters = [-8, -3, 2, 7, 12];
    for (const lx of letters) {
      addBox(group, ctx, 3.2, 7, 1, w * 0.22 + lx, y, zPlate, WHITE);
    }
  } else {
    addRunningMan(group, ctx, -w * 0.28, y, zPlate, 0.75);
    // стрелка строго внутри квадрата
    addInSquareArrow(group, ctx, w * 0.18, y, zPlate, 0.85);
  }
}

function buildExitSign(group: THREE.Group, ctx: ModelContext) {
  const y = 210;
  const w = 46;
  const h = 20;
  paintExitFace(group, ctx, y, w, h, "exit");
  const back = new THREE.Group();
  back.rotation.y = Math.PI;
  group.add(back);
  paintExitFace(back, ctx, y, w, h, "exit");
}

function buildExitArrow(group: THREE.Group, ctx: ModelContext) {
  const y = 170;
  const w = 36;
  const h = 20;
  paintExitFace(group, ctx, y, w, h, "arrow");
  const back = new THREE.Group();
  back.rotation.y = Math.PI;
  group.add(back);
  paintExitFace(back, ctx, y, w, h, "arrow");
}

function buildFireSign(group: THREE.Group, ctx: ModelContext) {
  const y = 168;
  const s = 22;
  const paint = (g: THREE.Group) => {
    addBox(g, ctx, s + 1.5, s + 1.5, 3.5, 0, y, 0, RED_DARK);
    addBox(g, ctx, s, s, 2.2, 0, y, 0.3, RED);
    // пиктограмма огнетушителя
    addCyl(g, ctx, 3.5, 4, 12, -1, y - 1, 2.2, WHITE, 12);
    addBox(g, ctx, 2.5, 3, 1.5, -1, y + 7, 2.2, WHITE);
    addBox(g, ctx, 7, 1.5, 1.5, 3, y + 7.5, 2.2, WHITE);
    addBox(g, ctx, 6, 1.4, 1.4, 4, y + 3, 2.2, WHITE);
  };
  paint(group);
  const back = new THREE.Group();
  back.rotation.y = Math.PI;
  group.add(back);
  paint(back);
}

export const safetyGear3D: FurniturePack3D = {
  name: "safety-gear",
  models: [
    {
      kind: KIND_EXTINGUISHER,
      width: 28,
      depth: 28,
      height: "fixed",
      build: buildExtinguisher,
    },
    {
      kind: KIND_FIRST_AID,
      width: 40,
      depth: 18,
      height: "fixed",
      build: buildFirstAid,
    },
    {
      kind: KIND_EXIT_SIGN,
      width: 48,
      depth: 8,
      height: "fixed",
      build: buildExitSign,
    },
    {
      kind: KIND_EXIT_ARROW,
      width: 40,
      depth: 8,
      height: "fixed",
      build: buildExitArrow,
    },
    {
      kind: KIND_FIRE_SIGN,
      width: 22,
      depth: 6,
      height: "fixed",
      build: buildFireSign,
    },
  ],
};
