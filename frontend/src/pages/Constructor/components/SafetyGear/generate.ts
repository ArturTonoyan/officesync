/**
 * Авторазмещение средств пожарной безопасности и эвакуационных знаков.
 * Ориентиры: ППР РФ № 1479 (пп. 400, 406, 409), ГОСТ 12.4.026, ГОСТ 34428-2018.
 */
import type {
  FloorPlan,
  Furniture,
  Marker,
  Opening,
  Wall,
} from "@jbaysolutions/floorplan-react";
import {
  ensureRoomsDetected,
  findClosedLoopsFromWalls,
} from "../AutoPlan/layout/detectRooms";
import {
  pointInPolygon,
  polygonAreaCm2,
  polygonBounds,
  rotatedBounds,
  rectsOverlap,
  type Pt,
  type Rect,
} from "../AutoPlan/layout/geometry";
import {
  EXTINGUISHER_MAX_PATH_CM,
  EXTINGUISHER_MIN_PER_FLOOR,
  EXIT_ARROW_STEP_CM,
  KIND_EXIT_ARROW,
  KIND_EXIT_SIGN,
  KIND_EXTINGUISHER,
  KIND_FIRE_SIGN,
  KIND_FIRST_AID,
  SAFETY_KINDS,
  SIZE,
} from "./types";

export type SafetyOptions = {
  extinguishers: boolean;
  exitSigns: boolean;
  exitArrows: boolean;
  fireSigns: boolean;
  firstAid: boolean;
};

export const DEFAULT_SAFETY_OPTIONS: SafetyOptions = {
  extinguishers: true,
  exitSigns: true,
  exitArrows: true,
  fireSigns: true,
  firstAid: true,
};

