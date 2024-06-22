import React from 'react'
import { Text, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { ErrorCircleRegular } from '@fluentui/react-icons'
import { useAccountsQuery } from '@/api/queries/account'
import useAccountBusiness from '@/components/AccountBusiness/useAccountBusiness'
import Locale from '@/components/Core/Locale'
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
  const { business } = useAccountBusiness()
  const { data: accounts } = useAccountsQuery()
  const classes = useStyles()

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
            mapping={['components.accounts.businessView.list.empty']}
          />
        </div>
      )}
    </div>
  )
}
