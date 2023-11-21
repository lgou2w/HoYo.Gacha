import React from 'react'
import Locale from '@/components/Core/Locale'
import SettingsGroup from '@/components/Routes/Settings/Group'
import SettingsGroupItemUpdate from './Update'

export default function SettingsGroupAbout () {
  return (
    <SettingsGroup title={<Locale mapping={['components.routes.settings.about.title']} />}>
      <SettingsGroupItemUpdate />
    </SettingsGroup>
  )
}
