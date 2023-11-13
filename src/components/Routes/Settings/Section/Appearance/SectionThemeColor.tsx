import React from 'react'
import { useTranslation } from 'react-i18next'
import { Switch } from '@fluentui/react-components'
import { DarkThemeRegular } from '@fluentui/react-icons'
import useTheme from '@/components/Core/Theme/useTheme'
import SettingsSectionGroupItem from '@/components/Routes/Settings/Section/GroupItem'

export default function SettingsSectionGroupItemThemeColor () {
  const { t } = useTranslation()
  const { color, toggleColor } = useTheme()

  return (
    <SettingsSectionGroupItem
      icon={<DarkThemeRegular style={{ transform: 'rotate(180deg)' }} />}
      title={t('routes.settings.appearance.themeColor.title')}
      subtitle={t('routes.settings.appearance.themeColor.subtitle')}
      action={(
        <Switch
          labelPosition="before"
          label={t(`routes.settings.appearance.themeColor.${color}`)}
          checked={color === 'dark'}
          onChange={(_, data) => toggleColor(data.checked)}
        />
      )}
    />
  )
}
