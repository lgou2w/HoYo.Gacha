import { ReactNode, useMemo } from 'react'
import { Badge, BadgeProps, Caption1, Title3, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { ArrowTrendingLinesFilled, CalendarFilled, EmojiMehFilled, EmojiSparkleFilled, SparkleFilled } from '@fluentui/react-icons'
import { AccountBusiness, KeyofZenlessZoneZero, ZenlessZoneZero } from '@/api/schemas/Account'
import Placeholder from '@/components/Placeholder'
import { Trans, WithTrans, WithTransKnownNs, i18nDayjs, withTrans } from '@/i18n'
import GachaImageItem from '@/pages/Gacha/components/ImageItem'
import GachaTicket from '@/pages/Gacha/components/Ticket'
import { PrettizedCategoryFlexOrderDataset, PrettizedCategoryFlexOrders } from '@/pages/Gacha/components/consts'
import { useBusiness } from '@/pages/Gacha/contexts/Business'
import { Aggregated, AggregatedRecords, CategorizedRecords, CategorizedRecordsRanking, PrettizedCategory, PrettizedRecord, PrettizedRecords, usePrettizedRecords } from '@/pages/Gacha/contexts/PrettizedRecords'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 0 auto',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalL,
  },
  item: {
    display: 'inline-flex',
    flex: '1 0 auto',
    width: `calc(50% - ${tokens.spacingHorizontalL} / 2)`,
    ...PrettizedCategoryFlexOrders,
  },
})

export default function OverviewGrid () {
  const styles = useStyles()
  const items = useGridItems(styles)

  return (
    <div className={styles.root}>
      {items}
    </div>
  )
}

function useGridItems (styles: ReturnType<typeof useStyles>): ReactNode[] {
  const { data } = usePrettizedRecords()
  return useMemo(() => {
    const datasets = data?.categorizeds
    const items: ReactNode[] = []

    Object
      .values(PrettizedCategory)
      .forEach((category) => {
        // No need
        if (category === PrettizedCategory.Beginner) {
          return
        }

        const required = category === PrettizedCategory.CollaborationCharacter
          || category === PrettizedCategory.CollaborationWeapon
          || category === PrettizedCategory.Chronicled
          || category === PrettizedCategory.Bangboo

        createGrid(
          [datasets, category],
          styles.item,
          items,
          required,
        )
      })

    if (data?.aggregated) {
      createGrid(
        data.aggregated,
        styles.item,
        items,
      )
    }

    return items
  }, [data, styles])
}

function createGrid (
  source:
    | [PrettizedRecords<AccountBusiness>['categorizeds'] | undefined, PrettizedCategory]
    | AggregatedRecords,
  className: string,
  results: ReactNode[],
  required?: boolean,
) {
  let category: PrettizedCategory | Aggregated
  let dataset: CategorizedRecords<AccountBusiness> | AggregatedRecords

  if (Array.isArray(source)) {
    const [categorizeds, mCategory] = source
    const categorized = categorizeds?.[mCategory]

    if (!categorized || (required && categorized.total <= 0)) {
      return
    } else {
      dataset = categorized
      category = mCategory
    }
  } else {
    dataset = source
    category = Aggregated
  }

  results.push((
    <div
      className={className}
      key={category}
      {...{ [PrettizedCategoryFlexOrderDataset]: category }}
    >
      <Grid dataset={dataset} />
    </div>
  ))

  if (category === Aggregated) {
    results.push((
      <div
        className={className}
        data-category={Aggregated + '-Tags'}
        key={Aggregated + '-Tags'}
      >
        {/* SAFETY: as */}
        <TagsGrid dataset={dataset as AggregatedRecords} />
      </div>
    ))
  }
}

type GridProps
  = | { dataset: CategorizedRecords<AccountBusiness> }
    | { dataset: AggregatedRecords }

const useGridStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    rowGap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
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
  header: {
    display: 'flex',
    flexDirection: 'column',
  },
  labels: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  labelsGroup: {
    display: 'inline-flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  ticket: {
    width: 'inherit',
    height: 'inherit',
    verticalAlign: 'bottom',
    [`&[data-business="${KeyofZenlessZoneZero}"]`]: {
      padding: `${tokens.spacingVerticalXXS} 0`,
    },
  },
  showcase: {
    position: 'absolute',
    right: tokens.spacingHorizontalM,
    bottom: tokens.spacingVerticalM,
  },
  tagsGridLabels: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
  hightlight: {
    color: tokens.colorBrandForeground1,
  },
})

