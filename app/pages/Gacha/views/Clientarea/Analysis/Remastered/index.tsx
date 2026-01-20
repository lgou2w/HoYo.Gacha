import { ComponentProps, ReactNode, useCallback, useMemo, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { Body1, Caption1, Divider, Image, Subtitle2, Tab, TabList, Title1, makeStyles, mergeClasses, tabClassNames, tokens } from '@fluentui/react-components'
import { AccountBusiness } from '@/api/schemas/Account'
import GachaImageNone from '@/assets/images/Gacha/None.avif'
import Placeholder from '@/components/Placeholder'
import { WithTrans, WithTransKnownNs, i18nDayjs, useI18n, withTrans } from '@/i18n'
import GachaImage from '@/pages/Gacha/components/Image'
import GachaTicket from '@/pages/Gacha/components/Ticket'
import { PrettizedCategoryFlexOrderDataset, PrettizedCategoryFlexOrders } from '@/pages/Gacha/components/consts'
import { useBusiness } from '@/pages/Gacha/contexts/Business'
import { CategorizedRecords, CategorizedRecordsRanking, CategorizedRecordsRankings, PrettizedCategory, PrettizedRecord, PrettizedRecords, UsedPity, usePrettizedRecords } from '@/pages/Gacha/contexts/PrettizedRecords'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
  cards: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    overflow: 'auto hidden',
    scrollBehavior: 'smooth',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXS,
  },
  card: {
    flex: 1,
    minWidth: '12.75rem',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    boxShadow: tokens.shadow2,
    ...PrettizedCategoryFlexOrders,
  },
})

export default function AnalysisRemastered () {
  const styles = useStyles()
  const cards = useCards(styles)

  return (
    <div className={styles.root}>
      <div className={styles.cards}>
        {cards}
      </div>
    </div>
  )
}

function useCards (styles: ReturnType<typeof useStyles>): ReactNode[] {
  const { data } = usePrettizedRecords()
  return useMemo(() => {
    const datasets = data?.categorizeds
    const cards: ReactNode[] = []

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

        createCard(
          [datasets, category],
          styles.card,
          cards,
          required,
        )
      })

    return cards
  }, [data?.categorizeds, styles.card])
}

function createCard (
  source: [PrettizedRecords<AccountBusiness>['categorizeds'] | undefined, PrettizedCategory],
  className: string,
  results: ReactNode[],
  required?: boolean,
) {
  const [categorizeds, category] = source
  const categorized = categorizeds?.[category]
  if (!categorized || (required && categorized.total <= 0)) {
    return
  }

  results.push((
    <div
      className={className}
      key={category}
      {...{ [PrettizedCategoryFlexOrderDataset]: category }}
    >
      <Card dataset={categorized} />
    </div>
  ))
}

const useCardStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalS,
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
  headerSubtitle: {},
  headerTitle: {
    display: 'flex',
    alignItems: 'end',
  },
  headerTitleTotal: {
    fontFamily: tokens.fontFamilyNumeric,
  },
  headerTitlePull: {
    marginLeft: tokens.spacingHorizontalXS,
  },
  headerTitleTicket: {
    width: tokens.fontSizeBase600,
    height: 'auto',
    aspectRatio: '1 / 1',
    marginLeft: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXS,
  },
  labels: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS,
  },
  labelsGroup: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  labelsValue: { fontFamily: tokens.fontFamilyNumeric },
  labelsGroupAverageAndUp: { color: tokens.colorPaletteGreenForeground1 },
  labelsGroupUpWin: { color: tokens.colorPaletteRedForeground1 },
  labelsGroupUp: { color: tokens.colorPaletteRedForeground1 },
  labelsGroupGolden: { color: tokens.colorPaletteMarigoldForeground1 },
  labelsGroupPurple: { color: tokens.colorPaletteBerryForeground1 },
  labelsGroupBlue: { color: tokens.colorPaletteBlueBorderActive },
  labelsGroupGreen: { color: tokens.colorPaletteGreenForeground1 },
})

