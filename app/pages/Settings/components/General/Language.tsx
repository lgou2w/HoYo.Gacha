import { Dropdown, Option } from '@fluentui/react-components'
import { ColorRegular } from '@fluentui/react-icons'
import { KnownLanguages, SupportedLanguages, WithTransKnownNs, useI18n } from '@/i18n'
import SectionItem from '@/pages/Settings/components/SectionItem'

export default function Language () {
  const { t, language, constants, changeLanguage } = useI18n(WithTransKnownNs.SettingsPage)

  return (
    <SectionItem
      icon={<ColorRegular />}
      title={t('General.Language.Title')}
      subtitle={t('General.Language.Subtitle')}
    >
      <Dropdown
        value={constants.text}
        defaultSelectedOptions={[language]}
        onOptionSelect={(_, data) => changeLanguage(data.optionValue)}
        style={{ minWidth: '12.5rem' }}
      >
        {SupportedLanguages.map((option) => (
          <Option key={option} value={option}>
            {KnownLanguages[option].constants.text}
          </Option>
        ))}
      </Dropdown>
    </SectionItem>
  )
}
