import React from 'react'
import Stack from '@mui/material/Stack'
import GachaTabChartPie from './chart-pie'
import { GroupedGachaLogs } from '@/hooks/useGachaLogsQuery'

export interface GachaTabChartProps {
  data: GroupedGachaLogs
}

export default function GachaTabChart (props: GachaTabChartProps) {
  return (
    <Stack gap={2}>
      <GachaTabChartPie data={props.data} />
    </Stack>
  )
}
