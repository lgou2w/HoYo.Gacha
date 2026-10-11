import { ComponentPropsWithoutRef } from 'react'
import Spacing from '@/components/Spacing'
import BannerVisibilityMenu from '@/routes/Gacha/components/Banner/VisibilityMenu'
import LastUpdated from './LastUpdated'

export default function ClientareaActions (props: Omit<ComponentPropsWithoutRef<'div'>, 'children'>) {
  return (
    <div {...props}>
      <LastUpdated />
      <Spacing />
      <BannerVisibilityMenu />
    </div>
  )
}
