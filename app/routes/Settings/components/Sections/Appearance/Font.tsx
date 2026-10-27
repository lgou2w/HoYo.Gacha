import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Dropdown, DropdownProps, Option, Spinner, makeStyles } from '@fluentui/react-components'
import { TextFontRegular } from '@fluentui/react-icons'
import { Await } from '@tanstack/react-router'
import { AppCommands } from '@/api/App'
import { useTheme } from '@/contexts/Theme/hooks'
import { KnownI18nNs, useI18n } from '@/i18n'
import Section from '@/routes/Settings/components/Sections/Section'

const useStyles = makeStyles({
  listbox: {
    height: '20rem',
  },
})

export default function Font () {
  const styles = useStyles()
  const { t } = useI18n({ ns: KnownI18nNs.SettingsPage, scope: 'Appearance.Font' })
  const { data: { font }, updateTheme } = useTheme()
  const noneFont = t('None')

  const fontsPromise = useMemo(() => AppCommands.systemFonts(), [])
  const isScrollIntoView = useRef(false)
  const listboxRef = useRef<HTMLDivElement>(null)

  const handleSelect = useCallback<NonNullable<DropdownProps['onOptionSelect']>>((_, data) => {
    updateTheme({
      font: data.optionValue ?? null,
    })
  }, [updateTheme])

  return (
    <Section.Item
      icon={<TextFontRegular />}
      title={t('Title')}
      subtitle={t('Subtitle')}
    >
      <Dropdown
        value={font || noneFont}
        selectedOptions={[font ?? '']}
        onOptionSelect={handleSelect}
        listbox={{ ref: listboxRef, className: styles.listbox }}
        style={{ minWidth: '12.5rem' }}
      >
        <Option value="">{noneFont}</Option>
        <Await promise={fontsPromise} fallback={<Spinner />}>
          {(fonts) => {
            // SAFETY: this function is only invoked once — `fontsPromise` is
            // stable via `useMemo`, so `Await` renders its children exactly
            // once after resolution. The hook order therefore does not
            // change across renders.
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useEffect(() => {
              if (!listboxRef.current || isScrollIntoView.current) {
                return
              }

              let attempts = 0
              let frame = 0

              const tryScroll = () => {
                const selected = listboxRef.current
                  ?.querySelector('[role="option"][aria-selected="true"]')

                if (selected) {
                  selected.scrollIntoView({ block: 'nearest' })
                  isScrollIntoView.current = true
                  return
                }

                if (++attempts < 5) {
                  frame = requestAnimationFrame(tryScroll)
                }
              }

              frame = requestAnimationFrame(tryScroll)
              return () => cancelAnimationFrame(frame)
            }, [])

            return fonts.map((fontName) => (
              <Option key={fontName} value={fontName} style={{ fontFamily: fontName }}>
                {fontName}
              </Option>
            ))
          }}
        </Await>
      </Dropdown>
    </Section.Item>
  )
}