export type SafetyPlaceResult = {
  plan: FloorPlan;
  markers: Marker[];
  report: string[];
  warnings: string[];
  placed: Furniture[];
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function centroid(points: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  const n = Math.max(1, points.length);
  return { x: x / n, y: y / n };
}

function isDoor(op: Opening) {
  return /door/i.test(op.type || "");
}

function wallLen(wall: Wall) {
  if (!wall.start || !wall.end) return 0;
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

function openingPoint(op: Opening, walls: Wall[]): Pt | null {
  const wall = walls.find((w) => w.id === op.wallId);
  if (!wall?.start || !wall?.end) return null;
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy) || 1;
  const t = Math.min(1, Math.max(0, (op.offset || 0) / len));
  return { x: wall.start.x + dx * t, y: wall.start.y + dy * t };
}

function roomsTouchingOpening(
  op: Opening,
  walls: Wall[],
  rooms: { id: string; points: Pt[] }[],
): string[] {
  const p = openingPoint(op, walls);
  if (!p) return [];
  const wall = walls.find((w) => w.id === op.wallId);
  if (!wall?.start || !wall?.end) return [];
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const probe = 40;
  const hits = new Set<string>();
  for (const sign of [1, -1] as const) {
    const q = { x: p.x + sign * nx * probe, y: p.y + sign * ny * probe };
    for (const r of rooms) {
      if (pointInPolygon(q.x, q.y, r.points)) hits.add(r.id);
    }
  }
  for (const r of rooms) {
    if (pointInPolygon(p.x, p.y, r.points)) hits.add(r.id);
  }
  return [...hits];
}

function wallInset(wall: Wall, depth: number) {
  return (wall.thickness || 12) / 2 + depth / 2 + 6;
}

type Occupied = { bounds: Rect };

const WET_ROOM_RE =
  /туалет|санузел|wc|мойк|душевая|toilet|bath|restroom|кабин/i;
const TOILET_FURN_RE =
  /toilet|shower|bathtub|унитаз|душ|cabin|stall|wc/i;

function isWetRoom(r: { name?: string; role?: string }) {
  return WET_ROOM_RE.test(`${r.name || ""} ${r.role || ""}`);
}

/** Проёмы на стене + на параллельных двойниках */
function openingRangesOnWall(
  wall: Wall,
  openings: Opening[],
  walls: Wall[],
  marginCm: number,
): { t0: number; t1: number }[] {
  if (!wall.start || !wall.end) return [];
  const len = wallLen(wall);
  if (len < 1) return [];
  const ux = (wall.end.x - wall.start.x) / len;
  const uy = (wall.end.y - wall.start.y) / len;
  const nx = -uy;
  const ny = ux;
  const ranges: { t0: number; t1: number }[] = [];

  for (const op of openings) {
    const host = walls.find((w) => w.id === op.wallId);
    if (!host?.start || !host?.end) continue;
    const hLen = wallLen(host) || 1;
    const hUx = (host.end.x - host.start.x) / hLen;
    const hUy = (host.end.y - host.start.y) / hLen;
    const same = host.id === wall.id;
    const cross = Math.abs(ux * hUy - uy * hUx);
    if (!same && cross > 0.08) continue;
    const opCenter = {
      x: host.start.x + hUx * (op.offset || 0),
      y: host.start.y + hUy * (op.offset || 0),
    };
    if (!same) {
      const mid = {
        x: (wall.start.x + wall.end.x) / 2,
        y: (wall.start.y + wall.end.y) / 2,
      };
      const lat = (opCenter.x - mid.x) * nx + (opCenter.y - mid.y) * ny;
      if (Math.abs(lat) > (wall.thickness || 12) + (host.thickness || 12) + 25)
        continue;
    }
    const along =
      (opCenter.x - wall.start.x) * ux + (opCenter.y - wall.start.y) * uy;
    const half = (op.width || 90) / 2 + marginCm;
    const t0 = Math.max(0, (along - half) / len);
    const t1 = Math.min(1, (along + half) / len);
    if (t1 > t0) ranges.push({ t0, t1 });
  }
  return ranges;
}

function tBlockedByOpenings(
  wall: Wall,
  t: number,
  halfItemCm: number,
  openings: Opening[],
  walls: Wall[],
): boolean {
  const len = wallLen(wall);
  if (len < 1) return false;
  const pad = halfItemCm / len;
  for (const range of openingRangesOnWall(wall, openings, walls, 40)) {
    if (t + pad >= range.t0 && t - pad <= range.t1) return true;
  }
  return false;
}

/** Ближайшая доля t вне проёмов */
function findClearT(
  wall: Wall,
  preferredT: number,
  halfItemCm: number,
  openings: Opening[],
  walls: Wall[],
): number | null {
  const len = wallLen(wall);
  if (len < 1) return null;
  const clamp = (t: number) => Math.min(0.9, Math.max(0.1, t));
  const base = clamp(preferredT);
  if (!tBlockedByOpenings(wall, base, halfItemCm, openings, walls)) return base;

  const step = Math.max(0.02, 12 / len);
  for (let i = 1; i <= 48; i++) {
    for (const dir of [1, -1] as const) {
      const t = clamp(base + dir * step * i);
      if (!tBlockedByOpenings(wall, t, halfItemCm, openings, walls)) return t;
    }
  }
  return null;
}

function wetFurnitureKeepouts(furniture: Furniture[]): Rect[] {
  const out: Rect[] = [];
  for (const f of furniture || []) {
    if (!TOILET_FURN_RE.test(String(f.kind || ""))) continue;
    const b = rotatedBounds(f.x, f.y, f.width, f.depth, f.rotation || 0);
    out.push({
      x: b.x - 20,
      y: b.y - 20,
      width: b.width + 40,
      height: b.height + 40,
    });
  }
  return out;
}
/** AABB зоны прохода двери — чтобы tryAdd не ставил объект в створ */
function doorKeepoutBounds(op: Opening, walls: Wall[]): Rect | null {
  const wall = walls.find((w) => w.id === op.wallId);
  if (!wall?.start || !wall?.end) return null;
  const p = openingPoint(op, walls);
  if (!p) return null;
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const halfW = (op.width || 90) / 2 + 15;
  const depth = (wall.thickness || 12) / 2 + 55;
  const corners: Pt[] = [
    {
      x: p.x - ux * halfW - nx * depth,
      y: p.y - uy * halfW - ny * depth,
    },
    {
      x: p.x + ux * halfW - nx * depth,
      y: p.y + uy * halfW - ny * depth,
    },
    {
      x: p.x + ux * halfW + nx * depth,
      y: p.y + uy * halfW + ny * depth,
    },
    {
      x: p.x - ux * halfW + nx * depth,
      y: p.y - uy * halfW + ny * depth,
    },
  ];
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const c of corners) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x);
    maxY = Math.max(maxY, c.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function tryAdd(
  occupied: Occupied[],
  roomPoints: Pt[] | null,
  item: Furniture,
): Furniture | null {
  const bounds = rotatedBounds(
    item.x,
    item.y,
    item.width,
    item.depth,
    item.rotation || 0,
  );
  if (roomPoints && !pointInPolygon(item.x, item.y, roomPoints)) return null;
  if (occupied.some((o) => rectsOverlap(o.bounds, bounds, 6))) return null;
  occupied.push({ bounds });
  return item;
}

/** Точка у стены с нормалью внутрь комнаты / к клику */
function placeOnWall(
  wall: Wall,
  t: number,
  depth: number,
  toward: Pt,
  openings: Opening[] | undefined,
  halfItemCm: number,
  walls: Wall[],
): { x: number; y: number; rotation: number; t: number } | null {
  if (!wall.start || !wall.end) return null;
  const clearT =
    openings && openings.length
      ? findClearT(wall, t, halfItemCm, openings, walls)
      : Math.min(0.9, Math.max(0.1, t));
  if (clearT == null) return null;
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy) || 1;
  const onWall = {
    x: wall.start.x + dx * clearT,
    y: wall.start.y + dy * clearT,
  };
  const nx = -dy / len;
  const ny = dx / len;
  const inset = wallInset(wall, depth);
  const side =
    (toward.x - onWall.x) * nx + (toward.y - onWall.y) * ny >= 0 ? 1 : -1;
  return {
    x: onWall.x + side * nx * inset,
    y: onWall.y + side * ny * inset,
    rotation: (Math.atan2(side * nx, side * ny) * 180) / Math.PI,
    t: clearT,
  };
}

