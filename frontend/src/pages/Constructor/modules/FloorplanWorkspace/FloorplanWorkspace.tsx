import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FloorplanEditor,
  FloorplanViewer,
  normalizePlan,
  registerPack,
  type FloorPlan,
  type Marker,
  type FloorplanEditorElement,
} from "@jbaysolutions/floorplan-react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@store/hooks";
import {
  setSelectedFloor,
  setSelectedOffice,
} from "../../../../store/convaSlice/conva.Slice";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiGetFloors,
  apiGetOffices,
  apiUpdateFloor,
  apiUpdateFloorImage,
} from "../../../../api/apirequests";
import { useSearchParams } from "react-router-dom";
import TopMenu from "../TopMenu/TopMenu";
import ModeToggle, {
  type ViewMode,
} from "../../components/ModeToggle/ModeToggle";
import MarqueeSelectOverlay from "../../components/MarqueeSelectOverlay/MarqueeSelectOverlay";
import {
  attachFloorplanRussian,
  formatLengthRu,
} from "../../floorplan/i18nRu";
import {
  createRussianPlan,
  furnitureCatalogRu,
  localizePlan,
  officePackRu,
} from "../../floorplan/catalogRu";
import { buildPlanPreviewBlob } from "../../floorplan/planPreview";
import { cn } from "@utils/cn";

registerPack(officePackRu);

const FloorplanViewer3D = lazy(() =>
  import("@jbaysolutions/floorplan-react/3d").then(async (m) => {
    const { registerPack3D } = m;
    const { office3D } = await import("@jbaysolutions/floorplan-pack-office/3d");
    registerPack3D(office3D);
    return { default: m.FloorplanViewer3D };
  }),
);

type StoredMap = {
  plan: FloorPlan;
  markers: Marker[];
};

const storageKey = (floorId: string) => `officesync-floorplan:${floorId}`;

function parseStored(raw: string | null | undefined): StoredMap | null {
  if (!raw) return null;
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!data?.plan) return null;
    return {
      plan: localizePlan(normalizePlan(data.plan)),
      markers: Array.isArray(data.markers) ? data.markers : [],
    };
  } catch {
    return null;
  }
}

