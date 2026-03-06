import { Button, Link, MessageBar, MessageBarBody, MessageBarTitle } from '@fluentui/react-components'
import { WithTrans, i18nDayjs, withTrans } from '@/i18n'
import { useUpdaterLatestReleaseQuery } from '@/pages/Root/queries/updater'
import Updater from './Updater'

export default withTrans.RootPage(function UpdaterAlert ({ i18n, t }: WithTrans) {
  const dayjs = i18nDayjs(i18n.language)
  const { isSuccess, data } = useUpdaterLatestReleaseQuery()

  // Failed | Fetching | Feature disable | Offline | Disabled by user
  if (!isSuccess
    || !data || data === 'offline'
    || data === 'disabledStartupCheck') {
    return null
  }

  // Up-to-date
  const [latestRelease, canUpdate] = data
  if (!canUpdate) {
    return null
  }

  // Need update
  return (
    <MessageBar intent="success" layout="singleline">
      <MessageBarBody>
        <MessageBarTitle>
          {t('UpdaterAlert.Title')}
        </MessageBarTitle>
        <Link
          href={`${__APP_REPOSITORY__}/releases/tag/${latestRelease.tagName}`}
          target="_blank"
          rel="noreferrer"
        >
          {`v${latestRelease.tagName}`}
        </Link>
        {`（${dayjs(latestRelease.createdAt).fromNow()}）`}
        <Updater
          trigger={(
            <Button appearance="primary" size="small">
              {t('UpdaterAlert.Download')}
            </Button>
          )}
        />
      </MessageBarBody>
    </MessageBar>
  )
})