const Grid = withTrans.GachaPage(function (
  { t, i18n, dataset }: WithTrans & GridProps,
) {
  const styles = useGridStyles()
  const business = useBusiness()

  function tGrid (subKey: string, options?: Parameters<typeof t>[2]) {
    return t(`Clientarea.Overview.Grid.${subKey}`, options)
  }

  const isCategorized = 'category' in dataset
  const isAggregated = !isCategorized
  const category = isCategorized ? dataset.category : Aggregated

  const isPermanent = category === PrettizedCategory.Permanent
  const isChronicled = category === PrettizedCategory.Chronicled
  const isBangboo = category === PrettizedCategory.Bangboo
  const isPermanentOde = category === PrettizedCategory.PermanentOde
  const isEventOde = category === PrettizedCategory.EventOde

  let timeRange: ReactNode
  if (dataset.startTime && dataset.endTime) {
    const dayjs = i18nDayjs(i18n.language)
    const start = dayjs(dataset.startTime).format('L')
    const end = dayjs(dataset.endTime).format('L')
    timeRange = (start + ' - ' + end).replace(/\//g, '.')
  }

  const golden = dataset.rankings[CategorizedRecordsRanking.Golden]
  const purple = dataset.rankings[CategorizedRecordsRanking.Purple]

  const labelContext = isPermanentOde
    ? CategorizedRecordsRanking.Purple
    : CategorizedRecordsRanking.Golden

  const total = dataset.total
  const sum = (isPermanentOde ? purple : golden).sum
  const nextPity = (isPermanentOde ? purple : golden).nextPity

  let average: number
  if (isPermanentOde || isEventOde) {
    average = (isPermanentOde
      ? purple.average
      : golden.average
    ) * 160

    // Round to 2 decimal places
    average = Math.round((average + Number.EPSILON) * 100) / 100
  } else {
    average = golden.average
  }

  const percentage = (isPermanentOde ? purple : golden).percentage

  const up
    = !isPermanent
      && !isChronicled
      && !isBangboo
      && !isPermanentOde
      && !isEventOde
      ? golden.up
      : undefined

  const [showcase, showcaseRanking]: [PrettizedRecord | undefined, CategorizedRecordsRanking]
    = isPermanentOde
      ? [purple.values[purple.values.length - 1], CategorizedRecordsRanking.Purple]
      : [golden.values[golden.values.length - 1], CategorizedRecordsRanking.Golden]

  return (
    <div
      className={styles.root}
      {...{ [PrettizedCategoryFlexOrderDataset]: category }}
    >
      <div className={mergeClasses(styles.badge, isAggregated && styles.badgeAggregated)}>
        {t(`Common:${business.keyof}.Gacha.Category.${category}`)}
      </div>
      <div className={styles.header}>
        <div>
          <Title3>
            {t(`Common:${business.keyof}.Gacha.Category.${category}`, {
              context: 'title',
            })}
          </Title3>
          {business.toBe(ZenlessZoneZero) && isAggregated && (
            <>
              <Placeholder />
              <Caption1>
                {t(`Common:${business.keyof}.Gacha.Category.${category}`, {
                  context: 'tooltip',
                })}
              </Caption1>
            </>
          )}
        </div>
        <div>
          <Caption1>
            {timeRange || <Placeholder />}
          </Caption1>
        </div>
      </div>
      <div className={styles.labels}>
        <div className={styles.labelsGroup}>
          <GridLabel color="brand" appearance="tint">
            {tGrid('Labels.Total', { count: total })}
          </GridLabel>
          <GridLabel color="success" appearance="tint">
            {tGrid('Labels.Sum', {
              context: labelContext,
              count: sum,
            })}
          </GridLabel>
          {isCategorized
            ? (
                <GridLabel color="severe" appearance="tint">
                  {tGrid('Labels.NextPity', { count: nextPity.value })}
                </GridLabel>
              )
            : null}
        </div>
        <div className={styles.labelsGroup}>
          <GridLabel>
            {tGrid('Labels.Average', {
              context: labelContext,
              count: average,
            })}
            {isCategorized && (
              <>
                <Placeholder />
                <GachaTicket
                  className={styles.ticket}
                  keyof={business.keyof}
                  category={category as PrettizedCategory}
                  data-business={business.keyof}
                />
              </>
            )}
          </GridLabel>
          <GridLabel>
            {tGrid('Labels.Percentage', {
              context: labelContext,
              count: percentage,
            })}
          </GridLabel>
        </div>
        {up && (
          <div className={styles.labelsGroup}>
            <GridLabel>
              {tGrid('Labels.UpAverage', {
                context: labelContext,
                count: up.average,
              })}
            </GridLabel>
            <GridLabel>
              {tGrid('Labels.UpPercentage', {
                context: labelContext,
                count: up.percentage,
              })}
            </GridLabel>
          </div>
        )}
        <div className={styles.labelsGroup}>
          <GridLabel>
            {tGrid(
              'Labels.Last',
              {
                context: labelContext,
                count: showcase?.usedPity?.value || 0,
                itemName: showcase?.itemName,
              },
            )}
          </GridLabel>
        </div>
      </div>
      <div className={styles.showcase}>
        {showcase && (
          <GachaImageItem
            keyof={business.keyof}
            ranking={showcaseRanking}
            record={showcase}
            noUpBadge={!up}
          />
        )}
      </div>
    </div>
  )
})

const useGridLabelStyles = makeStyles({
  root: {
    boxShadow: tokens.shadow2,
    whiteSpace: 'pre-wrap',
  },
})

function GridLabel (props: BadgeProps) {
  const styles = useGridLabelStyles()
  const {
    appearance = 'filled',
    color = 'informative',
    size = 'large',
    icon,
    children,
    ...rest
  } = props

  return (
    <Badge
      className={styles.root}
      appearance={appearance}
      color={color}
      size={size}
      icon={icon}
      {...rest}
    >
      {children}
    </Badge>
  )
}

const TagsGrid = withTrans.GachaPage(function (
  { i18n, t, dataset }:
    & WithTrans
    & { dataset: AggregatedRecords },
) {
  const styles = useGridStyles()
  const business = useBusiness()
  const dayjs = i18nDayjs(i18n.language)
  const { luck, unluck, relation, crazy, recent } = dataset.tags

  function tTags (subKey: string, options?: Parameters<typeof t>[2]) {
    return t(`Clientarea.Overview.Grid.Tags.${subKey}`, options)
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Title3>
          {tTags('Title', { keyof: business.keyof })}
        </Title3>
      </div>
      <div className={styles.tagsGridLabels}>
        {recent && (
          <GridLabel color="brand" appearance="tint" size="extra-large" icon={<ArrowTrendingLinesFilled />}>
            {tTags('Recent', {
              date: dayjs(recent[0] * 1000).fromNow(),
              count: recent[1],
            })}
          </GridLabel>
        )}
        {luck && (
          <GridLabel color="success" appearance="tint" size="extra-large" icon={<SparkleFilled />}>
            {tTags('Luck', {
              keyof: business.keyof,
              itemName: luck.itemName,
              count: luck.usedPity?.value,
            })}
          </GridLabel>
        )}
        {unluck && (
          <GridLabel size="extra-large" icon={<EmojiMehFilled />}>
            <Trans
              ns={WithTransKnownNs.GachaPage}
              i18nKey="Clientarea.Overview.Grid.Tags.Unluck"
              values={{
                keyof: business.keyof,
                itemName: unluck.itemName,
                count: unluck.usedPity?.value,
              }}
              components={{
                1: <span className={styles.hightlight} />,
              }}
            />
          </GridLabel>
        )}
        {relation && (
          <GridLabel size="extra-large" icon={<EmojiSparkleFilled />}>
            <Trans
              ns={WithTransKnownNs.GachaPage}
              i18nKey="Clientarea.Overview.Grid.Tags.Relation"
              values={{
                keyof: business.keyof,
                itemName: relation[0].itemName,
                count: relation[1],
              }}
              components={{
                1: <span className={styles.hightlight} />,
              }}
            />
          </GridLabel>
        )}
        {crazy && (
          <GridLabel size="extra-large" icon={<CalendarFilled />}>
            <Trans
              ns={WithTransKnownNs.GachaPage}
              i18nKey="Clientarea.Overview.Grid.Tags.Crazy"
              values={{
                date: dayjs(crazy[0] * 1000).format('L'),
                count: crazy[1],
              }}
              components={{
                1: <span className={styles.hightlight} />,
              }}
            />
          </GridLabel>
        )}
      </div>
    </div>
  )
})
