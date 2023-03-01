import React, { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import Avatar from '@/components/common/avatar'
import { Account } from '@/interfaces/settings'
import { useStatefulSettings } from '@/hooks/useStatefulSettings'

export default function AccountSelect () {
  const { accounts, selectedAccount } = useStatefulSettings()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => { setAnchorEl(event.currentTarget) }
  const handleClose = () => { setAnchorEl(null) }

  return (
    <>
      <Box onClick={handleClick} display="flex" alignItems="center">
        <Button color="inherit" endIcon={<KeyboardArrowDownIcon />} sx={{ '&:hover': { bgcolor: 'transparent' } }} disableRipple>
          <Avatar />
          <Box display="inline-flex" flexDirection="column" marginLeft={1} textAlign="left">
            <Typography component="div" variant="body2" textTransform="none" noWrap>
              {selectedAccount?.displayName || '旅行者'}
            </Typography>
            <Typography component="div" variant="caption" lineHeight={1}>
              {selectedAccount?.uid || 'NULL UID'}
            </Typography>
          </Box>
        </Button>
      </Box>
      <Menu open={open} onClose={handleClose} anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        MenuListProps={{ sx: { width: 100 } }}
      >
        {Object.values(accounts).map((account) => (
          <AccountSelectItem key={account.uid} account={account}
            onPreClick={handleClose} />
        ))}
        {Object.keys(accounts).length > 0 && <Divider />}
        <MenuItem component={Link} to="/account" onClick={handleClose}>
          <Typography variant="button">账号管理</Typography>
        </MenuItem>
      </Menu>
    </>
  )
}

interface AccountSelectItemProps {
  account: Account
  onPreClick?: () => void
}

function AccountSelectItem (props: AccountSelectItemProps) {
  const { selectedAccount, selectAccount } = useStatefulSettings()
  const isSelected = useMemo(() => props.account.uid === selectedAccount?.uid, [props.account, selectedAccount])

  const handleClick = useCallback(() => {
    props.onPreClick?.()
    selectAccount(props.account.uid)
  }, [selectAccount, props.account])

  return (
    <MenuItem selected={isSelected} onClick={handleClick}>
      <Box display="inline-flex" flexDirection="column" textAlign="left" overflow="hidden" sx={
        isSelected
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
