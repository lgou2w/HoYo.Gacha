import { ReactNode, useMemo } from 'react'
import {
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
  makeStyles, mergeClasses, tableCellClassNames, tableHeaderCellClassNames, tableRowClassNames, tokens,
  typographyStyles,
} from '@fluentui/react-components'
import { TableAltTextRegular } from '@fluentui/react-icons'
import { AccountBusiness, MiliastraWonderland, ZenlessZoneZero } from '@/api/Account'
import { KnownI18nNs, UseI18n, useI18n } from '@/i18n'
import { AggregatedStats, BannerCategory, BannerStats, Rarity } from '@/routes/Gacha/api/stats'
import BannerCategoryName, { AggregatedCategory } from '@/routes/Gacha/components/Banner/CategoryName'
import NumericValue from '@/routes/Gacha/components/Clientarea/Analysis/NumericValue'
import GachaTicket from '@/routes/Gacha/components/Ticket'
import { hasUpBanner } from '@/routes/Gacha/components/types'
import { useBannerSortable, useVisibleBanners } from '@/routes/Gacha/contexts/BannerSortable/hooks'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import { BusinessContextValue } from '@/routes/Gacha/contexts/Business/types'
import { useGachaStats } from '@/routes/Gacha/contexts/Stats/hooks'
import capitalize from '@/utilities/capitalize'
import { TableEntry, TableEntryCategory, TableRow as TableRowName } from './types'

const useStyles = makeStyles({
  root: {
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
    [`& .${tableHeaderCellClassNames.root}:not(:first-child)`]: {
      [`& .${tableHeaderCellClassNames.button}`]: {
        justifyContent: 'flex-end',
        whiteSpace: 'nowrap',
      },
    },
    [`& .${tableRowClassNames.root}`]: {
      ...typographyStyles.caption1,
      [`& .${tableCellClassNames.root}:not(:first-child)`]: {
        justifyContent: 'flex-end',
      },
      [`&[data-row="${TableRowName.AverageAndUp}"]`]: {
        color: tokens.colorPaletteGreenForeground1,
      },
      [`&[data-row="${TableRowName.UpWin}"]`]: {
        color: tokens.colorPaletteRedForeground1,
      },
      [`&[data-row="${TableRowName.Up}"]`]: {
        color: tokens.colorPaletteRedForeground1,
      },
      [`&[data-row="${TableRowName.Golden}"]`]: {
        color: tokens.colorPaletteMarigoldForeground1,
      },
      [`&[data-row="${TableRowName.Purple}"]`]: {
        color: tokens.colorPaletteBerryForeground1,
      },
      [`&[data-row="${TableRowName.Blue}"]`]: {
        color: tokens.colorPaletteBlueBorderActive,
      },
      [`&[data-row="${TableRowName.Green}"]`]: {
        color: tokens.colorPaletteGreenForeground1,
      },
      [`& [data-cell="n/a"]`]: {
        color: tokens.colorNeutralForeground4,
      },
      [`&[data-row="${TableRowName.Aggregated}"]`]: {
        borderBottom: 'none',
      },
    },
  },
  tableHeader: {
    // flex: '1 0 9rem',
  },
  tableHeaderIcon: {
    flexShrink: 0,
    fontSize: tokens.fontSizeBase400,
  },
  tableCell: {
    // flex: '1 0 9rem',
    whiteSpace: 'pre-wrap',
  },
  tableCellTicket: {
    marginLeft: tokens.spacingHorizontalXS,
    width: tokens.fontSizeBase500,
    height: 'auto',
    aspectRatio: 1,
  },
  tabelCellTicketZenlessZoneZero: {
    padding: tokens.spacingVerticalXXS,
  },
  notApplicable: {
    color: tokens.colorNeutralForeground5,
  },
})

