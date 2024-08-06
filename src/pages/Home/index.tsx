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
      <label>Experimental:</label>
      <Button onClick={onClick} appearance="outline">Test</Button>
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <label>Bottom</label>
    </Fragment>
  )
}
