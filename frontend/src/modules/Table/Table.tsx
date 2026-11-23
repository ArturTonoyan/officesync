import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ParamContextMenu from "../ParamContextMenu/ParamContextMenu";
import { server } from "../../api/apirequests";
import { cn } from "@utils/cn";

type SortDir = "asc" | "desc";

type HeaderCol = {
  name: string;
  key: string;
  type?: string;
};

type SortState = {
  key: string | null;
  dir: SortDir;
};

type MenuItem = { name: string; key: string; icon?: string };

const NON_SORTABLE = new Set(["image", "imageUrl", "contract"]);
const NON_FILTERABLE = new Set(["image", "imageUrl", "contract"]);

/** Узкие колонки: хедер не раздувает ширину, контент компактный */
const COMPACT_KEYS = new Set([
  "number",
  "cost",
  "maxWarranty",
  "currentWarranty",
  "users",
  "devices",
  "usersCount",
  "floorsCount",
  "area",
  "wear",
  "type",
  "state",
  "status",
  "urgency",
  "phone",
  "inventoryNumber",
  "dateStart",
  "dateEnd",
  "typeOwnership",
]);

/** Широкие текстовые колонки */
const WIDE_KEYS = new Set([
  "name",
  "office",
  "address",
  "adress",
  "description",
  "user",
  "director",
  "email",
]);

const STATUS_STYLES: Record<string, string> = {
  открыта: "bg-[#eef2ff] text-[#3b5bdb]",
  "в работе": "bg-[#fff4e5] text-[#d97706]",
  автозаявка: "bg-[#fff4e5] text-[#d97706]",
  завершена: "bg-[#e8f6ee] text-[#2d7a4f]",
  закрыта: "bg-[#e8f6ee] text-[#2d7a4f]",
  completed: "bg-[#e8f6ee] text-[#2d7a4f]",
  done: "bg-[#e8f6ee] text-[#2d7a4f]",
  pending: "bg-[#f3f4f6] text-[#6b7280]",
  canceled: "bg-[#fde8e8] text-[#c44545]",
  cancelled: "bg-[#fde8e8] text-[#c44545]",
};

function cellText(value: unknown) {
  if (value === 0) return "0";
  if (value == null || value === "") return "";
  return String(value);
}

function rowKey(row: Record<string, unknown>, index: number) {
  return String(row.id ?? `row-${index}`);
}

function compareValues(a: unknown, b: unknown, dir: SortDir) {
  const av = a ?? "";
  const bv = b ?? "";
  const an = typeof av === "number" ? av : Number(av);
  const bn = typeof bv === "number" ? bv : Number(bv);
  const bothNumeric =
    av !== "" &&
    bv !== "" &&
    !Number.isNaN(an) &&
    !Number.isNaN(bn) &&
    String(av).trim() !== "" &&
    String(bv).trim() !== "";

  let result = 0;
  if (bothNumeric) {
    result = an - bn;
  } else {
    result = String(av).localeCompare(String(bv), "ru", {
      numeric: true,
      sensitivity: "base",
    });
  }
  return dir === "asc" ? result : -result;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      width="10"
      height="12"
      viewBox="0 0 12 14"
      fill="none"
      aria-hidden
      className="mt-0.5 shrink-0"
    >
      <path
        d="M6 2.25L9.25 5.5H2.75L6 2.25Z"
        className={cn(
          active && dir === "asc" ? "fill-[#111111]" : "fill-[#c5c5ca]",
        )}
      />
      <path
        d="M6 11.75L2.75 8.5H9.25L6 11.75Z"
        className={cn(
          active && dir === "desc" ? "fill-[#111111]" : "fill-[#c5c5ca]",
        )}
      />
    </svg>
  );
}

/** Ширина хедера: минимум ~2 слова в ряд, без разрыва слов посередине */
function headerMinWidthPx(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 72;
  if (words.length === 1) {
    return Math.max(88, Math.ceil(words[0].length * 7.4) + 40);
  }
  const pair = `${words[0]} ${words[1]}`;
  return Math.max(128, Math.ceil(pair.length * 7.2) + 44);
}

