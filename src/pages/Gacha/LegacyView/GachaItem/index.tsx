import React from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { KeyofBusinesses } from '@/interfaces/Business'
import { CategorizedMetadataRankings, PrettyGachaRecord } from '@/interfaces/GachaRecord'
import GachaItemImage from './Image'

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    width: '4.5rem',
    height: '4.5rem',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  rootSmall: {
    width: '4rem',
    height: '4rem',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: tokens.borderRadiusMedium,
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
    borderBottomRightRadius: tokens.borderRadiusMedium,
  },
  labelUp: {
    top: 0,
    left: 0,
    color: tokens.colorPaletteLightGreenBackground1,
    backgroundColor: tokens.colorPaletteLightGreenForeground1,
    borderTopLeftRadius: tokens.borderRadiusMedium,
  },
})

export type GachaItemProps = Omit<React.JSX.IntrinsicElements['div'], 'title'> & {
  keyofBusinesses: KeyofBusinesses
  ranking: Capitalize<keyof CategorizedMetadataRankings>
  record: PrettyGachaRecord
  small?: boolean
  noUpBadge?: boolean
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
      up,
      version,
      genshinCharacter2,
    },
    small,
    noUpBadge,
    noUsedPityBadge,
    ...rest
  } = props

  const i18n = useI18n()

  let title = name
  title += version ? '\n' + i18n.t('Pages.Gacha.LegacyView.GachaItem.Title.Version', { version }) : ''
  title += genshinCharacter2 ? '\n' + i18n.t('Pages.Gacha.LegacyView.GachaItem.Title.GenshinImpactCharacter2') : ''
  title += '\n' + i18n.dayjs(time).format('LLLL')

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
      <GachaItemImage
        className={styles.image}
        keyofBusinesses={keyofBusinesses}
        record={props.record}
        alt={name}
      />
      {!noUsedPityBadge && usedPity && (
        <span className={mergeClasses(styles.label, styles.labelUsedPity)}>
          {usedPity}
        </span>
      )}
      {!noUpBadge && up && (
        <Locale
          component="span"
          className={mergeClasses(styles.label, styles.labelUp)}
          mapping={['Pages.Gacha.LegacyView.GachaItem.Up']}
        />
      )}
    </div>
  )
}
