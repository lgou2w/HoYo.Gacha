import { MouseEventHandler, useCallback } from 'react'
import { Button } from '@fluentui/react-components'
import { LinkMultipleRegular } from '@fluentui/react-icons'
import { AppCommands } from '@/api/App'
import errorTrans from '@/api/errorTrans'
import { KnownI18nNs, UseI18n, useI18n } from '@/i18n'
import useGlobalNotifier from '@/routes/Root/hooks/useGlobalNotifier'
import Section from '@/routes/Settings/components/Sections/Section'

const I18nScope = 'About.CreateLnk'

export default function CreateLnk () {
  const { t } = useI18n({ ns: KnownI18nNs.SettingsPage })

  return (
    <Section.Item
      icon={<LinkMultipleRegular />}
      title={t(`${I18nScope}.Title`)}
      subtitle={t(`${I18nScope}.Subtitle`)}
    >
      <Action t={t} />
    </Section.Item>
  )
}

function Action ({ t }: { t: UseI18n['t'] }) {
  const { promise: promiseNotify } = useGlobalNotifier()
  const handleClick = useCallback<MouseEventHandler>(() => {
    promiseNotify(AppCommands.createAppLnk(), {
      loading: { title: t(`${I18nScope}.Loading`), position: 'bottom' },
      success: { title: t(`${I18nScope}.Success`), position: 'bottom' },
      error (error) {
        return {
          dismissible: true,
          title: t(`${I18nScope}.Error`),
          body: errorTrans(t, error),
          position: 'bottom',
        }
      },
    })
  }, [promiseNotify, t])

  return (
    <Button onClick={handleClick}>
      {t(`${I18nScope}.Button`)}
    </Button>
  )
}
