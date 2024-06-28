import React from 'react'
import { Switch } from '@fluentui/react-components'
import { DarkThemeRegular } from '@fluentui/react-icons'
import { capitalize } from '@/api/utilities'
import Locale from '@/components/Commons/Locale'
import useTheme from '@/components/Commons/Theme/useTheme'
import SettingsGroupItem from '@/pages/Settings/GroupItem'

export default function SettingsGroupItemThemeColor () {
  const { color, toggleColor } = useTheme()

  return (
    <SettingsGroupItem
      icon={<DarkThemeRegular style={{ transform: 'rotate(180deg)' }} />}
      title={<Locale mapping={['Pages.Settings.Appearance.ThemeColor.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Appearance.ThemeColor.Subtitle']} />}
      action={(
        <Switch
          labelPosition="before"
          label={<Locale mapping={[`Pages.Settings.Appearance.ThemeColor.${capitalize(color)}`]} />}
          checked={color === 'dark'}
          onChange={(_, data) => toggleColor(data.checked)}
        />
      )}
    />
  )
}
