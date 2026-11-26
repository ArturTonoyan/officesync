import { useState, type ReactNode } from "react";
import { Button, Input } from "@components/ui";
import { cn } from "@utils/cn";
import {
  DENSITY_OPTIONS,
  FURNITURE_OPTIONS,
  GENERATION_PHASE_LABEL,
} from "./constants";
import type {
  AutoPlanFormState,
  DbPreviewItem,
  GenerationPhase,
  GenerationReport,
  PlanVariantId,
  PrivateOfficeRow,
  ReportCounts,
} from "./types";

const COUNT_LABELS: { key: keyof ReportCounts; label: string }[] = [
  { key: "workstations", label: "Рабочие места" },
  { key: "meetingRooms", label: "Переговорные" },
  { key: "conferenceRoom", label: "Конференц-зал" },
  { key: "privateOffices", label: "Кабинеты" },
  { key: "lounge", label: "Зона отдыха" },
  { key: "reception", label: "Ресепшен" },
  { key: "pantry", label: "Кухня / пантри" },
];

export type OfficeUserOption = {
  id: string;
  name: string;
};

export type OfficeRoomOption = {
  id: string;
  name: string;
};

type Props = {
  form: AutoPlanFormState;
  onChange: (next: AutoPlanFormState) => void;
  ollamaAvailable: boolean;
  generating: boolean;
  phase: GenerationPhase;
  report: GenerationReport | null;
  variant: PlanVariantId;
  onVariantChange: (v: PlanVariantId) => void;
  validationError: string | null;
  pullError?: string | null;
  users: OfficeUserOption[];
  rooms: OfficeRoomOption[];
  pickingRowId: string | null;
  onStartRoomPick: (rowId: string) => void;
  onCancelRoomPick: () => void;
  onPullUsers: () => void;
  onPullEquipment: () => void;
  onPullLinks: () => void;
  onParseBrief: () => void;
  onGenerate: () => void;
  onApply: () => void;
  onUndo: () => void;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-line px-4 py-4 last:border-b-0">
      <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-fg-muted">
        {title}
      </h4>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[12px] font-medium text-fg-secondary">
      {children}
    </label>
  );
}

