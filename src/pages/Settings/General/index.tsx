import React from 'react'
import Locale from '@/components/Commons/Locale'
import SettingsGroup from '@/pages/Settings/Group'
import SettingsGroupItemLanguage from './Language'

export default function SettingsGroupGeneral () {
  return (
    <SettingsGroup title={<Locale mapping={['Pages.Settings.General.Title']} />}>
      <SettingsGroupItemLanguage />
    </SettingsGroup>
  )
}
