import React, { MouseEventHandler, useCallback } from 'react'
import { Button } from '@fluentui/react-components'
import { LinkMultipleRegular } from '@fluentui/react-icons'
import { createAppLnk } from '@/api/commands/core'
import errorTranslation from '@/api/errorTranslation'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'

export default function SettingsOptionsAboutLnk () {
  const i18n = useI18n()
  const notifier = useNotifier()
  const handleCreate = useCallback<MouseEventHandler>(() => {
    notifier.promise(createAppLnk(), {
      loading: { title: i18n.t('Pages.Settings.Options.About.Lnk.Loading') },
      success: { title: i18n.t('Pages.Settings.Options.About.Lnk.Success') },
      error (e) {
        return {
          title: i18n.t('Pages.Settings.Options.About.Lnk.Error'),
          body: errorTranslation(i18n, e),
          timeout: notifier.DefaultTimeouts.error * 2,
          dismissible: true,
        }
      },
    })
  }, [i18n, notifier])

  return (
    <SettingsOptionsItem
      icon={<LinkMultipleRegular />}
      title={<Locale mapping={['Pages.Settings.Options.About.Lnk.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.About.Lnk.Subtitle']} />}
      action={(
        <Locale
          component={Button}
          mapping={['Pages.Settings.Options.About.Lnk.CreateBtn']}
          onClick={handleCreate}
        />
      )}
    />
  )
}
