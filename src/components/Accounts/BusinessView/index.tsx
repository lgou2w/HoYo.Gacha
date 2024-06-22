import React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import AccountBusiness, { AccountBusinessContextState } from '@/components/AccountBusiness'
import AccountsBusinessViewList from './List'
import AccountsBusinessViewToolbar from './Toolbar'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalMNudge
  }
})

export default function AccountsBusinessView (props: AccountBusinessContextState) {
  const { keyOfBusinesses, business } = props
  const classes = useStyles()
  return (
    <section className={classes.root}>
      <AccountBusiness keyOfBusinesses={keyOfBusinesses} business={business}>
        <AccountsBusinessViewToolbar />
        <AccountsBusinessViewList />
      </AccountBusiness>
    </section>
  )
}
