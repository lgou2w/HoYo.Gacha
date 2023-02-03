import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

export default function AppNavbar () {
  return (
    <AppBar position="absolute" color="inherit" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ paddingX: 2 }} disableGutters>
        <Typography component="h1" variant="h6" sx={{ flexGrow: 1 }} noWrap>
          原神祈愿
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