function nearestWallPoint(
  walls: Wall[],
  point: Pt,
  openings: Opening[],
  halfItemCm: number,
  preferWallId?: string | null,
): { wall: Wall; t: number; dist: number } | null {
  let best: { wall: Wall; t: number; dist: number } | null = null;
  for (const wall of walls) {
    if (!wall.start || !wall.end) continue;
    if (preferWallId && wall.id !== preferWallId) continue;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy) || 1;
    let t =
      ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) /
      (len * len);
    t = Math.min(0.9, Math.max(0.1, t));
    const clear = findClearT(wall, t, halfItemCm, openings, walls);
    if (clear == null) continue;
    t = clear;
    const on = {
      x: wall.start.x + dx * t,
      y: wall.start.y + dy * t,
    };
    const d = dist(point, on);
    if (!best || d < best.dist) best = { wall, t, dist: d };
  }
  if (preferWallId && !best) {
    return nearestWallPoint(walls, point, openings, halfItemCm, null);
  }
  return best;
}
type RoomInfo = {
  id: string;
  name: string;
  points: Pt[];
  area: number;
  role: string;
};

function isCorridorLike(r: RoomInfo) {
  const role = (r.role || "").toLowerCase();
  if (role === "corridor" || role === "reception") return true;
  if (/corridor|hall|коридор|холл|проход/.test(role + r.name)) return true;
  // вытянутая комната
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of r.points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const ratio = Math.max(w, h) / Math.max(1, Math.min(w, h));
  return ratio >= 3 && Math.min(w, h) < 280;
}

