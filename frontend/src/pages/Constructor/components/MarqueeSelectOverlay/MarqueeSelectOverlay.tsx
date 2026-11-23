import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { FloorPlan } from "@jbaysolutions/floorplan-react";
import {
  clearSelectionHighlights,
  clientToPlan,
  deleteItemsFromPlan,
  describeSelection,
  hitTestMarquee,
  normalizeRect,
  paintSelectionHighlights,
  selectionKey,
  type SelectedItem,
} from "../../floorplan/marqueeSelect";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";

type ScreenRect = { left: number; top: number; width: number; height: number };

type Props = {
  enabled: boolean;
  plan: FloorPlan;
  floorId?: string | null;
  editorRootRef: RefObject<HTMLElement | null>;
  onPlanChange: (plan: FloorPlan) => void;
};

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

function MarqueeSelectOverlay({
  enabled,
  plan,
  floorId,
  editorRootRef,
  onPlanChange,
}: Props) {
  const [modHeld, setModHeld] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [screenBox, setScreenBox] = useState<ScreenRect | null>(null);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const startRef = useRef<{ x: number; y: number; additive: boolean } | null>(
    null,
  );
  const selectedRef = useRef<SelectedItem[]>([]);
  const planRef = useRef(plan);
  const floorIdRef = useRef(floorId);
  const onPlanChangeRef = useRef(onPlanChange);
  selectedRef.current = selected;
  planRef.current = plan;
  floorIdRef.current = floorId;
  onPlanChangeRef.current = onPlanChange;

  const details = useMemo(
    () => describeSelection(plan, selected, floorId),
    [plan, selected, floorId],
  );

  const focusedKeyRef = useRef<string | null>(null);
  const paintingRef = useRef(false);
  focusedKeyRef.current = focusedKey;

  const syncHighlights = useCallback(() => {
    const root = editorRootRef.current;
    if (!root || paintingRef.current) return;
    paintingRef.current = true;
    try {
      if (!enabled || !selectedRef.current.length) {
        clearSelectionHighlights(root);
        return;
      }
      paintSelectionHighlights(
        root,
        describeSelection(
          planRef.current,
          selectedRef.current,
          floorIdRef.current,
        ),
        focusedKeyRef.current,
      );
    } finally {
      window.requestAnimationFrame(() => {
        paintingRef.current = false;
      });
    }
  }, [enabled, editorRootRef]);

  useEffect(() => {
    if (!enabled) {
      setSelected([]);
      setFocusedKey(null);
      setDragging(false);
      setScreenBox(null);
      setModHeld(false);
      clearSelectionHighlights(editorRootRef.current);
    }
  }, [enabled, editorRootRef]);

  // прячем штатный инспектор, пока открыта наша панель выделения
  useEffect(() => {
    const root = editorRootRef.current;
    if (!root) return;
    root.classList.toggle("os-multi-select", enabled && selected.length > 0);
    return () => root.classList.remove("os-multi-select");
  }, [enabled, selected.length, editorRootRef]);

  useEffect(() => {
    syncHighlights();
  }, [details, focusedKey, syncHighlights]);

  // библиотека перерисовывает SVG — восстанавливаем слой, если его снесли
  useEffect(() => {
    if (!enabled) return;
    const root = editorRootRef.current;
    if (!root) return;
    const host = root.querySelector(".fp-canvas-host");
    if (!host) return;

    const observer = new MutationObserver((mutations) => {
      if (paintingRef.current) return;
      const touchedOurs = mutations.some((m) => {
        const t = m.target;
        if (t instanceof Element && t.getAttribute("data-os-selection")) {
          return true;
        }
        return [...m.addedNodes, ...m.removedNodes].some(
          (n) =>
            n instanceof Element &&
            (n.id === "os-marquee-selection" ||
              n.getAttribute?.("data-os-selection")),
        );
      });
      if (touchedOurs && selectedRef.current.length) {
        // наши же правки — не трогаем
        return;
      }
      const missing =
        selectedRef.current.length > 0 &&
        !host.querySelector("#os-marquee-selection");
      if (missing) window.requestAnimationFrame(syncHighlights);
    });
    observer.observe(host, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled, editorRootRef, syncHighlights]);

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      const start = startRef.current;
      const editorRoot = editorRootRef.current;
      startRef.current = null;
      setDragging(false);
      setScreenBox(null);
      if (!start || !editorRoot) return;

      const p0 = clientToPlan(editorRoot, start.x, start.y);
      const p1 = clientToPlan(editorRoot, clientX, clientY);
      if (!p0 || !p1) return;

      const rect = normalizeRect(p0, p1);
      if (rect.width < 4 && rect.height < 4) {
        if (!start.additive) {
          setSelected([]);
          setFocusedKey(null);
        }
        return;
      }

      const hits = hitTestMarquee(planRef.current, rect, floorIdRef.current);
      setSelected((prev) => {
        if (!start.additive) return hits;
        const map = new Map(prev.map((i) => [selectionKey(i), i]));
        hits.forEach((h) => map.set(selectionKey(h), h));
        return [...map.values()];
      });
      setFocusedKey(hits[0] ? selectionKey(hits[0]) : null);
    },
    [editorRootRef],
  );

  useEffect(() => {
    if (!enabled) return;

    const syncMod = (e: KeyboardEvent | MouseEvent) => {
      setModHeld(Boolean(e.metaKey || e.ctrlKey));
    };

    const clearAll = () => {
      setSelected([]);
      setFocusedKey(null);
      setDragging(false);
      setScreenBox(null);
      clearSelectionHighlights(editorRootRef.current);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      setModHeld(Boolean(e.metaKey || e.ctrlKey));
      if (isTypingTarget(e.target)) return;
      if (e.key === "Escape") {
        clearAll();
        return;
      }
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        selectedRef.current.length > 0
      ) {
        e.preventDefault();
        e.stopPropagation();
        const next = deleteItemsFromPlan(
          planRef.current,
          selectedRef.current,
          floorIdRef.current,
        );
        onPlanChangeRef.current(next);
        clearAll();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      setModHeld(Boolean(e.metaKey || e.ctrlKey));
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.button !== 0) return;
      const root = editorRootRef.current;
      if (!root) return;
      const canvas = root.querySelector(".fp-canvas-host");
      if (!canvas || !(canvas instanceof HTMLElement)) return;
      if (!canvas.contains(e.target as Node)) return;

      e.preventDefault();
      e.stopPropagation();
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        additive: e.shiftKey,
      };
      setDragging(true);
      setScreenBox({
        left: e.clientX,
        top: e.clientY,
        width: 0,
        height: 0,
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      syncMod(e);
      const start = startRef.current;
      if (!start) return;
      setScreenBox({
        left: Math.min(start.x, e.clientX),
        top: Math.min(start.y, e.clientY),
        width: Math.abs(e.clientX - start.x),
        height: Math.abs(e.clientY - start.y),
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!startRef.current) return;
      finishDrag(e.clientX, e.clientY);
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerUp, true);
    };
  }, [enabled, editorRootRef, finishDrag]);

  const deleteSelected = () => {
    if (!selected.length) return;
    const next = deleteItemsFromPlan(plan, selected, floorId);
    onPlanChange(next);
    setSelected([]);
    setFocusedKey(null);
    clearSelectionHighlights(editorRootRef.current);
  };

  const removeOne = (item: SelectedItem) => {
    setSelected((prev) => {
      const next = prev.filter((i) => selectionKey(i) !== selectionKey(item));
      if (!next.length) setFocusedKey(null);
      return next;
    });
  };

  if (!enabled) return null;

  return (
    <>
      {screenBox && dragging && (
        <div
          className="pointer-events-none fixed z-[60] border border-ink/80 bg-ink/10"
          style={{
            left: screenBox.left,
            top: screenBox.top,
            width: screenBox.width,
            height: screenBox.height,
          }}
        />
      )}

      {selected.length > 0 && (
        <aside className="pointer-events-auto absolute bottom-4 right-4 top-4 z-[60] flex w-[280px] flex-col overflow-hidden rounded-xl border border-line bg-elevated shadow-card">
          <div className="flex items-start justify-between gap-2 border-b border-line px-3.5 py-3">
            <div>
              <p className="text-[13px] font-semibold tracking-[-0.01em] text-fg">
                Выделение
              </p>
              <p className="mt-0.5 text-[12px] text-fg-muted">
                {selected.length}{" "}
                {selected.length === 1
                  ? "элемент"
                  : selected.length < 5
                    ? "элемента"
                    : "элементов"}
              </p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[12px] font-semibold text-fg-secondary hover:bg-hover hover:text-fg"
              onClick={() => {
                setSelected([]);
                setFocusedKey(null);
                clearSelectionHighlights(editorRootRef.current);
              }}
            >
              Esc
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {details.map((item) => {
              const key = selectionKey(item);
              const active = focusedKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                    active ? "bg-ink text-white" : "hover:bg-hover",
                  )}
                  onClick={() => setFocusedKey(key)}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase tracking-wide",
                      active ? "bg-white/15 text-white" : "bg-muted text-fg-secondary",
                    )}
                  >
                    {item.kindLabel.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13px] font-semibold tracking-[-0.01em]",
                        active ? "text-white" : "text-fg",
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "block text-[11px]",
                        active ? "text-white/70" : "text-fg-muted",
                      )}
                    >
                      {item.kindLabel}
                    </span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                      active
                        ? "text-white/80 hover:bg-white/10 hover:text-white"
                        : "text-fg-muted hover:bg-muted hover:text-fg",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOne(item);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        removeOne(item);
                      }
                    }}
                  >
                    ✕
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 border-t border-line p-3">
            <Button
              variant="secondary"
              className="h-9 flex-1 text-xs"
              onClick={() => {
                setSelected([]);
                setFocusedKey(null);
                clearSelectionHighlights(editorRootRef.current);
              }}
            >
              Снять
            </Button>
            <Button className="h-9 flex-1 text-xs" onClick={deleteSelected}>
              Удалить
            </Button>
          </div>
        </aside>
      )}

      {modHeld && !dragging && selected.length === 0 && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-ink/85 px-3 py-1.5 text-[12px] font-medium text-white">
          Протяните рамку для выбора нескольких элементов
        </div>
      )}
    </>
  );
}

export default MarqueeSelectOverlay;
