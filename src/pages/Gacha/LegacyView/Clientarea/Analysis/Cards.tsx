import React, { ComponentProps, Fragment, ReactNode, WheelEventHandler, useCallback, useMemo, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { Caption1, Divider, Subtitle2, Tab, TabList, Title1, makeStyles, mergeClasses, tabClassNames, title1ClassNames, tokens } from '@fluentui/react-components'
import ImagesNone from '@/assets/images/None.avif'
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
    overflow: 'auto hidden',
    scrollBehavior: 'smooth',
    padding: '2px',
  },
  card: {
    flex: 1,
    minWidth: '12.75rem',
    boxShadow: tokens.shadow2,
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
        CollaborationCharacter,
        CollaborationWeapon,
      },
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

  const transformScroll = useCallback<WheelEventHandler>((evt) => {
    function shouldPreventHorizontalScroll (evt: React.WheelEvent) {
      let el: EventTarget | ParentNode | null = evt.target

      while (el && el instanceof HTMLElement && el !== evt.currentTarget) {
        if (el.style.overflowY === 'auto' || el.style.overflowY === 'scroll') {
          return false
        }
        el = el.parentNode
      }

      return true
    }

    if (!evt.deltaY || !shouldPreventHorizontalScroll(evt)) {
      return
    }

    const delta = Math.abs(evt.deltaY)
    const dir = evt.deltaY > 0 ? 1 : -1
    evt.currentTarget.scrollLeft += Math.max(delta, 100) * dir + evt.deltaX
  }, [])

  return (
    <div className={styles.root}>
      <div className={styles.cards} onWheel={transformScroll}>
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
        {state.hasCollaborationCharacter && (
          <div className={styles.card}>
            <CardsEntry business={business} metadata={CollaborationCharacter} />
          </div>
        )}
        {state.hasCollaborationWeapon && (
          <div className={styles.card}>
            <CardsEntry business={business} metadata={CollaborationWeapon} />
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
  },
  labelGroupNumeric: {
    fontFamily: tokens.fontFamilyNumeric,
  },
  labelGroupGoldenAverage: {
    color: tokens.colorPaletteGreenForeground1,
  },
  labelGroupGoldenUpWin: {
    color: tokens.colorPaletteRedForeground1,
  },
  labelGroupGoldenUp: {
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
  const hasUp = !isPermanent && !isChronicled && !isBangboo

  let timeRange: ReactNode
  if (metadata.startTime && metadata.endTime) {
    const start = i18n.dayjs(metadata.startTime).format('L')
    const end = i18n.dayjs(metadata.endTime).format('L')
    timeRange = (start + ' - ' + end).replace(/\//g, '.')
  } else {
    timeRange = <i aria-label="placeholder">{'\u00A0'}</i>
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
          truncate
          wrap={false}
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
        {hasUp && (
          <Fragment>
            <div className={mergeClasses(styles.labelGroup, styles.labelGroupGoldenAverage)}>
              <Locale
                component={Caption1}
                mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.AverageAndUp']}
                childrenPosition="before"
              >
                {RankingsPrefix[business].golden}{'\u00A0'}
              </Locale>
              <Caption1 className={styles.labelGroupNumeric}>
                {metadata.rankings.golden.average} / {metadata.rankings.golden.upAverage}
              </Caption1>
            </div>
            <div className={mergeClasses(styles.labelGroup, styles.labelGroupGoldenUpWin)}>
              <Locale
                component={Caption1}
                mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.UpWin']}
                childrenPosition="before"
              >
                {RankingsPrefix[business].golden}{'\u00A0'}
              </Locale>
              <Caption1 className={styles.labelGroupNumeric}>
                {metadata.rankings.golden.upWinSum} [{metadata.rankings.golden.upWinPercentage}%]
              </Caption1>
            </div>
            <div className={mergeClasses(styles.labelGroup, styles.labelGroupGoldenUp)}>
              <Locale
                component={Caption1}
                mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.Up']}
                childrenPosition="before"
              >
                {RankingsPrefix[business].golden}{'\u00A0'}
              </Locale>
              <Caption1 className={styles.labelGroupNumeric}>
                {metadata.rankings.golden.upSum} [{metadata.rankings.golden.upPercentage}%]
              </Caption1>
            </div>
          </Fragment>
        )}
        {!hasUp && (
          <Fragment>
            <Caption1 aria-label="placeholder">{'\u00A0'}</Caption1>
            <Caption1 aria-label="placeholder">{'\u00A0'}</Caption1>
            <Caption1 aria-label="placeholder">{'\u00A0'}</Caption1>
          </Fragment>
        )}
        <div className={mergeClasses(styles.labelGroup, styles.labelGroupGolden)}>
          <Locale
            component={Caption1}
            mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.Count']}
            childrenPosition="before"
          >
            {RankingsPrefix[business].golden}{'\u00A0'}
          </Locale>
          <Caption1 className={styles.labelGroupNumeric}>
            {metadata.rankings.golden.sum} [{metadata.rankings.golden.percentage}%]
          </Caption1>
        </div>
        <div className={mergeClasses(styles.labelGroup, styles.labelGroupPurple)}>
          <Locale
            component={Caption1}
            mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.Count']}
            childrenPosition="before"
          >
            {RankingsPrefix[business].purple}{'\u00A0'}
          </Locale>
          <Caption1 className={styles.labelGroupNumeric}>
            {metadata.rankings.purple.sum} [{metadata.rankings.purple.percentage}%]
          </Caption1>
        </div>
        <div className={mergeClasses(styles.labelGroup, styles.labelGroupBlue)}>
          <Locale
            component={Caption1}
            mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.Count']}
            childrenPosition="before"
          >
            {RankingsPrefix[business].blue}{'\u00A0'}
          </Locale>
          <Caption1 className={styles.labelGroupNumeric}>
            {metadata.rankings.blue.sum} [{metadata.rankings.blue.percentage}%]
          </Caption1>
        </div>
      </div>
      <Divider style={{ flexGrow: 0, padding: '0.25rem 0' }} />
      <CardsEntryRecordsTabList
        business={business}
        keyofBusinesses={keyofBusinesses}
        metadata={metadata}
      />
    </div>
  )
}

const useCardsEntryRecordsTabListStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    height: '100%',
  },
  tabList: {
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  tab: {
    flexGrow: 1,
  },
  tabGolden: {
    '&:enabled:hover': {
      [`& .${tabClassNames.content}`]: {
        color: tokens.colorPaletteMarigoldForeground1,
      },
    },
    [`& .${tabClassNames.content}`]: {
      color: tokens.colorPaletteMarigoldForeground1,
    },
  },
  tabPurple: {
    '&:enabled:hover': {
      [`& .${tabClassNames.content}`]: {
        color: tokens.colorPaletteBerryForeground1,
      },
    },
    [`& .${tabClassNames.content}`]: {
      color: tokens.colorPaletteBerryForeground1,
    },
  },
  tabDivider: {
    flexGrow: 0,
  },
})

interface CardsEntryRecordsTabListProps {
  business: Business
  keyofBusinesses: KeyofBusinesses
  metadata: CategorizedMetadata<Business>
}

function CardsEntryRecordsTabList (props: CardsEntryRecordsTabListProps) {
  const styles = useCardsEntryRecordsTabListStyles()
  const { business, keyofBusinesses, metadata } = props
  const [ranking, setRanking] = useState<keyof Omit<CategorizedMetadataRankings, 'blue'>>('golden')
  const handleSelect = useCallback<Required<ComponentProps<typeof TabList>>['onTabSelect']>((_, data) => {
    setRanking(data.value as typeof ranking)
  }, [])

  const Golden = React.memo(function CardsEntryGoldenRecords () {
    return (
      <CardsEntryRecords
        keyofBusinesses={keyofBusinesses}
        metadata={metadata}
        ranking="golden"
      />
    )
  })

  const Purple = React.memo(function CardsEntryPurpleRecords () {
    return (
      <CardsEntryRecords
        keyofBusinesses={keyofBusinesses}
        metadata={metadata}
        ranking="purple"
      />
    )
  })

  return (
    <div className={styles.root}>
      <TabList
        className={styles.tabList}
        selectedValue={ranking}
        onTabSelect={handleSelect}
        appearance="subtle"
        size="small"
      >
        <Tab className={mergeClasses(styles.tab, styles.tabGolden)} value="golden">
          {RankingsPrefix[business].golden}
        </Tab>
        <Divider className={styles.tabDivider} vertical />
        <Tab className={mergeClasses(styles.tab, styles.tabPurple)} value="purple">
          {RankingsPrefix[business].purple}
        </Tab>
      </TabList>
      {ranking === 'golden' && <Golden />}
      {ranking === 'purple' && <Purple />}
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
  ranking: keyof Omit<CategorizedMetadataRankings, 'blue'>
}

function CardsEntryRecords (props: CardsEntryRecordsProps) {
  const styles = useCardsEntryRecordsStyles()
  const { keyofBusinesses, metadata, ranking } = props

  const data = useMemo(() => {
    const data: ComponentProps<typeof CardsEntryRecord>[] = metadata
      .rankings[ranking]
      .values
      .map((record, index, arrRef) => ({
        keyofBusinesses,
        category: metadata.category,
        ranking,
        dataRef: [record, arrRef[index - 1]],
      }))

    const { nextPity, nextPityProgress } = metadata.rankings[ranking]
    data.push({
      keyofBusinesses,
      category: metadata.category,
      ranking,
      dataRef: {
        value: nextPity,
        progress: nextPityProgress,
      },
    })

    data.reverse()
    return data
  }, [keyofBusinesses, metadata.category, metadata.rankings, ranking])

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
    zIndex: 0,
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
      opacity: 0.25,
    },
    '::after': {
      borderTopLeftRadius: tokens.borderRadiusMedium,
      borderBottomLeftRadius: tokens.borderRadiusMedium,
      borderTopRightRadius: tokens.borderRadiusSmall,
      borderBottomRightRadius: tokens.borderRadiusSmall,
      width: 'var(--progress)',
      opacity: 0.3,
    },
  },
  rootNextPity: {
    '::before,::after': {
      backgroundColor: tokens.colorPaletteDarkOrangeBackground3,
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
  labelUp: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
})

interface CardsEntryRecordProps {
  keyofBusinesses: KeyofBusinesses
  category: PrettyCategory
  ranking: keyof Omit<CategorizedMetadataRankings, 'blue'>
  dataRef:
    // [Curr Record, Prev Record | null]
    | [PrettyGachaRecord, PrettyGachaRecord | null]
    // Next Pity
    | {
        value: number
        progress: number
      }
}

function CardsEntryRecord (props: CardsEntryRecordProps) {
  const styles = useCardsEntryRecordStyles()
  const {
    keyofBusinesses,
    category,
    ranking,
    dataRef,
  } = props

  const i18n = useI18n()

  // Next pity
  if (!Array.isArray(dataRef)) {
    return (
      <div
        className={mergeClasses(styles.root, styles.rootNextPity)}
        style={{
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          '--progress':
            dataRef.progress + '%',
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
            {dataRef.value}
          </Caption1>
        </div>
      </div>
    )
  }

  // Record
  const [record, prevRecord] = dataRef
  const isHardPity = ranking === 'golden' && prevRecord && !prevRecord.up && record.up
  const showUpLabels = category === PrettyCategory.Character ||
    category === PrettyCategory.Weapon ||
    category === PrettyCategory.CollaborationCharacter ||
    category === PrettyCategory.CollaborationWeapon

  let title = record.name
  title += record.version ? '\n' + i18n.t('Pages.Gacha.LegacyView.GachaItem.Title.Version', { version: record.version }) : ''
  title += record.genshinCharacter2 ? '\n' + i18n.t('Pages.Gacha.LegacyView.GachaItem.Title.GenshinImpactCharacter2') : ''
  title += '\n' + i18n.dayjs(record.time).format('LLLL')

  return (
    <div
      className={styles.root}
      style={{
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        '--progress':
          (record.usedPityProgress || 0) + '%',
      }}
      title={title}
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
        {showUpLabels && (
          <Fragment>
            {isHardPity && (
              <Locale
                component={Caption1}
                className={mergeClasses(styles.label, styles.labelHardPity)}
                wrap={false}
                mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntryRecord.HardPity']}
              />
            )}
            {record.up && (
              <Locale
                component={Caption1}
                className={mergeClasses(styles.label, styles.labelUp)}
                wrap={false}
                mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntryRecord.Up']}
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
