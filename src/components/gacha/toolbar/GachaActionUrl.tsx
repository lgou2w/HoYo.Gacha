import React from 'react'
import { useImmer } from 'use-immer'
import { clipboard } from '@tauri-apps/api'
import { resolveCurrency } from '@/interfaces/account'
import { useUpdateAccountGachaUrlFn } from '@/hooks/useStatefulAccount'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import PluginGacha from '@/utilities/plugin-gacha'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import LinkIcon from '@mui/icons-material/Link'
import AddLinkIcon from '@mui/icons-material/AddLink'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

export default function GachaActionUrl () {
  const { selectedAccount, alert } = useGachaLayoutContext()
  const { action } = resolveCurrency(selectedAccount.facet)
  const updateAccountGachaUrl = useUpdateAccountGachaUrlFn()
  const [{ busy }, produceState] = useImmer({
    busy: false
  })

  const handleFindGachaUrl = React.useCallback(async () => {
    produceState((draft) => {
      draft.busy = true
    })

    const { facet, uid, gameDataDir, gachaUrl } = selectedAccount
    try {
      const newGachaUrl = await PluginGacha.findGachaUrl(facet, uid, gameDataDir)
      if (newGachaUrl !== gachaUrl) {
        // Update gacha url only if it's changed
        await updateAccountGachaUrl(facet, uid, newGachaUrl)
      }
      alert(null, '读取链接成功！')
    } catch (e) {
      alert(e)
    } finally {
      produceState((draft) => {
        draft.busy = false
      })
    }
  }, [selectedAccount, alert, updateAccountGachaUrl, produceState])

  const handleCopyGachaUrl = React.useCallback(async () => {
    if (!selectedAccount.gachaUrl) {
      alert('链接不可用！请先尝试读取链接。')
    } else {
      try {
        await clipboard.writeText(selectedAccount.gachaUrl)
        alert(null, '链接已复制到剪切板！')
      } catch (e) {
        alert(e)
      }
    }
  }, [selectedAccount, alert])

  return (
    <Stack direction="row" gap={2}>
      <TextField variant="outlined" size="small"
        label={`${action}链接`} placeholder={`${action}链接`}
        value={selectedAccount.gachaUrl || ''}
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
        onClick={handleFindGachaUrl}
        disabled={busy}
      >
        读取链接
      </Button>
    </Stack>
  )
}
