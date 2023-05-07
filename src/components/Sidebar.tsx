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
import SettingsIcon from '@mui/icons-material/Settings'
import LogoSrc from '@/assets/images/Logo.png'

const SidebarWidth = '96px'

export default function Sidebar () {
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

type Nav = { title: string, href: string, icon?: React.ReactNode }

const Navs: Nav[] = [
  { title: '主页', href: '/', icon: <HomeIcon /> },
  { title: '祈愿', href: '/genshin', icon: <StarIcon /> },
  { title: '跃迁', href: '/starrail', icon: <DirectionsSubwayIcon /> }
]

const NavSetting: Nav =
  { title: '设置', href: '/setting', icon: <SettingsIcon /> }

function NavList () {
  return (
    <Box display="flex" flexDirection="column" height="100%" padding={1.5}>
      <Stack direction="column" spacing={2}>
        {Navs.map((nav, i) => (
          <NavListItem key={i} {...nav} />
        ))}
      </Stack>
      <Box marginTop="auto">
        <NavListItem {...NavSetting} />
      </Box>
    </Box>
  )
}

function NavListItem (props: Nav) {
  const { title, href, icon } = props
  const location = useLocation()
  return (
    <NavListItemButton component={Link} to={href} activated={location.pathname === href} fullWidth>
      {icon}
      <Typography>
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
    backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity + 0.05),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity + 0.05)
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
