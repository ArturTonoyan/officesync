import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FloorPlan, Marker } from "@jbaysolutions/floorplan-react";
import {
  apiGetEquipments,
  apiGetUsers,
  apiLayoutFurnishRooms,
  apiLayoutOllamaStatus,
} from "../../../../api/apirequests";
import { cn } from "@utils/cn";
import {
  applyFurnishKits,
  buildFallbackSuggestions,
  type FurnishSuggestion,
} from "./layout/furnish";
import { generateAutoPlan } from "./layout/generate";
import { FURNISH_CATALOG } from "./layout/roomKits";
import NormsPanel from "./NormsPanel";
import ParamsPanel from "./ParamsPanel";
import {
  defaultAutoPlanForm,
  type AutoPlanFormState,
  type AutoPlanTab,
  type DbPreviewItem,
  type GenerationPhase,
  type GenerationReport,
  type NormViolation,
  type PlanVariantId,
} from "./types";

type FloorUser = {
  id: string;
  name?: string;
  surname?: string;
  patronymic?: string;
  position?: string;
  floorId?: string;
  roles?: { value?: string; description?: string }[];
};

type FloorEquipment = {
  id: string;
  name?: string;
  type?: string;
  inventoryNumber?: string;
  floorId?: string;
  userId?: string;
  user?: {
    id?: string;
    name?: string;
    surname?: string;
    patronymic?: string;
  };
};

type Props = {
  open: boolean;
  tab: AutoPlanTab;
  onTabChange: (tab: AutoPlanTab) => void;
  onClose: () => void;
  companyId?: string | null;
  floorId?: string | null;
  planFloorId?: string | null;
  plan: FloorPlan;
  markers?: Marker[];
  /** Актуальный план из редактора (если доступен) */
  getLivePlan?: () => FloorPlan;
  onApplyPlan: (plan: FloorPlan, markers: Marker[]) => void;
  /** Режим выбора комнаты кликом по карте */
  roomPickRowId?: string | null;
  onStartRoomPick?: (rowId: string) => void;
  onCancelRoomPick?: () => void;
  pickedRoom?: {
    rowId: string;
    roomId: string;
    roomName: string;
  } | null;
  onPickedRoomConsumed?: () => void;
  /** Если не передан — статус берётся с GET /layout/ollama-status */
  ollamaAvailable?: boolean;
  /** Сколько единиц оборудования уже привязано к комплектациям столов */
  assignedEquipmentCount?: number;
};

function fio(u: FloorUser) {
  return [u.surname, u.name, u.patronymic].filter(Boolean).join(" ").trim();
}

function buildUserItems(users: FloorUser[]): DbPreviewItem[] {
  return users.map((u) => ({
    id: `user:${u.id}`,
    kind: "user" as const,
    title: fio(u) || u.id,
    subtitle: u.position || "Сотрудник",
    enabled: true,
  }));
}

function buildEquipmentItems(equipments: FloorEquipment[]): DbPreviewItem[] {
  return equipments.map((eq) => ({
    id: `eq:${eq.id}`,
    kind: "equipment" as const,
    title: eq.name || "Оборудование",
    subtitle: [eq.type, eq.inventoryNumber].filter(Boolean).join(" · "),
    enabled: true,
  }));
}

function buildLinkItems(
  users: FloorUser[],
  equipments: FloorEquipment[],
  markers: Marker[],
): DbPreviewItem[] {
  const usersById = new Map(users.map((u) => [u.id, u]));
  const links: DbPreviewItem[] = [];

  for (const eq of equipments) {
    const owner =
      eq.user ||
      (eq.userId ? usersById.get(eq.userId) : undefined);
    if (!owner && !eq.userId) continue;
    const ownerName = owner
      ? fio(owner as FloorUser)
      : eq.userId || "неизвестно";
    links.push({
      id: `link:eq:${eq.id}`,
      kind: "link",
      title: `${eq.name || "Оборудование"} → ${ownerName}`,
      subtitle: eq.type ? `Привязка · ${eq.type}` : "Привязка оборудования",
      enabled: true,
    });
  }

  markers.forEach((m, i) => {
    links.push({
      id: `marker:${m.id}`,
      kind: "marker",
      title: m.label || `Рабочее место ${i + 1}`,
      subtitle: "Маркер на плане",
      enabled: true,
    });
  });

  return links;
}

