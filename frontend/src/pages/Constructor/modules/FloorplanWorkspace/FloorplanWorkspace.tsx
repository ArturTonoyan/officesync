import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
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
  apiGetEquipments,
  apiGetFloors,
  apiGetOffices,
  apiLayoutOllamaStatus,
  apiLayoutParseEdit,
  apiUpdateFloor,
  apiUpdateFloorImage,
} from "../../../../api/apirequests";
import { useSearchParams } from "react-router-dom";
import TopMenu from "../TopMenu/TopMenu";
import ModeToggle, {
  type ViewMode,
} from "../../components/ModeToggle/ModeToggle";
import MarqueeSelectOverlay from "../../components/MarqueeSelectOverlay/MarqueeSelectOverlay";
import ContextualChat, {
  type ChatEditScope,
  type ChatTarget,
} from "../../components/ContextualChat/ContextualChat";
import ChatDockButton from "../../components/ContextualChat/ChatDockButton";
import CatalogSearch from "../../components/CatalogSearch/CatalogSearch";
import "../../components/ContextualChat/chatCursor.css";
import {
  AutoPlanDrawer,
  type AutoPlanTab,
} from "../../components/AutoPlan";
import WorkplaceKitPanel from "../../components/WorkplaceKit/WorkplaceKitPanel";
import StructuralTemplateModal from "../../components/StructuralTemplate/StructuralTemplateModal";
import {
  copyWorkplaceKit,
  findFurniture,
  isDeskKind,
  occupiedEquipmentIds,
  parseWorkplaceKits,
  resyncKitsAfterPlanChange,
  syncKitFurniture,
  type WorkplaceKit,
} from "../../floorplan/workplaceKit";
import {
  applyStructuralTemplate,
  type StructuralTemplate,
} from "../../floorplan/structuralTemplate";
import {
  EvacuationMapModal,
  bindEvacTextureToFurnitureIds,
  ensureEvacTexturesForFloor,
  listEvacFurnitureIds,
  placeEvacuationPosterAt,
} from "../../components/EvacuationMap";
import {
  SafetyGearDrawer,
  isSafetyInteractKind,
} from "../../components/SafetyGear";
import {
  applyEditActions,
  selectionLabels,
  type EditAction,
} from "../../components/AutoPlan/layout/applyEditActions";
import { FURNISH_CATALOG } from "../../components/AutoPlan/layout/roomKits";
import {
  pointInPolygon,
  polygonAreaCm2,
} from "../../components/AutoPlan/layout/geometry";
import {
  clientToPlan,
  hitTestMarquee,
  type SelectedItem,
} from "../../floorplan/marqueeSelect";
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
import { MarkerBadge } from "../../floorplan/markerLabel";
import { pickPlanObject } from "../../floorplan/pickPlanObject";
import {
  people3D,
  planWithPeopleMarkers,
} from "../../floorplan/people3d";
import { evacMap3D } from "../../floorplan/evacMap3d";
import { safetyGear3D } from "../../floorplan/safetyGear3d";
import { projector3D } from "../../floorplan/projector3d";
import { fridge3D } from "../../floorplan/fridge3d";
import { deskEmpty3D } from "../../floorplan/deskEmpty3d";
import { deskGear3D } from "../../floorplan/deskGear3d";
import { runWithoutCameraFit } from "../../floorplan/editorView";
import { syncOpeningsOnOverlappingWalls } from "../../floorplan/openingsSync";
import ObjectInfoPopup, {
  type ObjectInfo,
} from "../../components/ObjectInfoPopup/ObjectInfoPopup";
import DisplayLayersMenu, {
  DEFAULT_DISPLAY_LAYERS,
  type DisplayLayers,
} from "../../components/DisplayLayersMenu/DisplayLayersMenu";
import WalkModeButton from "../../components/WalkMode/WalkModeButton";
import WalkClickOverlay from "../../components/WalkMode/WalkClickOverlay";
import { planPointFromScreen } from "../../floorplan/walkMode";
import { cn } from "@utils/cn";

registerPack(officePackRu);

/** Регистрируем 3D-паки сразу (и при HMR) — lazy() сам по себе не перезапускается. */
async function registerAll3dPacks(
  registerPack3D: (pack: typeof people3D) => void,
) {
  const { office3D } = await import("@jbaysolutions/floorplan-pack-office/3d");
  registerPack3D(office3D);
  registerPack3D(people3D);
  registerPack3D(evacMap3D);
  registerPack3D(projector3D);
  registerPack3D(fridge3D);
  registerPack3D(deskEmpty3D);
  registerPack3D(deskGear3D);
  registerPack3D(safetyGear3D);
}

void import("@jbaysolutions/floorplan-react/3d").then((m) =>
  registerAll3dPacks(m.registerPack3D),
);

const FloorplanViewer3D = lazy(() =>
  import("@jbaysolutions/floorplan-react/3d").then(async (m) => {
    await registerAll3dPacks(m.registerPack3D);
    return { default: m.FloorplanViewer3D };
  }),
);

type Viewer3DErrorProps = {
  onBack2d: () => void;
  children: ReactNode;
};

type Viewer3DErrorState = { error: Error | null };

/** Ловит 504 Outdated Optimize Dep / сбой lazy 3D, не роняя весь редактор */
class Viewer3DErrorBoundary extends Component<
  Viewer3DErrorProps,
  Viewer3DErrorState
> {
  state: Viewer3DErrorState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Floorplan 3D failed to load", error, info);
  }

  componentDidUpdate(prev: Viewer3DErrorProps) {
    if (prev.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-[13px] font-semibold tracking-[-0.01em] text-fg">
            3D временно недоступен
          </p>
          <p className="max-w-sm text-[12px] text-fg-secondary">
            Обновите страницу (кэш Vite устарел) или вернитесь в 2D.
          </p>
          <button
            type="button"
            className="cursor-pointer rounded-sm bg-ink px-3 py-2 text-[12px] font-semibold text-white"
            onClick={this.props.onBack2d}
          >
            Открыть 2D
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type StoredMap = {
  plan: FloorPlan;
  markers: Marker[];
  workplaceKits: WorkplaceKit[];
};

const storageKey = (floorId: string) => `officesync-floorplan:${floorId}`;

function parseStored(raw: string | null | undefined): StoredMap | null {
  if (!raw) return null;
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!data?.plan) return null;
    return {
      plan: syncOpeningsOnOverlappingWalls(
        localizePlan(normalizePlan(data.plan)),
      ),
      markers: Array.isArray(data.markers) ? data.markers : [],
      workplaceKits: parseWorkplaceKits(data.workplaceKits),
    };
  } catch {
    return null;
  }
}

function serializeStored(
  plan: FloorPlan,
  markers: Marker[],
  workplaceKits: WorkplaceKit[],
) {
  return JSON.stringify({ plan, markers, workplaceKits });
}

/** Насколько «полный» сохранённый план (стены/комнаты/мебель). */
function planRichness(stored: StoredMap | null): number {
  if (!stored?.plan?.floors?.length) return 0;
  let score = 0;
  for (const floor of stored.plan.floors) {
    score += (floor.walls?.length || 0) * 4;
    score += (floor.rooms?.length || 0) * 3;
    score += (floor.furniture?.length || 0);
    score += (floor.openings?.length || 0) * 2;
  }
  score += stored.markers?.length || 0;
  score += stored.workplaceKits?.length || 0;
  return score;
}

