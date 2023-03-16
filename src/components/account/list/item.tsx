import React from 'react'
import { SxProps, Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import SyncIcon from '@mui/icons-material/Sync'
import DeleteIcon from '@mui/icons-material/Delete'
import CommentIcon from '@mui/icons-material/Comment'
import AccountAvatar from '@/components/account/avatar'
import { Account } from '@/interfaces/settings'
import { getNameCardUrl } from '@/interfaces/enka-network'

export interface AccountListItemProps {
  account: Account
  selected: boolean
  onSelect?: React.MouseEventHandler<HTMLButtonElement>
  onPreRefresh?: React.MouseEventHandler<HTMLButtonElement>
  onPreRemove?: React.MouseEventHandler<HTMLButtonElement>
  enkaNetwork?: boolean | null
}

export default function AccountListItem (props: AccountListItemProps) {
  return (
    <ListItem disableGutters>
      <Stack width="100%" flexDirection="row" gap={1}>
        <AccountListItemActionRefresh {...props} />
        <AccountListItemContent {...props} />
        <AccountListItemActionRemove {...props} />
      </Stack>
    </ListItem>
  )
}

function AccountListItemContent (props: AccountListItemProps) {
  const { account, selected, onSelect } = props
  const nameCardUrl = props.enkaNetwork &&
    props.account.nameCardId &&
    getNameCardUrl(props.account.nameCardId)

  return (
    <ListItemButton
      component="button"
      sx={AccountListItemContentSx}
      selected={selected}
      onClick={onSelect}
      value={account.uid}
      data-name-card={nameCardUrl ? 'true' : undefined}
      style={nameCardUrl ? { backgroundImage: `url(${nameCardUrl})` } : undefined}
    >
      <ListItemAvatar>
        <AccountAvatar avatarId={account.avatarId || undefined} />
      </ListItemAvatar>
      <ListItemText
        primary={<>
          <Typography
            component="span"
            bgcolor={selected ? 'primary.light' : 'success.light'}
            color="white"
            borderRadius={4}
            paddingX={1}
          >
            <Typography variant="caption">Lv.{account.level || '?'}</Typography>
          </Typography>
          <Typography component="span" marginLeft={0.5} color="inherit">
            {account.displayName || '旅行者'}
          </Typography>
        </>}
        primaryTypographyProps={{ component: 'div', noWrap: true, color: selected ? 'primary' : 'default' }}
        secondary={account.uid}
        secondaryTypographyProps={{ color: selected ? 'primary' : 'default' }}
        sx={{ maxWidth: 180 }}
      />
      <Typography
        component="div"
        maxWidth={400}
        variant="body2"
        color="grey.600"
        display="inline-flex"
        alignItems="center"
        noWrap
      >
        {account.signature && <>
          <CommentIcon fontSize="inherit" sx={{ marginRight: 1 }} />
          {account.signature}
        </>}
      </Typography>
    </ListItemButton>
  )
}

function AccountListItemActionRefresh (props: AccountListItemProps) {
  const { account, onPreRefresh, enkaNetwork } = props

  return (
    <Tooltip
      title={!enkaNetwork ? '启用 Enka.Network 服务时可用\n详细信息另见：设置 - 账号' : '从 Enka.Network 服务同步账号数据'}
      slotProps={{ tooltip: { sx: { whiteSpace: 'break-spaces' } } }}
      PopperProps={{ modifiers: [{ name: 'offset', options: { offset: [0, -8] } }] }}
      placement="bottom-end"
    >
      <Box sx={{ alignSelf: 'start', marginY: 'auto', cursor: !enkaNetwork ? 'not-allowed' : 'default' }}>
        <IconButton
          size="small"
          color="default"
          value={account.uid}
          onClick={onPreRefresh}
          disabled={!enkaNetwork}
        >
          <SyncIcon />
        </IconButton>
      </Box>
    </Tooltip>
  )
}

function AccountListItemActionRemove (props: AccountListItemProps) {
  const { account, onPreRemove } = props
  return (
    <Tooltip title="删除账号" PopperProps={{ modifiers: [{ name: 'offset', options: { offset: [0, -8] } }] }}>
      <IconButton
        sx={{ alignSelf: 'start', marginY: 'auto' }}
        size="small"
        color="error"
        value={account.uid}
        onClick={onPreRemove}
      >
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  )
}

const AccountListItemContentSx: SxProps<Theme> = {
  bgcolor: 'grey.100',
  borderTopRightRadius: 99,
  borderBottomRightRadius: 99,
  '&:hover': { bgcolor: 'grey.200' },
  '&[data-name-card="true"]': {
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right bottom',
    backgroundSize: 'contain'
  }
}
