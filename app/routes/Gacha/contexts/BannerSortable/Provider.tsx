import { PropsWithChildren, useMemo } from 'react'
import { BannerCategory } from '@/routes/Gacha/api/stats'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import SortableProvider from '@/routes/Gacha/contexts/Sortable/Provider'
import { SortableDefaults } from '@/routes/Gacha/contexts/Sortable/types'
import { BannerSortableHandle } from './hooks'
import { defaultHiddenFor, defaultOrderFor } from './types'

export default function BannerSortableProvider (props: PropsWithChildren) {
  const business = useBusiness()
  const defaults = useMemo<SortableDefaults<BannerCategory>>(() => ({
    order: defaultOrderFor(business.value),
    hidden: defaultHiddenFor(business.value),
  }), [business.value])

  return (
    <SortableProvider<BannerCategory>
      scope="Banner"
      keyof={business.keyof}
      context={BannerSortableHandle}
      defaults={defaults}
    >
      {props.children}
    </SortableProvider>
  )
}
