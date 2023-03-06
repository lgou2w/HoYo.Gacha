import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import Avatar from '@/components/common/avatar'
import AccountSelectMenu from './menu'
import useStatefulSettings from '@/hooks/useStatefulSettings'

export default function AccountSelect () {
  const { accounts, selectedAccount, selectAccount } = useStatefulSettings()
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
      <AccountSelectMenu
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        accounts={accounts}
        selectedAccount={selectedAccount}
        selectAccount={selectAccount}
      />
    </>
  )
}
