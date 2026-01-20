import { useCallback } from 'react'
import { Dropdown, Option, OptionOnSelectData, SelectionEvents } from '@fluentui/react-components'
import { DarkThemeRegular } from '@fluentui/react-icons'
import { Dark, Light, useColorScheme } from '@/contexts/Theme'
import { WithTrans, withTrans } from '@/i18n'
import SectionItem from '@/pages/Settings/components/SectionItem'

const Auto = 'auto'
const Options = [Auto, Light, Dark] as const

export default withTrans.SettingsPage(function ColorScheme ({ t }: WithTrans) {
  const [dirty, setColorScheme] = useColorScheme()
  const selectedValue = dirty || Auto
  const handleOptionSelect = useCallback((_: SelectionEvents, data: OptionOnSelectData) => {
    const option = data.optionValue as typeof Options[number]
    setColorScheme(option === Auto ? null : option)
  }, [setColorScheme])

  return (
    <SectionItem
      icon={<DarkThemeRegular style={{ transform: 'rotate(180deg)' }} />}
      title={t('Appearance.ColorScheme.Title')}
      subtitle={t('Appearance.ColorScheme.Subtitle')}
    >
      <Dropdown
        value={t('Appearance.ColorScheme.Option', { context: selectedValue })}
        defaultSelectedOptions={[selectedValue]}
        onOptionSelect={handleOptionSelect}
        style={{ minWidth: '10rem' }}
      >
        {Options.map((option) => (
          <Option key={option} value={option}>
            {t('Appearance.ColorScheme.Option', {
              context: option,
            })}
          </Option>
        ))}
      </Dropdown>
    </SectionItem>
  )
})
