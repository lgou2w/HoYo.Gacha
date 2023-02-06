import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { styled, alpha } from '@mui/material/styles'
import { OverridableComponent } from '@mui/material/OverridableComponent'
import Drawer from '@mui/material/Drawer'
import Toolbar from '@mui/material/Toolbar'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Button, { ButtonTypeMap } from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import HomeIcon from '@mui/icons-material/Home'
import GroupIcon from '@mui/icons-material/Group'
import StarIcon from '@mui/icons-material/Star'
import SettingsIcon from '@mui/icons-material/Settings'

const Width = 100
const Navs = [
  { title: '首页', href: '/', icon: <HomeIcon /> },
  { title: '账号', href: '/account', icon: <GroupIcon /> },
  { title: '祈愿', href: '/gacha', icon: <StarIcon /> }
]

export default function AppSidebar () {
  return (
    <Drawer variant="permanent" sx={{
      width: Width,
      flexShrink: 0,
      bgcolor: 'white',
      '& .MuiDrawer-paper': {
        width: Width,
        boxSizing: 'border-box'
      }
    }}>
      <Toolbar sx={{ marginX: 'auto' }} variant="dense" disableGutters>
        LOGO
      </Toolbar>
      <Divider />
      <NavList />
    </Drawer>
  )
}

function NavList () {
  return (
    <Box component="nav" display="flex" flexDirection="column" height="100%" padding={1.5} sx={{
      '& > .MuiButtonBase-root': {
        marginBottom: 1
      }
    }}>
      {Navs.map((nav, i) => (
        <NavItem key={i} {...nav} />
      ))}
      <Box marginTop="auto">
        <NavItem href="/setting" title="设置" icon={<SettingsIcon />} />
      </Box>
    </Box>
  )
}

function NavItem ({ title, href, icon }: typeof Navs[number]) {
  const location = useLocation()
  return (
    <NavButton component={Link} to={href} activated={location.pathname === href} fullWidth>
      {icon}
      <Typography>{title}</Typography>
    </NavButton>
  )
}

const NavButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'activated'
})<{ activated: boolean }>(({ theme, activated }) => ({
  color: 'inherit',
  paddingX: 0,
  paddingY: theme.spacing(0.5),
  display: 'inline-flex',
  flexDirection: 'column',
  '& .MuiSvgIcon-root': {
    fontSize: '2rem'
  },
  ...(activated && {
    color: theme.palette.primary.main,
    bgcolor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity + 0.05),
    '&:hover': {
      bgcolor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity + 0.05)
    }
  })
})) as OverridableComponent<ButtonTypeMap<{ activated: boolean }>>
