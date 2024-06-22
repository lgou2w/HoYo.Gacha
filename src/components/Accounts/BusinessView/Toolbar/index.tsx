import React from 'react'
import { Button, Subtitle2, Tooltip, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { PeopleAddRegular, PeopleListRegular } from '@fluentui/react-icons'
import useAccountBusiness from '@/components/AccountBusiness/useAccountBusiness'
import AddOrEditDialog from '@/components/Accounts/BusinessView/AddOrEditDialog'
import Locale from '@/components/Core/Locale'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingVerticalS,
    boxShadow: tokens.shadow4,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM)
  },
  icon: {
    display: 'inline-flex',
    fontSize: tokens.fontSizeBase500,
    width: tokens.fontSizeBase500,
    height: tokens.fontSizeBase500
  },
  header: {
    display: 'inline-flex',
    flexGrow: 1
  },
  action: {
    display: 'inline-flex',
    '> .fui-Button': {
      minWidth: '2rem',
      maxWidth: '2rem',
      ...shorthands.padding('0.3125rem'),
      '> .fui-Button__icon': {
        fontSize: tokens.fontSizeBase500,
        width: tokens.fontSizeBase500,
        height: tokens.fontSizeBase500
      }
    }
  }
})

export default function AccountsBusinessViewToolbar () {
  const { keyOfBusinesses } = useAccountBusiness()
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <div className={classes.icon}>
        <PeopleListRegular />
      </div>
      <Locale
        className={classes.header}
        component={Subtitle2}
        as="h6"
        mapping={[
          'components.accounts.businessView.toolbar.title',
          { business: keyOfBusinesses }
        ]}
      />
      <div className={classes.action}>
        <AddOrEditDialog
          edit={null}
          trigger={(
            <Tooltip
              relationship="label"
              positioning="before"
              content={<Locale mapping={['components.accounts.businessView.toolbar.addAccountBtn']} />}
              withArrow
            >
              <Button appearance="subtle" icon={<PeopleAddRegular />} />
            </Tooltip>
          )}
        />
      </div>
    </div>
  )
}
