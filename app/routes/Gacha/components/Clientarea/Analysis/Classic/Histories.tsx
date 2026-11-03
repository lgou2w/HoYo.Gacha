import { useMemo } from 'react'
import { Body1, Body2, Caption1, makeStyles, tokens } from '@fluentui/react-components'
import { HistoryRegular } from '@fluentui/react-icons'
import { AccountBusiness } from '@/api/Account'
import { KnownI18nNs, isChinese, useI18n } from '@/i18n'
import { BannerCategory, BannerStats, Rarity } from '@/routes/Gacha/api/stats'
import BannerCategoryName from '@/routes/Gacha/components/Banner/CategoryName'
import GachaImageItem from '@/routes/Gacha/components/ImageItem'
import { hasUpBanner } from '@/routes/Gacha/components/types'
import { useBannerSortable, useVisibleBanners } from '@/routes/Gacha/contexts/BannerSortable/hooks'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import { useGachaStats } from '@/routes/Gacha/contexts/Stats/hooks'
import capitalize from '@/utilities/capitalize'
import RecordsOrderSwitch from './RecordsOrderSwitch'
import { useRecordsOrderSuspenseQuery } from './hooks'
import { RecordsOrder, sortRecords } from './types'

const TitleWidth = '8.5rem'

const useHistoriesStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '0 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    height: tokens.fontSizeBase400,
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    minWidth: TitleWidth,
  },
  headerIcon: {
    flexShrink: 0,
    fontSize: tokens.fontSizeBase400,
  },
  histories: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    minWidth: TitleWidth,
  },
})

export function AnalysisHistories () {
  const styles = useHistoriesStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Clientarea.Analysis.Classic.Histories' })
  const business = useBusiness()
  const stats = useGachaStats()
  const banners = useBannerSortable()
  const visible = useVisibleBanners(stats, banners)

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <HistoryRegular className={styles.headerIcon} />
          <Body1>
            {t('Title', {
              context: business.keyof,
              keyof: business.keyof,
            })}
          </Body1>
        </div>
        <RecordsOrderSwitch />
      </div>
      <div className={styles.histories}>
        {visible.map((category) => {
          const dataset = stats?.banners[category]
          if (!dataset) {
            return null
          } else {
            return (
              <AnalysisHistory
                key={category}
                category={category}
                dataset={dataset}
              />
            )
          }
        })}
      </div>
    </div>
  )
}

const useHistoryStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    width: TitleWidth,
    padding: tokens.spacingVerticalM,
  },
  sumUp: {
    color: tokens.colorPaletteRedForeground1,
  },
  sumGolden: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  sumPurple: {
    color: tokens.colorPaletteBerryForeground1,
  },
  divider: {
    flex: '0 0 auto',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteMarigoldBackground3}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  records: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: '0 1 auto',
    rowGap: tokens.spacingVerticalS,
    columnGap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalM,
  },
})

interface AnalysisHistoryProps {
  category: BannerCategory
  dataset: BannerStats<AccountBusiness>
}

function AnalysisHistory (props: AnalysisHistoryProps) {
  const { category, dataset } = props
  const styles = useHistoryStyles()
  const { t, language } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Clientarea.Analysis.Classic.Histories' })
  const business = useBusiness()
  const { data: order } = useRecordsOrderSuspenseQuery()
  const computed = useMemo(() => {
    if (category === BannerCategory.EventOde) {
      const purple = dataset.rarity.purple.values
      const golden = dataset.rarity.golden.values

      // Merge in ascending id order — same order the backend returns, so
      // `OldestFirst` needs no further work.
      const merged = [
        ...purple.map((record, index) => ({ rarity: Rarity.Purple, index, record })),
        ...golden.map((record, index) => ({ rarity: Rarity.Golden, index, record })),
      ].sort((a, b) => a.record.id.localeCompare(b.record.id))

      return {
        // `merged` is a local array built above — reversing it in place is
        // safe and avoids a second copy.
        merged: order === RecordsOrder.NewestFirst ? merged.reverse() : merged,
        rarity: Rarity.Golden as const,
        isEmpty: merged.length <= 0,
      }
    }

    const rarity = category === BannerCategory.PermanentOde
      ? Rarity.Purple as const
      : Rarity.Golden as const

    const records = dataset.rarity[rarity].values

    return {
      rarity,
      records: sortRecords(records, order),
      isEmpty: records.length <= 0,
    }
  }, [category, dataset, order])

  if (computed.isEmpty) {
    return null
  }

  const { rarity = Rarity.Golden } = computed
  const hasUp = hasUpBanner(category)

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Body2>
          <BannerCategoryName
            category={category}
            context={isChinese(language) ? undefined : 'short'}
          />
        </Body2>
        <Body1>
          {t('Total', { count: dataset.total })}
        </Body1>
        <div>
          {hasUp && (
            <>
              <Caption1 className={styles.sumUp}>
                {t('Sum', {
                  count: dataset.rarity[rarity].up.sum,
                  context: 'up',
                })}
              </Caption1>
              <Caption1> / </Caption1>
            </>
          )}
          {/* {isEventOde && !Array.isArray(computed.merged) && (
            <>
              <Caption1 className={styles.sumPurple}>
                {dataset.rankings[CategorizedRecordsRanking.Purple].sum}
              </Caption1>
              <Caption1> / </Caption1>
            </>
          )} */}
          <Caption1 className={styles[`sum${capitalize(rarity)}`]}>
            {t('Sum', {
              count: dataset.rarity[rarity].sum,
            })}
          </Caption1>
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.records}>
        {computed.merged
          ? computed.merged.map(({ rarity, record }) => (
              <GachaImageItem
                key={`${rarity}:${record.id}`}
                keyof={business.keyof}
                rarity={rarity}
                record={record}
                noUpBadge={!hasUp}
                small
              />
            ))
          : computed.records.map((record) => (
              <GachaImageItem
                key={record.id}
                keyof={business.keyof}
                rarity={rarity}
                record={record}
                noUpBadge={!hasUp}
                small
              />
            ))}
      </div>
    </div>
  )
}
