import React from 'react'
import Locale from '@/components/Locale'
import SettingsOptionsGroup from '@/pages/Settings/Options/OptionsGroup'
import SettingsOptionsGeneralGachaClientareaTab from './GachaClientareaTab'
import SettingsOptionsGeneralLanguage from './Language'

export default function SettingsOptionsGeneral () {
  return (
    <SettingsOptionsGroup
      title={<Locale mapping={['Pages.Settings.Options.General.Title']} />}
    >
      <SettingsOptionsGeneralLanguage />
      <SettingsOptionsGeneralGachaClientareaTab />
    </SettingsOptionsGroup>
  )
}
