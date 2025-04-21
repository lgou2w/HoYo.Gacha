import React, { PropsWithChildren, ReactNode, useMemo } from 'react'
import { Badge, BadgeProps, Caption1, Title3, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import BizImages from '@/components/BizImages'
import Locale, { LocaleMapping } from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { Business, ReversedBusinesses } from '@/interfaces/Business'
import { AggregatedMetadata, CategorizedMetadata, PrettyCategory, PrettyGachaRecord } from '@/interfaces/GachaRecord'
import GachaItem from '@/pages/Gacha/LegacyView/GachaItem'
import { ParentCompositeState } from './declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalL,
  },
  half: {
    flexGrow: 0,
    flexBasis: 'auto',
    width: `calc(50% - ${tokens.spacingHorizontalL} / 2)`,
  },
  full: {
    flexGrow: 0,
    flexBasis: 'auto',
    width: '100%',
  },
})

export default function GachaLegacyViewClientareaOverviewGrid (props: ParentCompositeState) {
  const styles = useStyles()
  const {
    prettized: {
      business,
      categorizeds: {
        Beginner,
        Character,
        Weapon,
        Permanent,
        Chronicled,
        Bangboo,
      },
      aggregated,
    },
  } = props

  const state = useMemo(() => ({
    hasChronicled: !!Chronicled && Chronicled.total > 0,
    hasBangboo: !!Bangboo && Bangboo.total > 0,
  }), [
    Bangboo,
    Chronicled,
  ])

  return (
    <div className={styles.root}>
      <div className={styles.half}><GridCard business={business} metadata={Character} /></div>
      <div className={styles.half}><GridCard business={business} metadata={Weapon} /></div>
      <div className={styles.half}><GridCard business={business} metadata={Permanent} /></div>
      {state.hasChronicled && (
        <div className={styles.half}><GridCard business={business} metadata={Chronicled} /></div>
      )}
      {state.hasBangboo && (
        <div className={styles.half}><GridCard business={business} metadata={Bangboo} /></div>
      )}
      <div className={state.hasChronicled || state.hasBangboo ? styles.full : styles.half}>
        <GridCard business={business} metadata={aggregated} beginner={Beginner} />
      </div>
    </div>
  )
}

const useGridCardStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
    width: '100%',
    height: '100%',
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteLightGreenBorder1}`,
    borderBottomLeftRadius: tokens.borderRadiusMedium,
    borderTopRightRadius: tokens.borderRadiusMedium,
    background: tokens.colorPaletteLightGreenBackground2,
    color: tokens.colorPaletteLightGreenForeground2,
    lineHeight: tokens.lineHeightBase200,
    fontSize: tokens.fontSizeBase200,
  },
  badgeAggregated: {
    border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteMarigoldBorder1}`,
    background: tokens.colorPaletteMarigoldBackground2,
    color: tokens.colorPaletteMarigoldForeground2,
  },
  header: {},
  headerTitle: {},
  headerSubtitle: {},
  labels: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  labelsGroup: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    '& img': {
      width: 'inherit',
      height: 'inherit',
      verticalAlign: 'bottom',
    },
  },
  showcase: {
    position: 'absolute',
    right: tokens.spacingHorizontalM,
    bottom: tokens.spacingVerticalM,
  },
})

interface GridCardProps {
  business: Business
  metadata: CategorizedMetadata<Business> | AggregatedMetadata | null
  beginner?: CategorizedMetadata<Business> | null
}

