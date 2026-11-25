import type { FloorPlan, Furniture, Opening, Room } from "@jbaysolutions/floorplan-react";
import {
  defaultKitForRole,
  sizeForKind,
  type KitItem,
  type KitPlacement,
  type RoomRole,
} from "./roomKits";
import {
  pointInPolygon,
  polygonAreaCm2,
  polygonBounds,
  rotatedBounds,
  type Pt,
  type Rect,
} from "./geometry";

type Placed = { item: Furniture; bounds: Rect };

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

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
    if (
      pointInPolygon(mx, my, roomPoints) ||
      pointInPolygon(mx + 20, my + 20, roomPoints)
    ) {
      zones.push({ x: mx - w / 2, y: my - w / 2, width: w, height: w });
    }
  }
  return zones;
}

function rectsOverlap(a: Rect, b: Rect, pad = 0): boolean {
  return !(
    a.x + a.width + pad <= b.x ||
    b.x + b.width + pad <= a.x ||
    a.y + a.height + pad <= b.y ||
    b.y + b.height + pad <= a.y
  );
}

function rectInsidePolygon(rect: Rect, points: Pt[], inset = 0): boolean {
  const samples: Pt[] = [
    { x: rect.x + inset, y: rect.y + inset },
    { x: rect.x + rect.width - inset, y: rect.y + inset },
    { x: rect.x + inset, y: rect.y + rect.height - inset },
    { x: rect.x + rect.width - inset, y: rect.y + rect.height - inset },
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
  ];
  return samples.every((p) => pointInPolygon(p.x, p.y, points));
}

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

function tryPlace(
  placed: Placed[],
  points: Pt[],
  kind: string,
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation: number,
  doorZones: Rect[],
): Furniture | null {
  if (!canPlace(placed, points, x, y, width, depth, rotation, 6, doorZones)) {
    return null;
  }
  const item: Furniture = {
    id: uid("f"),
    kind: kind as Furniture["kind"],
    x,
    y,
    width,
    depth,
    rotation,
  };
  placed.push({ item, bounds: rotatedBounds(x, y, width, depth, rotation) });
  return item;
}

function placeAlongWall(
  placed: Placed[],
  room: Room,
  doorZones: Rect[],
  kind: string,
  width: number,
  depth: number,
): Furniture | null {
  const points = room.points || [];
  const b = polygonBounds(points);
  if (!b) return null;
  const candidates = [
    { x: b.x + b.width / 2, y: b.y + depth / 2 + 25, rot: 0 },
    { x: b.x + width / 2 + 25, y: b.y + b.height / 2, rot: 90 },
    { x: b.x + b.width - width / 2 - 25, y: b.y + b.height / 2, rot: -90 },
    { x: b.x + b.width / 2, y: b.y + b.height - depth / 2 - 25, rot: 180 },
    { x: b.x + width / 2 + 30, y: b.y + depth / 2 + 30, rot: 0 },
    { x: b.x + b.width - width / 2 - 30, y: b.y + depth / 2 + 30, rot: 0 },
  ];
  for (const c of candidates) {
    const item = tryPlace(
      placed,
      points,
      kind,
      c.x,
      c.y,
      width,
      depth,
      c.rot,
      doorZones,
    );
    if (item) return item;
  }
  return null;
}

function placeInCorners(
  placed: Placed[],
  room: Room,
  doorZones: Rect[],
  kind: string,
  width: number,
  depth: number,
  count: number,
): Furniture[] {
  const points = room.points || [];
  const b = polygonBounds(points);
  if (!b) return [];
  const inset = Math.max(width, depth) / 2 + 35;
  const corners = [
    { x: b.x + inset, y: b.y + inset },
    { x: b.x + b.width - inset, y: b.y + inset },
    { x: b.x + inset, y: b.y + b.height - inset },
    { x: b.x + b.width - inset, y: b.y + b.height - inset },
  ];
  const out: Furniture[] = [];
  for (const c of corners) {
    if (out.length >= count) break;
    const item = tryPlace(
      placed,
      points,
      kind,
      c.x,
      c.y,
      width,
      depth,
      0,
      doorZones,
    );
    if (item) out.push(item);
  }
  return out;
}

function placeAroundCenter(
  placed: Placed[],
  room: Room,
  doorZones: Rect[],
  kind: string,
  width: number,
  depth: number,
  count: number,
): Furniture[] {
  const points = room.points || [];
  const b = polygonBounds(points);
  if (!b || count <= 0) return [];
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  // радиус вокруг центрального стола
  const radius = Math.min(b.width, b.height) * 0.28 + 70;
  const out: Furniture[] = [];
  for (let i = 0; i < count * 2 && out.length < count; i++) {
    const ang = (Math.PI * 2 * i) / Math.max(count, 1) + (i >= count ? 0.2 : 0);
    const x = cx + Math.cos(ang) * radius;
    const y = cy + Math.sin(ang) * radius;
    const rot = (ang * 180) / Math.PI + 90;
    const item = tryPlace(
      placed,
      points,
      kind,
      x,
      y,
      width,
      depth,
      rot,
      doorZones,
    );
    if (item) out.push(item);
  }
  return out;
}

