import { createRouter } from '@tanstack/react-router'
import gachaRoute from '@/pages/Gacha/route'
import homeRoute from '@/pages/Home/route'
import rootRoute from '@/pages/Root/route'
import settingsRoute from '@/pages/Settings/route'

const routeTree = rootRoute.addChildren([
  gachaRoute,
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
