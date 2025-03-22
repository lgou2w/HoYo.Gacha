import { createRootRoute } from '@tanstack/react-router'
import { DatabaseThemeStore } from '@/interfaces/Theme.store'
import Root from '.'

const themeStore = new DatabaseThemeStore()

const RootRoute = createRootRoute({
  shouldReload: false,
  pendingMinMs: 0,
  async loader () {
    const initialThemeData = await themeStore.load()
    return {
      initialThemeData,
      themeStore,
    }
  },
  component: Root,
})

export default RootRoute
