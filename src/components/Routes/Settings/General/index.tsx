import React from 'react'
import { useTranslation } from 'react-i18next'
import SettingsGroup from '@/components/Routes/Settings/Group'
import SettingsGroupItemLanguage from './Language'

export default function SettingsGroupGeneral () {
  const { t } = useTranslation()
  return (
    <SettingsGroup title={t('components.routes.settings.general.title')}>
      <SettingsGroupItemLanguage />
    </SettingsGroup>
  )
}
