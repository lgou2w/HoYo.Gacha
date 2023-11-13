import React from 'react'
import { useTranslation } from 'react-i18next'
import { Switch } from '@fluentui/react-components'
import { DarkThemeRegular } from '@fluentui/react-icons'
import useTheme from '@/components/Core/Theme/useTheme'
import SettingsGroupItem from '@/components/Routes/Settings/GroupItem'

export default function SettingsGroupItemThemeColor () {
  const { t } = useTranslation()
  const { color, toggleColor } = useTheme()

  return (
    <SettingsGroupItem
      icon={<DarkThemeRegular style={{ transform: 'rotate(180deg)' }} />}
      title={t('components.routes.settings.appearance.themeColor.title')}
      subtitle={t('components.routes.settings.appearance.themeColor.subtitle')}
      action={(
        <Switch
          labelPosition="before"
          label={t(`components.routes.settings.appearance.themeColor.${color}`)}
          checked={color === 'dark'}
          onChange={(_, data) => toggleColor(data.checked)}
        />
      )}
    />
  )
}
