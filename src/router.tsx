import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import ErrorPage from '@/ErrorPage'
import Accounts from '@/routes/Accounts'
import GachaGenshin from '@/routes/Gacha/Genshin'
import RootGacha from '@/routes/Gacha/Root'
import GachaStarRail from '@/routes/Gacha/StarRail'
import Home from '@/routes/Home'
import Root from '@/routes/Root'
import rootLoader from '@/routes/Root/loader'
import Settings from '@/routes/Settings'
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
