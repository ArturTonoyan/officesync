import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

const DonutChart = ({ users }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Группируем пользователей по этажам (floor.name)
    const floorCounts = users.reduce((acc, user) => {
      const floorName = user.position || "Неизвестно";
      acc[floorName] = (acc[floorName] || 0) + 1;
      return acc;
    }, {});

    // Массив данных для диаграммы
    const data = Object.entries(floorCounts).map(([name, value], i) => ({
      name,
      value,
      // Для градиента возьмем два цвета по индексу, если не хватает — зациклить
      colorStart: `hsl(${(i * 60) % 360}, 70%, 60%)`,
      colorEnd: `hsl(${(i * 60 + 40) % 360}, 70%, 40%)`,
    }));

    const option = {
      title: {
        text: "Распределение сотрудников по должностям",
        textStyle: { fontSize: 18, fontWeight: "bold" },
        left: "center",
        top: 0,
      },
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} сотрудников ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "left",
        data: data.map((d) => d.name),
      },
      series: [
        {
          name: "Этаж",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "outside",
            formatter: "{b}\n{c} чел.",
          },
          labelLine: {
            show: true,
          },
          data: data.map((item) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                { offset: 0, color: item.colorStart },
                { offset: 1, color: item.colorEnd },
              ]),
            },
          })),
        },
      ],
    };

    chartInstance.current.setOption(option);

    // Чистим при размонтировании
    return () => {
      chartInstance.current?.dispose();
    };
  }, [users]);

  return (
    <div
      ref={chartRef}
      style={{
        width: "100%",
        height: "600px",
        maxWidth: "1000px",
        margin: "auto",
      }}
    />
  );
};

export default DonutChart;
