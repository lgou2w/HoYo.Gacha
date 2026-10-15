import { CSSProperties, PropsWithChildren, memo, useMemo } from 'react'
import { Body1, Caption1, Image, Tooltip, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import GachaImageNone from '@/assets/Images/Gacha/None.avif'
import { KnownI18nNs, useI18n } from '@/i18n'
import { BannerCategory, Rarity, StatsRecord } from '@/routes/Gacha/api/stats'
import GachaImage from '@/routes/Gacha/components/Image'
import { hasUpBanner } from '@/routes/Gacha/components/types'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import useStatsRecordTooltip from '@/routes/Gacha/hooks/useStatsRecordTooltip'

// See: https://github.com/lgou2w/HoYo.Gacha/issues/155
const ItemHeight = '2.25rem'

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: ItemHeight,
    paddingRight: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusMedium,
    zIndex: 0,
    userSelect: 'none',
    '::before,::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      height: '100%',
      zIndex: -1,
    },
    '::before': {
      borderRadius: tokens.borderRadiusMedium,
      width: '100%',
      opacity: 0.15,
    },
    '::after': {
      borderTopLeftRadius: tokens.borderRadiusMedium,
      borderBottomLeftRadius: tokens.borderRadiusMedium,
      borderTopRightRadius: tokens.borderRadiusSmall,
      borderBottomRightRadius: tokens.borderRadiusSmall,
      width: 'var(--progress)',
      opacity: 0.45,
    },
  },
  item: {
    '::before,::after': {
      backgroundColor: tokens.colorBrandBackground,
    },
  },
  nextPity: {
    '::before,::after': {
      backgroundColor: tokens.colorPaletteDarkOrangeBackground3,
    },
  },
  icon: {
    height: '100%',
    width: 'auto',
    aspectRatio: 1,
    borderTopLeftRadius: tokens.borderRadiusMedium,
    borderBottomLeftRadius: tokens.borderRadiusMedium,
  },
  itemName: {
    margin: `0 ${tokens.spacingHorizontalS}`,
  },
  labels: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalXS,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  label: {
    minWidth: '1rem',
    textAlign: 'right',
  },
  labelHardPity: {
    color: tokens.colorPaletteGreenForeground1,
  },
  labelUp: {
    [`&[data-rarity="${Rarity.Golden}"]`]: {
      color: tokens.colorPaletteMarigoldForeground1,
    },
    [`&[data-rarity="${Rarity.Purple}"]`]: {
      color: tokens.colorPaletteBerryForeground1,
    },
  },
  tooltip: {
    whiteSpace: 'pre-wrap',
  },
})

export interface RecordItemProps {
  category: BannerCategory
  rarity: Rarity
  record: StatsRecord
  prevRecord?: StatsRecord | null
}

const I18nScope = 'Clientarea.Analysis.ColumnItem.Records'

const RecordItem = memo(function RecordItem (props: RecordItemProps) {
  const { category, rarity, record, prevRecord } = props
  const styles = useStyles()

  const { t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: I18nScope })
  const business = useBusiness()

  const buildTooltip = useStatsRecordTooltip()
  const tooltip = useMemo(
    () => buildTooltip({ keyof: business.keyof, input: record }),
    [buildTooltip, business.keyof, record],
  )

  const hasUp = hasUpBanner(category)
  const isHardPity
    = rarity === Rarity.Golden
      && prevRecord
      && !prevRecord.isUp
      && record.isUp

  return (
    <Tooltip
      content={{
        className: styles.tooltip,
        children: tooltip,
      }}
      positioning="above-start"
      relationship="label"
      withArrow
    >
      <div
        className={mergeClasses(styles.root, styles.item)}
        style={{ '--progress': `${record.usedPity?.progress || 0}%` } as CSSProperties}
      >
        <GachaImage
          className={styles.icon}
          keyof={business.keyof}
          itemCategory={record.itemCategory}
          itemId={record.itemId}
        />
        <Body1 className={styles.itemName} wrap={false} truncate>
          {record.itemName}
        </Body1>
        <div className={styles.labels}>
          {hasUp && (
            <>
              {isHardPity && (
                <Caption1
                  className={mergeClasses(styles.label, styles.labelHardPity)}
                  wrap={false}
                >
                  {t('HardPity')}
                </Caption1>
              )}
              {record.isUp && (
                <Caption1
                  className={mergeClasses(styles.label, styles.labelUp)}
                  data-rarity={rarity}
                  wrap={false}
                >
                  {t('Up')}
                </Caption1>
              )}
            </>
          )}
          <Caption1 className={styles.label}>
            {record.usedPity?.value ?? 0}
          </Caption1>
        </div>
      </div>
    </Tooltip>
  )
})

export interface RecordItemNextPityProps {
  value: number
  progress: number
  endTime?: string | null
}

const RecordItemNextPity = memo(function RecordItemNextPity (props: RecordItemNextPityProps) {
  const { value, progress, endTime } = props
  const styles = useStyles()

  const { t, dayjs } = useI18n({ ns: KnownI18nNs.GachaPage, scope: I18nScope })

  return (
    <div
      className={mergeClasses(styles.root, styles.nextPity)}
      title={endTime ? dayjs(endTime).format('LLLL') : undefined}
      style={{ '--progress': `${progress}%` } as CSSProperties}
    >
      <Image className={styles.icon} src={GachaImageNone} />
      <Body1 className={styles.itemName}>
        {t('NextPity')}
      </Body1>
      <div className={styles.labels}>
        <Caption1 className={styles.label}>
          {value}
        </Caption1>
      </div>
    </div>
  )
})

const useWrapperStyles = makeStyles({
  item: {
    height: `calc(${ItemHeight} + ${tokens.spacingVerticalSNudge})`,
  },
  regular: {
    height: `calc(${tokens.fontSizeBase200} + ${tokens.spacingVerticalSNudge})`,
  },
})

function RecordItemWrapper (props: PropsWithChildren<{ kind?: 'item' | 'regular' }>) {
  const { kind = 'regular', children } = props
  const styles = useWrapperStyles()
  const className = kind === 'item'
    ? styles.item
    : kind === 'regular'
      ? styles.regular
      : undefined

  return (
    <div className={className}>
      {children}
    </div>
  )
}

export default RecordItem
export {
  RecordItemNextPity,
  RecordItemWrapper,
}
