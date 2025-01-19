import React from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import Locale from '@/components/UI/Locale'
import { Business, Businesses, KeyofBusinesses } from '@/interfaces/Business'
import { CategorizedMetadataRankings, PrettyGachaRecord } from '@/interfaces/GachaRecord'
import capitalize from '@/utilities/capitalize'
import dayjs from '@/utilities/dayjs'

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'inline-flex',
    width: '4.5rem',
    height: '4.5rem',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    '&[data-ranking="Blue"]': {
      background: 'linear-gradient(#434e7e, #4d80c8)',
    },
    '&[data-ranking="Purple"]': {
      background: 'linear-gradient(#4e4976, #9061d2)',
    },
    '&[data-ranking="Golden"]': {
      background: 'linear-gradient(#986359, #d2ad70)',
    },
  },
  image: {
    width: '100%',
    height: '100%',
  },
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

interface Props {
  keyofBusinesses: KeyofBusinesses
  ranking: keyof CategorizedMetadataRankings
  record: PrettyGachaRecord
}

// TODO: v0 legacy facet
const LEGACY_FACETS: Record<Business, string> = {
  [Businesses.GenshinImpact]: 'genshin',
  [Businesses.HonkaiStarRail]: 'starrail',
  [Businesses.ZenlessZoneZero]: 'zzz',
}

export default function GachaItem (props: Props) {
  const classes = useStyles()
  const {
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
  } = props

  // TODO: Datetime i18n
  const title = name + '\n' + dayjs(time).format('LLLL')

  // TODO: Local Cache or Remote Loading
  const legacyFacet = LEGACY_FACETS[Businesses[keyofBusinesses]]
  const imageSrc = `https://hoyo-gacha.lgou2w.com/static/${legacyFacet}/${itemCategory.toLowerCase()}/${itemId}.png`

  return (
    <div
      className={classes.root}
      data-business={keyofBusinesses}
      data-ranking={capitalize(ranking)}
      data-id={id}
      data-category={itemCategory}
      data-item-id={itemId}
      data-name={name}
      data-time={time}
      title={title}
    >
      <img className={classes.image} src={imageSrc} alt={itemId} />
      {usedPity && <span className={mergeClasses(classes.label, classes.labelUsedPity)}>{usedPity}</span>}
      {limited && <Locale className={mergeClasses(classes.label, classes.labelLimited)} component="span" mapping={['Pages.Gacha.LegacyView.GachaItem.Limited']} />}
    </div>
  )
}
