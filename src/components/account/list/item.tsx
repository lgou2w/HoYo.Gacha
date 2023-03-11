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
import AccountAvatar from '@/components/account/avatar'
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
        <AccountAvatar avatarId={account.avatarId || undefined} />
      </ListItemAvatar>

      <ListItemText
        primary={<>
          {/* TODO: optimize */}
          {/* {account.level && <Typography component="span">Lv.{account.level}·</Typography>} */}
          <Typography component="span" bgcolor={selected ? 'primary.light' : 'success.light'} color="white" borderRadius={4} paddingX={1}>
            <Typography variant="caption">Lv.{account.level}</Typography>
          </Typography>
          <Typography component="span" marginLeft={0.5}>{account.displayName || '旅行者'}</Typography>
        </>}
        primaryTypographyProps={{ component: 'div', noWrap: true, color: selected ? 'primary' : 'default' }}
        secondary={account.uid}
        secondaryTypographyProps={{ color: selected ? 'primary' : 'default' }}
        sx={{ maxWidth: 200 }}
      />
      <Typography component="div" width={500} variant="caption" color="grey.600" noWrap>
        {account.gameDataDir}
      </Typography>
    </ListItemButton>
  )
}
