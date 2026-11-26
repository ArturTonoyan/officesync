import type { FloorPlan, Furniture } from "@jbaysolutions/floorplan-react";

export type WorkplaceRole =
  | "pc"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "dock"
  | "other";

export type WorkplaceSlot = {
  id: string;
  role: WorkplaceRole;
  kind: string;
  ox: number;
  oy: number;
  rotation: number;
  /** Пользовательский размер; если нет — ROLE_SIZE[role] */
  width?: number;
  depth?: number;
  equipmentId: string | null;
  /** id мебели-символа на плане (зеркало слота) */
  furnitureId?: string;
};

export type WorkplaceKit = {
  id: string;
  deskFurnitureId: string;
  slots: WorkplaceSlot[];
};

export type EquipmentRef = {
  id: string;
  name?: string;
  type?: string;
  inventoryNumber?: string;
  floorId?: string;
};

export const ROLE_LABEL: Record<WorkplaceRole, string> = {
  pc: "ПК",
  monitor: "Монитор",
  keyboard: "Клавиатура",
  mouse: "Мышь",
  dock: "Док-станция",
  other: "Прочее",
};

export const ROLE_KIND: Record<WorkplaceRole, string> = {
  pc: "office/underdesk-cpu",
  monitor: "office/monitor",
  keyboard: "office/keyboard",
  mouse: "office/mouse",
  dock: "office/docking-station",
  other: "office/docking-station",
};

export const ROLE_SIZE: Record<WorkplaceRole, { width: number; depth: number }> =
  {
    pc: { width: 45, depth: 50 },
    monitor: { width: 52, depth: 18 },
    keyboard: { width: 44, depth: 16 },
    mouse: { width: 12, depth: 18 },
    dock: { width: 40, depth: 25 },
    other: { width: 30, depth: 30 },
  };

/** Стартовая точка при добавлении — центр стола + лёгкий разброс (дальше двигают руками). */
export function freePlaceOffset(index: number): {
  ox: number;
  oy: number;
  rotation: number;
} {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    ox: (col - 1.5) * 14,
    oy: row * 14,
    rotation: 0,
  };
}

const DESK_KIND_RE = /desk|горяч|hot.?desk|рабоч/i;

export function isDeskKind(kind: string | undefined | null): boolean {
  if (!kind) return false;
  const k = String(kind);
  if (k.includes("underdesk")) return false;
  return DESK_KIND_RE.test(k) || k.includes("office/desk");
}

