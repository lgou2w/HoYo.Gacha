/* eslint-disable no-multi-spaces, comma-spacing */

import React from 'react'
import { Routes, Route, RouteProps } from 'react-router-dom'
import PageHome from '@/pages/home'
import PageGenshin from '@/pages/genshin'
import PageStarRail from '@/pages/starrail'

const routes: RouteProps[] = [
  { path: '/'       , element: <PageHome />   },
  { path: '/genshin', element: <PageGenshin /> },
  { path: '/starrail', element: <PageStarRail /> }
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