export function placeSafetyGear(input: {
  plan: FloorPlan;
  markers: Marker[];
  floorId?: string | null;
  options?: Partial<SafetyOptions>;
}): SafetyPlaceResult {
  const opts: SafetyOptions = {
    ...DEFAULT_SAFETY_OPTIONS,
    ...input.options,
  };
  const next: FloorPlan = JSON.parse(JSON.stringify(input.plan));
  const floor =
    next.floors.find((f) => f.id === input.floorId) || next.floors[0];
  const report: string[] = [];
  const warnings: string[] = [];
  const placed: Furniture[] = [];

  if (!floor) {
    return {
      plan: next,
      markers: input.markers,
      report: ["Нет этажа"],
      warnings: ["Нет этажа"],
      placed: [],
    };
  }

  const detected = ensureRoomsDetected(
    floor.rooms || [],
    floor.walls || [],
    floor.openings || [],
  );
  floor.rooms = detected.rooms;

  const rooms: RoomInfo[] = detected.infos.map((i) => ({
    id: i.room.id,
    name: i.room.name || "",
    points: i.room.points || [],
    area: polygonAreaCm2(i.room.points || []),
    role: i.suggestedRole || "",
  }));

  const walls = floor.walls || [];
  const openings = floor.openings || [];
  const { exteriorWallIds } = findClosedLoopsFromWalls(walls);
  const exteriorIds =
    exteriorWallIds.size > 0
      ? exteriorWallIds
      : (() => {
          const guess = new Set<string>();
          for (const op of openings) {
            if (!isDoor(op)) continue;
            if (roomsTouchingOpening(op, walls, rooms).length <= 1) {
              guess.add(op.wallId);
            }
          }
          return guess;
        })();

  // Убрать ранее размещённые средства выбранных типов
  const removeKinds = new Set<string>();
  if (opts.extinguishers) removeKinds.add(KIND_EXTINGUISHER);
  if (opts.firstAid) removeKinds.add(KIND_FIRST_AID);
  if (opts.exitSigns) removeKinds.add(KIND_EXIT_SIGN);
  if (opts.exitArrows) removeKinds.add(KIND_EXIT_ARROW);
  if (opts.fireSigns) removeKinds.add(KIND_FIRE_SIGN);

  floor.furniture = (floor.furniture || []).filter(
    (f) => !removeKinds.has(String(f.kind)),
  );

  const occupied: Occupied[] = (floor.furniture || []).map((f) => ({
    bounds: rotatedBounds(f.x, f.y, f.width, f.depth, f.rotation || 0),
  }));

  // Запрет: створ дверей, санузлы, кабинки
  for (const op of openings) {
    if (!isDoor(op)) continue;
    const keep = doorKeepoutBounds(op, walls);
    if (keep) occupied.push({ bounds: keep });
  }
  for (const keep of wetFurnitureKeepouts(floor.furniture || [])) {
    occupied.push({ bounds: keep });
  }
  for (const r of rooms) {
    if (!isWetRoom(r)) continue;
    const b = polygonBounds(r.points);
    if (b) occupied.push({ bounds: b });
  }

  const dryRooms = rooms.filter((r) => !isWetRoom(r));

  const exitDoors: {
    op: Opening;
    point: Pt;
    wall: Wall;
    roomIds: string[];
  }[] = [];

  for (const op of openings) {
    if (!isDoor(op)) continue;
    if (!exteriorIds.has(op.wallId)) continue;
    const wall = walls.find((w) => w.id === op.wallId);
    const point = openingPoint(op, walls);
    if (!wall || !point) continue;
    exitDoors.push({
      op,
      point,
      wall,
      roomIds: roomsTouchingOpening(op, walls, rooms),
    });
  }

  if (!exitDoors.length) {
    warnings.push(
      "Не найдены наружные двери — знаки «Выход» и часть огнетушителей у выходов не размещены. Отметьте эвакуационные двери.",
    );
  } else {
    report.push(`Эвакуационных выходов: ${exitDoors.length}`);
  }

  // ——— Знаки «Выход» у наружных дверей (рядом с проёмом, не в нём) ———
  if (opts.exitSigns) {
    let n = 0;
    for (const ex of exitDoors) {
      const len = wallLen(ex.wall) || 1;
      const tDoor = Math.min(1, Math.max(0, (ex.op.offset || 0) / len));
      const doorHalf = ((ex.op.width || 90) / 2 + 40) / len;
      const towardRoom =
        dryRooms.find((r) => ex.roomIds.includes(r.id)) ||
        rooms.find((r) => ex.roomIds.includes(r.id) && !isWetRoom(r));
      const dryPts = dryRooms.flatMap((r) => r.points);
      const toward =
        (towardRoom && centroid(towardRoom.points)) ||
        centroid(dryPts.length ? dryPts : rooms.flatMap((r) => r.points));
      const halfW = SIZE.exitSign.width / 2;
      const place =
        placeOnWall(
          ex.wall,
          tDoor + doorHalf,
          SIZE.exitSign.depth,
          toward,
          openings,
          halfW,
          walls,
        ) ||
        placeOnWall(
          ex.wall,
          tDoor - doorHalf,
          SIZE.exitSign.depth,
          toward,
          openings,
          halfW,
          walls,
        );
      if (!place) continue;
      const roomPts = towardRoom?.points || null;
      const item: Furniture = {
        id: uid("exit"),
        kind: KIND_EXIT_SIGN as Furniture["kind"],
        x: place.x,
        y: place.y,
        width: SIZE.exitSign.width,
        depth: SIZE.exitSign.depth,
        rotation: place.rotation,
      };
      if (tryAdd(occupied, roomPts, item)) {
        floor.furniture = [...(floor.furniture || []), item];
        placed.push(item);
        n++;
      }
    }
    report.push(`Знаков «Выход»: ${n}`);
  }

  // ——— Огнетушители (ППР 1479 п.400 ≥2; п.406 ≤20 м) ———
  const extinguisherPts: Pt[] = [];
  if (opts.extinguishers) {
    type Cand = { x: number; y: number; rot: number; score: number; room: RoomInfo | null };
    const candidates: Cand[] = [];

    const halfExt = SIZE.extinguisher.width / 2;
    // у каждого выхода — сбоку от проёма (не в двери)
    for (const ex of exitDoors) {
      const len = wallLen(ex.wall) || 1;
      const tDoor = Math.min(1, Math.max(0, (ex.op.offset || 0) / len));
      const doorHalf = ((ex.op.width || 90) / 2 + 45) / len;
      const room =
        dryRooms.find((r) => ex.roomIds.includes(r.id)) ||
        dryRooms.find((r) => pointInPolygon(ex.point.x, ex.point.y, r.points)) ||
        rooms.find((r) => ex.roomIds.includes(r.id) && !isWetRoom(r)) ||
        null;
      const toward = room
        ? centroid(room.points)
        : { x: ex.point.x, y: ex.point.y };
      for (const side of [1, -1] as const) {
        for (const extra of [0, 0.08, 0.16]) {
          const place = placeOnWall(
            ex.wall,
            tDoor + side * (doorHalf + extra),
            SIZE.extinguisher.depth,
            toward,
            openings,
            halfExt,
          walls,
          );
          if (!place) continue;
          candidates.push({
            ...place,
            rot: place.rotation,
            score: 100 - extra * 50,
            room,
          });
        }
      }
    }

    // коридоры и крупные помещения (не санузлы)
    for (const room of dryRooms) {
      if (!room.points.length) continue;
      const c = centroid(room.points);
      const prefer =
        isCorridorLike(room) || room.area > 250_000
          ? 40
          : room.area > 80_000
            ? 20
            : 5;
      const near = nearestWallPoint(walls, c, openings, halfExt);
      if (!near) continue;
      const place = placeOnWall(
        near.wall,
        near.t,
        SIZE.extinguisher.depth,
        c,
        openings,
        halfExt,
        walls,
      );
      if (!place) continue;
      candidates.push({
        ...place,
        rot: place.rotation,
        score: prefer,
        room,
      });
    }

    candidates.sort((a, b) => b.score - a.score);

    const addExt = (c: Cand): boolean => {
      const item: Furniture = {
        id: uid("fe"),
        kind: KIND_EXTINGUISHER as Furniture["kind"],
        x: c.x,
        y: c.y,
        width: SIZE.extinguisher.width,
        depth: SIZE.extinguisher.depth,
        rotation: c.rot,
      };
      if (!tryAdd(occupied, c.room?.points || null, item)) return false;
      floor.furniture = [...(floor.furniture || []), item];
      placed.push(item);
      extinguisherPts.push({ x: c.x, y: c.y });
      return true;
    };

    for (const c of candidates) {
      if (extinguisherPts.length >= EXTINGUISHER_MIN_PER_FLOOR) break;
      addExt(c);
    }

    // покрытие: каждая комната ≤ 20 м до ближайшего огнетушителя (по прямой + запас)
    const uncovered = () =>
      dryRooms.filter((r) => {
        if (!r.points.length) return false;
        const c = centroid(r.points);
        if (!extinguisherPts.length) return true;
        const d = Math.min(...extinguisherPts.map((p) => dist(c, p)));
        return d > EXTINGUISHER_MAX_PATH_CM;
      });

    let guard = 0;
    while (uncovered().length && guard < 24) {
      guard++;
      const need = uncovered()[0];
      if (!need) break;
      const c = centroid(need.points);
      const near = nearestWallPoint(walls, c, openings, halfExt);
      if (!near) break;
      const place = placeOnWall(
        near.wall,
        near.t,
        SIZE.extinguisher.depth,
        c,
        openings,
        halfExt,
      walls,
      );
      if (!place) break;
      if (
        !addExt({
          ...place,
          rot: place.rotation,
          score: 0,
          room: need,
        })
      ) {
        const place2 = placeOnWall(
          near.wall,
          Math.min(0.85, near.t + 0.12),
          SIZE.extinguisher.depth,
          c,
          openings,
          halfExt,
        walls,
        );
        if (
          place2 &&
          !addExt({
            ...place2,
            rot: place2.rotation,
            score: 0,
            room: need,
          })
        ) {
          break;
        }
      }
    }

    report.push(
      `Огнетушителей: ${extinguisherPts.length} (норма: ≥${EXTINGUISHER_MIN_PER_FLOOR} на этаж, путь ≤${EXTINGUISHER_MAX_PATH_CM / 100} м)`,
    );
    if (extinguisherPts.length < EXTINGUISHER_MIN_PER_FLOOR) {
      warnings.push(
        `Меньше ${EXTINGUISHER_MIN_PER_FLOOR} огнетушителей — проверьте стены и свободные места у выходов (ППР 1479 п.400).`,
      );
    }
    if (uncovered().length) {
      warnings.push(
        `Часть помещений дальше ${EXTINGUISHER_MAX_PATH_CM / 100} м от огнетушителя — добавьте вручную (ППР 1479 п.406).`,
      );
    }
    report.push("Высота установки огнетушителя: верх ≤ 1,5 м от пола (п.409).");
  }

  // ——— Знак «Огнетушитель» F04 рядом с каждым ———
  if (opts.fireSigns) {
    const pts =
      extinguisherPts.length > 0
        ? extinguisherPts
        : (floor.furniture || [])
            .filter((f) => String(f.kind) === KIND_EXTINGUISHER)
            .map((f) => ({ x: f.x, y: f.y }));
    let n = 0;
    const halfFs = SIZE.fireSign.width / 2;
    for (const p of pts) {
      const near = nearestWallPoint(walls, p, openings, halfFs);
      if (!near) continue;
      const place = placeOnWall(
        near.wall,
        Math.min(0.9, near.t + 0.06),
        SIZE.fireSign.depth,
        p,
        openings,
        halfFs,
      walls,
      );
      if (!place) continue;
      const room = rooms.find((r) => pointInPolygon(p.x, p.y, r.points));
      const item: Furniture = {
        id: uid("fs"),
        kind: KIND_FIRE_SIGN as Furniture["kind"],
        x: place.x,
        y: place.y,
        width: SIZE.fireSign.width,
        depth: SIZE.fireSign.depth,
        rotation: place.rotation,
      };
      if (tryAdd(occupied, room?.points || null, item)) {
        floor.furniture = [...(floor.furniture || []), item];
        placed.push(item);
        n++;
      }
    }
    report.push(`Знаков «Огнетушитель» (F04): ${n}`);
  }

  // ——— Направление к выходу (шаг ≤5 м, ГОСТ 34428 п.9.3.2.8) ———
  if (opts.exitArrows && exitDoors.length) {
    let n = 0;
    const corridors = dryRooms.filter(isCorridorLike);
    const targets = corridors.length
      ? corridors
      : dryRooms.filter((r) => r.area > 100_000).slice(0, 4);

    for (const room of targets) {
      const c = centroid(room.points);
      // ближайший выход
      const exit = exitDoors
        .map((e) => ({ e, d: dist(c, e.point) }))
        .sort((a, b) => a.d - b.d)[0]?.e;
      if (!exit) continue;

      // стены комнаты — расставить вдоль длинных
      const roomWalls = walls.filter((w) => {
        if (!w.start || !w.end) return false;
        const mid = {
          x: (w.start.x + w.end.x) / 2,
          y: (w.start.y + w.end.y) / 2,
        };
        const dx = w.end.x - w.start.x;
        const dy = w.end.y - w.start.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const th = (w.thickness || 12) / 2 + 20;
        const a = pointInPolygon(mid.x + nx * th, mid.y + ny * th, room.points);
        const b = pointInPolygon(mid.x - nx * th, mid.y - ny * th, room.points);
        return a !== b || pointInPolygon(mid.x, mid.y, room.points);
      });

      const halfArr = SIZE.exitArrow.width / 2;
      for (const wall of roomWalls) {
        const len = wallLen(wall);
        if (len < EXIT_ARROW_STEP_CM * 0.6) continue;
        const steps = Math.max(1, Math.floor(len / EXIT_ARROW_STEP_CM));
        for (let i = 1; i <= steps; i++) {
          const t = i / (steps + 1);
          const place = placeOnWall(
            wall,
            t,
            SIZE.exitArrow.depth,
            c,
            openings,
            halfArr,
          walls,
          );
          if (!place) continue;
          // не ставить слишком близко к выходу (там уже «Выход»)
          if (dist({ x: place.x, y: place.y }, exit.point) < 140) continue;
          const item: Furniture = {
            id: uid("arr"),
            kind: KIND_EXIT_ARROW as Furniture["kind"],
            x: place.x,
            y: place.y,
            width: SIZE.exitArrow.width,
            depth: SIZE.exitArrow.depth,
            rotation: place.rotation,
          };
          if (tryAdd(occupied, room.points, item)) {
            floor.furniture = [...(floor.furniture || []), item];
            placed.push(item);
            n++;
          }
        }
      }
    }
    report.push(
      `Знаков направления (шаг ≤${EXIT_ARROW_STEP_CM / 100} м): ${n}`,
    );
  }

  // ——— Аптечка (≥1 на этаж, у выхода / общего помещения) ———
  if (opts.firstAid) {
    let n = 0;
    const preferRooms = [...dryRooms].sort((a, b) => {
      const score = (r: RoomInfo) => {
        if (isWetRoom(r)) return -1e9;
        const name = (r.name + r.role).toLowerCase();
        if (/kitchen|кухн|пантри|lounge|отдых|reception|ресеп/.test(name))
          return 100 + r.area;
        if (isCorridorLike(r)) return 50 + r.area;
        return r.area;
      };
      return score(b) - score(a);
    });

    const halfAid = SIZE.firstAid.width / 2;
    const tryFirstAidNear = (anchor: Pt, room: RoomInfo | null) => {
      const near = nearestWallPoint(walls, anchor, openings, halfAid);
      if (!near) return false;
      const place = placeOnWall(
        near.wall,
        near.t,
        SIZE.firstAid.depth,
        anchor,
        openings,
        halfAid,
      walls,
      );
      if (!place) return false;
      const item: Furniture = {
        id: uid("aid"),
        kind: KIND_FIRST_AID as Furniture["kind"],
        x: place.x,
        y: place.y,
        width: SIZE.firstAid.width,
        depth: SIZE.firstAid.depth,
        rotation: place.rotation,
      };
      if (!tryAdd(occupied, room?.points || null, item)) return false;
      floor.furniture = [...(floor.furniture || []), item];
      placed.push(item);
      return true;
    };

    if (exitDoors[0]) {
      const room =
        rooms.find((r) => exitDoors[0].roomIds.includes(r.id)) || null;
      if (tryFirstAidNear(exitDoors[0].point, room)) n++;
    }
    if (!n && preferRooms[0]) {
      if (tryFirstAidNear(centroid(preferRooms[0].points), preferRooms[0]))
        n++;
    }
    // крупные этажи — вторая аптечка
    const totalArea = rooms.reduce((s, r) => s + r.area, 0);
    if (totalArea > 400_000 && preferRooms[1]) {
      if (tryFirstAidNear(centroid(preferRooms[1].points), preferRooms[1]))
        n++;
    }
    report.push(`Аптечек: ${n}`);
    if (!n) {
      warnings.push("Не удалось разместить аптечку — поставьте вручную у выхода.");
    }
  }

  report.push(`Всего объектов: ${placed.length}`);

  return {
    plan: next,
    markers: input.markers,
    report,
    warnings,
    placed,
  };
}

export function isSafetyKind(kind: string) {
  return (SAFETY_KINDS as readonly string[]).includes(kind);
}
