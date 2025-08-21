import React, { ComponentProps, Suspense, useCallback } from 'react'
import { Dropdown, Option, Spinner, makeStyles } from '@fluentui/react-components'
import { TextFontRegular } from '@fluentui/react-icons'
import { Await } from '@tanstack/react-router'
import { systemFonts } from '@/api/commands/core'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import useThemeContext from '@/hooks/useThemeContext'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'

const useStyles = makeStyles({
  listbox: {
    height: '20rem',
  },
})

export default function SettingsOptionsAppearanceFont () {
  const styles = useStyles()
  const { font, update } = useThemeContext()
  const handleFontSelect = useCallback<Required<ComponentProps<typeof Dropdown>>['onOptionSelect']>((_, data) => {
    const newValue = data.optionValue
    update({ font: newValue ?? undefined })
  }, [update])

  const i18n = useI18n()
  const noneFont = i18n.t('Pages.Settings.Options.Appearance.Font.None')

  return (
    <SettingsOptionsItem
      icon={<TextFontRegular />}
      title={<Locale mapping={['Pages.Settings.Options.Appearance.Font.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.Appearance.Font.Subtitle']} />}
      action={(
        <Dropdown
          value={font || noneFont}
          defaultSelectedOptions={[font ?? '']}
          onOptionSelect={handleFontSelect}
          style={{ minWidth: '12.5rem' }}
          listbox={{ className: styles.listbox }}
        >
          <Option value="">{noneFont}</Option>
          <Suspense fallback={<Spinner />}>
            <Await promise={systemFonts()}>
              {(fonts) => fonts.map((font) => (
                <Option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </Option>
              ))}
            </Await>
          </Suspense>
        </Dropdown>
      )}
    />
  )
}
