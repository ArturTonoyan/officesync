import type { Opening, Room, Wall } from "@jbaysolutions/floorplan-react";
import {
  pointInPolygon,
  polygonAreaCm2,
  polygonBounds,
  type Pt,
} from "./geometry";

const SNAP_CM = 8;
const ON_SEG_TOL = 14; // см — точка лежит на стене (T-стык)
const MIN_ROOM_AREA_CM2 = 1.2 * 10_000; // 1.2 м²
const ROOM_COLORS = [
  "#dbeafe",
  "#dcfce7",
  "#fef3c7",
  "#fce7f3",
  "#e0e7ff",
  "#ffedd5",
];

type NodeId = string;

type Seg = {
  id: string;
  parentWallId: string;
  start: Pt;
  end: Pt;
};

function snapKey(p: Pt): NodeId {
  const x = Math.round(p.x / SNAP_CM) * SNAP_CM;
  const y = Math.round(p.y / SNAP_CM) * SNAP_CM;
  return `${x},${y}`;
}

function parseKey(id: NodeId): Pt {
  const [x, y] = id.split(",").map(Number);
  return { x, y };
}

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angle(from: Pt, to: Pt): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function centroid(points: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

function signedArea(points: Pt[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

function ensureCcw(points: Pt[]): Pt[] {
  return signedArea(points) < 0 ? [...points].reverse() : points;
}

function nearlySamePoly(a: Pt[], b: Pt[]): boolean {
  if (a.length < 3 || b.length < 3) return false;
  const ca = centroid(a);
  const cb = centroid(b);
  if (dist(ca, cb) > SNAP_CM * 6) return false;
  const aa = polygonAreaCm2(a);
  const ab = polygonAreaCm2(b);
  if (aa <= 0 || ab <= 0) return false;
  const ratio = Math.min(aa, ab) / Math.max(aa, ab);
  if (ratio < 0.75) return false;
  return pointInPolygon(ca.x, ca.y, b) && pointInPolygon(cb.x, cb.y, a);
}

/** Проекция точки на отрезок; null если далеко от линии или вне сегмента */
function projectOnSegment(
  p: Pt,
  a: Pt,
  b: Pt,
  tol = ON_SEG_TOL,
): { point: Pt; t: number } | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1) return null;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  if (t < 0.02 || t > 0.98) return null; // не концы
  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  if (dist(p, proj) > tol) return null;
  return { point: proj, t };
}

function segIntersection(
  a1: Pt,
  a2: Pt,
  b1: Pt,
  b2: Pt,
): { point: Pt; t: number; u: number } | null {
  const dax = a2.x - a1.x;
  const day = a2.y - a1.y;
  const dbx = b2.x - b1.x;
  const dby = b2.y - b1.y;
  const den = dax * dby - day * dbx;
  if (Math.abs(den) < 1e-6) return null; // параллельны
  const t = ((b1.x - a1.x) * dby - (b1.y - a1.y) * dbx) / den;
  const u = ((b1.x - a1.x) * day - (b1.y - a1.y) * dax) / den;
  if (t < 0.02 || t > 0.98 || u < 0.02 || u > 0.98) return null;
  return { point: { x: a1.x + t * dax, y: a1.y + t * day }, t, u };
}

/**
 * Режет стены в T-стыках и пересечениях — иначе внутренние стены
 * «висят» и весь офис остаётся одной гранью.
 */
function splitWallsAtJunctions(walls: Wall[]): Seg[] {
  const solid = (walls || []).filter(
    (w) => (w.kind || "wall") !== "railing" && w.start && w.end,
  );
  if (!solid.length) return [];

  // точки разреза по каждой стене (t ∈ (0,1)), плюс концы
  const cuts = new Map<string, number[]>();
  for (const w of solid) cuts.set(w.id, [0, 1]);

  const addCut = (wallId: string, t: number) => {
    const list = cuts.get(wallId);
    if (!list) return;
    if (t <= 0.02 || t >= 0.98) return;
    if (list.some((x) => Math.abs(x - t) < 0.01)) return;
    list.push(t);
  };

  // T-стык: конец стены лежит на другой стене
  for (const w of solid) {
    for (const end of [w.start, w.end]) {
      for (const other of solid) {
        if (other.id === w.id) continue;
        const hit = projectOnSegment(end, other.start, other.end);
        if (hit) addCut(other.id, hit.t);
      }
    }
  }

  // Пересечения стен крест-накрест
  for (let i = 0; i < solid.length; i++) {
    for (let j = i + 1; j < solid.length; j++) {
      const a = solid[i];
      const b = solid[j];
      const hit = segIntersection(a.start, a.end, b.start, b.end);
      if (!hit) continue;
      addCut(a.id, hit.t);
      addCut(b.id, hit.u);
    }
  }

  const segs: Seg[] = [];
  for (const w of solid) {
    const ts = [...(cuts.get(w.id) || [0, 1])].sort((a, b) => a - b);
    for (let i = 0; i < ts.length - 1; i++) {
      const t0 = ts[i];
      const t1 = ts[i + 1];
      if (t1 - t0 < 0.01) continue;
      const start = {
        x: w.start.x + (w.end.x - w.start.x) * t0,
        y: w.start.y + (w.end.y - w.start.y) * t0,
      };
      const end = {
        x: w.start.x + (w.end.x - w.start.x) * t1,
        y: w.start.y + (w.end.y - w.start.y) * t1,
      };
      if (dist(start, end) < SNAP_CM) continue;
      segs.push({
        id: `${w.id}#${i}`,
        parentWallId: w.id,
        start,
        end,
      });
    }
  }
  return segs;
}

type HalfEdge = {
  id: string;
  from: NodeId;
  to: NodeId;
  parentWallId: string;
  twinId: string;
  nextId?: string;
  used?: boolean;
};

/**
 * Минимальные грани после разбиения стен в стыках.
 * Самая большая грань = снаружи / оболочка — отбрасывается.
 */
export function findClosedLoopsFromWalls(walls: Wall[]): {
  loops: Pt[][];
  exteriorWallIds: Set<string>;
  shellLoop: Pt[] | null;
} {
  const segs = splitWallsAtJunctions(walls);
  if (segs.length < 3) {
    return { loops: [], exteriorWallIds: new Set(), shellLoop: null };
  }

  const nodePos = new Map<NodeId, Pt>();
  const adj = new Map<NodeId, { to: NodeId; parentWallId: string }[]>();

  const addNode = (p: Pt): NodeId => {
    const id = snapKey(p);
    if (!nodePos.has(id)) nodePos.set(id, parseKey(id));
    return id;
  };

  for (const s of segs) {
    const a = addNode(s.start);
    const b = addNode(s.end);
    if (a === b) continue;
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push({ to: b, parentWallId: s.parentWallId });
    adj.get(b)!.push({ to: a, parentWallId: s.parentWallId });
  }

  const halfEdges = new Map<string, HalfEdge>();
  for (const [from, outs] of adj) {
    for (const o of outs) {
      const id = `${from}>${o.to}`;
      if (halfEdges.has(id)) continue;
      halfEdges.set(id, {
        id,
        from,
        to: o.to,
        parentWallId: o.parentWallId,
        twinId: `${o.to}>${from}`,
      });
    }
  }

  const outByAngle = new Map<NodeId, HalfEdge[]>();
  for (const he of halfEdges.values()) {
    if (!outByAngle.has(he.from)) outByAngle.set(he.from, []);
    outByAngle.get(he.from)!.push(he);
  }
  for (const [node, list] of outByAngle) {
    const origin = nodePos.get(node)!;
    list.sort(
      (a, b) =>
        angle(origin, nodePos.get(a.to)!) - angle(origin, nodePos.get(b.to)!),
    );
  }

  // left-hand rule (y вниз): следующий исходящий после twin по возрастанию угла
  for (const he of halfEdges.values()) {
    const outgoing = outByAngle.get(he.to) || [];
    if (!outgoing.length) continue;
    const twinIdx = outgoing.findIndex((e) => e.id === he.twinId);
    if (twinIdx < 0) continue;
    he.nextId = outgoing[(twinIdx + 1) % outgoing.length].id;
  }

  const loops: Pt[][] = [];
  const faceWallSets: Set<string>[] = [];

  for (const start of halfEdges.values()) {
    if (start.used || !start.nextId) continue;
    const face: HalfEdge[] = [];
    let cur: HalfEdge | undefined = start;
    let guard = 0;
    let closed = false;
    while (cur && guard++ < 800) {
      if (cur.used) break;
      cur.used = true;
      face.push(cur);
      const next = cur.nextId ? halfEdges.get(cur.nextId) : undefined;
      if (!next) break;
      if (next.id === start.id) {
        closed = true;
        break;
      }
      cur = next;
    }
    if (!closed || face.length < 3) continue;

    const pts = face.map((e) => nodePos.get(e.from)!);
    const cleaned: Pt[] = [];
    for (const p of pts) {
      const prev = cleaned[cleaned.length - 1];
      if (!prev || dist(prev, p) > 1) cleaned.push(p);
    }
    if (cleaned.length >= 3) {
      const first = cleaned[0];
      const lastP = cleaned[cleaned.length - 1];
      if (dist(first, lastP) < 1) cleaned.pop();
    }
    if (cleaned.length < 3) continue;
    const area = polygonAreaCm2(cleaned);
    if (area < MIN_ROOM_AREA_CM2) continue;
    loops.push(ensureCcw(cleaned));
    faceWallSets.push(new Set(face.map((e) => e.parentWallId)));
  }

  if (!loops.length) {
    return { loops: [], exteriorWallIds: new Set(), shellLoop: null };
  }

  // Самая большая грань — оболочка здания / «весь офис»
  let exteriorIdx = 0;
  let maxA = -1;
  loops.forEach((loop, i) => {
    const a = polygonAreaCm2(loop);
    if (a > maxA) {
      maxA = a;
      exteriorIdx = i;
    }
  });

  const exteriorWallIds = faceWallSets[exteriorIdx] || new Set<string>();
  const shellLoop = loops[exteriorIdx];
  const shellArea = maxA;

  // Внутренние: не оболочка и не почти вся площадь здания
  const interior: Pt[][] = [];
  loops.forEach((loop, i) => {
    if (i === exteriorIdx) return;
    const a = polygonAreaCm2(loop);
    // отсечь почти-оболочку (баг обхода)
    if (a > shellArea * 0.85) return;
    interior.push(loop);
  });

  const unique: Pt[][] = [];
  for (const loop of interior) {
    if (unique.some((u) => nearlySamePoly(u, loop))) continue;
    // петля, внутри которой уже есть другая меньшая — оставляем обе
    // (это нормальные вложенные случаи редки в офисе)
    unique.push(loop);
  }

  // Если внутренних нет — не возвращаем оболочку как комнату
  return { loops: unique, exteriorWallIds, shellLoop };
}

export type DetectedRoomInfo = {
  room: Room;
  isNew: boolean;
  hasExteriorDoor: boolean;
  suggestedRole: "reception" | "corridor" | "work" | "wet";
};

const WET_RE = /туалет|санузел|wc|мойк|душевая|toilet|bath|restroom/i;

function roomHasExteriorDoor(
  room: Room,
  openings: Opening[],
  walls: Wall[],
  exteriorWallIds: Set<string>,
): boolean {
  const points = room.points || [];
  if (points.length < 3) return false;
  const wallById = new Map(walls.map((w) => [w.id, w]));

  for (const op of openings || []) {
    if (!/door/i.test(op.type || "")) continue;
    if (!exteriorWallIds.has(op.wallId)) continue;
    const wall = wallById.get(op.wallId);
    if (!wall) continue;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy) || 1;
    const t = Math.min(1, Math.max(0, (op.offset || 0) / len));
    const mx = wall.start.x + dx * t;
    const my = wall.start.y + dy * t;
    const nx = -dy / len;
    const ny = dx / len;
    if (
      pointInPolygon(mx + nx * 30, my + ny * 30, points) ||
      pointInPolygon(mx - nx * 30, my - ny * 30, points)
    ) {
      return true;
    }
  }
  return false;
}

