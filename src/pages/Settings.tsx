import React, { Fragment } from 'react'
import { Select, Switch, useId } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
import useTheme, { useColorScheme } from '@/hooks/useTheme'
import { ScaleLevel, ScaleLevels } from '@/interfaces/Theme'
import rootRoute from '@/pages/Root'

const settingsRoute = createRoute({
  path: '/settings',
  getParentRoute: () => rootRoute,
  component: Settings
})

// eslint-disable-next-line react-refresh/only-export-components
function Settings () {
  // TODO: Experimental
  const { scale, update } = useTheme()
  const { colorScheme, toggle } = useColorScheme()
  const scaleLevelId = useId()
  //

  return (
    <Fragment>
      <div>Settings</div>
      <Switch label={colorScheme} onClick={() => toggle()} />
      <label htmlFor={scaleLevelId}>Scale level:</label>
      <Select
        id={scaleLevelId}
        value={scale}
        onChange={(_, data) => update({ scale: +data.value as ScaleLevel })}
      >
        {ScaleLevels.map((level) => (
          <option key={level}>{level}</option>
        ))}
      </Select>
    </Fragment>
  )
}

export default settingsRoute
