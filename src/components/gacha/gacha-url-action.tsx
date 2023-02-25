import React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import LinkIcon from '@mui/icons-material/Link'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AddLinkIcon from '@mui/icons-material/AddLink'
import CachedIcon from '@mui/icons-material/Cached'
import { useStatefulSettings } from '@/hooks/useStatefulSettings'

interface Props {
  disabled?: boolean
}

export default function GachaUrlAction (props: Props) {
  const { selectedAccount } = useStatefulSettings()
  return (
    <Box display="inline-flex">
      <TextField variant="outlined" size="small"
        label="祈愿链接" placeholder="祈愿链接"
        value={selectedAccount?.gachaUrl}
        disabled={props.disabled}
        sx={{ maxWidth: 200 }}
        InputProps={{
          readOnly: true,
          sx: { paddingX: 1 },
          startAdornment: (
            <InputAdornment position="start">
              <LinkIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <Stack marginLeft={2} spacing={2} direction="row">
        <Button variant="outlined" color="secondary" size="small"
          startIcon={<AddLinkIcon />}
          disabled={props.disabled}
        >
          读取链接
        </Button>
        <Button variant="outlined" color="primary" size="small"
          startIcon={<CachedIcon />}
          disabled={props.disabled}
        >
          更新祈愿
        </Button>
      </Stack>
    </Box>
  )
}
