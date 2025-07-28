import React from 'react'
import { Dropdown, Option } from '@fluentui/react-components'
import { ColorRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import useThemeContext from '@/hooks/useThemeContext'
import { KnownNamespaces, Namespace } from '@/interfaces/Theme'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'
import capitalize from '@/utilities/capitalize'

export default function SettingsOptionsAppearanceNamespace () {
  const { namespace, update } = useThemeContext()

  return (
    <SettingsOptionsItem
      icon={<ColorRegular />}
      title={<Locale mapping={['Pages.Settings.Options.Appearance.Namespace.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.Appearance.Namespace.Subtitle']} />}
      action={(
        <Dropdown
          value={capitalize(namespace)}
          defaultSelectedOptions={[namespace]}
          onOptionSelect={(_, data) => update({ namespace: data.optionValue as Namespace })}
          style={{ minWidth: '10rem' }}
        >
          {KnownNamespaces.map((namespace) => (
            <Option key={namespace} value={namespace}>
              {capitalize(namespace)}
            </Option>
          ))}
        </Dropdown>
      )}
    />
  )
}
