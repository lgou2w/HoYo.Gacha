import React from 'react'
import Locale from '@/components/Commons/Locale'
import SettingsGroup from '@/pages/Settings/Group'
import SettingsGroupItemUpdate from './Update'

export default function SettingsGroupAbout () {
  return (
    <SettingsGroup title={<Locale mapping={['Pages.Settings.About.Title']} />}>
      <SettingsGroupItemUpdate />
    </SettingsGroup>
  )
}
