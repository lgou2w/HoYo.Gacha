import React, { PropsWithChildren } from 'react'
import Dialog, { DialogProps } from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent, { DialogContentProps } from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button, { ButtonProps } from '@mui/material/Button'

export interface ConfirmDialogProps {
  open: boolean
  maxWidth?: DialogProps['maxWidth']
  fullWidth?: boolean
  persistent?: boolean
  title?: React.ReactNode
  onCancel?: React.MouseEventHandler<HTMLButtonElement>
  onConfirm?: React.MouseEventHandler<HTMLButtonElement>
  ContentProps?: DialogContentProps
  CancelButtonProps?: Omit<ButtonProps, 'onClick'>
  ConfirmButtonProps?: Omit<ButtonProps, 'onClick'>
}

export default function ConfirmDialog (props: PropsWithChildren<ConfirmDialogProps>) {
  return (
    <Dialog open={props.open}
      onClose={!props.persistent ? props.onCancel : undefined}
      maxWidth={props.maxWidth}
      fullWidth={props.fullWidth}
      disableEscapeKeyDown
    >
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent {...props.ContentProps}>{props.children}</DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel} {...props.CancelButtonProps}>取消</Button>
        <Button onClick={props.onConfirm} {...props.ConfirmButtonProps}>确认</Button>
      </DialogActions>
    </Dialog>
  )
}
