import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@components/ui";
import { cn } from "@utils/cn";
import {
  ROLE_LABEL,
  normalizeEquipmentRole,
  type EquipmentRef,
  type WorkplaceRole,
} from "../../floorplan/workplaceKit";

type CategoryId = WorkplaceRole | "all";

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "pc", label: ROLE_LABEL.pc },
  { id: "monitor", label: ROLE_LABEL.monitor },
  { id: "keyboard", label: ROLE_LABEL.keyboard },
  { id: "mouse", label: ROLE_LABEL.mouse },
  { id: "dock", label: ROLE_LABEL.dock },
  { id: "other", label: ROLE_LABEL.other },
];

type Props = {
  open: boolean;
  items: EquipmentRef[];
  deskLabel?: string;
  onPick: (eq: EquipmentRef) => void;
  onClose: () => void;
};

export default function EquipmentPickerModal({
  open,
  items,
  deskLabel,
  onPick,
  onClose,
}: Props) {
  const [category, setCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const wasOpenRef = useRef(false);

  // Сброс фильтров только при открытии модалки (не на каждый ререндер)
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setCategory("all");
      setQuery("");
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const eq of items) {
      const role = normalizeEquipmentRole(eq.type, eq.name);
      map[role] = (map[role] || 0) + 1;
    }
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((eq) => {
      const role = normalizeEquipmentRole(eq.type, eq.name);
      if (category !== "all" && role !== category) return false;
      if (!q) return true;
      const hay = [eq.name, eq.type, eq.inventoryNumber]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, category, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[84vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-line-strong bg-elevated shadow-lg"
        style={{ backgroundColor: "#ffffff" }}
        role="dialog"
        aria-labelledby="eq-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2
              id="eq-picker-title"
              className="text-[16px] font-semibold tracking-[-0.01em] text-fg"
            >
              Оборудование из БД
            </h2>
            <p className="mt-1 text-[12px] text-fg-muted">
              {deskLabel
                ? `Добавить на «${deskLabel}» · свободно: ${items.length}`
                : `Свободных единиц: ${items.length}`}
            </p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-fg-secondary hover:bg-muted hover:text-fg"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </header>

        <div className="border-b border-line px-5 py-3">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: название, тип, инвентарный номер…"
            className="h-10 py-2"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const n = counts[c.id] || 0;
              if (c.id !== "all" && n === 0) return null;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={cn(
                    "cursor-pointer rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    category === c.id
                      ? "bg-ink text-white"
                      : "bg-muted text-fg-secondary hover:bg-hover",
                  )}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                  <span className="ml-1.5 tabular-nums opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-fg-muted">
              {items.length === 0
                ? "Нет свободного оборудования на этаже"
                : "Ничего не найдено — измените поиск или категорию"}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {filtered.map((eq) => {
                const role = normalizeEquipmentRole(eq.type, eq.name);
                return (
                  <li key={eq.id}>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-muted"
                      onClick={() => onPick(eq)}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold uppercase text-fg-secondary">
                        {ROLE_LABEL[role].slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-fg">
                          {eq.name || "Оборудование"}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-fg-muted">
                          {[ROLE_LABEL[role], eq.type, eq.inventoryNumber]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-fg-secondary">
                        Выбрать
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="border-t border-line px-5 py-3 text-[11px] text-fg-muted">
          Показано {filtered.length} из {items.length}. Уже занятые на столах
          скрыты.
        </footer>
      </div>
    </div>
  );
}
