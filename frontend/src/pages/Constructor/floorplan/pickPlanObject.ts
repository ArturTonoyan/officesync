import type { FloorPlan } from "@jbaysolutions/floorplan-react";
import { t } from "./i18nRu";
import { furnitureCatalogRu, officePackRu } from "./catalogRu";
import {
  hitTestMarquee,
  type SelectedItem,
} from "./marqueeSelect";
import { FURNISH_CATALOG } from "../components/AutoPlan/layout/roomKits";
import type { ObjectInfo } from "../components/ObjectInfoPopup/ObjectInfoPopup";
import { PERSON_KIND } from "./people3d";

const furnitureLabels = new Map<string, string>([
  ...furnitureCatalogRu.map((i) => [String(i.kind), i.label] as const),
  ...officePackRu.items.map((i) => [String(i.kind), i.label] as const),
  ...FURNISH_CATALOG.map((i) => [i.kind, i.label] as const),
  [PERSON_KIND, "Сотрудник"],
]);

function floorOf(plan: FloorPlan, floorId?: string | null) {
  return (
    plan.floors.find((f) => f.id === floorId) || plan.floors[0] || null
  );
}

/** Ближайший объект плана в точке клика (мебель → проём → комната) */
export function pickPlanObject(
  plan: FloorPlan,
  floorId: string | null | undefined,
  x: number,
  y: number,
  screenX: number,
  screenY: number,
): ObjectInfo | null {
  const floor = floorOf(plan, floorId);
  if (!floor) return null;

  const pad = 48;
  const hits = hitTestMarquee(
    plan,
    { x: x - pad, y: y - pad, width: pad * 2, height: pad * 2 },
    floor.id,
  );

  const scored = hits
    .map((hit) => {
      const dist = distanceToHit(plan, floor.id, hit, x, y);
      return { hit, dist };
    })
    .filter((h) => h.dist < Infinity)
    .sort((a, b) => {
      const rank = (k: SelectedItem["kind"]) =>
        k === "furniture" ? 0 : k === "opening" ? 1 : k === "room" ? 2 : 3;
      const rd = rank(a.hit.kind) - rank(b.hit.kind);
      return rd !== 0 ? rd : a.dist - b.dist;
    });

  const best = scored[0]?.hit;
  if (!best) {
    return {
      title: "Точка на плане",
      subtitle: floor.name || "Этаж",
      rows: [
        { label: "X", value: `${(x / 100).toFixed(2)} м` },
        { label: "Y", value: `${(y / 100).toFixed(2)} м` },
      ],
      screenX,
      screenY,
    };
  }

  if (best.kind === "furniture") {
    const f = (floor.furniture || []).find((item) => item.id === best.id);
    if (!f) return null;
    const kind = String(f.kind);
    const title =
      furnitureLabels.get(kind) || t(kind) || kind.replace(/^office\//, "");
    return {
      title,
      subtitle: "Мебель / оборудование",
      rows: [
        { label: "Тип", value: kind.replace(/^office\//, "") },
        {
          label: "Размер",
          value: `${((f.width || 0) / 100).toFixed(2)} × ${((f.depth || 0) / 100).toFixed(2)} м`,
        },
        {
          label: "Поворот",
          value: `${Math.round(f.rotation || 0)}°`,
        },
        {
          label: "Позиция",
          value: `${(f.x / 100).toFixed(2)}, ${(f.y / 100).toFixed(2)} м`,
        },
      ],
      screenX,
      screenY,
    };
  }

  if (best.kind === "opening") {
    const o = (floor.openings || []).find((item) => item.id === best.id);
    const type = o?.type || "door";
    const title =
      type === "window"
        ? "Окно"
        : type === "double-door"
          ? "Двойная дверь"
          : type === "sliding-door"
            ? "Раздвижная дверь"
            : "Дверь";
    return {
      title,
      subtitle: "Проём",
      rows: [
        {
          label: "Ширина",
          value: `${((o?.width || 90) / 100).toFixed(2)} м`,
        },
      ],
      screenX,
      screenY,
    };
  }

  if (best.kind === "room") {
    const room = (floor.rooms || []).find((r) => r.id === best.id);
    const name = room?.name?.trim() || "Комната";
    return {
      title: name,
      subtitle: "Комната",
      rows: room?.points?.length
        ? [
            {
              label: "Углов",
              value: String(room.points.length),
            },
          ]
        : undefined,
      screenX,
      screenY,
    };
  }

  return {
    title: best.kind,
    screenX,
    screenY,
  };
}

function distanceToHit(
  plan: FloorPlan,
  floorId: string,
  hit: SelectedItem,
  x: number,
  y: number,
): number {
  const floor = floorOf(plan, floorId);
  if (!floor) return Infinity;
  if (hit.kind === "furniture") {
    const f = (floor.furniture || []).find((item) => item.id === hit.id);
    if (!f) return Infinity;
    return Math.hypot(f.x - x, f.y - y);
  }
  if (hit.kind === "room") {
    const room = (floor.rooms || []).find((r) => r.id === hit.id);
    if (!room?.points?.length) return Infinity;
    let cx = 0;
    let cy = 0;
    for (const p of room.points) {
      cx += p.x;
      cy += p.y;
    }
    cx /= room.points.length;
    cy /= room.points.length;
    return Math.hypot(cx - x, cy - y) + 80; // комнаты чуть ниже приоритетом
  }
  return 120;
}