function PullToggle({
  label,
  checked,
  open,
  disabled,
  items,
  emptyText,
  onTogglePull,
  onToggleOpen,
  onToggleItem,
}: {
  label: string;
  checked: boolean;
  open: boolean;
  disabled?: boolean;
  items: DbPreviewItem[];
  emptyText: string;
  onTogglePull: (next: boolean) => void;
  onToggleOpen: () => void;
  onToggleItem: (id: string) => void;
}) {
  const enabled = items.filter((i) => i.enabled).length;
  const canExpand = checked;

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-white">
      <div
        className={cn(
          "flex items-center gap-2 px-2.5 py-2",
          disabled && "opacity-50",
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Свернуть список" : "Раскрыть список"}
          disabled={!canExpand}
          onClick={onToggleOpen}
          className={cn(
            "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm text-[11px] text-fg-muted transition-colors hover:bg-muted",
            !canExpand && "cursor-not-allowed opacity-40",
            open && canExpand && "rotate-90",
          )}
        >
          ▶
        </button>

        <span className="min-w-0 flex-1 text-[13px] font-medium text-fg">
          {label}
          {checked && (
            <span className="ml-2 text-[11px] font-medium text-fg-muted">
              {items.length === 0 ? "пусто" : `${enabled}/${items.length}`}
            </span>
          )}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          onClick={() => onTogglePull(!checked)}
          className={cn(
            "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
            checked ? "bg-ink" : "bg-line-strong",
            disabled && "cursor-not-allowed",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform",
              checked && "translate-x-5",
            )}
          />
        </button>
      </div>

      {checked && open && (
        <div className="border-t border-line px-2.5 py-2">
          {items.length === 0 ? (
            <p className="px-1 py-2 text-[12px] text-fg-muted">{emptyText}</p>
          ) : (
            <ul className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
              {items.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-sm px-1.5 py-1 hover:bg-muted">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-3.5 w-3.5 accent-ink"
                      checked={item.enabled}
                      onChange={() => onToggleItem(item.id)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-fg">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className="block truncate text-[11px] text-fg-muted">
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ParamsPanel({
  form,
  onChange,
  ollamaAvailable,
  generating,
  phase,
  report,
  variant,
  onVariantChange,
  validationError,
  pullError,
  users,
  rooms,
  pickingRowId,
  onStartRoomPick,
  onCancelRoomPick,
  onPullUsers,
  onPullEquipment,
  onPullLinks,
  onParseBrief,
  onGenerate,
  onApply,
  onUndo,
}: Props) {
  const [openUsers, setOpenUsers] = useState(false);
  const [openEquipment, setOpenEquipment] = useState(false);
  const [openLinks, setOpenLinks] = useState(false);

  const patch = (partial: Partial<AutoPlanFormState>) =>
    onChange({ ...form, ...partial });

  const addPrivateOffice = () => {
    const row: PrivateOfficeRow = {
      id: crypto.randomUUID(),
      userId: "",
      userName: "",
      roomId: null,
      roomName: null,
    };
    patch({ privateOffices: [...form.privateOffices, row] });
  };

  const updatePrivateOffice = (
    id: string,
    partial: Partial<PrivateOfficeRow>,
  ) => {
    patch({
      privateOffices: form.privateOffices.map((row) =>
        row.id === id ? { ...row, ...partial } : row,
      ),
    });
  };

  const removePrivateOffice = (id: string) => {
    patch({
      privateOffices: form.privateOffices.filter((row) => row.id !== id),
    });
  };

  const toggleFurniture = (id: string) => {
    const next = { ...form.selectedFurniture, [id]: !form.selectedFurniture[id] };
    patch({ selectedFurniture: next });
  };

  const setFurnitureLimit = (id: string, value: number) => {
    patch({
      furnitureLimits: { ...form.furnitureLimits, [id]: Math.max(0, value) },
    });
  };

  const toggleListItem = (
    key: "dbUsers" | "dbEquipment" | "dbLinks",
    id: string,
  ) => {
    patch({
      [key]: form[key].map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!ollamaAvailable && (
          <div className="mx-4 mt-4 rounded-sm border border-[#e8c38a] bg-[#fff8eb] px-3 py-2.5 text-[12px] font-medium leading-snug text-[#7a5320]">
            Текстовый разбор временно недоступен. Можно создать план только по
            форме.
          </div>
        )}

        <Section title="Источник данных">
          <div className="flex flex-col gap-2">
            <PullToggle
              label="Подтянуть сотрудников"
              checked={form.pullUsers}
              open={openUsers}
              disabled={generating}
              items={form.dbUsers}
              emptyText="Список пуст"
              onToggleOpen={() => setOpenUsers((v) => !v)}
              onToggleItem={(id) => toggleListItem("dbUsers", id)}
              onTogglePull={(next) => {
                if (next) {
                  setOpenUsers(false);
                  void onPullUsers();
                } else {
                  setOpenUsers(false);
                  patch({ pullUsers: false, dbUsers: [] });
                }
              }}
            />
            <PullToggle
              label="Подтянуть оборудование"
              checked={form.pullEquipment}
              open={openEquipment}
              disabled={generating}
              items={form.dbEquipment}
              emptyText="Список пуст"
              onToggleOpen={() => setOpenEquipment((v) => !v)}
              onToggleItem={(id) => toggleListItem("dbEquipment", id)}
              onTogglePull={(next) => {
                if (next) {
                  setOpenEquipment(false);
                  void onPullEquipment();
                } else {
                  setOpenEquipment(false);
                  patch({ pullEquipment: false, dbEquipment: [] });
                }
              }}
            />
            <PullToggle
              label="Подтянуть связи"
              checked={form.pullLinks}
              open={openLinks}
              disabled={generating}
              items={form.dbLinks}
              emptyText="Список пуст"
              onToggleOpen={() => setOpenLinks((v) => !v)}
              onToggleItem={(id) => toggleListItem("dbLinks", id)}
              onTogglePull={(next) => {
                if (next) {
                  setOpenLinks(false);
                  void onPullLinks();
                } else {
                  setOpenLinks(false);
                  patch({ pullLinks: false, dbLinks: [] });
                }
              }}
            />
          </div>

          {pullError && (
            <p className="mt-2 text-[12px] font-medium text-[#b32020]">
              {pullError}
            </p>
          )}
        </Section>

        <Section title="Зоны и комнаты">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <FieldLabel>Рабочие места</FieldLabel>
              <Input
                type="number"
                min={0}
                value={form.workstations}
                onChange={(e) =>
                  patch({ workstations: Number(e.target.value) || 0 })
                }
                className="h-9 py-0"
              />
            </div>
            <div>
              <FieldLabel>Переговорные</FieldLabel>
              <Input
                type="number"
                min={0}
                value={form.meetingRooms}
                onChange={(e) =>
                  patch({ meetingRooms: Number(e.target.value) || 0 })
                }
                className="h-9 py-0"
              />
            </div>
            <div>
              <FieldLabel>Конференц-зал</FieldLabel>
              <Input
                type="number"
                min={0}
                max={1}
                value={form.conferenceRoom}
                onChange={(e) =>
                  patch({
                    conferenceRoom: Math.min(1, Number(e.target.value) || 0),
                  })
                }
                className="h-9 py-0"
              />
            </div>
            <div>
              <FieldLabel>Зоны отдыха</FieldLabel>
              <Input
                type="number"
                min={0}
                disabled={!form.lounge}
                value={form.loungeCount}
                onChange={(e) =>
                  patch({ loungeCount: Number(e.target.value) || 0 })
                }
                className="h-9 py-0 disabled:opacity-40"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[13px] text-fg">
              <input
                type="checkbox"
                className="h-4 w-4 accent-ink"
                checked={form.lounge}
                onChange={(e) => patch({ lounge: e.target.checked })}
              />
              Зона отдыха / lounge
            </label>
            <label className="flex items-center gap-2 text-[13px] text-fg">
              <input
                type="checkbox"
                className="h-4 w-4 accent-ink"
                checked={form.pantry}
                onChange={(e) => patch({ pantry: e.target.checked })}
              />
              Кухня / пантри
            </label>
            <label className="flex items-center gap-2 text-[13px] text-fg">
              <input
                type="checkbox"
                className="h-4 w-4 accent-ink"
                checked={form.reception}
                onChange={(e) => patch({ reception: e.target.checked })}
              />
              Ресепшен
            </label>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <FieldLabel>Кабинеты</FieldLabel>
              <button
                type="button"
                onClick={addPrivateOffice}
                className="cursor-pointer text-[12px] font-semibold text-fg underline-offset-2 hover:underline"
              >
                + Добавить
              </button>
            </div>
            {form.privateOffices.length === 0 && (
              <p className="text-[12px] text-fg-muted">
                Добавьте кабинет: выберите сотрудника и комнату (или «любой»)
              </p>
            )}
            {users.length === 0 && form.privateOffices.length > 0 && (
              <p className="mb-2 text-[12px] text-[#9a5b00]">
                Подтяните сотрудников с этажа — иначе некого выбрать
              </p>
            )}
            <div className="flex flex-col gap-2">
              {form.privateOffices.map((row) => {
                const picking = pickingRowId === row.id;
                return (
                  <div
                    key={row.id}
                    className={cn(
                      "rounded-sm border bg-white p-2.5",
                      picking ? "border-ink ring-1 ring-ink/20" : "border-line",
                    )}
                  >
                    <div className="mb-2 flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <FieldLabel>Сотрудник</FieldLabel>
                        <select
                          className="h-9 w-full cursor-pointer rounded-sm border border-line-strong bg-white px-2 text-[13px] text-fg outline-none focus:border-ink"
                          value={row.userId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const u = users.find((x) => x.id === id);
                            updatePrivateOffice(row.id, {
                              userId: id,
                              userName: u?.name || "",
                            });
                          }}
                        >
                          <option value="">Выберите из списка</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePrivateOffice(row.id)}
                        className="mt-5 cursor-pointer text-[11px] font-semibold text-[#b32020]"
                        aria-label="Удалить кабинет"
                      >
                        ✕
                      </button>
                    </div>

                    <FieldLabel>Кабинет на плане</FieldLabel>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className={cn(
                          "h-8 cursor-pointer rounded-sm border px-2.5 text-[12px] font-semibold",
                          !row.roomId && !picking
                            ? "border-ink bg-ink text-white"
                            : "border-line-strong bg-white text-fg-secondary hover:bg-muted",
                        )}
                        onClick={() => {
                          if (picking) onCancelRoomPick();
                          updatePrivateOffice(row.id, {
                            roomId: null,
                            roomName: null,
                          });
                        }}
                      >
                        Любой
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "h-8 cursor-pointer rounded-sm border px-2.5 text-[12px] font-semibold",
                          picking
                            ? "border-ink bg-ink text-white"
                            : "border-line-strong bg-white text-fg-secondary hover:bg-muted",
                        )}
                        onClick={() =>
                          picking
                            ? onCancelRoomPick()
                            : onStartRoomPick(row.id)
                        }
                      >
                        {picking ? "Отмена выбора…" : "На карте"}
                      </button>
                      {rooms.length > 0 && (
                        <select
                          className="h-8 min-w-[10rem] flex-1 cursor-pointer rounded-sm border border-line-strong bg-white px-2 text-[12px] text-fg outline-none focus:border-ink"
                          value={row.roomId || ""}
                          onChange={(e) => {
                            const id = e.target.value;
                            if (!id) {
                              updatePrivateOffice(row.id, {
                                roomId: null,
                                roomName: null,
                              });
                              return;
                            }
                            const room = rooms.find((r) => r.id === id);
                            if (picking) onCancelRoomPick();
                            updatePrivateOffice(row.id, {
                              roomId: id,
                              roomName: room?.name || "Комната",
                            });
                          }}
                        >
                          <option value="">Комната из списка…</option>
                          {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] text-fg-muted">
                      {picking
                        ? "Кликните комнату на плане слева"
                        : row.roomName
                          ? `Выбрано: ${row.roomName}`
                          : "Комнату выберет алгоритм"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        <Section title="Мебель и оборудование">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FURNITURE_OPTIONS.map((item) => {
              const checked = !!form.selectedFurniture[item.id];
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-sm border border-line px-2.5 py-2"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-ink"
                    checked={checked}
                    onChange={() => toggleFurniture(item.id)}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-fg">
                    {item.label}
                  </span>
                  <span className="shrink-0 text-[11px] text-fg-muted">макс.</span>
                  <Input
                    type="number"
                    min={0}
                    disabled={!checked}
                    value={form.furnitureLimits[item.id] ?? 0}
                    onChange={(e) =>
                      setFurnitureLimit(item.id, Number(e.target.value) || 0)
                    }
                    className="h-8 w-14 py-0 text-center text-[12px] disabled:opacity-40"
                  />
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-start gap-2 text-[13px] text-fg">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-ink"
                checked={form.allowExtraFurniture}
                onChange={(e) => {
                  const allowExtraFurniture = e.target.checked;
                  patch({
                    allowExtraFurniture,
                    strictCatalogOnly: allowExtraFurniture
                      ? false
                      : form.strictCatalogOnly,
                  });
                }}
              />
              <span>Разрешить дополнительную мебель (растения, диваны и т.п.)</span>
            </label>
            <label className="flex items-start gap-2 text-[13px] text-fg">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-ink"
                checked={form.strictCatalogOnly}
                onChange={(e) => {
                  const strictCatalogOnly = e.target.checked;
                  patch({
                    strictCatalogOnly,
                    allowExtraFurniture: strictCatalogOnly
                      ? false
                      : form.allowExtraFurniture,
                  });
                }}
              />
              <span>Только объекты из БД + выбранный каталог</span>
            </label>
          </div>
        </Section>

        <Section title="Стиль и предпочтения">
          <FieldLabel>Плотность рассадки</FieldLabel>
          <div className="mb-3 inline-flex gap-0.5 rounded-sm border border-line-strong bg-muted p-[3px]">
            {DENSITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  "h-8 min-w-[72px] cursor-pointer rounded-md px-2.5 text-[12px] font-semibold text-fg-secondary transition-colors",
                  form.density === opt.value && "bg-ink text-white",
                )}
                onClick={() => patch({ density: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {(
              [
                ["morePlants", "Больше растений"],
                ["moreLounge", "Больше зон отдыха"],
                ["moreFocusBooths", "Больше тихих зон / фокус-будок"],
                ["preferWindowLight", "Приоритет света у рабочих мест (у окон)"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 text-[13px] text-fg"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-ink"
                  checked={form[key]}
                  onChange={(e) => patch({ [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
        </Section>

        <Section title="Текстовое ТЗ">
          <textarea
            value={form.briefText}
            onChange={(e) => patch({ briefText: e.target.value })}
            rows={5}
            placeholder={
              "Минимум 2 переговорки с броню. Конференц на 12 человек у окна.\nКабинет для Иванова у северной стены. Остальное — open space."
            }
            className="w-full resize-y rounded-sm border border-line bg-white px-3 py-2.5 font-sans text-[13px] font-medium leading-snug text-fg outline-none placeholder:font-normal placeholder:text-fg-muted focus:border-fg focus:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]"
          />
          <div className="mt-2.5 flex gap-2">
            <Button
              variant="secondary"
              className="h-9 flex-1"
              disabled={!form.briefText.trim() || generating || !ollamaAvailable}
              onClick={onParseBrief}
              title={
                !ollamaAvailable
                  ? "Ollama недоступна"
                  : "Распознать текст через Ollama"
              }
            >
              Распознать текст
            </Button>
          </div>
          {form.parsedItems.length > 0 && (
            <div className="mt-3 rounded-sm border border-line bg-muted/50 p-2.5">
              <p className="mb-2 text-[12px] font-semibold text-fg-secondary">
                Распознанные пункты
              </p>
              <ul className="flex flex-col gap-1.5">
                {form.parsedItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 text-[12px] text-fg"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {report && (
          <Section title="Отчёт генерации">
            <div className="mb-3 inline-flex gap-0.5 rounded-sm border border-line-strong bg-muted p-[3px]">
              {(["A", "B", "C"] as PlanVariantId[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={cn(
                    "h-8 min-w-10 cursor-pointer rounded-md px-3 text-[12px] font-semibold text-fg-secondary",
                    variant === v && "bg-ink text-white",
                    v !== "A" && "opacity-40",
                  )}
                  onClick={() => v === "A" && onVariantChange(v)}
                  title={v !== "A" ? "Другие варианты — позже" : undefined}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="mb-2">
              <p className="mb-1 text-[12px] font-semibold text-fg-secondary">
                Запрошено → Размещено
              </p>
              <ul className="flex flex-col gap-1">
                {COUNT_LABELS.filter(
                  (row) =>
                    (report.requested?.[row.key] || 0) > 0 ||
                    (report.placed?.[row.key] || 0) > 0,
                ).map((row) => {
                  const req = report.requested?.[row.key] || 0;
                  const pl = report.placed?.[row.key] || 0;
                  const ok = pl >= req && req > 0;
                  const partial = pl > 0 && pl < req;
                  return (
                    <li
                      key={row.key}
                      className="flex items-center justify-between text-[12px] text-fg"
                    >
                      <span>{row.label}</span>
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          ok && "text-tag-green",
                          partial && "text-[#9a5b00]",
                          !ok && !partial && req > 0 && "text-[#b32020]",
                        )}
                      >
                        {pl} / {req}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            {report.created.length > 0 && (
              <div className="mb-2">
                <p className="mb-1 text-[12px] font-semibold text-fg-secondary">
                  Сделано
                </p>
                <ul className="flex flex-col gap-1">
                  {report.created.map((line) => (
                    <li
                      key={line}
                      className="text-[12px] text-fg before:mr-1.5 before:text-tag-green before:content-['•']"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.skipped.length > 0 && (
              <div className="mb-2">
                <p className="mb-1 text-[12px] font-semibold text-fg-secondary">
                  Не удалось
                </p>
                <ul className="flex flex-col gap-1">
                  {report.skipped.map((line) => (
                    <li
                      key={line}
                      className="text-[12px] text-[#9a5b00] before:mr-1.5 before:content-['•']"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.equipment && (
              <div className="mb-2">
                <p className="mb-1 text-[12px] font-semibold text-fg-secondary">
                  Оборудование (БД)
                </p>
                <ul className="mb-1 flex flex-col gap-1 text-[12px] text-fg">
                  <li>Выбрано в превью: {report.equipment.selected}</li>
                  <li>
                    Уже в комплектациях: {report.equipment.assignedToKits}
                  </li>
                  <li>Свободно для столов: {report.equipment.freeForKits}</li>
                </ul>
                <p className="text-[11px] leading-snug text-fg-muted">
                  {report.equipment.note}
                </p>
              </div>
            )}
            <div>
              <p className="mb-1 text-[12px] font-semibold text-fg-secondary">
                Нормы
              </p>
              <ul className="flex flex-col gap-1">
                {report.norms.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-center justify-between text-[12px] text-fg"
                  >
                    <span>{n.label}</span>
                    <span
                      className={cn(
                        "rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        n.status === "ok" && "bg-tag-green-bg text-tag-green",
                        n.status === "warn" && "bg-[#fff1d6] text-[#9a5b00]",
                        n.status === "error" && "bg-tag-red-bg text-[#b32020]",
                      )}
                    >
                      {n.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3 flex gap-2">
              <Button className="h-9 flex-1" onClick={onApply}>
                Применить
              </Button>
              <Button variant="secondary" className="h-9 flex-1" onClick={onUndo}>
                Отменить
              </Button>
            </div>
          </Section>
        )}
      </div>

      <div className="shrink-0 border-t border-line bg-elevated p-4">
        {validationError && (
          <p className="mb-2 text-[12px] font-medium leading-snug text-[#b32020]">
            {validationError}
          </p>
        )}
        {generating && (
          <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-fg-secondary">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-strong border-t-ink" />
            {GENERATION_PHASE_LABEL[phase] || "Генерация…"}
          </p>
        )}
        <Button
          className="h-10 w-full"
          disabled={generating}
          onClick={onGenerate}
        >
          {generating ? "Создание…" : "Создать план"}
        </Button>
      </div>
    </div>
  );
}

export default ParamsPanel;
