import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@store/hooks";
import {
  apiGetFloors,
  apiGetOffices,
  server,
} from "../../api/apirequests";
import {
  setSelectedFloor,
  setSelectedOffice,
} from "../../store/convaSlice/conva.Slice";
import {
  buildPlanPreviewUrl,
  hasSavedPlan,
} from "../Constructor/floorplan/planPreview";
import logoIcon from "@assets/images/logo/logo.svg";
import lupa from "@assets/images/icons/lupa.svg";
import { Button } from "@components/ui";
import { Input } from "@components/ui";
import { cn } from "@utils/cn";

type ViewMode = "all" | "offices" | "floors";

const categoryBtn =
  "cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-[#4a4a4e] transition-colors hover:border-[#c8c8cc] hover:bg-[#f7f7f8]";

const categoryBtnActive =
  "border-ink bg-ink text-white hover:border-ink hover:bg-ink";

const filterChip =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#3a3a3e] transition-colors hover:border-[#c8c8cc] hover:bg-[#f7f7f8]";

const filterChipActive =
  "border-[#c8c8cc] bg-[#ececed] text-fg hover:border-[#c8c8cc] hover:bg-[#ececed]";

const cardClass =
  "group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-line bg-elevated transition-colors hover:border-[#cfcfd4] hover:bg-[#fcfcfc]";

const openBtnClass =
  "h-[30px] px-2.5 text-xs group-hover:border-[#c8c8cc] group-hover:bg-bg";

const resolveMediaUrl = (image?: string | null) => {
  if (!image || image === "null" || String(image).includes("null")) return null;
  const value = String(image).trim();
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }
  return `${server}/${value.replace(/^\//, "")}`;
};

