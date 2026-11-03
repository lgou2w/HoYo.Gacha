import { Caption2 } from '@fluentui/react-components'
import { ZenlessZoneZero } from '@/api/Account'
import { KnownI18nNs, useI18n } from '@/i18n'
import { BannerCategory } from '@/routes/Gacha/api/stats'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'

export const AggregatedCategory = 'Aggregated'
export type AggregatedCategory = typeof AggregatedCategory

export interface BannerCategoryNameProps {
  category: BannerCategory | AggregatedCategory
  context?: 'title' | 'short'
  tooltip?: boolean
}

export default function BannerCategoryName (props: BannerCategoryNameProps) {
  const { category, context, tooltip } = props
  const { t } = useI18n({ ns: KnownI18nNs.Common })
  const business = useBusiness()

  const categoryName = t(
    `${business.keyof}.Gacha.Banner.${category}`,
    { context },
  )

  if (business.toBe(ZenlessZoneZero)
    && category === AggregatedCategory
    && tooltip) {
    return (
      <>
        {categoryName}
        <Caption2>
          {t(`${business.keyof}.Gacha.Banner.${AggregatedCategory}`, {
            context: 'tooltip',
          })}
        </Caption2>
      </>
    )
  }

  return categoryName
}
