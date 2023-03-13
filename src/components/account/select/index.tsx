import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import AccountAvatar from '@/components/account/avatar'
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
          <AccountAvatar avatarId={selectedAccount?.avatarId || undefined} />
          <Box display="inline-flex" flexDirection="column" marginLeft={1} textAlign="left">
            <Box>
              <Typography component="span" bgcolor="primary.light" color="white" borderRadius={4} paddingX={1}>
                <Typography variant="caption">Lv.{selectedAccount?.level || 0}</Typography>
              </Typography>
              <Typography component="span" marginLeft={0.5} textTransform="none" noWrap>
                {selectedAccount?.displayName || '旅行者'}
              </Typography>
            </Box>
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
