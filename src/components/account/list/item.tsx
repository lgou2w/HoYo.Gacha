import React from 'react'
import Stack from '@mui/material/Stack'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Avatar from '@/components/common/avatar'
import { Account, SettingsFn } from '@/interfaces/settings'

export interface AccountListItemProps {
  className?: string
  account: Account
  selected: boolean
  selectAccount: SettingsFn['selectAccount']
  onPreEdit?: React.MouseEventHandler<HTMLButtonElement>
  onPreRemove?: React.MouseEventHandler<HTMLButtonElement>
}

export default function AccountListItem (props: AccountListItemProps) {
  const { className, ...rest } = props
  return (
    <ListItem
      className={className}
      secondaryAction={<AccountListItemAction {...rest} />}
      disablePadding
    >
      <AccountListItemContent {...rest} />
    </ListItem>
  )
}

function AccountListItemAction (props: AccountListItemProps) {
  const { account, onPreEdit, onPreRemove } = props
  return (
    <Stack flexDirection="row" gap={1}>
      <IconButton size="small" color="default" value={account.uid} onClick={onPreEdit}>
        <EditIcon />
      </IconButton>
      <IconButton size="small" color="error" value={account.uid} onClick={onPreRemove}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  )
}

function AccountListItemContent (props: AccountListItemProps) {
  const { account, selected, selectAccount } = props
  return (
    <ListItemButton onClick={() => selectAccount(account.uid)} selected={selected}>
      <ListItemAvatar>
        <Avatar />
      </ListItemAvatar>
      <ListItemText
        primary={account.displayName || '旅行者'}
        primaryTypographyProps={{ noWrap: true, color: selected ? 'primary' : 'default' }}
        secondary={account.uid}
        secondaryTypographyProps={{ color: selected ? 'primary' : 'default' }}
        sx={{ maxWidth: 120 }}
      />
      <Typography component="div" width={400} variant="caption" color="grey.600" noWrap>
        {account.gameDataDir}
      </Typography>
    </ListItemButton>
  )
}
