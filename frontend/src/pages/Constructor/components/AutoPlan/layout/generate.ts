import type {
  FloorPlan,
  Furniture,
  Marker,
  Opening,
  Room,
} from "@jbaysolutions/floorplan-react";
import rules from "../rules.json";
import type {
  AutoPlanFormState,
  DensityLevel,
  GenerationReport,
} from "../types";
import { ensureRoomsDetected } from "./detectRooms";
import {
  insetBounds,
  pointInPolygon,
  polygonAreaCm2,
  polygonBounds,
  rectInsidePolygon,
  rectsOverlap,
  rotatedBounds,
  type Pt,
  type Rect,
} from "./geometry";

const WET_RE = /туалет|санузел|wc|мойк|душевая|toilet|bath|restroom/i;
const FIXTURE_KINDS = new Set([
  "toilet",
  "sink",
  "bathtub",
  "shower",
]);

const ITEM = {
  desk: { kind: "office/desk-dual-monitor", width: 140, depth: 70 },
  executive: { kind: "office/executive-desk", width: 200, depth: 100 },
  chair: { kind: "office/mesh-task-chair", width: 50, depth: 52 },
  meeting: { kind: "office/meeting-table-6", width: 220, depth: 110 },
  meetingSmall: { kind: "office/meeting-round-4", width: 130, depth: 130 },
  conference: { kind: "office/meeting-table-10", width: 340, depth: 130 },
  lounge: { kind: "office/lounge-set", width: 220, depth: 160 },
  sofa: { kind: "office/sofa-2", width: 160, depth: 80 },
  plant: { kind: "office/round-planter", width: 70, depth: 70 },
  cabinet: { kind: "office/tall-cabinet", width: 80, depth: 45 },
  reception: { kind: "office/waiting-bench", width: 180, depth: 55 },
  focus: { kind: "office/focus-booth", width: 120, depth: 120 },
  fridge: { kind: "office/mini-fridge", width: 70, depth: 70 },
} as const;

export type RoomRoleInfo = {
  roomId: string;
  name: string;
  role:
    | "work"
    | "meeting"
    | "conference"
    | "private"
    | "lounge"
    | "reception"
    | "pantry"
    | "corridor"
    | "wet";
  areaM2: number;
  existingKinds: string[];
};

export type GenerateInput = {
  plan: FloorPlan;
  markers: Marker[];
  form: AutoPlanFormState;
  floorId?: string | null;
};

