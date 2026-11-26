import type {
  FloorPlan,
  Furniture,
  Opening,
  Room,
  Wall,
} from "@jbaysolutions/floorplan-react";
import { normalizePlan } from "@jbaysolutions/floorplan-react";
import { syncOpeningsOnOverlappingWalls } from "./openingsSync";

/** Сантехника / мокрые точки (нативные kind библиотеки). */
export const SANITARY_KINDS = new Set([
  "toilet",
  "sink",
  "bathtub",
  "shower",
]);

export type StructuralTemplate = {
  id: string;
  name: string;
  createdAt: string;
  sourceFloorId?: string;
  sourceFloorName?: string;
  walls: Wall[];
  rooms: Room[];
  openings: Opening[];
  /** Унитаз / раковина / ванна / душ */
  fixtures: Furniture[];
};

export type StructuralTemplateSummary = {
  walls: number;
  rooms: number;
  openings: number;
  fixtures: number;
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function activeFloor(
  plan: FloorPlan,
  floorId: string | null | undefined,
) {
  return plan.floors.find((f) => f.id === floorId) || plan.floors[0] || null;
}

export function summarizeTemplate(
  t: Pick<StructuralTemplate, "walls" | "rooms" | "openings" | "fixtures">,
): StructuralTemplateSummary {
  return {
    walls: t.walls?.length || 0,
    rooms: t.rooms?.length || 0,
    openings: t.openings?.length || 0,
    fixtures: t.fixtures?.length || 0,
  };
}

/** Снять со текущего этажа стены, комнаты, проёмы и сантехнику. */
export function extractStructuralTemplate(
  plan: FloorPlan,
  floorId: string | null | undefined,
  meta: {
    name: string;
    sourceFloorId?: string;
    sourceFloorName?: string;
  },
): StructuralTemplate | null {
  const floor = activeFloor(plan, floorId);
  if (!floor) return null;

  const fixtures = (floor.furniture || []).filter((f) =>
    SANITARY_KINDS.has(String(f.kind)),
  );

  return {
    id: uid("stpl"),
    name: meta.name.trim() || "Шаблон этажа",
    createdAt: new Date().toISOString(),
    sourceFloorId: meta.sourceFloorId,
    sourceFloorName: meta.sourceFloorName,
    walls: clone(floor.walls || []),
    rooms: clone(floor.rooms || []),
    openings: clone(floor.openings || []),
    fixtures: clone(fixtures),
  };
}

/**
 * Применить шаблон к этажу плана:
 * стены/комнаты/проёмы заменяются; сантехника из шаблона;
 * остальная мебель сохраняется.
 */
export function applyStructuralTemplate(
  plan: FloorPlan,
  floorId: string | null | undefined,
  template: StructuralTemplate,
): FloorPlan {
  const next = clone(normalizePlan(plan));
  const floor = activeFloor(next, floorId);
  if (!floor) return next;

  const wallIdMap = new Map<string, string>();
  const walls: Wall[] = (template.walls || []).map((w) => {
    const id = uid("w");
    wallIdMap.set(w.id, id);
    return { ...clone(w), id };
  });

  const rooms: Room[] = (template.rooms || []).map((r) => ({
    ...clone(r),
    id: uid("r"),
  }));

  const openings: Opening[] = (template.openings || [])
    .map((o) => {
      const wallId = wallIdMap.get(o.wallId);
      if (!wallId) return null;
      return { ...clone(o), id: uid("o"), wallId };
    })
    .filter(Boolean) as Opening[];

  const fixtures: Furniture[] = (template.fixtures || []).map((f) => ({
    ...clone(f),
    id: uid("fx"),
  }));

  const keptFurniture = (floor.furniture || []).filter(
    (f) => !SANITARY_KINDS.has(String(f.kind)),
  );

  floor.walls = walls;
  floor.rooms = rooms;
  floor.openings = openings;
  floor.furniture = [...keptFurniture, ...fixtures];

  return syncOpeningsOnOverlappingWalls(next);
}

const storageKey = (officeId: string) =>
  `officesync-structural-templates:${officeId}`;

export function loadStructuralTemplates(
  officeId: string | null | undefined,
): StructuralTemplate[] {
  if (!officeId) return [];
  try {
    const raw = localStorage.getItem(storageKey(officeId));
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (t) => t && typeof t === "object" && typeof t.id === "string",
    ) as StructuralTemplate[];
  } catch {
    return [];
  }
}

export function saveStructuralTemplates(
  officeId: string | null | undefined,
  list: StructuralTemplate[],
) {
  if (!officeId) return;
  localStorage.setItem(storageKey(officeId), JSON.stringify(list));
}

export function upsertStructuralTemplate(
  officeId: string | null | undefined,
  template: StructuralTemplate,
): StructuralTemplate[] {
  const list = loadStructuralTemplates(officeId).filter(
    (t) => t.id !== template.id,
  );
  const next = [template, ...list].slice(0, 40);
  saveStructuralTemplates(officeId, next);
  return next;
}

export function deleteStructuralTemplate(
  officeId: string | null | undefined,
  templateId: string,
): StructuralTemplate[] {
  const next = loadStructuralTemplates(officeId).filter(
    (t) => t.id !== templateId,
  );
  saveStructuralTemplates(officeId, next);
  return next;
}
