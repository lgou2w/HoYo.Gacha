import { createRoute } from '@tanstack/react-router'
import rootRoute from '@/pages/Root/route'
import Settings from '.'

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: Settings
})

export default settingsRoute
