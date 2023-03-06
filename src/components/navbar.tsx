import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { MainTitle, NavbarRouteTitles, SidebarWidth } from '@/components/constants'
import AccountSelect from '@/components/account/select'

export default function AppNavbar () {
  const location = useLocation()
  const routeTitle = useMemo(() => NavbarRouteTitles[location.pathname] || location.pathname, [location])

  return (
    <>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{
        paddingLeft: SidebarWidth,
        borderBottom: 1,
        borderColor: (theme) => theme.palette.divider
      }}>
        <Toolbar sx={{ paddingX: 3 }} disableGutters>
          <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }} noWrap>
            {routeTitle} · {MainTitle}
          </Typography>
          <AccountSelect />
        </Toolbar>
      </AppBar>
      <Toolbar disableGutters />
    </>
  )
}
