import type {
  FurniturePack3D,
  ModelContext,
} from "@jbaysolutions/floorplan-elements/3d";
import * as THREE from "three";

/** Высота столешницы — периферия «лежит» на столе, а не на полу. */
const DESK_TOP_Y = 72;

function addBox(
  group: THREE.Group,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/** Монитор: подставка + ножка + экран. */
function buildMonitor(group: THREE.Group, ctx: ModelContext) {
  const w = Math.max(ctx.item.width || 52, 36);
  const d = Math.max(ctx.item.depth || 18, 12);
  const screenH = Math.min(34, w * 0.55);
  const bezel = 1.2;
  const y0 = DESK_TOP_Y;

  const plastic = ctx.color("#1e293b", { roughness: 0.45, metalness: 0.15 });
  const screen = ctx.color("#0ea5e9", {
    roughness: 0.25,
    metalness: 0.2,
    emissive: "#0284c7",
    emissiveIntensity: 0.18,
  });
  const dark = ctx.color("#0f172a", { roughness: 0.5 });

  // база
  addBox(group, w * 0.28, 1.6, d * 0.7, 0, y0 + 0.8, d * 0.05, plastic);
  // ножка
  addBox(group, 3.2, 14, 3.2, 0, y0 + 1.6 + 7, d * 0.08, plastic);
  // задняя панель / корпус
  addBox(
    group,
    w * 0.95,
    screenH,
    2.4,
    0,
    y0 + 1.6 + 14 + screenH / 2,
    -d * 0.15,
    plastic,
  );
  // экран
  addBox(
    group,
    w * 0.95 - bezel * 2,
    screenH - bezel * 2,
    0.6,
    0,
    y0 + 1.6 + 14 + screenH / 2,
    -d * 0.15 + 1.6,
    screen,
  );
  // тонкая подставка-кронштейн
  addBox(group, 8, 2, d * 0.35, 0, y0 + 1.6 + 13, -d * 0.02, dark);
}

/** Клавиатура: корпус + ряды клавиш. */
function buildKeyboard(group: THREE.Group, ctx: ModelContext) {
  const w = Math.max(ctx.item.width || 44, 30);
  const d = Math.max(ctx.item.depth || 16, 10);
  const h = 2.2;
  const y0 = DESK_TOP_Y;

  const body = ctx.color("#334155", { roughness: 0.55, metalness: 0.1 });
  const keys = ctx.color("#e2e8f0", { roughness: 0.4 });
  const accent = ctx.color("#64748b", { roughness: 0.45 });

  addBox(group, w, h, d, 0, y0 + h / 2, 0, body);
  // лёгкий наклон: задняя кромка выше
  addBox(group, w * 0.98, 0.6, d * 0.15, 0, y0 + h + 0.2, -d * 0.38, accent);

  const rows = 4;
  const cols = 14;
  const keyW = (w * 0.9) / cols;
  const keyD = (d * 0.72) / rows;
  const startX = -w * 0.45 + keyW / 2;
  const startZ = -d * 0.28 + keyD / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 3 && (c < 1 || c > 12)) continue;
      addBox(
        group,
        keyW * 0.78,
        0.55,
        keyD * 0.7,
        startX + c * keyW,
        y0 + h + 0.35,
        startZ + r * keyD,
        keys,
      );
    }
  }
}

/** Мышь. */
function buildMouse(group: THREE.Group, ctx: ModelContext) {
  const w = Math.max(ctx.item.width || 12, 8);
  const d = Math.max(ctx.item.depth || 18, 12);
  const y0 = DESK_TOP_Y;

  const bodyMat = ctx.color("#1e293b", { roughness: 0.35, metalness: 0.2 });
  const accent = ctx.color("#94a3b8", { roughness: 0.3, metalness: 0.35 });

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 14),
    bodyMat,
  );
  body.scale.set(w * 0.48, 2.4, d * 0.42);
  body.position.set(0, y0 + 2.2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // разделитель кнопок
  addBox(group, 0.5, 0.4, d * 0.35, 0, y0 + 3.6, -d * 0.08, accent);
  // колёсико
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 0.5, 12),
    accent,
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, y0 + 3.5, -d * 0.12);
  group.add(wheel);
}

