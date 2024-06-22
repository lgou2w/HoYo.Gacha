import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { queryClient } from '@/api/store'
import Accounts from '@/routes/Accounts'
import ErrorPage from '@/routes/ErrorPage'
import GachaBusiness from '@/routes/Gacha/Business'
import gachaBusinessLoader from '@/routes/Gacha/Business/loader'
import RootGacha from '@/routes/Gacha/Root'
import rootGachaLoader from '@/routes/Gacha/Root/loader'
import Home from '@/routes/Home'
import Root from '@/routes/Root'
import rootLoader from '@/routes/Root/loader'
import Settings from '@/routes/Settings'

const router = createBrowserRouter([
  {
    element: <Root />,
    loader: rootLoader(queryClient),
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <Home />, index: true },
      { path: '/accounts', element: <Accounts /> },
      { path: '/settings', element: <Settings /> },
      {
        path: '/gacha',
        element: <RootGacha />,
        loader: rootGachaLoader(queryClient),
        children: [
          {
            path: '/gacha/:business',
            element: <GachaBusiness />,
            loader: gachaBusinessLoader(queryClient)
          }
        ]
      }
    ]
  }
])

export default router
