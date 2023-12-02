import React from 'react'
import { Switch } from '@fluentui/react-components'
import { DarkThemeRegular } from '@fluentui/react-icons'
import Locale from '@/components/Core/Locale'
import useTheme from '@/components/Core/Theme/useTheme'
import SettingsGroupItem from '@/components/Settings/GroupItem'

export default function SettingsGroupItemThemeColor () {
  const { color, toggleColor } = useTheme()

  return (
    <SettingsGroupItem
      icon={<DarkThemeRegular style={{ transform: 'rotate(180deg)' }} />}
      title={<Locale mapping={['components.settings.appearance.themeColor.title']} />}
      subtitle={<Locale mapping={['components.settings.appearance.themeColor.subtitle']} />}
      action={(
        <Switch
          labelPosition="before"
          label={<Locale mapping={[`components.settings.appearance.themeColor.${color}`]} />}
          checked={color === 'dark'}
          onChange={(_, data) => toggleColor(data.checked)}
        />
      )}
    />
  )
}
