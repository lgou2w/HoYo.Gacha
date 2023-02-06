import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import AddAccount from '../components/account/add-account'
import AccountList from '../components/account/account-list'

export default function AccountPage () {
  return (
    <Box className="page page-account">
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography component="span" variant="button" color="grey.600">点击以切换账号</Typography>
        <AddAccount />
      </Box>
      <AccountList />
    </Box>
  )
}
