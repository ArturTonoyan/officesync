import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";

function parseTimeToHours(start, end) {
  const [sh, sm, ss] = start.split(":").map(Number);
  const [eh, em, es] = end.split(":").map(Number);
  return eh + em / 60 + es / 3600 - (sh + sm / 60 + ss / 3600);
}

function transformData(data) {
  const byDateRoom = {};
  const byRoom = {};
  const byUser = {};
  const timeHeatmap = {};

  data.forEach((entry) => {
    const { date, element, startTime, endTime, user } = entry;
    const room = element.name;
    const userName = `${user.surname} ${user.name}`;
    const hours = parseTimeToHours(startTime, endTime);
    const hourStart = parseInt(startTime.split(":")[0]);

    // By Date + Room
    if (!byDateRoom[date]) byDateRoom[date] = {};
    if (!byDateRoom[date][room]) byDateRoom[date][room] = 0;
    byDateRoom[date][room] += hours;

    // By Room Total
    if (!byRoom[room]) byRoom[room] = 0;
    byRoom[room] += hours;

    // By User
    if (!byUser[userName]) byUser[userName] = 0;
    byUser[userName] += hours;

    // Heatmap (room x hour)
    if (!timeHeatmap[room]) timeHeatmap[room] = {};
    if (!timeHeatmap[room][hourStart]) timeHeatmap[room][hourStart] = 0;
    timeHeatmap[room][hourStart] += 1;
  });

  const dates = Object.keys(byDateRoom).sort();
  const rooms = [...new Set(Object.values(data).map((d) => d.element.name))];

  const stackedSeries = rooms.map((room) => ({
    name: room,
    type: "bar",
    stack: "total",
    data: dates.map((date) => byDateRoom[date]?.[room] || 0),
  }));

  const pieData = Object.entries(byRoom).map(([name, value]) => ({
    name,
    value: value.toFixed(2),
  }));

  const userData = Object.entries(byUser).map(([name, value]) => ({
    name,
    value: value.toFixed(2),
  }));

  const heatmapData = [];
  rooms.forEach((room, y) => {
    for (let h = 0; h < 24; h++) {
      heatmapData.push([h, y, timeHeatmap[room]?.[h] || 0]);
    }
  });

  return { dates, rooms, stackedSeries, pieData, userData, heatmapData };
}

const tabTitles = [
  "По дням",
  "По помещениям",
  "По времени суток",
  "По пользователям",
];

const AnalyticsChart = ({ usageData }) => {
  const chartRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const chart = echarts.init(chartRef.current);
    const { dates, rooms, stackedSeries, pieData, userData, heatmapData } =
      transformData(usageData);

    const options = [
      // [0] По дням (stacked bar)
      {
        title: { text: "Нагрузка помещений по дням", left: "center" },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { top: 30 },
        xAxis: { type: "category", data: dates },
        yAxis: { type: "value", name: "Часы" },
        series: stackedSeries,
      },
      // [1] По помещениям (pie)
      {
        title: { text: "Общая загрузка помещений", left: "center" },
        tooltip: { trigger: "item", formatter: "{b}: {c} ч. ({d}%)" },
        legend: { bottom: 10 },
        series: [
          {
            type: "pie",
            radius: "60%",
            data: pieData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      },
      // [2] Heatmap по часам
      {
        title: { text: "Активность по времени суток", left: "center" },
        tooltip: {
          position: "top",
          formatter: (p) =>
            `${rooms[p.value[1]]}, ${p.value[0]}:00 — ${p.value[2]} раз`,
        },
        xAxis: {
          type: "category",
          data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        },
        yAxis: { type: "category", data: rooms },
        visualMap: {
          min: 0,
          max: 5,
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: "15%",
        },
        series: [
          {
            type: "heatmap",
            data: heatmapData,
            label: { show: false },
            emphasis: { itemStyle: { borderColor: "#333", borderWidth: 1 } },
          },
        ],
      },
      // [3] По пользователям (bar)
      {
        title: { text: "Использование по пользователям", left: "center" },
        tooltip: { trigger: "item", formatter: "{b}: {c} ч." },
        xAxis: { type: "category", data: userData.map((u) => u.name) },
        yAxis: { type: "value", name: "Часы" },
        series: [
          {
            type: "bar",
            data: userData.map((u) => u.value),
            itemStyle: { color: "#73C0DE" },
          },
        ],
      },
    ];

    chart.setOption(options[activeTab]);
    return () => chart.dispose();
  }, [usageData, activeTab]);

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        {tabTitles.map((title, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            style={{
              marginRight: 10,
              padding: "6px 12px",
              background: activeTab === idx ? "#5470C6" : "#eee",
              color: activeTab === idx ? "#fff" : "#000",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <div ref={chartRef} style={{ width: "100%", height: "500px" }} />
    </div>
  );
};

export default AnalyticsChart;
