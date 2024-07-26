import React, { Fragment } from 'react'
import { Switch } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
import { useColorScheme } from '@/hooks/useTheme'
import rootRoute from '@/pages/Root'

const homeRoute = createRoute({
  path: '/',
  getParentRoute: () => rootRoute,
  component: Home
})

// eslint-disable-next-line react-refresh/only-export-components
function Home () {
  // TODO: Experimental
  const { colorScheme, toggle } = useColorScheme()
  //

  return (
    <Fragment>
      <div>Home</div>
      <Switch label={colorScheme} onClick={() => toggle()} />
    </Fragment>
  )
}

export default homeRoute
