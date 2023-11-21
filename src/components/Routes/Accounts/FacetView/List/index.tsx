import React from 'react'
import { Text, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { AccountFacetsEntry } from '@/api/interfaces/account'
import { useAccountsQuery } from '@/api/queries/account'
import AccountsFacetViewListItem from './ListItem'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingVerticalMNudge, tokens.spacingHorizontalMNudge),
    ...shorthands.padding(tokens.spacingVerticalMNudge, tokens.spacingHorizontalMNudge)
  }
})

export default function AccountsFacetViewList ({ facetEntry }: { facetEntry: AccountFacetsEntry }) {
  const { data: accounts } = useAccountsQuery()
  const classes = useStyles()

  if (!accounts) return null
  const accountsOfFacet = accounts.filter((account) => account.facet === facetEntry.value)
  const hasItem = accountsOfFacet.length > 0

  return (
    <div className={classes.root}>
      {accountsOfFacet.map((account) => (
        <AccountsFacetViewListItem key={account.id} facetEntry={facetEntry} account={account} />
      ))}
      {!hasItem && <Text size={200}>Empty</Text>}
    </div>
  )
}
