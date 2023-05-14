import React from 'react'
import { resolveCurrency } from '@/interfaces/account'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'

export default function GachaOverviewLastUpdated () {
  const { facet, selectedAccount } = useGachaLayoutContext()
  const { action } = resolveCurrency(facet)
  const lastGachaUpdated = selectedAccount.properties?.lastGachaUpdated

  return (
    <Typography component="div" variant="subtitle2" color="grey.600">
      <Typography component="span" variant="inherit">{`最近${action}记录更新日期：`}</Typography>
      <Typography component="span" variant="inherit">
        {lastGachaUpdated
          ? dayjs(lastGachaUpdated).format('YYYY.MM.DD HH:mm:ss')
          : '无'}
      </Typography>
    </Typography>
  )
}
