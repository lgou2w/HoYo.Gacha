import React from 'react'
import SettingsOptionsGroup from '@/components/Settings/OptionsGroup'
import Locale from '@/components/UI/Locale'
import SettingsOptionsGeneralLanguage from './Language'

export default function SettingsOptionsGeneral () {
  return (
    <SettingsOptionsGroup
      title={<Locale mapping={['Pages.Settings.Options.General.Title']} />}
    >
      <SettingsOptionsGeneralLanguage />
    </SettingsOptionsGroup>
  )
}