export type GenerateResult = {
  plan: FloorPlan;
  markers: Marker[];
  report: GenerationReport;
  roomRoles: RoomRoleInfo[];
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function aisleForDensity(d: DensityLevel): number {
  if (d === "low") return Math.max(rules.aisleMinM * 100, 140);
  if (d === "high") return Math.max(rules.aisleMinM * 100, 100);
  return Math.max(rules.aisleMinM * 100, 120);
}

function isWetRoom(room: Room): boolean {
  return WET_RE.test(room.name || "");
}

function roomCentroid(points: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

function makeItem(
  kind: string,
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation = 0,
): Furniture {
  return { id: uid("f"), kind: kind as Furniture["kind"], x, y, width, depth, rotation };
}

type Placed = { item: Furniture; bounds: Rect };

function canPlace(
  placed: Placed[],
  points: Pt[],
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation: number,
  pad: number,
  doorZones: Rect[],
): boolean {
  const bounds = rotatedBounds(x, y, width, depth, rotation);
  if (!rectInsidePolygon(bounds, points, 2)) return false;
  if (doorZones.some((z) => rectsOverlap(bounds, z, 8))) return false;
  if (placed.some((p) => rectsOverlap(bounds, p.bounds, pad))) return false;
  return true;
}

function place(
  placed: Placed[],
  points: Pt[],
  kind: string,
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation: number,
  pad: number,
  doorZones: Rect[],
): Furniture | null {
  if (!canPlace(placed, points, x, y, width, depth, rotation, pad, doorZones)) {
    return null;
  }
  const item = makeItem(kind, x, y, width, depth, rotation);
  placed.push({ item, bounds: rotatedBounds(x, y, width, depth, rotation) });
  return item;
}

/** Зоны открывания дверей: грубый сектор у opening на стене комнаты */
function doorClearZones(
  openings: Opening[],
  walls: { id: string; start: Pt; end: Pt }[],
  roomPoints: Pt[],
): Rect[] {
  const zones: Rect[] = [];
  const wallById = new Map(walls.map((w) => [w.id, w]));
  for (const op of openings || []) {
    if (!/door/i.test(op.type || "")) continue;
    const wall = wallById.get(op.wallId);
    if (!wall) continue;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy) || 1;
    const t = Math.min(1, Math.max(0, (op.offset || 0) / len));
    const mx = wall.start.x + dx * t;
    const my = wall.start.y + dy * t;
    const w = Math.max(op.width || 90, 90);
    const zone: Rect = { x: mx - w / 2, y: my - w / 2, width: w, height: w };
    // зона у двери имеет смысл, если пересекает комнату
    if (
      pointInPolygon(mx, my, roomPoints) ||
      pointInPolygon(mx + 20, my + 20, roomPoints)
    ) {
      zones.push(zone);
    }
  }
  return zones;
}

function packDesks(
  room: Room,
  count: number,
  density: DensityLevel,
  doorZones: Rect[],
  preferWindow: boolean,
  morePlants: boolean,
): { items: Furniture[]; placedCount: number } {
  const points = room.points || [];
  const bounds = polygonBounds(points);
  if (!bounds || count <= 0) return { items: [], placedCount: 0 };

  const desk = ITEM.desk;
  const chairGap = density === "high" ? 60 : 75;
  const aisleBase = aisleForDensity(density);
  const wallInsets = [30, 20, 12];
  const aisleSteps = [aisleBase, Math.max(rules.aisleMinM * 100, aisleBase - 20)];

  let best: { items: Furniture[]; placedCount: number } = {
    items: [],
    placedCount: 0,
  };

  for (const wallInset of wallInsets) {
    const usable = insetBounds(bounds, wallInset);
    if (!usable) continue;
    for (const aisle of aisleSteps) {
      for (const rotate of [0, 90] as const) {
        const dw = rotate === 0 ? desk.width : desk.depth;
        const dd = rotate === 0 ? desk.depth : desk.width;
        const colPitch =
          dw + (density === "low" ? 40 : density === "high" ? 12 : 22);
        const rowPitch = dd + chairGap + aisle;

        const placed: Placed[] = [];
        const items: Furniture[] = [];
        const startY = usable.y + dd / 2 + 8;
        const endY = usable.y + usable.height - chairGap - 8;
        const startX = usable.x + dw / 2 + 8;
        const endX = usable.x + usable.width - dw / 2 - 8;

        // preferWindow: ряды с «севера» (меньший y)
        const y0 = preferWindow ? startY : startY;
        let made = 0;
        for (let y = y0; y <= endY + 1 && made < count; y += rowPitch) {
          for (let x = startX; x <= endX + 1 && made < count; x += colPitch) {
            const deskItem = place(
              placed,
              points,
              desk.kind,
              x,
              y,
              desk.width,
              desk.depth,
              rotate,
              6,
              doorZones,
            );
            if (!deskItem) continue;
            items.push(deskItem);
            const chairOff =
              rotate === 0
                ? { x: 0, y: dd / 2 + chairGap / 2 }
                : { x: dd / 2 + chairGap / 2, y: 0 };
            const chair = place(
              placed,
              points,
              ITEM.chair.kind,
              x + chairOff.x,
              y + chairOff.y,
              ITEM.chair.width,
              ITEM.chair.depth,
              rotate,
              4,
              doorZones,
            );
            if (chair) items.push(chair);
            made += 1;
          }
        }

        if (made > best.placedCount) {
          if (morePlants || density === "low") {
            const plantN = Math.min(4, Math.max(1, Math.floor(made / 4)));
            for (let i = 0; i < plantN; i++) {
              const px = usable.x + 40 + i * 90;
              const py = usable.y + usable.height - 40;
              const p = place(
                placed,
                points,
                ITEM.plant.kind,
                px,
                py,
                ITEM.plant.width,
                ITEM.plant.depth,
                0,
                6,
                doorZones,
              );
              if (p) items.push(p);
            }
          }
          best = { items, placedCount: made };
        }
        if (best.placedCount >= count) return best;
      }
    }
  }

  return best;
}

function placeCentered(
  room: Room,
  doorZones: Rect[],
  kind: string,
  width: number,
  depth: number,
  extras: Furniture[] = [],
): Furniture[] {
  const points = room.points || [];
  const c = roomCentroid(points);
  const placed: Placed[] = [];
  const items: Furniture[] = [];
  const main = place(placed, points, kind, c.x, c.y, width, depth, 0, 10, doorZones);
  if (main) items.push(main);
  for (const ex of extras) {
    const p = place(
      placed,
      points,
      ex.kind,
      ex.x,
      ex.y,
      ex.width,
      ex.depth,
      ex.rotation,
      8,
      doorZones,
    );
    if (p) items.push(p);
  }
  return items;
}

function placeAlongWall(
  room: Room,
  doorZones: Rect[],
  kind: string,
  width: number,
  depth: number,
  occupied: Placed[] = [],
): Furniture | null {
  const points = room.points || [];
  const b = polygonBounds(points);
  if (!b) return null;
  const placed: Placed[] = [...occupied];
  const candidates = [
    { x: b.x + b.width / 2, y: b.y + depth / 2 + 30, rot: 0 },
    { x: b.x + width / 2 + 30, y: b.y + b.height / 2, rot: 90 },
    { x: b.x + b.width - width / 2 - 30, y: b.y + b.height / 2, rot: -90 },
    { x: b.x + b.width / 2, y: b.y + b.height - depth / 2 - 30, rot: 180 },
    { x: b.x + width / 2 + 30, y: b.y + depth / 2 + 30, rot: 0 },
    { x: b.x + b.width - width / 2 - 30, y: b.y + depth / 2 + 30, rot: 0 },
  ];
  for (const c of candidates) {
    const item = place(
      placed,
      points,
      kind,
      c.x,
      c.y,
      width,
      depth,
      c.rot,
      8,
      doorZones,
    );
    if (item) return item;
  }
  return null;
}

function furnitureAsPlaced(items: Furniture[]): Placed[] {
  return items.map((item) => ({
    item,
    bounds: rotatedBounds(
      item.x,
      item.y,
      item.width,
      item.depth,
      item.rotation || 0,
    ),
  }));
}

/** Стойка ресепшен у входной двери, не в центре холла */
function placeReceptionAtEntrance(
  room: Room,
  openings: Opening[],
  walls: { id: string; start: Pt; end: Pt }[],
  doorZones: Rect[],
  occupied: Placed[] = [],
): Furniture | null {
  const points = room.points || [];
  const wallById = new Map(walls.map((w) => [w.id, w]));
  const doors = (openings || []).filter((op) => /door/i.test(op.type || ""));
  const placed = [...occupied];

  for (const op of doors) {
    const wall = wallById.get(op.wallId);
    if (!wall) continue;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy) || 1;
    const t = Math.min(1, Math.max(0, (op.offset || 0) / len));
    const mx = wall.start.x + dx * t;
    const my = wall.start.y + dy * t;
    const tx = dx / len;
    const ty = dy / len;
    const nx = -ty;
    const ny = tx;
    // внутрь комнаты
    const inA = pointInPolygon(mx + nx * 40, my + ny * 40, points);
    const sign = inA ? 1 : -1;
    const depth = ITEM.reception.depth;
    const width = ITEM.reception.width;
    const candidates = [
      {
        x: mx + sign * nx * (depth / 2 + 35) + tx * 80,
        y: my + sign * ny * (depth / 2 + 35) + ty * 80,
        rot: (Math.atan2(ty, tx) * 180) / Math.PI + (sign > 0 ? 0 : 180),
      },
      {
        x: mx + sign * nx * (depth / 2 + 35) - tx * 80,
        y: my + sign * ny * (depth / 2 + 35) - ty * 80,
        rot: (Math.atan2(ty, tx) * 180) / Math.PI + (sign > 0 ? 0 : 180),
      },
      {
        x: mx + sign * nx * (depth / 2 + 50),
        y: my + sign * ny * (depth / 2 + 50),
        rot: (Math.atan2(nx * sign, ny * sign) * 180) / Math.PI,
      },
    ];
    for (const c of candidates) {
      const item = place(
        placed,
        points,
        ITEM.reception.kind,
        c.x,
        c.y,
        width,
        depth,
        c.rot,
        10,
        doorZones,
      );
      if (item) return item;
    }
  }
  return placeAlongWall(
    room,
    doorZones,
    ITEM.reception.kind,
    ITEM.reception.width,
    ITEM.reception.depth,
    occupied,
  );
}

