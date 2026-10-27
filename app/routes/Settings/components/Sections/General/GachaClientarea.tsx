import { useCallback } from 'react'
import { Dropdown, DropdownProps, Option } from '@fluentui/react-components'
import { WindowArrowUpRegular } from '@fluentui/react-icons'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useClientareaPreferenceMutation, useClientareaPreferenceSuspenseQuery } from '@/routes/Gacha/contexts/Clientarea/hooks'
import { Clientarea } from '@/routes/Gacha/contexts/Clientarea/types'
import Section from '@/routes/Settings/components/Sections/Section'

export default function GachaClientarea () {
  const { t } = useI18n({ ns: KnownI18nNs.SettingsPage, scope: 'General.GachaClientarea' })
  const { data: clientarea } = useClientareaPreferenceSuspenseQuery()
  const { mutateAsync } = useClientareaPreferenceMutation()
  const handleSelect = useCallback<NonNullable<DropdownProps['onOptionSelect']>>((_, data) => {
    const option = data.optionValue as Clientarea | undefined
    if (option && Clientarea[option]) {
      mutateAsync(option)
    }
  }, [mutateAsync])

  return (
    <Section.Item
      icon={<WindowArrowUpRegular />}
      title={t('Title')}
      subtitle={t('Subtitle')}
    >
      <Dropdown
        value={t(clientarea)}
        selectedOptions={[clientarea]}
        onOptionSelect={handleSelect}
        style={{ minWidth: '10rem' }}
      >
        {Object.values(Clientarea).map((option) => (
          <Option key={option} value={option}>
            {t(option)}
          </Option>
        ))}
      </Dropdown>
    </Section.Item>
  )
}
