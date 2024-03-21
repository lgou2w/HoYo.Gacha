import React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import AccountFacet, { AccountFacetContextState } from '@/components/AccountFacet'
import AccountsFacetViewList from './List'
import AccountsFacetViewToolbar from './Toolbar'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalMNudge
  }
})

export default function AccountsFacetView (props: AccountFacetContextState) {
  const { keyOfFacets, facet } = props
  const classes = useStyles()
  return (
    <section className={classes.root}>
      <AccountFacet keyOfFacets={keyOfFacets} facet={facet}>
        <AccountsFacetViewToolbar />
        <AccountsFacetViewList />
      </AccountFacet>
    </section>
  )
}
