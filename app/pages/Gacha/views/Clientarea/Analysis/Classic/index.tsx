import { ReactNode, useMemo } from 'react'
import { Body1, Body2, Caption1, Caption2, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, makeStyles, tableCellClassNames, tableHeaderCellClassNames, tableRowClassNames, tokens } from '@fluentui/react-components'
import { HistoryRegular, TableAltTextRegular } from '@fluentui/react-icons'
import { AccountBusiness, MiliastraWonderland, ZenlessZoneZero } from '@/api/schemas/Account'
import Placeholder from '@/components/Placeholder'
import { WithTrans, isChinese, withTrans } from '@/i18n'
import GachaImageItem from '@/pages/Gacha/components/ImageItem'
import GachaTicket from '@/pages/Gacha/components/Ticket'
import { PrettizedCategoryFlexOrderDataset, PrettizedCategoryFlexOrders } from '@/pages/Gacha/components/consts'
import { useBusiness } from '@/pages/Gacha/contexts/Business'
import { Aggregated, AggregatedRecords, CategorizedRecords, CategorizedRecordsRanking, PrettizedCategory, PrettizedRecord, PrettizedRecords, usePrettizedRecords } from '@/pages/Gacha/contexts/PrettizedRecords'
import capitalize from '@/utilities/capitalize'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
})

export default function AnalysisClassic () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <AnalysisTable />
      <AnalysisHistories />
    </div>
  )
}

// #region: Table

enum EntryRow {
  AverageAndUp = 'AverageAndUp',
  UpWin = 'UpWin',
  Up = 'Up',
  Golden = 'Golden',
  Purple = 'Purple',
  Blue = 'Blue',
  Green = 'Green',
  Aggregated = 'Aggregated',
}

const useTableStyles = makeStyles({
  root: {
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
    [`& .${tableHeaderCellClassNames.root}:not(:first-child)`]: {
      [`& .${tableHeaderCellClassNames.button}`]: {
        justifyContent: 'flex-end',
        whiteSpace: 'nowrap',
      },
      ...PrettizedCategoryFlexOrders,
    },
    [`& .${tableRowClassNames.root}`]: {
      [`& .${tableCellClassNames.root}:not(:first-child)`]: {
        justifyContent: 'flex-end',
        ...PrettizedCategoryFlexOrders,
      },
      [`&[data-row="${EntryRow.AverageAndUp}"]`]: {
        color: tokens.colorPaletteGreenForeground1,
      },
      [`&[data-row="${EntryRow.UpWin}"]`]: {
        color: tokens.colorPaletteRedForeground1,
      },
      [`&[data-row="${EntryRow.Up}"]`]: {
        color: tokens.colorPaletteRedForeground1,
      },
      [`&[data-row="${EntryRow.Golden}"]`]: {
        color: tokens.colorPaletteMarigoldForeground1,
      },
      [`&[data-row="${EntryRow.Purple}"]`]: {
        color: tokens.colorPaletteBerryForeground1,
      },
      [`&[data-row="${EntryRow.Blue}"]`]: {
        color: tokens.colorPaletteBlueBorderActive,
      },
      [`&[data-row="${EntryRow.Green}"]`]: {
        color: tokens.colorPaletteGreenForeground1,
      },
      [`& [data-cell="n/a"]`]: {
        color: tokens.colorNeutralForeground4,
      },
      [`&[data-row="${EntryRow.Aggregated}"]`]: {
        borderBottom: 'none',
      },
      ':hover': {
        [`&[data-row="${EntryRow.Aggregated}"]`]: {
          borderRadius: tokens.borderRadiusMedium,
        },
      },
    },
  },
  tableTitle: {
    [`& .${tableHeaderCellClassNames.button}`]: {
      '& svg': {
        flexShrink: 0,
        fontSize: tokens.fontSizeBase400,
      },
    },
  },
  tableCell: {
    fontFamily: tokens.fontFamilyNumeric,
  },
  tableCellTicket: {
    marginLeft: tokens.spacingHorizontalXS,
    width: tokens.fontSizeBase500,
    height: 'auto',
  },
})

