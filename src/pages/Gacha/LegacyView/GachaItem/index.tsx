import React from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import BizImages from '@/components/BizImages'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { Businesses, KeyofBusinesses } from '@/interfaces/Business'
import { CategorizedMetadataRankings, PrettyGachaRecord } from '@/interfaces/GachaRecord'

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    width: '4.5rem',
    height: '4.5rem',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    '> img': {
      width: '100%',
      height: '100%',
    },
  },
  rootSmall: {
    width: '4rem',
    height: '4rem',
  },
  rankingBlue: { background: 'linear-gradient(#434e7e, #4d80c8)' },
  rankingPurple: { background: 'linear-gradient(#4e4976, #9061d2)' },
  rankingGolden: { background: 'linear-gradient(#986359, #d2ad70)' },
  businessGenshinImpact: {},
  businessHonkaiStarRail: {
    borderTopRightRadius: tokens.borderRadiusXLarge,
    '&::before': {
      content: '""',
      position: 'absolute',
      boxSizing: 'border-box',
      width: 'calc(100% - 0.25rem)',
      height: 'calc(100% - 0.25rem)',
      top: '0.125rem',
      right: '0.125rem',
      bottom: 0,
      left: '0.125rem',
      borderTopRightRadius: tokens.borderRadiusXLarge,
      border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha2}`,
    },
  },
  businessZenlessZoneZero: {},
  label: {
    position: 'absolute',
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase100,
    textAlign: 'center',
    padding: '0 0.2rem',
    minWidth: '1rem',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralCardBackground}`,
    userSelect: 'none',
  },
  labelUsedPity: {
    bottom: 0,
    right: 0,
    color: tokens.colorPaletteRedBackground1,
    backgroundColor: tokens.colorPaletteRedForeground1,
  },
  labelLimited: {
    top: 0,
    left: 0,
    color: tokens.colorPaletteLightGreenBackground1,
    backgroundColor: tokens.colorPaletteLightGreenForeground1,
  },
})

export type GachaItemProps = Omit<React.JSX.IntrinsicElements['div'], 'title'> & {
  keyofBusinesses: KeyofBusinesses
  ranking: Capitalize<keyof CategorizedMetadataRankings>
  record: PrettyGachaRecord
  small?: boolean
  noLimitedBadge?: boolean
  noUsedPityBadge?: boolean
}

export default function GachaItem (props: GachaItemProps) {
  const styles = useStyles()
  const {
    className,
    keyofBusinesses,
    ranking,
    record: {
      id,
      itemCategory,
      itemId,
      name,
      time,
      usedPity,
      limited,
    },
    small,
    noLimitedBadge,
    noUsedPityBadge,
    ...rest
  } = props

  const i18n = useI18n()
  const title = name + '\n' + i18n.dayjs(time).format('LLLL')

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

  return (
    <div
      className={mergeClasses(
        GachaItem.name,
        styles.root,
        small && styles.rootSmall,
        styles[`ranking${ranking}`],
        styles[`business${keyofBusinesses}`],
        className,
      )}
      data-business={keyofBusinesses}
      data-ranking={ranking}
      data-id={id}
      data-category={itemCategory}
      data-item-id={itemId}
      data-name={name}
      data-time={time}
      title={title}
      {...rest}
    >
      <img src={imageSrc} alt={name} />
      {!noUsedPityBadge && usedPity && (
        <span className={mergeClasses(styles.label, styles.labelUsedPity)}>
          {usedPity}
        </span>
      )}
      {!noLimitedBadge && limited && (
        <Locale
          component="span"
          className={mergeClasses(styles.label, styles.labelLimited)}
          mapping={['Pages.Gacha.LegacyView.GachaItem.Limited']}
        />
      )}
    </div>
  )
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
  return `https://hoyo-gacha-v1.lgou2w.com/${keyofBusinesses}/${itemCategory}/${itemId}.webp`
}
