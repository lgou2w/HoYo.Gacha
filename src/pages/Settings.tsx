import React from 'react'
import { createRoute } from '@tanstack/react-router'
import rootRoute from '@/pages/Root'

const settingsRoute = createRoute({
  path: '/settings',
  getParentRoute: () => rootRoute,
  component: Settings
})

// eslint-disable-next-line react-refresh/only-export-components
function Settings () {
  return (
    <div>Settings</div>
  )
}

export default settingsRoute
