/* eslint-disable no-multi-spaces, comma-spacing */

import React from 'react'
import { Routes, Route, RouteProps } from 'react-router-dom'
import PageIndex from '@/pages/index'
import PageAccount from '@/pages/account'
import PageGacha from '@/pages/gacha'
import PageSetting from '@/pages/setting'

const routes: RouteProps[] = [
  { path: '/'       , element: <PageIndex />   },
  { path: '/account', element: <PageAccount /> },
  { path: '/gacha'  , element: <PageGacha />   },
  { path: '/setting', element: <PageSetting /> }
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
