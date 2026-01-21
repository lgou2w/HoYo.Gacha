import React, { Fragment, useMemo } from 'react'
import { Body1, Body2, Caption1, Caption2, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, makeStyles, tableCellClassNames, tableHeaderCellClassNames, tableRowClassNames, tokens } from '@fluentui/react-components'
import { HistoryRegular, TableAltTextRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import { Business, Businesses, KeyofBusinesses, ReversedBusinesses, isMiliastraWonderland } from '@/interfaces/Business'
import { AggregatedMetadata, CategorizedMetadata, CategorizedMetadataRankings, PrettyCategory, PrettyGachaRecord } from '@/interfaces/GachaRecord'
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
  Green = 'Green',
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
      [`&[data-row="${TableEntryRow.Green}"]`]: {
        color: tokens.colorPaletteGreenForeground1,
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
        PermanentOde,
        EventOde,
        ExclusiveRescreening,
        WEngineReverberation,
      },
      aggregated,
    },
  } = props

  const isBeyond = isMiliastraWonderland(business)
  const state = useMemo(() => ({
    hasBeginner: Beginner && Beginner.total > 0,
    hasChronicled: Chronicled && Chronicled.total > 0,
    hasBangboo: Bangboo && Bangboo.total > 0,
    hasCollaborationCharacter: CollaborationCharacter && CollaborationCharacter.total > 0,
    hasCollaborationWeapon: CollaborationWeapon && CollaborationWeapon.total > 0,
    hasExclusiveRescreening: ExclusiveRescreening && ExclusiveRescreening.total > 0,
    hasWEngineReverberation: WEngineReverberation && WEngineReverberation.total > 0,
  }), [
    Beginner,
    Bangboo,
    Chronicled,
    CollaborationCharacter,
    CollaborationWeapon,
    ExclusiveRescreening,
    WEngineReverberation,
  ])

  const data: ReturnType<typeof createTableEntry>[] = []

  if (Character) {
    data.push(createTableEntry(PrettyCategory.Character, Character))
  }

  if (Weapon) {
    data.push(createTableEntry(PrettyCategory.Weapon, Weapon))
  }

  if (state.hasCollaborationCharacter) {
    data.push(createTableEntry(PrettyCategory.CollaborationCharacter, CollaborationCharacter))
  }

  if (state.hasCollaborationWeapon) {
    data.push(createTableEntry(PrettyCategory.CollaborationWeapon, CollaborationWeapon))
  }

  if (state.hasChronicled) {
    data.push(createTableEntry(PrettyCategory.Chronicled, Chronicled))
  }

  if (Permanent) {
    data.push(createTableEntry(PrettyCategory.Permanent, Permanent))
  }

  if (state.hasBangboo) {
    data.push(createTableEntry(PrettyCategory.Bangboo, Bangboo))
  }

  if (state.hasBeginner) {
    data.push(createTableEntry(PrettyCategory.Beginner, Beginner))
  }

  if (PermanentOde) {
    data.push(createTableEntry(PrettyCategory.PermanentOde, PermanentOde))
  }

  if (EventOde) {
    data.push(createTableEntry(PrettyCategory.EventOde, EventOde))
  }

  if (state.hasExclusiveRescreening) {
    data.push(createTableEntry(PrettyCategory.ExclusiveRescreening, ExclusiveRescreening))
  }

  if (state.hasWEngineReverberation) {
    data.push(createTableEntry(PrettyCategory.WEngineReverberation, WEngineReverberation))
  }

  if (aggregated) {
    data.push(createTableEntry('Aggregated', aggregated))
  }

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
        {Object.values(TableEntryRow).map((row) => {
          if (isBeyond && (row === TableEntryRow.AverageAndUp || row === TableEntryRow.UpWin || row === TableEntryRow.Up)) {
            return null
          } else if (!isBeyond && row === TableEntryRow.Green) {
            return null
          }

          return createTableEntryRow(business, row, data, styles.tableCellEntryRow)
        })}
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
      green,
    } = {},
  } = metadata || {}

  const isBeginner = category === PrettyCategory.Beginner
  const isPermanent = category === PrettyCategory.Permanent
  const isChronicled = category === PrettyCategory.Chronicled
  const isBangboo = category === PrettyCategory.Bangboo
  const isBeyond = category === PrettyCategory.PermanentOde || category === PrettyCategory.EventOde
  const hasUp = !isBeginner && !isPermanent && !isChronicled && !isBangboo && !isBeyond

  return {
    category,
    value: {
      [TableEntryRow.AverageAndUp]: hasUp ? [golden?.average, golden?.upAverage] : [],
      [TableEntryRow.UpWin]: hasUp ? [golden?.upWinSum, golden?.upWinPercentage] : [],
      [TableEntryRow.Up]: hasUp ? [golden?.upSum, golden?.upPercentage] : [],
      [TableEntryRow.Golden]: [golden?.sum, golden?.percentage],
      [TableEntryRow.Purple]: [purple?.sum, purple?.percentage],
      [TableEntryRow.Blue]: [blue?.sum, blue?.percentage],
      [TableEntryRow.Green]: [green?.sum, green?.percentage],
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
    row === TableEntryRow.Blue ||
    row === TableEntryRow.Green) {
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
        const notApplicable = typeof first === 'undefined' || typeof last === 'undefined' ||
          (row === TableEntryRow.Golden && entry.category === PrettyCategory.PermanentOde) ||
          (row === TableEntryRow.Green && entry.category === PrettyCategory.EventOde)

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
        PermanentOde,
        EventOde,
        ExclusiveRescreening,
        WEngineReverberation,
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
          {!isMiliastraWonderland(keyofBusinesses) && (
            <Fragment>
              <Locale mapping={[`Business.${keyofBusinesses}.Ranking.Golden`]} />{'\u00A0'}
            </Fragment>
          )}
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
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={PermanentOde} />
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={EventOde} />
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={ExclusiveRescreening} />
        <LegacyHistoryList keyofBusinesses={keyofBusinesses} metadata={WEngineReverberation} />
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
  sums: {
    marginTop: tokens.spacingVerticalS,
  },
  upSum: {
    color: tokens.colorPaletteRedForeground1,
  },
  sumGolden: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  sumPurple: {
    color: tokens.colorPaletteBerryForeground1,
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
  const isBeyond = isMiliastraWonderland(keyofBusinesses)
  const computed = useMemo<{
    ranking?: 'purple' | 'golden'
    has: boolean
    data:
      | PrettyGachaRecord[]
      | {
        merged: {
          ranking: 'purple' | 'golden'
          index: number
          id: PrettyGachaRecord['id']
        }[]
        purple: PrettyGachaRecord[]
        golden: PrettyGachaRecord[]
      }
  } | null>(() => {
    if (!metadata) {
      return null
    }

    if (metadata.category === PrettyCategory.EventOde) {
      // Merge purple and golden
      const merged = []

      for (const ranking of ['purple', 'golden'] as const) {
        const values = metadata.rankings[ranking].values
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
          purple: metadata.rankings.purple.values,
          golden: metadata.rankings.golden.values,
        },
      }
    } else {
      // Otherwise, a single
      const ranking = metadata.category === PrettyCategory.PermanentOde
        ? 'purple'
        : 'golden'

      return {
        ranking,
        has: metadata.rankings[ranking].sum > 0,
        data: metadata.rankings[ranking].values,
      }
    }
  }, [metadata])

  if (!metadata || !computed || !computed.has) {
    return null
  }

  const { ranking = 'golden', data } = computed
  const category = metadata.category
  const isBeginner = category === PrettyCategory.Beginner
  const isPermanent = category === PrettyCategory.Permanent
  const isChronicled = category === PrettyCategory.Chronicled
  const isBangboo = category === PrettyCategory.Bangboo
  const isEventOde = category === PrettyCategory.EventOde
  const hasUp = !isBeginner && !isPermanent && !isChronicled && !isBangboo && !isBeyond

  return (
    <div className={styles.root}>
      <div className={styles.title}>
        <Locale
          component={Body1}
          mapping={[`Business.${keyofBusinesses}.Gacha.Category.${metadata.category}`]}
        />
        <Locale
          component={Caption1}
          mapping={[
            'Pages.Gacha.LegacyView.Clientarea.Overview.GridCard.Labels.Total',
            { count: metadata.total },
          ]}
        />
        <div className={styles.sums}>
          {hasUp && (
            <>
              <Locale
                className={styles.upSum}
                component={Caption1}
                mapping={[
                  'Pages.Gacha.LegacyView.Clientarea.Analysis.LegacyHistory.ListTitle',
                  { upSum: metadata.rankings[ranking].upSum, context: 'Up' },
                ]}
              />
            <Caption1>{' / '}</Caption1>
            </>
          )}
          {isEventOde && !Array.isArray(data) && (
            <>
              <Caption1 className={styles.sumPurple}>
                {metadata.rankings.purple.sum}
              </Caption1>
              <Caption1> / </Caption1>
            </>
          )}
          <Locale
            className={styles[`sum${capitalize(ranking)}`]}
            component={Caption1}
            mapping={[
              'Pages.Gacha.LegacyView.Clientarea.Analysis.LegacyHistory.ListTitle',
              { sum: metadata.rankings[ranking].sum, context: 'Total' },
            ]}
          />
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.records}>
        {Array.isArray(data)
          ? data.map((record) => (
            <GachaItem
              key={record.id}
              keyofBusinesses={keyofBusinesses}
              ranking={capitalize(ranking)}
              record={record}
              noUpBadge={!hasUp}
              small
            />
          ))
          : data.merged.map((ref) => {
            const record = data[ref.ranking][ref.index]
            return (
              <GachaItem
                key={record.id}
                keyofBusinesses={keyofBusinesses}
                ranking={capitalize(ref.ranking)}
                record={record}
                noUpBadge={!hasUp}
                small
              />
            )
          })}
      </div>
    </div>
  )
}
