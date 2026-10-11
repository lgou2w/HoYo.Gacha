import { KnownI18nNs, useI18n } from '@/i18n'
import { BannerCategory } from '@/routes/Gacha/api/stats'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'

export interface BannerCategoryNameProps {
  category: BannerCategory
  context?: 'title' | 'short'
}

export default function BannerCategoryName (props: BannerCategoryNameProps) {
  const { category, context } = props
  const { t } = useI18n({ ns: KnownI18nNs.Common })
  const business = useBusiness()

  return t(
    `${business.keyof}.Gacha.Banner.${category}`,
    { context },
  )
}
