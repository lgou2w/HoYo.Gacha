import { ComponentProps, memo, useMemo } from 'react'
import { Image, Tooltip, TooltipProps, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { KeyofAccountBusiness, KeyofMiliastraWonderland } from '@/api/Account'
import BusinessImages from '@/assets/Images/BusinessImages'
import { KnownI18nNs, useI18n } from '@/i18n'
import { ItemCategory, Rarity, StatsRecord } from '@/routes/Gacha/api/stats'
import useStatsRecordTooltip from '@/routes/Gacha/hooks/useStatsRecordTooltip'
import capitalize from '@/utilities/capitalize'
import GachaImage from './Image'

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
  tooltip: {
    whiteSpace: 'pre-wrap',
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
  rarityGreen: {},
  rarityBlue: { background: 'linear-gradient(#434e7e, #4d80c8)' },
  rarityPurple: { background: 'linear-gradient(#4e4976, #9061d2)' },
  rarityGolden: { background: 'linear-gradient(#986359, #d2ad70)' },
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
  labelPity: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
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

export interface GachaImageItemProps extends Omit<ComponentProps<'div'>, 'children' | 'ref'> {
  keyof: KeyofAccountBusiness
  rarity: Rarity
  record: StatsRecord
  small?: boolean
  noUpBadge?: boolean
  noPityBadge?: boolean
  tooltipPositioning?: TooltipProps['positioning']
}

export default memo(function GachaImageItem (props: GachaImageItemProps) {
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
    rarity,
    small,
    noUpBadge,
    noPityBadge,
    tooltipPositioning,
    ...rest
  } = props

  const styles = useStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })

  const buildRecordTooltip = useStatsRecordTooltip()
  const tooltip = useMemo(
    () => buildRecordTooltip({ keyof, input: { itemName, version, genshinImpactCharacter2, time } }),
    [buildRecordTooltip, genshinImpactCharacter2, itemName, keyof, time, version],
  )

  const catalog = keyof === KeyofMiliastraWonderland
    && (itemCategory === ItemCategory.CosmeticCatalog
      || (itemId >= 270000 && itemId <= 279999))

  return (
    <Tooltip
      content={{
        className: styles.tooltip,
        children: tooltip,
      }}
      positioning={tooltipPositioning}
      relationship="label"
      withArrow
    >
      <div
        className={mergeClasses(
          styles.root,
          small && styles.rootSmall,
          styles[`keyof${keyof}`],
          styles[`rarity${capitalize(rarity)}`],
          className,
        )}
        data-business={keyof}
        data-rarity={rarity}
        data-id={id}
        data-time={time}
        data-item-id={itemId}
        data-item-name={itemName}
        data-item-category={itemCategory}
        {...rest}
      >
        <GachaImage
          className={styles.image}
          keyof={keyof}
          itemCategory={itemCategory}
          itemId={itemId}
        />
        {!noPityBadge && usedPity && (
          <span className={mergeClasses(styles.label, styles.labelPity)}>
            {usedPity.value}
          </span>
        )}
        {!noUpBadge && isUp && (
          <span className={mergeClasses(styles.label, styles.labelUp)}>
            {t('Up')}
          </span>
        )}
        {noUpBadge && catalog && (
          <span className={mergeClasses(styles.label, styles.labelCatalog)}>
            <Image src={BusinessImages[keyof].IconCostumeSynthesis} />
          </span>
        )}
      </div>
    </Tooltip>
  )
})
