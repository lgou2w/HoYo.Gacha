import React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import ExternalLink from '@/components/common/external-link'
import useStatefulSettings from '@/hooks/useStatefulSettings'

export default function SettingSectionAccount () {
  const { enkaNetwork, toggleEnkaNetwork } = useStatefulSettings()
  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">
          {'第三方 '}
          <ExternalLink href="https://Enka.Network">Enka.Network</ExternalLink>
          {' 服务'}
        </Typography>
        <Typography component="p" variant="body2">
          {'当启用此服务表明你同意从网络获取你的账号基础信息。'}
          <br />
          {'这些数据包含昵称、头像、冒险等阶、签名、名片、角色展示信息等。'}
          <br />
          <Typography component="span" variant="body2" color="error.main">
            注意：在获取你的账号基础信息同时，数据也可能会被此第三方服务收集。
          </Typography>
        </Typography>
        <Box>
          <FormControlLabel
            label="启用服务"
            slotProps={{ typography: { variant: 'button', sx: { userSelect: 'none' } } }}
            control={<Switch checked={!!enkaNetwork} onChange={toggleEnkaNetwork} color="success" />}
          />
        </Box>
      </Stack>
    </Stack>
  )
}
