import React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { AccountFacetsEntry } from '@/api/interfaces/account'
import AccountsFacetViewList from './List'
import AccountsFacetViewToolbar from './Toolbar'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalMNudge
  }
})

export default function AccountsFacetView ({ facetEntry }: { facetEntry: AccountFacetsEntry }) {
  const classes = useStyles()
  return (
    <section className={classes.root}>
      <AccountsFacetViewToolbar facetEntry={facetEntry} />
      <AccountsFacetViewList facetEntry={facetEntry} />
    </section>
  )
}
