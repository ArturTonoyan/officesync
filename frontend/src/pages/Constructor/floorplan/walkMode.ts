import { Plane, Raycaster, Vector2, Vector3 } from "three";
import {
  floorElevations,
  type FloorPlan,
} from "@jbaysolutions/floorplan-react";
import {
  getActiveOrbitControls,
  subscribeOrbitControls,
} from "../../../vendor/orbitBridge.js";
import { getWalkState } from "../../../vendor/walkState.js";
import { STANDARD_DOOR_WIDTH_CM } from "./openingsSync";

const EYE_HEIGHT = 1.65;
const LOOK_SENS = 0.0024;
const PITCH_LIMIT = Math.PI / 2 - 0.08;
/** Чуть меньше радиус — проще проходить в стандартный проём ~90 см. */
const PLAYER_RADIUS = 0.22;

type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

let wantWalk = false;
let planRef: FloorPlan | null = null;
let floorIdRef: string | null = null;
let listenersBound = false;
let savedOrbit: {
  enabled: boolean;
  enableDamping: boolean;
  enablePan: boolean;
  enableRotate: boolean;
  enableZoom: boolean;
  autoRotate: boolean;
  position: Vector3;
  target: Vector3;
  fov?: number;
} | null = null;

const activeListeners = new Set<(active: boolean) => void>();

function emitActive(active: boolean) {
  for (const fn of activeListeners) {
    try {
      fn(active);
    } catch {
      /* ignore */
    }
  }
}

function floorBounds(plan: FloorPlan, floorId: string | null): Bounds {
  const floor = plan.floors.find((f) => f.id === floorId) || plan.floors[0];
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  const absorb = (x: number, y: number) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, y);
    maxZ = Math.max(maxZ, y);
  };
  for (const w of floor?.walls || []) {
    absorb(w.start.x, w.start.y);
    absorb(w.end.x, w.end.y);
  }
  for (const r of floor?.rooms || []) {
    for (const p of r.points || []) absorb(p.x, p.y);
  }
  if (!Number.isFinite(minX)) {
    return { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
  }
  let a = minX / 100 + PLAYER_RADIUS;
  let b = maxX / 100 - PLAYER_RADIUS;
  let c = minZ / 100 + PLAYER_RADIUS;
  let d = maxZ / 100 - PLAYER_RADIUS;
  if (a > b) {
    const m = (minX + maxX) / 200;
    a = m - 1;
    b = m + 1;
  }
  if (c > d) {
    const m = (minZ + maxZ) / 200;
    c = m - 1;
    d = m + 1;
  }
  return { minX: a, maxX: b, minZ: c, maxZ: d };
}

type Seg = { ax: number; az: number; bx: number; bz: number };

/** Зазор в коллизии чуть шире проёма, чтобы проходить без залипания. */
const OPENING_CLEAR_PAD_M = 0.12;
const MIN_COL_SEG_M = 0.05;

/**
 * Стены для коллизии с вырезами под двери/окна (иначе проём в 3D есть,
 * а пройти нельзя — сегмент стены сплошной).
 * Вырез также переносится на коллинеарные перекрывающие стены.
 */
