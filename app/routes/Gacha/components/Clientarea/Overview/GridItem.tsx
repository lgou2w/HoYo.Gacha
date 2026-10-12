import { ReactNode, memo, useMemo } from 'react'
import { Badge, BadgeProps, Caption1, Title3, Tooltip, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { KeyofAccountBusiness, KeyofZenlessZoneZero } from '@/api/Account'
import Placeholder from '@/components/Placeholder'
import { KnownI18nNs, useI18n } from '@/i18n'
import { BannerCategory } from '@/routes/Gacha/api/stats'
import BannerCategoryName from '@/routes/Gacha/components/Banner/CategoryName'
import BannerDragIcon from '@/routes/Gacha/components/Banner/DragIcon'
import GachaImageItem from '@/routes/Gacha/components/ImageItem'
import GachaTicket from '@/routes/Gacha/components/Ticket'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import { Aggregated, GridItemDataset, deriveGridItem } from './types'

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    rowGap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteLightGreenBorder1}`,
    borderBottomLeftRadius: tokens.borderRadiusMedium,
    borderTopRightRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorPaletteLightGreenBackground2,
    color: tokens.colorPaletteLightGreenForeground2,
    lineHeight: tokens.lineHeightBase200,
    fontSize: tokens.fontSizeBase200,
    boxShadow: tokens.shadow2,
    userSelect: 'none',
  },
  badgeAggregated: {
    border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteMarigoldBorder1}`,
    backgroundColor: tokens.colorPaletteMarigoldBackground2,
    color: tokens.colorPaletteMarigoldForeground2,
  },
  badgeDragIcon: {
    fontSize: tokens.fontSizeBase300,
    width: tokens.fontSizeBase300,
    height: tokens.fontSizeBase300,
    cursor: 'pointer',
  },
  header: {
    display: 'inline-flex',
    flexDirection: 'column',
  },
  labels: {
    display: 'inline-flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  labelsGroup: {
    display: 'inline-flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  label: {
    flex: '0 0 auto',
    boxShadow: tokens.shadow2,
    whiteSpace: 'pre-wrap',
  },
  labelPercentage: {
    marginLeft: tokens.spacingHorizontalXXS,
    fontFamily: tokens.fontFamilyMonospace,
    fontStyle: 'normal',
  },
  labelLast: {
    marginLeft: tokens.spacingHorizontalXS,
    fontFamily: tokens.fontFamilyMonospace,
  },
  showcase: {
    position: 'absolute',
    right: tokens.spacingHorizontalM,
    bottom: tokens.spacingVerticalM,
  },
})

export interface OverviewGridItemProps {
  dataset: GridItemDataset
  dragHandleRef?: (el: Element | null) => void
}

