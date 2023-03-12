import React, { useCallback, useRef, useState } from 'react'
import { SxProps, Theme } from '@mui/material/styles'
import List from '@mui/material/List'
import AccountListItem, { AccountListItemProps } from './item'
import AccountListRemoveDialog, { AccountListRemoveDialogProps } from './remove-dialog'
import { Account } from '@/interfaces/settings'
import useStatefulSettings from '@/hooks/useStatefulSettings'

export default function AccountList () {
  const { accounts, selectedAccount, selectAccount, removeAccount } = useStatefulSettings()
  const [removeDialog, setRemoveDialog] = useState(false)
  const accountRef = useRef<Account>()

  const handlePreRemove = useCallback<Required<AccountListItemProps>['onPreRemove']>((event) => {
    event.preventDefault()
    const uid = Number(event.currentTarget.value)
    accountRef.current = accounts[uid]
    setRemoveDialog(true)
  }, [accounts, accountRef, setRemoveDialog])

  const handleConfirmRemove = useCallback<Required<AccountListRemoveDialogProps>['onConfirm']>(() => {
    if (accountRef.current) {
      removeAccount(accountRef.current.uid)
      setRemoveDialog(false)
    }
  }, [accountRef, removeAccount, setRemoveDialog])

  return (
    <List className={AccountListCls} sx={AccountListSx} disablePadding>
      {Object.values(accounts).map((account) => (
        <AccountListItem
          key={account.uid}
          account={account}
          selected={selectedAccount?.uid === account.uid}
          selectAccount={selectAccount}
          onPreRemove={handlePreRemove}
          showNameCard
        />
      ))}
      <AccountListRemoveDialog
        open={removeDialog}
        accountRef={accountRef}
        onCancel={() => setRemoveDialog(false)}
        onConfirm={handleConfirmRemove}
      />
    </List>
  )
}

const AccountListCls = 'account-list'
const AccountListSx: SxProps<Theme> = {
  '& .MuiListItem-root': {
    padding: 0,
    bgcolor: 'grey.100',
    marginBottom: 1,
    borderTopRightRadius: 99,
    borderBottomRightRadius: 99,
    '& >:first-of-type': {
      borderTopRightRadius: 99,
      borderBottomRightRadius: 99
    },
    '&[data-name-card="true"]': {
      backgroundSize: 'contain',
      backgroundPosition: 'right',
      backgroundRepeat: 'no-repeat'
    }
  }
}
