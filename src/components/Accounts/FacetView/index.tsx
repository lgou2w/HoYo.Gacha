import React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { AccountFacet, AccountFacets } from '@/api/interfaces/account'
import { AccountsFacetViewContext } from './Context'
import AccountsFacetViewList from './List'
import AccountsFacetViewToolbar from './Toolbar'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalMNudge
  }
})

export default function AccountsFacetView ({ keyOfFacets, facet }: {
  keyOfFacets: keyof typeof AccountFacets
  facet: AccountFacet
}) {
  const classes = useStyles()
  return (
    <section className={classes.root}>
      <AccountsFacetViewContext.Provider value={{ keyOfFacets, facet }}>
        <AccountsFacetViewToolbar />
        <AccountsFacetViewList />
      </AccountsFacetViewContext.Provider>
    </section>
  )
}