/** Берём более наполненный вариант между API и localStorage. */
function pickStored(
  fromApi: StoredMap | null,
  fromLocal: StoredMap | null,
): StoredMap | null {
  const apiScore = planRichness(fromApi);
  const localScore = planRichness(fromLocal);
  if (apiScore === 0 && localScore === 0) return fromApi || fromLocal;
  return apiScore >= localScore ? fromApi : fromLocal;
}

function isApiOk(res: unknown): boolean {
  if (!res || typeof res !== "object") return false;
  const r = res as {
    status?: number;
    data?: unknown;
    isAxiosError?: boolean;
    response?: { status?: number };
  };
  if (r.isAxiosError) return false;
  if (typeof r.status === "number") return r.status >= 200 && r.status < 300;
  if (r.response?.status && r.response.status >= 400) return false;
  return r.data != null;
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
  const [workplaceKits, setWorkplaceKits] = useState<WorkplaceKit[]>([]);
  const [kitDeskId, setKitDeskId] = useState<string | null>(null);
  const [kitCopyWarning, setKitCopyWarning] = useState<string | null>(null);
  const [planFloorId, setPlanFloorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const loadedFloorRef = useRef<string | null>(null);
  /** Какой planData уже применён — чтобы подхватить данные, пришедшие после первого mount. */
  const loadedPlanDataRef = useRef<string | null | undefined>(undefined);
  /** Не писать в localStorage пустой план до завершения гидрации этажа. */
  const planReadyRef = useRef(false);
  const [autoPlanOpen, setAutoPlanOpen] = useState(false);
  const [autoPlanTab, setAutoPlanTab] = useState<AutoPlanTab>("params");
  const [structuralTplOpen, setStructuralTplOpen] = useState(false);
  const [evacOpen, setEvacOpen] = useState(false);
  const [evacWallPick, setEvacWallPick] = useState(false);
  /** Пересборка 3D после запекания текстуры плана эвакуации */
  const [evacTexRev, setEvacTexRev] = useState(0);
  /** Режим безопасности: панель справа + только safety-объекты на карте */
  const [safetyMode, setSafetyMode] = useState(false);
  const [safetyPanelOpen, setSafetyPanelOpen] = useState(false);
  const [safetySelectTick, setSafetySelectTick] = useState(0);
  const [safetySelectItems, setSafetySelectItems] = useState<SelectedItem[]>(
    [],
  );
  const [roomPickRowId, setRoomPickRowId] = useState<string | null>(null);
  const [pickedRoom, setPickedRoom] = useState<{
    rowId: string;
    roomId: string;
    roomName: string;
  } | null>(null);
  const [chatToolActive, setChatToolActive] = useState(false);
  const [marqueeSelection, setMarqueeSelection] = useState<SelectedItem[]>([]);
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const [chatApplying, setChatApplying] = useState(false);
  const [chatReply, setChatReply] = useState<string | null>(null);
  const [chatUndo, setChatUndo] = useState<{
    plan: FloorPlan;
    markers: Marker[];
  } | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatApplyingRef = useRef(false);
  const [objectInfo, setObjectInfo] = useState<ObjectInfo | null>(null);
  const [walkActive, setWalkActive] = useState(false);
  const [displayLayers, setDisplayLayers] = useState<DisplayLayers>(
    DEFAULT_DISPLAY_LAYERS,
  );
  useEffect(() => {
    chatApplyingRef.current = chatApplying;
  }, [chatApplying]);
  const deactivateChat = useCallback((opts?: { force?: boolean }) => {
    // Пока запрос выполняется — не закрываем попап от случайного клика по тулбару
    if (chatApplyingRef.current && !opts?.force) return;
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    setChatToolActive(false);
    setChatTarget(null);
    setChatReply(null);
    setChatApplying(false);
  }, []);
  useEffect(() => {
    if (viewMode === "edit") return;
    deactivateChat({ force: true });
  }, [viewMode, deactivateChat]);
  useEffect(() => {
    setObjectInfo(null);
  }, [viewMode]);
  useEffect(() => {
    if (viewMode !== "3d" && walkActive) setWalkActive(false);
  }, [viewMode, walkActive]);

  const inspectAtScreen = useCallback(
    (clientX: number, clientY: number, xCm?: number, yCm?: number) => {
      const pt =
        xCm != null && yCm != null
          ? { xCm, yCm }
          : planPointFromScreen(clientX, clientY);
      if (!pt) {
        setObjectInfo({
          title: "Сцена",
          subtitle: walkActive ? "Прогулка" : "3D",
          rows: walkActive
            ? [{ label: "Подсказка", value: "ПКМ — переместиться сюда" }]
            : [{ label: "Клик", value: "Нет объекта под курсором" }],
          screenX: clientX,
          screenY: clientY,
        });
        return;
      }
      const info = pickPlanObject(
        plan,
        planFloorId,
        pt.xCm,
        pt.yCm,
        clientX,
        clientY,
      );
      setObjectInfo(
        info || {
          title: "Пол / пространство",
          subtitle: walkActive ? "Прогулка" : "3D",
          rows: [
            {
              label: "Позиция",
              value: `${(pt.xCm / 100).toFixed(2)}, ${(pt.yCm / 100).toFixed(2)} м`,
            },
            ...(walkActive
              ? [{ label: "Подсказка", value: "ПКМ — переместиться" }]
              : []),
          ],
          screenX: clientX,
          screenY: clientY,
        },
      );
    },
    [plan, planFloorId, walkActive],
  );
  const ollamaStatusQuery = useQuery({
    queryKey: ["layout-ollama-status"],
    queryFn: apiLayoutOllamaStatus,
    enabled: !noedit,
    staleTime: 30_000,
    retry: 0,
  });
  const ollamaAvailable = Boolean(ollamaStatusQuery.data?.available);

  const exitSafetyMode = useCallback(() => {
    setSafetyMode(false);
    setSafetyPanelOpen(false);
    setSafetySelectItems([]);
    setSafetySelectTick(0);
  }, []);

  const enterSafetyMode = useCallback(() => {
    setEvacWallPick(false);
    setRoomPickRowId(null);
    setAutoPlanOpen(false);
    setChatToolActive(false);
    setViewMode("edit");
    setSafetyMode(true);
    setSafetyPanelOpen(true);

    const live = editorRef.current?.getPlan?.() || plan;
    const floor =
      live.floors.find((f) => f.id === planFloorId) || live.floors[0];
    const items: SelectedItem[] = (floor?.furniture || [])
      .filter((f) => isSafetyInteractKind(String(f.kind)))
      .map((f) => ({ kind: "furniture" as const, id: f.id }));
    setSafetySelectItems(items);
    setSafetySelectTick((n) => n + 1);
  }, [plan, planFloorId]);

  // Пометить SVG-мебель data-os-safety для CSS pointer-events
  useEffect(() => {
    const root = canvasHostRef.current;
    if (!root) return;
    if (!safetyMode) {
      root
        .querySelectorAll(".fp-furniture[data-os-safety]")
        .forEach((el) => el.removeAttribute("data-os-safety"));
      return;
    }

    const tag = () => {
      const floor =
        plan.floors.find((f) => f.id === planFloorId) || plan.floors[0];
      const allow = new Set(
        (floor?.furniture || [])
          .filter((f) => isSafetyInteractKind(String(f.kind)))
          .map((f) => f.id),
      );
      root.querySelectorAll<SVGGElement>(".fp-furniture[data-fp-id]").forEach((el) => {
        const id = el.getAttribute("data-fp-id") || "";
        if (allow.has(id)) el.setAttribute("data-os-safety", "1");
        else el.removeAttribute("data-os-safety");
      });
    };

    tag();
    const host = root.querySelector(".fp-canvas-host");
    if (!host) return;
    const obs = new MutationObserver(() => {
      window.requestAnimationFrame(tag);
    });
    obs.observe(host, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [safetyMode, plan, planFloorId]);

  // Блокировать клики мимо safety-мебели (на случай если CSS не покрыл hit-area)
  useEffect(() => {
    if (!safetyMode || viewMode !== "edit") return;
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const root = canvasHostRef.current;
      if (!root) return;
      const canvas = root.querySelector(".fp-canvas-host");
      if (!canvas || !(canvas instanceof HTMLElement)) return;
      if (!canvas.contains(e.target as Node)) return;

      // ⌘-рамка выделения — пускаем (фильтр в MarqueeSelect)
      if (e.metaKey || e.ctrlKey) return;

      const t = e.target as Element | null;
      if (t?.closest?.(".fp-furniture[data-os-safety='1']")) return;

      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [safetyMode, viewMode]);

  const openAutoPlan = (tab: AutoPlanTab) => {
    setAutoPlanTab(tab === "edit" ? "params" : tab);
    setAutoPlanOpen(true);
    setRoomPickRowId(null);
  };

  const openChatForScope = useCallback(
    (scope: ChatEditScope, screenX: number, screenY: number) => {
      // Не переключаем scope / не сбрасываем ответ, пока чат применяет правку
      if (chatApplyingRef.current) return;
      setChatTarget({ scope, screenX, screenY });
      setChatReply(null);
    },
    [],
  );

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
    queryKey: ["floors/all/id", user?.companyId],
    queryFn: () => apiGetFloors(user?.companyId),
    staleTime: Infinity,
    enabled: !!user?.companyId,
  });

  const selectedFloorId = conva.floors.selected;
  const selectedOfficeId = conva.offices.selected as string | null;
  const selectedFloor = conva.floors.selectedObject as {
    id?: string;
    name?: string;
    number?: number;
    planData?: string | null;
    officeId?: string;
  } | null;
  const selectedFloorPlanData = selectedFloor?.planData ?? null;

  const officeFloorsForTemplate = useMemo(() => {
    const list = (floors?.data || []) as Array<{
      id: string;
      name?: string;
      number?: number | null;
      officeId?: string;
      planData?: string | null;
    }>;
    const officeId = selectedOfficeId || selectedFloor?.officeId || null;
    return list
      .filter((f) => !officeId || f.officeId === officeId)
      .map((f) => ({
        id: f.id,
        name: f.name || (f.number != null ? `${f.number} этаж` : "Этаж"),
        number: f.number,
        planData: f.planData ?? null,
      }));
  }, [floors?.data, selectedOfficeId, selectedFloor?.officeId]);

  useEffect(() => {
    if (!offices?.data?.length) return;

    const officeFromUrl = searchParams.get("office");
    const floorFromUrl = searchParams.get("floor");
    const floorsList = floors?.data as
      | Array<{ id: string; planData?: string | null }>
      | undefined;

    if (officeFromUrl) {
      const officeExists = offices.data.some((o) => o.id === officeFromUrl);
      if (officeExists && conva.offices.selected !== officeFromUrl) {
        dispatch(
          setSelectedOffice({ id: officeFromUrl, offices: offices.data }),
        );
      }
      if (floorFromUrl && floorsList?.length) {
        const nextFloor = floorsList.find((f) => f.id === floorFromUrl);
        if (nextFloor) {
          // Всегда обновляем selectedObject с актуальным planData из /floors
          if (
            conva.floors.selected !== floorFromUrl ||
            selectedFloorPlanData !== nextFloor.planData
          ) {
            dispatch(
              setSelectedFloor({ id: floorFromUrl, floors: floorsList }),
            );
          }
        }
      }
      return;
    }

    if (conva.offices.selected) {
      // Офис уже выбран — но подтянем planData этажа, когда floors догрузились
      if (conva.floors.selected && floorsList?.length) {
        const nextFloor = floorsList.find(
          (f) => f.id === conva.floors.selected,
        );
        if (nextFloor && selectedFloorPlanData !== nextFloor.planData) {
          dispatch(
            setSelectedFloor({
              id: conva.floors.selected,
              floors: floorsList,
            }),
          );
        }
      }
      return;
    }

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

    if (preferredFloor && floorsList?.length) {
      dispatch(
        setSelectedFloor({ id: preferredFloor.id, floors: floorsList }),
      );
    }
  }, [
    offices?.data,
    floors?.data,
    user?.officeId,
    user?.floorId,
    conva.offices.selected,
    conva.floors.selected,
    selectedFloorPlanData,
    searchParams,
    dispatch,
  ]);

  const floorsList = (floors?.data ?? null) as
    | Array<{ id: string; name?: string; planData?: string | null }>
    | null;
  const floorFromQuery = selectedFloorId
    ? floorsList?.find((f) => f.id === selectedFloorId)
    : undefined;
  // Берём более полный JSON (после Save Redux уже новый, а query ещё старый)
  const planDataSource = (() => {
    const a = floorFromQuery?.planData ?? null;
    const b = selectedFloor?.planData ?? null;
    if (!a) return b;
    if (!b) return a;
    return a.length >= b.length ? a : b;
  })();
  const floorDisplayName =
    floorFromQuery?.name || selectedFloor?.name || "Офис";

  // До гидрации нового этажа не даём onChange редактора писать чужой/пустой план
  useLayoutEffect(() => {
    planReadyRef.current = false;
  }, [selectedFloorId]);

  useEffect(() => {
    if (!selectedFloorId) return;
    // Ждём ответ /floors, иначе гидратим пустым планом и блокируем повторную загрузку
    if (user?.companyId && floors === undefined) return;

    if (
      loadedFloorRef.current === selectedFloorId &&
      loadedPlanDataRef.current === planDataSource
    ) {
      planReadyRef.current = true;
      return;
    }

    const fromApi = parseStored(planDataSource);
    const fromLocal = parseStored(
      localStorage.getItem(storageKey(selectedFloorId)),
    );
    const stored = pickStored(fromApi, fromLocal);

    if (stored) {
      setPlan(stored.plan);
      setMarkers(stored.markers);
      setWorkplaceKits(stored.workplaceKits);
      setKitDeskId(null);
      setKitCopyWarning(null);
      setPlanFloorId(stored.plan.floors?.[0]?.id ?? null);
      // Синхронизируем localStorage с лучшим источником (не затираем богатый план пустым)
      if (planRichness(stored) > 0) {
        localStorage.setItem(
          storageKey(selectedFloorId),
          serializeStored(
            stored.plan,
            stored.markers,
            stored.workplaceKits,
          ),
        );
      }
    } else {
      const next = createRussianPlan(floorDisplayName);
      setPlan(next);
      setMarkers([]);
      setWorkplaceKits([]);
      setKitDeskId(null);
      setPlanFloorId(next.floors?.[0]?.id ?? null);
    }

    loadedFloorRef.current = selectedFloorId;
    loadedPlanDataRef.current = planDataSource;
    planReadyRef.current = true;
    setChatUndo(null);
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    setChatApplying(false);

    // Восстановить текстуры планов эвакуации для 3D-постеров
    const allFurn = (stored?.plan?.floors || []).flatMap(
      (f) => f.furniture || [],
    );
    const furnitureIds = listEvacFurnitureIds(allFurn);
    const posterItems = allFurn
      .filter((f) => furnitureIds.includes(f.id))
      .map((f) => ({
        id: f.id,
        x: f.x,
        y: f.y,
        rotation: f.rotation || 0,
      }));
    void ensureEvacTexturesForFloor(
      selectedFloorId,
      furnitureIds,
      posterItems,
    ).then((ok) => {
      if (ok) setEvacTexRev((n) => n + 1);
    });
  }, [
    selectedFloorId,
    planDataSource,
    floorDisplayName,
    floors,
    user?.companyId,
  ]);

  // Перед показом 3D — дозапечь SVG→PNG на каждый постер (своя «вы здесь»)
  useEffect(() => {
    if (viewMode !== "3d") return;
    const floor =
      plan.floors.find((f) => f.id === planFloorId) || plan.floors[0];
    const furn = floor?.furniture || [];
    const ids = listEvacFurnitureIds(furn);
    const posterItems = furn
      .filter((f) => ids.includes(f.id))
      .map((f) => ({
        id: f.id,
        x: f.x,
        y: f.y,
        rotation: f.rotation || 0,
      }));
    void ensureEvacTexturesForFloor(selectedFloorId, ids, posterItems).then(
      (ok) => {
        if (ok) setEvacTexRev((n) => n + 1);
      },
    );
  }, [viewMode, selectedFloorId, planFloorId, plan]);

  const persistLocal = useCallback(
    (
      nextPlan: FloorPlan,
      nextMarkers: Marker[],
      nextKits: WorkplaceKit[] = workplaceKits,
    ) => {
      if (!selectedFloorId || !planReadyRef.current) return;
      if (loadedFloorRef.current !== selectedFloorId) return;
      const payload = serializeStored(nextPlan, nextMarkers, nextKits);
      localStorage.setItem(storageKey(selectedFloorId), payload);
    },
    [selectedFloorId, workplaceKits],
  );

  const { data: equipmentsRes } = useQuery({
    queryKey: ["constructor/equipments", user?.companyId],
    queryFn: () => apiGetEquipments(user?.companyId),
    enabled: !!user?.companyId && !noedit,
    staleTime: 30_000,
  });

  const floorEquipments = useMemo(() => {
    const all = (equipmentsRes?.data || []) as {
      id: string;
      name?: string;
      type?: string;
      inventoryNumber?: string;
      floorId?: string;
    }[];
    if (!selectedFloorId) return all;
    const onFloor = all.filter((e) => e.floorId === selectedFloorId);
    return onFloor.length > 0 ? onFloor : all;
  }, [equipmentsRes, selectedFloorId]);

  const applyKits = useCallback(
    (nextKits: WorkplaceKit[], basePlan?: FloorPlan) => {
      const live = basePlan || editorRef.current?.getPlan?.() || plan;
      const synced = syncKitFurniture(live, planFloorId, nextKits);
      runWithoutCameraFit(canvasHostRef.current, () => {
        setWorkplaceKits(nextKits);
        setPlan(synced);
        persistLocal(synced, markers, nextKits);
      });
    },
    [plan, planFloorId, markers, persistLocal],
  );

  const handleCopyWorkplace = useCallback(() => {
    if (!kitDeskId) return;
    const live = editorRef.current?.getPlan?.() || plan;
    const result = copyWorkplaceKit(
      live,
      planFloorId,
      workplaceKits,
      kitDeskId,
      floorEquipments,
    );
    if (!result) return;
    runWithoutCameraFit(canvasHostRef.current, () => {
      setPlan(result.plan);
      setWorkplaceKits(result.kits);
      setKitDeskId(result.newDeskId);
      persistLocal(result.plan, markers, result.kits);
    });
    if (result.missingEquipment > 0) {
      setKitCopyWarning(
        `Скопирована раскладка, не хватило ${result.missingEquipment} ед. оборудования в БД — слоты без инвентаря`,
      );
    } else {
      setKitCopyWarning(null);
    }
  }, [
    kitDeskId,
    plan,
    planFloorId,
    workplaceKits,
    floorEquipments,
    markers,
    persistLocal,
  ]);

  const handleChatStop = useCallback(() => {
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    setChatApplying(false);
    setChatReply("Остановлено");
  }, []);

  const handleChatUndo = useCallback(() => {
    if (!chatUndo) return;
    setPlan(chatUndo.plan);
    setMarkers(chatUndo.markers);
    persistLocal(chatUndo.plan, chatUndo.markers, workplaceKits);
    setChatUndo(null);
    setChatReply("Правка чата отменена");
  }, [chatUndo, persistLocal, workplaceKits]);

  const handleChatSubmit = useCallback(
    async (text: string, scope: ChatEditScope) => {
      chatAbortRef.current?.abort();
      const ac = new AbortController();
      chatAbortRef.current = ac;

      setChatApplying(true);
      setChatReply(null);
      try {
        const live = editorRef.current?.getPlan?.() || plan;
        const snapshotPlan = JSON.parse(JSON.stringify(live)) as FloorPlan;
        const snapshotMarkers = JSON.parse(
          JSON.stringify(markers),
        ) as Marker[];
        const floor =
          live.floors.find((f) => f.id === planFloorId) || live.floors[0];
        let areaM2: number | undefined;
        let existingFurniture:
          | {
              id: string;
              kind: string;
              label?: string;
              x?: number;
              y?: number;
              rotation?: number;
            }[]
          | undefined;

        if (scope.type === "room" && floor) {
          const room = floor.rooms?.find((r) => r.id === scope.roomId);
          if (room?.points?.length) {
            areaM2 = polygonAreaCm2(room.points) / 10_000;
            existingFurniture = (floor.furniture || [])
              .filter((f) => pointInPolygon(f.x, f.y, room.points || []))
              .map((f) => ({
                id: f.id,
                kind: String(f.kind),
                label: String(f.kind).replace(/^office\//, ""),
                x: f.x,
                y: f.y,
                rotation: f.rotation || 0,
              }));
          }
        } else if (scope.type === "selection" && floor) {
          const ids = new Set(
            scope.items
              .filter((i) => i.kind === "furniture")
              .map((i) => i.id),
          );
          existingFurniture = (floor.furniture || [])
            .filter((f) => ids.has(f.id))
            .map((f) => ({
              id: f.id,
              kind: String(f.kind),
              label: String(f.kind).replace(/^office\//, ""),
              x: f.x,
              y: f.y,
              rotation: f.rotation || 0,
            }));
        }

        const parsed = await apiLayoutParseEdit(
          {
            text,
            scope:
              scope.type === "room"
                ? {
                    type: "room",
                    roomId: scope.roomId,
                    roomName: scope.roomName,
                  }
                : scope.type === "selection"
                  ? {
                      type: "selection",
                      items: scope.items.map((i, idx) => ({
                        kind: i.kind,
                        id: i.id,
                        label: scope.labels[idx],
                      })),
                    }
                  : { type: "global" },
            catalogKinds: FURNISH_CATALOG.map((c) => c.kind),
            catalog: FURNISH_CATALOG.map((c) => ({
              kind: c.kind,
              label: c.label,
            })),
            existingFurniture,
            areaM2,
          },
          ac.signal,
        );

        if (ac.signal.aborted) {
          setChatReply("Остановлено");
          return;
        }

        const actions = (parsed.actions || []) as EditAction[];
        const onlyUnsupported =
          actions.length > 0 &&
          actions.every((a) => a.type === "unsupported");
        if (onlyUnsupported) {
          setChatReply(
            actions
              .map((a) =>
                a.type === "unsupported"
                  ? a.reason || "Уточните запрос"
                  : "",
              )
              .filter(Boolean)
              .join(" · ") ||
              parsed.reply ||
              "Уточните запрос",
          );
          return;
        }

        const applied = applyEditActions(live, planFloorId, scope, actions);
        if (ac.signal.aborted) {
          setChatReply("Остановлено");
          return;
        }
        setChatUndo({ plan: snapshotPlan, markers: snapshotMarkers });
        setPlan(applied.plan);
        persistLocal(applied.plan, markers);
        setChatReply(
          [parsed.reply, ...applied.messages].filter(Boolean).join(" · "),
        );
      } catch (err) {
        const aborted =
          ac.signal.aborted ||
          (err instanceof Error &&
            (err.name === "AbortError" ||
              err.name === "CanceledError" ||
              /остановл|aborted|canceled|cancelled/i.test(err.message)));
        setChatReply(
          aborted
            ? "Остановлено"
            : err instanceof Error
              ? err.message
              : "Ошибка правки через Ollama",
        );
      } finally {
        if (chatAbortRef.current === ac) {
          chatAbortRef.current = null;
        }
        setChatApplying(false);
      }
    },
    [plan, planFloorId, markers, persistLocal],
  );

  const handlePlanChange = useCallback(
    (next: FloorPlan) => {
      const openingsSynced = syncOpeningsOnOverlappingWalls(next);
      const { plan: synced, kits, mutatedFurniture } = resyncKitsAfterPlanChange(
        openingsSynced,
        planFloorId,
        workplaceKits,
        plan,
      );
      // Drag/resize/delete слотов: kits обновляем, plan обратно не пушим —
      // внешний setPlan в библиотеке сбрасывает камеру через fit().
      if (mutatedFurniture) {
        runWithoutCameraFit(canvasHostRef.current, () => {
          setPlan(synced);
          setWorkplaceKits(kits);
          persistLocal(synced, markers, kits);
        });
        return;
      }
      const openingsChanged =
        JSON.stringify(openingsSynced) !== JSON.stringify(next);
      if (openingsChanged) {
        runWithoutCameraFit(canvasHostRef.current, () => {
          setPlan(openingsSynced);
          setWorkplaceKits(kits);
          persistLocal(openingsSynced, markers, kits);
        });
        return;
      }
      // Редактор уже содержит next (= be) — не провоцируем fit лишним rewrite.
      setWorkplaceKits(kits);
      persistLocal(next, markers, kits);
      if (JSON.stringify(plan) !== JSON.stringify(next)) {
        setPlan(next);
      }
    },
    [markers, persistLocal, planFloorId, workplaceKits, plan],
  );

  const funSave = async () => {
    if (!selectedFloorId) return;
    setSaving(true);
    setSaveMsg(null);
    const currentPlan = syncOpeningsOnOverlappingWalls(
      localizePlan(editorRef.current?.getPlan?.() || plan),
    );
    const withKits = syncKitFurniture(
      currentPlan,
      planFloorId,
      workplaceKits,
    );
    const payload = serializeStored(withKits, markers, workplaceKits);
    localStorage.setItem(storageKey(selectedFloorId), payload);
    planReadyRef.current = true;
    loadedFloorRef.current = selectedFloorId;
    loadedPlanDataRef.current = payload;

    try {
      const updateRes = await apiUpdateFloor(
        {
          name: selectedFloor?.name || floorDisplayName,
          number: selectedFloor?.number,
          planData: payload,
        },
        selectedFloorId,
      );
      if (!isApiOk(updateRes)) {
        throw new Error(
          (updateRes as { response?: { data?: { message?: string } } })
            ?.response?.data?.message || "Сервер отклонил сохранение плана",
        );
      }

      const previewBlob = buildPlanPreviewBlob(payload);
      if (previewBlob) {
        const formData = new FormData();
        formData.append("image", previewBlob, "plan-preview.svg");
        const imageRes = await apiUpdateFloorImage(formData, selectedFloorId);
        if (!isApiOk(imageRes)) {
          console.warn("Превью этажа не обновлено", imageRes);
        }
      }

      setPlan(withKits);
      setSaveMsg("Карта сохранена");

      const withPayload = (list: Array<{ id: string; planData?: string | null }>) =>
        list.map((f) =>
          f.id === selectedFloorId ? { ...f, planData: payload } : f,
        );

      // Сразу обновляем кэш, чтобы refetch не откатил план к старой версии
      queryClient.setQueryData(
        ["floors/all/id", user?.companyId],
        (old: { data?: Array<{ id: string; planData?: string | null }> } | undefined) => {
          if (!old?.data) return old;
          return { ...old, data: withPayload(old.data) };
        },
      );

      if (floorsList?.length) {
        dispatch(
          setSelectedFloor({
            id: selectedFloorId,
            floors: withPayload(floorsList),
          }),
        );
      }

      queryClient.invalidateQueries({
        queryKey: ["floors/all/id", user?.companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["offices/all/id", user?.companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["offices", user?.companyId],
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

  const plan3d = useMemo(
    () =>
      planWithPeopleMarkers(
        syncOpeningsOnOverlappingWalls(plan),
        markers,
        {
          showPeople: displayLayers.showPeople,
        },
      ),
    [plan, markers, displayLayers.showPeople],
  );

  const sharedViewerProps = {
    plan,
    markers,
    showFurniture: true,
    showGrid: true,
    showFloorSwitcher: false as const,
    showRoomLabels: displayLayers.showRoomNames,
    showRoomArea: displayLayers.showRoomArea,
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
        className={cn(
          "absolute inset-x-0 bottom-10 top-16 z-[1] bg-bg",
          chatToolActive && viewMode === "edit" && "os-chat-cursor",
          safetyMode && viewMode === "edit" && "os-safety-mode",
        )}
        >
        <div className="relative h-full w-full">
        {viewMode === "edit" && !noedit && (
          <>
            <FloorplanEditor
              key={selectedFloorId || "no-floor"}
              ref={editorRef}
              plan={plan}
              onChange={handlePlanChange}
              onFloorChange={setPlanFloorId}
              onSelectionChange={(selection) => {
                if (evacWallPick) return;
                if (selection?.kind === "furniture") {
                  const live = editorRef.current?.getPlan?.() || plan;
                  const furn = findFurniture(
                    live,
                    planFloorId,
                    selection.id,
                  );
                  if (furn && isDeskKind(String(furn.kind))) {
                    setKitDeskId(selection.id);
                    setKitCopyWarning(null);
                  } else if (
                    furn &&
                    String(furn.id).startsWith("wpslot_")
                  ) {
                    // клик по слоту — открыть kit родительского стола
                    const parent = workplaceKits.find((k) =>
                      k.slots.some(
                        (s) =>
                          s.furnitureId === furn.id || s.id === selection.id,
                      ),
                    );
                    if (parent) {
                      setKitDeskId(parent.deskFurnitureId);
                      setKitCopyWarning(null);
                    }
                  } else {
                    setKitDeskId(null);
                  }
                } else if (!selection) {
                  // не сбрасываем kit при клике в пустоту — панель закрывается кнопкой
                }
                if (!roomPickRowId || !selection || selection.kind !== "room") {
                  return;
                }
                const live = editorRef.current?.getPlan?.() || plan;
                const floor =
                  live.floors.find((f) => f.id === planFloorId) ||
                  live.floors[0];
                const room = floor?.rooms?.find((r) => r.id === selection.id);
                const idx = floor?.rooms?.findIndex((r) => r.id === selection.id) ?? -1;
                setPickedRoom({
                  rowId: roomPickRowId,
                  roomId: selection.id,
                  roomName: room?.name?.trim() || `Комната ${idx + 1}`,
                });
                setRoomPickRowId(null);
                setAutoPlanOpen(true);
                setAutoPlanTab("params");
              }}
              theme="mist"
              catalog={furnitureCatalogRu}
              formatLength={formatLengthRu}
              showGrid
              showDimensions
              showRoomLabels={displayLayers.showRoomNames}
              showRoomArea={displayLayers.showRoomArea}
              style={canvasStyle}
            />
            <MarqueeSelectOverlay
              enabled
              chatMode={chatToolActive && !safetyMode}
              plan={plan}
              floorId={planFloorId}
              editorRootRef={canvasHostRef}
              onPlanChange={handlePlanChange}
              onSelectionChange={setMarqueeSelection}
              externalSelection={safetySelectItems}
              externalSelectionTick={safetySelectTick}
              furnitureOnly={safetyMode}
              furnitureKindFilter={
                safetyMode ? (kind) => isSafetyInteractKind(kind) : null
              }
              selectionPanelSide={safetyPanelOpen ? "left" : "right"}
              onChatPick={({ clientX, clientY, planX, planY }) => {
                if (!chatToolActive) return;
                if (chatApplyingRef.current) return;
                const live = editorRef.current?.getPlan?.() || plan;
                const floor =
                  live.floors.find((f) => f.id === planFloorId) ||
                  live.floors[0];

                // уже есть рамка-выделение
                if (marqueeSelection.length > 0) {
                  openChatForScope(
                    {
                      type: "selection",
                      items: marqueeSelection,
                      labels: selectionLabels(
                        live,
                        planFloorId,
                        marqueeSelection,
                      ),
                    },
                    clientX,
                    clientY,
                  );
                  return;
                }

                // клик по объекту чат-инструментом = выделить его
                const pad = 12;
                const hits = hitTestMarquee(
                  live,
                  {
                    x: planX - pad,
                    y: planY - pad,
                    width: pad * 2,
                    height: pad * 2,
                  },
                  planFloorId,
                ).filter((h) => h.kind === "furniture" || h.kind === "opening");
                if (hits.length > 0) {
                  setMarqueeSelection(hits);
                  openChatForScope(
                    {
                      type: "selection",
                      items: hits,
                      labels: selectionLabels(live, planFloorId, hits),
                    },
                    clientX,
                    clientY,
                  );
                  return;
                }

                const room = (floor?.rooms || []).find((r) =>
                  pointInPolygon(planX, planY, r.points || []),
                );
                if (room) {
                  openChatForScope(
                    {
                      type: "room",
                      roomId: room.id,
                      roomName: room.name?.trim() || "Комната",
                    },
                    clientX,
                    clientY,
                  );
                  return;
                }
                openChatForScope({ type: "global" }, clientX, clientY);
              }}
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
                {displayLayers.showFio && (
                  <MarkerBadge label={marker.label} variant="2d" />
                )}
              </div>
            )}
          />
        )}

        {viewMode === "3d" && (
          <Viewer3DErrorBoundary onBack2d={() => setViewMode("2d")}>
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-[13px] font-semibold tracking-[-0.01em] text-fg-secondary">
                  Загрузка 3D…
                </div>
              }
            >
              <FloorplanViewer3D
                key={`3d-${selectedFloorId || "x"}-${evacTexRev}-${displayLayers.colorMode}`}
                plan={plan3d}
                markers={markers}
                mode="floor"
                theme={displayLayers.colorMode === "gray" ? "mist" : "light"}
                formatLength={formatLengthRu}
                style={canvasStyle}
                markerSize={28}
                showRoomLabels={displayLayers.showRoomNames}
                onPlanClick={(e) => {
                  // В прогулке клики ловит WalkClickOverlay (нужен ПКМ)
                  if (walkActive) return;
                  const oe = e.originalEvent as
                    | PointerEvent
                    | MouseEvent
                    | undefined;
                  if (oe && "button" in oe && oe.button === 2) return;
                  const cx =
                    oe && "clientX" in oe ? oe.clientX : window.innerWidth / 2;
                  const cy =
                    oe && "clientY" in oe ? oe.clientY : window.innerHeight / 2;
                  inspectAtScreen(cx, cy, e.x, e.y);
                }}
                onMarkerClick={(marker, originalEvent) => {
                  if (walkActive) return;
                  const oe = originalEvent as PointerEvent | MouseEvent;
                  if ("button" in oe && oe.button === 2) return;
                  const lines = (marker.label || "")
                    .split(/\s+/)
                    .filter(Boolean);
                  setObjectInfo({
                    title: marker.label || "Сотрудник",
                    subtitle: "Рабочее место",
                    rows: [
                      ...(lines.length >= 3
                        ? [
                            { label: "Фамилия", value: lines[0] },
                            { label: "Имя", value: lines[1] },
                            {
                              label: "Отчество",
                              value: lines
                                .slice(2)
                                .join(" ")
                                .split(/[—–-]/)[0]
                                .trim(),
                            },
                          ]
                        : []),
                      {
                        label: "Позиция",
                        value: `${(marker.x / 100).toFixed(2)}, ${(marker.y / 100).toFixed(2)} м`,
                      },
                    ],
                    screenX:
                      "clientX" in oe && typeof oe.clientX === "number"
                        ? oe.clientX
                        : window.innerWidth / 2,
                    screenY:
                      "clientY" in oe && typeof oe.clientY === "number"
                        ? oe.clientY
                        : window.innerHeight / 2,
                  });
                }}
                renderMarker={(marker) =>
                  displayLayers.showFio ? (
                    <div
                      className={cn(
                        "flex flex-col items-center",
                        walkActive
                          ? "pointer-events-none"
                          : "pointer-events-auto cursor-pointer",
                      )}
                      style={{
                        transform: "translate(-50%, calc(-100% - 56px))",
                      }}
                      title={marker.label}
                      onClick={(ev) => {
                        if (walkActive) return;
                        ev.stopPropagation();
                        setObjectInfo({
                          title: marker.label || "Сотрудник",
                          subtitle: "Рабочее место",
                          rows: [
                            {
                              label: "Позиция",
                              value: `${(marker.x / 100).toFixed(2)}, ${(marker.y / 100).toFixed(2)} м`,
                            },
                          ],
                          screenX: ev.clientX,
                          screenY: ev.clientY,
                        });
                      }}
                    >
                      <MarkerBadge label={marker.label} variant="3d" />
                    </div>
                  ) : (
                    <span className="sr-only">{marker.label}</span>
                  )
                }
              />
            </Suspense>
          </Viewer3DErrorBoundary>
        )}
        <WalkClickOverlay
          walkActive={walkActive}
          hostRef={canvasHostRef}
          onInspect={inspectAtScreen}
        />
        </div>
      </div>

      <WalkModeButton
        plan={plan}
        floorId={planFloorId}
        visible={viewMode === "3d"}
        onActiveChange={(on) => {
          setWalkActive(on);
          if (on) setObjectInfo(null);
        }}
      />

      {viewMode === "3d" && (
        <DisplayLayersMenu
          value={displayLayers}
          onChange={setDisplayLayers}
          showPeopleToggle
        />
      )}

      <ObjectInfoPopup
        info={objectInfo}
        onClose={() => setObjectInfo(null)}
      />

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
        onAutoPlan={() => openAutoPlan("params")}
        onEvacuationMap={() => {
          setEvacWallPick(false);
          setEvacOpen(true);
        }}
        onSafetyGear={() => {
          if (safetyMode) exitSafetyMode();
          else enterSafetyMode();
        }}
        safetyModeActive={safetyMode}
        onNorms={() => openAutoPlan("norms")}
        normsCount={2}
        onStructuralTemplate={() => setStructuralTplOpen(true)}
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

      {!noedit && roomPickRowId && (
        <div className="fixed left-1/2 top-20 z-[130] flex -translate-x-1/2 items-center gap-3 rounded-sm border border-line bg-white px-4 py-2.5 shadow-card">
          <span className="text-[13px] font-medium text-fg">
            Кликните комнату на плане — это будет кабинет
          </span>
          <button
            type="button"
            className="cursor-pointer text-[12px] font-semibold text-fg-secondary underline-offset-2 hover:underline"
            onClick={() => {
              setRoomPickRowId(null);
              setAutoPlanOpen(true);
            }}
          >
            Отмена
          </button>
        </div>
      )}

      {!noedit && evacWallPick && viewMode === "edit" && (
        <>
          <div className="fixed left-1/2 top-20 z-[140] flex -translate-x-1/2 items-center gap-3 rounded-sm border border-line bg-white px-4 py-2.5 shadow-card">
            <span className="text-[13px] font-medium text-fg">
              Кликните на плане — план эвакуации появится в этой точке
            </span>
            <button
              type="button"
              className="cursor-pointer text-[12px] font-semibold text-fg-secondary underline-offset-2 hover:underline"
              onClick={() => setEvacWallPick(false)}
            >
              Готово
            </button>
          </div>
          <div
            className="absolute inset-x-0 bottom-10 top-16 z-[135] cursor-copy"
            style={{ cursor: "copy" }}
            onPointerDown={(ev) => {
              if (ev.button !== 0) return;
              ev.preventDefault();
              ev.stopPropagation();
              const root = canvasHostRef.current;
              if (!root) return;
              const pt = clientToPlan(root, ev.clientX, ev.clientY);
              if (!pt) return;
              const live = editorRef.current?.getPlan?.() || plan;
              const placed = placeEvacuationPosterAt(
                live,
                planFloorId,
                pt.x,
                pt.y,
              );
              if (!placed.furniture) {
                setSaveMsg(placed.message);
                window.setTimeout(() => setSaveMsg(null), 2800);
                return;
              }
              bindEvacTextureToFurnitureIds([placed.furniture.id]);
              setPlan(placed.plan);
              persistLocal(placed.plan, markers);
              setEvacTexRev((n) => n + 1);
              setSaveMsg("План эвакуации размещён");
              window.setTimeout(() => setSaveMsg(null), 2000);
            }}
          />
        </>
      )}

      {!noedit && (
        <StructuralTemplateModal
          open={structuralTplOpen}
          onClose={() => setStructuralTplOpen(false)}
          officeId={selectedOfficeId || selectedFloor?.officeId}
          currentFloorId={selectedFloorId}
          currentFloorName={
            selectedFloor?.name ||
            (selectedFloor?.number != null
              ? `${selectedFloor.number} этаж`
              : undefined)
          }
          planFloorId={planFloorId}
          getLivePlan={() => editorRef.current?.getPlan?.() || plan}
          floors={officeFloorsForTemplate}
          onApplyToCurrent={(nextPlan) => {
            runWithoutCameraFit(canvasHostRef.current, () => {
              setPlan(nextPlan);
              // Каркас сменился — комплектации столов сбрасываем
              setWorkplaceKits([]);
              setKitDeskId(null);
              persistLocal(nextPlan, markers, []);
            });
            setStructuralTplOpen(false);
            setSaveMsg("Шаблон каркаса применён к текущему этажу");
            window.setTimeout(() => setSaveMsg(null), 2800);
          }}
          onApplyToOtherFloor={async (floorId, template) => {
            const floorMeta = officeFloorsForTemplate.find(
              (f) => f.id === floorId,
            );
            const fromApi = parseStored(floorMeta?.planData);
            const fromLocal = parseStored(
              localStorage.getItem(storageKey(floorId)),
            );
            const base =
              pickStored(fromApi, fromLocal) ||
              ({
                plan: createRussianPlan(floorMeta?.name || "Офис"),
                markers: [],
                workplaceKits: [],
              } satisfies StoredMap);

            const targetPlanFloorId =
              base.plan.floors[0]?.id || planFloorId;
            const nextPlan = applyStructuralTemplate(
              base.plan,
              targetPlanFloorId,
              template as StructuralTemplate,
            );
            const payload = serializeStored(
              nextPlan,
              base.markers,
              // kits привязаны к старым id столов — сбрасываем
              [],
            );
            localStorage.setItem(storageKey(floorId), payload);

            const updateRes = await apiUpdateFloor(
              {
                name: floorMeta?.name,
                number: floorMeta?.number ?? undefined,
                planData: payload,
              },
              floorId,
            );
            if (!isApiOk(updateRes)) {
              throw new Error(
                (updateRes as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ||
                  "Сервер отклонил запись шаблона на этаж",
              );
            }
            await refetchFloors();
            void queryClient.invalidateQueries({
              queryKey: ["floors/all/id", user?.companyId],
            });
            setStructuralTplOpen(false);
            setSaveMsg(
              `Шаблон записан на этаж «${floorMeta?.name || floorId}». Откройте его в каталоге.`,
            );
            window.setTimeout(() => setSaveMsg(null), 4000);
          }}
        />
      )}

      {!noedit && (
        <EvacuationMapModal
          open={evacOpen}
          onClose={() => setEvacOpen(false)}
          plan={plan}
          markers={markers}
          floorId={selectedFloorId}
          planFloorId={planFloorId}
          floorNumber={selectedFloor?.number}
          floorName={selectedFloor?.name}
          onApply={(nextPlan, nextMarkers) => {
            setPlan(nextPlan);
            setMarkers(nextMarkers);
            persistLocal(nextPlan, nextMarkers);
            const ids = listEvacFurnitureIds(
              nextPlan.floors.flatMap((f) => f.furniture || []),
            );
            bindEvacTextureToFurnitureIds(ids);
            setEvacTexRev((n) => n + 1);
            setSaveMsg("Планы эвакуации размещены автоматически");
            window.setTimeout(() => setSaveMsg(null), 2800);
          }}
          onStartWallPick={() => {
            setEvacWallPick(true);
            setViewMode("edit");
            setRoomPickRowId(null);
          }}
          onTexturesReady={() => setEvacTexRev((n) => n + 1)}
        />
      )}

      {!noedit && (
        <SafetyGearDrawer
          open={safetyPanelOpen}
          onClose={exitSafetyMode}
          plan={plan}
          markers={markers}
          planFloorId={planFloorId}
          onApply={(nextPlan, nextMarkers, placed) => {
            setPlan(nextPlan);
            setMarkers(nextMarkers);
            persistLocal(nextPlan, nextMarkers);
            const items: SelectedItem[] = placed.map((f) => ({
              kind: "furniture",
              id: f.id,
            }));
            // сначала снять режим, потом выделить — панель параметров поверх карты
            setSafetyMode(false);
            setSafetyPanelOpen(false);
            setSafetySelectItems(items);
            setSafetySelectTick((n) => n + 1);
            setSaveMsg(
              placed.length
                ? `Размещено: ${placed.length}, объекты выделены`
                : "Нечего размещать — проверьте выходы и стены",
            );
            window.setTimeout(() => setSaveMsg(null), 2800);
          }}
        />
      )}

      {!noedit && (
        <AutoPlanDrawer
          open={autoPlanOpen}
          tab={autoPlanTab}
          onTabChange={setAutoPlanTab}
          onClose={() => {
            setAutoPlanOpen(false);
            setRoomPickRowId(null);
          }}
          companyId={user?.companyId}
          floorId={selectedFloorId}
          planFloorId={planFloorId}
          plan={plan}
          markers={markers}
          getLivePlan={() => editorRef.current?.getPlan?.() || plan}
          onApplyPlan={(nextPlan, nextMarkers) => {
            setPlan(nextPlan);
            setMarkers(nextMarkers);
            persistLocal(nextPlan, nextMarkers, workplaceKits);
          }}
          roomPickRowId={roomPickRowId}
          onStartRoomPick={(rowId) => {
            setRoomPickRowId(rowId);
            setViewMode("edit");
          }}
          onCancelRoomPick={() => setRoomPickRowId(null)}
          pickedRoom={pickedRoom}
          onPickedRoomConsumed={() => setPickedRoom(null)}
          assignedEquipmentCount={occupiedEquipmentIds(workplaceKits).size}
        />
      )}

      {!noedit && viewMode === "edit" && kitDeskId && (
        <WorkplaceKitPanel
          open
          hostRef={workspaceRef}
          deskId={kitDeskId}
          deskLabel={(() => {
            const furn = findFurniture(plan, planFloorId, kitDeskId);
            if (!furn) return "Стол";
            const kind = String(furn.kind);
            const item =
              officePackRu.items.find((c) => String(c.kind) === kind) ||
              furnitureCatalogRu.find((c) => String(c.kind) === kind);
            return item?.label || kind.replace(/^office\//, "");
          })()}
          kits={workplaceKits}
          equipments={floorEquipments}
          floorId={selectedFloorId}
          onChangeKits={applyKits}
          onCopyWorkplace={handleCopyWorkplace}
          onClose={() => {
            setKitDeskId(null);
            setKitCopyWarning(null);
          }}
          copyWarning={kitCopyWarning}
        />
      )}

      {!noedit && viewMode === "edit" && (
        <>
          <CatalogSearch hostRef={canvasHostRef} enabled />
          <ChatDockButton
            hostRef={canvasHostRef}
            active={chatToolActive}
            disabled={!ollamaAvailable}
            onNativeToolClick={deactivateChat}
            onClick={() => {
              // Во время apply не даём случайно выключить инструмент и потерять попап
              if (chatApplyingRef.current) return;
              const next = !chatToolActive;
              setChatToolActive(next);
              setAutoPlanOpen(false);
              if (!next) {
                setChatTarget(null);
                setChatReply(null);
                return;
              }
              const ed = editorRef.current as
                | (FloorplanEditorElement & {
                    setTool?: (tool: string) => void;
                  })
                | null;
              ed?.setTool?.("select");
              if (marqueeSelection.length > 0) {
                const live = editorRef.current?.getPlan?.() || plan;
                openChatForScope(
                  {
                    type: "selection",
                    items: marqueeSelection,
                    labels: selectionLabels(
                      live,
                      planFloorId,
                      marqueeSelection,
                    ),
                  },
                  window.innerWidth / 2,
                  window.innerHeight / 2,
                );
              } else {
                setChatTarget(null);
                setChatReply(null);
              }
            }}
          />
          <ContextualChat
            target={chatTarget}
            onCloseTarget={() => {
              // Явное «Закрыть»/✕ — можно; во время apply сначала стоп
              if (chatApplying) handleChatStop();
              setChatTarget(null);
              setChatReply(null);
            }}
            ollamaAvailable={ollamaAvailable}
            applying={chatApplying}
            canUndo={!!chatUndo}
            lastReply={chatReply}
            onSubmit={handleChatSubmit}
            onStop={handleChatStop}
            onUndo={handleChatUndo}
          />
        </>
      )}

      {!noedit && (
        <div className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-between gap-3 border-t border-line bg-white px-5 py-2.5 text-xs font-medium tracking-[-0.01em] text-fg-secondary">
          <span>
            {chatToolActive
              ? "Инструмент «Чат»: курсор-пузырь · клик по комнате / пустому месту · ⌘/Ctrl+рамка — объекты, затем клик"
              : viewMode === "edit"
                ? "Инструменты слева: Выбор / Чат. ⌘/Ctrl + рамка — несколько объектов."
                : viewMode === "2d"
                  ? "Клик по карте — маркер рабочего места. Клик по маркеру — удалить."
                  : "3D: клик по объекту — карточка · ЛКМ — вращение · два пальца / трекпад — сдвиг · pinch — масштаб"}
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