export function AnalysisTable () {
  const styles = useStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Clientarea.Analysis.Classic.Table' })
  const business = useBusiness()
  const entries = useTableEntries()
  const rows = useMemo(
    () => buildTableRows(entries, styles, business, t),
    [entries, styles, business, t],
  )

  return (
    <Table className={styles.root} size="small" noNativeElements>
      <TableHeader>
        <TableRow>
          <TableHeaderCell className={styles.tableHeader}>
            <TableAltTextRegular className={styles.tableHeaderIcon} />
            {t('Title', { keyof: business.keyof })}
          </TableHeaderCell>
          {entries.map((entry) => (
            <TableHeaderCell className={styles.tableHeader} key={entry.category}>
              <BannerCategoryName category={entry.category} context="short" tooltip />
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows}
      </TableBody>
    </Table>
  )
}

function useTableEntries (): TableEntry[] {
  const stats = useGachaStats()
  const banners = useBannerSortable()
  const visible = useVisibleBanners(stats, banners)

  return useMemo(() => {
    if (!stats) {
      return []
    }

    const entries: TableEntry[] = []

    for (const category of visible) {
      let banner: BannerStats<AccountBusiness> | null
      if (banner = stats.banners[category]) {
        entries.push(createEntry(category, banner))
      }
    }

    if (stats.aggregated) {
      entries.push(createEntry(AggregatedCategory, stats.aggregated))
    }

    return entries
  }, [stats, visible])
}

function createEntry (
  category: TableEntryCategory,
  dataset: BannerStats<AccountBusiness> | AggregatedStats,
): TableEntry {
  const { golden, purple, blue, green } = dataset.rarity
  const shouldRenderUp = category === AggregatedCategory || hasUpBanner(category)

  return {
    category,
    values: {
      [TableRowName.AverageAndUp]: [golden.average, golden.up.average],
      [TableRowName.UpWin]: shouldRenderUp ? [golden.upWin.sum, golden.upWin.percentage] : [],
      [TableRowName.Up]: shouldRenderUp ? [golden.up.sum, golden.up.percentage] : [],
      [TableRowName.Golden]: [golden.sum, golden.percentage],
      [TableRowName.Purple]: [purple.sum, purple.percentage],
      [TableRowName.Blue]: [blue.sum, blue.percentage],
      [TableRowName.Green]: [green?.sum, green?.percentage],
      [TableRowName.Aggregated]: [dataset.total, dataset.total > 0 ? 100 : 0],
    },
  }
}

function buildTableRows (
  entries: TableEntry[],
  styles: ReturnType<typeof useStyles>,
  business: BusinessContextValue,
  t: UseI18n['t'],
): ReactNode[] {
  const isMiliastraWonderland = business.toBe(MiliastraWonderland)
  const rows: ReactNode[] = []

  for (const row of Object.values(TableRowName)) {
    const isSpecial = row === TableRowName.AverageAndUp
      || row === TableRowName.UpWin
      || row === TableRowName.Up

    // Miliastra Wonderland has no UP concept — hide the UP / UpWin / average rows.
    if (isMiliastraWonderland && isSpecial) {
      continue
    }

    // Green rarity is Miliastra Wonderland only.
    if (!isMiliastraWonderland && row === TableRowName.Green) {
      continue
    }

    const isAverageAndUp = row === TableRowName.AverageAndUp
    const isAggregated = row === TableRowName.Aggregated
    const rarity = isAggregated || isSpecial
      ? capitalize(Rarity.Golden)
      : undefined

    rows.push(
      <TableRow key={row} data-row={row}>
        <TableCell className={styles.tableCell}>
          {t(`Labels.${row}`, { keyof: business.keyof, rarity })}
        </TableCell>
        {entries.map((entry) => {
          const [sum, pct] = entry.values[row]
          const hasSumAndPct = typeof sum !== 'undefined' && typeof pct !== 'undefined'
          const notApplicable = !hasSumAndPct
            || (row === TableRowName.Golden && entry.category === BannerCategory.PermanentOde)
            || (row === TableRowName.Green && entry.category === BannerCategory.EventOde)

          return (
            <TableCell key={entry.category} className={styles.tableCell}>
              {notApplicable
                ? <span className={styles.notApplicable}>N/A</span>
                : <NumericValue sum={sum} pct={pct} average={isAverageAndUp} />}
              {entry.category !== AggregatedCategory && isAverageAndUp && (
                <GachaTicket
                  className={mergeClasses(
                    styles.tableCellTicket,
                    business.toBe(ZenlessZoneZero) && styles.tabelCellTicketZenlessZoneZero,
                  )}
                  keyof={business.keyof}
                  category={entry.category}
                />
              )}
            </TableCell>
          )
        })}
      </TableRow>,
    )
  }

  return rows
}
