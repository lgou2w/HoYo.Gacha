import React from 'react'
import { dialog } from '@tauri-apps/api'
import { AccountFacet } from '@/interfaces/account'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import { useRefetchGachaRecordsFn } from '@/hooks/useGachaRecordsQuery'
import PluginGacha from '@/utilities/plugin-gacha'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import FileUploadIcon from '@mui/icons-material/FileUpload'

export default function GachaActionImport () {
  const { selectedAccount, alert } = useGachaLayoutContext()
  const [busy, setBusy] = React.useState(false)
  const refetchGachaRecords = useRefetchGachaRecordsFn()

  const handleImportGachaRecords = React.useCallback(async () => {
    if (selectedAccount.facet !== AccountFacet.Genshin) {
      alert(null, '暂只支持导入原神祈愿记录！')
      return
    }

    setBusy(true)
    try {
      const file = await dialog.open({
        title: '请选择要导入的祈愿记录文件：',
        directory: false,
        multiple: false,
        filters: [{ name: 'UIGF Gacha Logs - Genshin Impact', extensions: ['json'] }]
      })
      if (typeof file === 'string') {
        const changes = await PluginGacha.importUIGFGachaRecords(
          selectedAccount.facet,
          selectedAccount.uid,
          file
        )
        setBusy(false)
        alert(null, `祈愿记录导入成功：${changes}（忽略重复）`)
        await refetchGachaRecords(selectedAccount.facet, selectedAccount.uid)
      }
    } catch (e) {
      alert(e)
      setBusy(false)
    }
  }, [selectedAccount, alert, setBusy])

  return (
    <Box>
      <Tooltip placement="bottom" title="导入祈愿" arrow>
        <IconButton onClick={handleImportGachaRecords} disabled={busy} sx={{
          bgcolor: (theme) => theme.palette.action.hover
        }}>
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
