import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/common/confirm-dialog'
import { Account } from '@/interfaces/settings'

export interface AccountListRemoveDialogProps extends Pick<
  ConfirmDialogProps,
  'open' |
  'onCancel' |
  'onConfirm'
> {
  accountRef: React.MutableRefObject<Account | undefined>
}

export default function AccountListRemoveDialog (props: AccountListRemoveDialogProps) {
  return (
    <ConfirmDialog
      open={props.open}
      title="确认"
      onCancel={props.onCancel}
      onConfirm={props.onConfirm}
      ConfirmButtonProps={{ color: 'error' }}
    >
      <Box>
        <Typography component="span">确认删除该账号：</Typography>
        <Typography component="span" color="red" variant="subtitle1" letterSpacing={0.8}>
          {props.accountRef?.current?.uid}
        </Typography>
      </Box>
      <Typography>该操作不会清空此账号下已保存的祈愿数据！</Typography>
    </ConfirmDialog>
  )
}
