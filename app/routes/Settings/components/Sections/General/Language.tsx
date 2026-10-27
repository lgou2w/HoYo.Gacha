import { useCallback } from 'react'
import { Dropdown, DropdownProps, Option } from '@fluentui/react-components'
import { LocalLanguageRegular } from '@fluentui/react-icons'
import { Language as ILanguage, KnownI18nNs, KnownLanguages, SupportedLanguages, useI18n } from '@/i18n'
import Section from '@/routes/Settings/components/Sections/Section'

export default function Language () {
  const { t, changeLanguage, language, constants } = useI18n({ ns: KnownI18nNs.SettingsPage, scope: 'General.Language' })
  const handleSelect = useCallback<NonNullable<DropdownProps['onOptionSelect']>>((_, data) => {
    const option = data.optionValue as ILanguage | undefined
    if (option && SupportedLanguages.includes(option)) {
      changeLanguage(option)
    }
  }, [changeLanguage])

  return (
    <Section.Item
      icon={<LocalLanguageRegular />}
      title={t('Title')}
      subtitle={t('Subtitle')}
    >
      <Dropdown
        value={constants.text}
        selectedOptions={[language]}
        onOptionSelect={handleSelect}
        style={{ minWidth: '12.5rem' }}
      >
        {SupportedLanguages.map((option) => (
          <Option key={option} value={option}>
            {KnownLanguages[option].constants.text}
          </Option>
        ))}
      </Dropdown>
    </Section.Item>
  )
}
