/* eslint-disable no-multi-spaces, comma-spacing */

import React from 'react'
import { Routes, Route, RouteProps } from 'react-router-dom'
import IndexPage from '@/pages/index'
import AccountPage from '@/pages/account'
import GachaPage from '@/pages/gacha'
import SettingPage from '@/pages/setting'

const routes: RouteProps[] = [
  { path: '/'       , element: <IndexPage />   },
  { path: '/account', element: <AccountPage /> },
  { path: '/gacha'  , element: <GachaPage />   },
  { path: '/setting', element: <SettingPage /> }
]

export default function AppRoutes () {
  return (
    <Routes>
      {routes.map((props, i) => (
        <Route key={i} {...props} />
      ))}
    </Routes>
  )
}
