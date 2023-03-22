import React, { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'
import ConfirmDialog from '@/components/common/confirm-dialog'
import { AccountListItemContent } from '@/components/account/list/item'
import GachaTabOverview from '@/components/gacha/tab-overview'
import GachaTabData from '@/components/gacha/tab-data'
import GachaTabChart from '@/components/gacha/tab-chart'
import { Account } from '@/interfaces/settings'
import { GroupedGachaLogs } from '@/hooks/useGachaLogsQuery'
import useStatefulSettings from '@/hooks/useStatefulSettings'
import DomToImage from 'dom-to-image'

export interface GachaActionExtShareProps {
  account: Account
  data: GroupedGachaLogs
}

export default function GachaActionExtShare (props: GachaActionExtShareProps) {
  const { account, data } = props
  const { enkaNetwork } = useStatefulSettings()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hiddenUid, setHiddenUid] = useState(false)
  const elRef = React.createRef<HTMLDivElement>()
  const handleClick = () => { setOpen(true) }
  const handleCancel = () => { setOpen(false) }
  const handleShareGachaLogs = useCallback(() => {
    if (!elRef.current) return
    setBusy(true)
    const el = elRef.current
    el.focus()
    DomToImage
      .toBlob(el, {
        bgcolor: '#fff',
        width: el.scrollWidth,
        height: el.scrollHeight
      })
      .then((blob) => {
        const item = new ClipboardItem({ 'image/png': blob })
        return navigator.clipboard.write([item])
      })
      .then(() => {
        // TODO: alert
        console.log('ok')
      })
      .catch((err) => {
        // TODO: error handling
        console.error(err)
      })
      .finally(() => { setBusy(false) })
  }, [elRef, setBusy])

  return (
    <Box>
      <Tooltip title="分享祈愿" PopperProps={{ modifiers: [{ name: 'offset', options: { offset: [0, -8] } }] }}>
        <IconButton color="secondary" onClick={handleClick} sx={{
          bgcolor: (theme) => theme.palette.action.hover
        }}>
          <AddAPhotoIcon />
        </IconButton>
      </Tooltip>
      <ConfirmDialog open={open}
        title={
          <Stack flexDirection="row" alignItems="center">
            <Typography variant="h6">分享祈愿</Typography>
            <Box marginLeft="auto">
              <FormControlLabel
                label="隐藏 UID"
                slotProps={{ typography: { variant: 'button', sx: { userSelect: 'none' } } }}
                control={<Switch checked={hiddenUid} onChange={() => setHiddenUid(!hiddenUid)} disabled={busy} />}
              />
            </Box>
          </Stack>
        }
        onCancel={handleCancel}
        onConfirm={handleShareGachaLogs}
        PaperProps={{ sx: { maxWidth: 'calc(100% - 92px)', cursor: busy ? 'not-allowed' : 'auto' } }}
        ContentProps={{ dividers: true, sx: { padding: 0, pointerEvents: busy ? 'none' : 'auto' } }}
        CancelButtonProps={{ color: 'error', children: '关闭', disabled: busy }}
        ConfirmButtonProps={{ children: '创建分享', disabled: busy }}
        maxWidth={false}
        persistent
      >
        <Stack ref={elRef} gap={2} padding={3}>
          <Box sx={{
            '& > .MuiButtonBase-root': {
              width: '100%',
              pointerEvents: 'none',
              border: 2,
              borderColor: 'grey.300',
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
              padding: 2,
              '& .MuiListItemAvatar-root': {
                marginRight: 2,
                '& .MuiAvatar-root': {
                  width: 64,
                  height: 64
                }
              },
              '& .MuiListItemText-root': {
                '& .MuiListItemText-primary': { marginBottom: 1 },
                ...(hiddenUid && {
                  '& .MuiListItemText-secondary': { visibility: 'hidden', textIndent: -9999 },
                  '& .MuiListItemText-secondary::after': {
                    content: 'attr(data-uid-with-mask)',
                    visibility: 'visible',
                    textIndent: 0,
                    float: 'left'
                  }
                })
              }
            }
          }}>
            <AccountListItemContent account={account} enkaNetwork={enkaNetwork} />
          </Box>
          <GachaTabOverview account={account} data={data} shared />
          <GachaTabData data={data} />
          <GachaTabChart data={data} />
        </Stack>
      </ConfirmDialog>
    </Box>
  )
}