function wallSegments(plan: FloorPlan, floorId: string | null): Seg[] {
  const floor = plan.floors.find((f) => f.id === floorId) || plan.floors[0];
  if (!floor) return [];

  const walls = floor.walls || [];
  const openingsByWall = new Map<string, { lo: number; hi: number }[]>();

  const addGap = (wallId: string, lo: number, hi: number) => {
    const list = openingsByWall.get(wallId) || [];
    list.push({ lo, hi });
    openingsByWall.set(wallId, list);
  };

  const wallGeom = (w: (typeof walls)[0]) => {
    const ax = w.start.x / 100;
    const az = w.start.y / 100;
    const bx = w.end.x / 100;
    const bz = w.end.y / 100;
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz);
    return { ax, az, bx, bz, dx, dz, len, ux: len > 1e-6 ? dx / len : 0, uz: len > 1e-6 ? dz / len : 0 };
  };

  for (const op of floor.openings || []) {
    const host = walls.find((w) => w.id === op.wallId);
    if (!host) continue;
    const hg = wallGeom(host);
    if (hg.len < MIN_COL_SEG_M) continue;

    const doorCm = op.width || STANDARD_DOOR_WIDTH_CM;
    const half = doorCm / 100 / 2 + OPENING_CLEAR_PAD_M;
    const center = (op.offset || 0) / 100;
    addGap(host.id, center - half, center + half);

    const cx = hg.ax + hg.ux * center;
    const cz = hg.az + hg.uz * center;

    // параллельные стены, лежащие поверх — тоже вырезаем, иначе «вторая» стена не пускает
    for (const other of walls) {
      if (other.id === host.id) continue;
      const og = wallGeom(other);
      if (og.len < MIN_COL_SEG_M) continue;
      const cross = Math.abs(hg.ux * og.uz - hg.uz * og.ux);
      if (cross > 0.03) continue;
      const ox = cx - og.ax;
      const oz = cz - og.az;
      const dist = Math.abs(ox * og.uz - oz * og.ux);
      if (dist > 0.12) continue; // > ~12 см от оси
      const t = ox * og.ux + oz * og.uz;
      if (t < -0.05 || t > og.len + 0.05) continue;
      addGap(other.id, t - half, t + half);
    }
  }

  const out: Seg[] = [];

  for (const w of walls) {
    const g = wallGeom(w);
    if (g.len < MIN_COL_SEG_M) continue;

    const gaps = openingsByWall.get(w.id) || [];
    if (!gaps.length) {
      out.push({ ax: g.ax, az: g.az, bx: g.bx, bz: g.bz });
      continue;
    }

    const merged = [...gaps]
      .map((gap) => ({
        lo: Math.max(0, gap.lo),
        hi: Math.min(g.len, gap.hi),
      }))
      .filter((gap) => gap.hi - gap.lo > 0.01)
      .sort((a, b) => a.lo - b.lo);

    const merged2: { lo: number; hi: number }[] = [];
    for (const gap of merged) {
      const last = merged2[merged2.length - 1];
      if (last && gap.lo <= last.hi + 0.01) last.hi = Math.max(last.hi, gap.hi);
      else merged2.push({ ...gap });
    }

    let cursor = 0;
    const pushSeg = (from: number, to: number) => {
      if (to - from < MIN_COL_SEG_M) return;
      out.push({
        ax: g.ax + g.ux * from,
        az: g.az + g.uz * from,
        bx: g.ax + g.ux * to,
        bz: g.az + g.uz * to,
      });
    };

    for (const gap of merged2) {
      pushSeg(cursor, gap.lo);
      cursor = gap.hi;
    }
    pushSeg(cursor, g.len);
  }

  return out;
}

function floorElevationM(plan: FloorPlan, floorId: string | null): number {
  const floor = plan.floors.find((f) => f.id === floorId) || plan.floors[0];
  if (!floor) return 0;
  try {
    const cm = floorElevations(plan).get(floor.id);
    return typeof cm === "number" ? cm / 100 : 0;
  } catch {
    return 0;
  }
}

function syncWalkPlanIntoState() {
  const w = getWalkState();
  if (!w) return;
  w.eyeHeight = EYE_HEIGHT;
  w.playerRadius = PLAYER_RADIUS;
  if (!planRef) {
    w.bounds = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };
    w.walls = [];
    w.floorY = 0;
    return;
  }
  w.bounds = floorBounds(planRef, floorIdRef);
  w.walls = wallSegments(planRef, floorIdRef);
  w.floorY = floorElevationM(planRef, floorIdRef);
}

function clampToBounds(x: number, z: number) {
  const w = getWalkState();
  if (!w) return { x, z };
  return {
    x: Math.min(w.bounds.maxX, Math.max(w.bounds.minX, x)),
    z: Math.min(w.bounds.maxZ, Math.max(w.bounds.minZ, z)),
  };
}

function enterFirstPersonAtTarget(controls: any) {
  const w = getWalkState();
  if (!w) return;
  const cam = controls.object;
  const t = controls.target as Vector3;
  let x = Number.isFinite(t.x) ? t.x : (w.bounds.minX + w.bounds.maxX) / 2;
  let z = Number.isFinite(t.z) ? t.z : (w.bounds.minZ + w.bounds.maxZ) / 2;
  ({ x, z } = clampToBounds(x, z));

  const offset = new Vector3().subVectors(t, cam.position);
  offset.y = 0;
  if (offset.lengthSq() < 1e-4) offset.set(0, 0, -1);
  offset.normalize();
  w.yaw = Math.atan2(-offset.x, -offset.z);
  w.pitch = 0;
  w.pendingTeleport = { x, z };
  cam.position.set(x, w.floorY + EYE_HEIGHT, z);
}

