import { Body1, Tooltip, makeStyles, tokens } from '@fluentui/react-components'
import { CalendarSyncRegular } from '@fluentui/react-icons'
import { AccountBusiness } from '@/api/Account'
import useIntervalTick from '@/hooks/useIntervalTick'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useAccount } from '@/routes/Gacha/contexts/Account/hooks'
import { Dayjs } from '@/utilities/dayjs'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 0 auto',
    alignItems: 'center',
    height: tokens.fontSizeBase400,
    columnGap: tokens.spacingHorizontalXS,
  },
  icon: {
    fontSize: tokens.fontSizeBase400,
    flexShrink: 0,
  },
  relativeTime: {
    color: tokens.colorBrandForeground2,
    borderBottom: `${tokens.strokeWidthThin} dashed ${tokens.colorBrandStroke2}`,
    cursor: 'help',
  },
})

export default function LastUpdated () {
  const styles = useStyles()

  const { dayjs, t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const { selected } = useAccount()
  const lastUpdated = selected?.properties?.lastGachaRecordsUpdated
  if (!lastUpdated) {
    return null
  }

  return (
    <div className={styles.root}>
      <CalendarSyncRegular className={styles.icon} />
      <Body1>
        {t('Clientarea.GachaLastUpdated', {
          keyof: AccountBusiness[selected.business],
        })}
        <RelativeTime
          className={styles.relativeTime}
          value={dayjs(lastUpdated)}
        />
      </Body1>
    </div>
  )
}

interface RelativeTimeProps {
  className?: string
  value: Dayjs
}

function RelativeTime (props: RelativeTimeProps) {
  const { className, value } = props

  // Tick every minute so `fromNow()` stays reasonably fresh.
  useIntervalTick(60 * 1000)

  return (
    <Tooltip
      content={value.format('LLLL')}
      relationship="label"
      positioning="after"
      withArrow
    >
      <Body1 className={className}>
        {value.fromNow()}
      </Body1>
    </Tooltip>
  )
}
