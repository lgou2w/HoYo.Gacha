import React, { MouseEventHandler, useCallback, useState } from 'react'
import { Button } from '@fluentui/react-components'
import { DatabaseLinkRegular } from '@fluentui/react-icons'
import { pickFile } from '@/api/commands/core'
import { legacyMigration } from '@/api/commands/database'
import errorTranslation from '@/api/errorTranslation'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import SettingsOptionsGroup from '@/pages/Settings/Options/OptionsGroup'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'
import queryClient from '@/queryClient'

export default function SettingsOptionsMigration () {
  return (
    <SettingsOptionsGroup>
      <SettingsOptionsItem
        icon={<DatabaseLinkRegular />}
        title={<Locale mapping={['Pages.Settings.Options.Migration.Title']} />}
        subtitle={<Locale mapping={['Pages.Settings.Options.Migration.Subtitle']} />}
        action={<SettingsOptionsMigrationAction />}
      />
    </SettingsOptionsGroup>
  )
}

function SettingsOptionsMigrationAction () {
  const [busy, setBusy] = useState(false)
  const notifier = useNotifier()
  const i18n = useI18n()

  const handleMigrate = useCallback<MouseEventHandler>(async () => {
    const legacyDatabase = await pickFile({
      filters: [
        ['HoYo.Gacha.db', ['db']],
      ],
    })
    if (!legacyDatabase) {
      return
    }

    setBusy(true)

    try {
      await notifier.promise(legacyMigration({ legacyDatabase }), {
        loading: {
          title: i18n.t('Pages.Settings.Options.Migration.Migrate.Loading.Title'),
          body: i18n.t('Pages.Settings.Options.Migration.Migrate.Loading.Body'),
        },
        success (metrics) {
          return {
            title: i18n.t('Pages.Settings.Options.Migration.Migrate.Success.Title'),
            body: i18n.t('Pages.Settings.Options.Migration.Migrate.Success.Body', metrics),
          }
        },
        error (error) {
          return {
            title: i18n.t('Pages.Settings.Options.Migration.Migrate.Error'),
            body: errorTranslation(i18n, error),
          }
        },
      })
    } catch (error) {
      setBusy(false)
      throw error
    }

    // Invalidate all queries to ensure the new data is fetched
    queryClient.clear()
    setBusy(false)
  }, [i18n, notifier])

  return (
    <Locale
      component={Button}
      appearance="primary"
      mapping={['Pages.Settings.Options.Migration.Migrate.Btn']}
      onClick={handleMigrate}
      disabled={busy}
    />
  )
}
