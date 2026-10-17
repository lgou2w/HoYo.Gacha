import { ComponentProps } from 'react'
import { Image, Spinner } from '@fluentui/react-components'
import { useQuery } from '@tanstack/react-query'
import { AccountBusiness, KeyofAccountBusiness } from '@/api/Account'
import None from '@/assets/images/Gacha/None.avif'
import { BusinessCommands } from '@/routes/Gacha/api/business'
import { StatsRecord } from '@/routes/Gacha/api/stats'

type ImageProps = Omit<ComponentProps<'img'>, 'children' | 'src' | 'srcSet'>

export interface GachaImageProps extends ImageProps {
  keyof: KeyofAccountBusiness
  itemCategory?: StatsRecord['itemCategory']
  itemId: StatsRecord['itemId']
}

export default function GachaImage (props: GachaImageProps) {
  const { keyof, itemId, itemCategory, ...rest } = props

  if (!itemCategory) {
    return <Image src={None} {...rest} />
  } else {
    return (
      <CacheableImage
        keyof={keyof}
        itemCategory={itemCategory}
        itemId={itemId}
        {...rest}
      />
    )
  }
}

// #region: Cacheable

interface CacheableImageProps extends ImageProps {
  keyof: KeyofAccountBusiness
  itemCategory: NonNullable<StatsRecord['itemCategory']>
  itemId: NonNullable<StatsRecord['itemId']>
}

function CacheableImage (props: CacheableImageProps) {
  const { keyof, itemCategory, itemId, ...rest } = props
  const { data: src, isPending, isError } = useCacheableImageQuery(keyof, itemCategory, itemId)

  if (isPending) {
    return <Spinner />
  } else if (isError || !src) {
    return <Image src={None} {...rest} />
  } else {
    return <Image src={src} {...rest} />
  }
}

// See: tauri/src/business/img_resolver.rs
const MimeType = 'image/avif'
const KeyCacheableImage = 'GachaImages'

function useCacheableImageQuery (
  keyof: KeyofAccountBusiness,
  itemCategory: CacheableImageProps['itemCategory'],
  itemId: CacheableImageProps['itemId'],
) {
  return useQuery({
    gcTime: Infinity,
    staleTime: Infinity,
    networkMode: 'offlineFirst',
    refetchOnReconnect: true,
    queryKey: [KeyCacheableImage, keyof, itemCategory, itemId],
    queryFn: async function gachaImageQueryFn () {
      const buffer = await BusinessCommands.resolveImage({
        business: AccountBusiness[keyof],
        itemCategory,
        itemId,
        online: navigator.onLine,
      })

      // Offline and no cache
      if (buffer.byteLength < 1) {
        return null
      }

      // Create blob url
      return URL.createObjectURL(new Blob(
        [buffer as Uint8Array<ArrayBuffer>],
        { type: MimeType },
      ))
    },
  })
}

// #endregion
