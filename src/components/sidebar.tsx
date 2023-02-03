import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Drawer from '@mui/material/Drawer'
import Toolbar from '@mui/material/Toolbar'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import HomeIcon from '@mui/icons-material/Home'
import StarIcon from '@mui/icons-material/Star'
import SettingsIcon from '@mui/icons-material/Settings'

const Width = 120
const Navs = [
  { title: '主页', href: '/', icon: <HomeIcon /> },
  { title: '祈愿', href: '/gacha', icon: <StarIcon /> }
]

export default function AppSidebar () {
  return (
    <Drawer variant="permanent" sx={{
      width: Width,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: Width,
        boxSizing: 'border-box'
      }
    }}>
      <Toolbar disableGutters />
      <Divider />
      <NavList />
      <NavSetting />
    </Drawer>
  )
}

function NavList () {
  const location = useLocation()
  return (
    <List component="nav" disablePadding>
      {Navs.map((nav, i) => (
        <ListItemButton key={i} component={Link} to={nav.href} sx={
          location.pathname === nav.href
            ? (theme) => ({
                color: theme.palette.primary.main,
                bgcolor: theme.palette.action.hover
              })
            : undefined
        }>
          <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>
            {nav.icon}
          </ListItemIcon>
          <ListItemText primary={nav.title} sx={{ margin: '0.1rem 0 0 0.5rem' }} />
        </ListItemButton>
      ))}
    </List>
  )
}

function NavSetting () {
  const href = '/setting'
  const location = useLocation()
  return (
    <Box display="flex" justifyContent="center" marginTop="auto" paddingBottom={1}>
      <IconButton component={Link} to={href} color={
        location.pathname === href
          ? 'primary'
          : 'default'
      }>
        <SettingsIcon fontSize="large" />
      </IconButton>
    </Box>
  )
}
