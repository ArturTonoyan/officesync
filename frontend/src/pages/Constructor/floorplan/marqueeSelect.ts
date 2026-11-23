import type { Floor, FloorPlan } from "@jbaysolutions/floorplan-react";
import { t } from "./i18nRu";
import { furnitureCatalogRu, officePackRu } from "./catalogRu";

export type SelectableKind = "wall" | "room" | "opening" | "furniture" | "road";

export type SelectedItem = {
  kind: SelectableKind;
  id: string;
};

export type PlanRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SelectionDetail = SelectedItem & {
  label: string;
  kindLabel: string;
  bounds: PlanRect | null;
};

const KIND_LABEL: Record<SelectableKind, string> = {
  wall: "Стена",
  room: "Комната",
  opening: "Проём",
  furniture: "Мебель",
  road: "Дорога",
};

const OPENING_LABEL: Record<string, string> = {
  door: "Дверь",
  "double-door": "Двойная дверь",
  "sliding-door": "Раздвижная дверь",
  window: "Окно",
};

const furnitureLabelByKind = new Map<string, string>([
  ...furnitureCatalogRu.map((i) => [String(i.kind), i.label] as const),
  ...officePackRu.items.map((i) => [String(i.kind), i.label] as const),
]);

export function clientToPlan(
  editorRoot: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const svg = editorRoot.querySelector(
    ".fp-canvas-host svg",
  ) as SVGSVGElement | null;
  if (!svg) return null;

  const world = [
    ...svg.querySelectorAll<SVGGElement>("g[transform]"),
  ].find((g) =>
    /translate\([^)]+\)\s*scale\(/.test(g.getAttribute("transform") || ""),
  );
  if (!world) return null;

  const ctm = world.getScreenCTM();
  if (!ctm) return null;

  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

export function normalizeRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
): PlanRect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

