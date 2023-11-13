import React from 'react'
import { useTranslation } from 'react-i18next'
import SettingsSectionGroup from '@/components/Routes/Settings/Section/Group'
import SettingsSectionGroupItemLanguage from './SectionLanguage'

export default function SettingsSectionGroupGeneral () {
  const { t } = useTranslation()
  return (
    <SettingsSectionGroup title={t('routes.settings.general.title')}>
      <SettingsSectionGroupItemLanguage />
    </SettingsSectionGroup>
  )
}
