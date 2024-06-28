import React from 'react'
import { Text, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { ErrorCircleRegular } from '@fluentui/react-icons'
import { useAccountsQuery } from '@/api/queries/account'
import useBusiness from '@/components/BusinessProvider/useBusiness'
import Locale from '@/components/Commons/Locale'
import AccountsBusinessViewListItem from './ListItem'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: `${tokens.spacingVerticalMNudge} ${tokens.spacingHorizontalMNudge}`,
    ...shorthands.padding(tokens.spacingVerticalMNudge, tokens.spacingHorizontalMNudge)
  },
  emptyList: {
    display: 'flex',
    alignItems: 'center',
    fontSize: tokens.fontSizeBase300,
    columnGap: tokens.spacingHorizontalXS,
    '> svg': {
      fontSize: tokens.fontSizeBase400,
      width: tokens.fontSizeBase400,
      height: tokens.fontSizeBase400
    }
  }
})

export default function AccountsBusinessViewList () {
  const classes = useStyles()
  const { business } = useBusiness()
  const { data: accounts } = useAccountsQuery()

  if (!accounts) return null
  const accountsOfBusiness = accounts.filter((account) => account.business === business)
  const hasItem = accountsOfBusiness.length > 0

  return (
    <div className={classes.root}>
      {accountsOfBusiness.map((account) => (
        <AccountsBusinessViewListItem key={account.id} account={account} />
      ))}
      {!hasItem && (
        <div className={classes.emptyList}>
          <ErrorCircleRegular />
          <Locale
            component={Text}
            as="span"
            mapping={['Pages.Accounts.BusinessView.List.Empty']}
          />
        </div>
      )}
    </div>
  )
}
