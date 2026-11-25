import { useEffect, type RefObject } from "react";
import {
  planPointFromCrosshair,
  planPointFromScreen,
  requestWalkLookLock,
  teleportWalkFromScreen,
  teleportWalkToCrosshair,
} from "../../floorplan/walkMode";

type Props = {
  walkActive: boolean;
  hostRef: RefObject<HTMLElement | null>;
  onInspect: (clientX: number, clientY: number, xCm?: number, yCm?: number) => void;
};

function eventInHost(e: Event, host: HTMLElement): boolean {
  for (const node of e.composedPath()) {
    if (node === host) return true;
    if (node instanceof Element) {
      if (node.classList?.contains("fp-3d-canvas")) return true;
      if (node.tagName?.toLowerCase() === "floorplan-viewer-3d") return true;
    }
  }
  return false;
}

/**
 * В прогулке всегда:
 * — мышь = взгляд (pointer lock, ЛКМ взгляд не отменяет)
 * — ЛКМ = инфо о том, на что смотришь
 * — ПКМ = телепорт в точку взгляда
 */
function WalkClickOverlay({ walkActive, hostRef, onInspect }: Props) {
  useEffect(() => {
    if (!walkActive) return;

    const onContextMenu = (e: Event) => {
      const host = hostRef.current;
      if (!host || !eventInHost(e, host)) return;
      e.preventDefault();
    };

    const onPointerDown = (e: PointerEvent) => {
      const host = hostRef.current;
      if (!host || !eventInHost(e, host)) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("button, a, input, textarea, [role='menu']")) return;
      if (e.button !== 0 && e.button !== 2) return;

      // не гасим событие полностью — только контекстное меню;
      // взгляд (mousemove + lock) продолжает работать
      if (e.button === 2) {
        e.preventDefault();
        if (document.pointerLockElement) {
          teleportWalkToCrosshair();
        } else {
          teleportWalkFromScreen(e.clientX, e.clientY);
        }
        return;
      }

      if (e.button === 0) {
        // сначала lock для взгляда, если ещё нет
        if (!document.pointerLockElement) {
          requestWalkLookLock();
        }
        const locked = !!document.pointerLockElement;
        const pt = locked
          ? planPointFromCrosshair()
          : planPointFromScreen(e.clientX, e.clientY);
        if (pt) {
          onInspect(e.clientX, e.clientY, pt.xCm, pt.yCm);
        } else {
          onInspect(e.clientX, e.clientY);
        }
      }
    };

    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [walkActive, hostRef, onInspect]);

  return null;
}

export default WalkClickOverlay;
