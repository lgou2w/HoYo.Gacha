import { Body1, Tooltip, makeStyles, tokens } from '@fluentui/react-components'
import { CalendarSyncRegular } from '@fluentui/react-icons'
import useAutoUpdate from '@/hooks/useAutoUpdate'
import { WithTrans, i18nDayjs, withTrans } from '@/i18n'
import { useBusiness } from '@/pages/Gacha/contexts/Business'
import { useSelectedAccount } from '@/pages/Gacha/queries/accounts'
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
  content: {
    flexShrink: 0,
  },
  time: {
    color: tokens.colorBrandForeground2,
    borderBottom: `${tokens.strokeWidthThin} dashed ${tokens.colorBrandStroke2}`,
    cursor: 'help',
  },
})

export default withTrans.GachaPage(function ClientareaLastUpdated ({ i18n, t }: WithTrans) {
  const styles = useStyles()
  const business = useBusiness()
  const selectedAccount = useSelectedAccount(business.keyof)
  const value = selectedAccount?.properties?.lastGachaRecordsUpdated

  if (!value) {
    return null
  }

  const time = i18nDayjs(i18n.language)(value)

  return (
    <div className={styles.root}>
      <CalendarSyncRegular className={styles.icon} />
      <Body1 className={styles.content}>
        {t('Clientarea.LastUpdated.Label', { keyof: business.keyof })}
        <Time className={styles.time} value={time} />
      </Body1>
    </div>
  )
})

function Time ({ className, value }: { className: string, value: Dayjs }) {
  // One minute
  useAutoUpdate(60 * 1000)

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
