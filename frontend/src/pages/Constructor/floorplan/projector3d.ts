import type {
  FurniturePack3D,
  ModelContext,
} from "@jbaysolutions/floorplan-elements/3d";
import * as THREE from "three";

export const PROJECTOR_KIND = "office/projector";

/**
 * Компактный проектор (корпус + объектив), а не экран/доска.
 */
function buildProjector(group: THREE.Group, ctx: ModelContext) {
  const w = Math.max(ctx.item.width || 40, 28);
  const d = Math.max(ctx.item.depth || 30, 22);
  const bodyH = 12;
  const y = 145; // потолочный / высокий монтаж — как обычно висит проектор

  const bodyMat = ctx.color("#2a2f38", { roughness: 0.45, metalness: 0.25 });
  const darkMat = ctx.color("#111827", { roughness: 0.35, metalness: 0.4 });
  const lensMat = ctx.color("#94a3b8", {
    roughness: 0.15,
    metalness: 0.55,
    emissive: "#64748b",
    emissiveIntensity: 0.12,
  });
  const ventMat = ctx.color("#1f2937", { roughness: 0.7 });

  // кронштейн к потолку
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 28, 10),
    darkMat,
  );
  arm.position.set(0, y + bodyH / 2 + 14, 0);
  arm.castShadow = true;
  group.add(arm);

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(16, 2, 16),
    darkMat,
  );
  plate.position.set(0, y + bodyH / 2 + 28, 0);
  plate.castShadow = true;
  group.add(plate);

  // корпус
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.92, bodyH, d * 0.88),
    bodyMat,
  );
  body.position.set(0, y, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // скос / верхняя панель
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.78, 1.2, d * 0.7),
    darkMat,
  );
  top.position.set(0, y + bodyH / 2 + 0.4, 0);
  group.add(top);

  // объектив спереди (−Z в локальных координатах пака — «лицо» предмета)
  const lensHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.8, 8, 20),
    darkMat,
  );
  lensHousing.rotation.x = Math.PI / 2;
  lensHousing.position.set(0, y, -d * 0.42);
  lensHousing.castShadow = true;
  group.add(lensHousing);

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.2, 2.2, 20),
    lensMat,
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, y, -d * 0.42 - 4.5);
  group.add(lens);

  // «стекло» объектива
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 20),
    ctx.color("#cbd5e1", {
      roughness: 0.05,
      metalness: 0.2,
      emissive: "#93c5fd",
      emissiveIntensity: 0.35,
    }),
  );
  glass.position.set(0, y, -d * 0.42 - 5.7);
  group.add(glass);

  // вентиляция сбоку
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {
      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 6.5, 0.4),
        ventMat,
      );
      slit.position.set(
        side * (w * 0.46),
        y + (i - 1.5) * 0.2,
        -d * 0.1 + i * 3.2,
      );
      group.add(slit);
    }
  }
}

export const projector3D: FurniturePack3D = {
  name: "officesync-projector",
  models: [
    {
      kind: PROJECTOR_KIND,
      width: 40,
      depth: 30,
      height: "fixed",
      build: buildProjector,
    },
  ],
};
