import React from 'react'
import Locale from '@/components/Locale'
import SettingsOptionsGroup from '@/pages/Settings/Options/OptionsGroup'
import SettingsOptionsGeneralLanguage from './Language'
import SettingsOptionsGeneralNavbarBusinessVisible from './NavbarBusinessVisible'

export default function SettingsOptionsGeneral () {
  return (
    <SettingsOptionsGroup
      title={<Locale mapping={['Pages.Settings.Options.General.Title']} />}
    >
      <SettingsOptionsGeneralLanguage />
      <SettingsOptionsGeneralNavbarBusinessVisible />
    </SettingsOptionsGroup>
  )
}
