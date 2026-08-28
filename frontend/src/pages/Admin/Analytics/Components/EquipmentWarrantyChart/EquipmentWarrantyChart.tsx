import ReactECharts from "echarts-for-react";

const MAX_EQUIPMENTS = 10; // настрой под свой максимум
const MAX_USERS = 10;

const calculateLoad = (floor) => {
  const equipmentCount = floor.eqipments?.length || 0;
  const usersCount = floor.users?.length || 0;

  // Вес оборудования 70%, пользователей 30%
  const equipmentLoad = Math.min(equipmentCount / MAX_EQUIPMENTS, 1) * 70;
  const usersLoad = Math.min(usersCount / MAX_USERS, 1) * 30;

  return equipmentLoad + usersLoad; // итог в процентах
};

const EquipmentWarrantyChart = ({ floors }) => {
  const data = floors?.map((floor) => ({
    name: floor?.office?.name + " " + floor.name,
    load: Math.round(calculateLoad(floor)),
  }));

  const option = {
    title: {
      text: "Загруженность этажей",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      formatter: "{b}: {c}%",
    },
    xAxis: {
      type: "category",
      data: data.map((floor) => floor.name),
      axisLabel: {
        rotate: 30,
        fontSize: 12,
      },
    },
    yAxis: {
      type: "value",
      max: 100,
      axisLabel: {
        formatter: "{value} %",
      },
      name: "Загрузка",
    },
    dataZoom: [
      {
        type: "slider", // ползунок снизу для скролла
        start: 0, // стартовое положение окна (0%)
        end: 30, // сколько процентов данных видно (30%)
        handleSize: 10,
        height: 20,
        bottom: 0,
      },
      {
        type: "inside", // поддержка масштабирования колесом мыши
        start: 0,
        end: 30,
      },
    ],
    series: [
      {
        data: data.map((floor) => floor.load),
        type: "bar",
        itemStyle: {
          color: "#5470C6",
        },
        barWidth: "50%",
      },
    ],
    grid: {
      left: "10%",
      right: "10%",
      bottom: "50px", // увеличил место для dataZoom
      containLabel: true,
    },
  };

  return (
    <ReactECharts option={option} style={{ height: 400, width: "100%" }} />
  );
};

export default EquipmentWarrantyChart;
