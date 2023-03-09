import React, { useCallback, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Backdrop from '@mui/material/Backdrop'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import CachedIcon from '@mui/icons-material/Cached'
import { Account, SettingsFn } from '@/interfaces/settings'
import { GachaLogItem } from '@/interfaces/models'
import { Actions, GachaActionsCallback } from './types'
import useGachaLogFetcherChannel from '@/hooks/useGachaLogFetcherChannel'

export interface GachaActionFetchProps extends GachaActionsCallback {
  account: Account
  updateAccount: SettingsFn['updateAccount']
  fetcherChannelTypesArguments?: Partial<Record<GachaLogItem['gachaType'], string>>
}

export default function GachaActionFetch (props: GachaActionFetchProps) {
  const gachaUrl = useMemo(() => props.account.gachaUrl || '', [props.account.gachaUrl])
  const [busy, setBusy] = useState(false)
  const { status, start } = useGachaLogFetcherChannel()

  const handleClick = useCallback(() => {
    if (!gachaUrl) {
      props.onAction?.('祈愿链接不可用！请先尝试读取链接。')
    } else {
      setBusy(true)
      start({
        channelName: 'gacha-logs-fetcher',
        gachaUrl,
        gachaTypesArguments: props.fetcherChannelTypesArguments,
        intoDatabase: true
      })
        .then(() => props.updateAccount(props.account.uid, { lastGachaUpdated: new Date().toISOString() }))
        .then(() => { props.onAction?.(null, Actions.GachaFetch, '祈愿记录更新成功！') })
        .catch((error) => { props.onAction?.(error) })
        .finally(() => { setBusy(false) })
    }
  }, [props, setBusy, gachaUrl])

  return (
    <Box display="inline-flex">
      <Button
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<CachedIcon />}
        onClick={handleClick}
        disabled={busy}
      >
        更新祈愿
      </Button>
      {busy && <Backdrop open={busy} sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'rgba(0, 0, 0, 0.75)',
        color: 'white'
      }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress color="info" />
          <Typography variant="h6" color="white" sx={{ marginTop: 2 }}>
            正在获取祈愿记录中，请稍候...
          </Typography>
          <Typography variant="body1" sx={{ marginTop: 1 }}>
            {status || 'idle'}
          </Typography>
        </Box>
      </Backdrop>}
    </Box>
  )
}
