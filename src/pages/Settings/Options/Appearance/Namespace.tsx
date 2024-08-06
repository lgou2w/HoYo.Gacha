import React from 'react'
import { Select } from '@fluentui/react-components'
import { ColorRegular } from '@fluentui/react-icons'
import SettingsOptionsItem from '@/components/Settings/OptionsItem'
import Locale from '@/components/UI/Locale'
import useTheme from '@/hooks/useTheme'
import { KnownNamespaces, Namespace } from '@/interfaces/Theme'
import capitalize from '@/utilities/capitalize'

export default function SettingsOptionsAppearanceNamespace () {
  const { namespace, update } = useTheme()

  return (
    <SettingsOptionsItem
      icon={<ColorRegular />}
      title={<Locale mapping={['Pages.Settings.Options.Appearance.Namespace.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.Appearance.Namespace.Subtitle']} />}
      action={(
        <Select
          value={namespace}
          onChange={(_, data) => update({ namespace: data.value as Namespace })}
        >
          {KnownNamespaces.map((namespace) => (
            <option key={namespace} value={namespace}>
              {capitalize(namespace)}
            </option>
          ))}
        </Select>
      )}
    />
  )
}
