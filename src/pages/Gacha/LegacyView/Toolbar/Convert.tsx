import React from 'react'
import { Button, Label, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowDownloadRegular, ArrowUploadRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
})

export default function GachaLegacyViewToolbarConvert () {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <Label size="small">Import</Label>
        <Button
          icon={<ArrowDownloadRegular />}
          appearance="subtle"
          shape="circular"
          size="large"
        />
      </div>
      <div className={classes.content}>
        <Label size="small">Export</Label>
        <Button
          icon={<ArrowUploadRegular />}
          appearance="subtle"
          shape="circular"
          size="large"
        />
      </div>
    </div>
  )
}
