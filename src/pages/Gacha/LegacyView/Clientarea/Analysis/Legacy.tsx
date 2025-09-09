import React, { useMemo } from 'react'
import { Body1, Body2, Caption1, Caption2, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, makeStyles, tableCellClassNames, tableHeaderCellClassNames, tableRowClassNames, tokens } from '@fluentui/react-components'
import { HistoryRegular, TableAltTextRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import { Business, Businesses, KeyofBusinesses, ReversedBusinesses } from '@/interfaces/Business'
import { AggregatedMetadata, CategorizedMetadata, CategorizedMetadataRankings, PrettyCategory } from '@/interfaces/GachaRecord'
import { CompositeState } from '@/pages/Gacha/LegacyView/Clientarea/useCompositeState'
import GachaItem from '@/pages/Gacha/LegacyView/GachaItem'
import capitalize from '@/utilities/capitalize'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    height: '100%',
  },
})

export default function GachaLegacyViewClientareaAnalysisLegacy (props: CompositeState) {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <GachaLegacyViewClientareaAnalysisLegacyTable {...props} />
      <GachaLegacyViewClientareaAnalysisLegacyHistory {...props} />
    </div>
  )
}

enum TableEntryRow {
  AverageAndUp = 'AverageAndUp',
  UpWin = 'UpWin',
  Up = 'Up',
  Golden = 'Golden',
  Purple = 'Purple',
  Blue = 'Blue',
  Aggregated = 'Aggregated',
}

const useTableStyles = makeStyles({
  root: {
    overflow: 'hidden',
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
    [`& .${tableHeaderCellClassNames.button}`]: {
      justifyContent: 'flex-end',
    },
    [`& .${tableRowClassNames.root}`]: {
      [`&[data-row="${TableEntryRow.AverageAndUp}"]`]: {
        color: tokens.colorPaletteGreenForeground1,
      },
      [`&[data-row="${TableEntryRow.UpWin}"]`]: {
        color: tokens.colorPaletteRedForeground1,
      },
      [`&[data-row="${TableEntryRow.Up}"]`]: {
        color: tokens.colorPaletteRedForeground1,
      },
      [`&[data-row="${TableEntryRow.Golden}"]`]: {
        color: tokens.colorPaletteMarigoldForeground1,
      },
      [`&[data-row="${TableEntryRow.Purple}"]`]: {
        color: tokens.colorPaletteBerryForeground1,
      },
      [`&[data-row="${TableEntryRow.Blue}"]`]: {
        color: tokens.colorPaletteBlueBorderActive,
      },
      [`& .${tableCellClassNames.root}[data-cell="n/a"]`]: {
        color: tokens.colorNeutralForeground4,
      },
      [`&[data-row="${TableEntryRow.Aggregated}"]`]: {
        borderBottom: 'none',
      },
      ':hover': {
        [`&[data-row="${TableEntryRow.Aggregated}"]`]: {
          borderRadius: tokens.borderRadiusMedium,
        },
      },
    },
  },
  tableTitle: {
    [`& .${tableHeaderCellClassNames.button}`]: {
      justifyContent: 'flex-start',
      '& svg': {
        fontSize: tokens.fontSizeBase300,
      },
    },
  },
  tableCellEntryRow: {
    textAlign: 'end',
    fontFamily: tokens.fontFamilyNumeric,
  },
})

