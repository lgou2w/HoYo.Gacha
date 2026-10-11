import { ComponentProps } from 'react'
import { Image } from '@fluentui/react-components'
import { KeyofAccountBusiness } from '@/api/Account'
import BusinessImages from '@/assets/Images/BusinessImages'
import { BannerCategory } from '@/routes/Gacha/api/stats'

const StandardTicketCategories = new Set<BannerCategory>([
  BannerCategory.Beginner,
  BannerCategory.Permanent,
  BannerCategory.PermanentOde,
])

export function ticketSrc (
  keyof: KeyofAccountBusiness,
  category?: BannerCategory,
): string | undefined {
  const assets = BusinessImages[keyof]

  if (category && StandardTicketCategories.has(category)) {
    return assets.IconGachaTicket01
  } else if (category === BannerCategory.Bangboo) {
    return assets.IconGachaTicket03
  } else {
    return assets.IconGachaTicket02
  }
}

export function currencySrc (
  keyof: KeyofAccountBusiness,
  category: BannerCategory | undefined,
  variant: '01' | '02',
): string | undefined {
  const assets = BusinessImages[keyof]

  if (category === BannerCategory.PermanentOde) {
    return assets.IconGachaTicket01
  } else if (category === BannerCategory.EventOde) {
    return assets.IconGachaTicket02
  } else {
    return variant === '01'
      ? assets.IconCurrency01
      : assets.IconCurrency02
  }
}

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
