import { ReactNode } from 'react'
import { Dropdown, Option } from '@fluentui/react-components'
import { Multiplier12XRegular, Multiplier15XRegular, Multiplier18XRegular, Multiplier1XRegular, Multiplier2XRegular } from '@fluentui/react-icons'
import { ScaleLevel, useTheme } from '@/contexts/Theme'
import { WithTrans, withTrans } from '@/i18n'
import SectionItem from '@/pages/Settings/components/SectionItem'

const ScaleLevelMappings: Record<ScaleLevel, { label: string, icon: ReactNode }> = {
  16: { label: '1x', icon: <Multiplier1XRegular /> },
  20: { label: '1.2x', icon: <Multiplier12XRegular /> },
  24: { label: '1.5x', icon: <Multiplier15XRegular /> },
  28: { label: '1.8x', icon: <Multiplier18XRegular /> },
  32: { label: '2x', icon: <Multiplier2XRegular /> },
}

export default withTrans.SettingsPage(function ScaleLevel ({ t }: WithTrans) {
  const { data: { scale }, updateTheme } = useTheme()

  return (
    <SectionItem
      icon={ScaleLevelMappings[scale].icon}
      title={t('Appearance.ScaleLevel.Title')}
      subtitle={t('Appearance.ScaleLevel.Subtitle')}
    >
      <Dropdown
        value={ScaleLevelMappings[scale].label}
        defaultSelectedOptions={[String(scale)]}
        onOptionSelect={(_, data) => updateTheme({
          scale: +data.optionValue! as ScaleLevel,
        })}
        style={{ minWidth: '10rem' }}
      >
        {Object.entries(ScaleLevelMappings).map(([value, { label }]) => (
          <Option key={value} value={value}>
            {label}
          </Option>
        ))}
      </Dropdown>
    </SectionItem>
  )
})
