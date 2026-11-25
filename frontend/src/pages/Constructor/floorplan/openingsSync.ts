import type {
  FloorPlan,
  Opening,
  Wall,
} from "@jbaysolutions/floorplan-react";

const PARALLEL_EPS = 0.03;
const LINE_DIST_CM = 8;
const MIN_SEG_CM = 8;
/** Стандартная ширина одиночной двери (см). */
export const STANDARD_DOOR_WIDTH_CM = 90;

type Vec = { x: number; y: number };
type Gap = { lo: number; hi: number };

function wallLen(w: Wall): number {
  return Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
}

function wallDir(w: Wall): Vec {
  const L = wallLen(w);
  if (L < 1e-6) return { x: 0, y: 0 };
  return { x: (w.end.x - w.start.x) / L, y: (w.end.y - w.start.y) / L };
}

function pointOnWall(w: Wall, offset: number): Vec {
  const d = wallDir(w);
  return { x: w.start.x + d.x * offset, y: w.start.y + d.y * offset };
}

function projectOnWall(
  w: Wall,
  p: Vec,
): { offset: number; dist: number; len: number } | null {
  const len = wallLen(w);
  if (len < 1e-6) return null;
  const d = wallDir(w);
  const ox = p.x - w.start.x;
  const oy = p.y - w.start.y;
  const offset = ox * d.x + oy * d.y;
  const qx = w.start.x + d.x * offset;
  const qy = w.start.y + d.y * offset;
  return { offset, dist: Math.hypot(p.x - qx, p.y - qy), len };
}

function areColinear(a: Wall, b: Wall): boolean {
  const da = wallDir(a);
  const db = wallDir(b);
  const cross = Math.abs(da.x * db.y - da.y * db.x);
  if (cross > PARALLEL_EPS) return false;
  const mid = {
    x: (b.start.x + b.end.x) / 2,
    y: (b.start.y + b.end.y) / 2,
  };
  const proj = projectOnWall(a, mid);
  return !!proj && proj.dist <= LINE_DIST_CM;
}

function mergeGaps(gaps: Gap[]): Gap[] {
  if (!gaps.length) return [];
  const sorted = [...gaps].sort((a, b) => a.lo - b.lo);
  const out: Gap[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = out[out.length - 1];
    if (cur.lo <= last.hi + 1) last.hi = Math.max(last.hi, cur.hi);
    else out.push({ ...cur });
  }
  return out;
}

function segmentWall(
  wall: Wall,
  from: number,
  to: number,
  id: string,
): Wall {
  const d = wallDir(wall);
  return {
    ...wall,
    id,
    start: {
      x: wall.start.x + d.x * from,
      y: wall.start.y + d.y * from,
    },
    end: {
      x: wall.start.x + d.x * to,
      y: wall.start.y + d.y * to,
    },
  };
}

function baseWallId(id: string): string {
  return id.replace(/_cut\d+$/, "");
}

/** Склеивает куски `wall` + `wall_cutN` обратно в одну стену. */
function mergeFragmentedWalls(walls: Wall[]): { walls: Wall[]; changed: boolean } {
  const cutBases = new Set<string>();
  for (const w of walls) {
    if (/_cut\d+$/.test(w.id)) cutBases.add(baseWallId(w.id));
  }
  if (!cutBases.size) return { walls, changed: false };

  const consumed = new Set<string>();
  const out: Wall[] = [];

  for (const w of walls) {
    if (consumed.has(w.id)) continue;
    const base = baseWallId(w.id);
    if (!cutBases.has(base)) {
      out.push(w);
      continue;
    }

    const pieces = walls.filter((x) => baseWallId(x.id) === base);
    for (const p of pieces) consumed.add(p.id);

    // берём направление от самого длинного куска
    const longest = [...pieces].sort((a, b) => wallLen(b) - wallLen(a))[0];
    const d = wallDir(longest);
    let minT = Infinity;
    let maxT = -Infinity;
    const origin = longest.start;
    for (const p of pieces) {
      for (const pt of [p.start, p.end]) {
        const t =
          (pt.x - origin.x) * d.x + (pt.y - origin.y) * d.y;
        minT = Math.min(minT, t);
        maxT = Math.max(maxT, t);
      }
    }
    out.push({
      ...longest,
      id: base,
      start: {
        x: origin.x + d.x * minT,
        y: origin.y + d.y * minT,
      },
      end: {
        x: origin.x + d.x * maxT,
        y: origin.y + d.y * maxT,
      },
    });
  }

  return { walls: out, changed: true };
}

