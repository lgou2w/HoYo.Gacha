import React from 'react'
import { Select } from '@fluentui/react-components'
import { ColorRegular } from '@fluentui/react-icons'
import Locale from '@/components/Core/Locale'
import { KnownThemeSpaces, ThemeSpace } from '@/components/Core/Theme/declares'
import useTheme from '@/components/Core/Theme/useTheme'
import SettingsGroupItem from '@/components/Routes/Settings/GroupItem'

export default function SettingsGroupItemThemeSpace () {
  const { space, change } = useTheme()

  return (
    <SettingsGroupItem
      icon={<ColorRegular />}
      title={<Locale mapping={['components.routes.settings.appearance.themeSpace.title']} />}
      subtitle={<Locale mapping={['components.routes.settings.appearance.themeSpace.subtitle']} />}
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
