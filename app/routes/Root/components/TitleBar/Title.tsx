import { ComponentProps } from 'react'
import { Caption1, Subtitle2, tokens } from '@fluentui/react-components'
import { useLocation } from '@tanstack/react-router'
import { KnownI18nNs, useI18n } from '@/i18n'

export default function Title (props: Omit<ComponentProps<'div'>, 'children'>) {
  return (
    <div {...props}>
      <TitlePath />
      {import.meta.env.DEV && (
        <Caption1 as="span" style={{ margin: '0 auto', fontFamily: tokens.fontFamilyMonospace }}>
          (Running in Development Mode)
        </Caption1>
      )}
    </div>
  )
}

function TitlePath () {
  const { t } = useI18n({ ns: KnownI18nNs.RootPage })
  const { pathname } = useLocation()
  return (
    <Subtitle2 as="h2" wrap={false}>
      {t(`TitleBar.Pathname.${pathname}`)}
      {' · '}
      {__APP_NAME__}
    </Subtitle2>
  )
}
