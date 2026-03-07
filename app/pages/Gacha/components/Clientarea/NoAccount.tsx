import { ComponentRef, useRef } from 'react'
import { Button, Title2, makeStyles, tokens } from '@fluentui/react-components'
import { PersonWarningRegular } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'
import UpsertAccountDialog from '@/pages/Gacha/components/UpsertAccount/Dialog'
import { useBusiness } from '@/pages/Gacha/contexts/Business'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    rowGap: tokens.spacingVerticalL,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: tokens.spacingVerticalL,
  },
  icon: {
    fontSize: tokens.fontSizeHero900,
  },
})

export default withTrans.GachaPage(function NoAccount ({ t }: WithTrans) {
  const styles = useStyles()
  const business = useBusiness()
  const createAccountDialogRef = useRef<ComponentRef<typeof UpsertAccountDialog>>(null)

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <PersonWarningRegular className={styles.icon} />
        <Title2>{t('Clientarea.NoAccount.Title')}</Title2>
      </div>
      <div>
        <Button
          onClick={() => createAccountDialogRef.current?.open(null)}
          appearance="primary"
          size="large"
        >
          {t('Clientarea.NoAccount.Create')}
        </Button>
        <UpsertAccountDialog
          ref={createAccountDialogRef}
          business={business.value}
          accounts={[]}
        />
      </div>
    </div>
  )
})
