import { createRouter } from '@tanstack/react-router'
import homeRoute from '@/pages/Home'
import rootRoute from '@/pages/Root'
import settingsRoute from '@/pages/Settings'

const routeTree = rootRoute.addChildren([
  homeRoute,
  settingsRoute
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default router
