import React, { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import SaveAltIcon from '@mui/icons-material/SaveAlt'
import AssistantIcon from '@mui/icons-material/Assistant'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import { Account } from '@/interfaces/settings'
import Commands from '@/utilities/commands'
import { dialog } from '@tauri-apps/api'
import type { Props as GachaActionsProps } from './gacha-actions'

interface Props {
  account: Account
  onSuccess?: GachaActionsProps['onSuccess']
  onError?: GachaActionsProps['onError']
  disabled?: boolean
}

export default function GachaExtAction (props: Props) {
  return (
    <Box display="inline-flex" marginLeft={2}>
      <Stack spacing={1} direction="row">
        <GachaExtActionImport {...props} />
        <GachaExtActionExport {...props} />
      </Stack>
    </Box>
  )
}

function GachaExtActionImport (props: Props) {
  const [busy, setBusy] = useState(false)
  const handleImportGachaLogs = useCallback(async () => {
    setBusy(true)
    try {
      const file = await dialog.open({
        title: '请选择要导入的祈愿记录文件：',
        directory: false,
        multiple: false,
        filters: [{ name: 'UIGF Gacha Logs', extensions: ['json'] }]
      })
      if (typeof file === 'string') {
        const changes = await Commands.importGachaLogsByUID({
          uid: props.account.uid,
          file
        })
        props.onSuccess?.('gacha-import', `祈愿记录导入成功：${changes}（忽略重复）`)
      }
    } catch (error) {
      props.onError?.(error as string | Error)
    } finally {
      setBusy(false)
    }
  }, [props, setBusy])

  return (
    <Box>
      <Tooltip title="导入祈愿" PopperProps={{ modifiers: [{ name: 'offset', options: { offset: [0, -8] } }] }}>
        <IconButton
          onClick={handleImportGachaLogs}
          disabled={props.disabled || busy}
          sx={{ bgcolor: (theme) => theme.palette.action.hover }}
        >
          <FileUploadIcon />
        </IconButton>
      </Tooltip>
      <Backdrop open={busy} sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'rgba(0, 0, 0, 0.65)',
        color: 'white'
      }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress color="info" />
          <Typography variant="h6" sx={{ marginTop: 2 }}>
            正在导入祈愿记录中，请稍候...
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  )
}

function GachaExtActionExport (props: Props) {
  const [busy, setBusy] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const handleClose = () => { setAnchorEl(null) }
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleExportGachaLogs = useCallback(async (event: React.MouseEvent<HTMLElement>) => {
    const uigf = event.currentTarget.dataset.format === 'uigf'
    setAnchorEl(null)
    setBusy(true)
    try {
      const directory = await dialog.open({
        title: '请选择导出文件夹：',
        directory: true,
        multiple: false
      })
      if (typeof directory === 'string') {
        const exportFile = await Commands.exportGachaLogsByUID({
          uid: props.account.uid,
          directory,
          uigf
        })
        props.onSuccess?.('gacha-export', '祈愿记录导出成功：' + exportFile)
      }
    } catch (error) {
      props.onError?.(error as string | Error)
    } finally {
      setBusy(false)
    }
  }, [props, setAnchorEl, setBusy])

  return (
    <Box>
      <Tooltip title="导出祈愿" PopperProps={{ modifiers: [{ name: 'offset', options: { offset: [0, -8] } }] }}>
        <IconButton
          onClick={handleClick}
          disabled={props.disabled || busy}
          sx={{ bgcolor: (theme) => theme.palette.action.hover }}
        >
          <SaveAltIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}
        MenuListProps={{ disablePadding: false }}
        slotProps={{ backdrop: { invisible: false } }}
      >
        <Typography variant="body2" paddingX={2} paddingY={1}>导出祈愿记录为：</Typography>
        <Divider sx={{ marginBottom: 1 }} />
        <MenuItem data-format="uigf" onClick={handleExportGachaLogs}>
          <ListItemIcon>
            <AssistantIcon />
          </ListItemIcon>
          <ListItemText>统一可交换标准 UIGF.J</ListItemText>
        </MenuItem>
        <MenuItem data-format="xlsx" onClick={handleExportGachaLogs}>
          <ListItemIcon>
            <ViewColumnIcon />
          </ListItemIcon>
          <ListItemText>Excel 工作簿 UIGF.W</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}
