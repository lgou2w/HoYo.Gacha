import React, { useCallback, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Backdrop from '@mui/material/Backdrop'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import CachedIcon from '@mui/icons-material/Cached'
import { Account } from '@/interfaces/settings'
import { GachaLogItem } from '@/interfaces/models'
import { useStatefulSettings } from '@/hooks/useStatefulSettings'
import useGachaLogFetcherChannel from '@/hooks/useGachaLogFetcherChannel'
import type { Props as GachaActionsProps } from './gacha-actions'

interface Props {
  account: Account
  gachaTypesArguments?: Partial<Record<GachaLogItem['gachaType'], string>>
  onSuccess?: GachaActionsProps['onSuccess']
  onError?: GachaActionsProps['onError']
  disabled?: boolean
}

export default function GachaFetchAction (props: Props) {
  const { updateAccount } = useStatefulSettings()
  const gachaUrl = useMemo(() => props.account.gachaUrl || '', [props.account.gachaUrl])
  const [busy, setBusy] = useState(false)
  const { status, start } = useGachaLogFetcherChannel()

  const handleClick = useCallback(() => {
    if (!gachaUrl) {
      props.onError?.('祈愿链接不可用！请先尝试读取链接。')
    } else {
      setBusy(true)
      start({
        channelName: 'gacha-logs-fetcher',
        gachaUrl,
        gachaTypesArguments: props.gachaTypesArguments,
        intoDatabase: true
      })
        .then(() => updateAccount(props.account.uid, { lastGachaUpdated: new Date().toISOString() }))
        .then(() => { props.onSuccess?.('gacha-fetch', '祈愿记录更新成功！') })
        .catch((error) => { props.onError?.(error) })
        .finally(() => { setBusy(false) })
    }
  }, [props, setBusy, gachaUrl])

  return (
    <Box display="inline-flex">
      <Button variant="outlined" color="primary" size="small"
        startIcon={<CachedIcon />}
        onClick={handleClick}
        disabled={props.disabled || busy}
        sx={{ marginLeft: 2 }}
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
