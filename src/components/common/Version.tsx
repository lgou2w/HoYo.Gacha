import React from 'react'
import { CurrentVersion, useVersion } from '@/components/common/useVersion'
import Typography, { TypographyProps } from '@mui/material/Typography'
import dayjs from '@/utilities/dayjs'

export default function Version (props: TypographyProps) {
  const version = useVersion()

  return (
    <Typography component="span" {...props}>
      {version.data ? formatVersion(version.data) : __APP_VERSION__}
    </Typography>
  );
}

function formatVersion (version: CurrentVersion): string {
  const date = dayjs(version.date)
  const ymd = date.format('YYYY-MM-DD')
  const fromNow = date.fromNow()

  return version.commit_tag
    ? `v${version.commit_tag} (${ymd}, ${fromNow})`
    : `v${version.version}-${version.commit_hash} (${ymd}, ${fromNow})`
}
