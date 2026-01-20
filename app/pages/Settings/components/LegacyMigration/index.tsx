import { MouseEventHandler, useCallback, useState } from 'react'
import { Button } from '@fluentui/react-components'
import { DatabaseLinkRegular } from '@fluentui/react-icons'
import AppCommands from '@/api/commands/app'
import BusinessCommands from '@/api/commands/business'
import errorTrans from '@/api/errorTrans'
import { AccountBusiness, KeyofGenshinImpact, KeyofHonkaiStarRail, KeyofZenlessZoneZero } from '@/api/schemas/Account'
import useNotifier from '@/hooks/useNotifier'
import { TFunction, WithTrans, withTrans } from '@/i18n'
import SectionGroup from '@/pages/Settings/components/SectionGroup'
import SectionItem from '@/pages/Settings/components/SectionItem'
import queryClient from '@/queryClient'

export default withTrans.SettingsPage(function LegacyMigration ({ t }: WithTrans) {
  return (
    <SectionGroup>
      <SectionItem
        icon={<DatabaseLinkRegular />}
        title={t('LegacyMigration.Title')}
        subtitle={t('LegacyMigration.Subtitle')}
      >
        <Migrate t={t} />
      </SectionItem>
    </SectionGroup>
  )
})

function Migrate ({ t }: { t: TFunction }) {
  const [busy, setBusy] = useState(false)
  const notifier = useNotifier()
  const handleMigrate = useCallback<MouseEventHandler>(async () => {
    const legacy = await AppCommands.pickFile({
      title: t('LegacyMigration.Pick'),
      filters: [
        [`${__APP_NAME__}.db`, ['db']],
      ],
    })

    // Cancel pick
    if (!legacy) {
      return
    }

    setBusy(true)
    const promise = notifier.promise(BusinessCommands.legacyMigration({
      legacy,
    }), {
      loading: {
        title: t('LegacyMigration.Loading.Title'),
        body: t('LegacyMigration.Loading.Body'),
      },
      success (result) {
        // Legacy no 'Genshin Impact: Miliastra Wonderland'
        const { accounts, records, elapsed } = result
        const genshinImpact = records[AccountBusiness.GenshinImpact] ?? 0
        const honkaiStarRail = records[AccountBusiness.HonkaiStarRail] ?? 0
        const zenlessZoneZero = records[AccountBusiness.ZenlessZoneZero] ?? 0
        return {
          title: t('LegacyMigration.Success.Title'),
          body: t('LegacyMigration.Success.Body', {
            accounts,
            [KeyofGenshinImpact]: genshinImpact,
            [KeyofHonkaiStarRail]: honkaiStarRail,
            [KeyofZenlessZoneZero]: zenlessZoneZero,
            elapsed,
          }),
        }
      },
      error (error) {
        return {
          title: t('LegacyMigration.Error'),
          body: errorTrans(t, error),
        }
      },
    })

    try {
      await promise
    } catch (error) {
      setBusy(false)
      throw error
    }

    // Invalidate all queries to ensure the new data is fetched
    setBusy(false)
    queryClient.clear()
  }, [notifier, t])

  return (
    <Button
      appearance="primary"
      onClick={handleMigrate}
      disabled={busy}
    >
      {t('LegacyMigration.Migrate')}
    </Button>
  )
}