function GridCard (props: GridCardProps) {
  const styles = useGridCardStyles()
  const { business, metadata, beginner } = props
  const i18n = useI18n()

  const keyofBusinesses = ReversedBusinesses[business]
  const state = useMemo(() => {
    if (!metadata) {
      return null
    }

    const isCategorized = 'category' in metadata
    const goldenRanking = metadata.rankings.golden
    const showcase = goldenRanking.values[goldenRanking.values.length - 1] as PrettyGachaRecord | undefined

    let timeRange: ReactNode
    if (metadata.startTime && metadata.endTime) {
      const start = i18n.dayjs(metadata.startTime).format('L')
      const end = i18n.dayjs(metadata.endTime).format('L')
      timeRange = (start + ' - ' + end).replace(/\//g, '.')
    } else {
      timeRange = <i aria-label="placeholder">&nbsp;</i>
    }

    let gachaTicket = BizImages[keyofBusinesses].Material?.IconGachaTicket02
    if (isCategorized) {
      switch (metadata.category) {
        case PrettyCategory.Permanent:
          gachaTicket = BizImages[keyofBusinesses].Material?.IconGachaTicket01
          break
        case PrettyCategory.Bangboo:
          gachaTicket = BizImages[keyofBusinesses].Material?.IconGachaTicket03
          break
      }
    }

    const beginnerShowcase = beginner
      ? beginner.rankings.golden.values[beginner.rankings.golden.values.length - 1]
      : undefined

    return {
      category: isCategorized ? metadata.category : 'Aggregated',
      isAggregated: !isCategorized,
      isPermanent: isCategorized && metadata.category === PrettyCategory.Permanent,
      isChronicled: isCategorized && metadata.category === PrettyCategory.Chronicled,
      isBangboo: isCategorized && metadata.category === PrettyCategory.Bangboo,
      total: metadata.total,
      timeRange,
      gachaTicket,
      goldenRanking: {
        nextPity: goldenRanking.nextPity,
        percentage: goldenRanking.percentage,
        average: goldenRanking.average,
        limitedSum: goldenRanking.limitedSum,
        limitedPercentage: goldenRanking.limitedPercentage,
        limitedAverage: goldenRanking.limitedAverage,
        sum: goldenRanking.sum,
        showcase,
      },
      beginnerShowcase,
    }
  }, [metadata, keyofBusinesses, beginner, i18n])

  if (!state) {
    return null
  }

  const categoryKeyNamespace = `Business.${keyofBusinesses}.Gacha.Category.${state.category}`

  return (
    <div className={styles.root} data-category={state.category}>
      <div className={mergeClasses(styles.badge, state.isAggregated && styles.badgeAggregated)}>
        <Locale mapping={[[`${categoryKeyNamespace}.Badge`, categoryKeyNamespace]]} />
      </div>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Locale
            component={Title3}
            mapping={[[`${categoryKeyNamespace}.Title`, categoryKeyNamespace]]}
          />
        </div>
        <div className={styles.headerSubtitle}>
          <Caption1>{state.timeRange}</Caption1>
        </div>
      </div>
      <div className={styles.labels}>
        <div className={styles.labelsGroup}>
          <GridCardLabelBadge
            color="brand"
            mapping={[
              'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.Total',
              { count: state.total },
            ]}
          />
          <GridCardLabelBadge
            color="success"
            mapping={[
              'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.GoldenSum',
              { count: state.goldenRanking.sum },
            ]}
          />
          {!state.isAggregated
            ? <GridCardLabelBadge
                color="severe"
                mapping={[
                  'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.NextPity',
                  { count: state.goldenRanking.nextPity },
                ]}
              />
            : state.beginnerShowcase && (
              <GridCardLabelBadge
                color="severe"
                mapping={[
                  'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.Beginner',
                  { name: state.beginnerShowcase.name },
                ]}
              />
            )
          }
        </div>
        <div className={styles.labelsGroup}>
          <GridCardLabelBadge
            mapping={[
              'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.Average',
              { count: state.goldenRanking.average },
            ]}
          >
            <i aria-label="placeholder">&nbsp;</i>
            <img src={state.gachaTicket} />
          </GridCardLabelBadge>
          <GridCardLabelBadge
            mapping={[
              'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.Percentage',
              { count: state.goldenRanking.percentage },
            ]}
          />
        </div>
        {!state.isPermanent && !state.isChronicled && !state.isBangboo && (
          <div className={styles.labelsGroup}>
            <GridCardLabelBadge
              mapping={[
                'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.LimitedAverage',
                { count: state.goldenRanking.limitedAverage },
              ]}
            >
              <i aria-label="placeholder">&nbsp;</i>
              <img src={state.gachaTicket} />
            </GridCardLabelBadge>
            <GridCardLabelBadge
              mapping={[
                'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.LimitedPercentage',
                { count: state.goldenRanking.limitedPercentage },
              ]}
            />
          </div>
        )}
        <div className={styles.labelsGroup}>
          <GridCardLabelBadge
            mapping={state.goldenRanking.showcase
              ? ['Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.LastGolden', {
                  name: state.goldenRanking.showcase.name,
                  usedPity: state.goldenRanking.showcase.usedPity,
                }]
              : ['Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.LastGoldenNone']
            }
          />
        </div>
      </div>
      <div className={styles.showcase}>
        {state.goldenRanking.showcase && (
          <GachaItem
            keyofBusinesses={keyofBusinesses}
            record={state.goldenRanking.showcase}
            noLimitedBadge={state.isChronicled || state.isBangboo}
            ranking="Golden"
            small
          />
        )}
      </div>
    </div>
  )
}

const useGridCardLabelBadgeStyles = makeStyles({
  root: {
    boxShadow: tokens.shadow2,
  },
})

type GridCardLabelBadgeProps = PropsWithChildren<{
  color?: BadgeProps['color']
  mapping: LocaleMapping
}>

function GridCardLabelBadge (props: GridCardLabelBadgeProps) {
  const styles = useGridCardLabelBadgeStyles()
  const { color = 'informative', mapping, children } = props

  return (
    <Locale
      component={Badge}
      className={styles.root}
      size="large"
      color={color}
      mapping={mapping}
    >
      {children}
    </Locale>
  )
}
