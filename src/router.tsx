import { createRouter } from '@tanstack/react-router'
import GachaRoute from '@/pages/Gacha/route'
import HomeRoute from '@/pages/Home/route'
import RootRoute from '@/pages/Root/route'
import SettingsRoute from '@/pages/Settings/route'

const routeTree = RootRoute.addChildren([
  HomeRoute,
  SettingsRoute,
  GachaRoute,
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default router