const AnalysisTable = withTrans.GachaPage(function ({ t }: WithTrans) {
  const styles = useTableStyles()
  const business = useBusiness()
  const entries = useTableEntries()
  const rows = useTableRows(entries, styles, t)

  return (
    <Table className={styles.root} size="small" noNativeElements>
      <TableHeader>
        <TableRow>
          <TableHeaderCell className={styles.tableTitle}>
            <TableAltTextRegular />
            {t('Clientarea.Analysis.Classic.Table.Title', {
              keyof: business.keyof,
            })}
          </TableHeaderCell>
          {entries.map((entry) => (
            <TableHeaderCell
              key={entry.category}
              {...{ [PrettizedCategoryFlexOrderDataset]: entry.category }}
            >
              {t(`Common:${business.keyof}.Gacha.Category.${entry.category}`, {
                context: 'simplicity',
              })}
              {business.toBe(ZenlessZoneZero) && entry.category === Aggregated && (
                <Caption2>
                  {t(`Common:${business.keyof}.Gacha.Category.${Aggregated}`, {
                    context: 'tooltip_simplicity',
                  })}
                </Caption2>
              )}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows}
      </TableBody>
    </Table>
  )
})

interface TableEntry {
  category: PrettizedCategory | Aggregated
  values: Record<EntryRow, [number?, number?]>
}

function useTableEntries (): TableEntry[] {
  const { data } = usePrettizedRecords()
  return useMemo(() => {
    const datasets = data?.categorizeds
    const entries: TableEntry[] = []

    Object
      .values(PrettizedCategory)
      .forEach((category) => {
        const required = category === PrettizedCategory.CollaborationCharacter
          || category === PrettizedCategory.CollaborationWeapon
          || category === PrettizedCategory.Chronicled
          || category === PrettizedCategory.Bangboo
          || category === PrettizedCategory.Beginner
          || category === PrettizedCategory.ExclusiveRescreening
          || category === PrettizedCategory.WEngineReverberation

        createTableEntry(
          [datasets, category],
          entries,
          required,
        )
      })

    if (data?.aggregated) {
      createTableEntry(
        data.aggregated,
        entries,
      )
    }

    return entries
  }, [data])
}

function createTableEntry (
  source:
    | [PrettizedRecords<AccountBusiness>['categorizeds'] | undefined, PrettizedCategory]
    | AggregatedRecords,
  entries: TableEntry[],
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

  const isBeginner = category === PrettizedCategory.Beginner
  const isPermanent = category === PrettizedCategory.Permanent
  const isChronicled = category === PrettizedCategory.Chronicled
  const isBangboo = category === PrettizedCategory.Bangboo
  const isPermanentOde = category === PrettizedCategory.PermanentOde
  const isEventOde = category === PrettizedCategory.EventOde

  const { golden, purple, blue, green } = dataset.rankings
  const hasUp
    = !isBeginner
      && !isPermanent
      && !isChronicled
      && !isBangboo
      && !isPermanentOde
      && !isEventOde

  entries.push({
    category,
    values: {
      [EntryRow.AverageAndUp]: [golden.average, golden.up.average],
      [EntryRow.UpWin]: hasUp ? [golden.upWin.sum, golden.upWin.percentage] : [],
      [EntryRow.Up]: hasUp ? [golden.up.sum, golden.up.percentage] : [],
      [EntryRow.Golden]: [golden.sum, golden.percentage],
      [EntryRow.Purple]: [purple.sum, purple.percentage],
      [EntryRow.Blue]: [blue.sum, blue.percentage],
      [EntryRow.Green]: [green?.sum, green?.percentage],
      [EntryRow.Aggregated]: [dataset.total, dataset.total > 0 ? 100 : 0],
    },
  })
}

function useTableRows (
  entries: TableEntry[],
  styles: ReturnType<typeof useTableStyles>,
  t: WithTrans['t'],
): ReactNode[] {
  const business = useBusiness()
  const isMiliastraWonderland = business.toBe(MiliastraWonderland)
  const rows: ReactNode[] = []

  Object
    .values(EntryRow)
    .forEach((row) => {
      if (isMiliastraWonderland
        && (row === EntryRow.AverageAndUp
          || row === EntryRow.UpWin
          || row === EntryRow.Up)
      ) {
        return
      } else if (!isMiliastraWonderland && row === EntryRow.Green) {
        return
      }

      const isAverageAndUp = row === EntryRow.AverageAndUp
      const isAggregated = row === EntryRow.Aggregated

      let subkey = row as string
      let ranking = !isAggregated ? EntryRow.Golden : undefined
      if (row === EntryRow.Golden
        || row === EntryRow.Purple
        || row === EntryRow.Blue
        || row === EntryRow.Green) {
        subkey = 'Count'
        ranking = row
      }

      rows.push((
        <TableRow key={row} data-row={row}>
          <TableCell className={styles.tableCell}>
            {ranking && t(`Common:${business.keyof}.Gacha.Ranking.${ranking}`)}
            {ranking && <Placeholder />}
            {!isAggregated
              ? t(`Clientarea.Analysis.Classic.Table.RowLabels.${subkey}`)
              : t(`Common:${business.keyof}.Gacha.Category.${Aggregated}`)}
          </TableCell>
          {entries.map((entry) => {
            const [first, last] = entry.values[row]
            const hasFirstAndLast = typeof first !== 'undefined' && typeof last !== 'undefined'
            const notApplicable = !hasFirstAndLast
              || (row === EntryRow.Golden && entry.category === PrettizedCategory.PermanentOde)
              || (row === EntryRow.Green && entry.category === PrettizedCategory.EventOde)

            return (
              <TableCell
                key={entry.category}
                className={styles.tableCell}
                data-cell={notApplicable ? 'n/a' : undefined}
                {...{ [PrettizedCategoryFlexOrderDataset]: entry.category }}
              >
                {notApplicable
                  ? 'N/A'
                  : isAverageAndUp
                    ? hasFirstAndLast && last > 0
                      ? `${first} / ${last}`
                      : String(first)
                    : `${first} [${last}%]`}
                {entry.category !== Aggregated && isAverageAndUp && (
                  <GachaTicket
                    className={styles.tableCellTicket}
                    keyof={business.keyof}
                    category={entry.category}
                  />
                )}
              </TableCell>
            )
          })}
        </TableRow>
      ))
    })

  return rows
}

// #endregion

// #region: Histories

const useHistoriesStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 0 auto',
    alignItems: 'center',
    height: tokens.fontSizeBase400,
    columnGap: tokens.spacingHorizontalXS,
  },
  headerIcon: {
    flexShrink: 0,
    fontSize: tokens.fontSizeBase400,
  },
  histories: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
  },
})

