import { BannerCategory, StatsRecord } from '@/routes/Gacha/api/stats'
import { AggregatedCategory } from '@/routes/Gacha/components/Banner/CategoryName'

export type TableEntryCategory = BannerCategory | AggregatedCategory

/** Rows of the Classic analysis table, top to bottom. */
export enum TableRow {
  AverageAndUp = 'AverageAndUp',
  UpWin = 'UpWin',
  Up = 'Up',
  Golden = 'Golden',
  Purple = 'Purple',
  Blue = 'Blue',
  Green = 'Green',
  Aggregated = 'Aggregated',
}

/**
 * Values for one row in one column.
 *
 * - Average / count rows: `[value, percentage]` — the cell renders
 *   `value [percentage%]`, or `value` alone when percentage is absent
 *   (AverageAndUp renders `average / upAverage`).
 * - Rows that do not apply to a banner (e.g. Golden on PermanentOde) are
 *   an empty tuple, rendered as `N/A`.
 */
export type TableCellValues = [number?, number?]

export interface TableEntry {
  category: TableEntryCategory
  values: Record<TableRow, TableCellValues>
}

export enum RecordsOrder {
  OldestFirst = 'OldestFirst',
  NewestFirst = 'NewestFirst',
}

export const RecordsOrders = Object.values(RecordsOrder)
export const DefaultRecordsOrder: RecordsOrder = RecordsOrder.OldestFirst

export function isRecordsOrder (val: string | null): val is RecordsOrder {
  return val === RecordsOrder.OldestFirst
    || val === RecordsOrder.NewestFirst
}

/**
 * Sort records for display.
 *
 * The backend returns `StatsRecord[]` oldest-first (`ORDER BY id ASC`), so
 * `oldest-first` returns the cached array as-is — no copy, no mutation.
 * Only `newest-first` needs a shallow copy: `[...records].reverse()` copies
 * the array slots (the `StatsRecord` objects are shared by reference) and
 * reverses the copy in place. Reversing the cached array directly would
 * corrupt TanStack Query's cache for every other consumer.
 *
 * Equivalent to `records.toReversed()` for the newest-first path (ES2023,
 * not yet in `lib: ["ES2022"]`).
 */
export function sortRecords (
  records: readonly StatsRecord[],
  order: RecordsOrder,
): readonly StatsRecord[] {
  return order === RecordsOrder.NewestFirst
    ? [...records].reverse()
    : records
}
