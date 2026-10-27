import { useCallback } from 'react'
import { Dropdown, DropdownProps, Option } from '@fluentui/react-components'
import { ColorRegular } from '@fluentui/react-icons'
import { useTheme } from '@/contexts/Theme/hooks'
import { Namespace as INamespace, KnownNamespaces } from '@/contexts/Theme/types'
import { KnownI18nNs } from '@/i18n'
import Section from '@/routes/Settings/components/Sections/Section'
import capitalize from '@/utilities/capitalize'

export default function Namespace () {
  const { data: { namespace }, updateTheme } = useTheme()
  const handleSelect = useCallback<NonNullable<DropdownProps['onOptionSelect']>>((_, data) => {
    if (KnownNamespaces.includes(data.optionValue as INamespace)) {
      updateTheme({
        namespace: data.optionValue as INamespace,
      })
    }
  }, [updateTheme])

  return (
    <Section.Item
      icon={<ColorRegular />}
      title={{
        tKey: 'Appearance.Namespace.Title',
        tNs: KnownI18nNs.SettingsPage,
      }}
      subtitle={{
        tKey: 'Appearance.Namespace.Subtitle',
        tNs: KnownI18nNs.SettingsPage,
      }}
    >
      <Dropdown
        value={capitalize(namespace)}
        selectedOptions={[namespace]}
        onOptionSelect={handleSelect}
        style={{ minWidth: '10rem' }}
      >
        {KnownNamespaces.map((option) => (
          <Option key={option} value={option}>
            {capitalize(option)}
          </Option>
        ))}
      </Dropdown>
    </Section.Item>
  )
}
