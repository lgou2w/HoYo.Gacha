import React, { ComponentProps, Fragment, ReactNode, useMemo } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { Caption1, Divider, Subtitle2, Title1, caption1ClassNames, makeStyles, mergeClasses, title1ClassNames, tokens } from '@fluentui/react-components'
import ImagesNone from '@/assets/images/None.webp'
import BizImages from '@/components/BizImages'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { Business, Businesses, KeyofBusinesses, ReversedBusinesses } from '@/interfaces/Business'
import { CategorizedMetadata, CategorizedMetadataRankings, PrettyCategory, PrettyGachaRecord } from '@/interfaces/GachaRecord'
import { CompositeState } from '@/pages/Gacha/LegacyView/Clientarea/useCompositeState'
import GachaItemImage from '@/pages/Gacha/LegacyView/GachaItem/Image'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  cards: {
    display: 'flex',
    flexDirection: 'row',
    gap: tokens.spacingVerticalM,
    height: '100%',
  },
  card: {
    flexGrow: 1,
  },
})

export default function GachaLegacyViewClientareaAnalysisCards (props: CompositeState) {
  const styles = useStyles()
  const {
    business,
    prettized: {
      categorizeds: {
        // Beginner,
        Character,
        Weapon,
        Permanent,
        Chronicled,
        Bangboo,
      },
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
      <div className={styles.cards}>
        <div className={styles.card}>
          <CardsEntry business={business} metadata={Character} />
        </div>
        <div className={styles.card}>
          <CardsEntry business={business} metadata={Weapon} />
        </div>
        <div className={styles.card}>
          <CardsEntry business={business} metadata={Permanent} />
        </div>
        {state.hasChronicled && (
          <div className={styles.card}>
            <CardsEntry business={business} metadata={Chronicled} />
          </div>
        )}
        {state.hasBangboo && (
          <div className={styles.card}>
            <CardsEntry business={business} metadata={Bangboo} />
          </div>
        )}
      </div>
    </div>
  )
}

interface CardsEntryProps {
  business: Business
  metadata: CategorizedMetadata<Business> | null
}

const useCardsEntryStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalSNudge,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
    height: '100%',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalXXS,
  },
  headerTotal: {
    display: 'flex',
    alignItems: 'end',
    [`> .${title1ClassNames.root}`]: {
      fontFamily: tokens.fontFamilyNumeric,
    },
    '> img': {
      width: '1.25rem',
      height: '1.25rem',
      marginLeft: '0.25rem',
      marginBottom: '0.25rem',
    },
  },
  labels: {
    display: 'flex',
    flexDirection: 'column',
  },
  labelGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    [`> .${caption1ClassNames.root}`]: {
      fontFamily: tokens.fontFamilyNumeric,
    },
  },
  labelGroupGoldenAverage: {
    color: tokens.colorPaletteGreenForeground1,
  },
  labelGroupGoldenLimited: {
    color: tokens.colorPaletteRedForeground1,
  },
  labelGroupGolden: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  labelGroupPurple: {
    color: tokens.colorPaletteBerryForeground1,
  },
  labelGroupBlue: {
    color: tokens.colorPaletteBlueBorderActive,
  },
})

const RankingsPrefix: Record<Business, Record<keyof CategorizedMetadataRankings, string>> = {
  [Businesses.GenshinImpact]: {
    golden: '5★',
    purple: '4★',
    blue: '3★',
  },
  [Businesses.HonkaiStarRail]: {
    golden: '5★',
    purple: '4★',
    blue: '3★',
  },
  [Businesses.ZenlessZoneZero]: {
    golden: 'S',
    purple: 'A',
    blue: 'B',
  },
}

