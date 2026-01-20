import { createRouter } from '@tanstack/react-router'
import gachaRoute from '@/pages/Gacha/route'
import homeRoute from '@/pages/Home/route'
import rootRoute from '@/pages/Root/route'
import settingsRoute from '@/pages/Settings/route'
import queryClient from '@/queryClient'

const routeTree = rootRoute.addChildren([
  homeRoute,
  gachaRoute,
  settingsRoute,
])

const router = createRouter({
  routeTree,
  defaultGcTime: Infinity,
  defaultPendingMs: 0,
  defaultPendingMinMs: 0,
  context: {
    queryClient,
  },
})

// Tell TypeScript about the router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default router
