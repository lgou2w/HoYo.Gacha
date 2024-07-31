import React, { Fragment } from 'react'
import { Button } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
import { locateDataFolder } from '@/api/commands/business'
import { Businesses } from '@/interfaces/Business'
import rootRoute from '@/pages/Root'

const homeRoute = createRoute({
  path: '/',
  getParentRoute: () => rootRoute,
  component: Home
})

// eslint-disable-next-line react-refresh/only-export-components
function Home () {
  // TODO: Experimental
  const onClick = async () => {
    try {
      const result = await locateDataFolder({
        business: Businesses.ZenlessZoneZero,
        region: 'Official',
        factory: 'Manual'
      })
      console.debug(result)
    } catch (e) {
      console.error(e)
    }
  }
  //

  return (
    <Fragment>
      <div>Home</div>
      <br />
      <Button onClick={onClick}>Test</Button>
    </Fragment>
  )
}

export default homeRoute