function CardsEntry (props: CardsEntryProps) {
  const styles = useCardsEntryStyles()
  const { business, metadata } = props
  const i18n = useI18n()

  if (!metadata) {
    return null
  }

  const keyofBusinesses = ReversedBusinesses[business]
  const isPermanent = metadata.category === PrettyCategory.Permanent
  const isChronicled = metadata.category === PrettyCategory.Chronicled
  const isBangboo = metadata.category === PrettyCategory.Bangboo
  const hasLimited = !isPermanent && !isChronicled && !isBangboo

  let timeRange: ReactNode
  if (metadata.startTime && metadata.endTime) {
    const start = i18n.dayjs(metadata.startTime).format('L')
    const end = i18n.dayjs(metadata.endTime).format('L')
    timeRange = (start + ' - ' + end).replace(/\//g, '.')
  } else {
    timeRange = <i aria-label="placeholder">&nbsp;</i>
  }

  let gachaTicket = BizImages[keyofBusinesses].Material?.IconGachaTicket02
  switch (metadata.category) {
    case PrettyCategory.Permanent:
      gachaTicket = BizImages[keyofBusinesses].Material?.IconGachaTicket01
      break
    case PrettyCategory.Bangboo:
      gachaTicket = BizImages[keyofBusinesses].Material?.IconGachaTicket03
      break
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Locale
          component={Subtitle2}
          mapping={[`Business.${keyofBusinesses}.Gacha.Category.${metadata.category}`, { context: 'Title' }]}
        />
        <div className={styles.headerTotal}>
          <Title1>{metadata.total}</Title1>
          <img src={gachaTicket} />
        </div>
      </div>
      <Divider style={{ flexGrow: 0 }}>
        {timeRange}
      </Divider>
      <div className={styles.labels}>
        {hasLimited && (
          <Fragment>
            <div className={mergeClasses(styles.labelGroup, styles.labelGroupGoldenAverage)}>
              <Locale
                component={Caption1}
                mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.AverageAndLimited']}
                childrenPosition="before"
              >
                {RankingsPrefix[business].golden}&nbsp;
              </Locale>
              <Caption1>
                {metadata.rankings.golden.average} / {metadata.rankings.golden.limitedAverage}
              </Caption1>
            </div>
            <div className={mergeClasses(styles.labelGroup, styles.labelGroupGoldenLimited)}>
              <Locale
                component={Caption1}
                mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.Limited']}
                childrenPosition="before"
              >
                {RankingsPrefix[business].golden}&nbsp;
              </Locale>
              <Caption1>
                {metadata.rankings.golden.limitedSum} [{metadata.rankings.golden.limitedPercentage}%]
              </Caption1>
            </div>
          </Fragment>
        )}
        {!hasLimited && (
          <Fragment>
            <Caption1 aria-label="placeholder">&nbsp;</Caption1>
            <Caption1 aria-label="placeholder">&nbsp;</Caption1>
          </Fragment>
        )}
        <div className={mergeClasses(styles.labelGroup, styles.labelGroupGolden)}>
          <Locale
            component={Caption1}
            mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.Count']}
            childrenPosition="before"
          >
            {RankingsPrefix[business].golden}&nbsp;
          </Locale>
          <Caption1>
            {metadata.rankings.golden.sum} [{metadata.rankings.golden.percentage}%]
          </Caption1>
        </div>
        <div className={mergeClasses(styles.labelGroup, styles.labelGroupPurple)}>
          <Locale
            component={Caption1}
            mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.Count']}
            childrenPosition="before"
          >
            {RankingsPrefix[business].purple}&nbsp;
          </Locale>
          <Caption1>
            {metadata.rankings.purple.sum} [{metadata.rankings.purple.percentage}%]
          </Caption1>
        </div>
        <div className={mergeClasses(styles.labelGroup, styles.labelGroupBlue)}>
          <Locale
            component={Caption1}
            mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.Count']}
            childrenPosition="before"
          >
            {RankingsPrefix[business].blue}&nbsp;
          </Locale>
          <Caption1>
            {metadata.rankings.blue.sum} [{metadata.rankings.blue.percentage}%]
          </Caption1>
        </div>
      </div>
      <Divider style={{ flexGrow: 0, padding: '0.25rem 0' }} />
      <CardsEntryRecords
        keyofBusinesses={keyofBusinesses}
        metadata={metadata}
      />
    </div>
  )
}

const useCardsEntryRecordsStyles = makeStyles({
  root: {
    flexGrow: 1,
    display: 'flex',
    width: '100%',
    height: '100%',
    '& [data-testid="virtuoso-item-list"]': {
      '& > :not([data-index="0"])': {
        marginTop: tokens.spacingVerticalSNudge,
      },
    },
  },
})

interface CardsEntryRecordsProps {
  keyofBusinesses: KeyofBusinesses
  metadata: CategorizedMetadata<Business>
}

function CardsEntryRecords (props: CardsEntryRecordsProps) {
  const styles = useCardsEntryRecordsStyles()
  const { keyofBusinesses, metadata } = props

  const data = useMemo(() => {
    const data: ComponentProps<typeof CardsEntryRecord>[] = metadata
      .rankings
      .golden
      .values
      .map((record, index, arrRef) => ({
        keyofBusinesses,
        category: metadata.category,
        value: [record, arrRef[index - 1]],
      }))

    data.push({
      keyofBusinesses,
      category: metadata.category,
      value: metadata.rankings.golden.nextPity,
    })

    data.reverse()
    return data
  }, [keyofBusinesses, metadata.category, metadata.rankings.golden])

  return (
    <Virtuoso
      className={styles.root}
      data={data}
      itemContent={(_, props) => (
        <CardsEntryRecord {...props} />
      )}
    />
  )
}

const useCardsEntryRecordStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '2rem',
    position: 'relative',
    paddingRight: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusMedium,
    '::before,::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      height: '100%',
      backgroundColor: tokens.colorBrandBackground,
      zIndex: -1,
    },
    '::before': {
      borderRadius: tokens.borderRadiusMedium,
      width: '100%',
      opacity: 0.3,
    },
    '::after': {
      borderTopLeftRadius: tokens.borderRadiusMedium,
      borderBottomLeftRadius: tokens.borderRadiusMedium,
      borderTopRightRadius: tokens.borderRadiusSmall,
      borderBottomRightRadius: tokens.borderRadiusSmall,
      width: 'var(--progress)',
      opacity: 0.65,
    },
  },
  rootNextPity: {
    '::before,::after': {
      backgroundColor: tokens.colorPaletteDarkOrangeBackground3,
    },
    '::before': {
      opacity: 0.3,
    },
    '::after': {
      opacity: 0.85,
    },
  },
  icon: {
    height: '100%',
    width: 'auto',
    borderTopLeftRadius: tokens.borderRadiusMedium,
    borderBottomLeftRadius: tokens.borderRadiusMedium,
  },
  name: {
    margin: `0 ${tokens.spacingHorizontalS}`,
  },
  labels: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalXS,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  label: {
    minWidth: '1rem',
    textAlign: 'right',
  },
  labelHardPity: {
    color: tokens.colorPaletteGreenForeground1,
  },
  labelLimited: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
})

