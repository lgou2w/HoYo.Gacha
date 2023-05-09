import React from 'react'
import Stack from '@mui/material/Stack'
import { AccountFacet } from '@/interfaces/account'
import AccountAvatar from '@/components/account/AccountAvatar'

export interface AccountMenuProps {
  facet: AccountFacet
}

// TODO: account menu
export default function AccountMenu (props: AccountMenuProps) {
  return (
    <Stack>
      <AccountAvatar facet={props.facet} />
    </Stack>
  )
}
