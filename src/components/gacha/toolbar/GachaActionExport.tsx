import React from 'react'
import { dialog } from '@tauri-apps/api'
import { AccountFacet, resolveCurrency } from '@/interfaces/account'
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
  const { facet, selectedAccount, alert } = useGachaLayoutContext()
  const { action } = resolveCurrency(facet)
  const [busy, setBusy] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const handleClose = () => { setAnchorEl(null) }
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleExportGachaRecords = React.useCallback(async () => {
    setAnchorEl(null)
    setBusy(true)
    try {
      const directory = await dialog.open({
        title: '请选择导出的文件夹：',
        directory: true,
        multiple: false
      })
      if (typeof directory === 'string') {
        const exportFile = await PluginGacha.exportGachaRecords(
          selectedAccount.facet,
          selectedAccount.uid,
          directory
        )
        alert(null, `${action}记录导出成功：${exportFile}`)
      }
    } catch (e) {
      alert(e)
    } finally {
      setBusy(false)
    }
  }, [selectedAccount, alert, action, setBusy, setAnchorEl])

  return (
    <Box>
      <Tooltip placement="bottom" title={`导出${action}记录`} arrow>
        <IconButton onClick={handleClick} disabled={busy} sx={{
          bgcolor: (theme) => theme.palette.action.hover
        }}>
          <SaveAltIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}
        MenuListProps={{ disablePadding: false }}
        // FIXME: It can work. But why is the 'backdrop' property missing?
        // See: https://github.com/mui/material-ui/pull/37390#discussion_r1231771648
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        slotProps={{ root: { slotProps: { backdrop: { invisible: false } } } }}
      >
        <Typography variant="body2" paddingX={2} paddingY={1}>
          {`导出${action}记录为：`}
        </Typography>
        <Divider sx={{ marginBottom: 1 }} />
        <MenuItem onClick={handleExportGachaRecords}>
          <ListItemIcon>
            <AssistantIcon />
          </ListItemIcon>
          {{
            [AccountFacet.Genshin]: <ListItemText>UIGF 统一可交换祈愿记录标准 v2.2</ListItemText>,
            [AccountFacet.StarRail]: <ListItemText>SRGF 星穹铁道抽卡记录标准 v1.0</ListItemText>
          }[facet]}
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
