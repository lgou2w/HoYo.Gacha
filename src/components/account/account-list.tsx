import React, { useCallback, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ConfirmDialog from '@/components/common/confirm-dialog'
import Avatar from '@/components/common/avatar'
import { Account } from '@/interfaces/settings'
import { useStatefulSettings } from '@/hooks/useStatefulSettings'

export default function AccountList () {
  const { accounts, removeAccount } = useStatefulSettings()
  const accountRef = useRef<Account>()
  const [removeDialog, setRemoveDialog] = useState(false)

  const handlePreEdit = useCallback<React.MouseEventHandler<HTMLButtonElement>>((event) => {
    event.preventDefault()
    const uid = Number(event.currentTarget.value)
    accountRef.current = accounts[uid]
    // TODO: Account Edit
  }, [accounts, accountRef])

  const handlePreRemove = useCallback<React.MouseEventHandler<HTMLButtonElement>>((event) => {
    event.preventDefault()
    const uid = Number(event.currentTarget.value)
    accountRef.current = accounts[uid]
    setRemoveDialog(true)
  }, [accounts, accountRef, setRemoveDialog])

  const handleCancelRemove = useCallback(() => { setRemoveDialog(false) }, [setRemoveDialog])
  const handleConfirmRemove = useCallback(() => {
    if (accountRef.current) {
      removeAccount(accountRef.current.uid)
      setRemoveDialog(false)
    }
  }, [accountRef, removeAccount, setRemoveDialog])

  return (
    <List className="account-list" sx={{
      '& .account-list-item': {
        borderBottom: 1,
        borderColor: (theme) => theme.palette.divider,
        '&:first-of-type': {
          borderTop: 1,
          borderColor: (theme) => theme.palette.divider
        },
        '& > .MuiButtonBase-root': {
          paddingRight: 10
        }
      }
    }} disablePadding>
      {Object.values(accounts).map((account) => (
        <AccountListItem key={account.uid} account={account}
          onPreEdit={handlePreEdit} onPreRemove={handlePreRemove} />
      ))}
      <ConfirmDialog open={removeDialog} title="确认"
        onCancel={handleCancelRemove}
        onCofirm={handleConfirmRemove}
        ConfirmButtonProps={{ color: 'error' }}
      >
        <Typography>
          删除该账号：
          <Typography color="red" variant="button">{accountRef?.current?.uid}</Typography>
        </Typography>
        <Typography variant="subtitle2">包括该账号已有的数据！</Typography>
      </ConfirmDialog>
    </List>
  )
}

interface AccountListItemProps {
  account: Account
  onPreEdit?: React.MouseEventHandler<HTMLButtonElement>
  onPreRemove?: React.MouseEventHandler<HTMLButtonElement>
}

function AccountListItem (props: AccountListItemProps) {
  const { selectedAccount, selectAccount } = useStatefulSettings()
  const isSelected = useMemo(() => props.account.uid === selectedAccount?.uid, [props, selectedAccount])

  return (
    <ListItem className="account-list-item" secondaryAction={
      <Box paddingRight={1}>
        {
          // TODO: feat: Account edit
          false && <IconButton size="small" value={props.account.uid} onClick={props.onPreEdit}>
            <EditIcon />
          </IconButton>
        }
        <IconButton size="small" color="error" value={props.account.uid} onClick={props.onPreRemove}>
          <DeleteIcon />
        </IconButton>
      </Box>
    } disablePadding>
      <ListItemButton onClick={() => selectAccount(props.account.uid)} selected={isSelected} sx={{ paddingX: 1 }}>
        <ListItemAvatar>
          <Avatar />
        </ListItemAvatar>
        <ListItemText
          primary={props.account.displayName || '旅行者'}
          primaryTypographyProps={{ noWrap: true, color: isSelected ? 'primary' : 'default' }}
          secondary={props.account.uid}
          secondaryTypographyProps={{ color: isSelected ? 'primary' : 'default' }}
          sx={{ maxWidth: 100 }}
        />
        <Typography component="div" width={400} variant="caption" color="grey.600" noWrap>
          {props.account.gameDataDir}
        </Typography>
      </ListItemButton>
    </ListItem>
  )
}
