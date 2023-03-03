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
import SettingsIcon from '@mui/icons-material/Settings'
import { SidebarWidth, SidebarNavs } from '@/components/constants'
import LogoSrc from '@/assets/images/Logo.png'

export default function AppSidebar () {
  return (
    <Drawer variant="permanent" sx={{
      width: SidebarWidth,
      flexShrink: 0,
      bgcolor: 'white',
      '& .MuiDrawer-paper': {
        width: SidebarWidth,
        boxSizing: 'border-box'
      }
    }}>
      <Toolbar disableGutters>
        <Logo />
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
      {SidebarNavs.map((nav, i) => (
        <NavItem key={i} {...nav} />
      ))}
      <Box marginTop="auto">
        <NavItem href="/setting" title="设置" icon={<SettingsIcon />} />
      </Box>
    </Box>
  )
}

function NavItem ({ title, href, icon }: typeof SidebarNavs[number]) {
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

const Logo = styled((props) => (
  <Box {...props}>
    <img src={LogoSrc} alt="logo" />
  </Box>
))(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  boxSizing: 'border-box',
  userSelect: 'none',
  '& img': {
    maxHeight: 64,
    width: 'auto',
    display: 'block',
    padding: theme.spacing(1, 0)
  }
}))