function placeCenter(
  placed: Placed[],
  room: Room,
  doorZones: Rect[],
  kind: string,
  width: number,
  depth: number,
): Furniture | null {
  const points = room.points || [];
  const b = polygonBounds(points);
  if (!b) return null;
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const offsets = [
    { x: 0, y: 0 },
    { x: 40, y: 0 },
    { x: -40, y: 0 },
    { x: 0, y: 50 },
    { x: 0, y: -50 },
  ];
  for (const o of offsets) {
    const item = tryPlace(
      placed,
      points,
      kind,
      cx + o.x,
      cy + o.y,
      width,
      depth,
      0,
      doorZones,
    );
    if (item) return item;
  }
  return null;
}

function placeKitItems(
  placed: Placed[],
  room: Room,
  doorZones: Rect[],
  items: KitItem[],
): Furniture[] {
  const added: Furniture[] = [];
  for (const spec of items) {
    const { width, depth } = sizeForKind(spec.kind);
    const placement: KitPlacement = spec.placement || "wall";
    let left = spec.count;
    if (placement === "corner") {
      const got = placeInCorners(
        placed,
        room,
        doorZones,
        spec.kind,
        width,
        depth,
        left,
      );
      added.push(...got);
      left -= got.length;
    } else if (placement === "around-center") {
      const got = placeAroundCenter(
        placed,
        room,
        doorZones,
        spec.kind,
        width,
        depth,
        left,
      );
      added.push(...got);
      left -= got.length;
    } else if (placement === "center") {
      for (let i = 0; i < left; i++) {
        const item = placeCenter(
          placed,
          room,
          doorZones,
          spec.kind,
          width,
          depth,
        );
        if (!item) break;
        added.push(item);
      }
      left = 0;
    }
    // wall / остаток
    for (let i = 0; i < left; i++) {
      const item = placeAlongWall(
        placed,
        room,
        doorZones,
        spec.kind,
        width,
        depth,
      );
      if (!item) break;
      added.push(item);
    }
  }
  return added;
}

export type RoomRoleInfo = {
  roomId: string;
  name: string;
  role: RoomRole;
  areaM2: number;
  existingKinds: string[];
};

export type FurnishSuggestion = {
  roomId: string;
  add: KitItem[];
};

export type ApplyFurnishResult = {
  plan: FloorPlan;
  addedLabels: string[];
  source: "ollama" | "fallback";
};

export function buildFallbackSuggestions(
  rooms: RoomRoleInfo[],
  opts: { morePlants?: boolean; moreFocusBooths?: boolean } = {},
): FurnishSuggestion[] {
  return rooms
    .filter((r) => r.role !== "wet")
    .map((r) => ({
      roomId: r.roomId,
      add: defaultKitForRole(r.role, r.areaM2, r.existingKinds, opts),
    }));
}

export function applyFurnishKits(
  plan: FloorPlan,
  floorId: string | null | undefined,
  suggestions: FurnishSuggestion[],
  source: "ollama" | "fallback",
): ApplyFurnishResult {
  const next: FloorPlan = JSON.parse(JSON.stringify(plan));
  const floor =
    next.floors.find((f) => f.id === floorId) || next.floors[0];
  if (!floor) {
    return { plan: next, addedLabels: [], source };
  }

  const byId = new Map((floor.rooms || []).map((r) => [r.id, r]));
  const addedLabels: string[] = [];
  const allFurniture = [...(floor.furniture || [])];

  for (const sug of suggestions) {
    const room = byId.get(sug.roomId);
    if (!room || !sug.add?.length) continue;
    const points = room.points || [];
    const doorZones = doorClearZones(
      floor.openings || [],
      floor.walls || [],
      points,
    );
    const inRoom = allFurniture.filter((f) =>
      pointInPolygon(f.x, f.y, points),
    );
    const placed: Placed[] = inRoom.map((item) => ({
      item,
      bounds: rotatedBounds(
        item.x,
        item.y,
        item.width,
        item.depth,
        item.rotation || 0,
      ),
    }));
    const added = placeKitItems(placed, room, doorZones, sug.add);
    allFurniture.push(...added);
    if (added.length) {
      const kinds = [...new Set(added.map((a) => String(a.kind)))];
      addedLabels.push(
        `${room.name || "Комната"}: +${added.length} (${kinds
          .map((k) => k.replace(/^office\//, ""))
          .join(", ")})`,
      );
    }
  }

  floor.furniture = allFurniture;
  return { plan: next, addedLabels, source };
}

export function summarizeRoomFurniture(
  room: Room,
  furniture: Furniture[],
): string[] {
  return furniture
    .filter((f) => pointInPolygon(f.x, f.y, room.points || []))
    .map((f) => String(f.kind));
}

export function areaM2Of(room: Room): number {
  return polygonAreaCm2(room.points || []) / 10_000;
}
