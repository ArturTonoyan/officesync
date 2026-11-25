/**
 * Алгоритм построения плана эвакуации и размещения постеров на стенах.
 * Ориентиры: ГОСТ 34428-2018, ГОСТ Р 12.2.143, ГОСТ 12.4.026, СП 1.13130.
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
import { buildEvacuationSvg } from "./buildEvacuationSvg";
import {
  EVAC_POSTER_FLOOR_CM,
  EVAC_POSTER_KIND,
  EVAC_POSTER_LOCAL_CM,
  type EvacuationAnalysis,
  type EvacExit,
  type EvacPosterSpot,
  type EvacRoute,
  type EvacSafetyItem,
  type GenerateEvacuationResult,
} from "./types";

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
  if (!wall) return [];
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const samples = [
    { x: p.x + nx * 35, y: p.y + ny * 35 },
    { x: p.x - nx * 35, y: p.y - ny * 35 },
    p,
  ];
  const ids: string[] = [];
  for (const room of rooms) {
    if (
      samples.some((s) => pointInPolygon(s.x, s.y, room.points)) &&
      !ids.includes(room.id)
    ) {
      ids.push(room.id);
    }
  }
  return ids;
}

type GraphEdge = { to: string; via: Pt; cost: number };

function buildRoomGraph(
  rooms: { id: string; points: Pt[] }[],
  openings: Opening[],
  walls: Wall[],
  exteriorWallIds: Set<string>,
): {
  adj: Map<string, GraphEdge[]>;
  exits: EvacExit[];
  doorPoints: Map<string, Pt>;
} {
  const adj = new Map<string, GraphEdge[]>();
  for (const r of rooms) adj.set(r.id, []);

  const exits: EvacExit[] = [];
  const doorPoints = new Map<string, Pt>();

  for (const op of openings || []) {
    if (!isDoor(op)) continue;
    const p = openingPoint(op, walls);
    if (!p) continue;
    doorPoints.set(op.id, p);
    const touched = roomsTouchingOpening(op, walls, rooms);
    const exterior = exteriorWallIds.has(op.wallId);

    if (exterior && touched.length >= 1) {
      exits.push({
        id: `exit_${op.id}`,
        point: p,
        roomId: touched[0],
        openingId: op.id,
        primary: false,
      });
    }

    if (touched.length >= 2) {
      const [a, b] = touched;
      const ca = centroid(rooms.find((r) => r.id === a)!.points);
      const cb = centroid(rooms.find((r) => r.id === b)!.points);
      const cost = dist(ca, p) + dist(p, cb);
      adj.get(a)!.push({ to: b, via: p, cost });
      adj.get(b)!.push({ to: a, via: p, cost });
    }
  }

  // Основные выходы: до двух ближайших к «центру масс» этажа; остальные — запасные
  if (exits.length) {
    const allPts = rooms.flatMap((r) => r.points);
    const center = centroid(allPts.length ? allPts : exits.map((e) => e.point));
    const sorted = [...exits].sort(
      (a, b) => dist(a.point, center) - dist(b.point, center),
    );
    const primaryCount = Math.min(2, Math.max(1, sorted.length));
    for (let i = 0; i < sorted.length; i++) {
      sorted[i].primary = i < primaryCount;
    }
    // синхронизация флагов в исходном массиве
    const byId = new Map(sorted.map((e) => [e.id, e.primary]));
    for (const e of exits) e.primary = byId.get(e.id) ?? false;
  }

  return { adj, exits, doorPoints };
}

type PathResult = { roomPath: string[]; doorPoints: Pt[]; cost: number } | null;

function shortestPath(
  adj: Map<string, GraphEdge[]>,
  rooms: { id: string; points: Pt[] }[],
  fromRoomId: string,
  toRoomId: string,
): PathResult {
  if (fromRoomId === toRoomId) {
    return { roomPath: [fromRoomId], doorPoints: [], cost: 0 };
  }
  const distMap = new Map<string, number>();
  const prev = new Map<string, { from: string; via: Pt }>();
  const pq: { id: string; d: number }[] = [];
  for (const r of rooms) distMap.set(r.id, Infinity);
  distMap.set(fromRoomId, 0);
  pq.push({ id: fromRoomId, d: 0 });

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const cur = pq.shift()!;
    if (cur.d > (distMap.get(cur.id) ?? Infinity)) continue;
    if (cur.id === toRoomId) break;
    for (const e of adj.get(cur.id) || []) {
      const nd = cur.d + e.cost;
      if (nd < (distMap.get(e.to) ?? Infinity)) {
        distMap.set(e.to, nd);
        prev.set(e.to, { from: cur.id, via: e.via });
        pq.push({ id: e.to, d: nd });
      }
    }
  }

  if (!prev.has(toRoomId) && fromRoomId !== toRoomId) return null;

  const roomPath: string[] = [];
  const doorPoints: Pt[] = [];
  let walk: string | undefined = toRoomId;
  while (walk && walk !== fromRoomId) {
    roomPath.push(walk);
    const p = prev.get(walk);
    if (!p) break;
    doorPoints.push(p.via);
    walk = p.from;
  }
  roomPath.push(fromRoomId);
  roomPath.reverse();
  doorPoints.reverse();
  return {
    roomPath,
    doorPoints,
    cost: distMap.get(toRoomId) ?? Infinity,
  };
}

function pathPoints(
  rooms: { id: string; points: Pt[] }[],
  path: PathResult,
  exitPoint: Pt,
): Pt[] {
  if (!path) return [];
  const pts: Pt[] = [];
  for (let i = 0; i < path.roomPath.length; i++) {
    const room = rooms.find((r) => r.id === path.roomPath[i]);
    if (!room) continue;
    pts.push(centroid(room.points));
    if (i < path.doorPoints.length) pts.push(path.doorPoints[i]);
  }
  pts.push(exitPoint);
  // упростить подряд идущие почти совпадающие
  const out: Pt[] = [];
  for (const p of pts) {
    if (!out.length || dist(out[out.length - 1], p) > 8) out.push(p);
  }
  return out;
}

function collectRoutes(
  rooms: { id: string; points: Pt[] }[],
  adj: Map<string, GraphEdge[]>,
  exits: EvacExit[],
): EvacRoute[] {
  const routes: EvacRoute[] = [];
  const primaryExits = exits.filter((e) => e.primary);
  const secondaryExits = exits.filter((e) => !e.primary);
  /** рёбра графа маршрутов: "x1,y1|x2,y2" → primary? */
  const edgePrimary = new Map<string, boolean>();

  const edgeKey = (a: Pt, b: Pt) => {
    const A = `${Math.round(a.x)},${Math.round(a.y)}`;
    const B = `${Math.round(b.x)},${Math.round(b.y)}`;
    return A < B ? `${A}|${B}` : `${B}|${A}`;
  };

  const addPathEdges = (pts: Pt[], primary: boolean) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const k = edgeKey(pts[i], pts[i + 1]);
      const prev = edgePrimary.get(k);
      // сплошная (primary) побеждает штриховую на общем участке
      if (prev === true) continue;
      if (prev === false && !primary) continue;
      edgePrimary.set(k, primary);
    }
  };

  for (const room of rooms) {
    let bestPrimary: { exit: EvacExit; path: PathResult; cost: number } | null =
      null;
    for (const exit of primaryExits.length ? primaryExits : exits) {
      const path = shortestPath(adj, rooms, room.id, exit.roomId);
      if (!path) continue;
      const cost = path.cost + dist(centroid(room.points), exit.point) * 0.01;
      if (!bestPrimary || cost < bestPrimary.cost) {
        bestPrimary = { exit, path, cost };
      }
    }
    if (bestPrimary?.path) {
      const pts = pathPoints(rooms, bestPrimary.path, bestPrimary.exit.point);
      addPathEdges(pts, true);
      routes.push({
        points: pts,
        primary: true,
        fromRoomId: room.id,
        toExitId: bestPrimary.exit.id,
      });
    }

    const candidates = secondaryExits.length
      ? secondaryExits
      : exits.filter((e) => e.id !== bestPrimary?.exit.id);
    let bestSec: { exit: EvacExit; path: PathResult; cost: number } | null =
      null;
    for (const exit of candidates) {
      const path = shortestPath(adj, rooms, room.id, exit.roomId);
      if (!path) continue;
      const cost = path.cost + dist(centroid(room.points), exit.point) * 0.01;
      if (!bestSec || cost < bestSec.cost) {
        bestSec = { exit, path, cost };
      }
    }
    if (bestSec?.path && bestSec.exit.id !== bestPrimary?.exit.id) {
      const pts = pathPoints(rooms, bestSec.path, bestSec.exit.point);
      addPathEdges(pts, false);
      routes.push({
        points: pts,
        primary: false,
        fromRoomId: room.id,
        toExitId: bestSec.exit.id,
      });
    }
  }

  // Собрать по одному сегменту на ребро — чистая схема без наложения
  const segmentRoutes: EvacRoute[] = [];
  for (const [key, primary] of edgePrimary) {
    const [a, b] = key.split("|");
    const [x1, y1] = a.split(",").map(Number);
    const [x2, y2] = b.split(",").map(Number);
    segmentRoutes.push({
      points: [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ],
      primary,
      fromRoomId: "",
      toExitId: "",
    });
  }

  // Стрелки к выходам: короткий финальный отрезок от ближайшей точки маршрута
  for (const exit of exits) {
    let nearest: Pt | null = null;
    let best = Infinity;
    for (const r of routes) {
      if (!r.points.length) continue;
      if (r.toExitId && r.toExitId !== exit.id) continue;
      const last = r.points[r.points.length - 1];
      const d = dist(last, exit.point);
      if (d < best) {
        best = d;
        nearest =
          r.points.length >= 2 ? r.points[r.points.length - 2] : r.points[0];
      }
    }
    if (nearest && dist(nearest, exit.point) > 5) {
      segmentRoutes.push({
        points: [nearest, exit.point],
        primary: exit.primary,
        fromRoomId: exit.roomId,
        toExitId: exit.id,
      });
    }
  }

  return segmentRoutes.length ? segmentRoutes : routes;
}

