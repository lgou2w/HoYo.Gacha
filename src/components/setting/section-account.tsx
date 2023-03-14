import React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import ExternalLink from '@/components/common/external-link'
import useStatefulSettings from '@/hooks/useStatefulSettings'

export default function SettingSectionAccount () {
  const { showNameCard, toggleShowNameCard } = useStatefulSettings()
  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">名片</Typography>
        <Typography component="p" variant="body2">
          {'当启用名片展示，账号页面下数据项会额外从网络加载名片图片。'}
          <br />
          {'该图片资源来源于第三方 '}
          <ExternalLink href="https://Enka.Network" />
          {' 网站。'}
          {'启用它会消耗额外的网络数据流量。'}
        </Typography>
        <Box>
          <FormControlLabel
            label="启用名片展示"
            slotProps={{ typography: { variant: 'button', sx: { userSelect: 'none' } } }}
            control={<Switch checked={!!showNameCard} onChange={toggleShowNameCard} />}
          />
        </Box>
      </Stack>
    </Stack>
  )
}
