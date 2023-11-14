import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import ErrorPage from '@/ErrorPage'
import Accounts from '@/routes/Accounts'
import Home from '@/routes/Home'
import Root from '@/routes/Root'
import rootLoader from '@/routes/Root/loader'
import Settings from '@/routes/Settings'
import GachaGenshin from '@/routes/gacha/Genshin'
import RootGacha from '@/routes/gacha/Root'
import GachaStarRail from '@/routes/gacha/StarRail'
import { queryClient } from '@/store'

const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    element: <Root />,
    loader: rootLoader(queryClient),
    children: [
      { path: '/', element: <Home />, index: true },
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
