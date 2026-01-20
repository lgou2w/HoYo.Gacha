import { ComponentProps } from 'react'
import { Caption1, Subtitle2 } from '@fluentui/react-components'
import { useLocation } from '@tanstack/react-router'
import { WithTransKnownNs, useI18n } from '@/i18n'

export default function Title (props: Omit<ComponentProps<'div'>, 'children'>) {
  const { t } = useI18n(WithTransKnownNs.RootPage)
  const { pathname } = useLocation()

  return (
    <div {...props}>
      <Subtitle2 as="h2" wrap={false}>
        {t(`AppTitleBar.Title.${pathname}`)}
        {` · ${__APP_NAME__}`}
      </Subtitle2>
      {import.meta.env.DEV && (
        <Caption1 style={{ margin: '0 auto', fontFamily: 'monaspace' }} as="pre">
          CONTENT UNDER DEVELOPMENT, NOT FINAL.
        </Caption1>
      )}
    </div>
  )
}
