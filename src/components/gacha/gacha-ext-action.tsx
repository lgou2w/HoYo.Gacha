import React, { useCallback } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import SaveAltIcon from '@mui/icons-material/SaveAlt'
import { Account } from '@/interfaces/settings'
import Commands from '@/utilities/commands'

interface Props {
  account: Account
  disabled?: boolean
}

export default function GachaExtAction (props: Props) {
  const handleExportGachaLogs = useCallback(() => {
    // TODO: export
    // Commands.exportGachaLogsByUID({
    //   uid: props.account.uid,
    //   directory: 'D:/genshin-gacha',
    //   uigf: true
    // })
  }, [props])

  return (
    <Box display="inline-flex" marginLeft={2}>
      <Stack spacing={1} direction="row">
        <IconButton
          disabled={props.disabled}
          sx={{ bgcolor: (theme) => theme.palette.action.hover }}
        >
          <FileUploadIcon />
        </IconButton>
        <IconButton
          onClick={handleExportGachaLogs}
          disabled={props.disabled}
          sx={{ bgcolor: (theme) => theme.palette.action.hover }}
        >
          <SaveAltIcon />
        </IconButton>
      </Stack>
    </Box>
  )
}