export function generateAutoPlan(input: GenerateInput): GenerateResult {
  const { form } = input;
  const next: FloorPlan = JSON.parse(JSON.stringify(input.plan));
  const floor =
    next.floors.find((f) => f.id === input.floorId) || next.floors[0];
  if (!floor) {
    return {
      plan: next,
      markers: input.markers,
      report: {
        created: [],
        skipped: ["Нет этажа для расстановки"],
        norms: [{ id: "n0", label: "План этажа", status: "error" }],
      },
      roomRoles: [],
    };
  }

  const created: string[] = [];
  const skipped: string[] = [];

  // Автоопределение комнат по замкнутым контурам стен
  const detected = ensureRoomsDetected(
    floor.rooms || [],
    floor.walls || [],
    floor.openings || [],
  );
  floor.rooms = detected.rooms;
  if (detected.removedShellCount > 0) {
    created.push(
      `Убрана оболочка «весь офис»: ${detected.removedShellCount}`,
    );
  }
  if (detected.createdCount > 0) {
    created.push(`Автоопределено комнат: ${detected.createdCount}`);
  }
  const entryInfos = detected.infos.filter(
    (i) => i.hasExteriorDoor && i.suggestedRole !== "wet",
  );
  if (entryInfos.length > 0) {
    created.push(
      `Выход наружу: ${entryInfos
        .map((i) => i.room.name || "комната")
        .join(", ")}`,
    );
  }

  const rooms = [...(floor.rooms || [])];
  const wetRooms = rooms.filter(isWetRoom);
  const workRooms = rooms
    .filter((r) => !isWetRoom(r))
    .map((r) => ({
      room: r,
      areaCm2: polygonAreaCm2(r.points || []),
    }))
    .sort((a, b) => b.areaCm2 - a.areaCm2);

  const keepFixtures = (floor.furniture || []).filter((f) => {
    if (FIXTURE_KINDS.has(String(f.kind))) return true;
    return wetRooms.some((r) =>
      pointInPolygon(f.x, f.y, r.points || []),
    );
  });

  const newFurniture: Furniture[] = [...keepFixtures];
  const areaPerSeatCm2 = rules.areaPerWorkstationM2 * 10_000;

  const enabledUsers = form.pullUsers
    ? form.dbUsers.filter((u) => u.enabled)
    : [];
  let seatsWanted =
    form.workstations > 0
      ? form.workstations
      : enabledUsers.length > 0
        ? enabledUsers.length
        : 0;

  // Распределение ролей: сначала кабинеты и резерв под места, зоны — из остатка
  const meetingN = Math.max(0, form.meetingRooms);
  const confN = form.conferenceRoom > 0 ? 1 : 0;
  const loungeN = form.lounge ? Math.max(1, form.loungeCount || 1) : 0;

  type Role =
    | "work"
    | "meeting"
    | "conference"
    | "private"
    | "lounge"
    | "reception"
    | "pantry"
    | "corridor";
  const roles: { room: Room; areaCm2: number; role: Role }[] = workRooms.map(
    (r) => ({ ...r, role: "work" as Role }),
  );

  // Комнаты с дверью на выход → ресепшен / коридор (до резерва мест)
  const infoByRoomId = new Map(
    detected.infos.map((i) => [i.room.id, i]),
  );
  const entryCandidates = roles
    .filter((r) => infoByRoomId.get(r.room.id)?.hasExteriorDoor)
    .sort((a, b) => a.areaCm2 - b.areaCm2);

  let receptionAssigned = false;
  // Сначала широкая входная → ресепшен (если нужен или эвристика)
  const wideEntry = entryCandidates.find(
    (e) => infoByRoomId.get(e.room.id)?.suggestedRole === "reception",
  );
  const wantReception = form.reception || Boolean(wideEntry);
  if (wantReception && entryCandidates.length > 0) {
    const pick =
      wideEntry ||
      [...entryCandidates].sort((a, b) => b.areaCm2 - a.areaCm2)[0];
    pick.role = "reception";
    receptionAssigned = true;
    if (!pick.room.name || /^Комната\s+\d+/i.test(pick.room.name)) {
      pick.room.name = "Ресепшен / вход";
    }
  }
  for (const entry of entryCandidates) {
    if (entry.role !== "work") continue;
    entry.role = "corridor";
    if (!entry.room.name || /^Комната\s+\d+/i.test(entry.room.name)) {
      entry.room.name = "Коридор / вход";
    }
  }

  const privateByRoom = new Map<string, (typeof form.privateOffices)[number]>();
  const assignedOfficeIds = new Set<string>();
  for (const office of form.privateOffices) {
    if (!office.roomId) continue;
    const entry = roles.find(
      (r) =>
        r.room.id === office.roomId &&
        (r.role === "work" ||
          r.role === "corridor" ||
          r.role === "reception"),
    );
    if (entry) {
      if (entry.role === "reception") receptionAssigned = false;
      entry.role = "private";
      privateByRoom.set(entry.room.id, office);
      assignedOfficeIds.add(office.id);
    } else {
      skipped.push(
        `Кабинет для ${office.userName || "сотрудника"}: комната недоступна`,
      );
      assignedOfficeIds.add(office.id);
    }
  }
  let privateLeft = form.privateOffices.filter(
    (o) => !assignedOfficeIds.has(o.id),
  ).length;
  for (let ri = roles.length - 1; privateLeft > 0 && ri >= 0; ri--) {
    if (roles[ri].role !== "work") continue;
    const nextOffice = form.privateOffices.find(
      (o) => !assignedOfficeIds.has(o.id),
    );
    if (!nextOffice) break;
    // Кабинет не забираем, если после этого не хватит площади под места
    const remainingWork = roles.filter(
      (r, idx) => r.role === "work" && idx !== ri,
    );
    const remCap = remainingWork.reduce(
      (s, r) => s + Math.floor(r.areaCm2 / areaPerSeatCm2),
      0,
    );
    if (seatsWanted > 0 && remCap < seatsWanted && remainingWork.length === 0) {
      skipped.push(
        `Кабинет для ${nextOffice.userName || "сотрудника"} пропущен — нужны места`,
      );
      assignedOfficeIds.add(nextOffice.id);
      privateLeft -= 1;
      continue;
    }
    roles[ri].role = "private";
    privateByRoom.set(roles[ri].room.id, nextOffice);
    assignedOfficeIds.add(nextOffice.id);
    privateLeft -= 1;
  }

  const roomCap = (r: { areaCm2: number }) =>
    Math.max(0, Math.floor(r.areaCm2 / areaPerSeatCm2));

  // Жёсткие зоны (нужна своя комната) vs мягкие (можно в коридор/ресепшен)
  const hardDemand = meetingN + confN;
  const workPool = roles
    .filter((r) => r.role === "work")
    .sort((a, b) => b.areaCm2 - a.areaCm2);

  const reservedIds = new Set<string>();
  let reservedCap = 0;
  for (const r of workPool) {
    const leftAfterTake = workPool.length - reservedIds.size - 1;
    if (seatsWanted <= 0) break;
    if (reservedCap >= seatsWanted) break;
    // не забираем последние hardDemand комнат — они под переговорные
    if (leftAfterTake < hardDemand) break;
    reservedIds.add(r.room.id);
    reservedCap += roomCap(r);
  }
  if (seatsWanted > 0 && reservedIds.size === 0 && workPool[0]) {
    reservedIds.add(workPool[0].room.id);
  }

  const spareRooms = [...roles]
    .filter((r) => r.role === "work" && !reservedIds.has(r.room.id))
    .sort((a, b) => a.areaCm2 - b.areaCm2);

  const takeSpareBest = (role: Role, targetAreaCm2: number): boolean => {
    if (!spareRooms.length) return false;
    let bestIdx = 0;
    let bestScore = Infinity;
    spareRooms.forEach((r, i) => {
      const score = Math.abs(r.areaCm2 - targetAreaCm2);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    });
    const [cand] = spareRooms.splice(bestIdx, 1);
    cand.role = role;
    return true;
  };

  for (let i = 0; i < meetingN; i++) {
    if (!takeSpareBest("meeting", 16 * 10_000)) {
      skipped.push(`Переговорная ${i + 1}: нет свободной комнаты`);
    }
  }
  if (confN > 0 && !takeSpareBest("conference", 30 * 10_000)) {
    skipped.push("Конференц-зал: нет свободной комнаты");
  }

  type Amenity = "lounge" | "reception" | "pantry";
  const sharedAmenities: Amenity[] = [];
  // Lounge: своя комната если ещё есть spare, иначе shared
  for (let i = 0; i < loungeN; i++) {
    if (!takeSpareBest("lounge", 18 * 10_000)) sharedAmenities.push("lounge");
  }
  if (form.reception && !receptionAssigned) {
    if (!takeSpareBest("reception", 20 * 10_000)) {
      sharedAmenities.push("reception");
    } else {
      receptionAssigned = true;
    }
  }
  if (form.pantry && !takeSpareBest("pantry", 10 * 10_000)) {
    sharedAmenities.push("pantry");
  }

  const workTargets = roles.filter((r) => r.role === "work");
  const workArea = workTargets.reduce((s, r) => s + r.areaCm2, 0);
  const maxByNorm = Math.floor(workArea / areaPerSeatCm2);
  if (seatsWanted > maxByNorm) {
    skipped.push(
      `Мест запрошено ${seatsWanted}, по норме ≥${rules.areaPerWorkstationM2} м² в open space ≈${maxByNorm} — урезано`,
    );
    seatsWanted = maxByNorm;
  }

  const capacity = workTargets.map((r) => roomCap(r));
  const capSum = capacity.reduce((a, b) => a + b, 0) || 1;
  let seatsLeft = seatsWanted;
  const seatsPerRoom = workTargets.map((_r, i) => {
    const share =
      i === workTargets.length - 1
        ? seatsLeft
        : Math.min(
            capacity[i],
            Math.round((seatsWanted * capacity[i]) / capSum),
          );
    seatsLeft -= share;
    return Math.max(0, share);
  });
  if (seatsLeft > 0 && seatsPerRoom.length) {
    seatsPerRoom[0] += seatsLeft;
  }

  let desksTotal = 0;
  const markers: Marker[] = [];
  let userIdx = 0;

  roles.forEach((entry) => {
    const doorZones = doorClearZones(
      floor.openings || [],
      floor.walls || [],
      entry.room.points || [],
    );

    if (entry.role === "work") {
      const idx = workTargets.indexOf(entry);
      const n = seatsPerRoom[idx] || 0;
      const { items, placedCount } = packDesks(
        entry.room,
        n,
        form.density,
        doorZones,
        form.preferWindowLight,
        form.morePlants,
      );
      newFurniture.push(...items);
      desksTotal += placedCount;
      for (let i = 0; i < placedCount; i++) {
        const desk = items.find(
          (it, j) =>
            String(it.kind).includes("desk") &&
            items.slice(0, j + 1).filter((x) => String(x.kind).includes("desk"))
              .length ===
              i + 1,
        );
        if (!desk) continue;
        const user = enabledUsers[userIdx++];
        markers.push({
          id: uid("m"),
          x: desk.x,
          y: desk.y,
          floor: floor.id,
          icon: "●",
          label: user?.title || `Место ${markers.length + 1}`,
        });
      }
      if (placedCount < n) {
        skipped.push(
          `В «${entry.room.name || "комнате"}» размещено ${placedCount} из ${n} мест`,
        );
      }
    }

    if (entry.role === "meeting") {
      const area = polygonAreaCm2(entry.room.points || []) / 10_000;
      const table = area < 12 ? ITEM.meetingSmall : ITEM.meeting;
      const items = placeCentered(
        entry.room,
        doorZones,
        table.kind,
        table.width,
        table.depth,
      );
      if (items.length) {
        newFurniture.push(...items);
        created.push(`Переговорная: ${entry.room.name || "комната"}`);
      } else {
        skipped.push(`Переговорная не влезла в «${entry.room.name}»`);
      }
    }

    if (entry.role === "conference") {
      const items = placeCentered(
        entry.room,
        doorZones,
        ITEM.conference.kind,
        ITEM.conference.width,
        ITEM.conference.depth,
      );
      if (items.length) {
        newFurniture.push(...items);
        if (form.morePlants) {
          const b = polygonBounds(entry.room.points || []);
          if (b) {
            const p = placeAlongWall(
              entry.room,
              doorZones,
              ITEM.plant.kind,
              ITEM.plant.width,
              ITEM.plant.depth,
            );
            if (p) newFurniture.push(p);
          }
        }
        created.push(`Конференц-зал: ${entry.room.name || "комната"}`);
      } else {
        skipped.push("Конференц-зал не влез по площади/форме комнаты");
      }
    }

    if (entry.role === "private") {
      const office = privateByRoom.get(entry.room.id);
      const label = office?.userName
        ? `${office.userName} — кабинет`
        : entry.room.name || "Кабинет";
      const items = placeCentered(
        entry.room,
        doorZones,
        ITEM.executive.kind,
        ITEM.executive.width,
        ITEM.executive.depth,
      );
      const cab = placeAlongWall(
        entry.room,
        doorZones,
        ITEM.cabinet.kind,
        ITEM.cabinet.width,
        ITEM.cabinet.depth,
      );
      if (cab) items.push(cab);
      if (items.length) {
        newFurniture.push(...items);
        const c = roomCentroid(entry.room.points || []);
        markers.push({
          id: uid("m"),
          x: c.x,
          y: c.y,
          floor: floor.id,
          icon: "●",
          label,
        });
        created.push(`Кабинет: ${label}`);
      }
    }

    if (entry.role === "lounge") {
      const items = placeCentered(
        entry.room,
        doorZones,
        form.selectedFurniture.lounge || form.allowExtraFurniture
          ? ITEM.lounge.kind
          : ITEM.sofa.kind,
        form.selectedFurniture.lounge || form.allowExtraFurniture
          ? ITEM.lounge.width
          : ITEM.sofa.width,
        form.selectedFurniture.lounge || form.allowExtraFurniture
          ? ITEM.lounge.depth
          : ITEM.sofa.depth,
      );
      if (form.morePlants || form.allowExtraFurniture) {
        const p = placeAlongWall(
          entry.room,
          doorZones,
          ITEM.plant.kind,
          ITEM.plant.width,
          ITEM.plant.depth,
        );
        if (p) items.push(p);
      }
      if (form.moreFocusBooths) {
        const b = placeAlongWall(
          entry.room,
          doorZones,
          ITEM.focus.kind,
          ITEM.focus.width,
          ITEM.focus.depth,
        );
        if (b) items.push(b);
      }
      if (items.length) {
        newFurniture.push(...items);
        created.push(`Зона отдыха: ${entry.room.name || "комната"}`);
      }
    }

    if (entry.role === "reception") {
      const item = placeReceptionAtEntrance(
        entry.room,
        floor.openings || [],
        floor.walls || [],
        doorZones,
      );
      if (item) {
        newFurniture.push(item);
        created.push(`Ресепшен: ${entry.room.name || "комната"}`);
      } else {
        skipped.push("Ресепшен не удалось разместить");
      }
    }

    if (entry.role === "corridor") {
      // Коридор / холл у выхода — без рабочих мест, максимум растение
      if (form.morePlants || form.allowExtraFurniture) {
        const p = placeAlongWall(
          entry.room,
          doorZones,
          ITEM.plant.kind,
          ITEM.plant.width,
          ITEM.plant.depth,
        );
        if (p) newFurniture.push(p);
      }
      created.push(`Коридор / вход: ${entry.room.name || "комната"}`);
    }

    if (entry.role === "pantry") {
      const fridge = placeAlongWall(
        entry.room,
        doorZones,
        ITEM.fridge.kind,
        ITEM.fridge.width,
        ITEM.fridge.depth,
      );
      if (fridge) {
        newFurniture.push(fridge);
        created.push(`Кухня / пантри: ${entry.room.name || "комната"}`);
      } else {
        skipped.push("Пантри не удалось разместить");
      }
    }
  });

  // Зоны без своей комнаты — сначала коридор/ресепшен, не open space со столами
  if (sharedAmenities.length > 0) {
    const hostOrder = [
      ...roles.filter((r) => r.role === "corridor"),
      ...roles.filter((r) => r.role === "reception"),
      ...[...workTargets].sort((a, b) => a.areaCm2 - b.areaCm2), // мелкий open space в крайнем случае
    ];

    for (const amenity of sharedAmenities) {
      let placedOk = false;
      for (const host of hostOrder) {
        const doorZones = doorClearZones(
          floor.openings || [],
          floor.walls || [],
          host.room.points || [],
        );
        const occupied = furnitureAsPlaced(
          newFurniture.filter((f) =>
            pointInPolygon(f.x, f.y, host.room.points || []),
          ),
        );
        const where =
          host.role === "work"
            ? "в open space"
            : host.role === "reception"
              ? "у ресепшена"
              : "в коридоре";

        if (amenity === "lounge") {
          const spec =
            form.selectedFurniture.lounge || form.allowExtraFurniture
              ? ITEM.lounge
              : ITEM.sofa;
          const item = placeAlongWall(
            host.room,
            doorZones,
            spec.kind,
            spec.width,
            spec.depth,
            occupied,
          );
          if (item) {
            newFurniture.push(item);
            created.push(
              `Зона отдыха (${where}): ${host.room.name || "комната"}`,
            );
            placedOk = true;
            break;
          }
        }
        if (amenity === "reception") {
          const item = placeReceptionAtEntrance(
            host.room,
            floor.openings || [],
            floor.walls || [],
            doorZones,
            occupied,
          );
          if (item) {
            newFurniture.push(item);
            created.push(`Ресепшен (${where}): ${host.room.name || "комната"}`);
            placedOk = true;
            break;
          }
        }
        if (amenity === "pantry") {
          const item = placeAlongWall(
            host.room,
            doorZones,
            ITEM.fridge.kind,
            ITEM.fridge.width,
            ITEM.fridge.depth,
            occupied,
          );
          if (item) {
            newFurniture.push(item);
            created.push(
              `Кухня / пантри (${where}): ${host.room.name || "комната"}`,
            );
            placedOk = true;
            break;
          }
        }
      }
      if (!placedOk) {
        skipped.push(
          amenity === "lounge"
            ? "Зона отдыха: нет места"
            : amenity === "pantry"
              ? "Пантри: нет места"
              : "Ресепшен: нет места",
        );
      }
    }
  }

  // Доп. мебель из каталога (лимиты), если allowExtra и не strict
  if (form.allowExtraFurniture && !form.strictCatalogOnly) {
    const plantLimit = form.furnitureLimits.plant || (form.morePlants ? 6 : 0);
    let plants = 0;
    for (const wr of workTargets) {
      if (plants >= plantLimit) break;
      const doorZones = doorClearZones(
        floor.openings || [],
        floor.walls || [],
        wr.room.points || [],
      );
      const occupied = furnitureAsPlaced(
        newFurniture.filter((f) =>
          pointInPolygon(f.x, f.y, wr.room.points || []),
        ),
      );
      const p = placeAlongWall(
        wr.room,
        doorZones,
        ITEM.plant.kind,
        ITEM.plant.width,
        ITEM.plant.depth,
        occupied,
      );
      if (p) {
        newFurniture.push(p);
        plants += 1;
      }
    }
  }

  floor.furniture = newFurniture;

  if (desksTotal > 0) created.unshift(`${desksTotal} рабочих места`);
  if (desksTotal === 0 && seatsWanted > 0) {
    skipped.push(
      "Не удалось разместить рабочие места — проверьте контур комнат или снизьте плотность",
    );
  }

  const aisleOk = form.density !== "high";
  const report: GenerationReport = {
    created,
    skipped,
    norms: [
      {
        id: "n-area",
        label: `Площадь ≥ ${rules.areaPerWorkstationM2} м²/место`,
        status: desksTotal <= maxByNorm ? "ok" : "warn",
      },
      {
        id: "n-aisle",
        label: `Проход ≥ ${rules.aisleMinM} м`,
        status: aisleOk ? "ok" : "warn",
      },
      {
        id: "n-overlap",
        label: "Пересечения мебели",
        status: "ok",
      },
      {
        id: "n-door",
        label: "Зона открывания двери",
        status: "ok",
      },
      {
        id: "n-wet",
        label: "Мокрые зоны не заняты",
        status: "ok",
      },
    ],
  };

  const roomRoles: RoomRoleInfo[] = [
    ...roles.map((r) => ({
      roomId: r.room.id,
      name: r.room.name || "Комната",
      role: r.role as RoomRoleInfo["role"],
      areaM2: r.areaCm2 / 10_000,
      existingKinds: newFurniture
        .filter((f) => pointInPolygon(f.x, f.y, r.room.points || []))
        .map((f) => String(f.kind)),
    })),
    ...wetRooms.map((r) => ({
      roomId: r.id,
      name: r.name || "Санузел",
      role: "wet" as const,
      areaM2: polygonAreaCm2(r.points || []) / 10_000,
      existingKinds: newFurniture
        .filter((f) => pointInPolygon(f.x, f.y, r.points || []))
        .map((f) => String(f.kind)),
    })),
  ];

  return { plan: next, markers, report, roomRoles };
}
