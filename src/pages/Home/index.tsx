import React, { Fragment } from 'react'
import { Button, Select, Switch, useId } from '@fluentui/react-components'
import { locateDataFolder } from '@/api/commands/business'
import useTheme, { useColorScheme } from '@/hooks/useTheme'
import { Businesses } from '@/interfaces/Business'
import { Dark, ScaleLevel, ScaleLevels } from '@/interfaces/Theme'

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
  const { scale, update } = useTheme()
  const { colorScheme, toggle } = useColorScheme()
  const scaleLevelId = useId()
  //

  return (
    <Fragment>
      <label>Experimental:</label>
      <Button onClick={onClick} appearance="outline">Test</Button>
      <label>Color scheme:</label>
      <Switch label={colorScheme} checked={colorScheme === Dark} onClick={() => toggle()} />
      <label htmlFor={scaleLevelId}>Scale level:</label>
      <Select
        id={scaleLevelId}
        value={scale}
        onChange={(_, data) => update({ scale: +data.value as ScaleLevel })}
        appearance="underline"
      >
        {ScaleLevels.map((level) => (
          <option key={level}>{level}</option>
        ))}
      </Select>
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <label>Bottom</label>
    </Fragment>
  )
}
