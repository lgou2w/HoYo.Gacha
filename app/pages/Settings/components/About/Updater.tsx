import { Button } from '@fluentui/react-components'
import { ArrowClockwiseRegular } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'
import UpdaterAction from '@/pages/Root/components/Updater'
import { useUpdaterLatestReleaseQuery } from '@/pages/Root/queries/updater'
import SectionItem from '@/pages/Settings/components/SectionItem'

export default withTrans.SettingsPage(function Updater ({ t }: WithTrans) {
  const { isFetching, data } = useUpdaterLatestReleaseQuery()
  const disabled = isFetching
    || data === null
    || data === 'offline'

  return (
    <SectionItem
      icon={<ArrowClockwiseRegular />}
      title={t('About.Updater.Title')}
      subtitle={t('About.Updater.Subtitle')}
    >
      <UpdaterAction
        trigger={(
          <Button disabled={disabled} appearance="primary">
            {t('About.Updater.CheckBtn', {
              context: isFetching
                ? 'fetching'
                : !data || data === 'offline'
                    ? 'offline'
                    : undefined,
            })}
          </Button>
        )}
      />
    </SectionItem>
  )
})