const Card = withTrans.GachaPage(function (
  { i18n, t, dataset }:
    & WithTrans
    & { dataset: CategorizedRecords<AccountBusiness> },
) {
  const styles = useCardStyles()
  const business = useBusiness()

  const category = dataset.category
  const isBeginner = category === PrettizedCategory.Beginner
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
  } else {
    timeRange = <Placeholder />
  }

  const total = dataset.total
  const { golden, purple, blue, green } = dataset.rankings

  const hasUp
    = !isBeginner
      && !isPermanent
      && !isChronicled
      && !isBangboo
      && !isPermanentOde
      && !isEventOde

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Subtitle2 className={styles.headerSubtitle} wrap={false} truncate>
          {t(`Common:${business.keyof}.Gacha.Category.${category}`, {
            context: 'title',
          })}
        </Subtitle2>
        <div className={styles.headerTitle}>
          <Title1 className={styles.headerTitleTotal}>
            {t('Clientarea.Analysis.Remastered.Total', { count: total })}
          </Title1>
          {isPermanentOde || isEventOde
            ? (
                <span className={styles.headerTitlePull}>
                  {t('Clientarea.Analysis.Remastered.Pull')}
                </span>
              )
            : (
                <GachaTicket
                  className={styles.headerTitleTicket}
                  keyof={business.keyof}
                  category={category}
                />
              )}
        </div>
      </div>
      <Divider style={{ flexGrow: 0 }}>
        {timeRange}
      </Divider>
      <div className={styles.labels}>
        {hasUp
          ? (
              ([
                { row: 'AverageAndUp', value: `${golden.average} / ${golden.up.average}` },
                { row: 'UpWin', value: `${golden.up.sum} [${golden.up.percentage}%]` },
                { row: 'Up', value: `${golden.upWin.sum} [${golden.upWin.percentage}%]` },
              ] as const
              ).map(({ row, value }) => (
                <div
                  className={mergeClasses(
                    styles.labelsGroup,
                    styles[`labelsGroup${row}`],
                  )}
                  key={row}
                >
                  <Caption1>
                    {t(`Common:${business.keyof}.Gacha.Ranking.Golden`)}
                    <Placeholder />
                    {t(`Clientarea.Analysis.Classic.Table.RowLabels.${row}`)}
                  </Caption1>
                  <Caption1 className={styles.labelsValue}>
                    {value}
                  </Caption1>
                </div>
              ))
            )
          : !isPermanentOde && !isEventOde && (
              <>
                <Caption1><Placeholder /></Caption1>
                <Caption1><Placeholder /></Caption1>
                <Caption1><Placeholder /></Caption1>
              </>
            )}
        {([
          { predicate: !isPermanentOde,
            ranking: 'Golden',
            value: `${golden.sum} [${golden.percentage}%]`,
          },
          { predicate: true,
            ranking: 'Purple',
            value: `${purple.sum} [${purple.percentage}%]`,
          },
          { predicate: true,
            ranking: 'Blue',
            value: `${blue.sum} [${blue.percentage}%]`,
          },
          { predicate: isPermanentOde && green,
            ranking: 'Green',
            value: `${green?.sum} [${green?.percentage}%]`,
          },
        ] as const)
          .filter(({ predicate }) => predicate)
          .map(({ ranking, value }) => (
            <div
              className={mergeClasses(
                styles.labelsGroup,
                styles[`labelsGroup${ranking}`],
              )}
              key={ranking}
            >
              <Caption1>
                {t(`Common:${business.keyof}.Gacha.Ranking.${ranking}`)}
                <Placeholder />
                {t(`Clientarea.Analysis.Classic.Table.RowLabels.Count`)}
              </Caption1>
              <Caption1 className={styles.labelsValue}>
                {value}
              </Caption1>
            </div>
          ))}
      </div>
      <Divider style={{ flexGrow: 0 }} />
      <CardRecordsTabs dataset={dataset} />
    </div>
  )
})

