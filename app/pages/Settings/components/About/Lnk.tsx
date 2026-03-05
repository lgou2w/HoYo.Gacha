import { MouseEventHandler, useCallback } from 'react'
import { Button } from '@fluentui/react-components'
import { LinkMultipleRegular } from '@fluentui/react-icons'
import AppCommands from '@/api/commands/app'
import errorTrans from '@/api/errorTrans'
import { WithTrans, withTrans } from '@/i18n'
import useAppNotifier, { DefaultNotifierTimeouts } from '@/pages/Root/hooks/useAppNotifier'
import SectionItem from '@/pages/Settings/components/SectionItem'

export default withTrans.SettingsPage(function Lnk ({ t }: WithTrans) {
  return (
    <SectionItem
      icon={<LinkMultipleRegular />}
      title={t('About.Lnk.Title')}
      subtitle={t('About.Lnk.Subtitle')}
    >
      <LnkAction t={t} />
    </SectionItem>
  )
})

function LnkAction ({ t }: Pick<WithTrans, 't'>) {
  const notifier = useAppNotifier()
  const handleCreate = useCallback<MouseEventHandler>(() => {
    notifier.promise(AppCommands.createAppLnk(), {
      loading: { title: t('About.Lnk.Loading') },
      success: { title: t('About.Lnk.Success') },
      error (error) {
        return {
          title: t('About.Lnk.Error'),
          body: errorTrans(t, error),
          timeout: DefaultNotifierTimeouts.error * 2,
          dismissible: true,
        }
      },
    })
  }, [notifier, t])

  return (
    <Button onClick={handleCreate}>
      {t('About.Lnk.Create')}
    </Button>
  )
}