export function normalizeEquipmentRole(
  type: string | undefined | null,
  name?: string | undefined | null,
): WorkplaceRole {
  const s = `${type || ""} ${name || ""}`.toLowerCase();
  if (/монитор|monitor|display|экран/.test(s)) return "monitor";
  if (/клавиатур|keyboard/.test(s)) return "keyboard";
  if (/мыш|mouse/.test(s)) return "mouse";
  if (/док|dock/.test(s)) return "dock";
  if (
    /пк|pc\b|cpu|системн|компьютер|computer|ноутбук|laptop|системный блок/.test(
      s,
    )
  ) {
    return "pc";
  }
  return "other";
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function parseWorkplaceKits(raw: unknown): WorkplaceKit[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((k) => {
      if (!k || typeof k !== "object") return null;
      const kit = k as Record<string, unknown>;
      if (typeof kit.deskFurnitureId !== "string") return null;
      const slots = Array.isArray(kit.slots)
        ? kit.slots
            .map((s) => {
              if (!s || typeof s !== "object") return null;
              const slot = s as Record<string, unknown>;
              const role = String(slot.role || "other") as WorkplaceRole;
              const def = ROLE_SIZE[ROLE_LABEL[role] ? role : "other"];
              const width = Number(slot.width);
              const depth = Number(slot.depth);
              return {
                id: String(slot.id || uid("slot")),
                role: ROLE_LABEL[role] ? role : "other",
                kind: String(slot.kind || ROLE_KIND[role] || ROLE_KIND.other),
                ox: Number(slot.ox) || 0,
                oy: Number(slot.oy) || 0,
                rotation: Number(slot.rotation) || 0,
                width: Number.isFinite(width) && width > 0 ? width : def.width,
                depth: Number.isFinite(depth) && depth > 0 ? depth : def.depth,
                equipmentId:
                  typeof slot.equipmentId === "string"
                    ? slot.equipmentId
                    : null,
                furnitureId:
                  typeof slot.furnitureId === "string"
                    ? slot.furnitureId
                    : undefined,
              } satisfies WorkplaceSlot;
            })
            .filter(Boolean) as WorkplaceSlot[]
        : [];
      return {
        id: String(kit.id || uid("kit")),
        deskFurnitureId: kit.deskFurnitureId,
        slots,
      } satisfies WorkplaceKit;
    })
    .filter(Boolean) as WorkplaceKit[];
}

export function occupiedEquipmentIds(kits: WorkplaceKit[]): Set<string> {
  const set = new Set<string>();
  for (const kit of kits) {
    for (const slot of kit.slots) {
      if (slot.equipmentId) set.add(slot.equipmentId);
    }
  }
  return set;
}

export function freeEquipments(
  all: EquipmentRef[],
  kits: WorkplaceKit[],
  floorId?: string | null,
): EquipmentRef[] {
  const used = occupiedEquipmentIds(kits);
  return all.filter((eq) => {
    if (used.has(eq.id)) return false;
    if (floorId && eq.floorId && eq.floorId !== floorId) return false;
    return true;
  });
}

export function findFurniture(
  plan: FloorPlan,
  floorId: string | null | undefined,
  furnitureId: string,
): Furniture | null {
  const floor =
    plan.floors.find((f) => f.id === floorId) || plan.floors[0] || null;
  if (!floor) return null;
  return (floor.furniture || []).find((f) => f.id === furnitureId) || null;
}

/** Локальные смещения → мировые координаты с учётом поворота стола. */
export function localToWorld(
  desk: Furniture,
  ox: number,
  oy: number,
): { x: number; y: number } {
  const rad = ((desk.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: desk.x + ox * cos - oy * sin,
    y: desk.y + ox * sin + oy * cos,
  };
}

export function worldToLocal(
  desk: Furniture,
  x: number,
  y: number,
): { ox: number; oy: number } {
  const dx = x - desk.x;
  const dy = y - desk.y;
  const rad = ((-(desk.rotation || 0)) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    ox: dx * cos - dy * sin,
    oy: dx * sin + dy * cos,
  };
}

function slotFurnitureId(kitId: string, slotId: string) {
  return `wpslot_${kitId}_${slotId}`;
}

export function makeSlotFromEquipment(
  kitId: string,
  eq: EquipmentRef,
  existingSlotCount: number,
): WorkplaceSlot {
  const role = normalizeEquipmentRole(eq.type, eq.name);
  const offset = freePlaceOffset(existingSlotCount);
  const size = ROLE_SIZE[role] || ROLE_SIZE.other;
  const id = uid("slot");
  return {
    id,
    role,
    kind: ROLE_KIND[role],
    ox: offset.ox,
    oy: offset.oy,
    rotation: offset.rotation,
    width: size.width,
    depth: size.depth,
    equipmentId: eq.id,
    furnitureId: slotFurnitureId(kitId, id),
  };
}

/** Синхронизирует мебель-символы слотов с kits и положением столов. */
export function syncKitFurniture(
  plan: FloorPlan,
  floorId: string | null | undefined,
  kits: WorkplaceKit[],
): FloorPlan {
  const next: FloorPlan = JSON.parse(JSON.stringify(plan));
  const floor =
    next.floors.find((f) => f.id === floorId) || next.floors[0] || null;
  if (!floor) return next;

  const kitFurnitureIds = new Set<string>();
  for (const kit of kits) {
    for (const slot of kit.slots) {
      const fid = slot.furnitureId || slotFurnitureId(kit.id, slot.id);
      slot.furnitureId = fid;
      kitFurnitureIds.add(fid);
    }
  }

  const deskById = new Map(
    (floor.furniture || []).map((f) => [f.id, f] as const),
  );
  const kept = (floor.furniture || []).filter(
    (f) => !String(f.id).startsWith("wpslot_") || kitFurnitureIds.has(f.id),
  );

  const byId = new Map(kept.map((f) => [f.id, f] as const));

  for (const kit of kits) {
    const desk = deskById.get(kit.deskFurnitureId);
    if (!desk) continue;
    for (const slot of kit.slots) {
      const fid = slot.furnitureId!;
      const def = ROLE_SIZE[slot.role] || ROLE_SIZE.other;
      const prev = byId.get(fid);
      const width =
        (slot.width && slot.width > 0 ? slot.width : null) ??
        (prev?.width && prev.width > 0 ? prev.width : null) ??
        def.width;
      const depth =
        (slot.depth && slot.depth > 0 ? slot.depth : null) ??
        (prev?.depth && prev.depth > 0 ? prev.depth : null) ??
        def.depth;
      const world = localToWorld(desk, slot.ox, slot.oy);
      const item: Furniture = {
        id: fid,
        kind: slot.kind as Furniture["kind"],
        x: world.x,
        y: world.y,
        width,
        depth,
        rotation: (desk.rotation || 0) + (slot.rotation || 0),
      };
      byId.set(fid, item);
    }
  }

  // Сохраняем порядок: не-kit сначала, затем kit-слоты
  const nonKit = kept.filter((f) => !String(f.id).startsWith("wpslot_"));
  const kitItems = [...byId.values()].filter((f) =>
    String(f.id).startsWith("wpslot_"),
  );
  floor.furniture = [...nonKit, ...kitItems];
  return next;
}

function slotSizeFromFurniture(
  slot: WorkplaceSlot,
  furn: Furniture | undefined,
): { width: number; depth: number } {
  const def = ROLE_SIZE[slot.role] || ROLE_SIZE.other;
  const width =
    (furn?.width && furn.width > 0 ? furn.width : null) ??
    (slot.width && slot.width > 0 ? slot.width : null) ??
    def.width;
  const depth =
    (furn?.depth && furn.depth > 0 ? furn.depth : null) ??
    (slot.depth && slot.depth > 0 ? slot.depth : null) ??
    def.depth;
  return { width, depth };
}

/**
 * После правок на плане:
 * - стол сдвинули → дети едут с ним (ox/oy не трогаем, пересчёт world);
 * - оборудование сдвинули → пишем новые ox/oy из world (свободное размещение);
 * - оборудование удалили на canvas → слот убираем из kit (не восстанавливаем!);
 * - размер всегда читаем с canvas, чтобы ресайз не сбрасывался.
 */
export function resyncKitsAfterPlanChange(
  plan: FloorPlan,
  floorId: string | null | undefined,
  kits: WorkplaceKit[],
  prevPlan?: FloorPlan | null,
): { plan: FloorPlan; kits: WorkplaceKit[]; mutatedFurniture: boolean } {
  const floor =
    plan.floors.find((f) => f.id === floorId) || plan.floors[0] || null;
  const prevFloor =
    prevPlan?.floors.find((f) => f.id === floorId) ||
    prevPlan?.floors[0] ||
    null;
  if (!floor) {
    return { plan, kits: [], mutatedFurniture: false };
  }

  const furnitureIds = new Set((floor.furniture || []).map((f) => f.id));
  const nextKits: WorkplaceKit[] = [];
  let needFurnitureRewrite = false;

  for (const kit of kits) {
    // Стол удалён — kit целиком снимаем, подчистим сирот-wpslot через sync
    if (!furnitureIds.has(kit.deskFurnitureId)) {
      needFurnitureRewrite = true;
      continue;
    }
    const desk = (floor.furniture || []).find(
      (f) => f.id === kit.deskFurnitureId,
    );
    if (!desk) continue;

    const prevDesk = (prevFloor?.furniture || []).find(
      (f) => f.id === kit.deskFurnitureId,
    );
    const deskMoved =
      !prevDesk ||
      Math.hypot(desk.x - prevDesk.x, desk.y - prevDesk.y) > 0.5 ||
      Math.abs((desk.rotation || 0) - (prevDesk.rotation || 0)) > 0.5 ||
      Math.abs((desk.width || 0) - (prevDesk.width || 0)) > 0.5 ||
      Math.abs((desk.depth || 0) - (prevDesk.depth || 0)) > 0.5;

    if (deskMoved) needFurnitureRewrite = true;

    const slots: WorkplaceSlot[] = [];
    for (const slot of kit.slots) {
      const fid = slot.furnitureId || slotFurnitureId(kit.id, slot.id);
      const furn = (floor.furniture || []).find((f) => f.id === fid);
      // Удалено на canvas — слот забываем, мебель уже нет (rewrite не нужен)
      if (!furn) continue;

      const size = slotSizeFromFurniture(slot, furn);
      if (deskMoved) {
        slots.push({ ...slot, furnitureId: fid, ...size });
        continue;
      }
      const local = worldToLocal(desk, furn.x, furn.y);
      slots.push({
        ...slot,
        furnitureId: fid,
        ox: local.ox,
        oy: local.oy,
        rotation: (furn.rotation || 0) - (desk.rotation || 0),
        ...size,
      });
    }

    nextKits.push({ ...kit, slots });
  }

  // Сироты wpslot_* (kit снят, а мебель ещё на плане) — вычистить
  const liveSlotIds = new Set(
    nextKits.flatMap((k) =>
      k.slots.map((s) => s.furnitureId || slotFurnitureId(k.id, s.id)),
    ),
  );
  const hasOrphans = (floor.furniture || []).some(
    (f) =>
      String(f.id).startsWith("wpslot_") && !liveSlotIds.has(String(f.id)),
  );
  if (hasOrphans) needFurnitureRewrite = true;

  // Если стол не двигали и сирот нет — canvas уже актуален, plan не пушим
  // (иначе редактор видит «внешний» plan и зовёт fit()).
  if (!needFurnitureRewrite) {
    return { plan, kits: nextKits, mutatedFurniture: false };
  }

  return {
    plan: syncKitFurniture(plan, floorId, nextKits),
    kits: nextKits,
    mutatedFurniture: true,
  };
}

export type CopyWorkplaceResult = {
  plan: FloorPlan;
  kits: WorkplaceKit[];
  missingEquipment: number;
  newDeskId: string;
};

export function copyWorkplaceKit(
  plan: FloorPlan,
  floorId: string | null | undefined,
  kits: WorkplaceKit[],
  sourceDeskId: string,
  pool: EquipmentRef[],
  offsetCm = 160,
): CopyWorkplaceResult | null {
  const next: FloorPlan = JSON.parse(JSON.stringify(plan));
  const floor =
    next.floors.find((f) => f.id === floorId) || next.floors[0] || null;
  if (!floor) return null;

  const sourceDesk = (floor.furniture || []).find((f) => f.id === sourceDeskId);
  if (!sourceDesk || !isDeskKind(String(sourceDesk.kind))) return null;

  const sourceKit = kits.find((k) => k.deskFurnitureId === sourceDeskId);
  const newDeskId = uid("desk");
  const newDesk: Furniture = {
    ...sourceDesk,
    id: newDeskId,
    x: sourceDesk.x + offsetCm,
    y: sourceDesk.y,
  };
  floor.furniture = [...(floor.furniture || []), newDesk];

  const workingKits = [...kits];
  let missing = 0;
  const newKitId = uid("kit");
  const free = freeEquipments(pool, workingKits, floorId);

  const byRole = new Map<WorkplaceRole, EquipmentRef[]>();
  for (const eq of free) {
    const role = normalizeEquipmentRole(eq.type, eq.name);
    const list = byRole.get(role) || [];
    list.push(eq);
    byRole.set(role, list);
  }

  const newSlots: WorkplaceSlot[] = (sourceKit?.slots || []).map((slot) => {
    const id = uid("slot");
    let equipmentId: string | null = null;
    if (slot.equipmentId) {
      const list = byRole.get(slot.role) || [];
      const nextEq = list.shift();
      byRole.set(slot.role, list);
      if (nextEq) {
        equipmentId = nextEq.id;
      } else {
        missing += 1;
      }
    }
    const def = ROLE_SIZE[slot.role] || ROLE_SIZE.other;
    return {
      id,
      role: slot.role,
      kind: slot.kind,
      ox: slot.ox,
      oy: slot.oy,
      rotation: slot.rotation,
      width: slot.width && slot.width > 0 ? slot.width : def.width,
      depth: slot.depth && slot.depth > 0 ? slot.depth : def.depth,
      equipmentId,
      furnitureId: slotFurnitureId(newKitId, id),
    };
  });

  const newKit: WorkplaceKit = {
    id: newKitId,
    deskFurnitureId: newDeskId,
    slots: newSlots,
  };
  const nextKits = [...workingKits, newKit];
  const synced = syncKitFurniture(next, floorId, nextKits);
  return {
    plan: synced,
    kits: nextKits,
    missingEquipment: missing,
    newDeskId,
  };
}

export function ensureKitForDesk(
  kits: WorkplaceKit[],
  deskFurnitureId: string,
): { kits: WorkplaceKit[]; kit: WorkplaceKit } {
  const existing = kits.find((k) => k.deskFurnitureId === deskFurnitureId);
  if (existing) return { kits, kit: existing };
  const kit: WorkplaceKit = {
    id: uid("kit"),
    deskFurnitureId,
    slots: [],
  };
  return { kits: [...kits, kit], kit };
}

export function updateKitSlots(
  kits: WorkplaceKit[],
  kitId: string,
  slots: WorkplaceSlot[],
): WorkplaceKit[] {
  return kits.map((k) => (k.id === kitId ? { ...k, slots } : k));
}
