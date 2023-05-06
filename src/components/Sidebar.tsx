import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { styled, alpha } from '@mui/material/styles'
import { OverridableComponent } from '@mui/material/OverridableComponent'
import Drawer from '@mui/material/Drawer'
import Toolbar from '@mui/material/Toolbar'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Button, { ButtonTypeMap } from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import HomeIcon from '@mui/icons-material/Home'
import StarIcon from '@mui/icons-material/Star'
import DirectionsSubwayIcon from '@mui/icons-material/DirectionsSubway'
import LogoSrc from '@/assets/images/Logo.png'

const SidebarWidth = '100px'

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

const Navs = [
  { title: '主页', href: '/', icon: <HomeIcon /> },
  { title: '祈愿', href: '/genshin', icon: <StarIcon /> },
  { title: '跃迁', href: '/starrail', icon: <DirectionsSubwayIcon /> }
]

function NavList () {
  return (
    <Box component={Stack} direction="column" spacing={1}>
      {Navs.map((nav, i) => (
        <NavListItem key={i} {...nav} />
      ))}
    </Box>
  )
}

function NavListItem ({ title, href, icon }: typeof Navs[number]) {
  const location = useLocation()
  return (
    <NavListItemButton component={Link} to={href} activated={location.pathname === href} fullWidth>
      {icon}
      <Typography variant="body1" fontWeight="bold">
        {title}
      </Typography>
    </NavListItemButton>
  )
}

const NavListItemButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'activated'
})<{ activated: boolean }>(({ theme, activated }) => ({
  color: 'inherit',
  paddingX: 0,
  paddingY: theme.spacing(0.5),
  display: 'inline-flex',
  flexDirection: 'column',
  '& .MuiSvgIcon-root': { fontSize: '2rem' },
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
