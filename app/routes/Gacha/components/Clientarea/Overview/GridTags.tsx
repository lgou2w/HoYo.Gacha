import { memo, useMemo } from 'react'
import { Title3, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowTrendingLinesRegular, CalendarFilled, EmojiMehRegular, EmojiSparkleRegular, SparkleRegular } from '@fluentui/react-icons'
import { KnownI18nNs, Trans, useI18n } from '@/i18n'
import { AggregatedStats, StatsRecord } from '@/routes/Gacha/api/stats'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import useStatsRecordTooltip from '@/routes/Gacha/hooks/useStatsRecordTooltip'
import BadgeLabel from './BadgeLabel'
import HighlightSpan from './HighlightSpan'

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    rowGap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
  },
  header: {
    display: 'inline-flex',
    flexDirection: 'column',
  },
  labels: {
    display: 'inline-flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
  highlight: {
    color: tokens.colorBrandForeground1,
  },
})

export interface OverviewGridTagsProps {
  dataset: AggregatedStats
}

// For this component
const I18nScope = 'Clientarea.Overview.GridTags'

export default memo(function OverviewGridTags (props: OverviewGridTagsProps) {
  const {
    dataset: {
      tags: {
        luck,
        unluck,
        relation,
        crazy,
        recent,
      },
    },
  } = props
  const styles = useStyles()

  const { dayjs, t, constants } = useI18n({ ns: KnownI18nNs.GachaPage, scope: I18nScope })
  const business = useBusiness()

  const buildRecordTooltip = useStatsRecordTooltip()
  const renderItem = useMemo(
    () => function HighlightItem (record: StatsRecord) {
      return (
        <HighlightSpan
          tooltip={buildRecordTooltip(record)}
        />
      )
    },
    [buildRecordTooltip],
  )

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Title3 as="h2">
          {t('Title', { keyof: business.keyof })}
        </Title3>
      </div>
      <div className={styles.labels}>
        {recent && (
          <BadgeLabel
            icon={<ArrowTrendingLinesRegular />}
            color="brand"
            appearance="tint"
            size="extra-large"
          >
            {t('Recent', {
              date: dayjs(recent.timestamp * 1000)
                .calendar(null, constants.calendarFormats['Clientarea.Overview.GridTags']),
              count: recent.count,
            })}
          </BadgeLabel>
        )}
        {luck && (
          <BadgeLabel
            icon={<SparkleRegular />}
            color="success"
            appearance="tint"
            size="extra-large"
          >
            <Trans
              ns={KnownI18nNs.GachaPage}
              i18nKey={`${I18nScope}.Luck`}
              components={{
                item: renderItem(luck),
                1: <HighlightSpan />,
              }}
              values={{
                keyof: business.keyof,
                itemName: luck.itemName,
                count: luck.usedPity?.value,
              }}
            />
          </BadgeLabel>
        )}
        {unluck && (
          <BadgeLabel
            icon={<EmojiMehRegular />}
            size="extra-large"
          >
            <Trans
              ns={KnownI18nNs.GachaPage}
              i18nKey={`${I18nScope}.Unluck`}
              components={{
                item: renderItem(unluck),
                1: <HighlightSpan />,
              }}
              values={{
                keyof: business.keyof,
                itemName: unluck.itemName,
                count: unluck.usedPity?.value,
              }}
            />
          </BadgeLabel>
        )}
        {relation && (
          <BadgeLabel
            icon={<EmojiSparkleRegular />}
            size="extra-large"
          >
            <Trans
              ns={KnownI18nNs.GachaPage}
              i18nKey={`${I18nScope}.Relation`}
              components={{ 1: <HighlightSpan /> }}
              values={{
                keyof: business.keyof,
                itemName: relation.record.itemName,
                count: relation.count,
              }}
            />
          </BadgeLabel>
        )}
        {crazy && (
          <BadgeLabel
            icon={<CalendarFilled />}
            size="extra-large"
          >
            <Trans
              ns={KnownI18nNs.GachaPage}
              i18nKey={`${I18nScope}.Crazy`}
              components={{ 1: <HighlightSpan /> }}
              values={{
                date: dayjs(crazy.timestamp * 1000).format('L'),
                count: crazy.count,
              }}
            />
          </BadgeLabel>
        )}
      </div>
    </div>
  )
})
