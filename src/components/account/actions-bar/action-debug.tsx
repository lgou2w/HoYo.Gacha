/* eslint-disable camelcase */

import React from 'react'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import BugReportIcon from '@mui/icons-material/BugReport'
import useStatefulSettings from '@/hooks/useStatefulSettings'

export default function AccountActionDebug () {
  const {
    __debug__clear_accounts,
    __debug__reload_accounts
  } = useStatefulSettings()

  // HACK: Debug only
  if (import.meta.env.PROD) {
    return null
  }

  return (
    <Stack flexDirection="row" gap={2}>
      <Button
        variant="outlined"
        size="small"
        color="error"
        startIcon={<BugReportIcon />}
        onClick={() => __debug__clear_accounts?.()}
      >
        清空账号
      </Button>
      <Button
        variant="outlined"
        size="small"
        color="success"
        startIcon={<BugReportIcon />}
        onClick={() => __debug__reload_accounts?.()}
      >
        重载账号
      </Button>
    </Stack>
  )
}