const AnalysisHistories = withTrans.GachaPage(function ({ t }: WithTrans) {
  const styles = useHistoriesStyles()
  const business = useBusiness()
  const { data } = usePrettizedRecords()

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <HistoryRegular className={styles.headerIcon} />
        <Body1>
          {t('Clientarea.Analysis.Classic.Histories.Title', {
            keyof: business.keyof,
            context: business.keyof,
          })}
        </Body1>
      </div>
      <div className={styles.histories}>
        {Object.values(PrettizedCategory).map((category) => (
          <AnalysisHistory
            key={category}
            category={category}
            dataset={data?.categorizeds?.[category]}
          />
        ))}
      </div>
    </div>
  )
})

const useHistoryStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    background: tokens.colorNeutralBackgroundAlpha,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    ...PrettizedCategoryFlexOrders,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    width: '8.5rem',
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

const AnalysisHistory = withTrans.GachaPage(function (
  { t, i18n, category, dataset }:
    & WithTrans
    & { category: PrettizedCategory, dataset?: CategorizedRecords<AccountBusiness> | null },
) {
  const styles = useHistoryStyles()
  const business = useBusiness()
  const computed = useMemo<{
    ranking?: CategorizedRecordsRanking.Purple | CategorizedRecordsRanking.Golden
    has: boolean
    data:
      | PrettizedRecord[]
      | {
        merged: {
          ranking: CategorizedRecordsRanking.Purple | CategorizedRecordsRanking.Golden
          index: number
          id: PrettizedRecord['id']
        }[]
        [CategorizedRecordsRanking.Purple]: PrettizedRecord[]
        [CategorizedRecordsRanking.Golden]: PrettizedRecord[]
      }
  } | null>(() => {
    if (!dataset) {
      return null
    }

    if (category === PrettizedCategory.EventOde) {
      // Merge purple and golden
      const merged = []

      for (const ranking of [CategorizedRecordsRanking.Purple, CategorizedRecordsRanking.Golden] as const) {
        const values = dataset.rankings[ranking].values
        for (let i = 0; i < values.length; i++) {
          merged.push({
            ranking,
            index: i,
            id: values[i].id,
          })
        }
      }

      merged.sort((a, b) => a.id.localeCompare(b.id))

      return {
        has: merged.length > 0,
        data: {
          merged,
          [CategorizedRecordsRanking.Purple]: dataset.rankings[CategorizedRecordsRanking.Purple].values,
          [CategorizedRecordsRanking.Golden]: dataset.rankings[CategorizedRecordsRanking.Golden].values,
        },
      }
    } else {
      // Otherwise, a single
      const ranking = category === PrettizedCategory.PermanentOde
        ? CategorizedRecordsRanking.Purple
        : CategorizedRecordsRanking.Golden

      return {
        ranking,
        has: dataset.rankings[ranking].sum > 0,
        data: dataset.rankings[ranking].values,
      }
    }
  }, [category, dataset])

  if (!dataset || !computed || !computed.has) {
    return null
  }

  const { ranking = CategorizedRecordsRanking.Golden, data } = computed
  const isEventOde = category === PrettizedCategory.EventOde
  const hasUp
    = category !== PrettizedCategory.Beginner
      && category !== PrettizedCategory.Permanent
      && category !== PrettizedCategory.Chronicled
      && category !== PrettizedCategory.Bangboo
      && category !== PrettizedCategory.PermanentOde
      && category !== PrettizedCategory.EventOde

  return (
    <div
      className={styles.root}
      {...{ [PrettizedCategoryFlexOrderDataset]: category }}
    >
      <div className={styles.header}>
        <Body2>
          {t(`Common:${business.keyof}.Gacha.Category.${category}`, {
            context: isChinese(i18n.language)
              ? undefined
              : 'simplicity',
          })}
        </Body2>
        <Body1>
          {t(`Clientarea.Analysis.Classic.Histories.Total`, {
            count: dataset.total,
          })}
        </Body1>
        <div>
          {hasUp && (
            <>
              <Caption1 className={styles.sumUp}>
                {t('Clientarea.Analysis.Classic.Histories.Sum', {
                  count: dataset.rankings[ranking].up.sum,
                  context: 'up',
                })}
              </Caption1>
              <Caption1> / </Caption1>
            </>
          )}
          {isEventOde && !Array.isArray(data) && (
            <>
              <Caption1 className={styles.sumPurple}>
                {dataset.rankings[CategorizedRecordsRanking.Purple].sum}
              </Caption1>
              <Caption1> / </Caption1>
            </>
          )}
          <Caption1 className={styles[`sum${capitalize(ranking)}`]}>
            {t('Clientarea.Analysis.Classic.Histories.Sum', {
              count: dataset.rankings[ranking].sum,
            })}
          </Caption1>
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.records}>
        {Array.isArray(data)
          ? data.map((record) => (
              <GachaImageItem
                key={record.id}
                keyof={business.keyof}
                ranking={ranking}
                record={record}
                noUpBadge={!hasUp}
                small
              />
            ))
          : data.merged.map((ref) => {
              const record = data[ref.ranking][ref.index]
              return (
                <GachaImageItem
                  key={record.id}
                  keyof={business.keyof}
                  ranking={ref.ranking}
                  record={record}
                  noUpBadge={!hasUp}
                  small
                />
              )
            })}
      </div>
    </div>
  )
})

// #endregion