function GachaLegacyViewClientareaAnalysisLegacyTable (props: CompositeState) {
  const styles = useTableStyles()
  const {
    business,
    keyofBusinesses,
    prettized: {
      categorizeds: {
        Beginner,
        Character,
        Weapon,
        Permanent,
        Chronicled,
        Bangboo,
        CollaborationCharacter,
        CollaborationWeapon,
      },
      aggregated,
    },
  } = props

  const state = useMemo(() => ({
    hasChronicled: Chronicled && Chronicled.total > 0,
    hasBangboo: Bangboo && Bangboo.total > 0,
    hasCollaborationCharacter: CollaborationCharacter && CollaborationCharacter.total > 0,
    hasCollaborationWeapon: CollaborationWeapon && CollaborationWeapon.total > 0,
    hasBeginner: Beginner && Beginner.total > 0,
  }), [
    Bangboo,
    Chronicled,
    CollaborationCharacter,
    CollaborationWeapon,
    Beginner,
  ])

  const data = [
    createTableEntry(PrettyCategory.Character, Character),
    createTableEntry(PrettyCategory.Weapon, Weapon),
  ]

  if (state.hasCollaborationCharacter) {
    data.push(createTableEntry(PrettyCategory.CollaborationCharacter, CollaborationCharacter))
  }

  if (state.hasCollaborationWeapon) {
    data.push(createTableEntry(PrettyCategory.CollaborationWeapon, CollaborationWeapon))
  }

  if (state.hasChronicled) {
    data.push(createTableEntry(PrettyCategory.Chronicled, Chronicled))
  }

  data.push(createTableEntry(PrettyCategory.Permanent, Permanent))

  if (state.hasBangboo) {
    data.push(createTableEntry(PrettyCategory.Bangboo, Bangboo))
  }

  if (state.hasBeginner) {
    data.push(createTableEntry(PrettyCategory.Beginner, Beginner))
  }

  data.push(createTableEntry('Aggregated', aggregated))

  return (
    <Table className={styles.root} size="small" >
      <TableHeader>
        <TableRow>
          <Locale
            component={TableHeaderCell}
            mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.LegacyTable.Title']}
            className={styles.tableTitle}
            childrenPosition="before"
          >
            <TableAltTextRegular />
          </Locale>
          {data.map((entry) => (
            <Locale
              key={entry.category}
              component={TableHeaderCell}
              mapping={[`Business.${keyofBusinesses}.Gacha.Category.${entry.category}`]}
              data-category={entry.category}
            >
              {business === Businesses.ZenlessZoneZero && entry.category === 'Aggregated' && (
                <Locale
                  component={Caption2}
                  mapping={[`Business.${keyofBusinesses}.Gacha.Category.${entry.category}`, { context: 'NoBangboo' }]}
                  childrenPosition="before"
                >
                  <i aria-label="placeholder">{'\u00A0'}</i>
                </Locale>
              )}
            </Locale>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.values(TableEntryRow).map((row) => (
          createTableEntryRow(business, row, data, styles.tableCellEntryRow)
        ))}
      </TableBody>
    </Table>
  )
}

function createTableEntry (
  category: PrettyCategory | 'Aggregated',
  metadata: CategorizedMetadata<Business> | null | AggregatedMetadata,
): {
  category: PrettyCategory | 'Aggregated'
  value: Record<TableEntryRow, [number | undefined, number | undefined] | []>
} {
  const {
    rankings: {
      golden,
      purple,
      blue,
    } = {},
  } = metadata || {}

  const isBeginner = category === PrettyCategory.Beginner
  const isPermanent = category === PrettyCategory.Permanent
  const isChronicled = category === PrettyCategory.Chronicled
  const isBangboo = category === PrettyCategory.Bangboo
  const hasUp = !isBeginner && !isPermanent && !isChronicled && !isBangboo

  return {
    category,
    value: {
      [TableEntryRow.AverageAndUp]: hasUp ? [golden?.average, golden?.upAverage] : [],
      [TableEntryRow.UpWin]: hasUp ? [golden?.upWinSum, golden?.upWinPercentage] : [],
      [TableEntryRow.Up]: hasUp ? [golden?.upSum, golden?.upPercentage] : [],
      [TableEntryRow.Golden]: [golden?.sum, golden?.percentage],
      [TableEntryRow.Purple]: [purple?.sum, purple?.percentage],
      [TableEntryRow.Blue]: [blue?.sum, blue?.percentage],
      [TableEntryRow.Aggregated]: [metadata?.total, 100],
    },
  }
}

function createTableEntryRow (
  business: Business,
  row: TableEntryRow,
  data: ReturnType<typeof createTableEntry>[],
  tableCellClassName: string,
) {
  const keyofBusinesses = ReversedBusinesses[business]
  const isAverageAndUp = row === TableEntryRow.AverageAndUp
  const isAggregated = row === TableEntryRow.Aggregated

  let subkey = row as string
  let ranking: keyof CategorizedMetadataRankings | undefined =
    !isAggregated ? 'golden' : undefined

  if (row === TableEntryRow.Golden ||
    row === TableEntryRow.Purple ||
    row === TableEntryRow.Blue) {
    subkey = 'Count'
    ranking = row.toLowerCase() as keyof CategorizedMetadataRankings
  }

  return (
    <TableRow key={row} data-row={row}>
      <Locale
        component={TableCell}
        mapping={[
          !isAggregated
            ? `Pages.Gacha.LegacyView.Clientarea.Analysis.CardsEntry.Labels.${subkey}`
            : `Business.${keyofBusinesses}.Gacha.Category.Aggregated`,
        ]}
        childrenPosition="before"
      >
        {ranking && [
          <Locale key={ranking} mapping={[`Business.${keyofBusinesses}.Ranking.${capitalize(ranking)}`]} />,
          '\u00A0',
        ]}
      </Locale>
      {data.map((entry) => {
        const [first, last] = entry.value[row as keyof typeof entry.value]
        const notApplicable = typeof first === 'undefined' || typeof last === 'undefined'

        return (
          <TableCell
            key={entry.category}
            className={tableCellClassName}
            data-cell={notApplicable ? 'n/a' : undefined}
          >
            {notApplicable
              ? 'N/A'
              : isAverageAndUp
                ? `${first} / ${last}`
                : `${first} [${last}%]`}
          </TableCell>
        )
      })}
    </TableRow>
  )
}

const useHistoryStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  title: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalXS,
    alignItems: 'center',
    height: '1rem',
    '> svg': {
      fontSize: tokens.fontSizeBase500,
    },
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
  },
})

