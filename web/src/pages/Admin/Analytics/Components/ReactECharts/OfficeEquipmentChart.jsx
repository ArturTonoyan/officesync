import { useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box,
  Typography,
} from "@mui/material";

const OfficeEquipmentChart = ({ data }) => {
  const [selectedOffice, setSelectedOffice] = useState("all");

  const officeOptions = data?.map((office) => ({
    label: office.name,
    value: office.name,
  }));

  const filteredData =
    selectedOffice === "all"
      ? data
      : data?.filter((office) => office.name === selectedOffice);

  const officeNames = filteredData?.map((office) => office.name);
  const equipmentCounts = filteredData?.map(
    (office) => office?.eqipments?.length
  );
  const totalCosts = filteredData?.map((office) =>
    office?.eqipments?.reduce((sum, eq) => sum + (eq.cost || 0), 0)
  );

  const option = {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["Количество оборудования", "Общая стоимость оборудования"],
    },
    xAxis: {
      type: "category",
      data: officeNames,
    },
    yAxis: [
      {
        type: "value",
        name: "Количество",
      },
      {
        type: "value",
        name: "Стоимость (₽)",
      },
    ],
    series: [
      {
        name: "Количество оборудования",
        type: "bar",
        data: equipmentCounts,
      },
      {
        name: "Общая стоимость оборудования",
        type: "line",
        yAxisIndex: 1,
        data: totalCosts,
      },
    ],
  };

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 4, maxWidth: 400 }}>
        <InputLabel id="office-select-label">Офис</InputLabel>
        <Select
          labelId="office-select-label"
          id="office-select"
          value={selectedOffice}
          label="Офис"
          onChange={(e) => setSelectedOffice(e.target.value)}
        >
          <MenuItem value="all">Все офисы</MenuItem>
          {officeOptions?.map((office) => (
            <MenuItem key={office.value} value={office.value}>
              {office.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <ReactECharts option={option} style={{ height: 400 }} />
    </Box>
  );
};

export default OfficeEquipmentChart;
