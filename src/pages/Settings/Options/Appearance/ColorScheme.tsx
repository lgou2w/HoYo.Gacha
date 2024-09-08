import React from 'react'
import { Switch } from '@fluentui/react-components'
import { DarkThemeRegular } from '@fluentui/react-icons'
import SettingsOptionsItem from '@/components/Settings/OptionsItem'
import Locale from '@/components/UI/Locale'
import { useColorScheme } from '@/hooks/useTheme'
import { Dark } from '@/interfaces/Theme'
import capitalize from '@/utilities/capitalize'

export default function SettingsOptionsAppearanceColorScheme () {
  const { colorScheme, toggle } = useColorScheme()

  return (
    <SettingsOptionsItem
      icon={<DarkThemeRegular style={{ transform: 'rotate(180deg)' }} />}
      title={<Locale mapping={['Pages.Settings.Options.Appearance.ColorScheme.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.Appearance.ColorScheme.Subtitle']} />}
      action={(
        <Switch
          labelPosition="before"
          label={<Locale mapping={[`Pages.Settings.Options.Appearance.ColorScheme.${capitalize(colorScheme)}`]} />}
          checked={colorScheme === Dark}
          onChange={() => toggle()}
        />
      )}
    />
  )
}