import React, { useCallback, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import LinkIcon from '@mui/icons-material/Link'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AddLinkIcon from '@mui/icons-material/AddLink'
import CachedIcon from '@mui/icons-material/Cached'
import { Account } from '@/interfaces/settings'
import { useStatefulSettings } from '@/hooks/useStatefulSettings'
import Commands from '@/utilities/commands'
import { clipboard } from '@tauri-apps/api'
import type { Props as GachaActionsProps } from './gacha-actions'

interface Props {
  account: Account
  onSuccess?: GachaActionsProps['onSuccess']
  onError?: GachaActionsProps['onError']
  disabled?: boolean
}

export default function GachaUrlAction (props: Props) {
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
      .then(() => { props.onSuccess?.('url-change', '祈愿链接获取成功！') })
      .catch((error) => { props.onError?.(error) })
      .finally(() => { setBusy(false) })
  }, [props, updateAccount, setBusy])

  const handleCopyGachaUrl = useCallback(() => {
    if (!gachaUrl) {
      props.onError?.('祈愿链接不可用！请先尝试读取链接。')
    } else {
      clipboard
        .writeText(gachaUrl)
        .then(() => { props.onSuccess?.('url-copy', '祈愿链接已复制到剪切板！') })
        .catch((error) => { props.onError?.(error) })
    }
  }, [gachaUrl])

  return (
    <Box display="inline-flex">
      <TextField variant="outlined" size="small"
        label="祈愿链接" placeholder="祈愿链接"
        value={gachaUrl}
        disabled={props.disabled}
        sx={{ maxWidth: 200 }}
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
              <IconButton size="small" onClick={handleCopyGachaUrl} disabled={props.disabled || busy}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <Stack marginLeft={2} spacing={2} direction="row">
        <Button variant="outlined" color="secondary" size="small"
          startIcon={<AddLinkIcon />}
          onClick={handleFetchGachaUrl}
          disabled={props.disabled || busy}
        >
          读取链接
        </Button>
        <Button variant="outlined" color="primary" size="small"
          startIcon={<CachedIcon />}
          disabled={props.disabled || busy}
        >
          更新祈愿
        </Button>
      </Stack>
    </Box>
  )
}