function ColumnFilterMenu({
  open,
  onClose,
  columnKey,
  label,
  options,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  columnKey: string;
  label: string;
  options: string[];
  value: string;
  onChange: (key: string, next: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-[calc(100%+6px)] z-40 min-w-[200px] max-w-[280px] overflow-hidden rounded-xl border border-[#ebebef] bg-white py-1.5 shadow-[0_10px_30px_rgba(17,17,17,0.08)]"
    >
      <div className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9a9aa0]">
        {label}
      </div>
      <button
        type="button"
        className={cn(
          "block w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left text-[13px] text-[#111111] hover:bg-[#f7f7f8]",
          !value && "font-semibold",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onChange(columnKey, "");
          onClose();
        }}
      >
        Все
      </button>
      <div className="mx-2 my-1 h-px bg-[#f0f0f2]" />
      <div className="max-h-52 overflow-y-auto">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={cn(
              "block w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left text-[13px] leading-snug text-[#111111] hover:bg-[#f7f7f8]",
              value === opt && "bg-[#f7f7f8] font-semibold",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onChange(columnKey, opt);
              onClose();
            }}
          >
            <span className="block break-words whitespace-normal">{opt}</span>
          </button>
        ))}
        {!options.length && (
          <div className="px-3 py-2 text-[12px] text-[#9a9aa0]">Нет значений</div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const style =
    STATUS_STYLES[value.toLowerCase()] || "bg-[#f3f4f6] text-[#6b7280]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap",
        style,
      )}
    >
      {value}
    </span>
  );
}

function columnKind(key: string): "compact" | "wide" | "default" {
  if (COMPACT_KEYS.has(key)) return "compact";
  if (WIDE_KEYS.has(key)) return "wide";
  return "default";
}

function CellText({
  children,
  kind = "default",
}: {
  children: ReactNode;
  kind?: "compact" | "wide" | "default";
}) {
  return (
    <div
      className={cn(
        "box-border whitespace-normal break-normal",
        kind === "compact" && "max-w-[120px] whitespace-nowrap",
        kind === "wide" && "max-w-[300px] break-words",
        kind === "default" && "max-w-[200px] break-words",
      )}
    >
      {children}
    </div>
  );
}

const checkboxClass =
  "h-4 w-4 shrink-0 cursor-pointer rounded-[4px] border border-[#c8c8cc] accent-[#111111]";

/** Уровень износа для подсветки строки: >70 красный, >50 жёлтый */
function wearHighlight(
  row: Record<string, unknown>,
): "critical" | "warning" | undefined {
  const wear = parseFloat(String(row?.wear ?? "").replace("%", ""));
  if (Number.isFinite(wear)) {
    if (wear > 70) return "critical";
    if (wear > 50) return "warning";
  }
  if (row?.status === "Автозаявка") return "warning";
  return undefined;
}