function splitWall(
  wall: Wall,
  gaps: Gap[],
): { pieces: Wall[]; ranges: { id: string; from: number; to: number }[] } {
  const L = wallLen(wall);
  const merged = mergeGaps(
    gaps
      .map((g) => ({
        lo: Math.max(0, g.lo),
        hi: Math.min(L, g.hi),
      }))
      .filter((g) => g.hi - g.lo >= 1),
  );
  if (!merged.length) {
    return {
      pieces: [wall],
      ranges: [{ id: wall.id, from: 0, to: L }],
    };
  }

  const pieces: Wall[] = [];
  const ranges: { id: string; from: number; to: number }[] = [];
  let cursor = 0;
  let part = 0;

  const pushPiece = (from: number, to: number) => {
    if (to - from < MIN_SEG_CM) return;
    const id = part === 0 ? wall.id : `${wall.id}_cut${part}`;
    part += 1;
    pieces.push(segmentWall(wall, from, to, id));
    ranges.push({ id, from, to });
  };

  for (const g of merged) {
    pushPiece(cursor, g.lo);
    cursor = g.hi;
  }
  pushPiece(cursor, L);

  return { pieces, ranges };
}

function remapOpeningsForSplit(
  openings: Opening[],
  wallId: string,
  ranges: { id: string; from: number; to: number }[],
): Opening[] {
  const result: Opening[] = [];
  for (const o of openings) {
    if (o.wallId !== wallId) {
      result.push(o);
      continue;
    }
    const half = (o.width || STANDARD_DOOR_WIDTH_CM) / 2;
    const center = o.offset;
    const range = ranges.find(
      (r) => center >= r.from - 1 && center <= r.to + 1,
    );
    if (!range) continue;
    if (center - half < range.from - 4 || center + half > range.to + 4) {
      continue;
    }
    result.push({
      ...o,
      wallId: range.id,
      offset: center - range.from,
    });
  }
  return result;
}

/**
 * Склеивает старые `_cut` куски и заново вырезает щели по проёмам
 * (чтобы сквозной проход не сжимался из‑за рассинхрона).
 * Ширину двери/окна не трогает — её задаёт редактор.
 */
export function syncOpeningsOnOverlappingWalls(plan: FloorPlan): FloorPlan {
  let changed = false;
  const next: FloorPlan = JSON.parse(JSON.stringify(plan));

  for (const floor of next.floors) {
    let walls = [...(floor.walls || [])];
    let openings = [...(floor.openings || [])];
    if (!walls.length) continue;

    const beforeSync = openings.length;
    openings = openings.filter((o) => !String(o.id).startsWith("o_sync_"));
    if (openings.length !== beforeSync) changed = true;

    const merged = mergeFragmentedWalls(walls);
    walls = merged.walls;
    if (merged.changed) changed = true;

    if (!openings.length) {
      floor.walls = walls;
      floor.openings = openings;
      continue;
    }

    const wallById = new Map(walls.map((w) => [w.id, w]));
    const gapsByWall = new Map<string, Gap[]>();

    for (const opening of openings) {
      if (!/door/i.test(opening.type || "")) continue;
      const host = wallById.get(opening.wallId);
      if (!host) continue;

      const doorW = opening.width || STANDARD_DOOR_WIDTH_CM;
      const half = doorW / 2;
      const center = pointOnWall(host, opening.offset);

      for (const other of walls) {
        if (other.id === host.id) continue;
        if (!areColinear(host, other)) continue;
        const proj = projectOnWall(other, center);
        if (!proj || proj.dist > LINE_DIST_CM) continue;
        if (proj.offset < -2 || proj.offset > proj.len + 2) continue;
        const lo = proj.offset - half;
        const hi = proj.offset + half;
        if (hi < 2 || lo > proj.len - 2) continue;
        const list = gapsByWall.get(other.id) || [];
        list.push({ lo, hi });
        gapsByWall.set(other.id, list);
      }
    }

    if (!gapsByWall.size) {
      floor.walls = walls;
      floor.openings = openings;
      continue;
    }

    const newWalls: Wall[] = [];

    for (const wall of walls) {
      const gaps = gapsByWall.get(wall.id);
      if (!gaps?.length) {
        newWalls.push(wall);
        continue;
      }
      const { pieces, ranges } = splitWall(wall, gaps);
      const gapSpan = mergeGaps(gaps).reduce(
        (s, g) => s + Math.max(0, g.hi - g.lo),
        0,
      );
      // если вырез меньше 80 см при двери 90 — пересоберём с запасом не нужно,
      // half уже от doorW; просто применяем
      openings = remapOpeningsForSplit(openings, wall.id, ranges);
      newWalls.push(...pieces);
      if (
        pieces.length !== 1 ||
        pieces[0].id !== wall.id ||
        Math.abs(wallLen(pieces[0]) - wallLen(wall)) > 0.5
      ) {
        changed = true;
      }
      void gapSpan;
    }

    const liveIds = new Set(newWalls.map((w) => w.id));
    const pruned = openings.filter((o) => liveIds.has(o.wallId));
    if (pruned.length !== openings.length) {
      openings = pruned;
      changed = true;
    }

    floor.walls = newWalls;
    floor.openings = openings;
  }

  return changed ? next : plan;
}
