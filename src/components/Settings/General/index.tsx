import React from 'react'
import Locale from '@/components/Core/Locale'
import SettingsGroup from '@/components/Settings/Group'
import SettingsGroupItemLanguage from './Language'

export default function SettingsGroupGeneral () {
  return (
    <SettingsGroup title={<Locale mapping={['components.settings.general.title']} />}>
      <SettingsGroupItemLanguage />
    </SettingsGroup>
  )
}
