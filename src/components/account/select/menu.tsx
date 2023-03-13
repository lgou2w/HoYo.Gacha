import React, { useCallback } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Menu, { MenuProps } from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { Account, Accounts, SettingsFn } from '@/interfaces/settings'

export interface AccountSelectMenuProps extends Pick<
  MenuProps,
  'open' |
  'anchorEl'
> {
  onClose?: React.MouseEventHandler<HTMLElement>
  accounts: Accounts
  selectedAccount: Account | null
  selectAccount: SettingsFn['selectAccount']
}

export default function AccountSelectMenu (props: AccountSelectMenuProps) {
  const { open, anchorEl, onClose, accounts } = props
  return (
    <Menu open={open} onClose={onClose} anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      MenuListProps={{ sx: { maxWidth: 120 } }}
    >
      {Object.values(accounts).map((account) => (
        <AccountSelectMenuItem
          key={account.uid}
          account={account}
          selected={account.uid === props.selectedAccount?.uid}
          selectAccount={props.selectAccount}
          onPreClick={onClose}
        />
      ))}
      {Object.keys(accounts).length > 0 && <Divider />}
      <MenuItem component={Link} to="/account" onClick={onClose}>
        <Typography variant="button">账号管理</Typography>
      </MenuItem>
    </Menu>
  )
}

interface AccountSelectMenuItemProps {
  account: Account
  selected: boolean
  selectAccount: SettingsFn['selectAccount']
  onPreClick?: React.MouseEventHandler<HTMLElement>
}

function AccountSelectMenuItem (props: AccountSelectMenuItemProps) {
  const handleClick = useCallback<React.MouseEventHandler<HTMLElement>>((evt) => {
    props.onPreClick?.(evt)
    props.selectAccount(props.account.uid)
  }, [props])

  return (
    <MenuItem selected={props.selected} onClick={handleClick}>
      <Box display="inline-flex" flexDirection="column" textAlign="left" overflow="hidden" sx={
        props.selected
          ? { color: (theme) => theme.palette.primary.main }
          : undefined
      }>
        <Typography component="div" variant="body2" noWrap>
          {props.account.displayName || '旅行者'}
        </Typography>
        <Typography component="div" variant="caption" lineHeight={1}>
          {props.account.uid}
        </Typography>
      </Box>
    </MenuItem>
  )
}
