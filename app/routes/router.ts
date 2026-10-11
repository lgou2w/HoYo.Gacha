import { createRouter } from '@tanstack/react-router'
import { createThemeStore } from '@/contexts/Theme/store'
import queryClient from '@/queryClient'
import gachaRoute from './Gacha/route'
import homeRoute from './Home/route'
import rootRoute from './Root/route'
import settingsRoute from './Settings/route'
import { MainScrollableAreaId } from './types'

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
  scrollRestoration: true,
  scrollToTopSelectors: [`#${MainScrollableAreaId}`],
  context: {
    queryClient,
    themeStore: createThemeStore(),
  },
})

// Tell TypeScript about the router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default router