const tableShellClass = cn(
  "scrollbar-thin relative box-border w-full max-h-[calc(100vh-220px)] overflow-auto rounded-2xl border border-[#ebebef] bg-white shadow-[0_8px_28px_rgba(17,17,17,0.05)]",
  "[&_table]:w-full [&_table]:min-w-full [&_table]:table-auto [&_table]:border-separate [&_table]:border-spacing-0 [&_table]:font-sans",
  "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10",
  "[&_th]:border-b [&_th]:border-[#efeff1] [&_th]:bg-[#f6f7f9] [&_th]:px-3 [&_th]:py-3 [&_th]:align-bottom [&_th]:text-left",
  "[&_th:first-child]:w-10 [&_th:first-child]:rounded-tl-2xl [&_th:first-child]:pl-4 [&_th:first-child]:align-middle",
  "[&_th:nth-child(2)]:w-10 [&_th:nth-child(2)]:align-middle",
  "[&_th:last-child]:w-10 [&_th:last-child]:rounded-tr-2xl [&_th:last-child]:pr-3 [&_th:last-child]:text-right [&_th:last-child]:align-middle",
  "[&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors",
  "[&_td]:overflow-visible [&_td]:border-b [&_td]:border-[#f1f1f3] [&_td]:bg-white [&_td]:px-3 [&_td]:py-3.5 [&_td]:text-left [&_td]:align-middle [&_td]:text-[13px] [&_td]:font-medium [&_td]:leading-[1.45] [&_td]:tracking-[-0.01em] [&_td]:text-[#1a1a1e]",
  // Подсветка износа — после базового bg-white, с !important как у selected
  "[&_tbody_tr[data-wear=warning]_td]:!bg-[#fef6e0]",
  "[&_tbody_tr[data-wear=critical]_td]:!bg-[#fde8e8]",
  "[&_tbody_tr:not([data-wear]):hover_td]:!bg-[#fafafb]",
  "[&_tbody_tr[data-selected=true]_td]:!bg-[#f4f6fb]",
  "[&_td:first-child]:pl-4",
  "[&_td:nth-child(2)]:text-[12px] [&_td:nth-child(2)]:font-semibold [&_td:nth-child(2)]:text-[#9a9aa0] [&_td:nth-child(2)]:whitespace-nowrap",
  "[&_td[name=phone]]:font-normal [&_td[name=phone]]:text-[#6b6b70]",
  "[&_td[name=email]]:font-normal [&_td[name=email]]:text-[#6b6b70]",
  "[&_td:last-child]:pr-3 [&_td:last-child]:text-right [&_td:last-child]:whitespace-nowrap",
  "[&_td[name=param]]:relative",
  "[&_tbody_tr:last-child_td]:border-b-0",
  "[&_tbody_tr:last-child_td:first-child]:rounded-bl-2xl",
  "[&_tbody_tr:last-child_td:last-child]:rounded-br-2xl",
);

