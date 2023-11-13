import React from 'react'
import { useTranslation } from 'react-i18next'
import SettingsSectionGroup from '@/components/Routes/Settings/Section/Group'
import SettingsSectionGroupItemThemeColor from './SectionThemeColor'
import SettingsSectionGroupItemThemeSpace from './SectionThemeSpace'
import SettingsSectionGroupItemThemeZoom from './SectionThemeZoom'

export default function SettingsSectionGroupAppearance () {
  const { t } = useTranslation()
  return (
    <SettingsSectionGroup title={t('routes.settings.appearance.title')}>
      <SettingsSectionGroupItemThemeSpace />
      <SettingsSectionGroupItemThemeColor />
      <SettingsSectionGroupItemThemeZoom />
    </SettingsSectionGroup>
  )
}
