import { ComponentProps } from 'react'
import { Image, Spinner } from '@fluentui/react-components'
import { useQuery } from '@tanstack/react-query'
import BusinessCommands from '@/api/commands/business'
import { AccountBusiness, KeyofAccountBusiness, KeyofMiliastraWonderland } from '@/api/schemas/Account'
import BusinessImages from '@/assets/images/BusinessImages'
import GachaImageNone from '@/assets/images/Gacha/None.avif'
import { ItemCategory, PrettizedRecord } from '@/pages/Gacha/contexts/PrettizedRecords'

type ImageProps = Omit<
  ComponentProps<'img'>,
  'children' | 'src' | 'srcSet'
>

export interface GachaImageProps extends ImageProps {
  keyof: KeyofAccountBusiness
  itemId: PrettizedRecord['itemId']
  itemCategory?: PrettizedRecord['itemCategory']
}

export default function GachaImage (props: GachaImageProps) {
  const { src, ...rest } = resolveImage(props)

  if (typeof src === 'string') {
    return <Image src={src} {...rest} />
  } else {
    return <CacheableImage {...props} />
  }
}

function resolveImage (props: GachaImageProps): ImageProps & { src: string | undefined } {
  const { keyof, itemId, itemCategory, ...rest } = props

  // HACK: Metadata for the pretty record is optional.
  // See: src-tauri\src\business\gacha_prettied.rs
  if (!itemCategory) {
    return { src: GachaImageNone, ...rest }
  }

  let src: string | Promise<string> | undefined = undefined

  // First, use embedded assets
  if (itemCategory) {
    src = BusinessImages[keyof]?.[itemCategory]?.[itemId]
  }

  // FIXME: Genshin Impact: Miliastra Wonderland
  //   Currently, this is how it reuses icon resources.
  if (!src
    && keyof === KeyofMiliastraWonderland
    && itemCategory === ItemCategory.CosmeticCatalog) {
    src = BusinessImages[keyof]?.[ItemCategory.CosmeticComponent]?.[itemId - 10000]
  }

  return {
    src,
    ...rest,
  }
}

function CacheableImage (props: GachaImageProps) {
  const { keyof, itemId, itemCategory, ...rest } = props
  const { data, isLoading } = useQuery({
    enabled: !!itemCategory,
    gcTime: Infinity,
    staleTime: Infinity,
    queryKey: ['GachaImage', keyof, itemId, itemCategory],
    queryFn: async function gachaCacheableImageQueryFn () {
      const mime = await BusinessCommands.resolveImageMime()
      const data = await BusinessCommands.resolveImage({
        business: AccountBusiness[keyof],
        itemId,
        itemCategory: itemCategory!,
      }).catch((error) => {
        console.error('Failed to resolve image for', { keyof, itemId, itemCategory }, error)
        throw error
      })

      const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: mime })
      console.debug('Resolved image for', { keyof, itemId, itemCategory }, blob)
      return URL.createObjectURL(blob)
    },
  })

  if (isLoading) {
    return <Spinner />
  }

  return (
    <Image src={data || GachaImageNone} {...rest} />
  )
}
