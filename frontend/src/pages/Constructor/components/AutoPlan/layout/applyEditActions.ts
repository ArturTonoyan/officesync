import type { FloorPlan, Furniture } from "@jbaysolutions/floorplan-react";
import type { SelectedItem } from "../../../floorplan/marqueeSelect";
import { pointInPolygon, polygonBounds, type Pt } from "./geometry";
import { sizeForKind } from "./roomKits";
import type { ChatEditScope } from "../../ContextualChat/ContextualChat";

export type EditAction =
  | {
      type: "add_furniture";
      kind: string;
      count?: number;
      placement?: "wall" | "corner" | "center";
    }
  | { type: "remove_furniture"; kind?: string; ids?: string[] }
  | { type: "remove_selection" }
  | {
      type: "move_selection";
      dx?: number;
      dy?: number;
      toward?: string;
      kind?: string;
    }
  | {
      type: "rotate_furniture";
      kind?: string;
      ids?: string[];
      degrees?: number;
      faceToward?: "desk" | "flip";
    }
  | { type: "clear_room_furniture" }
  | { type: "unsupported"; reason?: string };

export type ApplyEditResult = {
  plan: FloorPlan;
  messages: string[];
};

function uid() {
  return `f_${Math.random().toString(36).slice(2, 10)}`;
}

function roomById(plan: FloorPlan, floorId: string | null | undefined, roomId: string) {
  const floor =
    plan.floors.find((f) => f.id === floorId) || plan.floors[0];
  return floor?.rooms?.find((r) => r.id === roomId) || null;
}

function furnitureInRoom(
  furniture: Furniture[],
  points: Pt[],
): Furniture[] {
  return furniture.filter((f) => pointInPolygon(f.x, f.y, points));
}

