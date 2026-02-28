import { Caption1, makeStyles, tokens } from '@fluentui/react-components'
import { WithTrans, withTrans } from '@/i18n'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
  },
  content: {
    color: tokens.colorNeutralForeground3,
  },
})

export default withTrans.SettingsPage(function Mihoyo ({ t }: WithTrans) {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <Caption1 className={styles.content} as="p" align="center" block>
        {t('Mihoyo.License')}
      </Caption1>
    </div>
  )
})
