import { Body1, Button, Caption2, PresenceBadge, makeStyles, tokens } from '@fluentui/react-components'
import { DocumentDataRegular } from '@fluentui/react-icons'
import { MetadataUpdateKind } from '@/api/commands/metadata'
import { WithTrans, withTrans } from '@/i18n'
import { useMetadata } from '@/pages/Root/contexts/Metadata'
import SectionItem from '@/pages/Settings/components/SectionItem'
import capitalize from '@/utilities/capitalize'

export default withTrans.SettingsPage(function Metadata ({ t }: WithTrans) {
  return (
    <SectionItem
      icon={<DocumentDataRegular />}
      title={t('About.Metadata.Title')}
      subtitle={t('About.Metadata.Subtitle')}
    >
      <MetadataAction t={t} />
    </SectionItem>
  )
})

const useActionStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
  },
  statusWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  status: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    columnGap: tokens.spacingHorizontalS,
  },
})

function MetadataAction ({ t }: Pick<WithTrans, 't'>) {
  const styles = useActionStyles()
  const { data, isSuccess, isFetching, isError, refetch } = useMetadata()

  let hash: string | undefined = undefined
  let status: 'away' | 'busy' | 'offline' | 'available' | 'unknown'
  let canRefetch = false

  if (isFetching) {
    status = 'away'
  } else if (isError) {
    status = 'busy'
    canRefetch = true
  } else if (isSuccess) {
    if (!data || data === 'offline') {
      status = 'offline'
    } else {
      status = 'available'
      canRefetch = true
      hash = typeof data === 'object'
        ? MetadataUpdateKind.UpToDate in data
          ? data[MetadataUpdateKind.UpToDate]
          : MetadataUpdateKind.Success in data
            ? data[MetadataUpdateKind.Success]
            : undefined
        : undefined
    }
  } else {
    status = 'unknown'
  }

  return (
    <div className={styles.root}>
      <div className={styles.statusWrapper}>
        <div className={styles.status}>
          <PresenceBadge status={status} />
          <Body1>
            {t(`About.Metadata.Status.${capitalize(status)}`)}
          </Body1>
        </div>
        {hash && (
          <Caption2 as="p" block>
            {hash}
          </Caption2>
        )}
      </div>
      {canRefetch && (
        <Button
          onClick={() => refetch()}
          size="small"
        >
          {t('About.Metadata.Refetch')}
        </Button>
      )}
    </div>
  )
}
