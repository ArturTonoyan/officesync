import { useMemo, useState } from "react";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";
import {
  NORM_CATEGORIES,
  OFFICE_NORMS_RF,
  type NormCategoryId,
} from "./normsCatalog";
import type { NormViolation } from "./types";

type Props = {
  violations: NormViolation[];
  ollamaAvailable: boolean;
  explaining: boolean;
  onFocusViolation: (id: string) => void;
  onExplain: () => void;
};

type ViewTab = "violations" | "catalog";

function NormsPanel({
  violations,
  ollamaAvailable,
  explaining,
  onFocusViolation,
  onExplain,
}: Props) {
  const [view, setView] = useState<ViewTab>("catalog");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NORM_CATEGORIES.map((c) => [c.id, true])),
  );

  const errors = violations.filter((v) => v.severity === "error").length;
  const warnings = violations.filter((v) => v.severity === "warning").length;

  const byCategory = useMemo(() => {
    const map = new Map<NormCategoryId, typeof OFFICE_NORMS_RF>();
    for (const cat of NORM_CATEGORIES) map.set(cat.id, []);
    for (const rule of OFFICE_NORMS_RF) {
      map.get(rule.category)?.push(rule);
    }
    return map;
  }, []);

  const v1Count = OFFICE_NORMS_RF.filter((r) => r.checkedInV1).length;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-4 py-3">
        <p className="text-[13px] font-semibold text-fg">
          Нормы РФ для офиса
        </p>
        <p className="mt-0.5 text-[12px] text-fg-muted">
          СП 2.2.3670-20 · СанПиН 1.2.3685-21 · СП 1.13130 · СП 44.13330
        </p>
        <div className="mt-2.5 inline-flex w-full gap-0.5 rounded-sm border border-line-strong bg-muted p-[3px]">
          <button
            type="button"
            className={cn(
              "h-8 flex-1 cursor-pointer rounded-md text-[12px] font-semibold text-fg-secondary",
              view === "catalog" && "bg-white text-fg shadow-soft",
            )}
            onClick={() => setView("catalog")}
          >
            Справочник ({OFFICE_NORMS_RF.length})
          </button>
          <button
            type="button"
            className={cn(
              "h-8 flex-1 cursor-pointer rounded-md text-[12px] font-semibold text-fg-secondary",
              view === "violations" && "bg-white text-fg shadow-soft",
            )}
            onClick={() => setView("violations")}
          >
            На плане
            {violations.length > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-[#b32020] px-1 text-[10px] font-bold text-white">
                {violations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {view === "catalog" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-sm border border-line bg-muted/50 px-3 py-2.5 text-[12px] leading-snug text-fg-secondary">
              Как должен быть устроен офис по нормам РФ. В проверках v1
              участвуют{" "}
              <span className="font-semibold text-fg">{v1Count}</span> правил
              (метка «v1»). Остальные — справочно для планировки и диплома.
            </div>

            {NORM_CATEGORIES.map((cat) => {
              const rules = byCategory.get(cat.id) || [];
              const open = !!openCats[cat.id];
              return (
                <section
                  key={cat.id}
                  className="overflow-hidden rounded-sm border border-line bg-white"
                >
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenCats((prev) => ({
                        ...prev,
                        [cat.id]: !prev[cat.id],
                      }))
                    }
                  >
                    <span
                      className={cn(
                        "text-[11px] text-fg-muted transition-transform",
                        open && "rotate-90",
                      )}
                    >
                      ▶
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-fg">
                        {cat.title}
                      </span>
                      <span className="block text-[11px] text-fg-muted">
                        {cat.hint}
                      </span>
                    </span>
                    <span className="text-[11px] font-medium text-fg-muted">
                      {rules.length}
                    </span>
                  </button>

                  {open && (
                    <ul className="border-t border-line">
                      {rules.map((rule) => (
                        <li
                          key={rule.id}
                          className="border-b border-line px-3 py-2.5 last:border-b-0"
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[13px] font-semibold text-fg">
                              {rule.title}
                            </span>
                            {rule.checkedInV1 && (
                              <span className="rounded-sm bg-[#482BE7]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#482BE7]">
                                v1
                              </span>
                            )}
                          </div>
                          {rule.value && (
                            <p className="mb-1 text-[12px] font-semibold text-[#482BE7]">
                              {rule.value}
                            </p>
                          )}
                          <p className="text-[12px] leading-snug text-fg-secondary">
                            {rule.requirement}
                          </p>
                          <p className="mt-1.5 text-[11px] text-fg-muted">
                            {rule.source}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {view === "violations" && (
          <>
            <p className="mb-3 text-[12px] text-fg-muted">
              {violations.length === 0
                ? "Нарушений на плане нет"
                : `${errors} ошибок · ${warnings} предупреждений · клик — фокус на объекте`}
            </p>
            {violations.length === 0 ? (
              <div className="rounded-sm border border-dashed border-line px-3 py-6 text-center text-[13px] text-fg-muted">
                Все проверенные нормы в порядке. Красная / оранжевая подсветка
                появится при нарушениях.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {violations.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => onFocusViolation(v.id)}
                      className={cn(
                        "w-full cursor-pointer rounded-sm border px-3 py-2.5 text-left transition-colors hover:bg-muted",
                        v.severity === "error"
                          ? "border-[#f0c0c0] bg-[#fff5f5]"
                          : "border-[#f0d9a8] bg-[#fffaf0]",
                      )}
                    >
                      <span className="mb-1 flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase",
                            v.severity === "error"
                              ? "bg-tag-red-bg text-[#b32020]"
                              : "bg-[#fff1d6] text-[#9a5b00]",
                          )}
                        >
                          {v.severity === "error" ? "error" : "warning"}
                        </span>
                        {v.objectLabel && (
                          <span className="truncate text-[11px] font-medium text-fg-muted">
                            {v.objectLabel}
                          </span>
                        )}
                      </span>
                      <span className="block text-[13px] font-medium leading-snug text-fg">
                        {v.message}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-line bg-elevated p-4">
        <Button
          variant="secondary"
          className="h-10 w-full"
          disabled={violations.length === 0 || !ollamaAvailable || explaining}
          onClick={onExplain}
          title={
            !ollamaAvailable
              ? "Ollama недоступна"
              : "Понятное объяснение нарушений"
          }
        >
          {explaining ? "Объяснение…" : "Объяснить нарушения"}
        </Button>
      </div>
    </div>
  );
}

export default NormsPanel;
