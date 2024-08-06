import React from 'react'
import SettingsOptionsGroup from '@/components/Settings/OptionsGroup'
import Locale from '@/components/UI/Locale'
import SettingsOptionsAppearanceColorScheme from './ColorScheme'
import SettingsOptionsAppearanceNamespace from './Namespace'
import SettingsOptionsAppearanceScaleLevel from './ScaleLevel'

export default function SettingsOptionsAppearance () {
  return (
    <SettingsOptionsGroup
      title={<Locale mapping={['Pages.Settings.Options.Appearance.Title']} />}
    >
      <SettingsOptionsAppearanceNamespace />
      <SettingsOptionsAppearanceColorScheme />
      <SettingsOptionsAppearanceScaleLevel />
    </SettingsOptionsGroup>
  )
}