export default memo(function OverviewGridItem (props: OverviewGridItemProps) {
  const { dataset, dragHandleRef } = props
  const styles = useStyles()

  const { dayjs, t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Clientarea.Overview.GridItem' })
  const business = useBusiness()
  const d = useMemo(
    () => deriveGridItem(dataset, dayjs),
    [dataset, dayjs],
  )

  return (
    <div className={styles.root}>
      <div className={mergeClasses(styles.badge, d.isAggregated && styles.badgeAggregated)}>
        {d.isBanner
          ? <BannerCategoryName category={d.category} />
          : t(Aggregated)}
        {d.isBanner && dragHandleRef && (
          <BannerDragIcon
            className={styles.badgeDragIcon}
            dragRef={dragHandleRef}
            tooltipPositioning="before"
          />
        )}
      </div>
      <div className={styles.header}>
        <Title3 as="h2">
          {d.isBanner
            ? <BannerCategoryName category={d.category} context="title" />
            : t(Aggregated)}
        </Title3>
        <Caption1 as="p">
          {d.timeRange || <Placeholder />}
        </Caption1>
      </div>
      <div className={styles.labels}>
        <div className={styles.labelsGroup}>
          <GroupLabel className={styles.label} color="brand" appearance="tint">
            {t('Total', { count: d.total })}
          </GroupLabel>
          <GroupLabel className={styles.label} color="success" appearance="tint">
            {t('Sum', { count: d.sum, context: d.rarityContext })}
          </GroupLabel>
          {d.isBanner && (
            <GroupLabel className={styles.label} color="severe" appearance="tint">
              {t('NextPity', { count: d.nextPity.value })}
            </GroupLabel>
          )}
        </div>
        <div className={styles.labelsGroup}>
          <StatLabel
            className={styles.label}
            label={t('Average', { context: d.rarityContext })}
            value={d.average}
            tooltip={d.average > 0 && `${d.usedPitySum} / ${d.sum} ≈ ${d.average}`}
            suffix={d.isBanner && <StatLabelTicket keyof={business.keyof} category={d.category} />}
            numeric
          />
          <StatLabel
            className={styles.label}
            label={t('Percentage', { context: d.rarityContext })}
            value={d.percentage}
            tooltip={d.percentage > 0 && `${d.sum} / ${d.total} ≈ ${d.percentage} %`}
            suffix={<i className={styles.labelPercentage}>%</i>}
            numeric
          />
        </div>
        {d.up && (
          <div className={styles.labelsGroup}>
            <StatLabel
              className={styles.label}
              label={t('UpAverage', { context: d.rarityContext })}
              value={d.up.average}
              tooltip={d.up.average > 0 && `${d.up.usedPitySum} / ${d.up.sum} ≈ ${d.up.average}`}
              suffix={d.isBanner && <StatLabelTicket keyof={business.keyof} category={d.category} />}
              numeric
            />
            <StatLabel
              className={styles.label}
              label={t('UpPercentage', { context: d.rarityContext })}
              value={d.up.percentage}
              tooltip={d.up.percentage > 0 && `${d.up.sum} / ${d.total} ≈ ${d.up.percentage} %`}
              suffix={<i className={styles.labelPercentage}>%</i>}
              numeric
            />
          </div>
        )}
        {d.showcase && (
          <div className={styles.labelsGroup}>
            <StatLabel
              className={styles.label}
              label={t('Last', { context: d.rarityContext })}
              value={d.showcase.itemName}
              suffix={d.showcase.usedPity && (
                <span className={styles.labelLast}>
                  {`(${d.showcase.usedPity.value})`}
                </span>
              )}
            />
          </div>
        )}
      </div>
      <div className={styles.showcase}>
        {d.showcase && (
          <GachaImageItem
            keyof={business.keyof}
            rarity={d.rarityContext}
            record={d.showcase}
            noUpBadge={!d.up}
            tooltipPositioning="before"
          />
        )}
      </div>
    </div>
  )
})

function GroupLabel (props: BadgeProps) {
  const {
    appearance = 'filled',
    color = 'informative',
    size = 'large',
    children,
    ...rest
  } = props

  return (
    <Badge
      appearance={appearance}
      color={color}
      size={size}
      {...rest}
    >
      {children}
    </Badge>
  )
}

const useStatLabelStyles = makeStyles({
  tooltip: {
    whiteSpace: 'pre-wrap',
  },
  value: {
    display: 'inline-block',
    position: 'relative',
    zIndex: 1,
    color: tokens.colorBrandForeground1,
    userSelect: 'none',
    cursor: 'default',
  },
  valueInteractive: {
    textDecoration: 'underline dashed',
    textDecorationColor: tokens.colorBrandStroke1,
    textDecorationThickness: '1px',
    textUnderlineOffset: '0.25rem',
    cursor: 'help',
  },
  numeric: {
    fontFamily: tokens.fontFamilyMonospace,
  },
})

interface StatLabelProps {
  className?: string
  label: ReactNode
  value: ReactNode
  tooltip?: ReactNode
  suffix?: ReactNode
  numeric?: boolean
}

function StatLabel (props: StatLabelProps) {
  const { className, label, value, suffix, tooltip, numeric } = props
  const styles = useStatLabelStyles()

  const valueNode = (
    <div
      className={mergeClasses(
        styles.value,
        !!tooltip && styles.valueInteractive,
        numeric && styles.numeric,
      )}
    >
      {value}
    </div>
  )

  return (
    <GroupLabel className={className}>
      {label}
      {tooltip
        ? (
            <Tooltip
              content={{
                children: tooltip,
                className: mergeClasses(
                  styles.tooltip,
                  numeric && styles.numeric,
                ),
              }}
              relationship="description"
              positioning="above"
              withArrow
            >
              {valueNode}
            </Tooltip>
          )
        : valueNode}
      {suffix}
    </GroupLabel>
  )
}

const useStatLabelTicketStyles = makeStyles({
  root: {
    padding: tokens.spacingVerticalXXS,
    width: 'inherit',
    height: 'inherit',
    verticalAlign: 'bottom',
  },
  rootZenlessZoneZero: {
    padding: tokens.spacingVerticalXS,
    marginLeft: tokens.spacingHorizontalXXS,
  },
})

interface StatLabelTicketProps {
  keyof: KeyofAccountBusiness
  category: BannerCategory
}

function StatLabelTicket (props: StatLabelTicketProps) {
  const { keyof, category } = props
  const styles = useStatLabelTicketStyles()

  return (
    <GachaTicket
      className={mergeClasses(
        styles.root,
        keyof === KeyofZenlessZoneZero && styles.rootZenlessZoneZero,
      )}
      keyof={keyof}
      category={category}
    />
  )
}
