import type { FloorPlan, Marker, Furniture } from "@jbaysolutions/floorplan-react";
import type {
  FurniturePack3D,
  ModelContext,
} from "@jbaysolutions/floorplan-elements/3d";
import * as THREE from "three";
import { mapKindFor3d } from "./mapKindsFor3d";

export const PERSON_KIND = "officesync/person";

const SHIRT = ["#3b82f6", "#6366f1", "#0d9488", "#db2777", "#ea580c", "#4f46e5"];
const PANTS = ["#1e293b", "#334155", "#3f3f46", "#1f2937"];
const SKIN = ["#f1c27d", "#e0ac69", "#c68642", "#ffdbac"];
const HAIR = ["#1c1917", "#44403c", "#78350f", "#a8a29e", "#0f172a"];

const CHAIR_KINDS = new Set([
  "office/task-chair",
  "office/executive-chair",
  "office/meeting-chair",
  "office/visitor-chair",
  "office/stool",
  "office/lounge-chair",
]);

const DESK_KINDS = new Set([
  "office/desk",
  "office/desk-dual",
  "office/standing-desk",
  "office/corner-desk",
  "office/hot-desk",
  "office/reception",
  "office/executive-desk",
]);

function box(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  rotX = 0,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  if (rotX) mesh.rotation.x = rotX;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cyl(
  parent: THREE.Object3D,
  rTop: number,
  rBot: number,
  h: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  seg = 12,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, seg),
    mat,
  );
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function sphere(
  parent: THREE.Object3D,
  r: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Сидящий человек на стуле (сиденье ~44 см).
 * Лицо в +z (к столу, если стул развёрнут спинкой в −z).
 */
function buildPerson(group: THREE.Group, ctx: ModelContext) {
  const rnd = ctx.rnd;
  const shirt = ctx.color(SHIRT[Math.floor(rnd() * SHIRT.length)]!);
  const pants = ctx.color(PANTS[Math.floor(rnd() * PANTS.length)]!);
  const skin = ctx.color(SKIN[Math.floor(rnd() * SKIN.length)]!);
  const hair = ctx.color(HAIR[Math.floor(rnd() * HAIR.length)]!);
  const shoe = ctx.theme("black");

  const seatY = 44;

  // голени (вертикально под сиденьем)
  for (const x of [-8, 8]) {
    cyl(group, 3.2, 3.6, 28, x, 4, 10, pants, 10);
    box(group, 8, 4, 12, x, 0, 14, shoe);
  }

  // бёдра на сиденье, вперёд к столу (+z)
  for (const x of [-8, 8]) {
    box(group, 9, 9, 32, x, seatY - 2, 2, pants);
  }

  // таз
  box(group, 26, 12, 22, 0, seatY - 2, -2, pants);

  // торс
  box(group, 28, 40, 16, 0, seatY + 10, -4, shirt);

  // руки на коленях / вдоль тела
  for (const x of [-17, 17]) {
    box(group, 7, 28, 7, x, seatY + 18, 2, shirt);
    cyl(group, 2.6, 2.8, 10, x, seatY + 8, 12, skin, 8);
  }

  // шея + голова
  cyl(group, 4, 4.5, 8, 0, seatY + 50, -4, skin, 10);
  sphere(group, 11, 0, seatY + 68, -3, skin);
  sphere(group, 11.2, 0, seatY + 71, -4, hair).scale.set(1.05, 0.72, 1.05);
}

export const people3D: FurniturePack3D = {
  name: "people",
  models: [
    {
      kind: PERSON_KIND,
      width: 45,
      depth: 50,
      height: "fixed",
      build: buildPerson,
    },
  ],
};

function isChair(kind: string) {
  const k = mapKindFor3d(kind);
  return CHAIR_KINDS.has(k) || /chair|stool|кресл|стул/i.test(kind);
}

function isDesk(kind: string) {
  const k = mapKindFor3d(kind);
  return DESK_KINDS.has(k) || /desk|table|стол/i.test(kind);
}

/** Ближайший стул к маркеру; иначе оценка места у стола */
function seatPoseForMarker(
  furniture: Furniture[],
  marker: Marker,
): { x: number; y: number; rotation: number } {
  let bestChair: Furniture | null = null;
  let bestChairDist = 90; // см — стул должен быть рядом с рабочим местом
  let bestDesk: Furniture | null = null;
  let bestDeskDist = 120;

  for (const f of furniture) {
    const kind = String(f.kind);
    if (kind === PERSON_KIND || kind.startsWith("person_")) continue;
    const d = Math.hypot(f.x - marker.x, f.y - marker.y);
    if (isChair(kind) && d < bestChairDist) {
      bestChair = f;
      bestChairDist = d;
    }
    if (isDesk(kind) && d < bestDeskDist) {
      bestDesk = f;
      bestDeskDist = d;
    }
  }

  if (bestChair) {
    return {
      x: bestChair.x,
      y: bestChair.y,
      // спинка стула в −local y; разворачиваем человека лицом к столу
      rotation: (bestChair.rotation || 0) + 180,
    };
  }

  if (bestDesk) {
    const rot = bestDesk.rotation || 0;
    const rad = (rot * Math.PI) / 180;
    // место сидения — со стороны «лица» стола (+local y), ~55 см от центра
    const dist = Math.max(bestDesk.depth || 70, 55) * 0.55 + 35;
    const ox = Math.sin(rad) * dist;
    const oy = Math.cos(rad) * dist;
    return {
      x: bestDesk.x + ox,
      y: bestDesk.y + oy,
      rotation: rot + 180,
    };
  }

  // запасной вариант: чуть сместить маркер «назад»
  return { x: marker.x, y: marker.y + 40, rotation: 180 };
}

/**
 * План только для 3D-просмотра (не сохраняется):
 * — kind мебели → модели из office pack
 * — маркеры → сидящие люди на стульях
 */
export function planWithPeopleMarkers(
  plan: FloorPlan,
  markers: Marker[],
  opts: { showPeople?: boolean } = {},
): FloorPlan {
  const showPeople = opts.showPeople !== false;
  const next: FloorPlan = JSON.parse(JSON.stringify(plan));
  for (const floor of next.floors) {
    floor.furniture = (floor.furniture || []).map((f) => ({
      ...f,
      kind: mapKindFor3d(String(f.kind)) as typeof f.kind,
    }));
  }
  if (!showPeople) return next;
  for (const marker of markers) {
    const floor =
      next.floors.find((f) => f.id === marker.floor) || next.floors[0];
    if (!floor) continue;
    floor.furniture = floor.furniture || [];
    const id = `person_${marker.id}`;
    if (floor.furniture.some((f) => f.id === id)) continue;
    const seat = seatPoseForMarker(floor.furniture, marker);
    floor.furniture.push({
      id,
      kind: PERSON_KIND as never,
      x: seat.x,
      y: seat.y,
      width: 45,
      depth: 50,
      rotation: seat.rotation,
    });
  }
  return next;
}