type Occupied = { bounds: Rect };

const WET_ROOM_RE =
  /туалет|санузел|wc|мойк|душевая|toilet|bath|restroom|кабин/i;
const TOILET_FURN_RE =
  /toilet|shower|bathtub|унитаз|душ|cabin|stall|wc/i;

function isWetRoom(name: string, role?: string) {
  return WET_ROOM_RE.test(`${name || ""} ${role || ""}`);
}

/** Отступ центра постера от оси стены: полтолщины + полглубины + зазор в комнату */
function wallPosterInset(wall: Wall, depth: number) {
  return (wall.thickness || 12) / 2 + depth / 2 + 6;
}

/** Проёмы на этой стене и на параллельных «двойниках» (иначе карта попадает в дверь) */
function openingRangesOnWall(
  wall: Wall,
  openings: Opening[],
  walls: Wall[],
  marginCm: number,
): { t0: number; t1: number }[] {
  if (!wall.start || !wall.end) return [];
  const len = wallLenSafe(wall);
  if (len < 1) return [];
  const ux = (wall.end.x - wall.start.x) / len;
  const uy = (wall.end.y - wall.start.y) / len;
  const nx = -uy;
  const ny = ux;
  const ranges: { t0: number; t1: number }[] = [];

  for (const op of openings) {
    const host = walls.find((w) => w.id === op.wallId);
    if (!host?.start || !host?.end) continue;
    const hLen = wallLenSafe(host);
    const hUx = (host.end.x - host.start.x) / hLen;
    const hUy = (host.end.y - host.start.y) / hLen;
    // та же стена или почти коллинеарная рядом
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

function tHitsOpening(
  wall: Wall,
  t: number,
  halfPosterCm: number,
  openings: Opening[],
  walls: Wall[],
): boolean {
  const len = wallLenSafe(wall);
  const pad = halfPosterCm / len;
  for (const range of openingRangesOnWall(wall, openings, walls, 55)) {
    if (t + pad >= range.t0 && t - pad <= range.t1) return true;
  }
  return false;
}

/** Ближайшая доля t вне проёмов */
function clearTOnWall(
  wall: Wall,
  preferredT: number,
  halfPosterCm: number,
  openings: Opening[],
  walls: Wall[],
): number | null {
  const clamp = (t: number) => Math.min(0.85, Math.max(0.15, t));
  const base = clamp(preferredT);
  if (!tHitsOpening(wall, base, halfPosterCm, openings, walls)) return base;
  const len = wallLenSafe(wall);
  const step = Math.max(0.015, 10 / len);
  for (let i = 1; i <= 48; i++) {
    for (const dir of [1, -1] as const) {
      const t = clamp(base + dir * step * i);
      if (!tHitsOpening(wall, t, halfPosterCm, openings, walls)) return t;
    }
  }
  return null;
}

function doorKeepout(op: Opening, walls: Wall[]): Rect | null {
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
  const halfW = (op.width || 90) / 2 + 35;
  const depth = (wall.thickness || 12) / 2 + 70;
  const corners = [
    { x: p.x - ux * halfW - nx * depth, y: p.y - uy * halfW - ny * depth },
    { x: p.x + ux * halfW - nx * depth, y: p.y + uy * halfW - ny * depth },
    { x: p.x + ux * halfW + nx * depth, y: p.y + uy * halfW + ny * depth },
    { x: p.x - ux * halfW + nx * depth, y: p.y - uy * halfW + ny * depth },
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

/** Зоны кабин туалета / душа по мебели */
function wetFurnitureKeepouts(furniture: Furniture[]): Rect[] {
  const out: Rect[] = [];
  for (const f of furniture || []) {
    if (!TOILET_FURN_RE.test(String(f.kind || ""))) continue;
    const b = rotatedBounds(f.x, f.y, f.width, f.depth, f.rotation || 0);
    out.push({
      x: b.x - 25,
      y: b.y - 25,
      width: b.width + 50,
      height: b.height + 50,
    });
  }
  return out;
}

function tryPlacePoster(
  occupied: Occupied[],
  roomPoints: Pt[],
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation: number,
): Furniture | null {
  const bounds = rotatedBounds(x, y, width, depth, rotation);
  if (!pointInPolygon(x, y, roomPoints)) return null;
  const rad = ((rotation || 0) * Math.PI) / 180;
  // центр и лицевая кромка строго внутри комнаты (не в толще стены)
  const faceX = x + Math.sin(rad) * (depth / 2 + 2);
  const faceY = y + Math.cos(rad) * (depth / 2 + 2);
  if (!pointInPolygon(faceX, faceY, roomPoints)) return null;
  // чуть внутрь от центра — не в толще стены
  if (
    !pointInPolygon(x + Math.sin(rad) * 2, y + Math.cos(rad) * 2, roomPoints)
  ) {
    return null;
  }
  if (occupied.some((o) => rectsOverlap(o.bounds, bounds, 10))) return null;

  const item: Furniture = {
    id: uid("evac"),
    kind: EVAC_POSTER_KIND as Furniture["kind"],
    x,
    y,
    width,
    depth,
    rotation,
  };
  occupied.push({ bounds });
  return item;
}
/** Стены, прилегающие к комнате (середина рядом с границей / внутри буфера). */
function wallsForRoom(roomPoints: Pt[], walls: Wall[]): Wall[] {
  const out: Wall[] = [];
  for (const wall of walls) {
    if (!wall.start || !wall.end) continue;
    const mid = {
      x: (wall.start.x + wall.end.x) / 2,
      y: (wall.start.y + wall.end.y) / 2,
    };
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const th = (wall.thickness || 12) / 2 + 8;
    const a = pointInPolygon(mid.x + nx * th, mid.y + ny * th, roomPoints);
    const b = pointInPolygon(mid.x - nx * th, mid.y - ny * th, roomPoints);
    if (a !== b || pointInPolygon(mid.x, mid.y, roomPoints)) {
      out.push(wall);
    }
  }
  return out.length ? out : walls;
}

/** Размещение постера вдоль стены комнаты — рядом с путём эвакуации, но НЕ в проёме */
function placePosterInRoom(
  room: { id: string; points: Pt[] },
  walls: Wall[],
  openings: Opening[],
  occupied: Occupied[],
  local: boolean,
): { furniture: Furniture; spot: EvacPosterSpot } | null {
  const size = local ? EVAC_POSTER_LOCAL_CM : EVAC_POSTER_FLOOR_CM;
  const points = room.points;
  if (!points?.length) return null;
  const halfW = size.width / 2;

  const candidates: { x: number; y: number; rot: number; prefer: number }[] =
    [];

  const pushAlongWall = (wall: Wall, t: number, prefer: number) => {
    if (!wall.start || !wall.end) return;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy) || 1;
    if (len < size.width + 50) return;
    const clear = clearTOnWall(wall, t, halfW, openings, walls);
    if (clear == null) return;
    const px = wall.start.x + dx * clear;
    const py = wall.start.y + dy * clear;
    const nx = -dy / len;
    const ny = dx / len;
    const inset = wallPosterInset(wall, size.depth);
    const inA = pointInPolygon(
      px + nx * (inset + 12),
      py + ny * (inset + 12),
      points,
    );
    if (!inA) {
      // нормаль должна смотреть внутрь комнаты
      const inB = pointInPolygon(
        px - nx * (inset + 12),
        py - ny * (inset + 12),
        points,
      );
      if (!inB) return;
    }
    const sign = inA ? 1 : -1;
    const rot = (Math.atan2(sign * nx, sign * ny) * 180) / Math.PI;
    candidates.push({
      x: px + sign * nx * inset,
      y: py + sign * ny * inset,
      rot,
      prefer,
    });
  };

  const roomWalls = wallsForRoom(points, walls);

  // сначала сплошные участки стен (не в проёме)
  for (const wall of roomWalls) {
    pushAlongWall(wall, 0.5, 0);
    pushAlongWall(wall, 0.25, 1);
    pushAlongWall(wall, 0.75, 1);
    pushAlongWall(wall, 0.35, 2);
    pushAlongWall(wall, 0.65, 2);
  }

  // рядом с дверями комнаты — сбоку от створа (запас шире)
  for (const op of openings) {
    if (!isDoor(op)) continue;
    const touched = roomsTouchingOpening(op, walls, [room]);
    if (!touched.includes(room.id)) continue;
    const wall =
      walls.find((w) => w.id === op.wallId) ||
      roomWalls.find((w) => {
        if (!w.start || !w.end) return false;
        const p = openingPoint(op, walls);
        if (!p) return false;
        const len = wallLenSafe(w);
        const ux = (w.end.x - w.start.x) / len;
        const uy = (w.end.y - w.start.y) / len;
        const along =
          (p.x - w.start.x) * ux + (p.y - w.start.y) * uy;
        const lat = Math.abs(
          (p.x - w.start.x) * -uy + (p.y - w.start.y) * ux,
        );
        return along >= -5 && along <= len + 5 && lat < 40;
      });
    if (!wall) continue;
    const len = wallLenSafe(wall);
    const p = openingPoint(op, walls);
    if (!p) continue;
    const ux = (wall.end.x - wall.start.x) / len;
    const uy = (wall.end.y - wall.start.y) / len;
    const t =
      ((p.x - wall.start.x) * ux + (p.y - wall.start.y) * uy) / len;
    const doorHalf = ((op.width || 90) / 2 + halfW + 45) / len;
    pushAlongWall(wall, t + doorHalf, 3);
    pushAlongWall(wall, t - doorHalf, 3);
  }

  candidates.sort((a, b) => a.prefer - b.prefer);

  for (const c of candidates) {
    const item = tryPlacePoster(
      occupied,
      points,
      c.x,
      c.y,
      size.width,
      size.depth,
      c.rot,
    );
    if (item) {
      return {
        furniture: item,
        spot: {
          roomId: room.id,
          point: { x: item.x, y: item.y },
          rotation: item.rotation || 0,
          local,
        },
      };
    }
  }
  return null;
}

function wallLenSafe(wall: Wall) {
  return (
    Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y) || 1
  );
}

function pickPosterRooms(
  infos: {
    room: { id: string; name?: string; points: Pt[] };
    hasExteriorDoor: boolean;
    suggestedRole: string;
  }[],
): { room: { id: string; name?: string; points: Pt[] }; local: boolean }[] {
  const out: {
    room: { id: string; name?: string; points: Pt[] };
    local: boolean;
  }[] = [];
  // санузлы / душевые / кабинки — планы эвакуации не ставим
  const usable = infos.filter(
    (i) =>
      i.suggestedRole !== "wet" &&
      !isWetRoom(i.room.name || "", i.suggestedRole),
  );
  const corridors = usable.filter(
    (i) =>
      i.suggestedRole === "corridor" || i.suggestedRole === "reception",
  );
  const withExit = usable.filter((i) => i.hasExteriorDoor);
  const work = usable.filter(
    (i) =>
      i.suggestedRole === "work" ||
      !["corridor", "reception", "wet"].includes(i.suggestedRole),
  );

  const floorTargets = [
    ...corridors,
    ...withExit.filter((i) => !corridors.includes(i)),
  ];
  for (const t of floorTargets) {
    out.push({ room: t.room, local: false });
  }

  if (!out.length && usable.length) {
    const biggest = [...usable].sort(
      (a, b) =>
        polygonAreaCm2(b.room.points || []) -
        polygonAreaCm2(a.room.points || []),
    )[0];
    out.push({ room: biggest.room, local: false });
  }

  // Локальные: кабинеты без прямого выхода, ≥ 8 м² (не туалет)
  for (const t of work) {
    if (t.hasExteriorDoor) continue;
    const area = polygonAreaCm2(t.room.points || []);
    if (area < 8 * 10_000) continue;
    if (out.some((o) => o.room.id === t.room.id)) continue;
    out.push({ room: t.room, local: true });
  }

  return out;
}

/** Ближайшая стена к точке и нормаль «от стены к точке» (для ориентации постера). */
function nearestWallFacing(
  walls: Wall[],
  p: Pt,
): { wall: Wall; rotation: number; dist: number } | null {
  let best: { wall: Wall; rotation: number; dist: number } | null = null;
  for (const wall of walls || []) {
    if (!wall.start || !wall.end) continue;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy) || 1;
    let t = ((p.x - wall.start.x) * dx + (p.y - wall.start.y) * dy) / (len * len);
    t = Math.min(1, Math.max(0, t));
    const proj = {
      x: wall.start.x + dx * t,
      y: wall.start.y + dy * t,
    };
    const d = dist(p, proj);
    const nx = -dy / len;
    const ny = dx / len;
    // нормаль в сторону клика
    const toClickX = p.x - proj.x;
    const toClickY = p.y - proj.y;
    const sign = toClickX * nx + toClickY * ny >= 0 ? 1 : -1;
    const rotation = (Math.atan2(sign * nx, sign * ny) * 180) / Math.PI;
    if (!best || d < best.dist) {
      best = { wall, rotation, dist: d };
    }
  }
  return best;
}

/**
 * Ставит план эвакуации у ближайшей стены к клику (вплотную), не в проёме.
 */
export function placeEvacuationPosterAt(
  plan: FloorPlan,
  floorId: string | null | undefined,
  x: number,
  y: number,
  opts?: { local?: boolean },
): { plan: FloorPlan; furniture: Furniture | null; message: string } {
  const next: FloorPlan = JSON.parse(JSON.stringify(plan));
  const floor = next.floors.find((f) => f.id === floorId) || next.floors[0];
  if (!floor) {
    return { plan, furniture: null, message: "Нет этажа" };
  }

  const local = opts?.local ?? false;
  const size = local ? EVAC_POSTER_LOCAL_CM : EVAC_POSTER_FLOOR_CM;
  const walls = floor.walls || [];
  const openings = floor.openings || [];
  const halfW = size.width / 2;
  const click = { x, y };

  let best: {
    x: number;
    y: number;
    rotation: number;
    dist: number;
  } | null = null;

  for (const wall of walls) {
    if (!wall.start || !wall.end) continue;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    let t =
      ((click.x - wall.start.x) * ux + (click.y - wall.start.y) * uy) / len;
    t = Math.min(0.9, Math.max(0.1, t));
    const clear = clearTOnWall(wall, t, halfW, openings, walls);
    if (clear == null) continue;
    t = clear;
    const onWall = {
      x: wall.start.x + ux * t * len,
      y: wall.start.y + uy * t * len,
    };
    const d = dist(click, onWall);
    const inset = wallPosterInset(wall, size.depth);
    const side =
      (click.x - onWall.x) * nx + (click.y - onWall.y) * ny >= 0 ? 1 : -1;
    const px = onWall.x + side * nx * inset;
    const py = onWall.y + side * ny * inset;
    const rotation = (Math.atan2(side * nx, side * ny) * 180) / Math.PI;
    if (!best || d < best.dist) {
      best = { x: px, y: py, rotation, dist: d };
    }
  }

  if (!best) {
    return {
      plan,
      furniture: null,
      message: "Нет свободного места у стены вне проёма",
    };
  }

  const facing = nearestWallFacing(walls, click);
  const item: Furniture = {
    id: uid("evac"),
    kind: EVAC_POSTER_KIND as Furniture["kind"],
    x: best.x,
    y: best.y,
    width: size.width,
    depth: size.depth,
    rotation: best.rotation ?? facing?.rotation ?? 0,
  };
  floor.furniture = [...(floor.furniture || []), item];
  return {
    plan: next,
    furniture: item,
    message: "План эвакуации размещён",
  };
}

/** @deprecated используйте placeEvacuationPosterAt */
export function placeEvacuationPosterOnWall(
  plan: FloorPlan,
  floorId: string | null | undefined,
  wallId: string,
  opts?: { local?: boolean },
): { plan: FloorPlan; furniture: Furniture | null; message: string } {
  const floor = plan.floors.find((f) => f.id === floorId) || plan.floors[0];
  const wall = floor?.walls?.find((w) => w.id === wallId);
  if (!wall?.start || !wall?.end) {
    return { plan, furniture: null, message: "Стена не найдена" };
  }
  const mid = {
    x: (wall.start.x + wall.end.x) / 2,
    y: (wall.start.y + wall.end.y) / 2,
  };
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const local = opts?.local ?? false;
  const size = local ? EVAC_POSTER_LOCAL_CM : EVAC_POSTER_FLOOR_CM;
  const inset = wallPosterInset(wall, size.depth);
  const x = mid.x + nx * inset;
  const y = mid.y + ny * inset;
  const probe = placeEvacuationPosterAt(plan, floorId, x, y, opts);
  if (probe.furniture) return probe;
  return placeEvacuationPosterAt(
    plan,
    floorId,
    mid.x - nx * inset,
    mid.y - ny * inset,
    opts,
  );
}

export function generateEvacuationMap(input: {
  plan: FloorPlan;
  markers: Marker[];
  floorId?: string | null;
  floorNumber?: number | null;
  floorName?: string | null;
  /** false — только схема (для превью); true — сразу повесить планы на стены */
  placePosters?: boolean;
}): GenerateEvacuationResult {
  const next: FloorPlan = JSON.parse(JSON.stringify(input.plan));
  const floor =
    next.floors.find((f) => f.id === input.floorId) || next.floors[0];
  const report: string[] = [];

  if (!floor) {
    const emptyAnalysis: EvacuationAnalysis = {
      rooms: [],
      exits: [],
      routes: [],
      posters: [],
      safety: [],
      walls: [],
      furniture: [],
      floorLabel: "Этажа нет",
      warnings: ["Нет этажа"],
    };
    return {
      plan: next,
      markers: input.markers,
      analysis: emptyAnalysis,
      svg: buildEvacuationSvg(emptyAnalysis),
      report: ["Нет этажа для плана эвакуации"],
      postersPlaced: [],
    };
  }

  const detected = ensureRoomsDetected(
    floor.rooms || [],
    floor.walls || [],
    floor.openings || [],
  );
  floor.rooms = detected.rooms;
  if (detected.createdCount) {
    report.push(`Автоопределено комнат: ${detected.createdCount}`);
  }

  const rooms = (floor.rooms || []).map((r) => ({
    id: r.id,
    name: r.name || "",
    points: r.points || [],
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

  const { adj, exits } = buildRoomGraph(rooms, openings, walls, exteriorIds);

  if (!exits.length) {
    report.push(
      "Не найден эвакуационный выход (дверь наружу). Отметьте наружную дверь на плане.",
    );
  } else {
    report.push(
      `Выходов: ${exits.length} (основных: ${exits.filter((e) => e.primary).length})`,
    );
  }

  const routes = collectRoutes(rooms, adj, exits);
  report.push(`Маршрутов эвакуации: ${routes.length}`);

  const placePosters = input.placePosters === true;

  if (placePosters) {
    floor.furniture = (floor.furniture || []).filter(
      (f) => f.kind !== EVAC_POSTER_KIND,
    );
  }

  const occupied: Occupied[] = (floor.furniture || []).map((f) => ({
    bounds: rotatedBounds(f.x, f.y, f.width, f.depth, f.rotation || 0),
  }));
  for (const op of openings) {
    const keep = doorKeepout(op, walls);
    if (keep) occupied.push({ bounds: keep });
  }
  for (const keep of wetFurnitureKeepouts(floor.furniture || [])) {
    occupied.push({ bounds: keep });
  }
  // целиком санузлы — запретная зона
  for (const info of detected.infos) {
    if (
      info.suggestedRole !== "wet" &&
      !isWetRoom(info.room.name || "", info.suggestedRole)
    ) {
      continue;
    }
    const b = polygonBounds(info.room.points || []);
    if (b) occupied.push({ bounds: b });
  }

  const posterTargets = pickPosterRooms(
    detected.infos.map((i) => ({
      room: i.room,
      hasExteriorDoor: i.hasExteriorDoor,
      suggestedRole: i.suggestedRole,
    })),
  );

  const postersPlaced: Furniture[] = [];
  const posterSpots: EvacPosterSpot[] = [];

  for (const t of posterTargets) {
    const placed = placePosterInRoom(
      { id: t.room.id, points: t.room.points || [] },
      walls,
      openings,
      occupied,
      t.local,
    );
    if (!placed) continue;
    posterSpots.push(placed.spot);
    if (placePosters) {
      postersPlaced.push(placed.furniture);
      floor.furniture = [...(floor.furniture || []), placed.furniture];
    }
  }

  if (placePosters) {
    report.push(`Планов на стенах: ${postersPlaced.length}`);
    if (!postersPlaced.length) {
      report.push(
        "Не удалось разместить постер — выберите стену вручную или проверьте комнаты.",
      );
    }
  } else {
    report.push(
      `Рекомендуемых точек размещения: ${posterSpots.length} (авто или выбор стены)`,
    );
  }

  const safety: EvacSafetyItem[] = [];
  for (const f of floor.furniture || []) {
    if (f.kind === "office/fire-extinguisher") {
      safety.push({
        kind: "extinguisher",
        point: { x: f.x, y: f.y },
        label: "Огнетушитель",
      });
    } else if (f.kind === "office/first-aid") {
      safety.push({
        kind: "first-aid",
        point: { x: f.x, y: f.y },
        label: "Аптечка",
      });
    } else if (f.kind === EVAC_POSTER_KIND) {
      safety.push({
        kind: "poster",
        point: { x: f.x, y: f.y },
        label: "План эвакуации",
      });
    }
  }

  const floorLabel =
    input.floorName ||
    (input.floorNumber != null
      ? `${input.floorNumber} этаж`
      : floor.name || "Этаж");

  const analysis: EvacuationAnalysis = {
    rooms: detected.infos.map((i) => ({
      id: i.room.id,
      name: i.room.name || "",
      points: i.room.points || [],
      role: i.suggestedRole,
    })),
    exits,
    routes,
    posters: posterSpots,
    safety,
    walls: walls
      .filter((w) => w.start && w.end)
      .map((w) => ({
        start: w.start,
        end: w.end,
        thickness: w.thickness || 12,
      })),
    furniture: (floor.furniture || []).map((f) => ({
      x: f.x,
      y: f.y,
      width: f.width,
      depth: f.depth,
      rotation: f.rotation || 0,
      kind: String(f.kind),
    })),
    floorLabel,
    warnings: exits.length ? [] : ["Нет наружных выходов"],
  };

  // Уникальные маршруты для SVG: по одному primary/secondary на выход из набора
  // (все комнатные маршруты рисуем — на этажном плане это нормально)
  const svg = buildEvacuationSvg(analysis, {
    highlightPoster: posterSpots[0] || null,
  });

  if (exits.length < 2) {
    report.push(
      "По СП 1.13130 желательно ≥2 эвакуационных выхода — сейчас найден один или ноль.",
    );
  }

  return {
    plan: next,
    markers: input.markers,
    analysis,
    svg,
    report,
    postersPlaced,
  };
}
