import { memo, useMemo } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { AccountBusiness } from '@/api/Account'
import { KnownI18nNs, useI18n } from '@/i18n'
import { BannerStats } from '@/routes/Gacha/api/stats'
import BannerCategoryName from '@/routes/Gacha/components/Banner/CategoryName'
import BannerDragIcon from '@/routes/Gacha/components/Banner/DragIcon'
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
    top: '0.5rem',
    right: '0.5rem',
  },
})

export interface AnalysisColumnItemProps {
  dataset: BannerStats<AccountBusiness>
  dragRef?: (el: Element | null) => void
}

export default memo(function AnalysisColumnItem (props: AnalysisColumnItemProps) {
  const { dataset, dragRef } = props
  const styles = useStyles()

  const { dayjs, t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Clientarea.Analysis.ColumnItem' })
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
      <div>
        <BannerCategoryName category={d.category} context="title" />
      </div>
      <div>{d.timeRange}</div>
      <div>{`Total: ${d.total}`}</div>
    </div>
  )
})