interface CardsEntryRecordProps {
  keyofBusinesses: KeyofBusinesses
  category: PrettyCategory
  // [Curr Record, Prev Record | null] | Next Pity
  value: [PrettyGachaRecord, PrettyGachaRecord | null] | number
}

function CardsEntryRecord (props: CardsEntryRecordProps) {
  const styles = useCardsEntryRecordStyles()
  const {
    keyofBusinesses,
    category,
    value,
  } = props

  // Next pity
  if (typeof value === 'number') {
    return (
      <div
        className={mergeClasses(styles.root, styles.rootNextPity)}
        style={{
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          '--progress':
            calcPityProgressVar(category, value),
        }}
      >
        <img className={styles.icon} src={ImagesNone} />
        <Locale
          component={Caption1}
          className={styles.name}
          mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntryRecord.NextPity']}
        />
        <div className={styles.labels}>
          <Caption1 className={styles.label}>
            {value}
          </Caption1>
        </div>
      </div>
    )
  }

  // Record
  const [record, prevRecord] = value
  const showLimitedLabels = category === PrettyCategory.Character ||
    category === PrettyCategory.Weapon

  let isHardPity = false
  if (prevRecord && !prevRecord.limited && record.limited) {
    isHardPity = true
  }

  return (
    <div
      className={styles.root}
      style={{
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        '--progress':
          calcPityProgressVar(category, record.usedPity),
      }}
    >
      <GachaItemImage
        className={styles.icon}
        keyofBusinesses={keyofBusinesses}
        record={record}
      />
      <Caption1 className={styles.name} wrap={false} truncate>
        {record.name}
      </Caption1>
      <div className={styles.labels}>
        {showLimitedLabels && (
          <Fragment>
            {isHardPity && (
              <Locale
                component={Caption1}
                className={mergeClasses(styles.label, styles.labelHardPity)}
                wrap={false}
                mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntryRecord.HardPity']}
              />
            )}
            {record.limited && (
              <Locale
                component={Caption1}
                className={mergeClasses(styles.label, styles.labelLimited)}
                wrap={false}
                mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntryRecord.Limited']}
              />
            )}
          </Fragment>
        )}
        <Caption1 className={styles.label}>
          {record.usedPity}
        </Caption1>
      </div>
    </div>
  )
}

function calcPityProgressVar (category: PrettyCategory, usedPity: number | undefined) {
  if (!usedPity || usedPity === 0) {
    return 0
  }

  let maxPity = 80
  if (category === PrettyCategory.Character || category === PrettyCategory.Permanent) {
    maxPity = 90
  }

  const progress = Math.round(usedPity / maxPity * 100)
  return progress + '%'
}
