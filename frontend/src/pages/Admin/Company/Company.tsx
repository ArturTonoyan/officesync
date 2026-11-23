import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import { Button, Input } from "@components/ui";
import { cn } from "@utils/cn";
import { inputs } from "./data";
import {
  apiCreateCompany,
  apiGetCompany,
  apiGetEquipments,
  apiGetFloors,
  apiGetOffices,
  apiGetProblems,
  apiGetUsers,
  apiUpdateCompany,
  server,
} from "../../../api/apirequests";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@store/hooks";

function Company({ funUpdUser, noedit }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(true);
  const user = useAppSelector((state) => state.user.user.data);
  const companyId = user?.companyId;

  useEffect(() => {
    setEditing(!!companyId);
  }, [companyId]);

  const [data, setData] = useState({
    name: "",
    phone: "",
    email: "",
    inn: "",
    image: null,
    imageUrl: null,
    adress: "",
  });

  const { status, data: query, refetch } = useQuery({
    queryKey: ["companies", companyId],
    queryFn: () => apiGetCompany(companyId),
    staleTime: 30_000,
    refetchOnMount: "always",
    enabled: !!companyId,
  });

  const { data: offices } = useQuery({
    queryKey: ["offices/all/id", companyId],
    queryFn: () => apiGetOffices(companyId),
    staleTime: 30_000,
    refetchOnMount: "always",
    enabled: !!companyId,
  });

  const { data: floors } = useQuery({
    queryKey: ["floors", companyId],
    queryFn: () => apiGetFloors(companyId),
    staleTime: 30_000,
    refetchOnMount: "always",
    enabled: !!companyId,
  });

  const { data: users } = useQuery({
    queryKey: ["users/all", companyId],
    queryFn: () => apiGetUsers(companyId),
    staleTime: 30_000,
    refetchOnMount: "always",
    enabled: !!companyId,
  });

  const { data: equipments } = useQuery({
    queryKey: ["equipments/all/id", companyId],
    queryFn: () => apiGetEquipments(companyId),
    staleTime: 30_000,
    refetchOnMount: "always",
    enabled: !!companyId,
  });

  const { data: problems } = useQuery({
    queryKey: ["problems/all", companyId],
    queryFn: () => apiGetProblems(companyId),
    staleTime: 30_000,
    refetchOnMount: "always",
    enabled: !!companyId,
  });

  useEffect(() => {
    if (query?.data) {
      setData({
        ...query.data,
        imageUrl: query.data?.image ? `${server}/${query.data.image}` : null,
      });
    }
  }, [query?.data]);

  const stats = useMemo(() => {
    const officeList = offices?.data || [];
    const floorList = floors?.data || [];
    const userList = users?.data || [];
    const equipmentList = equipments?.data || [];
    const problemList = problems?.data || [];

    const openProblems = problemList.filter(
      (p) => p.status !== "completed" && p.status !== "done" && p.status !== "закрыта"
    ).length;

    const broken = equipmentList.filter(
      (e) => e.state === "broken" || e.state === "неисправно" || e.state === "repair"
    ).length;

    return [
      {
        key: "offices",
        label: "Офисы",
        value: officeList.length,
        hint: `${floorList.length} этажей`,
        to: "/admin/offices",
      },
      {
        key: "users",
        label: "Сотрудники",
        value: userList.length,
        hint: "в компании",
        to: "/admin/users",
      },
      {
        key: "equipments",
        label: "Оборудование",
        value: equipmentList.length,
        hint: broken ? `${broken} на ремонте` : "в рабочем состоянии",
        to: "/admin/equipments",
      },
      {
        key: "problems",
        label: "Заявки",
        value: openProblems || problemList.length,
        hint: openProblems ? "открытых" : "всего",
        to: "/admin/problems",
      },
    ];
  }, [offices, floors, users, equipments, problems]);

  const quickActions = [
    { label: "Добавить офис", desc: "Новая локация", to: "/admin/offices" },
    { label: "Сотрудники", desc: "Штат и роли", to: "/admin/users" },
    { label: "Оборудование", desc: "Учёт техники", to: "/admin/equipments" },
    { label: "Заявки", desc: "Ремонт и ТО", to: "/admin/problems" },
    { label: "Конструктор", desc: "План этажа", to: "/constructor" },
    { label: "Аналитика", desc: "Все графики", to: "/admin/analytics" },
  ];

  const equipmentChartOption = useMemo(() => {
    const list = equipments?.data || [];
    const buckets = list.reduce(
      (acc, item) => {
        const state = (item.state || "ok").toLowerCase();
        if (state.includes("broken") || state.includes("неисправ") || state === "repair") {
          acc.broken += 1;
        } else if (state.includes("warn") || state.includes("износ") || state === "warning") {
          acc.warn += 1;
        } else {
          acc.ok += 1;
        }
        return acc;
      },
      { ok: 0, warn: 0, broken: 0 }
    );

    return {
      tooltip: { trigger: "axis" },
      grid: { left: 8, right: 8, top: 28, bottom: 8, containLabel: true },
      xAxis: {
        type: "category",
        data: ["Рабочее", "Внимание", "Неисправно"],
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#ededed" } },
        axisLabel: { color: "#9a9aa0", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: "#f0f0f1" } },
        axisLabel: { color: "#9a9aa0", fontSize: 11 },
      },
      series: [
        {
          type: "bar",
          barWidth: 28,
          data: [
            { value: buckets.ok, itemStyle: { color: "#2d7a4f", borderRadius: 0 } },
            { value: buckets.warn, itemStyle: { color: "#c9a227", borderRadius: 0 } },
            { value: buckets.broken, itemStyle: { color: "#c44545", borderRadius: 0 } },
          ],
        },
      ],
    };
  }, [equipments]);

  const staffChartOption = useMemo(() => {
    const list = users?.data || [];
    const byPosition = list.reduce((acc, u) => {
      const key = u.position || "Без должности";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const palette = ["#111111", "#6b6b70", "#9a9aa0", "#cfcfd4", "#3d6b9a", "#2d7a4f"];
    const entries = Object.entries(byPosition).slice(0, 6);
    const chartData =
      entries.length > 0
        ? entries.map(([name, value], i) => ({
            name,
            value,
            itemStyle: { color: palette[i % palette.length] },
          }))
        : [{ name: "Нет данных", value: 1, itemStyle: { color: "#ececed" } }];

    return {
      tooltip: {
        trigger: "item",
        formatter: entries.length ? "{b}: {c} ({d}%)" : "Нет сотрудников",
      },
      legend: {
        bottom: 0,
        left: "center",
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: "#6b6b70", fontSize: 11 },
      },
      series: [
        {
          type: "pie",
          radius: ["48%", "72%"],
          center: ["50%", "44%"],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 0, borderColor: "#fff", borderWidth: 2 },
          label: { show: false },
          data: chartData,
        },
      ],
    };
  }, [users]);

  const recentProblems = useMemo(() => {
    const list = [...(problems?.data || [])];
    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [problems]);

  const funChanegeData = (name, value) => {
    setData({ ...data, [name]: value });
  };

  const funSave = () => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("phone", data.phone);
    formData.append("email", data.email);
    formData.append("inn", data.inn);
    formData.append("adress", data.adress);
    if (data.image) formData.append("image", data.image);

    if (query?.data?.id) {
      apiUpdateCompany(formData, companyId).then((res) => {
        if (res.status === 200) {
          setEditing(true);
          refetch();
        }
      });
    } else {
      apiCreateCompany(formData).then((res) => {
        if (res.status === 201) {
          setEditing(true);
          refetch();
          funUpdUser?.();
        }
      });
    }
  };

  if (companyId && (status === "pending" || status === "loading")) {
    return <span>Загрузка...</span>;
  }

  const companyName = data.name || query?.data?.name || "Компания";

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-7 [&_h1]:m-0 [&_h1]:text-[28px] [&_h1]:font-bold [&_h1]:leading-[1.15] [&_h1]:tracking-[-0.035em] [&_h1]:text-fg max-[720px]:[&_h1]:text-2xl [&_h2]:m-0 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-fg">
      <header>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
          Обзор
        </p>
        <h1>{companyName}</h1>
        <p className="mt-2 text-[13px] leading-snug text-fg-secondary">
          Дашборд компании · метрики, графики и быстрые действия
        </p>
      </header>

      <section className="rounded-xl border border-line bg-white px-[18px] pb-5 pt-4 shadow-none">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2>{companyId ? "Реквизиты" : "Создайте компанию"}</h2>
          {!noedit && companyId && (
            <div className="flex flex-wrap gap-2.5">
              {editing ? (
                <Button
                  variant="secondary"
                  className="rounded-lg"
                  onClick={() => setEditing(false)}
                >
                  Редактировать
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    className="rounded-lg"
                    onClick={() => setEditing(true)}
                  >
                    Отменить
                  </Button>
                  <Button className="rounded-lg" onClick={funSave}>
                    Сохранить
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 max-[720px]:grid-cols-1">
          {inputs.map((item) => (
            <div key={item.key}>
              <span className="block pb-1.5 text-xs font-medium text-fg-muted">
                {item.name}
              </span>
              <div
                className={cn(
                  "w-full rounded-lg border border-line bg-elevated shadow-none transition-[border-color] focus-within:border-fg",
                  companyId &&
                    editing &&
                    "border-0 bg-transparent focus-within:border-0",
                )}
              >
                <Input
                  bare
                  type={item.type}
                  autoComplete="new-password"
                  readOnly={!!companyId && editing}
                  placeholder="Не указанно"
                  onChange={(e) => funChanegeData(item.key, e.target.value)}
                  value={data[item.key] || ""}
                  className={cn(
                    "rounded-lg px-3 py-[11px] text-sm font-medium shadow-none",
                    companyId && editing && "cursor-default p-0 font-semibold",
                  )}
                />
              </div>
            </div>
          ))}
          <div className="col-span-2 max-[720px]:col-span-1">
            <span className="block pb-1.5 text-xs font-medium text-fg-muted">
              Юридический адрес
            </span>
            <div
              className={cn(
                "w-full rounded-lg border border-line bg-elevated shadow-none transition-[border-color] focus-within:border-fg",
                companyId &&
                  editing &&
                  "border-0 bg-transparent focus-within:border-0",
              )}
            >
              <Input
                bare
                type="text"
                autoComplete="new-password"
                readOnly={!!companyId && editing}
                placeholder="Не указанно"
                onChange={(e) => funChanegeData("adress", e.target.value)}
                value={data.adress || ""}
                className={cn(
                  "rounded-lg px-3 py-[11px] text-sm font-medium shadow-none",
                  companyId && editing && "cursor-default p-0 font-semibold",
                )}
              />
            </div>
          </div>
        </div>
        {!noedit && !companyId && (
          <div className="mt-5 flex">
            <Button className="rounded-lg" onClick={funSave}>
              Создать компанию
            </Button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1">
        {stats.map((item) => (
          <button
            key={item.key}
            type="button"
            className="cursor-pointer rounded-xl border border-line bg-white px-[18px] py-4 text-left shadow-none transition-colors hover:border-[#d4d4d8] hover:bg-[#fafafa]"
            onClick={() => navigate(item.to)}
          >
            <span className="mb-2.5 block text-xs font-medium text-fg-muted">
              {item.label}
            </span>
            <strong className="block text-[28px] font-bold leading-none tracking-[-0.04em] text-fg">
              {item.value}
            </strong>
            <span className="mt-2 block text-xs text-fg-secondary">
              {item.hint}
            </span>
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-3 [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-xs [&_button]:font-semibold [&_button]:text-fg-secondary [&_button]:hover:text-fg [&_span]:text-xs [&_span]:text-fg-muted">
          <h2>Быстрые действия</h2>
          <span>Частые сценарии</span>
        </div>
        <div className="grid grid-cols-6 gap-2.5 max-[1100px]:grid-cols-3 max-[720px]:grid-cols-2">
          {quickActions.map((action) => (
            <button
              key={action.to}
              type="button"
              className="flex cursor-pointer flex-col items-start gap-1 rounded-xl border border-line bg-white px-3.5 pb-4 pt-3.5 text-left shadow-none transition-colors hover:border-[#d4d4d8] hover:bg-[#fafafa] [&_span]:text-xs [&_span]:leading-snug [&_span]:text-fg-muted [&_strong]:text-[13px] [&_strong]:font-semibold [&_strong]:tracking-[-0.01em] [&_strong]:text-fg"
              onClick={() => navigate(action.to)}
            >
              <strong>{action.label}</strong>
              <span>{action.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-[1.1fr_0.9fr] gap-4 max-[1100px]:grid-cols-1">
        <div className="flex min-h-[300px] flex-col rounded-xl border border-line bg-white px-[18px] pb-3 pt-4 shadow-none">
          <div className="flex items-center justify-between gap-3 [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-xs [&_button]:font-semibold [&_button]:text-fg-secondary [&_button]:hover:text-fg">
            <h2>Состояние оборудования</h2>
            <button type="button" onClick={() => navigate("/admin/equipments")}>
              Открыть
            </button>
          </div>
          <ReactECharts
            option={equipmentChartOption}
            style={{ height: 260, width: "100%" }}
            opts={{ renderer: "canvas" }}
          />
        </div>

        <div className="flex min-h-[300px] flex-col rounded-xl border border-line bg-white px-[18px] pb-3 pt-4 shadow-none">
          <div className="flex items-center justify-between gap-3 [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-xs [&_button]:font-semibold [&_button]:text-fg-secondary [&_button]:hover:text-fg">
            <h2>Сотрудники по должностям</h2>
            <button type="button" onClick={() => navigate("/admin/users")}>
              Открыть
            </button>
          </div>
          <ReactECharts
            option={staffChartOption}
            style={{ height: 260, width: "100%" }}
            opts={{ renderer: "canvas" }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white px-[18px] pb-3 pt-4 shadow-none">
        <div className="flex items-center justify-between gap-3 [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-xs [&_button]:font-semibold [&_button]:text-fg-secondary [&_button]:hover:text-fg">
          <h2>Последние заявки</h2>
          <button type="button" onClick={() => navigate("/admin/problems")}>
            Все заявки
          </button>
        </div>
        {recentProblems.length === 0 ? (
          <div className="flex min-h-[180px] flex-1 items-center justify-center text-[13px] text-fg-muted">
            Заявок пока нет
          </div>
        ) : (
          <ul className="m-0 mt-2 flex list-none flex-col p-0">
            {recentProblems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-b-0 [&_em]:pt-0.5 [&_em]:text-xs [&_em]:not-italic [&_em]:text-fg-muted [&_em]:whitespace-nowrap [&_span]:text-xs [&_span]:text-fg-secondary [&_strong]:mb-1 [&_strong]:block [&_strong]:max-w-80 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[13px] [&_strong]:font-semibold [&_strong]:tracking-[-0.01em] [&_strong]:text-fg"
              >
                <div>
                  <strong>{item.description || "Без описания"}</strong>
                  <span>
                    {item.urgency ? `Срочность: ${item.urgency}` : "Обычная"}
                    {item.status ? ` · ${item.status}` : ""}
                  </span>
                </div>
                <em>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("ru-RU")
                    : "—"}
                </em>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Company;
