import { ComponentProps, useMemo } from 'react'
import { Image, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { KeyofAccountBusiness, KeyofMiliastraWonderland } from '@/api/schemas/Account'
import BusinessImages from '@/assets/images/BusinessImages'
import { WithTransKnownNs, useI18n } from '@/i18n'
import { CategorizedRecordsRanking, ItemCategory, PrettizedRecord } from '@/pages/Gacha/contexts/PrettizedRecords'
import capitalize from '@/utilities/capitalize'
import GachaImage, { GachaImageProps } from './Image'

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    width: '4.5rem',
    height: '4.5rem',
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    alignItems: 'center',
    justifyContent: 'center',
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
  keyofGenshinImpact: {},
  keyofHonkaiStarRail: {
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
    '& img': {
      borderTopRightRadius: tokens.borderRadiusXLarge,
    },
  },
  keyofZenlessZoneZero: {},
  keyofMiliastraWonderland: {},
  rankingGreen: {},
  rankingBlue: { background: 'linear-gradient(#434e7e, #4d80c8)' },
  rankingPurple: { background: 'linear-gradient(#4e4976, #9061d2)' },
  rankingGolden: { background: 'linear-gradient(#986359, #d2ad70)' },
  label: {
    position: 'absolute',
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase100,
    textAlign: 'center',
    padding: '0 0.2rem',
    minWidth: '1.2rem',
    userSelect: 'none',
    fontFamily: tokens.fontFamilyMonospace,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralCardBackground}`,
  },
  labelUsedPity: {
    bottom: 0,
    right: 0,
    color: tokens.colorPaletteRedBackground1,
    backgroundColor: tokens.colorPaletteRedForeground1,
    borderTopLeftRadius: tokens.borderRadiusMedium,
    borderBottomRightRadius: tokens.borderRadiusMedium,
  },
  labelUp: {
    top: 0,
    left: 0,
    color: tokens.colorPaletteLightGreenBackground1,
    backgroundColor: tokens.colorPaletteLightGreenForeground1,
    borderTopLeftRadius: tokens.borderRadiusMedium,
    borderBottomRightRadius: tokens.borderRadiusMedium,
  },
  labelCatalog: {
    top: '0.075rem',
    left: '0.075rem',
    border: 'none',
    borderRadius: tokens.borderRadiusMedium,
    background: 'rgba(0, 0, 0, 0.35)',
    width: '1rem',
    height: '1rem',
    minWidth: '1rem',
    padding: '0.075rem',
    '& img': {
      width: '100%',
      height: '100%',
    },
  },
})

type ImageProps = Omit<GachaImageProps, 'keyof' | 'itemId' | 'itemCategory'>

export type GachaImageItemProps
  = & Omit<ComponentProps<'div'>, 'children' | 'title' | 'ref'>
    & { image?: ImageProps }
    & {
      keyof: KeyofAccountBusiness
      ranking: CategorizedRecordsRanking
      record: PrettizedRecord
      small?: boolean
      noUpBadge?: boolean
      noUsedPityBadge?: boolean
    }

export default function GachaImageItem (props: GachaImageItemProps) {
  const {
    className,
    keyof,
    record: {
      id,
      time,
      itemId,
      itemName,
      itemCategory,
      usedPity,
      isUp,
      version,
      genshinImpactCharacter2,
    },
    image: { className: imageClassName, ...imageRest } = {},
    ranking,
    small,
    noUpBadge,
    noUsedPityBadge,
    ...rest
  } = props

  const styles = useStyles()
  const i18n = useI18n(WithTransKnownNs.GachaPage)
  const title = useMemo(
    () => [
      itemName,
      version && i18n.t('ImageItem.Titles.Version', { value: version }),
      genshinImpactCharacter2 && i18n.t('ImageItem.Titles.GenshinImpactCharacter2'),
      i18n.dayjs(time).format('LLLL'),
    ]
      .filter((el) => typeof el === 'string')
      .join('\n'),
    [genshinImpactCharacter2, i18n, itemName, time, version],
  )

  // TODO: docs
  const catalog = keyof === KeyofMiliastraWonderland
    && (itemCategory === ItemCategory.CosmeticCatalog
      || (itemId >= 270000 && itemId <= 279999))

  return (
    <div
      className={mergeClasses(
        styles.root,
        small && styles.rootSmall,
        styles[`ranking${capitalize(ranking)}`],
        styles[`keyof${keyof}`],
        className,
      )}
      data-business={keyof}
      data-ranking={ranking}
      data-id={id}
      data-time={time}
      data-item-id={itemId}
      data-item-name={itemName}
      data-item-category={itemCategory}
      title={title}
      {...rest}
    >
      <GachaImage
        className={mergeClasses(styles.image, imageClassName)}
        keyof={keyof}
        itemId={itemId}
        itemCategory={itemCategory}
        {...imageRest}
      />
      {!noUsedPityBadge && usedPity && (
        <span className={mergeClasses(styles.label, styles.labelUsedPity)}>
          {usedPity.value}
        </span>
      )}
      {!noUpBadge && isUp && (
        <span className={mergeClasses(styles.label, styles.labelUp)}>
          {i18n.t('ImageItem.Up')}
        </span>
      )}
      {noUpBadge && catalog && (
        <span className={mergeClasses(styles.label, styles.labelCatalog)}>
          <Image src={BusinessImages[keyof].Material!.IconCostumeSynthesis} />
        </span>
      )}
    </div>
  )
}
