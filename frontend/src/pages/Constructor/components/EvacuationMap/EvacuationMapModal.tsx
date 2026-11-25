import { useEffect, useMemo, useState } from "react";
import type { FloorPlan, Marker } from "@jbaysolutions/floorplan-react";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";
import { generateEvacuationMap } from "./generate";
import { buildEvacuationSvg } from "./buildEvacuationSvg";
import type { EvacuationAnalysis, GenerateEvacuationResult } from "./types";
import {
  bindEvacTextureToFurnitureIds,
  listEvacFurnitureIds,
  loadEvacuationCache,
  saveEvacuationCache,
} from "./evacCache";

type Props = {
  open: boolean;
  onClose: () => void;
  plan: FloorPlan;
  markers: Marker[];
  /** Ключ localStorage (id этажа в API) */
  floorId?: string | null;
  /** id этажа внутри FloorPlan */
  planFloorId?: string | null;
  floorNumber?: number | null;
  floorName?: string | null;
  onApply: (plan: FloorPlan, markers: Marker[]) => void;
  onStartWallPick: () => void;
  /** После запекания SVG → PNG для 3D-постеров */
  onTexturesReady?: () => void;
};

function downloadSvg(svg: string, filename: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPng(svg: string, filename: string) {
  const img = new Image();
  const url = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1600;
    canvas.height = img.naturalHeight || 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }
    ctx.fillStyle = "#FFFCE8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(url);
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(pngUrl);
    }, "image/png");
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

function cacheToResult(
  cached: NonNullable<ReturnType<typeof loadEvacuationCache>>,
  plan: FloorPlan,
  markers: Marker[],
): GenerateEvacuationResult {
  return {
    plan,
    markers,
    analysis: cached.analysis,
    svg: cached.svg,
    report: cached.report,
    postersPlaced: [],
  };
}

