import { useEffect, useMemo, useState } from "react";
import type { FloorPlan } from "@jbaysolutions/floorplan-react";
import { cn } from "@utils/cn";
import {
  applyStructuralTemplate,
  deleteStructuralTemplate,
  extractStructuralTemplate,
  loadStructuralTemplates,
  summarizeTemplate,
  upsertStructuralTemplate,
  type StructuralTemplate,
} from "../../floorplan/structuralTemplate";

export type TemplateFloorOption = {
  id: string;
  name: string;
  number?: number | null;
  planData?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  officeId?: string | null;
  currentFloorId?: string | null;
  currentFloorName?: string;
  planFloorId?: string | null;
  getLivePlan: () => FloorPlan;
  floors: TemplateFloorOption[];
  /** Применить к текущему открытому этажу (сразу в редактор). */
  onApplyToCurrent: (plan: FloorPlan) => void;
  /** Применить к другому этажу офиса (записать в его planData). */
  onApplyToOtherFloor: (
    floorId: string,
    template: StructuralTemplate,
  ) => Promise<void> | void;
};

type Mode = "save" | "apply";

function floorLabel(f: TemplateFloorOption) {
  if (f.name) return f.name;
  if (f.number != null) return `${f.number} этаж`;
  return f.id.slice(0, 8);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function StructuralTemplateModal({
  open,
  onClose,
  officeId,
  currentFloorId,
  currentFloorName,
  planFloorId,
  getLivePlan,
  floors,
  onApplyToCurrent,
  onApplyToOtherFloor,
}: Props) {
  const [mode, setMode] = useState<Mode>("save");
  const [name, setName] = useState("");
  const [templates, setTemplates] = useState<StructuralTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targetFloorId, setTargetFloorId] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("save");
    setMsg(null);
    setBusy(false);
    const defaultName = currentFloorName
      ? `Каркас · ${currentFloorName}`
      : "Каркас этажа";
    setName(defaultName);
    const list = loadStructuralTemplates(officeId);
    setTemplates(list);
    setSelectedId(list[0]?.id ?? null);
    setTargetFloorId(currentFloorId || floors[0]?.id || "");
  }, [open, officeId, currentFloorId, currentFloorName, floors]);

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) || null,
    [templates, selectedId],
  );

  const officeFloors = useMemo(
    () => floors.filter((f) => f.id),
    [floors],
  );

  if (!open) return null;

  const handleSave = () => {
    setMsg(null);
    const plan = getLivePlan();
    const tpl = extractStructuralTemplate(plan, planFloorId, {
      name,
      sourceFloorId: currentFloorId || undefined,
      sourceFloorName: currentFloorName,
    });
    if (!tpl) {
      setMsg("Не удалось снять шаблон с плана");
      return;
    }
    const summary = summarizeTemplate(tpl);
    if (
      summary.walls === 0 &&
      summary.rooms === 0 &&
      summary.fixtures === 0
    ) {
      setMsg("На плане нет стен, комнат или сантехники");
      return;
    }
    const next = upsertStructuralTemplate(officeId, tpl);
    setTemplates(next);
    setSelectedId(tpl.id);
    setMode("apply");
    setMsg(
      `Сохранено: ${summary.walls} стен, ${summary.rooms} комнат, ${summary.openings} проёмов, ${summary.fixtures} сантехники`,
    );
  };

  const handleDelete = (id: string) => {
    const next = deleteStructuralTemplate(officeId, id);
    setTemplates(next);
    setSelectedId(next[0]?.id ?? null);
    setMsg("Шаблон удалён");
  };

  const handleApply = async () => {
    if (!selected || !targetFloorId) {
      setMsg("Выберите шаблон и этаж");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const isCurrent = targetFloorId === currentFloorId;
      if (isCurrent) {
        const live = getLivePlan();
        const next = applyStructuralTemplate(live, planFloorId, selected);
        onApplyToCurrent(next);
        setMsg("Шаблон применён к текущему этажу");
      } else {
        const target = officeFloors.find((f) => f.id === targetFloorId);
        await onApplyToOtherFloor(targetFloorId, selected);
        setMsg(
          `Шаблон записан на этаж «${floorLabel(target || { id: targetFloorId, name: "" })}»`,
        );
      }
    } catch (err) {
      setMsg(
        err instanceof Error ? err.message : "Не удалось применить шаблон",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex w-full max-w-[520px] flex-col overflow-hidden rounded-lg border border-line bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="stpl-title"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2
              id="stpl-title"
              className="text-[15px] font-semibold tracking-[-0.01em] text-fg"
            >
              Шаблон каркаса этажа
            </h2>
            <p className="mt-0.5 text-[12px] text-fg-muted">
              Стены, комнаты, двери/окна и сантехника — чтобы перенести на другой
              этаж
            </p>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded px-1.5 text-[18px] leading-none text-fg-muted hover:bg-muted"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </header>

        <div className="flex gap-1 border-b border-line px-3 pt-2">
          {(
            [
              ["save", "Сохранить"],
              ["apply", "Применить"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={cn(
                "cursor-pointer rounded-t px-3 py-2 text-[12.5px] font-semibold",
                mode === id
                  ? "bg-muted text-fg"
                  : "text-fg-muted hover:text-fg",
              )}
              onClick={() => {
                setMode(id);
                setMsg(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 px-4 py-3">
          {mode === "save" && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                  Название шаблона
                </span>
                <input
                  className="h-9 rounded-md border border-line bg-bg px-3 text-[13px] text-fg outline-none focus:border-ink"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Типовой 1 этаж"
                />
              </label>
              <p className="rounded-md bg-muted/70 px-3 py-2 text-[12px] leading-snug text-fg-muted">
                В шаблон войдут стены, комнаты, проёмы и сантехника (унитаз,
                раковина, ванна, душ). Столы, маркеры и комплектация рабочих мест
                не копируются.
              </p>
              <button
                type="button"
                className="h-9 cursor-pointer rounded-md bg-ink text-[13px] font-semibold text-white hover:bg-ink/90"
                onClick={handleSave}
              >
                Сохранить шаблон с текущего этажа
              </button>
            </>
          )}

          {mode === "apply" && (
            <>
              {templates.length === 0 ? (
                <p className="rounded-md bg-muted/70 px-3 py-3 text-[13px] text-fg-muted">
                  Пока нет сохранённых шаблонов. Сначала сохраните каркас с
                  этажа-источника.
                </p>
              ) : (
                <>
                  <div className="max-h-[220px] space-y-1.5 overflow-y-auto">
                    {templates.map((t) => {
                      const s = summarizeTemplate(t);
                      const active = t.id === selectedId;
                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "flex items-start gap-2 rounded-md border px-3 py-2",
                            active
                              ? "border-ink bg-muted/50"
                              : "border-line hover:bg-muted/30",
                          )}
                        >
                          <button
                            type="button"
                            className="min-w-0 flex-1 cursor-pointer text-left"
                            onClick={() => setSelectedId(t.id)}
                          >
                            <div className="truncate text-[13px] font-semibold text-fg">
                              {t.name}
                            </div>
                            <div className="mt-0.5 text-[11px] text-fg-muted">
                              {formatDate(t.createdAt)}
                              {t.sourceFloorName
                                ? ` · из «${t.sourceFloorName}»`
                                : ""}
                              {" · "}
                              {s.walls} ст. / {s.rooms} комн. / {s.fixtures}{" "}
                              сан.
                            </div>
                          </button>
                          <button
                            type="button"
                            className="shrink-0 cursor-pointer px-1.5 text-[12px] text-fg-muted hover:text-[#b32020]"
                            onClick={() => handleDelete(t.id)}
                            title="Удалить шаблон"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                      Куда применить
                    </span>
                    <select
                      className="h-9 rounded-md border border-line bg-bg px-3 text-[13px] text-fg outline-none focus:border-ink"
                      value={targetFloorId}
                      onChange={(e) => setTargetFloorId(e.target.value)}
                    >
                      {officeFloors.map((f) => (
                        <option key={f.id} value={f.id}>
                          {floorLabel(f)}
                          {f.id === currentFloorId ? " (текущий)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <p className="rounded-md bg-amber-50 px-3 py-2 text-[12px] leading-snug text-amber-950">
                    Стены, комнаты и проёмы на целевом этаже будут заменены.
                    Обычная мебель останется; сантехника обновится из шаблона.
                  </p>

                  <button
                    type="button"
                    disabled={busy || !selected}
                    className="h-9 cursor-pointer rounded-md bg-[#482BE7] text-[13px] font-semibold text-white hover:bg-[#3a22c4] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void handleApply()}
                  >
                    {busy ? "Применение…" : "Применить шаблон"}
                  </button>
                </>
              )}
            </>
          )}

          {msg && (
            <p className="rounded-md bg-muted px-3 py-2 text-[12.5px] font-medium text-fg">
              {msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
