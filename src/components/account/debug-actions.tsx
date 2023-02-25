/* eslint-disable camelcase */

import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useStatefulSettings } from '@/hooks/useStatefulSettings'

// HACK: Development only
// See : hooks/useStatefulSettings.tsx

export default function AccountDebugActions () {
  const { __debug__clear_accounts, __debug__reload_accounts } = useStatefulSettings()
  return (
    <Box marginX={2}>
      <Button variant="outlined" size="small" color="error"
        onClick={() => __debug__clear_accounts?.()} sx={{ marginRight: 1 }}>清空账号</Button>
      <Button variant="outlined" size="small" color="success"
        onClick={() => __debug__reload_accounts?.()}>重载账号</Button>
    </Box>
  )
}
