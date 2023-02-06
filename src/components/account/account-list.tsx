import React, { useMemo } from 'react'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MoodIcon from '@mui/icons-material/Mood'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { Account } from '../../interfaces/models'
import { useStatefulAccounts } from '../../hooks/accounts'

export default function AccountList () {
  const { accounts } = useStatefulAccounts()
  return (
    <List>
      {Object.keys(accounts).map((key) => (
        <AccountListItem key={key} account={accounts[key as unknown as keyof typeof accounts]} />
      ))}
    </List>
  )
}

function AccountListItem ({ account }: { account: Account }) {
  const { selected, selectAccount } = useStatefulAccounts()
  const isSelected = useMemo(() => account.uid === selected?.uid, [account, selected])

  return (
    <ListItem disableGutters disablePadding sx={{
      borderBottom: 1,
      borderColor: (theme) => theme.palette.divider,
      '&:first-of-type': {
        borderTop: 1,
        borderColor: (theme) => theme.palette.divider
      },
      '& > .MuiButtonBase-root': {
        paddingRight: 10
      }
    }} secondaryAction={
      <Box paddingRight={1}>
        <IconButton size="small">
          <EditIcon />
        </IconButton>
        <IconButton size="small" color="error">
          <DeleteIcon />
        </IconButton>
      </Box>
    }>
      <ListItemButton onClick={() => selectAccount(account.uid)} selected={isSelected} sx={{ paddingX: 1 }}>
        <ListItemAvatar>
          <Avatar>
            <MoodIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={account.displayName || '旅行者'}
          primaryTypographyProps={{ noWrap: true, color: isSelected ? 'primary' : 'default' }}
          secondary={account.uid}
          secondaryTypographyProps={{ color: isSelected ? 'primary' : 'default' }}
          sx={{ maxWidth: 100 }}
        />
        <Typography component="div" width={400} variant="caption" color="grey.600" noWrap>
          {account.gameDataDir}
        </Typography>
      </ListItemButton>
    </ListItem>
  )
}
