import React from "react";
import GachaChartCalendar from "@/components/gacha/chart/GachaChartCalendar";
import GachaChartPie from "@/components/gacha/chart/GachaChartPie";
import Stack from "@mui/material/Stack";

export default function GachaChart() {
  return (
    <Stack>
      <GachaChartCalendar />
      <GachaChartPie />
    </Stack>
  );
}
