/** Дефолтные комплекты, если Ollama недоступна */

export type KitPlacement = "wall" | "corner" | "center" | "around-center";

export type KitItem = {
  kind: string;
  count: number;
  placement: KitPlacement;
};

export type RoomRole =
  | "work"
  | "meeting"
  | "conference"
  | "private"
  | "lounge"
  | "reception"
  | "pantry"
  | "corridor"
  | "wet";

export const FURNISH_CATALOG: {
  kind: string;
  label: string;
  category: string;
  width: number;
  depth: number;
}[] = [
  { kind: "office/desk-empty", label: "Пустой стол", category: "Desks", width: 140, depth: 70 },
  { kind: "office/desk-dual-monitor", label: "Стол 2 монитора", category: "Desks", width: 140, depth: 70 },
  { kind: "office/standing-desk", label: "Sit-stand стол", category: "Desks", width: 130, depth: 65 },
  { kind: "office/compact-desk", label: "Компактный стол", category: "Desks", width: 120, depth: 60 },
  { kind: "office/executive-desk", label: "Стол руководителя", category: "Desks", width: 200, depth: 100 },
  { kind: "office/meeting-table-6", label: "Стол на 6", category: "Meeting", width: 220, depth: 110 },
  { kind: "office/meeting-table-8", label: "Стол на 8", category: "Meeting", width: 280, depth: 120 },
  { kind: "office/meeting-table-10", label: "Стол на 10", category: "Meeting", width: 340, depth: 130 },
  { kind: "office/meeting-round-4", label: "Круглый стол на 4", category: "Meeting", width: 130, depth: 130 },
  { kind: "office/meeting-oval", label: "Овальный стол", category: "Meeting", width: 280, depth: 120 },
  { kind: "office/huddle-table", label: "Huddle-стол", category: "Meeting", width: 120, depth: 120 },
  { kind: "office/flipchart", label: "Флипчарт", category: "Meeting", width: 70, depth: 55 },
  { kind: "office/whiteboard-wall", label: "Доска", category: "Meeting", width: 200, depth: 25 },
  { kind: "office/evacuation-map", label: "План эвакуации", category: "Equipment", width: 60, depth: 4 },
  { kind: "office/fire-extinguisher", label: "Огнетушитель", category: "Equipment", width: 28, depth: 28 },
  { kind: "office/first-aid", label: "Аптечка", category: "Equipment", width: 40, depth: 18 },
  { kind: "office/exit-sign", label: "Знак «Выход»", category: "Equipment", width: 48, depth: 8 },
  { kind: "office/exit-arrow", label: "Направление к выходу", category: "Equipment", width: 40, depth: 8 },
  { kind: "office/fire-sign", label: "Знак «Огнетушитель»", category: "Equipment", width: 22, depth: 6 },
  { kind: "office/mobile-whiteboard", label: "Мобильная доска", category: "Meeting", width: 160, depth: 50 },
  { kind: "office/glass-board", label: "Стеклянная доска", category: "Meeting", width: 200, depth: 22 },
  { kind: "office/projector-screen", label: "Экран проектора", category: "Meeting", width: 180, depth: 40 },
  { kind: "office/projector", label: "Проектор", category: "Meeting", width: 40, depth: 30 },
  { kind: "office/mobile-tv", label: "Мобильный TV", category: "Meeting", width: 120, depth: 55 },
  { kind: "office/tv-stand", label: "TV-стойка", category: "Meeting", width: 140, depth: 50 },
  { kind: "office/vc-display-wall", label: "Стена ВКС", category: "Meeting", width: 260, depth: 35 },
  { kind: "office/interactive-display", label: "Интерактивная панель", category: "Meeting", width: 180, depth: 40 },
  { kind: "office/vc-camera-bar", label: "Камера ВКС", category: "Meeting", width: 80, depth: 20 },
  { kind: "office/soundbar", label: "Саундбар", category: "Meeting", width: 120, depth: 18 },
  { kind: "office/av-credenza", label: "Тумба AV", category: "Meeting", width: 160, depth: 45 },
  { kind: "office/meeting-sideboard", label: "Сервант", category: "Meeting", width: 180, depth: 45 },
  { kind: "office/conference-phone", label: "Конф. телефон", category: "Meeting", width: 45, depth: 45 },
  { kind: "office/document-camera", label: "Документ-камера", category: "Meeting", width: 35, depth: 40 },
  { kind: "office/power-hub-table", label: "Розетки в столе", category: "Meeting", width: 35, depth: 35 },
  { kind: "office/meeting-chair", label: "Стул переговоров", category: "Chairs", width: 48, depth: 50 },
  { kind: "office/stacking-chair", label: "Стул штабелируемый", category: "Chairs", width: 45, depth: 48 },
  { kind: "office/mesh-task-chair", label: "Рабочее кресло", category: "Chairs", width: 50, depth: 52 },
  { kind: "office/guest-chairs-pair", label: "Гостевые стулья", category: "Chairs", width: 110, depth: 55 },
  { kind: "office/side-table", label: "Приставной стол", category: "Meeting", width: 55, depth: 55 },
  { kind: "office/acoustic-panel", label: "Акустическая панель", category: "Partitions", width: 100, depth: 20 },
  { kind: "office/desk-privacy-panel", label: "Экран приватности", category: "Partitions", width: 140, depth: 18 },
  { kind: "office/filing-cabinet-2", label: "Тумба 2 ящика", category: "Storage", width: 50, depth: 60 },
  { kind: "office/personal-locker", label: "Локер", category: "Storage", width: 40, depth: 45 },
  { kind: "office/desk-lamp", label: "Лампа", category: "Equipment", width: 28, depth: 28 },
  { kind: "office/docking-station", label: "Док-станция", category: "Equipment", width: 40, depth: 25 },
  { kind: "office/round-planter", label: "Растение", category: "Plants", width: 70, depth: 70 },
  { kind: "office/plant-shelf", label: "Стеллаж с растениями", category: "Plants", width: 80, depth: 40 },
  { kind: "office/tall-cabinet", label: "Шкаф", category: "Storage", width: 80, depth: 45 },
  { kind: "office/bookshelf", label: "Стеллаж", category: "Storage", width: 100, depth: 40 },
  { kind: "office/coat-rack", label: "Вешалка", category: "Reception", width: 60, depth: 60 },
  { kind: "office/trash-bin", label: "Урна", category: "Utility", width: 35, depth: 35 },
  { kind: "office/coffee-machine", label: "Кофемашина", category: "Pantry", width: 50, depth: 45 },
  { kind: "office/mini-fridge", label: "Мини-холодильник", category: "Pantry", width: 60, depth: 60 },
  { kind: "office/water-dispenser", label: "Кулер", category: "Pantry", width: 40, depth: 40 },
  { kind: "office/kettle-station", label: "Чайная станция", category: "Pantry", width: 70, depth: 45 },
  { kind: "office/sofa-2", label: "Диван", category: "Lounge", width: 160, depth: 80 },
  { kind: "office/focus-booth", label: "Фокус-будка", category: "Focus", width: 120, depth: 120 },
];

