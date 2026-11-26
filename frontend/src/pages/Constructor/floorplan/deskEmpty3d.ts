import type {
  FurniturePack3D,
  ModelContext,
} from "@jbaysolutions/floorplan-elements/3d";
import * as THREE from "three";

export const DESK_EMPTY_KIND = "office/desk-empty";

/** Пустой стол: только столешница и ножки, без мониторов и периферии. */
function buildEmptyDesk(group: THREE.Group, ctx: ModelContext) {
  const w = Math.max(ctx.item.width || 140, 100);
  const d = Math.max(ctx.item.depth || 70, 50);
  const topH = 3;
  const h = 72;

  const wood = ctx.color("#d4c4a8", { roughness: 0.55, metalness: 0.05 });
  const metal = ctx.color("#6b7280", { roughness: 0.35, metalness: 0.55 });

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
  };

  // столешница
  add(w, topH, d, 0, h - topH / 2, 0, wood);

  // ножки
  const leg = 5;
  const insetX = w / 2 - 10;
  const insetZ = d / 2 - 8;
  for (const sx of [-1, 1] as const) {
    for (const sz of [-1, 1] as const) {
      add(leg, h - topH, leg, sx * insetX, (h - topH) / 2, sz * insetZ, metal);
    }
  }

  // лёгкая поперечина сзади (не монитор)
  add(w - 24, 3, 3, 0, 22, -d / 2 + 10, metal);
}

export const deskEmpty3D: FurniturePack3D = {
  name: "officesync-desk-empty-v1",
  models: [
    {
      kind: DESK_EMPTY_KIND,
      width: 140,
      depth: 70,
      height: "fixed",
      build: buildEmptyDesk,
    },
  ],
};
