import React from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@fluentui/react-components'
import { ColorRegular } from '@fluentui/react-icons'
import { KnownThemeSpaces, ThemeSpace } from '@/components/Core/Theme/Declares'
import useTheme from '@/components/Core/Theme/useTheme'
import SettingsGroupItem from '@/components/Routes/Settings/GroupItem'

export default function SettingsGroupItemThemeSpace () {
  const { t } = useTranslation()
  const { space, change } = useTheme()

  return (
    <SettingsGroupItem
      icon={<ColorRegular />}
      title={t('components.routes.settings.appearance.themeSpace.title')}
      subtitle={t('components.routes.settings.appearance.themeSpace.subtitle')}
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
