import React from 'react'
import { resolveAccountDisplayName } from '@/interfaces/account'
import { useStatefulAccountContext } from '@/hooks/useStatefulAccount'
import AccountAvatar from '@/components/account/AccountAvatar'
import AccountMenuDrawer from '@/components/account/AccountMenuDrawer'
import AccountMenuDialog from '@/components/account/AccountMenuDialog'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

export default function AccountMenu () {
  const { facet, accounts, selectedAccountUid } = useStatefulAccountContext()
  const selectedAccount = selectedAccountUid ? accounts[selectedAccountUid] : null
  const displayName = resolveAccountDisplayName(facet, selectedAccount)

  // TODO: immer
  const [drawer, setDrawer] = React.useState(false)
  const [dialog, setDialog] = React.useState(false)
  const openDrawer = () => setDrawer(true)
  const closeDrawer = () => setDrawer(false)
  const openDialog = () => setDialog(true)
  const closeDialog = () => setDialog(false)

  return (
    <React.Fragment>
      <Button onClick={openDrawer}>
        <AccountAvatar facet={facet} />
        <Stack direction="column" marginX={1} textAlign="left">
          <Typography variant="body2" gutterBottom>
            {displayName}
          </Typography>
          <Typography variant="caption" lineHeight={1} textTransform="none">
            {selectedAccount?.uid || 'NULL UID'}
          </Typography>
        </Stack>
      </Button>
      <AccountMenuDrawer
        title="账号管理"
        open={drawer}
        accounts={accounts}
        selectedAccountUid={selectedAccountUid}
        onClose={closeDrawer}
        onClickAddAccount={openDialog}
        // TODO: onClickEditAccount={openDialog}
      />
      <AccountMenuDialog
        open={dialog}
        facet={facet}
        accounts={accounts}
        onClose={closeDialog}
      />
    </React.Fragment>
  )
}
