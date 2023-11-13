import React from 'react'
import { useTranslation } from 'react-i18next'
import SettingsGroup from '@/components/Routes/Settings/Group'
import SettingsGroupItemThemeColor from './ThemeColor'
import SettingsGroupItemThemeSpace from './ThemeSpace'
import SettingsGroupItemThemeZoom from './ThemeZoom'

export default function SettingsGroupAppearance () {
  const { t } = useTranslation()
  return (
    <SettingsGroup title={t('components.routes.settings.appearance.title')}>
      <SettingsGroupItemThemeSpace />
      <SettingsGroupItemThemeColor />
      <SettingsGroupItemThemeZoom />
    </SettingsGroup>
  )
}