const useCardRecordsTabsStyles = makeStyles({
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
  tab: { flexGrow: 1 },
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
  tabBlue: {
    '&:enabled:hover': {
      [`& .${tabClassNames.content}`]: {
        color: tokens.colorPaletteBlueBorderActive,
      },
    },
    [`& .${tabClassNames.content}`]: {
      color: tokens.colorPaletteBlueBorderActive,
    },
  },
})

type RecordsRanking = keyof Omit<CategorizedRecordsRankings, 'green'>

const CardRecordsTabs = withTrans.GachaPage(function (
  { t, dataset }:
    & WithTrans
    & { dataset: CategorizedRecords<AccountBusiness> },
) {
  const styles = useCardRecordsTabsStyles()
  const business = useBusiness()

  const isPremanentOde = dataset.category === PrettizedCategory.PermanentOde
  const initialRanking = isPremanentOde ? CategorizedRecordsRanking.Purple : CategorizedRecordsRanking.Golden

  const [ranking, setRanking] = useState<RecordsRanking>(initialRanking)
  const handleSelect = useCallback<Required<ComponentProps<typeof TabList>>['onTabSelect']>((_, data) => {
    setRanking(data.value as typeof ranking)
  }, [])

  const records: Record<RecordsRanking, ReactNode> = useMemo(() => {
    return {
      [CategorizedRecordsRanking.Golden]:
        !isPremanentOde && <Records ranking={CategorizedRecordsRanking.Golden} dataset={dataset} />,
      [CategorizedRecordsRanking.Purple]:
        <Records ranking={CategorizedRecordsRanking.Purple} dataset={dataset} />,
      [CategorizedRecordsRanking.Blue]:
        isPremanentOde && <Records ranking={CategorizedRecordsRanking.Blue} dataset={dataset} />,
    }
  }, [dataset, isPremanentOde])

  return (
    <div className={styles.root}>
      <TabList
        className={styles.tabList}
        onTabSelect={handleSelect}
        selectedValue={ranking}
        appearance="subtle"
        size="small"
      >
        {!isPremanentOde && (
          <>
            <Tab
              className={mergeClasses(styles.tab, styles.tabGolden)}
              value={CategorizedRecordsRanking.Golden}
            >
              {t(`Common:${business.keyof}.Gacha.Ranking.Golden`)}
            </Tab>
            <Divider style={{ flexGrow: 0 }} vertical />
          </>
        )}
        <Tab
          className={mergeClasses(styles.tab, styles.tabPurple)}
          value={CategorizedRecordsRanking.Purple}
        >
          {t(`Common:${business.keyof}.Gacha.Ranking.Purple`)}
        </Tab>
        {isPremanentOde && (
          <>
            <Divider style={{ flexGrow: 0 }} vertical />
            <Tab
              className={mergeClasses(styles.tab, styles.tabBlue)}
              value={CategorizedRecordsRanking.Blue}
            >
              {t(`Common:${business.keyof}.Gacha.Ranking.Blue`)}
            </Tab>
          </>
        )}
      </TabList>
      {records[ranking]}
    </div>
  )
})