export default function EvacuationMapModal({
  open,
  onClose,
  plan,
  markers,
  floorId,
  planFloorId,
  floorNumber,
  floorName,
  onApply,
  onStartWallPick,
  onTexturesReady,
}: Props) {
  const [result, setResult] = useState<GenerateEvacuationResult | null>(null);
  const [posterIdx, setPosterIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const genFloorId = planFloorId || floorId;

  // восстановить схему при смене этажа / первом открытии
  useEffect(() => {
    const cached = loadEvacuationCache(floorId);
    if (cached) {
      setResult(cacheToResult(cached, plan, markers));
      setPosterIdx(0);
      void bindEvacTextureToFurnitureIds(
        listEvacFurnitureIds(plan.floors.flatMap((f) => f.furniture || [])),
      );
    } else {
      setResult(null);
      setPosterIdx(0);
    }
    // только floorId — не сбрасывать при каждом изменении plan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId]);

  // при открытии подтянуть кэш, если в памяти пусто
  useEffect(() => {
    if (!open || result) return;
    const cached = loadEvacuationCache(floorId);
    if (cached) setResult(cacheToResult(cached, plan, markers));
  }, [open, floorId, plan, markers, result]);

  const previewSvg = useMemo(() => {
    if (!result) return null;
    const spot =
      result.analysis.posters[posterIdx] || result.analysis.posters[0];
    return buildEvacuationSvg(result.analysis, {
      highlightPoster: spot || null,
      widthPx: 1100,
    });
  }, [result, posterIdx]);

  if (!open) return null;

  const persistResult = (live: GenerateEvacuationResult) => {
    setResult(live);
    void saveEvacuationCache(floorId, live).then((ok) => {
      if (ok) onTexturesReady?.();
    });
  };

  const run = () => {
    setBusy(true);
    try {
      const live = generateEvacuationMap({
        plan,
        markers,
        floorId: genFloorId,
        floorNumber,
        floorName,
        placePosters: false,
      });
      persistResult(live);
      setPosterIdx(0);
    } finally {
      setBusy(false);
    }
  };

  const applyAuto = () => {
    setBusy(true);
    try {
      const placed = generateEvacuationMap({
        plan,
        markers,
        floorId: genFloorId,
        floorNumber,
        floorName,
        placePosters: true,
      });
      persistResult(placed);
      onApply(placed.plan, placed.markers);
      // модалку не закрываем — схема остаётся на экране
    } finally {
      setBusy(false);
    }
  };

  const pickWall = () => {
    // сохранить текущую схему перед уходом в клик
    if (result) saveEvacuationCache(floorId, result);
    onClose();
    onStartWallPick();
  };

  const analysis: EvacuationAnalysis | null = result?.analysis ?? null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div
        className={cn(
          "flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-sm border border-line bg-elevated shadow-card",
        )}
        role="dialog"
        aria-labelledby="evac-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2
              id="evac-title"
              className="text-[16px] font-semibold tracking-[-0.01em] text-fg"
            >
              План эвакуации
            </h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-snug text-fg-muted">
              Схема сохраняется на этаже — при повторном открытии не нужно
              строить заново. На 3D-постерах отображается этот же план.
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
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5 md:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {!previewSvg ? (
              <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-sm border border-dashed border-line bg-surface px-6 text-center text-[13px] text-fg-muted">
                Нажмите «Построить» — алгоритм найдёт выходы, маршруты и
                рекомендуемые точки размещения.
              </div>
            ) : (
              <div className="overflow-auto rounded-sm border border-line bg-[#FFFCE8]">
                <div
                  className="min-w-[640px]"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              </div>
            )}
          </div>

          <aside className="flex w-full shrink-0 flex-col gap-3 md:w-[280px]">
            <Button className="h-10 w-full" onClick={run} disabled={busy}>
              {busy ? "Строим…" : result ? "Перестроить" : "Построить"}
            </Button>

            <Button
              variant="secondary"
              className="h-10 w-full"
              onClick={pickWall}
            >
              Разместить кликом…
            </Button>

            {result && (
              <>
                <div className="rounded-sm border border-line bg-surface px-3 py-2.5 text-[12px] text-fg">
                  <p className="font-semibold">Результат</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-fg-secondary">
                    {result.report.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  {analysis?.warnings.map((w) => (
                    <p
                      key={w}
                      className="mt-2 text-[12px] font-medium text-[#b32020]"
                    >
                      {w}
                    </p>
                  ))}
                </div>

                {analysis && analysis.posters.length > 1 && (
                  <label className="text-[12px] font-medium text-fg">
                    Точка «Вы находитесь здесь»
                    <select
                      className="mt-1 h-9 w-full rounded-sm border border-line bg-white px-2 text-[13px]"
                      value={posterIdx}
                      onChange={(e) => setPosterIdx(Number(e.target.value))}
                    >
                      {analysis.posters.map((p, i) => (
                        <option key={`${p.roomId}-${i}`} value={i}>
                          {p.local ? "Локальный" : "Этажный"} · точка {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    className="h-9 w-full"
                    onClick={() =>
                      previewSvg &&
                      downloadSvg(
                        previewSvg,
                        `plan-evakuacii-${floorName || "etazh"}.svg`,
                      )
                    }
                  >
                    Скачать SVG (цвет)
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-9 w-full"
                    onClick={() =>
                      previewSvg &&
                      downloadPng(
                        previewSvg,
                        `plan-evakuacii-${floorName || "etazh"}.png`,
                      )
                    }
                  >
                    Скачать PNG
                  </Button>
                  <Button
                    className="h-10 w-full"
                    onClick={applyAuto}
                    disabled={busy}
                  >
                    Авторазмещение
                  </Button>
                </div>
              </>
            )}

            <p className="text-[11px] leading-snug text-fg-muted">
              <strong className="font-semibold text-fg-secondary">
                Разместить кликом
              </strong>{" "}
              — план появится у стены в точке клика; схема в окне сохранится.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
