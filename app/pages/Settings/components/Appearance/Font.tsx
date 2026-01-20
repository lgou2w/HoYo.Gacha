import { Dropdown, Option, Spinner, makeStyles } from '@fluentui/react-components'
import { TextFontRegular } from '@fluentui/react-icons'
import { Await } from '@tanstack/react-router'
import AppCommands from '@/api/commands/app'
import { useTheme } from '@/contexts/Theme'
import { WithTrans, withTrans } from '@/i18n'
import SectionItem from '@/pages/Settings/components/SectionItem'

const useStyles = makeStyles({
  listbox: {
    height: '20rem',
  },
})

export default withTrans.SettingsPage(function Font ({ t }: WithTrans) {
  const styles = useStyles()
  const { data: { font }, updateTheme } = useTheme()
  const noneFont = t('Appearance.Font.None')

  return (
    <SectionItem
      icon={<TextFontRegular />}
      title={t('Appearance.Font.Title')}
      subtitle={t('Appearance.Font.Subtitle')}
    >
      <Dropdown
        value={font || noneFont}
        defaultSelectedOptions={[font ?? '']}
        onOptionSelect={(_, data) => updateTheme({
          font: data.optionValue || null,
        })}
        style={{ minWidth: '12.5rem' }}
        listbox={{ className: styles.listbox }}
      >
        <Option value="">{noneFont}</Option>
        <Await promise={AppCommands.systemFonts()} fallback={<Spinner />}>
          {(fonts) => fonts.map((font) => (
            <Option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </Option>
          ))}
        </Await>
      </Dropdown>
    </SectionItem>
  )
})
