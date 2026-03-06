import { Link, MessageBar, MessageBarBody, MessageBarTitle, makeStyles } from '@fluentui/react-components'
import AppCommands from '@/api/commands/app'
import { WithTrans, withTrans } from '@/i18n'

const useStyles = makeStyles({
  root: {},
})

export default withTrans.HomePage(function Database ({ t }: WithTrans) {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <MessageBar intent="warning">
        <MessageBarBody>
          <MessageBarTitle>
            {t('Database.Title')}
          </MessageBarTitle>
          {t('Database.Subtitle')}
          &nbsp;
          <Link as="button" onClick={() => AppCommands.openDatabaseFolder()}>
            {t('Database.Open')}
          </Link>
        </MessageBarBody>
      </MessageBar>
    </div>
  )
})