function GachaLegacyViewClientareaAnalysisLegacyHistory (props: CompositeState) {
  const styles = useHistoryStyles()
  const {
    keyofBusinesses,
    prettized: {
      categorizeds: {
        Beginner,
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

  return (
    <div className={styles.root}>
      <div className={styles.title}>
        <HistoryRegular />
        <Locale
          component={Body2}
          mapping={[
            'Pages.Gacha.LegacyView.Clientarea.Analysis.LegacyHistory.Title',
            { keyofBusinesses, context: keyofBusinesses },
          ]}
          as="span"
          childrenPosition="before"
        >
          {<Locale mapping={[`Business.${keyofBusinesses}.Ranking.Golden`]} />}{'\u00A0'}
        </Locale>
      </div>
      <div className={styles.list}>
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={Character} />
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={Weapon} />
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={CollaborationCharacter} />
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={CollaborationWeapon} />
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={Chronicled} />
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={Permanent} />
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={Bangboo} />
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={Beginner} />
      </div>
    </div>
  )
}

const useHistoryListStyles = makeStyles({
  root: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    background: tokens.colorNeutralBackgroundAlpha,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
  },
  title: {
    display: 'flex',
    flexDirection: 'column',
    flex: '0 0 12%',
    padding: `${tokens.spacingVerticalS} 0 ${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
  },
  upSum: {
    color: tokens.colorPaletteRedForeground1,
  },
  sum: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  divider: {
    flex: 0,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteMarigoldBackground3}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  records: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    rowGap: tokens.spacingVerticalS,
    columnGap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalS,
  },
})

interface LegacyHistoryListProps {
  keyofBusinesses: KeyofBusinesses
  metadata: CategorizedMetadata<Business> | null
}

function LegacyHistoryList (props: LegacyHistoryListProps) {
  const styles = useHistoryListStyles()
  const { keyofBusinesses, metadata } = props

  if (!metadata || metadata.rankings.golden.sum < 1) {
    return null
  }

  const { category, rankings: { golden: { upSum, sum, values } } } = metadata
  const isBeginner = category === PrettyCategory.Beginner
  const isPermanent = category === PrettyCategory.Permanent
  const isChronicled = category === PrettyCategory.Chronicled
  const isBangboo = category === PrettyCategory.Bangboo
  const hasUp = !isBeginner && !isPermanent && !isChronicled && !isBangboo

  return (
    <div className={styles.root}>
      <div className={styles.title}>
        <Locale
          component={Body1}
          mapping={[`Business.${keyofBusinesses}.Gacha.Category.${metadata.category}`]}
        />
        <div>
          {hasUp && <Locale
            className={styles.upSum}
            component={Caption1}
            mapping={[
              'Pages.Gacha.LegacyView.Clientarea.Analysis.LegacyHistory.ListTitle',
              { upSum, context: 'Up' },
            ]}
          />}
          {hasUp && <Caption1>{' / '}</Caption1>}
          <Locale
            className={styles.sum}
            component={Caption1}
            mapping={[
              'Pages.Gacha.LegacyView.Clientarea.Analysis.LegacyHistory.ListTitle',
              { sum, context: 'Total' },
            ]}
          />
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.records}>
        {values.map((record) => (
          <GachaItem
            key={record.id}
            keyofBusinesses={keyofBusinesses}
            ranking="Golden"
            record={record}
            small
          />
        ))}
      </div>
    </div>
  )
}
