import { useEffect, useRef, useState } from "react";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";
import type { SelectedItem } from "../../floorplan/marqueeSelect";

export type ChatEditScope =
  | { type: "global" }
  | { type: "room"; roomId: string; roomName: string }
  | { type: "selection"; items: SelectedItem[]; labels: string[] };

export type ChatTarget = {
  scope: ChatEditScope;
  /** экранные координаты якоря попапа */
  screenX: number;
  screenY: number;
};

type Props = {
  target: ChatTarget | null;
  onCloseTarget: () => void;
  ollamaAvailable: boolean;
  applying: boolean;
  canUndo: boolean;
  lastReply?: string | null;
  onSubmit: (text: string, scope: ChatEditScope) => void;
  onStop: () => void;
  onUndo: () => void;
};

const POP_W = 320;
const POP_H = 300;

function clampPos(x: number, y: number) {
  return {
    x: Math.min(Math.max(8, x), window.innerWidth - POP_W - 8),
    y: Math.min(Math.max(56, y), window.innerHeight - POP_H - 8),
  };
}

function scopeTitle(scope: ChatEditScope): string {
  if (scope.type === "global") return "Общие правки этажа";
  if (scope.type === "room") return `Комната: ${scope.roomName}`;
  const n = scope.items.length;
  return `Выделение: ${n} объект${n === 1 ? "" : n < 5 ? "а" : "ов"}`;
}

function scopeHint(scope: ChatEditScope): string {
  if (scope.type === "global") {
    return "Правки ко всему плану (не к одной комнате)";
  }
  if (scope.type === "room") {
    return "Правки только внутри этой комнаты";
  }
  return (
    scope.labels.slice(0, 4).join(" · ") + (scope.labels.length > 4 ? "…" : "")
  );
}

function ContextualChat({
  target,
  onCloseTarget,
  ollamaAvailable,
  applying,
  canUndo,
  lastReply,
  onSubmit,
  onStop,
  onUndo,
}: Props) {
  const [text, setText] = useState("");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragRef = useRef<{
    ox: number;
    oy: number;
    sx: number;
    sy: number;
  } | null>(null);

  useEffect(() => {
    if (!target) return;
    setText("");
    setPos(
      clampPos(target.screenX - POP_W / 2, target.screenY - 8),
    );
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [target]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setPos(
        clampPos(d.sx + (e.clientX - d.ox), d.sy + (e.clientY - d.oy)),
      );
    };
    const onUp = () => {
      dragRef.current = null;
      setDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging]);

  if (!target) return null;

  const send = () => {
    const t = text.trim();
    if (!t || applying) return;
    onSubmit(t, target.scope);
  };

  return (
    <div
      className="fixed z-[140] w-[320px] rounded-[12px] border border-line bg-white shadow-card"
      style={{ left: pos.x, top: pos.y }}
      role="dialog"
      aria-label="Правка текстом"
    >
      <div
        className={cn(
          "flex cursor-grab items-start gap-2 rounded-t-[12px] border-b border-line bg-muted/50 px-3 py-2.5 active:cursor-grabbing",
          dragging && "cursor-grabbing",
        )}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          if ((e.target as HTMLElement).closest("button")) return;
          e.preventDefault();
          dragRef.current = {
            ox: e.clientX,
            oy: e.clientY,
            sx: pos.x,
            sy: pos.y,
          };
          setDragging(true);
        }}
      >
        <div className="mt-0.5 flex shrink-0 flex-col gap-0.5 text-fg-muted" aria-hidden>
          <span className="block h-0.5 w-3 rounded-full bg-current" />
          <span className="block h-0.5 w-3 rounded-full bg-current" />
        </div>
        <div className="min-w-0 flex-1 select-none">
          <p className="text-[13px] font-semibold text-fg">
            {scopeTitle(target.scope)}
          </p>
          <p className="text-[11px] text-fg-muted">{scopeHint(target.scope)}</p>
        </div>
        <button
          type="button"
          className="cursor-pointer text-[12px] font-semibold text-fg-secondary hover:text-fg"
          onClick={() => {
            if (applying) onStop();
            onCloseTarget();
          }}
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>

      <div className="p-3">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={3}
          placeholder={
            target.scope.type === "room"
              ? "Напр.: добавь доску и 4 стула, убери растения"
              : target.scope.type === "selection"
                ? "Напр.: сдвинь вправо, удали, замени на диван"
                : "Напр.: добавь больше растений у входа"
          }
          className="mb-2 w-full resize-none rounded-sm border border-line-strong bg-white px-2.5 py-2 text-[13px] text-fg outline-none focus:border-ink"
          disabled={applying || !ollamaAvailable}
        />

        {lastReply && (
          <p className="mb-2 rounded-sm bg-muted px-2 py-1.5 text-[11px] text-fg-secondary">
            {lastReply}
          </p>
        )}

        <div className="flex gap-2">
          {applying ? (
            <Button
              variant="secondary"
              className="h-9 flex-1 border-red-200 text-red-700 hover:bg-red-50"
              onClick={onStop}
            >
              Стоп
            </Button>
          ) : (
            <Button
              className="h-9 flex-1"
              disabled={!text.trim() || !ollamaAvailable}
              onClick={send}
            >
              Применить
            </Button>
          )}
          <Button
            variant="secondary"
            className="h-9"
            onClick={() => {
              if (applying) onStop();
              onCloseTarget();
            }}
          >
            Закрыть
          </Button>
        </div>

        {canUndo && !applying ? (
          <Button
            variant="secondary"
            className="mt-2 h-9 w-full"
            onClick={onUndo}
          >
            Отменить правку чата
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default ContextualChat;
