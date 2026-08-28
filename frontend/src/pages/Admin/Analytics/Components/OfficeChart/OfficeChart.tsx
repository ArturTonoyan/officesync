import ReactECharts from "echarts-for-react";

const OfficeChart = ({ offices }) => {
  // Преобразуем офисы в дерево с оборудованием
  const treeData = {
    name: "Все офисы",
    children: offices.map((office) => ({
      name: office.name,
      children: office.floors.map((floor) => ({
        name: floor.name,
        children: [
          // Сотрудники этажа
          ...office.users
            .filter((user) => user.floorId === floor.id)
            .map((user) => ({
              name: `${user.surname} ${user.name} (${user.position})`,
            })),
          // Оборудование этажа
          ...(office.eqipments
            ?.filter((eq) => eq.floorId === floor.id)
            .map((eq) => ({
              name: `Оборудование: ${eq.name}`,
            })) || []),
        ],
      })),
    })),
  };

  const option = {
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
    },
    series: [
      {
        type: "tree",
        data: [treeData],
        top: "1%",
        left: "7%",
        bottom: "1%",
        right: "20%",
        symbolSize: 10,
        label: {
          position: "left",
          verticalAlign: "middle",
          align: "right",
          fontSize: 14,
        },
        leaves: {
          label: {
            position: "right",
            verticalAlign: "middle",
            align: "left",
          },
        },
        expandAndCollapse: false, // отключаем сворачивание
        initialTreeDepth: -1, // раскрыть все узлы сразу
        animationDuration: 550,
        animationDurationUpdate: 750,
      },
    ],
  };

  return (
    <ReactECharts option={option} style={{ height: "600px", width: "100%" }} />
  );
};

export default OfficeChart;
