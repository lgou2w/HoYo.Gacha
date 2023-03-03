import React from 'react'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import AccountList from '@/components/account/account-list'
import AddAccountAction from '@/components/account/add-account-action'
import AccountDebugActions from '@/components/account/debug-actions'

export default function AccountPage () {
  return (
    <Stack className="page page-account" gap={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography component="span" variant="button" color="grey.600">点击以切换账号</Typography>
        {import.meta.env.DEV && <AccountDebugActions />}
        <AddAccountAction />
      </Box>
      <AccountList />
    </Stack>
  )
}
