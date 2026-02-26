import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext } from '@tanstack/react-router'
import AppCommands from '@/api/commands/app'
import { DatabaseThemeStore, ThemeStore } from '@/contexts/Theme'
import { ensureNavbarVisibleQueryData } from '@/pages/Root/queries/business'
import RootLayout from './layout'

export interface RootRouteContext {
  queryClient: QueryClient
}

const themeStore: ThemeStore = new DatabaseThemeStore()

const rootRoute = createRootRouteWithContext<RootRouteContext>()({
  shouldReload: false,
  component: RootLayout,
  async loader () {
    console.debug('===== Root Route Loader =====')
    const environment = await AppCommands.environment()
    const themeData = await themeStore.load()
    ensureNavbarVisibleQueryData()
    return {
      environment,
      themeData,
      themeStore,
    }
  },
})

export default rootRoute
