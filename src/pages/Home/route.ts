import { createRoute } from '@tanstack/react-router'
import rootRoute from '@/pages/Root/route'
import Home from '.'

const homeRoute = createRoute({
  path: '/',
  getParentRoute: () => rootRoute,
  component: Home
})

export default homeRoute
