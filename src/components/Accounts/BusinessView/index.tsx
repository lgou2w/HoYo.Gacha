import React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import BusinessProvider, { BusinessContextState } from '@/components/BusinessProvider'
import AccountsBusinessViewList from './List'
import AccountsBusinessViewToolbar from './Toolbar'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalMNudge
  }
})

export default function AccountsBusinessView (props: BusinessContextState) {
  const { keyOfBusinesses, business } = props
  const classes = useStyles()
  return (
    <section className={classes.root}>
      <BusinessProvider keyOfBusinesses={keyOfBusinesses} business={business}>
        <AccountsBusinessViewToolbar />
        <AccountsBusinessViewList />
      </BusinessProvider>
    </section>
  )
}
