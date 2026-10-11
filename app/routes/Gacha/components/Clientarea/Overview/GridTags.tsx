import { memo } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { AggregatedStats } from '@/routes/Gacha/api/stats'

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
})

export interface OverviewGridTagsProps {
  dataset: AggregatedStats
}

export default memo(function OverviewGridTags (props: OverviewGridTagsProps) {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      Tags
    </div>
  )
})
