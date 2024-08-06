import { createRoute } from '@tanstack/react-router'
import rootRoute from '@/pages/Root/route'
import Settings from '.'

const settingsRoute = createRoute({
  path: '/settings',
  getParentRoute: () => rootRoute,
  component: Settings
})

export default settingsRoute
