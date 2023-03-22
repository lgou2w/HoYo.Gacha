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
  PaperProps?: DialogProps['PaperProps']
  ContentProps?: DialogContentProps
  CancelButtonProps?: Omit<ButtonProps, 'onClick'>
  ConfirmButtonProps?: Omit<ButtonProps, 'onClick'>
}

export default function ConfirmDialog (props: PropsWithChildren<ConfirmDialogProps>) {
  const {
    open, persistent, maxWidth, fullWidth, title, onCancel, onConfirm,
    PaperProps, ContentProps, CancelButtonProps, ConfirmButtonProps,
    children
  } = props

  const { children: CancelButtonNode, ...restCancelButtonProps } = CancelButtonProps || {}
  const { children: ConfirmButtonNode, ...restConfirmButtonProps } = ConfirmButtonProps || {}

  return (
    <Dialog open={open}
      onClose={!persistent ? onCancel : undefined}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={PaperProps}
      disableEscapeKeyDown
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent {...ContentProps}>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel} {...restCancelButtonProps}>{CancelButtonNode || '取消'}</Button>
        <Button onClick={onConfirm} {...restConfirmButtonProps}>{ConfirmButtonNode || '确认'}</Button>
      </DialogActions>
    </Dialog>
  )
}
