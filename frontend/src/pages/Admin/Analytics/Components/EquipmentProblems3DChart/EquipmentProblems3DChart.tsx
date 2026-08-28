import React from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import "echarts-gl";

const EquipmentProblems3DChart = ({ equipment }) => {
  const officeSet = new Set();
  const typeSet = new Set();
  const officeTypeProblemMap = {};

  equipment.forEach((item) => {
    const office = item.office?.name || "Не указан";
    const type = item.type || "Неизвестно";
    const problems = item.problems?.length || 0;

    officeSet.add(office);
    typeSet.add(type);

    if (!officeTypeProblemMap[office]) {
      officeTypeProblemMap[office] = {};
    }

    if (!officeTypeProblemMap[office][type]) {
      officeTypeProblemMap[office][type] = 0;
    }

    officeTypeProblemMap[office][type] += problems;
  });

  const offices = Array.from(officeSet);
  const types = Array.from(typeSet);

  const data = [];

  offices.forEach((office, xIndex) => {
    types.forEach((type, yIndex) => {
      const count = officeTypeProblemMap[office][type] || 0;
      data.push([xIndex, yIndex, count]);
    });
  });

  const option = {
    tooltip: {
      formatter: (params) => {
        const [x, y, z] = params.value;
        return `
          <b>Офис:</b> ${offices[x]}<br/>
          <b>Тип:</b> ${types[y]}<br/>
          <b>Проблем:</b> ${z}
        `;
      },
    },
    viewControl: {
      autoRotate: false,
    },
    visualMap: {
      max: Math.max(...data.map((d) => d[2]), 1),
      inRange: {
        color: ["#A8DADC", "#457B9D", "#1D3557"],
      },
    },
    xAxis3D: {
      type: "category",
      name: "Офис",
      data: offices,
    },
    yAxis3D: {
      type: "category",
      name: "Тип оборудования",
      data: types,
    },
    zAxis3D: {
      type: "value",
      name: "Проблемы",
    },
    grid3D: {
      boxWidth: 120,
      boxDepth: 80,
      viewControl: {
        autoRotate: true,
      },
      light: {
        main: {
          intensity: 1.2,
          shadow: true,
        },
        ambient: {
          intensity: 0.3,
        },
      },
    },
    series: [
      {
        type: "bar3D",
        data,
        shading: "lambert",
        label: {
          show: false,
        },
        itemStyle: {
          opacity: 0.9,
        },
      },
    ],
  };

  return (
    <div>
      <ReactECharts
        option={option}
        style={{ height: "600px", width: "800px", margin: "0 auto" }}
        echarts={echarts}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default EquipmentProblems3DChart;