const useRecordsStyles = makeStyles({
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

interface RecordsProps {
  ranking: RecordsRanking
  dataset: CategorizedRecords<AccountBusiness>
}

function Records (props: RecordsProps) {
  const { ranking, dataset } = props
  const styles = useRecordsStyles()

  const computedData = useMemo(() => {
    const data: ComponentProps<typeof RecordsEntry>[] = dataset
      .rankings[ranking]
      .values
      .map((record, index, arrayRef) => ({
        category: dataset.category,
        ranking,
        dataRef: [record, arrayRef[index - 1]],
      }))

    // Next pity
    data.push({
      category: dataset.category,
      ranking,
      dataRef: {
        ...dataset.rankings[ranking].nextPity,
        time: dataset.endTime,
      },
    })

    // DESC
    data.reverse()
    return data
  }, [dataset.category, dataset.endTime, dataset.rankings, ranking])

  return (
    <Virtuoso
      className={styles.root}
      data={computedData}
      itemContent={(_, props) => (
        <RecordsEntry {...props} />
      )}
    />
  )
}

const useRecordsEntryStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '2.25rem',
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
    aspectRatio: '1 / 1',
    borderTopLeftRadius: tokens.borderRadiusMedium,
    borderBottomLeftRadius: tokens.borderRadiusMedium,
  },
  itemName: {
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

interface RecordsEntryProps {
  category: PrettizedCategory
  ranking: RecordsRanking
  dataRef:
    | [PrettizedRecord, PrettizedRecord | null | undefined]
    | UsedPity & { time?: string | null } // Next pity & Latest time
}

function RecordsEntry (props: RecordsEntryProps) {
  const { category, ranking, dataRef } = props
  const styles = useRecordsEntryStyles()
  const business = useBusiness()
  const i18n = useI18n(WithTransKnownNs.GachaPage)

  // Next pity & Latest time
  if (!Array.isArray(dataRef)) {
    return (
      <div
        className={mergeClasses(styles.root, styles.rootNextPity)}
        title={dataRef.time ? i18n.dayjs(dataRef.time).format('LLLL') : undefined}
        style={{
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          '--progress':
            dataRef.progress + '%',
        }}
      >
        <Image className={styles.icon} src={GachaImageNone} />
        <Body1 className={styles.itemName}>
          {i18n.t('Clientarea.Analysis.Remastered.NextPity')}
        </Body1>
        <div className={styles.labels}>
          <Caption1 className={styles.label}>
            {dataRef.value}
          </Caption1>
        </div>
      </div>
    )
  }

  const [record, prevRecord] = dataRef

  const title = [
    record.itemName,
    record.version && i18n.t('ImageItem.Titles.Version', { value: record.version }),
    record.genshinImpactCharacter2 && i18n.t('ImageItem.Titles.GenshinImpactCharacter2'),
    i18n.dayjs(record.time).format('LLLL'),
  ]
    .filter((el) => typeof el === 'string')
    .join('\n')

  const isHardPity
    = ranking === CategorizedRecordsRanking.Golden
      && prevRecord
      && !prevRecord.isUp
      && record.isUp

  const hasUp
    = category === PrettizedCategory.Character
      || category === PrettizedCategory.Weapon
      || category === PrettizedCategory.CollaborationCharacter
      || category === PrettizedCategory.CollaborationWeapon

  return (
    <div
      className={styles.root}
      title={title}
      style={{
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        '--progress':
          (record.usedPity?.progress || 0) + '%',
      }}
    >
      <GachaImage
        className={styles.icon}
        keyof={business.keyof}
        itemCategory={record.itemCategory}
        itemId={record.itemId}
      />
      <Body1 className={styles.itemName} wrap={false} truncate>
        {record.itemName}
      </Body1>
      <div className={styles.labels}>
        {hasUp && (
          <>
            {isHardPity && (
              <Caption1
                className={mergeClasses(styles.label, styles.labelHardPity)}
                wrap={false}
              >
                {i18n.t('Clientarea.Analysis.Remastered.HardPity')}
              </Caption1>
            )}
            {record.isUp && (
              <Caption1
                className={mergeClasses(styles.label, styles.labelUp)}
                wrap={false}
              >
                {i18n.t('Clientarea.Analysis.Remastered.Up')}
              </Caption1>
            )}
          </>
        )}
        <Caption1 className={styles.label}>
          {record.usedPity?.value || 0}
        </Caption1>
      </div>
    </div>
  )
}