/** Системный блок / ПК под стол. */
function buildCpu(group: THREE.Group, ctx: ModelContext) {
  const w = Math.max(ctx.item.width || 45, 20);
  const d = Math.max(ctx.item.depth || 50, 30);
  // вертикальная башня или горизонтальный mini — ориентируемся на пропорции
  const tall = d >= w;
  const caseW = tall ? Math.min(w, 22) : w * 0.9;
  const caseD = tall ? Math.min(d, 45) : d * 0.85;
  const caseH = tall ? 42 : 12;
  const y0 = tall ? 2 : 2;

  const body = ctx.color("#1f2937", { roughness: 0.4, metalness: 0.25 });
  const front = ctx.color("#111827", { roughness: 0.45 });
  const vent = ctx.color("#64748b", { roughness: 0.55, metalness: 0.3 });
  const led = ctx.color("#22c55e", {
    roughness: 0.3,
    emissive: "#16a34a",
    emissiveIntensity: 0.4,
  });

  addBox(group, caseW, caseH, caseD, 0, y0 + caseH / 2, 0, body);
  // передняя панель
  addBox(
    group,
    caseW * 0.92,
    caseH * 0.92,
    0.8,
    0,
    y0 + caseH / 2,
    caseD / 2 - 0.3,
    front,
  );
  // вентрешётка
  for (let i = 0; i < 5; i++) {
    addBox(
      group,
      caseW * 0.55,
      0.6,
      0.4,
      0,
      y0 + caseH * 0.25 + i * 2.2,
      caseD / 2 + 0.2,
      vent,
    );
  }
  // LED
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 10), led);
  dot.position.set(caseW * 0.28, y0 + caseH * 0.12, caseD / 2 + 0.5);
  group.add(dot);
}

/** Док-станция на столе. */
function buildDock(group: THREE.Group, ctx: ModelContext) {
  const w = Math.max(ctx.item.width || 40, 24);
  const d = Math.max(ctx.item.depth || 25, 16);
  const y0 = DESK_TOP_Y;
  const h = 4.5;

  const body = ctx.color("#334155", { roughness: 0.4, metalness: 0.2 });
  const top = ctx.color("#1e293b", { roughness: 0.35, metalness: 0.25 });
  const port = ctx.color("#0f172a", { roughness: 0.5 });
  const led = ctx.color("#38bdf8", {
    roughness: 0.3,
    emissive: "#0ea5e9",
    emissiveIntensity: 0.35,
  });

  addBox(group, w, h, d, 0, y0 + h / 2, 0, body);
  addBox(group, w * 0.92, 0.8, d * 0.75, 0, y0 + h + 0.3, -d * 0.05, top);

  // порты сзади
  for (const t of [-0.32, -0.12, 0.08, 0.28] as const) {
    addBox(
      group,
      3.2,
      1.4,
      0.6,
      w * t,
      y0 + h * 0.45,
      -d / 2 + 0.4,
      port,
    );
  }
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 10), led);
  light.position.set(w * 0.38, y0 + h + 0.6, d * 0.25);
  group.add(light);
}

export const deskGear3D: FurniturePack3D = {
  name: "officesync-desk-gear-v1",
  models: [
    {
      kind: "office/monitor",
      width: 52,
      depth: 18,
      height: "fixed",
      build: buildMonitor,
    },
    {
      kind: "office/keyboard",
      width: 44,
      depth: 16,
      height: "fixed",
      build: buildKeyboard,
    },
    {
      kind: "office/mouse",
      width: 12,
      depth: 18,
      height: "fixed",
      build: buildMouse,
    },
    {
      kind: "office/underdesk-cpu",
      width: 45,
      depth: 50,
      height: "fixed",
      build: buildCpu,
    },
    {
      kind: "office/docking-station",
      width: 40,
      depth: 25,
      height: "fixed",
      build: buildDock,
    },
  ],
};
