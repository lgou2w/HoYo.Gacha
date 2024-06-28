import React, { Fragment, ReactNode } from 'react'
import { Label, Slider, useId } from '@fluentui/react-components'
import { Multiplier1XRegular, Multiplier12XRegular, Multiplier15XRegular, Multiplier18XRegular, Multiplier2XRegular } from '@fluentui/react-icons'
import Locale from '@/components/Commons/Locale'
import useTheme from '@/components/Commons/Theme/useTheme'
import SettingsGroupItem from '@/pages/Settings/GroupItem'

const ZoomMappings: Record<ReturnType<typeof useTheme>['zoom'], { label: string, icon: ReactNode }> = {
  16: { label: '1x', icon: <Multiplier1XRegular /> },
  20: { label: '1.2x', icon: <Multiplier12XRegular /> },
  24: { label: '1.5x', icon: <Multiplier15XRegular /> },
  28: { label: '1.8x', icon: <Multiplier18XRegular /> },
  32: { label: '2x', icon: <Multiplier2XRegular /> }
}

export default function SettingsGroupItemThemeZoom () {
  const { zoom, change } = useTheme()
  const zoomId = useId()

  return (
    <SettingsGroupItem
      icon={ZoomMappings[zoom].icon}
      title={<Locale mapping={['Pages.Settings.Appearance.ThemeZoom.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Appearance.ThemeZoom.Subtitle']} />}
      action={(
        <Fragment>
          <Label htmlFor={zoomId} weight="semibold">{ZoomMappings[zoom].label}</Label>
          <Slider
            id={zoomId}
            value={zoom}
            onChange={(_, data) => change({ zoom: data.value as typeof zoom })}
            step={4}
            min={16}
            max={32}
          />
        </Fragment>
      )}
    />
  )
}
