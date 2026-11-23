import {
  FURNITURE_CATALOG,
  createEmptyPlan,
  type FloorPlan,
  type FurnitureCatalogItem,
  type FurniturePack,
} from "@jbaysolutions/floorplan-react";
import { office } from "@jbaysolutions/floorplan-pack-office";
import { t } from "./i18nRu";
import { officeExtraItems } from "./officeExtra";

export const furnitureCatalogRu: FurnitureCatalogItem[] = FURNITURE_CATALOG.map(
  (item) => ({
    ...item,
    label: t(item.label),
    category: t(item.category),
  }),
);

export const officePackRu: FurniturePack = {
  ...office,
  label: "Офис",
  items: [...office.items, ...officeExtraItems].map((item) => ({
    ...item,
    label: t(item.label),
    category: t(item.category),
  })),
};

export function createRussianPlan(name = "Офис"): FloorPlan {
  const plan = createEmptyPlan(name);
  plan.name = name;
  plan.floors = plan.floors.map((floor) => ({
    ...floor,
    name: russianFloorName(floor.level),
  }));
  return localizePlan(plan);
}

export function russianFloorName(level: number): string {
  if (level === 0) return "1 этаж";
  if (level > 0) return `${level + 1} этаж`;
  return `Цоколь ${Math.abs(level)}`;
}

const ENGLISH_FLOOR_NAMES = /^(ground floor|untitled plan|floor\s*\d+|level\s*-?\d+)$/i;

/** Переводит известные английские имена в сохранённом плане */
export function localizePlan(plan: FloorPlan): FloorPlan {
  const next: FloorPlan = JSON.parse(JSON.stringify(plan));
  if (next.name) next.name = t(next.name);
  next.floors = (next.floors || []).map((floor) => {
    if (!floor.name || ENGLISH_FLOOR_NAMES.test(floor.name.trim())) {
      floor.name = russianFloorName(floor.level ?? 0);
    } else {
      floor.name = t(floor.name);
    }
    floor.rooms = (floor.rooms || []).map((room) => ({
      ...room,
      name: room.name ? t(room.name) : room.name,
    }));
    return floor;
  });
  return next;
}