function disableOrbit(controls: any) {
  if (!savedOrbit) {
    savedOrbit = {
      enabled: controls.enabled,
      enableDamping: controls.enableDamping,
      enablePan: controls.enablePan,
      enableRotate: controls.enableRotate,
      enableZoom: controls.enableZoom,
      autoRotate: controls.autoRotate,
      position: controls.object.position.clone(),
      target: controls.target.clone(),
      fov:
        typeof controls.object.fov === "number"
          ? controls.object.fov
          : undefined,
    };
  }
  controls.enabled = false;
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.autoRotate = false;
  if (typeof controls.object.fov === "number") {
    controls.object.fov = 70;
    controls.object.updateProjectionMatrix();
  }
}

function restoreOrbit(controls: any) {
  if (!savedOrbit) return;
  controls.enabled = savedOrbit.enabled;
  controls.enableDamping = savedOrbit.enableDamping;
  controls.enablePan = savedOrbit.enablePan;
  controls.enableRotate = savedOrbit.enableRotate;
  controls.enableZoom = savedOrbit.enableZoom;
  controls.autoRotate = savedOrbit.autoRotate;
  if (
    savedOrbit.fov != null &&
    typeof controls.object.fov === "number"
  ) {
    controls.object.fov = savedOrbit.fov;
    controls.object.updateProjectionMatrix();
  }
  const p = controls.object.position;
  const w = getWalkState();
  const floorY = w?.floorY ?? 0;
  controls.target.set(p.x, floorY, p.z);
  controls.object.position.set(p.x + 4, floorY + 6, p.z + 4);
  savedOrbit = null;
  try {
    controls.update();
  } catch {
    /* ignore */
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (!wantWalk) return;
  const w = getWalkState();
  if (!w?.active) return;

  if (e.code === "Escape") {
    e.preventDefault();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    } else {
      setWalkMode(false);
    }
    return;
  }

  w.keys[e.code] = true;
  if (
    [
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ShiftLeft",
      "ShiftRight",
    ].includes(e.code)
  ) {
    e.preventDefault();
  }
}

function onKeyUp(e: KeyboardEvent) {
  const w = getWalkState();
  if (!w) return;
  delete w.keys[e.code];
}

function applyLookDelta(movementX: number, movementY: number) {
  const w = getWalkState();
  if (!w?.active) return;
  w.yaw -= movementX * LOOK_SENS;
  w.pitch -= movementY * LOOK_SENS;
  w.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, w.pitch));
}

function onMouseMove(e: MouseEvent) {
  if (!wantWalk) return;
  const w = getWalkState();
  if (!w?.active) return;
  // Свободный взгляд всегда при pointer lock (ЛКМ/ПКМ взгляд не блокируют)
  if (!document.pointerLockElement) return;
  if (!e.movementX && !e.movementY) return;
  applyLookDelta(e.movementX, e.movementY);
}

function onLockChange() {
  emitActive(wantWalk);
}

function bindGlobalListeners() {
  if (listenersBound) return;
  listenersBound = true;
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("pointerlockchange", onLockChange);
}

function unbindGlobalListeners() {
  if (!listenersBound) return;
  listenersBound = false;
  window.removeEventListener("keydown", onKeyDown, true);
  window.removeEventListener("keyup", onKeyUp, true);
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("pointerlockchange", onLockChange);
}

function activateWithControls(controls: any) {
  syncWalkPlanIntoState();
  const w = getWalkState();
  if (!w) return;
  disableOrbit(controls);
  enterFirstPersonAtTarget(controls);
  w.keys = Object.create(null);
  w.lastT = performance.now();
  w.active = true;
  bindGlobalListeners();
  emitActive(true);
}

function deactivate() {
  const w = getWalkState();
  if (w) {
    w.active = false;
    w.keys = Object.create(null);
    w.pendingTeleport = null;
  }
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
  const controls = getActiveOrbitControls();
  if (controls) restoreOrbit(controls);
  unbindGlobalListeners();
  emitActive(false);
}

export function setWalkPlan(plan: FloorPlan, floorId: string | null) {
  planRef = plan;
  floorIdRef = floorId;
  if (wantWalk) syncWalkPlanIntoState();
}

export function setWalkActiveListener(fn: (active: boolean) => void) {
  activeListeners.add(fn);
  return () => activeListeners.delete(fn);
}

export function isWalkMode(): boolean {
  return wantWalk;
}

export function setWalkMode(on: boolean) {
  wantWalk = on;
  if (!on) {
    deactivate();
    return;
  }

  bindGlobalListeners();
  emitActive(true);
  syncWalkPlanIntoState();

  const tryStart = () => {
    if (!wantWalk) return true;
    const controls = getActiveOrbitControls();
    if (!controls) return false;
    const w = getWalkState();
    if (w?.active) return true;
    activateWithControls(controls);
    return true;
  };

  if (tryStart()) return;
  let n = 0;
  const id = window.setInterval(() => {
    n += 1;
    if (tryStart() || !wantWalk || n > 50) window.clearInterval(id);
  }, 100);
}

