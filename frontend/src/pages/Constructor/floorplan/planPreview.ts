/** Превью плана этажа (SVG data URL) из planData / FloorPlan */

type Pt = { x: number; y: number };

type Wall = { start: Pt; end: Pt; thickness?: number };
type Room = { points: Pt[]; name?: string };
type Furniture = {
  x: number;
  y: number;
  width?: number;
  depth?: number;
  rotation?: number;
};
type FloorLike = {
  walls?: Wall[];
  rooms?: Room[];
  furniture?: Furniture[];
};

function parsePlan(raw: unknown): FloorLike | null {
  if (!raw) return null;
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    const plan = data?.plan || data;
    const floor = plan?.floors?.[0];
    if (!floor) return null;
    return floor as FloorLike;
  } catch {
    return null;
  }
}

function boundsOf(floor: FloorLike) {
  const pts: Pt[] = [];
  for (const w of floor.walls || []) {
    pts.push(w.start, w.end);
  }
  for (const r of floor.rooms || []) {
    pts.push(...(r.points || []));
  }
  for (const f of floor.furniture || []) {
    pts.push({ x: f.x, y: f.y });
  }
  if (!pts.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const pad = 80;
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: Math.max(maxX - minX + pad * 2, 400),
    height: Math.max(maxY - minY + pad * 2, 300),
  };
}

/** Есть ли сохранённый план (не пустой каркас). */
export function hasSavedPlan(raw: unknown): boolean {
  const floor = parsePlan(raw);
  if (!floor) return false;
  return (
    (floor.walls?.length || 0) > 0 ||
    (floor.rooms?.length || 0) > 0 ||
    (floor.furniture?.length || 0) > 0
  );
}

/** SVG data URL для карточки каталога. */
export function buildPlanPreviewUrl(raw: unknown): string | null {
  const floor = parsePlan(raw);
  if (!floor || !hasSavedPlan(raw)) return null;

  const box = boundsOf(floor);
  if (!box) return null;

  const roomFills = (floor.rooms || [])
    .map((room) => {
      if (!room.points?.length) return "";
      const d = room.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
      return `<path d="${d} Z" fill="#e8eef6" stroke="#94a3b8" stroke-width="4"/>`;
    })
    .join("");

  const wallLines = (floor.walls || [])
    .map((w) => {
      const t = Math.max(8, w.thickness || 12);
      return `<line x1="${w.start.x}" y1="${w.start.y}" x2="${w.end.x}" y2="${w.end.y}" stroke="#3f4654" stroke-width="${t}" stroke-linecap="square"/>`;
    })
    .join("");

  const furnitureRects = (floor.furniture || [])
    .map((f) => {
      const w = f.width || 60;
      const h = f.depth || 40;
      const rot = f.rotation || 0;
      return `<rect x="${f.x - w / 2}" y="${f.y - h / 2}" width="${w}" height="${h}" rx="4" fill="#c5d0de" stroke="#7b8794" stroke-width="3" transform="rotate(${rot} ${f.x} ${f.y})"/>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.minX} ${box.minY} ${box.width} ${box.height}" width="640" height="480">
  <rect x="${box.minX}" y="${box.minY}" width="${box.width}" height="${box.height}" fill="#f4f5f7"/>
  ${roomFills}
  ${wallLines}
  ${furnitureRects}
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Blob для загрузки превью на сервер. */
export function buildPlanPreviewBlob(raw: unknown): Blob | null {
  const url = buildPlanPreviewUrl(raw);
  if (!url) return null;
  const svg = decodeURIComponent(url.replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
  return new Blob([svg], { type: "image/svg+xml" });
}
