import React from 'react'
import { useTranslation } from 'react-i18next'
import SettingsGroup from '@/components/Routes/Settings/Group'
import SettingsGroupItemUpdate from './Update'

export default function SettingsGroupAbout () {
  const { t } = useTranslation()
  return (
    <SettingsGroup title={t('routes.settings.about.title')}>
      <SettingsGroupItemUpdate />
    </SettingsGroup>
  )
}
