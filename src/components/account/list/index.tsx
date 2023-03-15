import React, { useCallback, useRef, useState } from 'react'
import List from '@mui/material/List'
import Alert from '@mui/material/Alert'
import AccountListItem, { AccountListItemProps } from './item'
import AccountListRemoveDialog, { AccountListRemoveDialogProps } from './remove-dialog'
import { Account } from '@/interfaces/settings'
import useStatefulSettings from '@/hooks/useStatefulSettings'
import Commands from '@/utilities/commands'

export default function AccountList () {
  const { accounts, selectedAccount, enkaNetwork, selectAccount, updateAccount, removeAccount } = useStatefulSettings()
  const [removeDialog, setRemoveDialog] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const accountRef = useRef<Account>()
  const listRef = React.createRef<HTMLUListElement>()

  const handlePreRefresh = useCallback<Required<AccountListItemProps>['onPreRefresh']>((event) => {
    if (!listRef.current) return
    if (!enkaNetwork) return
    const list = listRef.current
    list.style.pointerEvents = 'none'
    list.style.opacity = '0.5'
    const uid = Number(event.currentTarget.value)
    Commands.thirdPartyEnkaNetworkFetchPlayerInfo({ uid })
      .then((playerInfo) => updateAccount(uid, {
        level: playerInfo.level,
        avatarId: playerInfo.profilePicture.avatarId,
        displayName: playerInfo.nickname,
        signature: playerInfo.signature,
        nameCardId: playerInfo.nameCardId
      }))
      .catch((error) => { setError(error) })
      .finally(() => {
        list.style.pointerEvents = 'auto'
        list.style.opacity = '1'
      })
  }, [listRef, updateAccount, setError, enkaNetwork])

  const handlePreRemove = useCallback<Required<AccountListItemProps>['onPreRemove']>((event) => {
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
    <>
      {error && <Alert severity="error" onClose={() => setError(undefined)}>{error}</Alert>}
      <List component="ul" ref={listRef} disablePadding>
        {Object.values(accounts).map((account) => (
          <AccountListItem
            key={account.uid}
            account={account}
            selected={selectedAccount?.uid === account.uid}
            onSelect={() => selectAccount(account.uid)}
            onPreRefresh={handlePreRefresh}
            onPreRemove={handlePreRemove}
            enkaNetwork={enkaNetwork}
          />
        ))}
        <AccountListRemoveDialog
          open={removeDialog}
          accountRef={accountRef}
          onCancel={() => setRemoveDialog(false)}
          onConfirm={handleConfirmRemove}
        />
      </List>
    </>
  )
}
