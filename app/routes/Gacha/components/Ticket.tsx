import { ComponentProps } from 'react'
import { Image } from '@fluentui/react-components'
import { KeyofAccountBusiness } from '@/api/Account'
import { BannerCategory } from '@/routes/Gacha/api/stats'
import { ticketSrc } from './types'

export interface GachaTicketProps extends Omit<ComponentProps<'img'>, 'children' | 'src' | 'srcSet'> {
  keyof: KeyofAccountBusiness
  category?: BannerCategory
}

export default function GachaTicket (props: GachaTicketProps) {
  const { keyof, category, ...rest } = props
  return (
    <Image
      src={ticketSrc(keyof, category)}
      {...rest}
    />
  )
}
