import React, { useCallback } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import StorageIcon from '@mui/icons-material/Storage'
import Commands from '@/utilities/commands'

export default function SettingSectionGeneral () {
  const handleOpenDataDir = useCallback(() => {
    Commands
      .openAppDataDir()
      .catch(console.error)
  }, [])

  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">数据目录</Typography>
        <Typography component="p" variant="body2">
          {'数据目录是存储设置、账号配置和数据库文件的位置。'}
          <br />
          {'其中包含了所有的账号信息，祈愿记录等数据。'}
          <Typography component="span" variant="inherit" color="error">
            切勿删除它们。
          </Typography>
        </Typography>
        <Box>
          <Button variant="outlined" size="small" color="error"
            startIcon={<StorageIcon />}
            onClick={handleOpenDataDir}
          >
            打开数据目录
          </Button>
        </Box>
      </Stack>
    </Stack>
  )
}
