import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext } from '@tanstack/react-router'
import { AppCommands } from '@/api/App'
import { ThemeStore } from '@/contexts/Theme/store'
import Root from './page'

export interface RootContext {
  queryClient: QueryClient
  themeStore: ThemeStore
}

const rootRoute = createRootRouteWithContext<RootContext>()({
  shouldReload: false,
  component: Root,
  async loader (ctx) {
    console.debug(
      '%c===== Root route loader =====',
      'color:white; background-color:orange; font-weight: bold;',
    )

    const environment = await AppCommands.environment()
    const themeData = await ctx.context.themeStore.load()
    return {
      environment,
      themeData,
    }
  },
})

export default rootRoute
