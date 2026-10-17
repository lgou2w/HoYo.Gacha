import { KeyofAccountBusiness } from '@/api/Account'
import BusinessImages from '@/assets/images/BusinessImages'
import { BannerCategory } from '@/routes/Gacha/api/stats'

export const ToolbarHeight = '4rem'

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

export function hasUpBanner (category: BannerCategory): boolean {
  return category !== BannerCategory.Beginner
    && category !== BannerCategory.Permanent
    && category !== BannerCategory.ChronicledAndLightrace
    && category !== BannerCategory.Bangboo
    && category !== BannerCategory.PermanentOde
    && category !== BannerCategory.EventOde
}
