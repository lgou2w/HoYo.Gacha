import { useCallback } from 'react'
import { Dropdown, DropdownProps, Option } from '@fluentui/react-components'
import { DarkThemeRegular } from '@fluentui/react-icons'
import { useColorScheme } from '@/contexts/Theme/hooks'
import { Dark, Light } from '@/contexts/Theme/types'
import { KnownI18nNs, useI18n } from '@/i18n'
import Section from '@/routes/Settings/components/Sections/Section'
import capitalize from '@/utilities/capitalize'

const System = 'system'
const Options = [System, Light, Dark] as const
type Option = typeof Options[number]

export default function ColorScheme () {
  const { t } = useI18n({ ns: KnownI18nNs.SettingsPage, scope: 'Appearance.ColorScheme' })
  const [dirty, setColorScheme] = useColorScheme()
  const selectedValue = dirty || System
  const handleSelect = useCallback<NonNullable<DropdownProps['onOptionSelect']>>((_, data) => {
    const option = data.optionValue as Option
    if (Options.includes(option)) {
      setColorScheme(option === System
        ? null
        : option,
      )
    }
  }, [setColorScheme])

  return (
    <Section.Item
      icon={<DarkThemeRegular style={{ transform: 'rotate(180deg)' }} />}
      title={t('Title')}
      subtitle={t('Subtitle')}
    >
      <Dropdown
        value={t(`Option.${capitalize(selectedValue)}`)}
        selectedOptions={[selectedValue]}
        onOptionSelect={handleSelect}
        style={{ minWidth: '10rem' }}
      >
        {Options.map((option) => (
          <Option key={option} value={option}>
            {t(`Option.${capitalize(option)}`)}
          </Option>
        ))}
      </Dropdown>
    </Section.Item>
  )
}
