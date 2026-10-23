import { useCallback, useMemo } from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { useBannerSortable, useVisibleBanners } from '@/routes/Gacha/contexts/BannerSortable/hooks'
import SortableList, { SortableListProps } from '@/routes/Gacha/contexts/Sortable/List'
import { useGachaStats } from '@/routes/Gacha/contexts/Stats/hooks'
import GridItem from './GridItem'
import GridTags from './GridTags'
import { Aggregated, GridItemId } from './types'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: '0 0 auto',
    width: '100%',
    rowGap: tokens.spacingVerticalL,
    columnGap: tokens.spacingHorizontalL,
  },
  item: {
    display: 'flex',
    // `flexGrow: 1` — stretch to fill the row when this item is alone
    // (single-column layout, or the last banner when the count is odd).
    // Without it the item stops at `flexBasis` and leaves blank space on
    // the right.
    // `flexShrink: 0` — keep `flexBasis` intact on narrow windows instead
    // of squeezing the item below its intended width.
    // Use `flexBasis` (not `minWidth`) so the initial size is fixed. In a
    // two-column row the two bases plus the gap exactly fill the container,
    // so `flexGrow` has nothing to distribute — dragging one item does not
    // stretch its neighbour. The previous `flex: '1 0 auto'` + `minWidth`
    // variant left `flexBasis` at `auto`, giving `flexGrow` free space to
    // expand during a drag and snap back on drop.
    //
    // `max(50%, 20rem)` keeps two columns at ≥ 656px (`2 × 20rem + gap`)
    // and collapses to one column below that.
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: `calc(max(50%, 20rem) - ${tokens.spacingHorizontalL} / 2)`,
  },
  tags: {
    display: 'flex',
    width: `calc(max(50%, 20rem) - ${tokens.spacingHorizontalL} / 2)`,
  },
  tagsSpanFull: {
    width: '100%',
  },
})

export default function OverviewGrid () {
  const styles = useStyles()

  const stats = useGachaStats()
  const banners = useBannerSortable()
  const visibleBanners = useVisibleBanners(stats, banners)

  const items = useMemo<GridItemId[]>(() => {
    if (!stats) {
      return []
    }

    const result: GridItemId[] = [...visibleBanners]
    if (stats.aggregated) {
      result.push(Aggregated)
    }

    return result
  }, [visibleBanners, stats])

  const handleReorder = useCallback((nextVisible: GridItemId[]) => {
    banners.reorder(nextVisible.filter((id) => id !== Aggregated))
  }, [banners])

  const itemContent = useCallback<SortableListProps<GridItemId>['itemContent']>((id, _index, sortable) => {
    const isAggregated = id === Aggregated
    const dataset = isAggregated
      ? stats?.aggregated
      : stats?.banners[id]

    if (!dataset) {
      return null
    }

    return (
      <div ref={sortable.ref} className={styles.item}>
        <GridItem
          dataset={dataset}
          dragHandleRef={isAggregated ? undefined : sortable.handleRef}
        />
      </div>
    )
  }, [stats?.aggregated, stats?.banners, styles.item])

  return (
    <SortableList
      className={styles.root}
      onReorder={handleReorder}
      items={items}
      itemDisabled={(id) => id === Aggregated}
      itemContent={itemContent}
      trailing={stats?.aggregated && (
        <div className={mergeClasses(
          styles.tags,
          visibleBanners.length % 2 === 1 && styles.tagsSpanFull,
        )}
        >
          <GridTags dataset={stats.aggregated} />
        </div>
      )}
    />
  )
}
