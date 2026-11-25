import { useState } from "react";
import type { FloorPlan, Marker } from "@jbaysolutions/floorplan-react";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";
import {
  DEFAULT_SAFETY_OPTIONS,
  placeSafetyGear,
  type SafetyOptions,
  type SafetyPlaceResult,
} from "./generate";
import type { Furniture } from "@jbaysolutions/floorplan-react";

type Props = {
  open: boolean;
  onClose: () => void;
  plan: FloorPlan;
  markers: Marker[];
  planFloorId?: string | null;
  /** apply + список только что размещённых объектов */
  onApply: (
    plan: FloorPlan,
    markers: Marker[],
    placed: Furniture[],
  ) => void;
};

const TOGGLES: { key: keyof SafetyOptions; label: string; hint: string }[] = [
  {
    key: "extinguishers",
    label: "Огнетушители",
    hint: "ППР 1479: ≥2 на этаж, путь ≤20 м",
  },
  {
    key: "exitSigns",
    label: "Знаки «Выход»",
    hint: "ГОСТ 12.4.026 / 34428 — над эвакуационными дверями",
  },
  {
    key: "exitArrows",
    label: "Направление к выходу",
    hint: "Шаг ≤5 м вдоль коридоров (ГОСТ 34428)",
  },
  {
    key: "fireSigns",
    label: "Знак «Огнетушитель»",
    hint: "F04 рядом с каждым огнетушителем",
  },
  {
    key: "firstAid",
    label: "Аптечки",
    hint: "У выхода / в зоне общего пользования",
  },
];

export default function SafetyGearDrawer({
  open,
  onClose,
  plan,
  markers,
  planFloorId,
  onApply,
}: Props) {
  const [opts, setOpts] = useState<SafetyOptions>({ ...DEFAULT_SAFETY_OPTIONS });
  const [result, setResult] = useState<SafetyPlaceResult | null>(null);
  const [busy, setBusy] = useState(false);

  const runPreview = () => {
    setBusy(true);
    try {
      const live = placeSafetyGear({
        plan,
        markers,
        floorId: planFloorId,
        options: opts,
      });
      setResult(live);
    } finally {
      setBusy(false);
    }
  };

  const runApply = () => {
    setBusy(true);
    try {
      const live = placeSafetyGear({
        plan,
        markers,
        floorId: planFloorId,
        options: opts,
      });
      setResult(live);
      onApply(live.plan, live.markers, live.placed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <aside
        className={cn(
          "fixed top-16 right-0 z-[120] flex h-[calc(100vh-4rem)] w-full max-w-[380px] flex-col border-l border-line bg-white shadow-card transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
        role="dialog"
        aria-label="Средства безопасности"
      >
        <header className="flex shrink-0 items-start gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
              Безопасность
            </h3>
            <p className="mt-1 text-[12px] leading-snug text-fg-muted">
              Авторазмещение по ППР&nbsp;1479, ГОСТ&nbsp;12.4.026 и
              ГОСТ&nbsp;34428. Закрытие панели выходит из режима.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-fg-secondary hover:bg-muted hover:text-fg"
            aria-label="Закрыть и выйти из режима"
          >
            ✕
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
          <ul className="flex flex-col gap-2">
            {TOGGLES.map((t) => (
              <li key={t.key}>
                <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-line bg-surface px-3 py-2.5 hover:border-fg-muted">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[#482BE7]"
                    checked={opts[t.key]}
                    onChange={(e) =>
                      setOpts((o) => ({ ...o, [t.key]: e.target.checked }))
                    }
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-fg">
                      {t.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-fg-muted">
                      {t.hint}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {result && (
            <div className="rounded-sm border border-line bg-surface px-3 py-2.5 text-[12px] text-fg">
              <p className="font-semibold">Результат</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-fg-secondary">
                {result.report.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {result.warnings.map((w) => (
                <p
                  key={w}
                  className="mt-2 text-[12px] font-medium text-[#b32020]"
                >
                  {w}
                </p>
              ))}
            </div>
          )}

          <div className="rounded-sm border border-dashed border-line bg-surface/60 px-3 py-2 text-[11px] leading-snug text-fg-muted">
            «Разместить» ставит объекты, выделяет их и закрывает режим.
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-line px-4 py-3">
          <Button
            className="h-10 w-full"
            disabled={busy || !Object.values(opts).some(Boolean)}
            onClick={runApply}
          >
            {busy ? "Размещаем…" : "Разместить на плане"}
          </Button>
          <Button
            variant="secondary"
            className="h-9 w-full"
            disabled={busy || !Object.values(opts).some(Boolean)}
            onClick={runPreview}
          >
            Предпросмотр отчёта
          </Button>
          <Button variant="secondary" className="h-9 w-full" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </aside>
    </>
  );
}
