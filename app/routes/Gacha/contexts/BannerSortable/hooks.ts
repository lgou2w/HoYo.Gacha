import { useMemo } from 'react'
import { AccountBusiness } from '@/api/Account'
import { BannerCategory, GachaStats } from '@/routes/Gacha/api/stats'
import { createSortableContext } from '@/routes/Gacha/contexts/Sortable/types'
import { requiredBannersFor } from './types'

export const BannerSortableHandle = createSortableContext<BannerCategory>('Banner')
export const useBannerSortable = BannerSortableHandle.useSortableContext

export function useVisibleBanners (
  stats: GachaStats<AccountBusiness> | null,
  banners: ReturnType<typeof useBannerSortable>,
): BannerCategory[] {
  const { order, isHidden } = banners
  return useMemo(() => {
    if (!stats) {
      return []
    }

    const required = requiredBannersFor(stats.business)
    return order.filter((id) => {
      if (isHidden(id)) {
        return false
      }

      const banner = stats.banners[id]
      if (!banner || (required.has(id) && banner.total <= 0)) {
        return false
      }

      return true
    })
  }, [isHidden, order, stats])
}