function rectsIntersect(a: PlanRect, b: PlanRect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

function pointInRect(x: number, y: number, r: PlanRect): boolean {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

function rotatedFurnitureBounds(
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation = 0,
): PlanRect {
  const rad = ((rotation || 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = width * cos + depth * sin;
  const h = width * sin + depth * cos;
  return { x: x - w / 2, y: y - h / 2, width: w, height: h };
}

function polygonBounds(
  points: { x: number; y: number }[],
): PlanRect | null {
  if (!points?.length) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function wallBounds(
  a: { x: number; y: number },
  b: { x: number; y: number },
  thickness = 12,
): PlanRect {
  const pad = Math.max(thickness, 8) / 2;
  const minX = Math.min(a.x, b.x) - pad;
  const minY = Math.min(a.y, b.y) - pad;
  const maxX = Math.max(a.x, b.x) + pad;
  const maxY = Math.max(a.y, b.y) + pad;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getCurrentFloor(plan: FloorPlan, floorId?: string | null): Floor | null {
  if (!plan?.floors?.length) return null;
  if (floorId) {
    return plan.floors.find((f) => f.id === floorId) || plan.floors[0];
  }
  return plan.floors[0];
}

/** Элементы, попавшие в рамку (хотя бы частично) */
export function hitTestMarquee(
  plan: FloorPlan,
  rect: PlanRect,
  floorId?: string | null,
): SelectedItem[] {
  const floor = getCurrentFloor(plan, floorId);
  if (!floor || rect.width < 2 || rect.height < 2) return [];

  const hits: SelectedItem[] = [];

  for (const room of floor.rooms || []) {
    const b = polygonBounds(room.points || []);
    if (b && rectsIntersect(rect, b)) {
      hits.push({ kind: "room", id: room.id });
    }
  }

  for (const wall of floor.walls || []) {
    const a = wall.start;
    const b = wall.end;
    if (!a || !b) continue;
    const box = wallBounds(a, b, wall.thickness ?? 12);
    if (rectsIntersect(rect, box)) {
      hits.push({ kind: "wall", id: wall.id });
    }
  }

  for (const item of floor.furniture || []) {
    const box = rotatedFurnitureBounds(
      item.x,
      item.y,
      item.width,
      item.depth,
      item.rotation,
    );
    if (rectsIntersect(rect, box)) {
      hits.push({ kind: "furniture", id: item.id });
    }
  }

  for (const opening of floor.openings || []) {
    const wall = (floor.walls || []).find((w) => w.id === opening.wallId);
    if (!wall?.start || !wall?.end) continue;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy) || 1;
    const t = Math.min(1, Math.max(0, (opening.offset || 0) / len));
    const x = wall.start.x + dx * t;
    const y = wall.start.y + dy * t;
    const w = opening.width ?? 90;
    const box = { x: x - w / 2, y: y - w / 2, width: w, height: w };
    if (rectsIntersect(rect, box) || pointInRect(x, y, rect)) {
      hits.push({ kind: "opening", id: opening.id });
    }
  }

  for (const road of floor.roads || []) {
    const a = road.start;
    const b = road.end;
    if (!a || !b) continue;
    const box = wallBounds(a, b, road.width ?? 40);
    if (rectsIntersect(rect, box)) {
      hits.push({ kind: "road", id: road.id });
    }
  }

  return hits;
}

export function deleteItemsFromPlan(
  plan: FloorPlan,
  items: SelectedItem[],
  floorId?: string | null,
): FloorPlan {
  if (!items.length) return plan;
  const next: FloorPlan = JSON.parse(JSON.stringify(plan));
  const floor = getCurrentFloor(next, floorId);
  if (!floor) return plan;

  const byKind = {
    wall: new Set(items.filter((i) => i.kind === "wall").map((i) => i.id)),
    room: new Set(items.filter((i) => i.kind === "room").map((i) => i.id)),
    opening: new Set(
      items.filter((i) => i.kind === "opening").map((i) => i.id),
    ),
    furniture: new Set(
      items.filter((i) => i.kind === "furniture").map((i) => i.id),
    ),
    road: new Set(items.filter((i) => i.kind === "road").map((i) => i.id)),
  };

  floor.walls = (floor.walls || []).filter((w) => !byKind.wall.has(w.id));
  floor.rooms = (floor.rooms || []).filter((r) => !byKind.room.has(r.id));
  floor.openings = (floor.openings || []).filter(
    (o) => !byKind.opening.has(o.id),
  );
  floor.furniture = (floor.furniture || []).filter(
    (f) => !byKind.furniture.has(f.id),
  );
  if (floor.roads) {
    floor.roads = floor.roads.filter((r) => !byKind.road.has(r.id));
  }

  // двери/окна на удалённых стенах
  const wallIds = new Set((floor.walls || []).map((w) => w.id));
  floor.openings = (floor.openings || []).filter((o) =>
    wallIds.has(o.wallId),
  );

  return next;
}

export function selectionKey(item: SelectedItem): string {
  return `${item.kind}:${item.id}`;
}

export function getWorldGroup(editorRoot: HTMLElement): SVGGElement | null {
  const svg = editorRoot.querySelector(
    ".fp-canvas-host svg",
  ) as SVGSVGElement | null;
  if (!svg) return null;
  return (
    [...svg.querySelectorAll<SVGGElement>("g[transform]")].find((g) =>
      /translate\([^)]+\)\s*scale\(/.test(g.getAttribute("transform") || ""),
    ) || null
  );
}

export function getItemBounds(
  plan: FloorPlan,
  item: SelectedItem,
  floorId?: string | null,
): PlanRect | null {
  const floor = getCurrentFloor(plan, floorId);
  if (!floor) return null;

  if (item.kind === "room") {
    const room = (floor.rooms || []).find((r) => r.id === item.id);
    return room ? polygonBounds(room.points || []) : null;
  }
  if (item.kind === "wall") {
    const wall = (floor.walls || []).find((w) => w.id === item.id);
    if (!wall?.start || !wall?.end) return null;
    return wallBounds(wall.start, wall.end, wall.thickness ?? 12);
  }
  if (item.kind === "furniture") {
    const f = (floor.furniture || []).find((x) => x.id === item.id);
    if (!f) return null;
    return rotatedFurnitureBounds(f.x, f.y, f.width, f.depth, f.rotation);
  }
  if (item.kind === "road") {
    const road = (floor.roads || []).find((r) => r.id === item.id);
    if (!road?.start || !road?.end) return null;
    return wallBounds(road.start, road.end, road.width ?? 40);
  }
  if (item.kind === "opening") {
    const opening = (floor.openings || []).find((o) => o.id === item.id);
    if (!opening) return null;
    const wall = (floor.walls || []).find((w) => w.id === opening.wallId);
    if (!wall?.start || !wall?.end) return null;
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy) || 1;
    const tt = Math.min(1, Math.max(0, (opening.offset || 0) / len));
    const x = wall.start.x + dx * tt;
    const y = wall.start.y + dy * tt;
    const w = opening.width ?? 90;
    return { x: x - w / 2, y: y - w / 2, width: w, height: w };
  }
  return null;
}

export function describeSelection(
  plan: FloorPlan,
  items: SelectedItem[],
  floorId?: string | null,
): SelectionDetail[] {
  const floor = getCurrentFloor(plan, floorId);
  return items.map((item) => {
    const bounds = getItemBounds(plan, item, floorId);
    let label = KIND_LABEL[item.kind];
    let kindLabel = KIND_LABEL[item.kind];

    if (!floor) {
      return { ...item, label, kindLabel, bounds };
    }

    if (item.kind === "room") {
      const room = (floor.rooms || []).find((r) => r.id === item.id);
      label = room?.name ? t(room.name) : "Комната";
      kindLabel = "Комната";
    } else if (item.kind === "wall") {
      label = "Стена";
      kindLabel = "Стена";
    } else if (item.kind === "road") {
      label = "Дорога";
      kindLabel = "Дорога";
    } else if (item.kind === "opening") {
      const opening = (floor.openings || []).find((o) => o.id === item.id);
      const type = opening?.type || "door";
      label = OPENING_LABEL[type] || t(String(type)) || "Проём";
      kindLabel = "Проём";
    } else if (item.kind === "furniture") {
      const f = (floor.furniture || []).find((x) => x.id === item.id);
      const fromCat = f ? furnitureLabelByKind.get(String(f.kind)) : null;
      label = fromCat || (f ? t(String(f.kind)) : "Мебель");
      kindLabel = "Мебель";
    }

    return { ...item, label, kindLabel, bounds };
  });
}

const HIGHLIGHT_NS = "http://www.w3.org/2000/svg";
export const SELECTION_LAYER_ID = "os-marquee-selection";

/** Рисует рамки выделения в мировых координатах плана */
export function paintSelectionHighlights(
  editorRoot: HTMLElement,
  details: SelectionDetail[],
  focusedKey?: string | null,
) {
  const world = getWorldGroup(editorRoot);
  if (!world) return;

  let layer = world.querySelector(`#${SELECTION_LAYER_ID}`) as SVGGElement | null;
  if (!layer) {
    layer = document.createElementNS(HIGHLIGHT_NS, "g");
    layer.id = SELECTION_LAYER_ID;
    layer.setAttribute("pointer-events", "none");
    layer.setAttribute("data-os-selection", "1");
    world.appendChild(layer);
  }

  while (layer.firstChild) layer.removeChild(layer.firstChild);

  for (const d of details) {
    if (!d.bounds || d.bounds.width <= 0 || d.bounds.height <= 0) continue;
    const key = selectionKey(d);
    const focused = focusedKey != null && focusedKey === key;
    const pad = focused ? 8 : 6;
    const rect = document.createElementNS(HIGHLIGHT_NS, "rect");
    rect.setAttribute("x", String(d.bounds.x - pad));
    rect.setAttribute("y", String(d.bounds.y - pad));
    rect.setAttribute("width", String(d.bounds.width + pad * 2));
    rect.setAttribute("height", String(d.bounds.height + pad * 2));
    rect.setAttribute(
      "fill",
      focused ? "rgba(17, 17, 17, 0.14)" : "rgba(17, 17, 17, 0.08)",
    );
    rect.setAttribute("stroke", "#111111");
    rect.setAttribute("stroke-width", focused ? "2.5" : "2");
    if (!focused) rect.setAttribute("stroke-dasharray", "8 4");
    rect.setAttribute("rx", "4");
    rect.setAttribute("vector-effect", "non-scaling-stroke");
    layer.appendChild(rect);
  }
}

export function clearSelectionHighlights(editorRoot: HTMLElement | null) {
  if (!editorRoot) return;
  editorRoot.querySelector(`#${SELECTION_LAYER_ID}`)?.remove();
}