/** Петля — оболочка: внутри ≥2 существующих комнат или площадь ≈ сумме комнат */
function isBuildingShell(loop: Pt[], existing: Room[]): boolean {
  if (existing.length < 2) return false;
  const cInside = existing.filter((r) => {
    const c = centroid(r.points || []);
    return pointInPolygon(c.x, c.y, loop);
  });
  if (cInside.length >= 2) return true;
  const loopA = polygonAreaCm2(loop);
  const sumA = existing.reduce(
    (s, r) => s + polygonAreaCm2(r.points || []),
    0,
  );
  if (sumA > 0 && loopA > sumA * 0.9) return true;
  return false;
}

/**
 * Дополняет этаж недостающими комнатами по контурам стен
 * и помечает комнаты с выходом наружу.
 */
export function ensureRoomsDetected(
  rooms: Room[],
  walls: Wall[],
  openings: Opening[],
): {
  rooms: Room[];
  infos: DetectedRoomInfo[];
  createdCount: number;
  removedShellCount: number;
} {
  const { loops, exteriorWallIds } = findClosedLoopsFromWalls(walls);
  const existing = [...(rooms || [])];
  let createdCount = 0;
  let colorIdx = existing.length;

  // Убрать ошибочно созданные ранее «весь офис» auto-комнаты
  const cleanedExisting = existing.filter((r) => {
    if (!r.id.startsWith("auto_room_")) return true;
    if (isBuildingShell(r.points || [], existing.filter((x) => x !== r))) {
      return false;
    }
    // слишком огромная относительно bbox стен
    const a = polygonAreaCm2(r.points || []);
    const others = existing.filter(
      (x) => x !== r && !x.id.startsWith("auto_room_"),
    );
    if (others.length && isBuildingShell(r.points || [], others)) return false;
    if (a > 500 * 10_000 && others.length >= 2) return false;
    return true;
  });
  const removedShellCount = existing.length - cleanedExisting.length;
  existing.length = 0;
  existing.push(...cleanedExisting);

  for (const loop of loops) {
    if (isBuildingShell(loop, existing)) continue;

    const covered = existing.some((r) => nearlySamePoly(r.points || [], loop));
    if (covered) continue;

    const c = centroid(loop);
    const aLoop = polygonAreaCm2(loop);

    // центр уже в существующей комнате сопоставимой/большей площади
    const host = existing.find((r) => pointInPolygon(c.x, c.y, r.points || []));
    if (host) {
      const aEx = polygonAreaCm2(host.points || []);
      if (aLoop <= aEx * 1.2) continue;
    }

    // петля содержит несколько существующих комнат — оболочка
    const children = existing.filter((r) => {
      const rc = centroid(r.points || []);
      return pointInPolygon(rc.x, rc.y, loop);
    });
    if (children.length >= 2) continue;

    const name = `Комната ${existing.length + 1}`;
    const room: Room = {
      id: `auto_room_${Math.random().toString(36).slice(2, 10)}`,
      name,
      points: loop,
      color: ROOM_COLORS[colorIdx % ROOM_COLORS.length],
    };
    colorIdx += 1;
    existing.push(room);
    createdCount += 1;
  }

  const infos: DetectedRoomInfo[] = existing.map((room) => {
    const wet = WET_RE.test(room.name || "");
    const hasExteriorDoor = roomHasExteriorDoor(
      room,
      openings,
      walls,
      exteriorWallIds,
    );
    let suggestedRole: DetectedRoomInfo["suggestedRole"] = "work";
    if (wet) suggestedRole = "wet";
    else if (hasExteriorDoor) {
      const b = polygonBounds(room.points || []);
      const area = polygonAreaCm2(room.points || []);
      const aspect =
        b && b.height > 0
          ? Math.max(b.width, b.height) / Math.min(b.width, b.height)
          : 1;
      const narrow = aspect >= 2.2 || area < 12 * 10_000;
      suggestedRole = narrow ? "corridor" : "reception";
    }
    return {
      room,
      isNew: room.id.startsWith("auto_room_"),
      hasExteriorDoor,
      suggestedRole,
    };
  });

  return { rooms: existing, infos, createdCount, removedShellCount };
}
