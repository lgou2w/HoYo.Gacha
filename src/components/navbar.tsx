import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

const RouteTitles: Record<string, string> = {
  '/': '原神祈愿·首页',
  '/account': '账号',
  '/gacha': '祈愿',
  '/setting': '设置'
}

export default function AppNavbar () {
  const location = useLocation()
  const routeTitle = useMemo(() => RouteTitles[location.pathname] || location.pathname, [location])

  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{
      borderBottom: 1,
      borderColor: (theme) => theme.palette.divider
    }}>
      <Toolbar sx={{ paddingX: 2 }} variant="dense" disableGutters>
        <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }} noWrap>
          {routeTitle}
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
