import { Button, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowDownloadRegular, ArrowUploadRegular } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'
import ToolbarContainer from './Container'

const useStyles = makeStyles({
  wrapper: {
    display: 'inline-flex',
    justifyContent: 'space-between',
    flex: '1 0 auto',
    columnGap: tokens.spacingHorizontalXS,
  },
})

export default withTrans.GachaPage(function Converters ({ t }: WithTrans) {
  const styles = useStyles()

  return (
    <ToolbarContainer
      label={t('Toolbar.Converters.Label')}
      labelCenter
    >
      <div className={styles.wrapper}>
        <Button appearance="subtle" shape="circular" size="large" icon={<ArrowDownloadRegular />} />
        <Button appearance="subtle" shape="circular" size="large" icon={<ArrowUploadRegular />} />
      </div>
    </ToolbarContainer>
  )
})
