import React from 'react'
import Stack from '@mui/material/Stack'
import GachaTabDataSum from './data-sum'
import GachaTabDataHistory from './data-history'
import { GroupedGachaLogs } from '@/hooks/useGachaLogsQuery'

export interface GachaTabDataProps {
  data: GroupedGachaLogs
}

export default function GachaTabData (props: GachaTabDataProps) {
  const { data: { namedValues } } = props
  return (
    <Stack gap={2}>
      <GachaTabDataSum values={namedValues} />
      <GachaTabDataHistory values={namedValues} />
    </Stack>
  )
}
