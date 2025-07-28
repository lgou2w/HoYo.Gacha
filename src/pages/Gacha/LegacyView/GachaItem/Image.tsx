import React from 'react'
import BizImages from '@/components/BizImages'
import { Businesses, KeyofBusinesses } from '@/interfaces/Business'
import { PrettyGachaRecord } from '@/interfaces/GachaRecord'

export type GachaItemImageProps = Omit<React.JSX.IntrinsicElements['img'], 'src'> & {
  keyofBusinesses: KeyofBusinesses
  record: PrettyGachaRecord
}

export default function GachaItemImage (props: GachaItemImageProps) {
  const {
    keyofBusinesses,
    record: {
      itemCategory,
      itemId,
    },
    ...rest
  } = props

  let imageSrc = BizImages[keyofBusinesses]?.[itemCategory]?.[itemId]
  if (!imageSrc) {
    imageSrc = resolveRemoteImageSrc(keyofBusinesses, itemCategory, itemId)
    console.warn('No valid embedded Gacha image were found, will try to load from remote:', {
      keyofBusinesses,
      itemCategory,
      itemId,
      imageSrc,
    })
  }

  return <img src={imageSrc} {...rest} />
}

const LEGACY_FACETS = {
  [Businesses.GenshinImpact]: 'genshin',
  [Businesses.HonkaiStarRail]: 'starrail',
  [Businesses.ZenlessZoneZero]: 'zzz',
} as const

function resolveRemoteImageSrc (
  keyofBusinesses: KeyofBusinesses,
  itemCategory: PrettyGachaRecord['itemCategory'],
  itemId: string,
  legacy?: boolean,
) {
  if (legacy) {
    // v0 legacy facet
    console.debug('Using legacy image source')
    const legacyFacet = LEGACY_FACETS[Businesses[keyofBusinesses]]
    const legacyCategory = itemCategory.toLowerCase() as Lowercase<typeof itemCategory>
    return `https://hoyo-gacha.lgou2w.com/static/${legacyFacet}/${legacyCategory}/${itemId}.png`
  }

  // v1 facet
  // static or transform
  // https://docs.netlify.com/image-cdn/overview/
  return `https://hoyo-gacha-v1.lgou2w.com/${keyofBusinesses}/${itemCategory}/${itemId}.avif`
}
