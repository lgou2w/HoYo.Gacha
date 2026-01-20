import { Dropdown, Option } from '@fluentui/react-components'
import { ColorRegular } from '@fluentui/react-icons'
import { KnownNamespaces, Namespace, useTheme } from '@/contexts/Theme'
import { WithTrans, withTrans } from '@/i18n'
import SectionItem from '@/pages/Settings/components/SectionItem'
import capitalize from '@/utilities/capitalize'

export default withTrans.SettingsPage(function Namespace ({ t }: WithTrans) {
  const { data: { namespace }, updateTheme } = useTheme()

  return (
    <SectionItem
      icon={<ColorRegular />}
      title={t('Appearance.Namespace.Title')}
      subtitle={t('Appearance.Namespace.Subtitle')}
    >
      <Dropdown
        value={capitalize(namespace)}
        defaultSelectedOptions={[namespace]}
        onOptionSelect={(_, data) => updateTheme({
          namespace: data.optionValue as Namespace,
        })}
        style={{ minWidth: '10rem' }}
      >
        {KnownNamespaces.map((option) => (
          <Option key={option} value={option}>
            {capitalize(option)}
          </Option>
        ))}
      </Dropdown>
    </SectionItem>
  )
})
