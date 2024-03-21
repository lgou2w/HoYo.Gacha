import React from 'react'
import { Text, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { useAccountsQuery } from '@/api/queries/account'
import useAccountFacet from '@/components/AccountFacet/useAccountFacet'
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

export default function AccountsFacetViewList () {
  const { facet } = useAccountFacet()
  const { data: accounts } = useAccountsQuery()
  const classes = useStyles()

  if (!accounts) return null
  const accountsOfFacet = accounts.filter((account) => account.facet === facet)
  const hasItem = accountsOfFacet.length > 0

  return (
    <div className={classes.root}>
      {accountsOfFacet.map((account) => (
        <AccountsFacetViewListItem key={account.id} account={account} />
      ))}
      {!hasItem && <Text size={200}>Empty</Text>}
    </div>
  )
}
