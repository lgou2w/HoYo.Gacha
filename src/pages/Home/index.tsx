import React, { Fragment } from 'react'
import { Button } from '@fluentui/react-components'
import { locateDataFolder } from '@/api/commands/business'
import { Businesses } from '@/interfaces/Business'

export default function Home () {
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
