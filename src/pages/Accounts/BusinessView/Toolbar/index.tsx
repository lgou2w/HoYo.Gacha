import React from 'react'
import { Button, Subtitle2, Tooltip, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { PeopleAddRegular, PeopleListRegular } from '@fluentui/react-icons'
import useBusiness from '@/components/BusinessProvider/useBusiness'
import Locale from '@/components/Commons/Locale'
import AddOrEditDialog from '@/pages/Accounts/BusinessView/AddOrEditDialog'

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
  const classes = useStyles()
  const { keyofBusinesses } = useBusiness()

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
          'Pages.Accounts.BusinessView.Toolbar.Title',
          { business: keyofBusinesses }
        ]}
      />
      <div className={classes.action}>
        <AddOrEditDialog
          edit={null}
          trigger={(
            <Tooltip
              relationship="label"
              positioning="before"
              content={<Locale mapping={['Pages.Accounts.BusinessView.Toolbar.AddAccountBtn']} />}
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
