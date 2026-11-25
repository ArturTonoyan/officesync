import type {
  FurniturePack3D,
  ModelContext,
} from "@jbaysolutions/floorplan-elements/3d";
import * as THREE from "three";

export const FRIDGE_KIND = "office/mini-fridge";

/**
 * Вертикальный холодильник. Детали на +Z и −Z — чтобы не выглядел кубом
 * с любой стороны (встроенный kind `fridge` библиотеки как раз куб).
 */
function buildFridge(group: THREE.Group, ctx: ModelContext) {
  const w = Math.max(ctx.item.width || 60, 50);
  const d = Math.max(ctx.item.depth || 60, 50);
  const h = 170;
  const bodyW = w * 0.9;
  const bodyD = d * 0.85;
  const y0 = 3;

  const bodyMat = ctx.color("#c5ccd6", { roughness: 0.28, metalness: 0.55 });
  const doorMat = ctx.color("#d8dee8", { roughness: 0.3, metalness: 0.45 });
  const darkMat = ctx.color("#1e293b", { roughness: 0.4, metalness: 0.5 });
  const blackMat = ctx.color("#0f172a", { roughness: 0.55 });
  const accentMat = ctx.color("#64748b", { roughness: 0.45, metalness: 0.35 });

  const add = (
    gw: number,
    gh: number,
    gd: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // ножки
  for (const sx of [-1, 1] as const) {
    for (const sz of [-1, 1] as const) {
      add(3.2, y0, 3.2, sx * bodyW * 0.38, y0 / 2, sz * bodyD * 0.38, darkMat);
    }
  }

  // корпус
  add(bodyW, h, bodyD, 0, y0 + h / 2, 0, bodyMat);
  // верхняя крышка
  add(bodyW * 1.04, 4, bodyD * 1.04, 0, y0 + h + 1.5, 0, accentMat);

  const paintDoor = (sign: 1 | -1) => {
    const z0 = sign * (bodyD / 2);
    const doorT = 4;
    const zDoor = z0 + sign * (doorT / 2 + 0.2);

    // дверца
    add(bodyW * 0.94, h * 0.96, doorT, 0, y0 + h / 2, zDoor, doorMat);

    // чёрный зазор / уплотнитель по контуру
    add(bodyW * 0.98, 1.6, 0.8, 0, y0 + h * 0.97, zDoor + sign * 2.2, blackMat);
    add(bodyW * 0.98, 1.6, 0.8, 0, y0 + h * 0.03 + 2, zDoor + sign * 2.2, blackMat);
    add(1.6, h * 0.94, 0.8, -bodyW * 0.46, y0 + h / 2, zDoor + sign * 2.2, blackMat);
    add(1.6, h * 0.94, 0.8, bodyW * 0.46, y0 + h / 2, zDoor + sign * 2.2, blackMat);

    // линия морозилки
    const seamY = y0 + h * 0.7;
    add(bodyW * 0.9, 2.2, 1, 0, seamY, zDoor + sign * 2.4, blackMat);

    // толстая вертикальная ручка
    const hx = bodyW * 0.36;
    const handleH = h * 0.38;
    add(3.5, handleH, 3.5, hx, y0 + h * 0.4, zDoor + sign * 4.2, darkMat);
    add(2.2, 2.2, 5, hx, y0 + h * 0.4 + handleH * 0.4, zDoor + sign * 2.5, darkMat);
    add(2.2, 2.2, 5, hx, y0 + h * 0.4 - handleH * 0.4, zDoor + sign * 2.5, darkMat);

    // решётка снизу
    const grilleY = y0 + 10;
    add(bodyW * 0.75, 12, 1.5, 0, grilleY, zDoor + sign * 2.6, accentMat);
    for (let i = 0; i < 5; i++) {
      add(bodyW * 0.68, 1.1, 0.6, 0, grilleY - 4 + i * 2.2, zDoor + sign * 3.3, blackMat);
    }

    // шильдик
    add(14, 5, 0.8, 0, y0 + h * 0.88, zDoor + sign * 2.5, darkMat);
  };

  paintDoor(1);
  paintDoor(-1);
}

export const fridge3D: FurniturePack3D = {
  // v2 — новое имя, чтобы registerPack3D подхватил модель после HMR
  name: "officesync-fridge-v2",
  models: [
    {
      kind: FRIDGE_KIND,
      width: 60,
      depth: 60,
      height: "fixed",
      build: buildFridge,
    },
  ],
};