export function sizeForKind(kind: string): { width: number; depth: number } {
  const hit = FURNISH_CATALOG.find((c) => c.kind === kind);
  return hit
    ? { width: hit.width, depth: hit.depth }
    : { width: 60, depth: 60 };
}

function hasKind(existing: string[], kind: string) {
  return existing.some((k) => k === kind || k.includes(kind.split("/")[1] || kind));
}

/** Локальный fallback-комплект по роли комнаты */
export function defaultKitForRole(
  role: RoomRole,
  areaM2: number,
  existingKinds: string[],
  opts: { morePlants?: boolean; moreFocusBooths?: boolean } = {},
): KitItem[] {
  const add: KitItem[] = [];
  const push = (kind: string, count: number, placement: KitPlacement) => {
    if (count <= 0) return;
    if (hasKind(existingKinds, kind) && placement !== "around-center") return;
    add.push({ kind, count, placement });
  };

  const plants = opts.morePlants ? 3 : 2;

  if (role === "meeting" || role === "conference") {
    const chairs = Math.min(
      role === "conference" ? 12 : 8,
      Math.max(4, Math.floor(areaM2 / 2.5)),
    );
    if (role === "conference" || areaM2 >= 22) {
      push("office/vc-display-wall", 1, "wall");
      push("office/av-credenza", 1, "wall");
      push("office/vc-camera-bar", 1, "wall");
      push("office/soundbar", 1, "wall");
      push("office/glass-board", 1, "wall");
      push("office/document-camera", 1, "center");
    } else if (areaM2 >= 14) {
      push("office/interactive-display", 1, "wall");
      push("office/whiteboard-wall", 1, "wall");
      push("office/mobile-whiteboard", 1, "corner");
    } else {
      push("office/mobile-tv", 1, "wall");
      push("office/flipchart", 1, "corner");
    }
    push("office/conference-phone", 1, "center");
    push("office/power-hub-table", 1, "center");
    push("office/meeting-chair", chairs, "around-center");
    if (areaM2 >= 16) push("office/meeting-sideboard", 1, "wall");
    if (areaM2 >= 18) push("office/acoustic-panel", 2, "wall");
    push("office/trash-bin", 1, "corner");
    push("office/round-planter", plants, "corner");
  }

  if (role === "lounge") {
    push("office/side-table", 1, "wall");
    push("office/round-planter", plants, "corner");
    if (opts.moreFocusBooths) push("office/focus-booth", 1, "corner");
  }

  if (role === "reception") {
    push("office/coat-rack", 1, "wall");
    push("office/round-planter", Math.min(2, plants), "corner");
    push("office/trash-bin", 1, "corner");
  }

  if (role === "pantry") {
    push("office/coffee-machine", 1, "wall");
    push("office/mini-fridge", hasKind(existingKinds, "fridge") ? 0 : 1, "wall");
    push("office/water-dispenser", 1, "wall");
    push("office/round-planter", 1, "corner");
  }

  if (role === "private") {
    push("office/bookshelf", 1, "wall");
    push("office/filing-cabinet-2", 1, "wall");
    push("office/guest-chairs-pair", 1, "wall");
    push("office/desk-lamp", 1, "center");
    push("office/round-planter", 1, "corner");
  }

  if (role === "work") {
    const n = Math.min(plants, Math.max(1, Math.floor(areaM2 / 20)));
    push("office/round-planter", n, "corner");
    if (areaM2 >= 25) push("office/personal-locker", Math.min(4, Math.floor(areaM2 / 12)), "wall");
    if (areaM2 >= 30) push("office/filing-cabinet-2", 1, "wall");
    if (areaM2 >= 35) push("office/tall-cabinet", 1, "wall");
    if (areaM2 >= 40) push("office/desk-privacy-panel", 2, "wall");
    if (opts.moreFocusBooths) push("office/focus-booth", 1, "corner");
  }

  if (role === "corridor") {
    push("office/round-planter", 1, "corner");
  }

  return add.filter((i) => i.count > 0);
}
