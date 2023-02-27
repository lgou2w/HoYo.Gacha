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
import FileUploadIcon from '@mui/icons-material/FileUpload'
import SaveAltIcon from '@mui/icons-material/SaveAlt'
import AssistantIcon from '@mui/icons-material/Assistant'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import { Account } from '@/interfaces/settings'
import Commands from '@/utilities/commands'
import { dialog } from '@tauri-apps/api'

interface Props {
  account: Account
  onSuccess?: (message?: string) => void
  onError?: (error: Error | string) => void
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
  return (
    <IconButton
      disabled={props.disabled}
      sx={{ bgcolor: (theme) => theme.palette.action.hover }}
    >
      <FileUploadIcon />
    </IconButton>
  )
}

function GachaExtActionExport (props: Props) {
  const [busy, setBusy] = useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
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
        props.onSuccess?.('祈愿记录导出成功：' + exportFile)
      }
    } catch (error) {
      props.onError?.(error as string | Error)
    } finally {
      setBusy(false)
    }
  }, [props, setAnchorEl, setBusy])

  return (
    <>
      <IconButton
        onClick={handleClick}
        disabled={props.disabled || busy}
        sx={{ bgcolor: (theme) => theme.palette.action.hover }}
      >
        <SaveAltIcon />
      </IconButton>
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
    </>
  )
}
