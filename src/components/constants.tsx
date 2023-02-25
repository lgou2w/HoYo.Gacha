import React from 'react'
import HomeIcon from '@mui/icons-material/Home'
import GroupIcon from '@mui/icons-material/Group'
import StarIcon from '@mui/icons-material/Star'

export const SidebarWidth = '100px'
export const SidebarNavs = [
  { title: '首页', href: '/', icon: <HomeIcon /> },
  { title: '账号', href: '/account', icon: <GroupIcon /> },
  { title: '祈愿', href: '/gacha', icon: <StarIcon /> }
]

export const MainTitle = 'Genshin Gacha'
export const NavbarRouteTitles: Record<string, string> = {
  '/': '首页',
  '/account': '账号',
  '/gacha': '祈愿',
  '/setting': '设置'
}
