import { ReactNode, useCallback } from 'react'
import { Dropdown, DropdownProps, Option } from '@fluentui/react-components'
import { Multiplier12XRegular, Multiplier15XRegular, Multiplier18XRegular, Multiplier1XRegular, Multiplier2XRegular } from '@fluentui/react-icons'
import { useTheme } from '@/contexts/Theme/hooks'
import { ScaleLevel as IScaleLevel } from '@/contexts/Theme/types'
import { KnownI18nNs } from '@/i18n'
import Section from '@/routes/Settings/components/Sections/Section'

type StringifyScale = `${IScaleLevel}`
const ScaleLevels: Record<StringifyScale, { label: string, icon: ReactNode }> = {
  16: { label: '1x', icon: <Multiplier1XRegular /> },
  20: { label: '1.2x', icon: <Multiplier12XRegular /> },
  24: { label: '1.5x', icon: <Multiplier15XRegular /> },
  28: { label: '1.8x', icon: <Multiplier18XRegular /> },
  32: { label: '2x', icon: <Multiplier2XRegular /> },
}

export default function ScaleLevel () {
  const { data: { scale }, updateTheme } = useTheme()
  const handleSelect = useCallback<NonNullable<DropdownProps['onOptionSelect']>>((_, data) => {
    const option = data.optionValue as StringifyScale | undefined
    if (option && ScaleLevels[option]) {
      updateTheme({
        // Stringify -> Number
        scale: parseInt(option) as IScaleLevel,
      })
    }
  }, [updateTheme])

  return (
    <Section.Item
      icon={ScaleLevels[scale].icon}
      title={{
        tKey: 'Appearance.ScaleLevel.Title',
        tNs: KnownI18nNs.SettingsPage,
      }}
      subtitle={{
        tKey: 'Appearance.ScaleLevel.Subtitle',
        tNs: KnownI18nNs.SettingsPage,
      }}
    >
      <Dropdown
        value={ScaleLevels[scale].label}
        selectedOptions={[String(scale)]}
        onOptionSelect={handleSelect}
        style={{ minWidth: '10rem' }}
      >
        {Object.entries(ScaleLevels).map(([option, { label }]) => (
          <Option key={option} value={option}>
            {label}
          </Option>
        ))}
      </Dropdown>
    </Section.Item>
  )
}
