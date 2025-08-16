import { createRootRoute } from '@tanstack/react-router'
import { isSupportedWindowVibrancy } from '@/api/commands/core'
import { ensureNavbarBusinessVisibleQueryData } from '@/api/queries/business'
import { DatabaseThemeStore, ThemeStore } from '@/interfaces/Theme.store'
import Root from '.'

const themeStore: ThemeStore = new DatabaseThemeStore()

const RootRoute = createRootRoute({
  shouldReload: false,
  pendingMinMs: 0,
  async loader () {
    const supportedWindowVibrancy = await isSupportedWindowVibrancy()
    const initialThemeData = await themeStore.load()
    await ensureNavbarBusinessVisibleQueryData()
    return {
      supportedWindowVibrancy,
      initialThemeData,
      themeStore,
    }
  },
  component: Root,
})

export default RootRoute
