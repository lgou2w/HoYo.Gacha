import React from 'react'
import { Select } from '@fluentui/react-components'
import { ColorRegular } from '@fluentui/react-icons'
import Locale from '@/components/Commons/Locale'
import { KnownThemeSpaces, ThemeSpace } from '@/components/Commons/Theme/declares'
import useTheme from '@/components/Commons/Theme/useTheme'
import SettingsGroupItem from '@/pages/Settings/GroupItem'

export default function SettingsGroupItemThemeSpace () {
  const { space, change } = useTheme()

  return (
    <SettingsGroupItem
      icon={<ColorRegular />}
      title={<Locale mapping={['Pages.Settings.Appearance.ThemeSpace.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Appearance.ThemeSpace.Subtitle']} />}
      action={(
        <Select
          value={space}
          onChange={(_, data) => change({ space: data.value as ThemeSpace })}
        >
          {KnownThemeSpaces.map((space) => (
            <option key={space} value={space}>
              {space[0].toUpperCase() + space.slice(1)}
            </option>
          ))}
        </Select>
      )}
    />
  )
}
