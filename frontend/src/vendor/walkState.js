/** Shared walk-mode state on window (survives Vite module duplication). */

export const WALK_KEY = "__fpWalk";

export function getWalkState() {
  if (typeof window === "undefined") return null;
  if (!window[WALK_KEY]) {
    window[WALK_KEY] = {
      active: false,
      yaw: 0,
      pitch: 0,
      keys: Object.create(null),
      floorY: 0,
      eyeHeight: 1.65,
      bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
      walls: [],
      playerRadius: 0.28,
      speed: 2.4,
      sprintMult: 1.85,
      lastT: 0,
      pendingTeleport: null, // { x, z } meters
    };
  }
  return window[WALK_KEY];
}
