import { ComponentProps } from 'react'
import { Image } from '@fluentui/react-components'
import { KeyofAccountBusiness } from '@/api/Account'
import { BannerCategory } from '@/routes/Gacha/api/stats'
import { currencySrc } from './types'

export interface GachaCurrencyProps extends Omit<ComponentProps<'img'>, 'children' | 'src' | 'srcSet'> {
  keyof: KeyofAccountBusiness
  category?: BannerCategory
  variant: '01' | '02'
}

export function GachaCurrency (props: GachaCurrencyProps) {
  const { keyof, category, variant, ...rest } = props
  return (
    <Image
      src={currencySrc(keyof, category, variant)}
      {...rest}
    />
  )
}
