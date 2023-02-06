import React from 'react'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import { useStatefulAccounts } from '../../hooks/accounts'

export default function AddAccount () {
  const { addAccount } = useStatefulAccounts()
  return (
    <>
      <Button variant="outlined" size="small" startIcon={<AddIcon />}>添加账号</Button>
    </>
  )
}
