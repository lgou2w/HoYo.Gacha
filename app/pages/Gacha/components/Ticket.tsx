import { ComponentProps } from 'react'
import { Image } from '@fluentui/react-components'
import { KeyofAccountBusiness } from '@/api/schemas/Account'
import BusinessImages from '@/assets/images/BusinessImages'
import { PrettizedCategory } from '@/pages/Gacha/contexts/PrettizedRecords'

type ImageProps = Omit<
  ComponentProps<'img'>,
  'children' | 'src' | 'srcSet'
>

export interface GachaTicketProps extends ImageProps {
  keyof: KeyofAccountBusiness
  category?: PrettizedCategory
}

export default function GachaTicket (props: GachaTicketProps) {
  const { keyof, category, ...rest } = props
  const src = ticketSrc(keyof, category)

  return (
    <Image
      src={src}
      {...rest}
    />
  )
}

export function ticketSrc (
  keyof: KeyofAccountBusiness,
  category?: PrettizedCategory,
): string | undefined {
  const assets = BusinessImages[keyof].Material

  let src = assets?.IconGachaTicket02
  if (category === PrettizedCategory.Beginner
    || category === PrettizedCategory.Permanent
    || category === PrettizedCategory.PermanentOde) {
    src = assets?.IconGachaTicket01
  } else if (category === PrettizedCategory.Bangboo) {
    src = assets?.IconGachaTicket03
  }

  return src
}

export function currencySrc (
  keyof: KeyofAccountBusiness,
  category: PrettizedCategory | undefined,
  variant: '01' | '02',
): string | undefined {
  const assets = BusinessImages[keyof].Material

  let src = assets?.[`IconCurrency${variant}`]
  if (category === PrettizedCategory.PermanentOde) {
    src = assets?.IconGachaTicket01
  } else if (category === PrettizedCategory.EventOde) {
    src = assets?.IconGachaTicket02
  }

  return src
}