async function loadFloorData(
  companyId: string | null | undefined,
  floorId: string | null | undefined,
  refetchUsers: () => Promise<{ data?: { data?: FloorUser[] } }>,
  refetchEquipments: () => Promise<{ data?: { data?: FloorEquipment[] } }>,
  usersFallback: FloorUser[],
  equipmentsFallback: FloorEquipment[],
) {
  if (!companyId || !floorId) {
    throw new Error("Не выбран этаж — откройте конструктор с этажом");
  }
  const [usersResult, equipmentsResult] = await Promise.all([
    refetchUsers(),
    refetchEquipments(),
  ]);
  const allUsers = (usersResult.data?.data || usersFallback || []) as FloorUser[];
  const allEquipments = (equipmentsResult.data?.data ||
    equipmentsFallback ||
    []) as FloorEquipment[];
  return {
    floorUsers: allUsers.filter((u) => u.floorId === floorId),
    floorEquipments: allEquipments.filter((e) => e.floorId === floorId),
  };
}

const TABS: { id: AutoPlanTab; label: string }[] = [
  { id: "params", label: "Параметры" },
  { id: "norms", label: "Нормы" },
];

function AutoPlanDrawer({
  open,
  tab,
  onTabChange,
  onClose,
  companyId,
  floorId,
  planFloorId,
  plan,
  markers = [],
  getLivePlan,
  onApplyPlan,
  roomPickRowId = null,
  onStartRoomPick,
  onCancelRoomPick,
  pickedRoom = null,
  onPickedRoomConsumed,
  ollamaAvailable: ollamaAvailableProp,
  assignedEquipmentCount = 0,
}: Props) {
  const [form, setForm] = useState<AutoPlanFormState>(defaultAutoPlanForm);
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [report, setReport] = useState<GenerationReport | null>(null);
  const [variant, setVariant] = useState<PlanVariantId>("A");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pullError, setPullError] = useState<string | null>(null);

  const ollamaStatusQuery = useQuery({
    queryKey: ["layout-ollama-status"],
    queryFn: apiLayoutOllamaStatus,
    enabled: open,
    staleTime: 30_000,
    retry: 0,
  });
  const ollamaAvailable =
    ollamaAvailableProp ??
    Boolean(ollamaStatusQuery.data?.available);

  const [violations, setViolations] = useState<NormViolation[]>([]);
  const [explaining, setExplaining] = useState(false);

  const snapshotRef = useRef<{
    plan: FloorPlan;
    markers: Marker[];
  } | null>(null);
  const pendingRef = useRef<{
    plan: FloorPlan;
    markers: Marker[];
  } | null>(null);

  const picking = Boolean(roomPickRowId);

  const officeUsers = useMemo(
    () =>
      form.dbUsers
        .filter((u) => u.enabled)
        .map((u) => ({
          id: u.id.replace(/^user:/, ""),
          name: u.title,
        })),
    [form.dbUsers],
  );

  const officeRooms = useMemo(() => {
    const live = getLivePlan?.() || plan;
    const floor =
      live.floors.find((f) => f.id === (planFloorId || floorId)) ||
      live.floors[0];
    if (!floor) return [];
    return (floor.rooms || [])
      .filter((r) => !/туалет|санузел|wc|мойк|душевая|toilet|bath|restroom/i.test(r.name || ""))
      .map((r, i) => ({
        id: r.id,
        name: r.name?.trim() || `Комната ${i + 1}`,
      }));
  }, [plan, getLivePlan, planFloorId, floorId, roomPickRowId, open]);

  useEffect(() => {
    if (!pickedRoom) return;
    setForm((prev) => ({
      ...prev,
      privateOffices: prev.privateOffices.map((row) =>
        row.id === pickedRoom.rowId
          ? {
              ...row,
              roomId: pickedRoom.roomId,
              roomName: pickedRoom.roomName,
            }
          : row,
      ),
    }));
    onPickedRoomConsumed?.();
  }, [pickedRoom, onPickedRoomConsumed]);

  const { data: usersRes, refetch: refetchUsers } = useQuery({
    queryKey: ["autoplan/users", companyId],
    queryFn: () => apiGetUsers(companyId),
    enabled: !!companyId && open,
    staleTime: 30_000,
  });

  const { data: equipmentsRes, refetch: refetchEquipments } = useQuery({
    queryKey: ["autoplan/equipments", companyId],
    queryFn: () => apiGetEquipments(companyId),
    enabled: !!companyId && open,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const validateForm = (state: AutoPlanFormState): string | null => {
    const hasDbUsers =
      state.pullUsers && state.dbUsers.some((i) => i.enabled);
    const hasWorkstations = state.workstations > 0;
    const hasZones =
      state.meetingRooms > 0 ||
      state.conferenceRoom > 0 ||
      state.privateOffices.length > 0 ||
      state.lounge ||
      state.pantry ||
      state.reception;
    if (!hasWorkstations && !hasDbUsers && !hasZones) {
      return "Укажите число мест, подтяните сотрудников или зоны (переговорные, кабинет, lounge…)";
    }
    return null;
  };

  const handlePullUsers = async () => {
    setPullError(null);
    try {
      const { floorUsers } = await loadFloorData(
        companyId,
        floorId,
        refetchUsers,
        refetchEquipments,
        (usersRes?.data || []) as FloorUser[],
        (equipmentsRes?.data || []) as FloorEquipment[],
      );
      const dbUsers = buildUserItems(floorUsers);
      if (dbUsers.length === 0) {
        setPullError("На этом этаже нет сотрудников в БД");
      }
      const director = floorUsers.find((u) =>
        u.roles?.some(
          (r) =>
            r.value === "DIRECTOR" || /директор/i.test(r.description || ""),
        ),
      );
      setForm((prev) => ({
        ...prev,
        pullUsers: true,
        dbUsers,
        workstations: Math.max(prev.workstations, floorUsers.length),
        privateOffices:
          director && prev.privateOffices.length === 0
            ? [
                {
                  id: crypto.randomUUID(),
                  userId: director.id,
                  userName: fio(director),
                  roomId: null,
                  roomName: null,
                },
              ]
            : prev.privateOffices,
        selectedFurniture: {
          ...prev.selectedFurniture,
          desk: true,
          chair: true,
        },
        furnitureLimits: {
          ...prev.furnitureLimits,
          desk: Math.max(prev.furnitureLimits.desk || 0, floorUsers.length),
          chair: Math.max(prev.furnitureLimits.chair || 0, floorUsers.length),
        },
      }));
    } catch (e) {
      setPullError(e instanceof Error ? e.message : "Ошибка загрузки");
    }
  };

  const handlePullEquipment = async () => {
    setPullError(null);
    try {
      const { floorEquipments } = await loadFloorData(
        companyId,
        floorId,
        refetchUsers,
        refetchEquipments,
        (usersRes?.data || []) as FloorUser[],
        (equipmentsRes?.data || []) as FloorEquipment[],
      );
      const dbEquipment = buildEquipmentItems(floorEquipments);
      if (dbEquipment.length === 0) {
        setPullError("На этом этаже нет оборудования в БД");
      }
      setForm((prev) => ({
        ...prev,
        pullEquipment: true,
        dbEquipment,
      }));
    } catch (e) {
      setPullError(e instanceof Error ? e.message : "Ошибка загрузки");
    }
  };

  const handlePullLinks = async () => {
    setPullError(null);
    try {
      const { floorUsers, floorEquipments } = await loadFloorData(
        companyId,
        floorId,
        refetchUsers,
        refetchEquipments,
        (usersRes?.data || []) as FloorUser[],
        (equipmentsRes?.data || []) as FloorEquipment[],
      );
      const dbLinks = buildLinkItems(floorUsers, floorEquipments, markers);
      if (dbLinks.length === 0) {
        setPullError("На этом этаже нет привязок и маркеров");
      }
      setForm((prev) => ({
        ...prev,
        pullLinks: true,
        dbLinks,
      }));
    } catch (e) {
      setPullError(e instanceof Error ? e.message : "Ошибка загрузки");
    }
  };

  const handleParseBrief = () => {
    if (!form.briefText.trim()) return;
    // UI-заглушка: имитация разбора Ollama
    const lines = form.briefText
      .split(/[.\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    setForm((prev) => ({
      ...prev,
      parsedItems: lines.map((text) => ({
        id: crypto.randomUUID(),
        text,
        source: "text" as const,
      })),
      workstations: prev.workstations || (prev.briefText.match(/\d+/) ? 24 : 0),
      meetingRooms: prev.meetingRooms || 2,
    }));
  };

  const handleGenerate = async () => {
    const err = validateForm(form);
    setValidationError(err);
    if (err) return;

    setGenerating(true);
    setPhase("layout");
    setReport(null);
    setViolations([]);

    try {
      const livePlan = getLivePlan?.() || plan;
      if (!snapshotRef.current) {
        snapshotRef.current = {
          plan: JSON.parse(JSON.stringify(livePlan)),
          markers: JSON.parse(JSON.stringify(markers)),
        };
      }

      const result = generateAutoPlan({
        plan: livePlan,
        markers,
        form,
        floorId: planFloorId || floorId,
        assignedEquipmentCount,
      });

      // Ollama (или fallback) доукомплектовывает комнаты
      setPhase("parse");
      let furnishedPlan = result.plan;
      const furnishCreated: string[] = [];
      const prefs = {
        morePlants: form.morePlants,
        allowExtraFurniture: form.allowExtraFurniture,
        moreFocusBooths: form.moreFocusBooths,
      };

      let suggestions: FurnishSuggestion[] = buildFallbackSuggestions(
        result.roomRoles,
        prefs,
      );
      let furnishSource: "ollama" | "fallback" = "fallback";

      if (ollamaAvailable) {
        try {
          const res = await apiLayoutFurnishRooms({
            rooms: result.roomRoles
              .filter((r) => r.role !== "wet")
              .map((r) => ({
                id: r.roomId,
                name: r.name,
                role: r.role,
                areaM2: r.areaM2,
                existingKinds: r.existingKinds,
              })),
            catalog: FURNISH_CATALOG.map((c) => ({
              kind: c.kind,
              label: c.label,
              category: c.category,
            })),
            preferences: prefs,
          });
          if (Array.isArray(res?.rooms) && res.rooms.length > 0) {
            suggestions = res.rooms.map(
              (r: {
                roomId: string;
                add?: {
                  kind: string;
                  count: number;
                  placement?: string;
                }[];
              }) => ({
                roomId: r.roomId,
                add: (r.add || []).map((a) => ({
                  kind: a.kind,
                  count: a.count,
                  placement: (a.placement || "wall") as
                    | "wall"
                    | "corner"
                    | "center"
                    | "around-center",
                })),
              }),
            );
            furnishSource = "ollama";
          }
        } catch (e) {
          console.warn("Ollama furnish fallback", e);
          furnishCreated.push(
            "Ollama недоступна — комплектация по шаблонам ролей",
          );
        }
      } else {
        furnishCreated.push(
          "Ollama выключена — комплектация по шаблонам ролей",
        );
      }

      setPhase("validate");
      const furnished = applyFurnishKits(
        furnishedPlan,
        planFloorId || floorId,
        suggestions,
        furnishSource,
      );
      furnishedPlan = furnished.plan;
      if (furnishSource === "ollama") {
        furnishCreated.unshift("Ollama: комплектация комнат");
      }
      furnishCreated.push(...furnished.addedLabels);

      const report: GenerationReport = {
        ...result.report,
        created: [...result.report.created, ...furnishCreated],
      };

      pendingRef.current = {
        plan: furnishedPlan,
        markers: result.markers,
      };
      onApplyPlan(furnishedPlan, result.markers);
      setReport(report);
      const warns = report.norms
        .filter((n) => n.status !== "ok")
        .map((n) => ({
          id: n.id,
          severity: (n.status === "error" ? "error" : "warning") as
            | "error"
            | "warning",
          message: n.label,
        }));
      const skips = report.skipped.map((s, i) => ({
        id: `skip-${i}`,
        severity: "warning" as const,
        message: s,
      }));
      setViolations([...warns, ...skips]);
      setPhase("done");
    } catch (e) {
      console.error(e);
      setValidationError(
        e instanceof Error ? e.message : "Ошибка генерации плана",
      );
      setPhase("error");
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (!pendingRef.current) return;
    onApplyPlan(pendingRef.current.plan, pendingRef.current.markers);
  };

  const handleUndo = () => {
    if (snapshotRef.current) {
      onApplyPlan(snapshotRef.current.plan, snapshotRef.current.markers);
      snapshotRef.current = null;
    }
    pendingRef.current = null;
    setReport(null);
    setPhase("idle");
    setViolations([]);
  };

  const handleExplain = () => {
    setExplaining(true);
    window.setTimeout(() => {
      setExplaining(false);
      setViolations((prev) => [
        ...prev,
        {
          id: `explain-${Date.now()}`,
          severity: "warning",
          message:
            "Пояснение (Ollama): проверьте проходы ≥1 м и зоны дверей. Точный разбор — через чат на карте.",
        },
      ]);
    }, 800);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[110] bg-ink/20 transition-opacity",
          open && !picking
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open || picking}
      />

      <aside
        className={cn(
          "fixed top-16 right-0 z-[120] flex h-[calc(100vh-4rem)] w-full max-w-[720px] flex-col border-l border-line bg-white shadow-card transition-transform duration-200 ease-out",
          open && !picking ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open || picking}
        role="dialog"
        aria-label="Автоплан"
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2.5">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.01em] text-fg">
            Автоплан
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-fg-secondary hover:bg-muted hover:text-fg"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </header>

        <nav className="flex shrink-0 gap-0.5 border-b border-line bg-muted/40 p-1.5">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn(
                "h-8 flex-1 cursor-pointer rounded-md text-[12px] font-semibold text-fg-secondary transition-colors",
                tab === item.id && "bg-white text-fg shadow-soft",
              )}
            >
              {item.label}
              {item.id === "norms" && violations.length > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-[#b32020] px-1 text-[10px] font-bold text-white">
                  {violations.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1">
          {tab === "params" && (
            <ParamsPanel
              form={form}
              onChange={setForm}
              ollamaAvailable={ollamaAvailable}
              generating={generating}
              phase={phase}
              report={report}
              variant={variant}
              onVariantChange={setVariant}
              validationError={validationError}
              pullError={pullError}
              users={officeUsers}
              rooms={officeRooms}
              pickingRowId={roomPickRowId}
              onStartRoomPick={(rowId) => onStartRoomPick?.(rowId)}
              onCancelRoomPick={() => onCancelRoomPick?.()}
              onPullUsers={handlePullUsers}
              onPullEquipment={handlePullEquipment}
              onPullLinks={handlePullLinks}
              onParseBrief={handleParseBrief}
              onGenerate={handleGenerate}
              onApply={handleApply}
              onUndo={handleUndo}
            />
          )}
          {tab === "norms" && (
            <NormsPanel
              violations={violations}
              ollamaAvailable={ollamaAvailable}
              explaining={explaining}
              onFocusViolation={() => {
                /* позже: фокус на объекте canvas */
              }}
              onExplain={handleExplain}
            />
          )}
        </div>
      </aside>
    </>
  );
}

export default AutoPlanDrawer;