function lockPointer() {
  if (document.pointerLockElement) return;
  const controls = getActiveOrbitControls();
  const canvas = (controls?.domElement ||
    document.querySelector(".fp-3d-canvas")) as HTMLElement | null;
  if (!canvas?.requestPointerLock) return;
  try {
    const req = canvas.requestPointerLock({
      unadjustedMovement: true,
    } as PointerLockOptions);
    if (req && typeof (req as Promise<void>).catch === "function") {
      (req as Promise<void>).catch(() => {
        canvas.requestPointerLock();
      });
    }
  } catch {
    try {
      canvas.requestPointerLock();
    } catch {
      /* ignore */
    }
  }
}

/** Захват мыши для взгляда (можно вызвать с кнопки/клика). */
export function requestWalkLookLock() {
  if (!wantWalk) return;
  lockPointer();
}

export function teleportWalkTo(xCm: number, yCm: number) {
  if (!wantWalk) return;
  const controls = getActiveOrbitControls();
  if (controls && !getWalkState()?.active) activateWithControls(controls);
  const w = getWalkState();
  if (!w?.active) return;
  const { x, z } = clampToBounds(xCm / 100, yCm / 100);
  w.pendingTeleport = { x, z };
  if (controls) {
    controls.object.position.set(x, w.floorY + EYE_HEIGHT, z);
  }
  lockPointer();
}

/** Луч из камеры: ndcX/ndcY в [-1..1], (0,0) = прицел по центру. */
function planPointFromNdc(
  ndcX: number,
  ndcY: number,
): { xCm: number; yCm: number } | null {
  const controls = getActiveOrbitControls();
  if (!controls) return null;
  const w = getWalkState();
  const floorY = w?.floorY ?? 0;
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(ndcX, ndcY), controls.object);
  const hit = new Vector3();
  const plane = new Plane(new Vector3(0, 1, 0), -floorY);
  if (!raycaster.ray.intersectPlane(plane, hit)) return null;
  return { xCm: hit.x * 100, yCm: hit.z * 100 };
}

/** Точка под прицелом (центр экрана). */
export function planPointFromCrosshair(): { xCm: number; yCm: number } | null {
  return planPointFromNdc(0, 0);
}

/** Экран → точка на полу плана (см). */
export function planPointFromScreen(
  clientX: number,
  clientY: number,
): { xCm: number; yCm: number } | null {
  const controls = getActiveOrbitControls();
  if (!controls) return null;
  const canvas = controls.domElement as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  return planPointFromNdc(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );
}

/** ПКМ: переместиться туда, куда смотришь (прицел). */
export function teleportWalkToCrosshair() {
  if (!wantWalk) return;
  const controls = getActiveOrbitControls();
  if (!controls) return;
  if (!getWalkState()?.active) activateWithControls(controls);
  const w = getWalkState();
  if (!w?.active) return;

  const pt = planPointFromCrosshair();
  if (!pt) {
    const { x, z } = clampToBounds(
      controls.object.position.x,
      controls.object.position.z,
    );
    w.pendingTeleport = { x, z };
  } else {
    const { x, z } = clampToBounds(pt.xCm / 100, pt.yCm / 100);
    w.pendingTeleport = { x, z };
    controls.object.position.set(x, w.floorY + EYE_HEIGHT, z);
  }
  lockPointer();
}

export function teleportWalkFromScreen(clientX: number, clientY: number) {
  if (!wantWalk) return;
  const controls = getActiveOrbitControls();
  if (!controls) return;
  if (!getWalkState()?.active) activateWithControls(controls);

  const w = getWalkState();
  if (!w?.active) return;

  // при pointer lock курсора нет — телепорт по прицелу
  if (document.pointerLockElement) {
    teleportWalkToCrosshair();
    return;
  }

  const pt = planPointFromScreen(clientX, clientY);
  if (!pt) {
    teleportWalkToCrosshair();
    return;
  }

  const { x, z } = clampToBounds(pt.xCm / 100, pt.yCm / 100);
  w.pendingTeleport = { x, z };
  controls.object.position.set(x, w.floorY + EYE_HEIGHT, z);
  lockPointer();
}

export function bindWalkModeToOrbit() {
  return subscribeOrbitControls((controls) => {
    if (wantWalk && controls) {
      const w = getWalkState();
      if (!w?.active) activateWithControls(controls);
    }
  });
}