function kindMatches(itemKind: string, filter?: string) {
  if (!filter) return true;
  const k = itemKind.toLowerCase();
  const f = filter.toLowerCase().replace(/^office\//, "");
  if (k === filter.toLowerCase() || k.endsWith(f) || k.includes(f)) return true;
  // русские/общие ярлыки
  if (/стул|кресл|chair|stool/.test(f) && /chair|stool|кресл|стул/.test(k)) {
    return true;
  }
  if (
    /стол|desk|table/.test(f) &&
    /desk|table|стол/.test(k) &&
    !/chair|stool/.test(k)
  ) {
    return true;
  }
  return false;
}

function isChairKind(kind: string) {
  return /chair|stool|кресл|стул/i.test(kind);
}

function isDeskKind(kind: string) {
  return /desk|table|стол/i.test(kind) && !isChairKind(kind);
}

/** Угол, при котором стул смотрит на стол (как в автоплане: юг от стола → rot 0). */
function rotationFacingPoint(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  const angleTo = (Math.atan2(toX - fromX, toY - fromY) * 180) / Math.PI;
  let rot = angleTo + 180;
  rot = ((rot % 360) + 360) % 360;
  return Math.round(rot);
}

function normalizeDegrees(deg: number) {
  return ((((deg % 360) + 360) % 360) + 360) % 360;
}

/** Целевые объекты: выделение → ids; комната → мебель внутри; опционально kind/ids. */
function resolveTargetIds(
  furniture: Furniture[],
  scope: ChatEditScope,
  roomPoints: Pt[] | null,
  opts?: { kind?: string; ids?: string[] },
): Set<string> {
  if (opts?.ids?.length) {
    return new Set(opts.ids);
  }

  let pool: Furniture[] = furniture;
  if (scope.type === "selection") {
    const sel = new Set(
      scope.items.filter((i) => i.kind === "furniture").map((i) => i.id),
    );
    pool = furniture.filter((f) => sel.has(f.id));
  } else if (scope.type === "room" && roomPoints) {
    pool = furnitureInRoom(furniture, roomPoints);
  }

  if (opts?.kind) {
    pool = pool.filter((f) => kindMatches(String(f.kind), opts.kind));
  }
  return new Set(pool.map((f) => f.id));
}

function overlapsBox(
  ax: number,
  ay: number,
  aw: number,
  ad: number,
  bx: number,
  by: number,
  bw: number,
  bd: number,
  margin = 10,
) {
  return (
    Math.abs(ax - bx) < (aw + bw) / 2 + margin &&
    Math.abs(ay - by) < (ad + bd) / 2 + margin
  );
}

function candidatesForPlacement(
  b: { x: number; y: number; width: number; height: number },
  width: number,
  depth: number,
  placement: "wall" | "corner" | "center",
): { x: number; y: number }[] {
  const pad = Math.max(width, depth) / 2 + 28;
  const out: { x: number; y: number }[] = [];

  if (placement === "center") {
    const steps = [-1.2, -0.6, 0, 0.6, 1.2];
    for (const sx of steps) {
      for (const sy of steps) {
        out.push({
          x: b.x + b.width / 2 + sx * width,
          y: b.y + b.height / 2 + sy * depth,
        });
      }
    }
  } else if (placement === "corner") {
    out.push(
      { x: b.x + pad, y: b.y + pad },
      { x: b.x + b.width - pad, y: b.y + pad },
      { x: b.x + pad, y: b.y + b.height - pad },
      { x: b.x + b.width - pad, y: b.y + b.height - pad },
      { x: b.x + pad, y: b.y + b.height / 2 },
      { x: b.x + b.width - pad, y: b.y + b.height / 2 },
    );
  } else {
    const xs = [
      b.x + pad,
      b.x + b.width * 0.28,
      b.x + b.width / 2,
      b.x + b.width * 0.72,
      b.x + b.width - pad,
    ];
    const ys = [
      b.y + pad,
      b.y + b.height * 0.28,
      b.y + b.height / 2,
      b.y + b.height * 0.72,
      b.y + b.height - pad,
    ];
    for (const x of xs) {
      out.push({ x, y: b.y + depth / 2 + 24 });
      out.push({ x, y: b.y + b.height - depth / 2 - 24 });
    }
    for (const y of ys) {
      out.push({ x: b.x + width / 2 + 24, y });
      out.push({ x: b.x + b.width - width / 2 - 24, y });
    }
  }
  return out;
}

function anchorNearScreens(
  occupied: Furniture[],
  b: { x: number; y: number; width: number; height: number },
  kind: string,
): { x: number; y: number }[] {
  if (!/\/projector$/i.test(kind)) return [];
  const anchors = occupied.filter((o) =>
    /projector-screen|whiteboard|mobile-tv|tv-stand|vc-display|interactive-display/i.test(
      String(o.kind),
    ),
  );
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const out: { x: number; y: number }[] = [];
  for (const s of anchors) {
    const dx = cx - s.x;
    const dy = cy - s.y;
    const len = Math.hypot(dx, dy) || 1;
    // чуть внутрь комнаты от экрана/доски — типичное место проектора
    for (const dist of [70, 100, 130, 160]) {
      out.push({
        x: s.x + (dx / len) * dist,
        y: s.y + (dy / len) * dist,
      });
    }
  }
  return out;
}

function placeNear(
  roomPoints: Pt[],
  kind: string,
  placement: "wall" | "corner" | "center",
  occupied: Furniture[],
): Furniture | null {
  const b = polygonBounds(roomPoints);
  if (!b) return null;
  const { width, depth } = sizeForKind(kind);
  const isTiny = Math.max(width, depth) <= 50;

  const order: Array<"wall" | "corner" | "center"> = [
    placement,
    ...(["wall", "corner", "center"] as const).filter((p) => p !== placement),
  ];
  // проектор: сначала у экрана/стены, не в центр стола
  if (/\/projector$/i.test(kind)) {
    order.length = 0;
    order.push("wall", "center", "corner");
  }

  const candidates: { x: number; y: number }[] = [
    ...anchorNearScreens(occupied, b, kind),
  ];
  for (const p of order) {
    candidates.push(...candidatesForPlacement(b, width, depth, p));
  }

  const margin = isTiny ? 6 : 10;

  for (const c of candidates) {
    if (!pointInPolygon(c.x, c.y, roomPoints)) continue;
    const clash = occupied.some((o) =>
      overlapsBox(
        c.x,
        c.y,
        width,
        depth,
        o.x,
        o.y,
        o.width || 60,
        o.depth || 60,
        margin,
      ),
    );
    if (clash) continue;
    return {
      id: uid(),
      kind: kind as Furniture["kind"],
      x: c.x,
      y: c.y,
      width,
      depth,
      rotation: 0,
    };
  }
  return null;
}

/** Экраны/доски раньше проекторов — чтобы якорить проектор к экрану */
function sortAddActions(actions: EditAction[]): EditAction[] {
  const rank = (kind: string) => {
    if (/screen|whiteboard|tv|display|flipchart/i.test(kind)) return 0;
    if (/\/projector$/i.test(kind)) return 1;
    if (/desk|table|chair/i.test(kind)) return 3;
    if (/plant|planter/i.test(kind)) return 9;
    return 5;
  };
  const nonAdd = actions.filter((a) => a.type !== "add_furniture");
  const adds = actions
    .filter((a): a is Extract<EditAction, { type: "add_furniture" }> =>
      a.type === "add_furniture",
    )
    .sort((a, b) => rank(a.kind) - rank(b.kind));
  return [...nonAdd, ...adds];
}

export function applyEditActions(
  plan: FloorPlan,
  floorId: string | null | undefined,
  scope: ChatEditScope,
  actions: EditAction[],
): ApplyEditResult {
  const next: FloorPlan = JSON.parse(JSON.stringify(plan));
  const floor =
    next.floors.find((f) => f.id === floorId) || next.floors[0];
  if (!floor) {
    return { plan: next, messages: ["Нет этажа"] };
  }

  const messages: string[] = [];
  let furniture = [...(floor.furniture || [])];

  const selectionIds =
    scope.type === "selection"
      ? new Set(scope.items.filter((i) => i.kind === "furniture").map((i) => i.id))
      : null;

  const targetRoom =
    scope.type === "room"
      ? roomById(next, floorId, scope.roomId)
      : null;
  const roomPoints = targetRoom?.points || null;

  for (const action of sortAddActions(actions)) {
    if (action.type === "unsupported") {
      messages.push(action.reason || "Команда не поддержана");
      continue;
    }

    if (action.type === "remove_selection") {
      const ids = resolveTargetIds(furniture, scope, roomPoints);
      if (!ids.size) {
        messages.push("Нет мебели для удаления в текущем scope");
        continue;
      }
      const before = furniture.length;
      furniture = furniture.filter((f) => !ids.has(f.id));
      messages.push(`Удалено объектов: ${before - furniture.length}`);
      continue;
    }

    if (action.type === "move_selection") {
      const ids = resolveTargetIds(furniture, scope, roomPoints, {
        kind: action.kind,
      });
      if (!ids.size) {
        messages.push(
          scope.type === "selection"
            ? "Нет выделенной мебели для сдвига"
            : "Нет мебели в комнате для сдвига",
        );
        continue;
      }
      let dx = action.dx ?? 0;
      let dy = action.dy ?? 0;
      const toward = (action.toward || "").toLowerCase();
      if (!dx && !dy && toward) {
        if (/вход|south|юг|вниз/.test(toward)) dy = 80;
        else if (/north|север|вверх/.test(toward)) dy = -80;
        else if (/east|восток|вправ/.test(toward)) dx = 80;
        else if (/west|запад|влев/.test(toward)) dx = -80;
        else dy = 60;
      }
      if (!dx && !dy) {
        dx = 60;
      }
      furniture = furniture.map((f) =>
        ids.has(f.id) ? { ...f, x: f.x + dx, y: f.y + dy } : f,
      );
      messages.push(`Сдвинуто объектов: ${ids.size}`);
      continue;
    }

    if (action.type === "rotate_furniture") {
      const ids = resolveTargetIds(furniture, scope, roomPoints, {
        kind: action.kind,
        ids: action.ids,
      });
      if (!ids.size) {
        messages.push("Нет мебели для поворота в текущем scope");
        continue;
      }

      const face = action.faceToward;
      const delta =
        action.degrees != null && !Number.isNaN(action.degrees)
          ? action.degrees
          : face === "flip"
            ? 180
            : null;

      const roomPool =
        roomPoints != null ? furnitureInRoom(furniture, roomPoints) : furniture;

      let changed = 0;
      furniture = furniture.map((f) => {
        if (!ids.has(f.id)) return f;
        let nextRot = f.rotation || 0;
        if (face === "desk" || (face == null && delta == null)) {
          // к ближайшему столу/деску в том же scope
          let best: Furniture | null = null;
          let bestD = Infinity;
          for (const other of roomPool) {
            if (other.id === f.id) continue;
            if (!isDeskKind(String(other.kind))) continue;
            const d = Math.hypot(other.x - f.x, other.y - f.y);
            if (d < bestD) {
              bestD = d;
              best = other;
            }
          }
          if (best) {
            nextRot = rotationFacingPoint(f.x, f.y, best.x, best.y);
          } else {
            nextRot = normalizeDegrees((f.rotation || 0) + 180);
          }
        } else if (delta != null) {
          nextRot = normalizeDegrees((f.rotation || 0) + delta);
        }
        if (nextRot === (f.rotation || 0)) return f;
        changed += 1;
        return { ...f, rotation: nextRot };
      });
      messages.push(`Повёрнуто объектов: ${changed || ids.size}`);
      continue;
    }

    if (action.type === "clear_room_furniture") {
      if (!roomPoints) {
        messages.push("Очистка доступна только для комнаты");
        continue;
      }
      const before = furniture.length;
      furniture = furniture.filter((f) => !pointInPolygon(f.x, f.y, roomPoints));
      messages.push(`Очищена комната (−${before - furniture.length})`);
      continue;
    }

    if (action.type === "remove_furniture") {
      const before = furniture.length;
      if (action.ids?.length) {
        const ids = new Set(action.ids);
        furniture = furniture.filter((f) => !ids.has(f.id));
      } else if (action.kind) {
        const kind = action.kind;
        furniture = furniture.filter((f) => {
          const k = String(f.kind);
          const match = k === kind || k.endsWith(kind) || k.includes(kind);
          if (!match) return true;
          if (selectionIds?.size) return !selectionIds.has(f.id);
          if (roomPoints) return !pointInPolygon(f.x, f.y, roomPoints);
          return false;
        });
      } else if (selectionIds?.size) {
        furniture = furniture.filter((f) => !selectionIds.has(f.id));
      }
      messages.push(`Удалено: ${before - furniture.length}`);
      continue;
    }

    if (action.type === "add_furniture") {
      const count = Math.max(1, Math.min(12, action.count || 1));
      const placement = action.placement || "wall";
      let hostPoints = roomPoints;
      if (!hostPoints && scope.type === "global") {
        // крупнейшая комната
        const rooms = [...(floor.rooms || [])].sort(
          (a, b) =>
            (polygonBounds(b.points || [])?.width || 0) *
              (polygonBounds(b.points || [])?.height || 0) -
            (polygonBounds(a.points || [])?.width || 0) *
              (polygonBounds(a.points || [])?.height || 0),
        );
        hostPoints = rooms[0]?.points || null;
      }
      if (!hostPoints) {
        messages.push(`Некуда поставить ${action.kind}`);
        continue;
      }
      let added = 0;
      for (let i = 0; i < count; i++) {
        const item = placeNear(
          hostPoints,
          action.kind,
          placement,
          furnitureInRoom(furniture, hostPoints),
        );
        if (!item) break;
        furniture.push(item);
        added += 1;
      }
      messages.push(
        added
          ? `Добавлено ${added}× ${action.kind.replace(/^office\//, "")}`
          : `Не удалось разместить ${action.kind}`,
      );
    }
  }

  floor.furniture = furniture;
  return { plan: next, messages };
}

export function selectionLabels(
  plan: FloorPlan,
  floorId: string | null | undefined,
  items: SelectedItem[],
): string[] {
  const floor =
    plan.floors.find((f) => f.id === floorId) || plan.floors[0];
  if (!floor) return items.map((i) => i.id);
  return items.map((item) => {
    if (item.kind === "furniture") {
      const f = floor.furniture?.find((x) => x.id === item.id);
      return f ? String(f.kind).replace(/^office\//, "") : "мебель";
    }
    if (item.kind === "room") {
      return floor.rooms?.find((r) => r.id === item.id)?.name || "комната";
    }
    return item.kind;
  });
}
