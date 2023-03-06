import React from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AccountActionAdd from './action-add'
import AccountActionDebug from './action-debug'

export default function AccountActionsBar () {
  return (
    <Stack flexDirection="row" justifyContent="space-between" alignItems="center">
      <Typography component="div" variant="button" color="grey.600">点击以切换账号</Typography>
      <AccountActionDebug />
      <AccountActionAdd />
    </Stack>
  )
}
