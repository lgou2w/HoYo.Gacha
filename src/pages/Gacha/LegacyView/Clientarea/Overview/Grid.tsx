import React, { PropsWithChildren, ReactNode, useMemo } from 'react'
import { Badge, BadgeProps, Caption1, Title3, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import BizImages from '@/components/BizImages'
import Locale, { LocaleMapping } from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { Business, Businesses, ReversedBusinesses, isMiliastraWonderland } from '@/interfaces/Business'
import { AggregatedMetadata, CategorizedMetadata, PrettyCategory, PrettyGachaRecord } from '@/interfaces/GachaRecord'
import { CompositeState } from '@/pages/Gacha/LegacyView/Clientarea/useCompositeState'
import GachaItem from '@/pages/Gacha/LegacyView/GachaItem'

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

export default function GachaLegacyViewClientareaOverviewGrid (props: CompositeState) {
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
        CollaborationCharacter,
        CollaborationWeapon,
        PermanentOde,
        EventOde,
      },
      aggregated,
    },
  } = props

  const state = useMemo(() => ({
    hasChronicled: Chronicled && Chronicled.total > 0,
    hasBangboo: Bangboo && Bangboo.total > 0,
    hasCollaborationCharacter: CollaborationCharacter && CollaborationCharacter.total > 0,
    hasCollaborationWeapon: CollaborationWeapon && CollaborationWeapon.total > 0,
  }), [
    Bangboo,
    Chronicled,
    CollaborationCharacter,
    CollaborationWeapon,
  ])

  const items = []

  if (Character) {
    items.push(createGridItem(styles.half, PrettyCategory.Character, business, Character))
  }

  if (Weapon) {
    items.push(createGridItem(styles.half, PrettyCategory.Weapon, business, Weapon))
  }

  if (state.hasCollaborationCharacter) {
    items.push(createGridItem(styles.half, PrettyCategory.CollaborationCharacter, business, CollaborationCharacter))
  }

  if (state.hasCollaborationWeapon) {
    items.push(createGridItem(styles.half, PrettyCategory.CollaborationWeapon, business, CollaborationWeapon))
  }

  if (state.hasChronicled) {
    items.push(createGridItem(styles.half, PrettyCategory.Chronicled, business, Chronicled))
  }

  if (Permanent) {
    items.push(createGridItem(styles.half, PrettyCategory.Permanent, business, Permanent))
  }

  if (state.hasBangboo) {
    items.push(createGridItem(styles.half, PrettyCategory.Bangboo, business, Bangboo))
  }

  if (PermanentOde) {
    items.push(createGridItem(styles.full, PrettyCategory.PermanentOde, business, PermanentOde))
  }

  if (EventOde) {
    items.push(createGridItem(styles.full, PrettyCategory.EventOde, business, EventOde))
  }

  if (aggregated) {
    items.push(createGridItem(
      items.length % 2 === 0 ? styles.full : styles.half,
      'Aggregated',
      business,
      aggregated,
      Beginner,
    ))
  }

  return (
    <div className={styles.root}>
      {items}
    </div>
  )
}

