import React from 'react'
import Locale from '@/components/Core/Locale'
import SettingsGroup from '@/components/Routes/Settings/Group'
import SettingsGroupItemThemeColor from './ThemeColor'
import SettingsGroupItemThemeSpace from './ThemeSpace'
import SettingsGroupItemThemeZoom from './ThemeZoom'

export default function SettingsGroupAppearance () {
  return (
    <SettingsGroup title={<Locale mapping={['components.routes.settings.appearance.title']} />}>
      <SettingsGroupItemThemeSpace />
      <SettingsGroupItemThemeColor />
      <SettingsGroupItemThemeZoom />
    </SettingsGroup>
  )
}
