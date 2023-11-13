import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import ErrorPage from '@/ErrorPage'
import Accounts from '@/routes/Accounts'
import Index from '@/routes/Index'
import Root from '@/routes/Root'
import Settings from '@/routes/Settings'
import GachaGenshin from '@/routes/gacha/Genshin'
import RootGacha from '@/routes/gacha/Root'
import GachaStarRail from '@/routes/gacha/StarRail'

const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    element: <Root />,
    children: [
      { path: '/', element: <Index />, index: true },
      { path: '/accounts', element: <Accounts /> },
      { path: '/settings', element: <Settings /> },
      {
        path: '/gacha',
        element: <RootGacha />,
        children: [
          { path: '/gacha/genshin', element: <GachaGenshin /> },
          { path: '/gacha/starrail', element: <GachaStarRail /> }
        ]
      }
    ]
  }
])

export default router
