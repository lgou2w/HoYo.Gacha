import React from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import GachaTabOverviewGridCards from './grid-cards'
import GachaTabOverviewTooltips from './tooltips'
import { Account } from '@/interfaces/settings'
import { GroupedGachaLogs } from '@/hooks/useGachaLogsQuery'
import dayjs from '@/utilities/dayjs'

export interface GachaTabOverviewProps {
  account: Account
  data: GroupedGachaLogs
}

export default function GachaTabOverview (props: GachaTabOverviewProps) {
  const { account, data: { namedValues, total, firstTime, lastTime } } = props
  return (
    <Stack gap={2}>
      <Typography variant="subtitle2" color="grey.600">
        <Typography component="span" variant="inherit">最近祈愿记录更新日期：</Typography>
        <Typography component="span" variant="inherit">
          {account.lastGachaUpdated
            ? dayjs(account.lastGachaUpdated).format('llll')
            : '无'}
        </Typography>
      </Typography>
      <GachaTabOverviewGridCards values={namedValues} />
      <GachaTabOverviewTooltips total={total} firstTime={firstTime} lastTime={lastTime} />
    </Stack>
  )
}
