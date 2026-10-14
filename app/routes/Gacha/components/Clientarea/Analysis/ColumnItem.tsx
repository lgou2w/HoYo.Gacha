import { memo, useMemo } from 'react'
import { Divider, Subtitle2, Title1, makeStyles, tokens } from '@fluentui/react-components'
import { AccountBusiness } from '@/api/Account'
import { KnownI18nNs, useI18n } from '@/i18n'
import { BannerStats } from '@/routes/Gacha/api/stats'
import BannerCategoryName from '@/routes/Gacha/components/Banner/CategoryName'
import BannerDragIcon from '@/routes/Gacha/components/Banner/DragIcon'
import GachaTicket from '@/routes/Gacha/components/Ticket'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import ColumnItemLabels from './Labels'
import { deriveColumnItem } from './types'

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    height: '100%',
    rowGap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
  },
  dragIcon: {
    position: 'absolute',
    top: tokens.spacingVerticalL,
    right: tokens.spacingHorizontalL,
    cursor: 'pointer',
  },
  header: {
    display: 'inline-flex',
    flexDirection: 'column',
  },
  headerTitle: {
    display: 'inline-flex',
    alignItems: 'end',
  },
  headerTotal: {
    fontFamily: tokens.fontFamilyNumeric,
  },
  headerPull: {
    marginLeft: tokens.spacingHorizontalXS,
  },
  headerTicket: {
    width: tokens.fontSizeBase600,
    height: 'auto',
    aspectRatio: 1,
    marginLeft: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXS,
  },
  divider: {
    display: 'inline-flex',
    flexGrow: 0,
  },
  records: {},
})

export interface AnalysisColumnItemProps {
  dataset: BannerStats<AccountBusiness>
  dragRef?: (el: Element | null) => void
}

export default memo(function AnalysisColumnItem (props: AnalysisColumnItemProps) {
  const { dataset, dragRef } = props
  const styles = useStyles()

  const { dayjs, t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Clientarea.Analysis.ColumnItem' })
  const business = useBusiness()
  const d = useMemo(
    () => deriveColumnItem(dataset, dayjs),
    [dataset, dayjs],
  )

  return (
    <div className={styles.root}>
      {dragRef && (
        <BannerDragIcon
          className={styles.dragIcon}
          dragRef={dragRef}
        />
      )}
      <div className={styles.header}>
        <Subtitle2 wrap={false} truncate>
          <BannerCategoryName
            category={d.category}
            context="title"
          />
        </Subtitle2>
        <div className={styles.headerTitle}>
          <Title1 className={styles.headerTotal}>
            {t('Total', { count: d.total })}
          </Title1>
          {d.isPermanentOde || d.isEventOde
            ? <span className={styles.headerPull}>{t('Pull')}</span>
            : (
                <GachaTicket
                  className={styles.headerTicket}
                  keyof={business.keyof}
                  category={d.category}
                />
              )}
        </div>
      </div>
      <Divider className={styles.divider}>{d.timeRange || 'N/A'}</Divider>
      <ColumnItemLabels dataset={dataset} derived={d} />
      <Divider className={styles.divider} />
      <div className={styles.records}>
        Records
      </div>
    </div>
  )
})
