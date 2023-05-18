import React from 'react'
import { Account, resolveAccountDisplayName } from '@/interfaces/account'
import { useSetSelectedAccountFn } from '@/hooks/useStatefulAccount'
import AccountAvatar from '@/components/account/AccountAvatar'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import PersonAddIcon from '@mui/icons-material/PersonAddRounded'
import EditIcon from '@mui/icons-material/EditRounded'

export interface AccountMenuDrawerProps {
  title: React.ReactNode
  open: boolean
  accounts: Record<Account['uid'], Account>
  selectedAccountUid: Account['uid'] | null
  onClose?: () => void
  onClickAddAccount?: IconButtonProps['onClick']
  onClickEditAccount?: IconButtonProps['onClick']
}

export default function AccountMenuDrawer (props: AccountMenuDrawerProps) {
  const { title, open, accounts, selectedAccountUid, onClose, onClickAddAccount, onClickEditAccount } = props
  const setSelectedAccount = useSetSelectedAccountFn()
  const handleSelect = React.useCallback<React.MouseEventHandler<HTMLButtonElement>>((evt) => {
    const uid = evt.currentTarget.value
    if (selectedAccountUid !== uid) {
      setSelectedAccount(uid)
    }
    onClose?.()
  }, [selectedAccountUid, onClose, setSelectedAccount])

  return (
    <Drawer open={open} anchor="right" variant="temporary" onClose={onClose}>
      <Box width={220}>
        <Toolbar sx={{ paddingX: 2 }} disableGutters>
          <Typography flexGrow={1}>{title}</Typography>
          <Tooltip title="添加账号" arrow>
            <IconButton onClick={onClickAddAccount}>
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Divider />
        <List dense disablePadding>
          {Object.values(accounts).map((account) => (
            <ListItem key={account.uid} divider disablePadding secondaryAction={
              <IconButton value={account.uid} onClick={onClickEditAccount}>
                <EditIcon fontSize="small" />
              </IconButton>
            }>
              <ListItemButton
                component="button"
                selected={selectedAccountUid === account.uid}
                value={account.uid}
                onClick={handleSelect}
              >
                <ListItemAvatar>
                  <AccountAvatar facet={account.facet} />
                </ListItemAvatar>
                <ListItemText
                  primary={resolveAccountDisplayName(account.facet, account)}
                  primaryTypographyProps={{ color: selectedAccountUid === account.uid ? 'primary' : 'inherit' }}
                  secondary={account.uid}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  )
}
