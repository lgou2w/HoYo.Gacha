import { useCallback } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import useHorizontalWheelScroll from '@/hooks/useHorizontalWheelScroll'
import { BannerCategory } from '@/routes/Gacha/api/stats'
import { useBannerSortable, useVisibleBanners } from '@/routes/Gacha/contexts/BannerSortable/hooks'
import SortableList, { SortableListProps } from '@/routes/Gacha/contexts/Sortable/List'
import { useGachaStats } from '@/routes/Gacha/contexts/Stats/hooks'
import ColumnItem from './ColumnItem'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
    margin: `calc(-1 * ${tokens.spacingVerticalS})`,
  },
  columns: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    overflow: 'auto hidden',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalS,
  },
  columnWrapper: {
    flex: 1,
    minWidth: '15rem',
  },
})

export default function AnalysisColumns () {
  const styles = useStyles()

  const stats = useGachaStats()
  const banners = useBannerSortable()
  const visibleBanners = useVisibleBanners(stats, banners)

  const itemContent = useCallback<SortableListProps<BannerCategory>['itemContent']>((id, _index, sortable) => {
    const dataset = stats.banners[id]
    if (!dataset) {
      return null
    }

    return (
      <div ref={sortable.ref} className={styles.columnWrapper}>
        <ColumnItem
          dataset={dataset}
          dragRef={sortable.handleRef}
        />
      </div>
    )
  }, [stats.banners, styles.columnWrapper])

  const handleWheel = useHorizontalWheelScroll({
    ease: 0.15,
    step: 1.2,
    shouldHandle: shouldPreventHorizontalScroll,
  })

  return (
    <div className={styles.root}>
      <SortableList
        className={styles.columns}
        onWheel={handleWheel}
        onReorder={banners.reorder}
        items={visibleBanners}
        itemContent={itemContent}
        axis="horizontal"
      />
    </div>
  )
}

// Wheel controls horizontal scrolling
function shouldPreventHorizontalScroll (evt: WheelEvent | React.WheelEvent) {
  let el: EventTarget | ParentNode | null = evt.target

  while (el && el instanceof HTMLElement && el !== evt.currentTarget) {
    if (el.style.overflowY === 'auto' || el.style.overflowY === 'scroll') {
      return false
    }
    el = el.parentNode
  }

  return true
}
