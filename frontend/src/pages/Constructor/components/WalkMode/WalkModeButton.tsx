import { useEffect, useRef, useState } from "react";
import type { FloorPlan } from "@jbaysolutions/floorplan-react";
import { cn } from "@utils/cn";
import {
  bindWalkModeToOrbit,
  isWalkMode,
  requestWalkLookLock,
  setWalkActiveListener,
  setWalkMode,
  setWalkPlan,
} from "../../floorplan/walkMode";

type Props = {
  plan: FloorPlan;
  floorId: string | null;
  visible: boolean;
  onActiveChange?: (active: boolean) => void;
};

function WalkModeButton({ plan, floorId, visible, onActiveChange }: Props) {
  const [active, setActive] = useState(false);
  const [locked, setLocked] = useState(false);
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  useEffect(() => {
    setWalkPlan(plan, floorId);
  }, [plan, floorId]);

  useEffect(() => {
    if (!visible && isWalkMode()) setWalkMode(false);
  }, [visible]);

  useEffect(() => {
    const unsubActive = setWalkActiveListener((on) => {
      setActive(on);
      setLocked(!!document.pointerLockElement);
      onActiveChangeRef.current?.(on);
    });
    const unsubOrbit = bindWalkModeToOrbit();
    const onLock = () => setLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onLock);
    return () => {
      unsubActive();
      unsubOrbit();
      document.removeEventListener("pointerlockchange", onLock);
      if (isWalkMode()) setWalkMode(false);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        className={cn(
          "fixed left-4 top-20 z-[120] flex h-9 items-center gap-2 rounded-sm border border-line bg-white px-3 text-[12px] font-semibold tracking-[-0.01em] text-fg shadow-soft",
          "cursor-pointer hover:bg-hover",
          active && "border-ink bg-ink text-white hover:bg-ink",
        )}
        aria-pressed={active}
        onClick={() => {
          const next = !isWalkMode();
          setWalkMode(next);
          setActive(next);
          setLocked(false);
          onActiveChangeRef.current?.(next);
          if (next) {
            // жест клика по кнопке → сразу захват мыши для взгляда
            requestAnimationFrame(() => requestWalkLookLock());
          }
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <circle cx="12" cy="5" r="2.25" />
          <path
            d="M12 8.5v4.5M12 13l-3.5 6M12 13l3.5 6M8.5 11.5h7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {active ? "Выйти из прогулки" : "Прогулка"}
      </button>

      {active && (
        <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[120] flex justify-center px-4">
          <div className="rounded-sm border border-line bg-white/95 px-4 py-2 text-center text-[12px] font-medium text-fg shadow-soft backdrop-blur-sm">
            <>
              <span className="font-semibold">Мышь</span> — взгляд ·{" "}
              <span className="font-semibold">WASD</span> — ходьба ·{" "}
              <span className="font-semibold">ЛКМ</span> — инфо ·{" "}
              <span className="font-semibold">ПКМ</span> — переместиться ·{" "}
              <span className="font-semibold">Esc</span> — курсор
            </>
          </div>
        </div>
      )}

      {active && locked && (
        <div
          className="pointer-events-none fixed left-1/2 top-1/2 z-[119] h-3 w-3 -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink/70" />
          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink/70" />
        </div>
      )}
    </>
  );
}

export default WalkModeButton;
