import React from 'react'
import Stack from '@mui/material/Stack'
import GachaTabChartCalendar from './chart-calendar'
import GachaTabChartPie from './chart-pie'
import { GroupedGachaLogs } from '@/hooks/useGachaLogsQuery'

export interface GachaTabChartProps {
  data: GroupedGachaLogs
}

export default function GachaTabChart (props: GachaTabChartProps) {
  return (
    <Stack gap={2}>
      <GachaTabChartCalendar data={props.data} />
      <GachaTabChartPie data={props.data} />
    </Stack>
  )
}
