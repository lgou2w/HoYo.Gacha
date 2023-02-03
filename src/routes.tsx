import React from 'react'
import { Routes, Route, RouteProps } from 'react-router-dom'
import IndexPage from './pages/index'
import GachaPage from './pages/gacha'
import SettingPage from './pages/setting'

const routes: RouteProps[] = [
  { path: '/', element: <IndexPage /> },
  { path: '/gacha', element: <GachaPage /> },
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