function FloorplanWorkspace({ noedit = false }: { noedit?: boolean }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const user = useAppSelector((state) => state.user.user.data) as {
    companyId?: string;
    officeId?: string;
    floorId?: string;
  } | null;
  const conva = useAppSelector((state) => state.conva);
  const editorRef = useRef<FloorplanEditorElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(noedit ? "2d" : "edit");
  const [plan, setPlan] = useState<FloorPlan>(() => createRussianPlan("Офис"));
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [planFloorId, setPlanFloorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const loadedFloorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!workspaceRef.current) return;
    return attachFloorplanRussian(workspaceRef.current);
  }, [viewMode]);

  const { data: offices, refetch: refetchOffices } = useQuery({
    queryKey: ["offices/all/id", user?.companyId],
    queryFn: () => apiGetOffices(user?.companyId),
    staleTime: Infinity,
    enabled: !!user?.companyId,
  });

  const { data: floors, refetch: refetchFloors } = useQuery({
    queryKey: ["offices", user?.companyId],
    queryFn: () => apiGetFloors(user?.companyId),
    staleTime: Infinity,
    enabled: !!user?.companyId,
  });

  useEffect(() => {
    if (!offices?.data?.length) return;

    const officeFromUrl = searchParams.get("office");
    const floorFromUrl = searchParams.get("floor");

    if (officeFromUrl) {
      const officeExists = offices.data.some((o) => o.id === officeFromUrl);
      if (officeExists && conva.offices.selected !== officeFromUrl) {
        dispatch(
          setSelectedOffice({ id: officeFromUrl, offices: offices.data }),
        );
      }
      if (floorFromUrl && floors?.data?.length) {
        const floorExists = floors.data.some((f) => f.id === floorFromUrl);
        if (floorExists && conva.floors.selected !== floorFromUrl) {
          dispatch(
            setSelectedFloor({ id: floorFromUrl, floors: floors.data }),
          );
        }
      }
      return;
    }

    if (conva.offices.selected) return;

    const preferredOffice =
      offices.data.find((office) => office.id === user?.officeId) ||
      offices.data[0];

    dispatch(
      setSelectedOffice({ id: preferredOffice.id, offices: offices.data }),
    );

    const officeFloors = [...(preferredOffice.floors || [])].sort(
      (a, b) => a.number - b.number,
    );
    const preferredFloor =
      officeFloors.find((floor) => floor.id === user?.floorId) ||
      officeFloors[0];

    if (preferredFloor && floors?.data?.length) {
      dispatch(
        setSelectedFloor({ id: preferredFloor.id, floors: floors.data }),
      );
    }
  }, [
    offices?.data,
    floors?.data,
    user?.officeId,
    user?.floorId,
    conva.offices.selected,
    conva.floors.selected,
    searchParams,
    dispatch,
  ]);

  const selectedFloorId = conva.floors.selected;
  const selectedFloor = conva.floors.selectedObject as {
    id?: string;
    name?: string;
    number?: number;
    planData?: string;
  } | null;

  useEffect(() => {
    if (!selectedFloorId) return;
    if (loadedFloorRef.current === selectedFloorId) return;

    const fromApi = parseStored(selectedFloor?.planData);
    const fromLocal = parseStored(
      localStorage.getItem(storageKey(selectedFloorId)),
    );
    const stored = fromApi || fromLocal;

    if (stored) {
      setPlan(stored.plan);
      setMarkers(stored.markers);
      setPlanFloorId(stored.plan.floors?.[0]?.id ?? null);
    } else {
      const next = createRussianPlan(selectedFloor?.name || "Офис");
      setPlan(next);
      setMarkers([]);
      setPlanFloorId(next.floors?.[0]?.id ?? null);
    }
    loadedFloorRef.current = selectedFloorId;
  }, [selectedFloorId, selectedFloor?.planData, selectedFloor?.name]);

  const persistLocal = useCallback(
    (nextPlan: FloorPlan, nextMarkers: Marker[]) => {
      if (!selectedFloorId) return;
      const payload = JSON.stringify({ plan: nextPlan, markers: nextMarkers });
      localStorage.setItem(storageKey(selectedFloorId), payload);
    },
    [selectedFloorId],
  );

  const handlePlanChange = useCallback(
    (next: FloorPlan) => {
      setPlan(next);
      persistLocal(next, markers);
    },
    [markers, persistLocal],
  );

  const funSave = async () => {
    if (!selectedFloorId) return;
    setSaving(true);
    setSaveMsg(null);
    const currentPlan = localizePlan(
      editorRef.current?.getPlan?.() || plan,
    );
    const payload = JSON.stringify({ plan: currentPlan, markers });
    localStorage.setItem(storageKey(selectedFloorId), payload);

    try {
      await apiUpdateFloor(
        {
          name: selectedFloor?.name,
          number: selectedFloor?.number,
          planData: payload,
        },
        selectedFloorId,
      );

      const previewBlob = buildPlanPreviewBlob(payload);
      if (previewBlob) {
        const formData = new FormData();
        formData.append("image", previewBlob, "plan-preview.svg");
        await apiUpdateFloorImage(formData, selectedFloorId);
      }

      setPlan(currentPlan);
      setSaveMsg("Карта сохранена");
      queryClient.invalidateQueries({
        queryKey: ["floors/all/id", user?.companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["offices/all/id", user?.companyId],
      });
      refetchFloors();
      refetchOffices();
    } catch (e) {
      console.error(e);
      setSaveMsg("Сохранено локально (сервер недоступен)");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3200);
    }
  };

  const canvasStyle = useMemo(
    () => ({ width: "100%", height: "100%" }) as const,
    [],
  );

  const sharedViewerProps = {
    plan,
    markers,
    showFurniture: true,
    showGrid: true,
    showFloorSwitcher: false as const,
    theme: "mist" as const,
    formatLength: formatLengthRu,
    style: canvasStyle,
  };

  return (
    <div
      ref={workspaceRef}
      className="relative h-screen w-screen overflow-hidden bg-bg"
    >
      <div
        ref={canvasHostRef}
        className="absolute inset-x-0 bottom-10 top-16 z-[1] bg-bg"
      >
        {viewMode === "edit" && !noedit && (
          <>
            <FloorplanEditor
              ref={editorRef}
              plan={plan}
              onChange={handlePlanChange}
              onFloorChange={setPlanFloorId}
              theme="mist"
              catalog={furnitureCatalogRu}
              formatLength={formatLengthRu}
              showGrid
              showDimensions
              style={canvasStyle}
            />
            <MarqueeSelectOverlay
              enabled
              plan={plan}
              floorId={planFloorId}
              editorRootRef={canvasHostRef}
              onPlanChange={handlePlanChange}
            />
          </>
        )}

        {(viewMode === "2d" || (noedit && viewMode !== "3d")) && (
          <FloorplanViewer
            {...sharedViewerProps}
            markersDraggable={!noedit}
            onPlanClick={({ x, y, room, floor }) => {
              if (noedit) return;
              setMarkers((ms) => {
                const next = [
                  ...ms,
                  {
                    id: crypto.randomUUID(),
                    x,
                    y,
                    floor: floor.id,
                    icon: "●",
                    label: room?.name || `Место ${ms.length + 1}`,
                  } as Marker,
                ];
                persistLocal(plan, next);
                return next;
              });
            }}
            onMarkerMove={({ marker, x, y, floor }) => {
              setMarkers((ms) => {
                const next = ms.map((m) =>
                  m.id === marker.id ? { ...m, x, y, floor: floor.id } : m,
                );
                persistLocal(plan, next);
                return next;
              });
            }}
            onMarkerClick={(marker) => {
              if (noedit || viewMode !== "2d") return;
              if (
                window.confirm(
                  `Удалить маркер «${marker.label || marker.id}»?`,
                )
              ) {
                setMarkers((ms) => {
                  const next = ms.filter((m) => m.id !== marker.id);
                  persistLocal(plan, next);
                  return next;
                });
              }
            }}
            renderMarker={(marker, { selected }) => (
              <div
                className="flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-0.5"
                title={marker.label}
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 rounded-full border-2 border-white bg-tag-green shadow-soft",
                    selected && "bg-ink shadow-[0_0_0_3px_rgba(17,17,17,0.12)]",
                  )}
                />
                {marker.label && (
                  <span className="max-w-[120px] truncate rounded-md bg-ink/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {marker.label}
                  </span>
                )}
              </div>
            )}
          />
        )}

        {viewMode === "3d" && (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-[13px] font-semibold tracking-[-0.01em] text-fg-secondary">
                Загрузка 3D…
              </div>
            }
          >
            <FloorplanViewer3D
              plan={plan}
              markers={markers}
              mode="floor"
              theme="mist"
              formatLength={formatLengthRu}
              style={canvasStyle}
              renderMarker={(marker) => (
                <div
                  className="-translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm bg-tag-green px-2 py-0.5 text-[11px] font-bold text-white shadow-soft"
                  title={marker.label}
                >
                  {marker.label || "•"}
                </div>
              )}
            />
          </Suspense>
        )}
      </div>

      {saveMsg && (
        <div className="fixed left-1/2 top-[88px] z-[120] -translate-x-1/2 rounded-sm bg-ink px-4 py-2.5 text-[13px] font-semibold text-white shadow-card">
          {saveMsg}
        </div>
      )}

      <TopMenu
        floors={floors}
        offices={offices}
        funSave={funSave}
        funDownload={() => {
          const json = JSON.stringify({ plan, markers }, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${selectedFloor?.name || "plan-etazha"}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        noedit={noedit}
        modeToggle={
          <ModeToggle
            mode={viewMode}
            modes={
              noedit
                ? [
                    { id: "2d", label: "2D" },
                    { id: "3d", label: "3D" },
                  ]
                : [
                    { id: "edit", label: "Редактор" },
                    { id: "2d", label: "2D" },
                    { id: "3d", label: "3D" },
                  ]
            }
            onChange={(mode) => setViewMode(mode as ViewMode)}
          />
        }
      />

      {!noedit && (
        <div className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-between gap-3 border-t border-line bg-white px-5 py-2.5 text-xs font-medium tracking-[-0.01em] text-fg-secondary">
          <span>
            {viewMode === "edit"
              ? "Стены, комнаты и мебель. ⌘/Ctrl + протянуть — выбрать несколько · Delete — удалить. Пакет «Офис» — O."
              : viewMode === "2d"
                ? "Клик по карте — маркер рабочего места. Клик по маркеру — удалить."
                : "Вращайте сцену мышью. Та же карта, что в редакторе."}
          </span>
          {saving && (
            <span className="font-semibold text-fg">Сохранение…</span>
          )}
        </div>
      )}
    </div>
  );
}

export default FloorplanWorkspace;