function createGridItem (
  className: string,
  category: PrettyCategory | 'Aggregated',
  business: Business,
  metadata: CategorizedMetadata<Business> | AggregatedMetadata | null,
  beginner?: CategorizedMetadata<Business> | null,
) {
  return (
    <div key={category} className={className} data-category={category}>
      <GridCard business={business} metadata={metadata} beginner={beginner} />
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
  const isBeyond = isMiliastraWonderland(keyofBusinesses)
  const state = useMemo(() => {
    if (!metadata) {
      return null
    }

    const isCategorized = 'category' in metadata
    const isPermanentOde = isCategorized && metadata.category === PrettyCategory.PermanentOde

    const purpleRanking = metadata.rankings.purple
    const goldenRanking = metadata.rankings.golden
    const showcase: PrettyGachaRecord | undefined = isPermanentOde
      ? purpleRanking.values[purpleRanking.values.length - 1]
      : goldenRanking.values[goldenRanking.values.length - 1]

    let timeRange: ReactNode
    if (metadata.startTime && metadata.endTime) {
      const start = i18n.dayjs(metadata.startTime).format('L')
      const end = i18n.dayjs(metadata.endTime).format('L')
      timeRange = (start + ' - ' + end).replace(/\//g, '.')
    } else {
      timeRange = <i aria-label="placeholder">{'\u00A0'}</i>
    }

    let gachaTicket = BizImages[keyofBusinesses].Material?.IconGachaTicket02
    if (isCategorized) {
      switch (metadata.category) {
        case PrettyCategory.Permanent:
        case PrettyCategory.PermanentOde:
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
      isPermanentOde,
      isEventOde: isCategorized && metadata.category === PrettyCategory.EventOde,
      total: metadata.total,
      timeRange,
      gachaTicket,
      purpleRanking: {
        nextPity: purpleRanking.nextPity,
        percentage: purpleRanking.percentage,
        average: purpleRanking.average,
        sum: purpleRanking.sum,
      },
      goldenRanking: {
        nextPity: goldenRanking.nextPity,
        percentage: goldenRanking.percentage,
        average: goldenRanking.average,
        upSum: goldenRanking.upSum,
        upPercentage: goldenRanking.upPercentage,
        upAverage: goldenRanking.upAverage,
        sum: goldenRanking.sum,
      },
      showcase,
      beginnerShowcase,
    }
  }, [metadata, keyofBusinesses, beginner, i18n])

  if (!state) {
    return null
  }

  return (
    <div className={styles.root} data-category={state.category}>
      <div className={mergeClasses(styles.badge, state.isAggregated && styles.badgeAggregated)}>
        <Locale mapping={[`Business.${keyofBusinesses}.Gacha.Category.${state.category}`]} />
      </div>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Locale
            component={Title3}
            mapping={[`Business.${keyofBusinesses}.Gacha.Category.${state.category}`, { context: 'Title' }]}
          />
          {business === Businesses.ZenlessZoneZero && state.isAggregated && (
            <Locale
              component={Caption1}
              mapping={[`Business.${keyofBusinesses}.Gacha.Category.${state.category}`, { context: 'NoBangboo' }]}
              childrenPosition="before"
            >
              <i aria-label="placeholder">{'\u00A0'}</i>
            </Locale>
          )}
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
              `Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.${state.isPermanentOde ? 'PurpleSum' : 'GoldenSum'}`,
              {
                count: state.isPermanentOde
                  ? state.purpleRanking.sum
                  : state.goldenRanking.sum,
              },
            ]}
          />
          {!state.isAggregated
            ? <GridCardLabelBadge
                color="severe"
                mapping={[
                  'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.NextPity',
                  {
                    count: state.isPermanentOde
                      ? state.purpleRanking.nextPity
                      : state.goldenRanking.nextPity,
                  },
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
              `Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.${state.isPermanentOde ? 'AveragePurple' : 'Average'}`,
              {
                count: state.isPermanentOde
                  ? state.purpleRanking.average * 160
                  : state.isEventOde
                    ? state.goldenRanking.average * 160
                    : state.goldenRanking.average,
              },
            ]}
          >
            <i aria-label="placeholder">{'\u00A0'}</i>
            <img src={state.gachaTicket} />
          </GridCardLabelBadge>
          <GridCardLabelBadge
            mapping={[
              `Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.${state.isPermanentOde ? 'PercentagePurple' : 'Percentage'}`,
              {
                count: state.isPermanentOde
                  ? state.purpleRanking.percentage
                  : state.goldenRanking.percentage,
              },
            ]}
          />
        </div>
        {!state.isPermanent && !state.isChronicled && !state.isBangboo && !isBeyond && (
          <div className={styles.labelsGroup}>
            <GridCardLabelBadge
              mapping={[
                'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.UpAverage',
                { count: state.goldenRanking.upAverage },
              ]}
            >
              <i aria-label="placeholder">{'\u00A0'}</i>
              <img src={state.gachaTicket} />
            </GridCardLabelBadge>
            <GridCardLabelBadge
              mapping={[
                'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.UpPercentage',
                { count: state.goldenRanking.upPercentage },
              ]}
            />
          </div>
        )}
        <div className={styles.labelsGroup}>
          <GridCardLabelBadge
            mapping={state.showcase
              ? [`Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.${state.isPermanentOde ? 'LastPurple' : 'LastGolden'}`, {
                  name: state.showcase.name,
                  usedPity: state.showcase.usedPity,
                }]
              : [`Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.${state.isPermanentOde ? 'LastPurpleNone' : 'LastGoldenNone'}`]
            }
          />
        </div>
      </div>
      <div className={styles.showcase}>
        {state.showcase && (
          <GachaItem
            keyofBusinesses={keyofBusinesses}
            record={state.showcase}
            ranking={state.isPermanentOde ? 'Purple' : 'Golden'}
            noUpBadge={state.isPermanent || state.isChronicled || state.isBangboo || isBeyond}
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
