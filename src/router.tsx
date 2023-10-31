import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Index from '@/routes/Index'
import Root from '@/routes/Root'
import ErrorPage from './ErrorPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Index /> }
    ]
  }
])

export default router
