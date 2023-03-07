import React from 'react'
import MuiAlert, { AlertProps } from '@mui/material/Alert'

export interface GachaAlertProps {
  data?: {
    severity: 'success' | 'error'
    message: string
  }
  onClose?: AlertProps['onClose']
}

export default function GachaAlert (props: GachaAlertProps) {
  const { data, onClose } = props
  if (!data) {
    return null
  }

  return (
    <MuiAlert severity={data?.severity} onClose={onClose}>
      {data?.message}
    </MuiAlert>
  )
}
