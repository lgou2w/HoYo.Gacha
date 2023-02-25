import React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import SaveAltIcon from '@mui/icons-material/SaveAlt'

interface Props {
  disabled?: boolean
}

export default function GachaExtAction (props: Props) {
  return (
    <Box display="inline-flex" marginLeft={2}>
      <Stack spacing={1} direction="row">
        <IconButton sx={{ bgcolor: (theme) => theme.palette.action.hover }} disabled={props.disabled}>
          <FileUploadIcon />
        </IconButton>
        <IconButton sx={{ bgcolor: (theme) => theme.palette.action.hover }} disabled={props.disabled}>
          <SaveAltIcon />
        </IconButton>
      </Stack>
    </Box>
  )
}