function Table({
  tableData,
  paramMenu,
  tableHeader,
  funClick,
}: {
  prewData?: unknown;
  tableData: Record<string, unknown>[];
  setTableData?: (rows: Record<string, unknown>[]) => void;
  setModalShow?: (v: boolean) => void;
  paramMenu: MenuItem[] | unknown;
  tableHeader: HeaderCol[];
  funClick: (param: { key: string; row: Record<string, unknown> }) => void;
  direction?: unknown;
}) {
  const [openList, setOpenList] = useState<number | null>(null);
  const [sort, setSort] = useState<SortState>({ key: null, dir: "asc" });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterOpenKey, setFilterOpenKey] = useState<string | null>(null);

  const dataColumns = useMemo(
    () => (tableHeader || []).slice(1),
    [tableHeader],
  );

  const menuItems = useMemo(
    () => (Array.isArray(paramMenu) ? (paramMenu as MenuItem[]) : []),
    [paramMenu],
  );
  const canBulkDelete = menuItems.some((item) => item.key === "delete");

  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of dataColumns) {
      if (NON_FILTERABLE.has(col.key)) continue;
      const values = new Set<string>();
      for (const row of tableData || []) {
        const text = cellText(row[col.key]).trim();
        if (text) values.add(text);
      }
      map[col.key] = [...values].sort((a, b) =>
        a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" }),
      );
    }
    return map;
  }, [dataColumns, tableData]);

  const displayedRows = useMemo(() => {
    let rows = [...(tableData || [])];

    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      rows = rows.filter(
        (row) => cellText(row[key]).toLowerCase() === value.toLowerCase(),
      );
    }

    if (sort.key) {
      rows.sort((a, b) => compareValues(a[sort.key!], b[sort.key!], sort.dir));
    }

    return rows;
  }, [tableData, filters, sort]);

  const displayedKeys = useMemo(
    () => displayedRows.map((row, i) => rowKey(row, i)),
    [displayedRows],
  );

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set<string>();
      for (const key of prev) {
        if (displayedKeys.includes(key)) next.add(key);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [displayedKeys]);

  const allSelected =
    displayedKeys.length > 0 &&
    displayedKeys.every((key) => selected.has(key));
  const someSelected = selected.size > 0 && !allSelected;

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const toggleSort = (key: string) => {
    if (NON_SORTABLE.has(key)) return;
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" };
    });
  };

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const clearFilters = () => setFilters({});

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(displayedKeys));
  };

  const toggleRow = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const bulkDelete = () => {
    if (!canBulkDelete || !selected.size) return;
    const rows = displayedRows.filter((row, i) =>
      selected.has(rowKey(row, i)),
    );
    rows.forEach((row) => funClick({ key: "delete", row }));
    clearSelection();
  };

  const getTdData = (key: string, row: Record<string, unknown>) => {
    if (key === "imageUrl" || key === "image") {
      const src = row[key];
      return src && !String(src).includes("null") ? (
        <img
          className="h-10 w-10 rounded-lg border border-[#ebebef] object-cover"
          src={String(src)}
          alt="img"
          onClick={() => {
            const link = document.createElement("a");
            link.href = String(src);
            link.target = "_blank";
            link.click();
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="font-normal text-[#9a9aa0]">Нет фото</span>
      );
    }
    if (key === "contract") {
      return row[key] ? (
        <span
          className="text-[#3d6b9a] underline-offset-2 hover:underline"
          onClick={() => {
            const link = document.createElement("a");
            link.href = `${server}/${row[key]}`;
            link.target = "_blank";
            link.click();
          }}
        >
          {String(row[key])}
        </span>
      ) : (
        <span className="font-normal text-[#9a9aa0]">Нет файла</span>
      );
    }

    if (key === "status" && row[key]) {
      return <StatusBadge value={String(row[key])} />;
    }

    if (key === "urgency" && row[key]) {
      const urgency = String(row[key]);
      const style =
        urgency.toLowerCase().includes("срочн") ||
        urgency.toLowerCase().includes("urgent")
          ? "bg-[#fde8e8] text-[#c44545]"
          : urgency.toLowerCase().includes("низк") ||
              urgency.toLowerCase().includes("low")
            ? "bg-[#f3f4f6] text-[#6b7280]"
            : "bg-[#fff4e5] text-[#d97706]";
      return (
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold",
            style,
          )}
        >
          {urgency}
        </span>
      );
    }

    const kind = columnKind(key);
    if (row[key] === 0) return <CellText kind={kind}>0</CellText>;
    return row[key] ? (
      <CellText kind={kind}>{row[key] as ReactNode}</CellText>
    ) : (
      <span className="font-normal text-[#9a9aa0]">—</span>
    );
  };

  const isEmpty = !displayedRows.length;
  const indexHeader = tableHeader?.[0];

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {(activeFilterCount > 0 || sort.key || selected.size > 0) && (
        <div className="flex flex-wrap items-center gap-2.5 text-[12px] text-[#6b6b70]">
          <span className="rounded-full bg-white px-3 py-1.5 shadow-[0_1px_3px_rgba(17,17,17,0.04)]">
            Показано{" "}
            <strong className="font-semibold text-[#111111]">
              {displayedRows.length}
            </strong>{" "}
            из {tableData?.length || 0}
          </span>

          {selected.size > 0 && (
            <>
              <span className="rounded-full bg-[#111111] px-3 py-1.5 font-semibold text-white">
                Выбрано: {selected.size}
              </span>
              {canBulkDelete && (
                <button
                  type="button"
                  className="cursor-pointer rounded-full border-0 bg-[#fde8e8] px-3 py-1.5 text-[12px] font-semibold text-[#c44545] transition hover:bg-[#fadada]"
                  onClick={bulkDelete}
                >
                  Удалить выбранные
                </button>
              )}
              <button
                type="button"
                className="cursor-pointer rounded-full border-0 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#111111] shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition hover:bg-[#f7f7f8]"
                onClick={clearSelection}
              >
                Снять выбор
              </button>
            </>
          )}

          {activeFilterCount > 0 && (
            <button
              type="button"
              className="cursor-pointer rounded-full border-0 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#111111] shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition hover:bg-[#f7f7f8]"
              onClick={clearFilters}
            >
              Сбросить фильтры
            </button>
          )}
          {sort.key && (
            <button
              type="button"
              className="cursor-pointer rounded-full border-0 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#111111] shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition hover:bg-[#f7f7f8]"
              onClick={() => setSort({ key: null, dir: "asc" })}
            >
              Сбросить сортировку
            </button>
          )}
        </div>
      )}

      <div className={tableShellClass}>
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  aria-label="Выбрать все"
                />
              </th>
              <th>
                <span className="text-[12px] font-semibold tracking-[-0.01em] text-[#6b6b70]">
                  {indexHeader?.name || "№"}
                </span>
              </th>
              {dataColumns.map((col) => {
                const sortable = !NON_SORTABLE.has(col.key);
                const filterable = !NON_FILTERABLE.has(col.key);
                const isSorted = sort.key === col.key;
                const hasFilter = Boolean(filters[col.key]);
                const kind = columnKind(col.key);
                const minW = headerMinWidthPx(col.name);
                return (
                  <th
                    key={col.key}
                    style={{ minWidth: minW }}
                    className={cn(
                      "relative",
                      kind === "compact" && "w-[1%]",
                      kind === "wide" && "min-w-[220px]",
                    )}
                  >
                    <div className="inline-flex max-w-full items-start gap-1">
                      <button
                        type="button"
                        title={
                          filterable
                            ? hasFilter
                              ? `Фильтр: ${filters[col.key]}`
                              : "Фильтр"
                            : undefined
                        }
                        className={cn(
                          "inline-flex max-w-full border-0 bg-transparent p-0 text-left text-[12px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#6b6b70] transition",
                          filterable && "cursor-pointer hover:text-[#111111]",
                          !filterable && "cursor-default",
                          (isSorted || hasFilter) && "text-[#111111]",
                        )}
                        onClick={() => {
                          if (!filterable) return;
                          setFilterOpenKey((prev) =>
                            prev === col.key ? null : col.key,
                          );
                        }}
                      >
                        <span className="whitespace-normal break-normal hyphens-none">
                          {col.name}
                        </span>
                      </button>
                      {sortable && (
                        <button
                          type="button"
                          title="Сортировка"
                          className="inline-flex shrink-0 cursor-pointer border-0 bg-transparent p-0 hover:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterOpenKey(null);
                            toggleSort(col.key);
                          }}
                        >
                          <SortIcon active={isSorted} dir={sort.dir} />
                        </button>
                      )}
                    </div>
                    {filterable && (
                      <ColumnFilterMenu
                        open={filterOpenKey === col.key}
                        onClose={() => setFilterOpenKey(null)}
                        columnKey={col.key}
                        label={col.name}
                        options={filterOptions[col.key] || []}
                        value={filters[col.key] || ""}
                        onChange={setFilter}
                      />
                    )}
                  </th>
                );
              })}
              <th name="param">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!isEmpty &&
              displayedRows.map((row, indexRow) => {
                const key = rowKey(row, indexRow);
                const isChecked = selected.has(key);
                return (
                  <tr
                    key={key}
                    data-selected={isChecked}
                    data-wear={wearHighlight(row)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={isChecked}
                        onChange={() => toggleRow(key)}
                        aria-label={`Выбрать строку ${indexRow + 1}`}
                      />
                    </td>
                    <td>{indexRow + 1}</td>
                    {dataColumns.map((columnKey) => {
                      const kind = columnKind(columnKey.key);
                      return (
                        <td
                          name={columnKey.key}
                          key={columnKey.key}
                          className={cn(
                            kind === "compact" && "w-[1%] whitespace-nowrap",
                            kind === "wide" && "min-w-[200px]",
                          )}
                        >
                          {getTdData(columnKey.key, row)}
                        </td>
                      );
                    })}
                    <td name="param">
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent text-[#9a9aa0] transition hover:bg-[#f3f3f5] hover:text-[#111111]"
                        onClick={() =>
                          setOpenList(openList === indexRow ? null : indexRow)
                        }
                        aria-label="Действия"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          aria-hidden
                        >
                          <circle cx="3.5" cy="8" r="1.25" />
                          <circle cx="8" cy="8" r="1.25" />
                          <circle cx="12.5" cy="8" r="1.25" />
                        </svg>
                      </button>
                      <ParamContextMenu
                        openList={openList === indexRow}
                        setOpenList={setOpenList}
                        paramMenu={paramMenu}
                        funClick={funClick}
                        row={row}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <strong className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
              {tableData?.length ? "Ничего не найдено" : "Пока ничего нет"}
            </strong>
            <span className="max-w-80 text-[13px] leading-snug text-[#6b6b70]">
              {tableData?.length
                ? "Сбросьте фильтры или измените условия поиска."
                : "Добавьте первую запись — она появится в этой таблице."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Table;