function PlanPreview({
  src,
  title,
  hasPlan,
}: {
  src: string | null;
  title: string;
  hasPlan?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = src && !broken;

  if (showImage) {
    return (
      <img
        className="pointer-events-none box-border block h-full w-full select-none object-contain p-2"
        src={src}
        alt={title}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-fg-muted">
      <svg
        className="h-[90px] w-[120px] opacity-85"
        viewBox="0 0 120 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect
          x="8"
          y="12"
          width="104"
          height="66"
          stroke="#c8c8cc"
          strokeWidth="2"
        />
        <path
          d="M8 45h104M60 12v66M30 12v66M90 12v66"
          stroke="#d8d8dc"
          strokeWidth="1.5"
        />
        <rect
          x="18"
          y="22"
          width="18"
          height="14"
          stroke="#b0b0b6"
          strokeWidth="1.5"
        />
        <rect
          x="70"
          y="52"
          width="24"
          height="16"
          stroke="#b0b0b6"
          strokeWidth="1.5"
        />
      </svg>
      <span className="text-xs">
        {hasPlan ? "Превью недоступно" : "План не сохранён"}
      </span>
    </div>
  );
}

function floorPreviewSrc(floor?: {
  image?: string | null;
  planData?: string | null;
} | null) {
  if (!floor) return null;
  return resolveMediaUrl(floor.image) || buildPlanPreviewUrl(floor.planData);
}

function Catalog() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useAppSelector((state) => state.user.user.data);

  const [view, setView] = useState<ViewMode>("floors");
  const [search, setSearch] = useState("");
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [selectedFloorNumbers, setSelectedFloorNumbers] = useState<number[]>([]);

  const { data: offices } = useQuery({
    queryKey: ["offices/all/id", user?.companyId],
    queryFn: () => apiGetOffices(user?.companyId),
    staleTime: 30_000,
    refetchOnMount: "always",
    enabled: !!user?.companyId,
  });

  const { data: floors } = useQuery({
    queryKey: ["floors/all/id", user?.companyId],
    queryFn: () => apiGetFloors(user?.companyId),
    staleTime: 30_000,
    refetchOnMount: "always",
    enabled: !!user?.companyId,
  });

  const officeList = offices?.data || [];
  const floorList = floors?.data || [];

  const floorNumbers = useMemo(() => {
    const nums = [
      ...new Set(
        floorList
          .map((f) => Number(f.number))
          .filter((n) => !Number.isNaN(n)),
      ),
    ];
    return nums.sort((a, b) => a - b);
  }, [floorList]);

  const toggleOffice = (id: string) => {
    setSelectedOffices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleFloorNumber = (n: number) => {
    setSelectedFloorNumbers((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
    );
  };

  const matchesSearch = (parts: (string | number | undefined | null)[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return parts.some((p) => String(p ?? "").toLowerCase().includes(q));
  };

  const officeCards = useMemo(() => {
    return officeList
      .filter((o) => {
        if (selectedOffices.length && !selectedOffices.includes(o.id)) {
          return false;
        }
        return matchesSearch([o.name, o.address, o.phone, o.email]);
      })
      .map((o) => {
        const officeFloors = floorList
          .filter((f) => f.officeId === o.id)
          .sort((a, b) => Number(a.number) - Number(b.number));
        const planFloor =
          officeFloors.find((f) => floorPreviewSrc(f)) || officeFloors[0];

        return {
          type: "office" as const,
          id: o.id,
          title: o.name || "Офис",
          subtitle: o.address || "Адрес не указан",
          image: floorPreviewSrc(planFloor),
          hasPlan: !!(
            planFloor &&
            (resolveMediaUrl(planFloor.image) || hasSavedPlan(planFloor.planData))
          ),
          badges: [
            `${o.floors?.length || officeFloors.length || 0} этаж.`,
            `${o.users?.length || 0} сотр.`,
            o.area ? `${o.area} м²` : null,
          ].filter(Boolean) as string[],
          accent: o.typeOwnership || "Офис",
          officeId: o.id,
          floorId: planFloor?.id || null,
          raw: o,
        };
      });
  }, [officeList, floorList, selectedOffices, search]);

  const floorCards = useMemo(() => {
    return floorList
      .filter((f) => {
        if (selectedOffices.length && !selectedOffices.includes(f.officeId)) {
          return false;
        }
        if (
          selectedFloorNumbers.length &&
          !selectedFloorNumbers.includes(Number(f.number))
        ) {
          return false;
        }
        const officeName =
          officeList.find((o) => o.id === f.officeId)?.name || "";
        return matchesSearch([f.name, f.number, officeName]);
      })
      .map((f) => {
        const office = officeList.find((o) => o.id === f.officeId);
        const maxFloor = Math.max(
          0,
          ...((office?.floors || floorList.filter((x) => x.officeId === f.officeId)).map(
            (x) => Number(x.number),
          ) || [0]),
        );
        return {
          type: "floor" as const,
          id: f.id,
          title: f.name || `Этаж ${f.number}`,
          subtitle: office?.name || "Офис не указан",
          image: floorPreviewSrc(f),
          hasPlan: !!(resolveMediaUrl(f.image) || hasSavedPlan(f.planData)),
          badges: [
            `${f.number} этаж${maxFloor ? ` из ${maxFloor}` : ""}`,
            `${f.users?.length || 0} сотр.`,
            `${f.eqipments?.length || 0} оборуд.`,
          ],
          accent: `этаж №${f.number}`,
          officeId: f.officeId,
          floorId: f.id,
          raw: f,
        };
      });
  }, [floorList, officeList, selectedOffices, selectedFloorNumbers, search]);

  const cards = useMemo(() => {
    if (view === "offices") return officeCards;
    if (view === "floors") return floorCards;
    return [...officeCards, ...floorCards];
  }, [view, officeCards, floorCards]);

  const openFloor = (officeId: string, floorId: string) => {
    if (offices?.data?.length) {
      dispatch(setSelectedOffice({ id: officeId, offices: offices.data }));
    }
    if (floors?.data?.length) {
      dispatch(setSelectedFloor({ id: floorId, floors: floors.data }));
    }
    navigate(`/constructor?office=${officeId}&floor=${floorId}`);
  };

  const openOffice = (officeId: string) => {
    const office = officeList.find((o) => o.id === officeId);
    const firstFloor = [...(office?.floors || [])].sort(
      (a, b) => a.number - b.number,
    )[0];

    if (firstFloor) {
      openFloor(officeId, firstFloor.id);
      return;
    }

    if (offices?.data?.length) {
      dispatch(setSelectedOffice({ id: officeId, offices: offices.data }));
    }
    navigate(`/constructor?office=${officeId}`);
  };

  const onCardClick = (card: (typeof cards)[number]) => {
    if (card.type === "floor" && card.officeId && card.floorId) {
      openFloor(card.officeId, card.floorId);
      return;
    }
    if (card.type === "office") {
      openOffice(card.id);
    }
  };

  const categories: { key: ViewMode; label: string }[] = [
    { key: "all", label: "все" },
    { key: "offices", label: "офисы" },
    { key: "floors", label: "этажи" },
  ];

  const hasFilters =
    selectedOffices.length > 0 || selectedFloorNumbers.length > 0;

  if (!user?.companyId) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <img className="mb-2 h-8 w-auto" src={logoIcon} alt="OfficeSync" />
        <h1 className="m-0 text-[26px] tracking-[-0.03em]">
          Каталог офисов и этажей
        </h1>
        <p className="m-0 max-w-[380px] text-sm leading-normal text-fg-secondary">
          Войдите в аккаунт, чтобы выбирать планы и работать в конструкторе.
        </p>
        <Button
          type="button"
          className="mt-2.5"
          onClick={() => navigate("/authorization")}
        >
          Войти
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 mb-1.5 text-[28px] font-bold tracking-[-0.035em] text-fg">
            Каталог
          </h1>
          <p className="m-0 max-w-[420px] text-sm leading-[1.45] text-fg-secondary">
            Выберите офис или этаж, чтобы открыть план и работать в конструкторе
          </p>
        </div>
        <div className="flex h-11 w-full max-w-[360px] min-w-[240px] flex-1 items-center rounded-xl border border-[#d8d8dc] bg-white px-3.5 shadow-[0_1px_3px_rgba(17,17,17,0.04)] transition-[border-color,box-shadow] focus-within:border-[#b8b8bc] focus-within:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]">
          <img
            src={lupa}
            alt=""
            className="mr-2.5 h-4 w-4 shrink-0 opacity-40"
          />
          <Input
            bare
            type="search"
            placeholder="Поиск по названию, адресу…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm font-normal"
          />
        </div>
      </header>

      <div className="mb-5 flex flex-col gap-3.5 rounded-xl border border-line bg-white px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
            Категория
          </span>
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              className={cn(categoryBtn, view === c.key && categoryBtnActive)}
              onClick={() => setView(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
            Офисы
          </span>
          {officeList.length === 0 ? (
            <span className="text-xs text-fg-muted">Нет офисов</span>
          ) : (
            officeList.map((o) => (
              <button
                key={o.id}
                type="button"
                className={cn(
                  filterChip,
                  selectedOffices.includes(o.id) && filterChipActive,
                )}
                onClick={() => toggleOffice(o.id)}
              >
                {o.name}
              </button>
            ))
          )}
        </div>

        {(view === "floors" || view === "all") && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
              Этаж
            </span>
            {floorNumbers.length === 0 ? (
              <span className="text-xs text-fg-muted">Нет этажей</span>
            ) : (
              floorNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cn(
                    filterChip,
                    selectedFloorNumbers.includes(n) && filterChipActive,
                  )}
                  onClick={() => toggleFloorNumber(n)}
                >
                  {n}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3.5 text-[13px] text-fg-secondary">
        <span>
          Найдено: <strong className="text-fg">{cards.length}</strong>
        </span>
        {hasFilters && (
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-semibold text-fg underline underline-offset-[3px]"
            onClick={() => {
              setSelectedOffices([]);
              setSelectedFloorNumbers([]);
            }}
          >
            Сбросить фильтры
          </button>
        )}
        <Button
          type="button"
          variant="secondary"
          className="ml-auto h-9 text-[13px]"
          onClick={() => navigate("/constructor")}
        >
          Открыть конструктор
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <strong className="text-base text-fg">Ничего не найдено</strong>
          <span className="max-w-[360px] text-[13px] leading-[1.45] text-fg-secondary">
            Измените фильтры или добавьте офисы и этажи в админке
          </span>
          <Button
            type="button"
            className="mt-2.5"
            onClick={() => navigate("/admin/offices")}
          >
            Перейти к офисам
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[18px] max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1">
          {cards.map((card) => (
            <article
              key={`${card.type}-${card.id}`}
              className={cardClass}
              onClick={() => onCardClick(card)}
            >
              <div className="flex items-center justify-between px-3.5 pt-3">
                <span className="rounded-md bg-bg px-2 py-1 text-[11px] font-semibold tracking-[0.02em] text-fg-secondary lowercase">
                  {card.type === "office" ? "офис" : "этаж"}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  className={openBtnClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCardClick(card);
                  }}
                >
                  Открыть
                </Button>
              </div>

              <div className="mx-3.5 mt-2.5 flex h-[220px] items-center justify-center overflow-hidden rounded-md border border-line bg-bg">
                <PlanPreview
                  src={card.image}
                  title={card.title}
                  hasPlan={card.hasPlan}
                />
              </div>

              <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-4">
                <h3 className="m-0 text-base font-bold tracking-[-0.02em] text-fg">
                  {card.title}
                </h3>
                <p className="m-0 text-sm font-semibold text-[#2f8f7a]">
                  {card.subtitle}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {card.badges.map((b) => (
                    <span
                      key={b}
                      className="rounded-full bg-bg px-2.5 py-[5px] text-[11px] font-medium text-fg-secondary"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Catalog;