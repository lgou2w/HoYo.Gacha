import React from 'react'
import Stack from '@mui/material/Stack'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import AccountAvatar from '@/components/account/avatar'
import { Account, SettingsFn } from '@/interfaces/settings'
import { getNameCardUrl } from '@/interfaces/enka-network'

export interface AccountListItemProps {
  account: Account
  selected: boolean
  selectAccount: SettingsFn['selectAccount']
  onPreRemove?: React.MouseEventHandler<HTMLButtonElement>
  showNameCard?: boolean
}

export default function AccountListItem (props: AccountListItemProps) {
  const nameCardUrl = props.showNameCard &&
    props.account.nameCardId &&
    getNameCardUrl(props.account.nameCardId)

  return (
    <ListItem
      secondaryAction={<AccountListItemAction {...props} />}
      data-name-card={nameCardUrl ? 'true' : undefined}
      data-name-card-id={props.account.nameCardId}
      sx={nameCardUrl ? { backgroundImage: `url(${nameCardUrl})` } : undefined}
    >
      <AccountListItemContent {...props} />
    </ListItem>
  )
}

function AccountListItemAction (props: AccountListItemProps) {
  const { account, onPreRemove } = props
  return (
    <Stack flexDirection="row" gap={1}>
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
          <Typography component="span" marginLeft={0.5} color="inherit">
            {account.displayName || '旅行者'}
          </Typography>
        </>}
        primaryTypographyProps={{ component: 'div', noWrap: true, color: selected ? 'primary' : 'default' }}
        secondary={account.uid}
        secondaryTypographyProps={{ color: selected ? 'primary' : 'default' }}
        sx={{ maxWidth: 180 }}
      />
      <Typography component="div" maxWidth={400} variant="body2" color="grey.600" noWrap>
        {account.signature}
      </Typography>
    </ListItemButton>
  )
}
