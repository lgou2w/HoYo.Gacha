import React from 'react'
import { dialog } from '@tauri-apps/api'
import { AccountFacet } from '@/interfaces/account'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import PluginGacha from '@/utilities/plugin-gacha'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import SaveAltIcon from '@mui/icons-material/SaveAlt'
import AssistantIcon from '@mui/icons-material/Assistant'

export default function GachaActionExport () {
  const { selectedAccount, alert } = useGachaLayoutContext()
  const [busy, setBusy] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const handleClose = () => { setAnchorEl(null) }
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleExportGachaRecords = React.useCallback(async () => {
    if (selectedAccount.facet !== AccountFacet.Genshin) {
      alert(null, '暂只支持原神祈愿记录导入！')
      return
    }

    setAnchorEl(null)
    setBusy(true)
    try {
      const directory = await dialog.open({
        title: '请选择导出文件夹：',
        directory: true,
        multiple: false
      })
      if (typeof directory === 'string') {
        const exportFile = await PluginGacha.exportUIGFGachaRecords(
          selectedAccount.facet,
          selectedAccount.uid,
          directory
        )
        alert(null, '祈愿记录导出成功：' + exportFile)
      }
    } catch (e) {
      alert(e)
    } finally {
      setBusy(false)
    }
  }, [selectedAccount, alert, setBusy, setAnchorEl])

  return (
    <Box>
      <Tooltip placement="bottom" title="导出祈愿" arrow>
        <IconButton onClick={handleClick} disabled={busy} sx={{
          bgcolor: (theme) => theme.palette.action.hover
        }}>
          <SaveAltIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}
        MenuListProps={{ disablePadding: false }}
        slotProps={{ backdrop: { invisible: false } }}
      >
        <Typography variant="body2" paddingX={2} paddingY={1}>导出祈愿记录为：</Typography>
        <Divider sx={{ marginBottom: 1 }} />
        <MenuItem data-format="uigf" onClick={handleExportGachaRecords}>
          <ListItemIcon>
            <AssistantIcon />
          </ListItemIcon>
          <ListItemText>统一可交换标准 UIGF.J</ListItemText>
        </MenuItem>
        {/* <MenuItem data-format="xlsx" onClick={handleExportGachaLogs}>
          <ListItemIcon>
            <ViewColumnIcon />
          </ListItemIcon>
          <ListItemText>Excel 工作簿 UIGF.W</ListItemText>
        </MenuItem> */}
      </Menu>
    </Box>
  )
}
