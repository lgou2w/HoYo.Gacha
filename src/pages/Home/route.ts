import { createRoute } from '@tanstack/react-router'
import RootRoute from '@/pages/Root/route'
import Routes from '@/routes'
import Home from '.'

const HomeRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: Routes.Home,
  component: Home,
})

export default HomeRoute
