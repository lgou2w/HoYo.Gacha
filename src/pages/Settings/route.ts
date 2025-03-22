import { createRoute } from '@tanstack/react-router'
import RootRoute from '@/pages/Root/route'
import Routes from '@/routes'
import Settings from '.'

const SettingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: Routes.Settings,
  component: Settings,
})

export default SettingsRoute
