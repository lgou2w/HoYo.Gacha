import React, { ReactNode } from 'react'
import { Select } from '@fluentui/react-components'
import { Multiplier12XRegular, Multiplier15XRegular, Multiplier18XRegular, Multiplier1XRegular, Multiplier2XRegular } from '@fluentui/react-icons'
import SettingsOptionsItem from '@/components/Settings/OptionsItem'
import Locale from '@/components/UI/Locale'
import useTheme from '@/hooks/useTheme'
import { ScaleLevel } from '@/interfaces/Theme'

const ScaleLevelMappings: Record<ScaleLevel, { label: string, icon: ReactNode }> = {
  16: { label: '1x', icon: <Multiplier1XRegular /> },
  20: { label: '1.2x', icon: <Multiplier12XRegular /> },
  24: { label: '1.5x', icon: <Multiplier15XRegular /> },
  28: { label: '1.8x', icon: <Multiplier18XRegular /> },
  32: { label: '2x', icon: <Multiplier2XRegular /> }
}

export default function SettingsOptionsAppearanceScaleLevel () {
  const { scale, update } = useTheme()

  return (
    <SettingsOptionsItem
      icon={ScaleLevelMappings[scale].icon}
      title={<Locale mapping={['Pages.Settings.Options.Appearance.ScaleLevel.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.Appearance.ScaleLevel.Subtitle']} />}
      action={(
        <Select
          value={scale}
          onChange={(_, data) => update({ scale: +data.value as ScaleLevel })}
        >
          {Object.entries(ScaleLevelMappings).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      )}
    />
  )
}
