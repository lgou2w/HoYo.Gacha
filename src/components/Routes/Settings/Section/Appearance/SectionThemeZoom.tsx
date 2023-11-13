import React, { Fragment, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Label, Slider, useId } from '@fluentui/react-components'
import { Multiplier1XRegular, Multiplier12XRegular, Multiplier15XRegular, Multiplier18XRegular, Multiplier2XRegular } from '@fluentui/react-icons'
import useTheme from '@/components/Core/Theme/useTheme'
import SettingsSectionGroupItem from '@/components/Routes/Settings/Section/GroupItem'

const ZoomMappings: Record<ReturnType<typeof useTheme>['zoom'], { label: string, icon: ReactNode }> = {
  16: { label: '1x', icon: <Multiplier1XRegular /> },
  20: { label: '1.2x', icon: <Multiplier12XRegular /> },
  24: { label: '1.5x', icon: <Multiplier15XRegular /> },
  28: { label: '1.8x', icon: <Multiplier18XRegular /> },
  32: { label: '2x', icon: <Multiplier2XRegular /> }
}

export default function SettingsSectionGroupItemThemeZoom () {
  const { t } = useTranslation()
  const { zoom, change } = useTheme()
  const zoomId = useId()

  return (
    <SettingsSectionGroupItem
      icon={ZoomMappings[zoom].icon}
      title={t('routes.settings.appearance.themeZoom.title')}
      subtitle={t('routes.settings.appearance.themeZoom.subtitle')}
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
