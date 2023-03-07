import React, { useCallback, useMemo, useState } from 'react'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import LinkIcon from '@mui/icons-material/Link'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AddLinkIcon from '@mui/icons-material/AddLink'
import { Account } from '@/interfaces/settings'
import useStatefulSettings from '@/hooks/useStatefulSettings'
import Commands from '@/utilities/commands'
import { clipboard } from '@tauri-apps/api'
import { Actions, GachaActionsCallback } from './types'

export interface GachaActionUrlProps extends GachaActionsCallback {
  account: Account
}

export default function GachaActionUrl (props: GachaActionUrlProps) {
  const { updateAccount } = useStatefulSettings()
  const [busy, setBusy] = useState(false)
  const gachaUrl = useMemo(() => props.account.gachaUrl || '', [props])

  const handleFetchGachaUrl = useCallback(() => {
    setBusy(true)
    const account = props.account
    Commands.findRecentGachaUrl({
      gameDataDir: account.gameDataDir,
      expectedUid: account.uid
    })
      .then((result) => updateAccount(account.uid, { gachaUrl: result.url }))
      .then(() => { props.onAction?.(null, Actions.UrlChange, '祈愿链接获取成功！') })
      .catch((error) => { props.onAction?.(error) })
      .finally(() => { setBusy(false) })
  }, [props, updateAccount, setBusy])

  const handleCopyGachaUrl = useCallback(() => {
    if (!gachaUrl) {
      props.onAction?.('祈愿链接不可用！请先尝试读取链接。')
    } else {
      clipboard
        .writeText(gachaUrl)
        .then(() => { props.onAction?.(null, Actions.UrlCopy, '祈愿链接已复制到剪切板！') })
        .catch((error) => { props.onAction?.(error) })
    }
  }, [props, gachaUrl])

  return (
    <Stack flexDirection="row" gap={2}>
      <TextField variant="outlined" size="small"
        label="祈愿链接" placeholder="祈愿链接"
        value={gachaUrl}
        sx={{ maxWidth: 210 }}
        InputProps={{
          readOnly: true,
          sx: { paddingX: 1 },
          startAdornment: (
            <InputAdornment position="start">
              <LinkIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleCopyGachaUrl} disabled={busy}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        startIcon={<AddLinkIcon />}
        onClick={handleFetchGachaUrl}
        disabled={busy}
      >
        读取链接
      </Button>
    </Stack>
  )
}
